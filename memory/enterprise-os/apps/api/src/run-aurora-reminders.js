const { listDueAuroraReminderJobs, markAuroraJobDone } = require('./deo-db');

(async () => {
  try {
    const jobs = await listDueAuroraReminderJobs(10);
    if (!jobs.length) {
      console.log('NO_DUE');
      return;
    }

    const lines = ['Nhắc việc từ Aurora'];
    for (const job of jobs) {
      const task = job.payload?.reminder_task || job.payload?.message_text || 'Việc cần nhắc';
      const label = job.payload?.reminder_due_label || job.payload?.reminder_due_iso || '';
      const meta = job.payload?.calendar_event_id || job.payload?.calendarEventId;
      lines.push(`- ${task}${label ? ` (${label})` : ''}`);
      await markAuroraJobDone(job.id, {
        metadata: {
          reminderDeliveredAt: new Date().toISOString(),
          reminderDeliveryMode: 'openclaw-local-cron',
          reminderHadCalendarLink: Boolean(meta),
        }
      });
    }

    console.log(lines.join('\n'));
  } catch (error) {
    console.error(error.message || String(error));
    process.exit(1);
  }
})();
