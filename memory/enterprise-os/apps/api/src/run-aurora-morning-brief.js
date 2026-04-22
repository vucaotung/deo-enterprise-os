const { execFileSync } = require('child_process');
const path = require('path');
const { listAuroraJobs } = require('./deo-db');

function runGog(args) {
  const gogPath = path.join(process.cwd(), 'gog.exe');
  const out = execFileSync(gogPath, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(out || '[]');
}

function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Bangkok' });
  } catch {
    return '';
  }
}

(async () => {
  try {
    const events = runGog(['calendar', 'events', '--account', 'vucaotung@gmail.com', '--today', '--json', '--results-only', '--max', '20']);
    const pendingJobs = await listAuroraJobs(20, { status: 'pending' });
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bangkok' });
    const dueToday = pendingJobs.filter(j => (j.due_at || '').startsWith(today));

    if ((!events || events.length === 0) && dueToday.length === 0) {
      console.log('NO_REPLY');
      return;
    }

    const lines = ['Lịch hôm nay của anh nè:'];
    for (const ev of events.slice(0, 8)) {
      const start = fmtTime(ev.start?.dateTime || ev.start?.date || '');
      const summary = ev.summary || '(không tiêu đề)';
      const location = ev.location ? ` @ ${ev.location}` : '';
      lines.push(`- ${start} — ${summary}${location}`);
      const locNorm = String(ev.location || '').toLowerCase();
      const sumNorm = String(summary || '').toLowerCase();
      if (locNorm.includes('vp') || locNorm.includes('văn phòng') || locNorm.includes('khuất duy tiến') || sumNorm.includes('họp') || sumNorm.includes('meeting')) {
        lines.push(`  -> nên chuẩn bị đi trước khoảng 30 phút nếu là gặp trực tiếp.`);
      }
    }

    if (dueToday.length) {
      lines.push('Task/reminder pending trong hôm nay:');
      for (const job of dueToday.slice(0, 5)) {
        const task = job.payload?.reminder_task || job.payload?.message_text || job.job_type;
        const when = job.payload?.reminder_due_label || fmtTime(job.due_at);
        lines.push(`- ${task}${when ? ` (${when})` : ''}`);
      }
    }

    console.log(lines.join('\n'));
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
})();
