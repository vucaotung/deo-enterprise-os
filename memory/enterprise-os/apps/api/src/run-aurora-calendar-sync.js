const { execFileSync } = require('child_process');
const path = require('path');
const { listAuroraJobs, runPsql } = require('./deo-db');

const ACCOUNT = 'vucaotung@gmail.com';
const CALENDAR_ID = 'primary';
const TZ = 'Asia/Bangkok';
const DEFAULT_OFFSET = '+07:00';

function runGog(args) {
  const gogPath = path.join(process.cwd(), 'gog.exe');
  const out = execFileSync(gogPath, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(out || '{}');
}

function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

function escapeSql(v) {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function fmtLocal(d) {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d).reduce((acc, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${DEFAULT_OFFSET}`;
}

function plusMinutes(iso, minutes) {
  const d = new Date(iso);
  return new Date(d.getTime() + minutes * 60000).toISOString();
}

function stripLeadingReminderWords(text = '') {
  let s = String(text).trim();
  s = s.replace(/^nh[aă]c\s*/i, '').trim();
  s = s.replace(/^(anh|em|toi|t[ôo]i)\s*/i, '').trim();
  return s;
}

function detectLocation(text = '') {
  const raw = String(text).trim();
  const patterns = [
    /(?:\bở\b|\btai\b)\s+(.+?)(?=\s+(?:l[uú]c|v[aà]o|t[uừ]|ng[aà]y|mai|h[oô]m nay|trong|k[eé]o d[aà]i|duration|deadline)\b|$)/i,
    /(?:\bvp\b\s*[^,.;\n]+)$/i,
    /(?:\bv[aă]n ph[oò]ng\b\s*[^,.;\n]+)$/i,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match) {
      return (match[1] || match[0] || '').trim().replace(/[,.]$/, '');
    }
  }
  return '';
}

function detectDurationMinutes(text = '', title = '') {
  const t = normalize(`${text} ${title}`);

  const explicitHourMinute = t.match(/(?:keo dai|duration|trong vong|trong)\s*(\d{1,2})\s*(?:gio|h)\s*(\d{1,2})\s*(?:phut|p)?/);
  if (explicitHourMinute) return Number(explicitHourMinute[1]) * 60 + Number(explicitHourMinute[2]);

  const explicitHours = t.match(/(?:keo dai|duration|trong vong|trong)\s*(\d+(?:[\.,]\d+)?)\s*(?:gio|tieng)\b/);
  if (explicitHours) return Math.max(15, Math.round(Number(explicitHours[1].replace(',', '.')) * 60));

  const explicitMinutes = t.match(/(?:keo dai|duration|trong vong|trong)\s*(\d{1,3})\s*(?:phut|p)\b/);
  if (explicitMinutes) return Math.max(5, Number(explicitMinutes[1]));

  if (/ca ngay|all day|all-day/.test(t)) return 24 * 60;
  if (/an trua|ca phe|coffee|uong ca phe/.test(t)) return 60;
  if (/gap|hen gap|hop|meeting|lam viec/.test(t)) return 60;
  if (/di san bay|ra san bay|bay/.test(t)) return 120;

  return 60;
}

function detectAllDay(text = '', title = '') {
  const t = normalize(`${text} ${title}`);
  return /ca ngay|all day|all-day/.test(t);
}

function parseDateContext(text = '') {
  const t = normalize(text);
  const now = new Date();
  const base = new Date(now);

  if (t.includes('ngay mai') || t.includes('mai')) {
    base.setDate(base.getDate() + 1);
    return base;
  }

  const weekdays = {
    'chu nhat': 0,
    'cn': 0,
    'thu 2': 1,
    'thu hai': 1,
    'thu 3': 2,
    'thu ba': 2,
    'thu 4': 3,
    'thu tu': 3,
    'thu 5': 4,
    'thu nam': 4,
    'thu 6': 5,
    'thu sau': 5,
    'thu 7': 6,
    'thu bay': 6,
  };

  for (const [label, day] of Object.entries(weekdays)) {
    if (t.includes(label)) {
      const currentDay = base.getDay();
      let delta = (day - currentDay + 7) % 7;
      if (delta === 0) delta = 7;
      base.setDate(base.getDate() + delta);
      return base;
    }
  }

  const dm = t.match(/ngay\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (dm) {
    const day = Number(dm[1]);
    const month = Number(dm[2]) - 1;
    const year = dm[3] ? Number(dm[3]) : base.getFullYear();
    base.setFullYear(year, month, day);
    return base;
  }

  return base;
}

function parseTimeParts(text = '') {
  const t = normalize(text);
  const isAfternoon = /\b(chieu|buoi chieu)\b/.test(t);
  const isEvening = /\b(toi|buoi toi|dem)\b/.test(t);
  const isMorning = /\b(sang|buoi sang)\b/.test(t);

  let match = t.match(/(\d{1,2})[:h](\d{1,2})/);
  if (match) {
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    if ((isAfternoon || isEvening) && hour >= 1 && hour <= 11) hour += 12;
    if (isMorning && hour === 12) hour = 0;
    return { hour, minute };
  }

  match = t.match(/(?:luc|vao|tu|bat dau)\s*(\d{1,2})\s*(?:gio|h)\b/);
  if (match) {
    let hour = Number(match[1]);
    if ((isAfternoon || isEvening) && hour >= 1 && hour <= 11) hour += 12;
    if (isMorning && hour === 12) hour = 0;
    return { hour, minute: 0 };
  }

  match = t.match(/(\d{1,2})\s*(?:gio|h)\b/);
  if (match) {
    let hour = Number(match[1]);
    if ((isAfternoon || isEvening) && hour >= 1 && hour <= 11) hour += 12;
    if (isMorning && hour === 12) hour = 0;
    return { hour, minute: 0 };
  }

  return null;
}

function extractTitle(text = '') {
  let s = stripLeadingReminderWords(text);
  s = s.replace(/\b(l[uú]c|v[aà]o|t[uừ]|b[aắ]t d[aầ]u)\s*\d{1,2}(?:[:h]\d{1,2})?\s*(?:h|gio|phut|p)?\b/gi, ' ');
  s = s.replace(/\b(h[oô]m nay|ng[aà]y mai|mai|th[uứ]\s*[2-7]|ch[uủ]\s*nh[aậ]t|cn|ng[aà]y\s*\d{1,2}\/\d{1,2}(?:\/\d{4})?)\b/gi, ' ');
  s = s.replace(/(?:\bở\b|\btai\b)\s+.+$/i, ' ');
  s = s.replace(/\b(k[eé]o d[aà]i|duration)\s+.+$/i, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  s = s.replace(/[,.]$/, '').trim();

  if (!s) return 'Lịch từ Aurora';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parseDateTimeFromText(text = '', fallbackIso = null) {
  const time = parseTimeParts(text);
  if (!time && fallbackIso) {
    const f = new Date(fallbackIso);
    if (!Number.isNaN(f.getTime())) return f.toISOString();
  }
  if (!time) return null;

  const base = parseDateContext(text);
  base.setHours(time.hour, time.minute, 0, 0);
  return base.toISOString();
}

async function updateJobMetadata(jobId, metadataPatch = {}) {
  const sql = `
    UPDATE deo.agent_jobs
    SET metadata = COALESCE(metadata, '{}'::jsonb) || ${escapeSql(JSON.stringify(metadataPatch))}::jsonb,
        updated_at = NOW()
    WHERE id = ${escapeSql(jobId)}::uuid
    RETURNING id;
  `;
  await runPsql(sql);
}

(async () => {
  try {
    const jobs = await listAuroraJobs(50, { status: 'pending' });
    const candidates = jobs.filter(job => {
      if (!['reminder_create', 'calendar_assist'].includes(job.job_type)) return false;
      const md = job.metadata || {};
      return !md.calendarEventId && !md.calendarSyncStatus;
    });

    if (!candidates.length) {
      console.log('NO_PENDING_CALENDAR');
      return;
    }

    const created = [];

    for (const job of candidates) {
      const payload = job.payload || {};
      const message = payload.message_text || payload.reminder_task || '';
      const title = payload.reminder_task || extractTitle(message);
      const startIso = parseDateTimeFromText(message, payload.reminder_due_iso || job.due_at || null);
      if (!startIso) continue;

      const allDay = detectAllDay(message, title);
      const durationMinutes = detectDurationMinutes(message, title);
      const location = payload.location || detectLocation(message) || '';
      const endIso = allDay ? plusMinutes(startIso, 24 * 60) : plusMinutes(startIso, durationMinutes);

      const existingCalendarEventId = payload.calendar_event_id;
      if (existingCalendarEventId) continue;

      const descriptionLines = [
        'Created by Aurora calendar sync',
        `Source job: ${job.id}`,
        message ? `Original message: ${message}` : '',
        location ? `Location: ${location}` : '',
        `Duration minutes: ${allDay ? 24 * 60 : durationMinutes}`,
      ].filter(Boolean);

      const args = [
        'calendar', 'create', CALENDAR_ID,
        '--account', ACCOUNT,
        '--summary', title,
        '--description', descriptionLines.join('\n'),
        '--reminder', allDay ? 'popup:1d' : 'popup:30m',
        '--results-only',
        '--json',
        ...(location ? ['--location', location] : []),
      ];

      if (allDay) {
        args.push('--all-day', '--from', fmtLocal(new Date(startIso)).slice(0, 10), '--to', fmtLocal(new Date(endIso)).slice(0, 10));
      } else {
        args.push('--from', fmtLocal(new Date(startIso)), '--to', fmtLocal(new Date(endIso)));
      }

      const event = runGog(args);

      await updateJobMetadata(job.id, {
        calendarSyncedAt: new Date().toISOString(),
        calendarEventId: event.id || '',
        calendarHtmlLink: event.htmlLink || '',
        calendarAccount: ACCOUNT,
        calendarSyncStatus: 'created',
        parsedTitle: title,
        parsedLocation: location,
        parsedStartIso: startIso,
        parsedEndIso: endIso,
        parsedAllDay: allDay,
        parsedDurationMinutes: allDay ? 24 * 60 : durationMinutes,
      });

      created.push({
        jobId: job.id,
        jobType: job.job_type,
        summary: title,
        start: startIso,
        end: endIso,
        location,
        allDay,
        eventId: event.id || '',
      });
    }

    if (!created.length) {
      console.log('NO_CREATABLE_CALENDAR_JOB');
      return;
    }

    console.log(JSON.stringify({ created }, null, 2));
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
})();
