import { query as dbQuery } from '../db';

const RUNNING_TIMEOUT_MIN = 10;

// Marks agent_jobs that have been claimed/running too long as 'dead', then
// cascades the parent task_executions to 'failed'. Called periodically by
// the worker. Caps stuck jobs without requiring a separate cron job.
export const sweepStuckJobs = async (): Promise<{ killed: number }> => {
  const dead = await dbQuery(
    `UPDATE deo.agent_jobs
        SET queue_state = 'dead',
            finished_at = COALESCE(finished_at, NOW()),
            updated_at = NOW()
      WHERE queue_state IN ('claimed','running')
        AND started_at < NOW() - INTERVAL '${RUNNING_TIMEOUT_MIN} minutes'
      RETURNING id, execution_id`
  );
  const killed = dead.rowCount || 0;
  if (killed === 0) return { killed: 0 };

  const executionIds = dead.rows.map((r: any) => r.execution_id);
  await dbQuery(
    `UPDATE deo.task_executions
        SET status = 'failed',
            finished_at = COALESCE(finished_at, NOW()),
            updated_at = NOW()
      WHERE id = ANY($1::uuid[])
        AND status NOT IN ('succeeded','failed','cancelled','needs_review')`,
    [executionIds]
  );

  return { killed };
};
