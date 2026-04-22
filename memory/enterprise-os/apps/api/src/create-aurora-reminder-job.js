const { createAuroraJob } = require('./deo-db');

function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = true;
      continue;
    }
    out[key] = next;
    i += 1;
  }
  return out;
}

function parseReminder(text) {
  const raw = String(text || '').trim();
  const t = normalize(raw);
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

(async () => {
  try {
    const args = parseArgs(process.argv);
    const text = args.text || '';
    const userId = args.user || 'vincent-zalo';
    if (!text) throw new Error('Missing --text');

    const reminder = parseReminder(text);
    if (!reminder.dueIso) {
      throw new Error('Could not parse a concrete reminder time from --text');
    }

    const job = await createAuroraJob({
      jobType: 'reminder_create',
      createdBy: userId,
      dueAt: reminder.dueIso,
      payload: {
        source_channel: 'zalo',
        source_user_id: userId,
        message_text: text,
        capability: 'calendar',
        reminder_task: reminder.task,
        reminder_due_iso: reminder.dueIso,
        reminder_due_label: reminder.dueLabel,
        delivery_policy: 'calendar-or-cron-only',
        confirmation_mode: 'approved-by-user',
      },
      tags: ['aurora', 'zalo', 'reminder_create', 'confirmed'],
      metadata: {
        surface: 'zalo',
        actor: 'aurora',
        approvedByUser: true,
        approvedAt: new Date().toISOString(),
        source: 'create-aurora-reminder-job.js'
      }
    });

    console.log(JSON.stringify({ ok: true, job, reminder }, null, 2));
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
})();
