const http = require('http');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { createAuroraJob, listAuroraJobs } = require('./deo-db');

const port = process.env.PORT || 3001;
const ZALO_BOT_TOKEN = process.env.ZALO_BOT_TOKEN || '';
const ZALO_WEBHOOK_SECRET = process.env.ZALO_WEBHOOK_SECRET || '';
const ZALO_SEND_MODE = process.env.ZALO_SEND_MODE || 'log'; // log | disabled
const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.resolve(__dirname, '..', '..', '..', '..');
const STATE_DIR = path.join(WORKSPACE_ROOT, 'enterprise-os', 'apps', 'api', 'data');
const PENDING_CONFIRMATIONS_FILE = path.join(STATE_DIR, 'aurora-pending-confirmations.json');

function ensureStateDir() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function normalize(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function readPendingConfirmations() {
  ensureStateDir();
  if (!fs.existsSync(PENDING_CONFIRMATIONS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(PENDING_CONFIRMATIONS_FILE, 'utf8')) || {};
  } catch {
    return {};
  }
}

function writePendingConfirmations(data) {
  ensureStateDir();
  fs.writeFileSync(PENDING_CONFIRMATIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function setPendingConfirmation(userId, draft) {
  const all = readPendingConfirmations();
  all[userId] = { ...draft, savedAt: new Date().toISOString() };
  writePendingConfirmations(all);
  return all[userId];
}

function getPendingConfirmation(userId) {
  const all = readPendingConfirmations();
  return all[userId] || null;
}

function clearPendingConfirmation(userId) {
  const all = readPendingConfirmations();
  delete all[userId];
  writePendingConfirmations(all);
}

function isConfirmText(text = '') {
  const t = normalize(text);
  return ['ok', 'oke', 'oke em', 'ok em', 'ok nha', 'ok nhe', 'dong y', 'xac nhan', 'duoc', 'lam di', 'trien di'].includes(t);
}

function isRejectText(text = '') {
  const t = normalize(text);
  return ['khong', 'k', 'chua', 'khoan', 'thoi', 'huy', 'sua lai'].includes(t);
}

function detectIntent(text = '', envelope = {}) {
  const t = normalize(text);
  if (!t) return 'fallback';
  if (isConfirmText(t) && getPendingConfirmation(envelope.userId || '')) return 'confirm_pending';
  if (isRejectText(t) && getPendingConfirmation(envelope.userId || '')) return 'reject_pending';
  if (t.startsWith('nhac ') || t.includes('nhac anh') || t.includes('nhac em')) return 'reminder_create';
  if (t.includes('hom nay co gi') || t.includes('lich hom nay') || t.includes('lich mai') || t.includes('nhac viec hom nay')) return 'agenda_query';
  if (t.startsWith('ghi chu') || t.startsWith('ghi nho') || t.includes('nho la')) return 'note_capture';
  if (t.includes('chi bao nhieu') || t.includes('con no gi') || t.includes('tuan truoc') || t.includes('thang nay')) return 'finance_query';
  if (t.includes('email') || t.includes('gmail') || t.includes('thu')) return 'email_assist';
  if (t.includes('lich hop') || t.includes('calendar') || t.includes('lich lam viec')) return 'calendar_assist';
  if (t.includes('sheet') || t.includes('bang tinh') || t.includes('google sheets')) return 'sheets_assist';
  if (t.includes('drive') || t.includes('folder') || t.includes('tai lieu')) return 'drive_assist';
  if (t.includes('doc') || t.includes('van ban')) return 'docs_assist';
  if (t.includes('ban do') || t.includes('maps') || t.includes('duong di')) return 'maps_assist';
  if (/(\d+\s?k|\d+[\.,]\d{3})/.test(t) || t.includes('an sang') || t.includes('do xang') || t.includes('chuyen khoan')) return 'expense_capture';
  if (t.includes('dat ve') || t.includes('khach san') || t.includes('nha hang') || t.includes('dat ban')) return 'booking_prep';
  return 'fallback';
}

function softReply(intent) {
  switch (intent) {
    case 'reminder_create':
      return 'Dạ em nhận nhắc việc này rồi nha. Em sẽ soạn lịch cụ thể cho anh duyệt trước.';
    case 'agenda_query':
      return 'Dạ để em gom lịch và các việc cần để ý trong ngày cho anh nha.';
    case 'note_capture':
      return 'Dạ em đã nhận ghi chú này rồi, em sẽ lưu lại để không bị sót nha.';
    case 'finance_query':
      return 'Dạ để em kiểm tra lại sổ Personal Finance OS rồi báo anh gọn lẹ nha.';
    case 'expense_capture':
      return 'Dạ em nhận khoản chi/thu này rồi. Em sẽ đưa qua luồng ghi nhận chi tiêu trước để anh dễ kiểm tra nha.';
    case 'booking_prep':
      return 'Dạ em sẽ chuẩn bị phương án vé/khách sạn/nhà hàng cho anh trước, rồi mình chốt sau nha.';
    default:
      return 'Dạ em đang nghe anh nè. Anh cứ nhắn việc cần em lo, em sẽ sắp lại gọn cho anh nha.';
  }
}

function extractEnvelope(payload = {}) {
  const textCandidates = [
    payload.text,
    payload.message,
    payload.content,
    payload.body,
    payload.data?.text,
    payload.data?.message,
    payload.event_data?.text,
    payload.event_data?.message,
    payload.sender?.message,
  ].filter(Boolean);

  const userId = payload.user_id || payload.sender_id || payload.from || payload.data?.user_id || payload.sender?.id || '';
  const text = textCandidates[0] || '';
  return { userId, text, raw: payload };
}

function runPython(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(WORKSPACE_ROOT, scriptName);
    execFile('python', [scriptPath, ...args], { cwd: WORKSPACE_ROOT, timeout: 120000 }, (error, stdout, stderr) => {
      if (error) {
        return reject(new Error(stderr || error.message));
      }
      resolve((stdout || '').trim());
    });
  });
}

function parseReminder(text) {
  const raw = String(text || '').trim();
  const t = normalize(text);
  let dueLabel = 'chưa rõ giờ';
  let dueIso = null;
  const now = new Date();
  const d = new Date(now);

  const hm = t.match(/(\d{1,2})[:h]\s*(\d{1,2})/);
  const hmp = t.match(/(\d{1,2})\s*(?:gio|h)\s*(\d{1,2})\s*(?:phut|p)/);
  const hourOnly = t.match(/(?:luc|vao|tu)?\s*(\d{1,2})\s*(?:gio|h)\b/);

  let hour = null;
  let minute = 0;
  if (hm) {
    hour = Number(hm[1]);
    minute = Number(hm[2]);
  } else if (hmp) {
    hour = Number(hmp[1]);
    minute = Number(hmp[2]);
  } else if (hourOnly) {
    hour = Number(hourOnly[1]);
  }

  const isTomorrow = t.includes('mai') || t.includes('ngay mai');
  const isAfternoon = /\b(chieu|buoi chieu)\b/.test(t);
  const isEvening = /\b(toi|buoi toi|dem)\b/.test(t);
  const isMorning = /\b(sang|buoi sang)\b/.test(t);

  if (isTomorrow) d.setDate(d.getDate() + 1);
  if (hour !== null) {
    if ((isAfternoon || isEvening) && hour >= 1 && hour <= 11) hour += 12;
    if (isMorning && hour === 12) hour = 0;
    d.setHours(hour, minute, 0, 0);
    dueIso = d.toISOString();
    dueLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${isTomorrow ? 'ngày mai' : 'hôm nay'}`;
  }

  let task = raw.replace(/^nhắc\s*/i, '').trim();
  task = task.replace(/^(anh|em|toi|tôi)\s*/i, '').trim();
  task = task.replace(/\b(lúc|luc|vào|vao|từ|tu)\b\s*\d{1,2}(?:(:|h)\d{1,2})?(?:\s*(giờ|gio|phút|phut|p))?.*$/i, '').trim() || task;
  task = task.replace(/\s+/g, ' ').trim();

  return { task, dueIso, dueLabel };
}

function buildReminderDraft(text) {
  const parsed = parseReminder(text);
  const cleanTask = parsed.task || 'việc này';
  return {
    type: 'reminder_create',
    sourceText: text,
    reminder_task: cleanTask,
    reminder_due_iso: parsed.dueIso,
    reminder_due_label: parsed.dueLabel,
    account: 'vucaotung@gmail.com',
    capability: 'calendar',
  };
}

function formatReminderDraftReply(draft) {
  return [
    `Dạ em đang hiểu là:`,
    `- Việc: ${draft.reminder_task || 'chưa rõ'}`,
    `- Giờ: ${draft.reminder_due_label || 'chưa rõ giờ'}`,
    `- Calendar: ${draft.account}`,
    '',
    `Nếu đúng thì anh trả lời đúng 1 chữ **ok** là em đưa vào calendar và giữ luồng nhắc việc luôn nha.`
  ].join('\n');
}

async function enqueueAuroraCapability(jobType, envelope, extra = {}) {
  return createAuroraJob({
    jobType,
    createdBy: envelope.userId || 'vincent-zalo',
    payload: {
      source_channel: 'zalo',
      source_user_id: envelope.userId || '',
      message_text: envelope.text || '',
      ...extra,
    },
    tags: ['aurora', 'zalo', jobType],
    metadata: {
      surface: 'zalo',
      actor: 'aurora',
    },
  });
}

async function executeIntent(intent, envelope) {
  const incoming = envelope.text || '';
  switch (intent) {
    case 'confirm_pending': {
      const pending = getPendingConfirmation(envelope.userId || '');
      if (!pending) {
        return { ok: true, action: 'confirm_missing', replyText: 'Dạ em chưa thấy draft nào đang chờ anh gật hết nha.' };
      }
      const job = await createAuroraJob({
        jobType: pending.type || 'reminder_create',
        createdBy: envelope.userId || 'vincent-zalo',
        dueAt: pending.reminder_due_iso || null,
        payload: {
          source_channel: 'zalo',
          source_user_id: envelope.userId || '',
          message_text: pending.sourceText || incoming,
          capability: 'calendar',
          reminder_task: pending.reminder_task,
          reminder_due_iso: pending.reminder_due_iso,
          reminder_due_label: pending.reminder_due_label,
          delivery_policy: 'calendar-or-cron-only',
          confirmation_mode: 'approved-by-user',
        },
        tags: ['aurora', 'zalo', pending.type || 'reminder_create', 'confirmed'],
        metadata: { surface: 'zalo', actor: 'aurora', approvedByUser: true, approvedAt: new Date().toISOString() }
      });
      clearPendingConfirmation(envelope.userId || '');
      return {
        ok: true,
        action: 'pending_confirmed_and_queued',
        job,
        replyText: `Dạ ok anh. Em đã đưa lịch này vào queue tạo calendar rồi nha. Mã việc: ${job.id}. Nếu parse ổn thì event sẽ tự vào Google Calendar của anh.`
      };
    }
    case 'reject_pending': {
      clearPendingConfirmation(envelope.userId || '');
      return { ok: true, action: 'pending_rejected', replyText: 'Dạ em bỏ draft vừa rồi rồi nha. Anh sửa lại câu nhắc giúp em một phát là em soạn lại ngay.' };
    }
    case 'note_capture': {
      const clean = incoming.replace(/^ghi\s*chu\s*:?/i, '').replace(/^ghi\s*nho\s*:?/i, '').trim();
      const job = await enqueueAuroraCapability('note_capture', envelope, {
        capability: 'note',
        note_text: clean || incoming,
        storage_policy: 'task-queue-only',
      });
      return { ok: true, action: 'note_job_queued', job, replyText: `Dạ em đã đưa ghi chú này vào task queue rồi nha anh. Mã việc là ${job.id}.` };
    }
    case 'reminder_create': {
      const draft = buildReminderDraft(incoming);
      setPendingConfirmation(envelope.userId || 'unknown', draft);
      return { ok: true, action: 'reminder_draft_created', draft, replyText: formatReminderDraftReply(draft) };
    }
    case 'expense_capture': {
      const stdout = await runPython('pf_intake_to_quick_entry.py', ['--text', incoming, '--commit']);
      const parsed = JSON.parse(stdout);
      const c = parsed.candidate || {};
      if (parsed.needs_user_text) {
        return {
          ok: true,
          action: 'expense_needs_user_text',
          result: parsed,
          replyText: 'Dạ em chưa đọc ra đủ dữ liệu để ghi sổ an toàn nha. Anh gửi em 1 dòng text ngắn kiểu số tiền, ngày giờ, tài khoản và nội dung là em đi sổ liền.'
        };
      }
      return {
        ok: true,
        action: 'expense_captured',
        result: parsed,
        replyText: `Dạ em đã đưa khoản này vào Quick Entry rồi nha. Em đang hiểu là ${c.type || 'giao dịch'} ${c.amount || ''} VND${c.category_name ? `, danh mục ${c.category_name}` : ''}${c.source_account_name ? `, từ ${c.source_account_name}` : ''}. Hiện nó đang ở Quick Entry, chưa tự nhận là đã vào sổ chính đâu nha.`
      };
    }
    case 'finance_query': {
      const t = normalize(incoming);
      if (t.includes('no')) {
        const out = await runPython('pf_debt_scan.py');
        return { ok: true, action: 'finance_debt_query', replyText: out === 'NO_ALERT' ? 'Dạ hiện em chưa thấy khoản nợ nào cần báo gấp nha.' : out };
      }
      if (t.includes('tuan')) {
        const out = await runPython('pf_weekly_digest.py');
        return { ok: true, action: 'finance_weekly_query', replyText: out };
      }
      const overview = JSON.parse(await runPython('pf_month_overview.py'));
      const report = JSON.parse(await runPython('pf_report_summary.py'));
      const topCats = (report.top_categories || []).slice(0, 3).map(x => `- ${x.category}: ${x.amount} VND`).join('\n');
      const recent = (report.recent_transactions || []).slice(0, 3).map(x => `- ${x.date} | ${x.label}: ${x.amount} VND`).join('\n');
      return {
        ok: true,
        action: 'finance_month_query',
        replyText: `Dạ em tóm tắt tháng này cho anh nè:\n- Thu: ${overview['Income This Month'] || 0} VND\n- Chi: ${overview['Expense This Month'] || 0} VND\n- Net: ${overview['Net Cashflow'] || 0} VND\n- Tổng số dư hiện tại: ${overview['Total Current Balance'] || 0} VND\n- Tổng nợ còn lại: ${overview['Total Remaining Debt'] || 0} VND${topCats ? `\n- Top danh mục chi:\n${topCats}` : ''}${recent ? `\n- Giao dịch gần nhất:\n${recent}` : ''}`
      };
    }
    case 'email_assist': {
      const job = await enqueueAuroraCapability('gmail_assist', envelope, { capability: 'gmail', account: 'vucaotung@gmail.com' });
      return { ok: true, action: 'email_job_queued', job, replyText: `Dạ em đã ghi nhận việc email cho anh rồi nha. Em xếp vào queue của Aurora với mã ${job.id}.` };
    }
    case 'calendar_assist': {
      const draft = buildReminderDraft(incoming);
      setPendingConfirmation(envelope.userId || 'unknown', draft);
      return { ok: true, action: 'calendar_draft_created', draft, replyText: formatReminderDraftReply(draft) };
    }
    case 'sheets_assist': {
      const job = await enqueueAuroraCapability('sheets_assist', envelope, { capability: 'sheets', account: 'vucaotung@gmail.com' });
      return { ok: true, action: 'sheets_job_queued', job, replyText: `Dạ em đã đưa việc Google Sheets vào queue cho Aurora rồi nha. Mã việc là ${job.id}.` };
    }
    case 'drive_assist': {
      const job = await enqueueAuroraCapability('drive_assist', envelope, { capability: 'drive', account: 'vucaotung@gmail.com' });
      return { ok: true, action: 'drive_job_queued', job, replyText: `Dạ em đã đưa việc Drive/tài liệu vào queue cho Aurora rồi nha. Mã việc là ${job.id}.` };
    }
    case 'docs_assist': {
      const job = await enqueueAuroraCapability('docs_assist', envelope, { capability: 'docs', account: 'vucaotung@gmail.com' });
      return { ok: true, action: 'docs_job_queued', job, replyText: `Dạ em đã ghi nhận việc Docs/văn bản rồi nha. Em cho vào queue với mã ${job.id}.` };
    }
    case 'maps_assist': {
      const job = await enqueueAuroraCapability('maps_assist', envelope, { capability: 'maps', account: 'vucaotung@gmail.com' });
      return { ok: true, action: 'maps_job_queued', job, replyText: `Dạ em đã nhận việc đường đi/bản đồ rồi nha. Em cho vào queue với mã ${job.id}.` };
    }
    case 'agenda_query': {
      const jobs = await listAuroraJobs(10, { status: 'pending', jobType: 'reminder_create' });
      if (!jobs.length) {
        return { ok: true, action: 'agenda_summary', replyText: 'Dạ hiện em chưa thấy yêu cầu nhắc việc nào đang chờ xử lý hết nha.' };
      }
      const lines = jobs.slice(0, 5).map((j, i) => {
        const label = j.payload?.reminder_due_label || j.payload?.reminder_due_iso || 'chưa rõ giờ';
        const task = j.payload?.reminder_task || j.payload?.message_text || j.job_type;
        return `${i + 1}. ${task} — ${label}`;
      });
      return { ok: true, action: 'agenda_summary', replyText: `Dạ hiện em thấy mấy yêu cầu nhắc việc đang chờ xử lý nè:\n${lines.join('\n')}` };
    }
    case 'booking_prep': {
      return { ok: true, action: 'booking_prep_stub', replyText: 'Dạ em nhận nhu cầu booking rồi nha. Ở bước này em sẽ chuẩn bị option trước, rồi anh chốt em mới đi tiếp.' };
    }
    default:
      return { ok: true, action: 'fallback', replyText: softReply(intent) };
  }
}

async function sendZaloReply({ userId, text, intent, execution }) {
  const packet = {
    userId,
    intent,
    incomingText: text,
    replyDraft: execution?.replyText || softReply(intent),
    sendMode: ZALO_SEND_MODE,
    tokenConfigured: Boolean(ZALO_BOT_TOKEN),
    execution,
  };

  console.log('[zalo-reply-draft]', JSON.stringify(packet, null, 2));
  return packet;
}

async function handleZaloWebhook(req, res) {
  try {
    const bodyText = await readBody(req);
    const payload = bodyText ? JSON.parse(bodyText) : {};
    const secret = req.headers['x-zalo-secret'] || req.headers['x-webhook-secret'] || '';

    if (ZALO_WEBHOOK_SECRET && secret !== ZALO_WEBHOOK_SECRET) {
      return json(res, 401, { ok: false, error: 'invalid_webhook_secret' });
    }

    const envelope = extractEnvelope(payload);
    const intent = detectIntent(envelope.text, envelope);
    const execution = await executeIntent(intent, envelope);
    const reply = await sendZaloReply({ userId: envelope.userId, text: envelope.text, intent, execution });

    return json(res, 200, {
      ok: true,
      service: 'deo-enterprise-api',
      route: 'zalo-webhook',
      intent,
      extracted: {
        userId: envelope.userId,
        text: envelope.text,
      },
      execution,
      reply,
      note: 'A14.3+ reminder confirmation flow: webhook + draft confirmation + queue executor bridge',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return json(res, 500, {
      ok: false,
      error: error.message,
      route: 'zalo-webhook',
      timestamp: new Date().toISOString(),
    });
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `localhost:${port}`}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, {
      service: 'deo-enterprise-api',
      ok: true,
      workspaceRoot: WORKSPACE_ROOT,
      zalo: {
        tokenConfigured: Boolean(ZALO_BOT_TOKEN),
        webhookSecretConfigured: Boolean(ZALO_WEBHOOK_SECRET),
        sendMode: ZALO_SEND_MODE,
      },
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === 'GET' && url.pathname === '/zalo/webhook') {
    return json(res, 200, {
      ok: true,
      route: '/zalo/webhook',
      purpose: 'Zalo webhook skeleton is alive',
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === 'POST' && url.pathname === '/zalo/webhook') {
    return handleZaloWebhook(req, res);
  }

  if (req.method === 'GET' && url.pathname === '/api/aurora/jobs') {
    const jobs = await listAuroraJobs(Number(url.searchParams.get('limit') || 20));
    return json(res, 200, { ok: true, jobs, count: jobs.length, timestamp: new Date().toISOString() });
  }

  if (req.method === 'POST' && url.pathname === '/api/aurora/jobs') {
    try {
      const bodyText = await readBody(req);
      const payload = bodyText ? JSON.parse(bodyText) : {};
      const job = await createAuroraJob({
        jobType: payload.job_type || 'generic_assist',
        createdBy: payload.created_by || 'api',
        payload: payload.payload || {},
        priority: payload.priority || 5,
        dueAt: payload.due_at || null,
        tags: payload.tags || [],
        metadata: payload.metadata || {},
        companyId: payload.company_id || null,
        projectId: payload.project_id || null,
      });
      return json(res, 201, { ok: true, job, timestamp: new Date().toISOString() });
    } catch (error) {
      return json(res, 500, { ok: false, error: error.message, route: '/api/aurora/jobs', timestamp: new Date().toISOString() });
    }
  }

  return json(res, 404, {
    ok: false,
    error: 'not_found',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString(),
  });
});

server.listen(port, () => {
  console.log(`API listening on ${port}`);
  console.log(`Health: http://localhost:${port}/health`);
  console.log(`Zalo webhook: http://localhost:${port}/zalo/webhook`);
});
