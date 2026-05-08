import { query as dbQuery } from './db';
import * as redis from './redis';
import { connectRedis } from './redis';
import { buildQueueKey, popAgentJob } from './orchestrator/dispatcher';
import { getRuntimeAdapter, listRuntimeTypes, AgentJobContext } from './orchestrator/runtimes';
import { sweepStuckJobs } from './orchestrator/sweeper';

const POLL_INTERVAL_MS = 1000;
const SWEEP_INTERVAL_MS = 60000;
const ERROR_BACKOFF_MS = 5000;
const LOG_TAIL_MAX = 16384;
const SECRET_PATTERN = /(sk-[A-Za-z0-9_-]+|(?:api[_-]?key|token|password|secret)\s*[:=]\s*[^\s"']+)/gi;
const ANSI_PATTERN = /[][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;

const sanitizeLogTail = (value: string): string =>
  value
    .replace(ANSI_PATTERN, '')
    .replace(SECRET_PATTERN, '[REDACTED]')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .slice(-LOG_TAIL_MAX);

class Worker {
  private running = false;
  private lastSweep = 0;

  async start() {
    this.running = true;
    console.log('Worker started');

    await connectRedis();
    console.log('Connected to Redis');

    while (this.running) {
      try {
        await this.processAllQueues();
        if (Date.now() - this.lastSweep > SWEEP_INTERVAL_MS) {
          const result = await sweepStuckJobs();
          if (result.killed > 0) {
            console.log(`Sweeper marked ${result.killed} stuck agent_jobs dead`);
          }
          this.lastSweep = Date.now();
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      } catch (error) {
        console.error('Worker loop error', error);
        await new Promise((resolve) => setTimeout(resolve, ERROR_BACKOFF_MS));
      }
    }
  }

  // Discover (runtime_type, company_id) pairs that have queued agent_jobs,
  // then attempt LPOP on each. Avoids polling dead queue keys and keeps
  // discovery cost proportional to actual workload.
  private async processAllQueues() {
    const supportedRuntimes = listRuntimeTypes();
    const result = await dbQuery(
      `SELECT DISTINCT t.company_id, aj.runtime_type
         FROM deo.agent_jobs aj
         JOIN deo.task_executions te ON te.id = aj.execution_id
         JOIN deo.tasks t ON t.id = te.task_id
        WHERE aj.queue_state = 'queued'
          AND aj.runtime_type = ANY($1::text[])`,
      [supportedRuntimes]
    );

    for (const { company_id, runtime_type } of result.rows) {
      const queueKey = buildQueueKey(runtime_type, company_id);
      const agentJobId = await popAgentJob(queueKey);
      if (!agentJobId) continue;
      await this.runAgentJob(agentJobId);
    }
  }

  private async runAgentJob(agentJobId: string) {
    const ctx = await this.loadContext(agentJobId);
    if (!ctx) return;

    const { job, context } = ctx;

    if (job.queue_state !== 'queued') {
      // Lost race or already terminal — ignore.
      return;
    }

    const adapter = getRuntimeAdapter(job.runtime_type);
    if (!adapter) {
      console.error(`No adapter for runtime ${job.runtime_type}; marking agent_job ${agentJobId} dead`);
      await this.markDead(agentJobId, job.execution_id, job.task_id, {
        message: `No runtime adapter for "${job.runtime_type}"`,
      });
      return;
    }

    await this.markRunning(agentJobId, job.execution_id);

    try {
      const result = await adapter.run(context);
      await this.persistResult(job, result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Adapter ${adapter.name} threw for agent_job ${agentJobId}: ${message}`);
      await this.markDead(agentJobId, job.execution_id, job.task_id, { message });
    }
  }

  private async loadContext(agentJobId: string): Promise<{ job: any; context: AgentJobContext } | null> {
    const result = await dbQuery(
      `SELECT aj.id, aj.execution_id, aj.agent_id, aj.runtime_type, aj.input, aj.queue_state,
              te.task_id,
              t.title AS task_title, t.description AS task_description, t.company_id,
              a.name AS agent_name, a.runtime_type AS agent_runtime_type, a.config AS agent_config
         FROM deo.agent_jobs aj
         JOIN deo.task_executions te ON te.id = aj.execution_id
         JOIN deo.tasks t ON t.id = te.task_id
         LEFT JOIN deo.agents a ON a.id = aj.agent_id
        WHERE aj.id = $1`,
      [agentJobId]
    );
    const job = result.rows[0];
    if (!job) {
      console.log(`Agent job ${agentJobId} not found; dropping`);
      return null;
    }

    const context: AgentJobContext = {
      id: job.id,
      execution_id: job.execution_id,
      task_id: job.task_id,
      agent_id: job.agent_id,
      runtime_type: job.runtime_type,
      input: job.input || {},
      task: {
        id: job.task_id,
        title: job.task_title,
        description: job.task_description,
        company_id: job.company_id,
      },
      agent: job.agent_id
        ? {
            id: job.agent_id,
            name: job.agent_name,
            runtime_type: job.agent_runtime_type,
            config: job.agent_config || {},
          }
        : null,
    };

    return { job, context };
  }

  private async markRunning(agentJobId: string, executionId: string) {
    await dbQuery(
      `UPDATE deo.agent_jobs
          SET queue_state = 'running',
              started_at = COALESCE(started_at, NOW()),
              updated_at = NOW()
        WHERE id = $1`,
      [agentJobId]
    );
    await dbQuery(
      `UPDATE deo.task_executions
          SET status = 'running',
              started_at = COALESCE(started_at, NOW()),
              updated_at = NOW()
        WHERE id = $1
          AND status NOT IN ('succeeded','failed','cancelled','needs_review')`,
      [executionId]
    );
  }

  private async persistResult(job: any, result: any) {
    const succeeded = result.status === 'succeeded';
    const queueState = succeeded ? 'done' : 'dead';
    const executionStatus = succeeded ? 'succeeded' : 'failed';
    const taskExecStatus = succeeded ? 'success' : 'failed';

    const tail = typeof result.log_tail === 'string' ? sanitizeLogTail(result.log_tail) : null;

    await dbQuery(
      `UPDATE deo.agent_jobs
          SET queue_state = $1,
              output = $2,
              log_tail = CASE
                  WHEN $3::text IS NULL THEN log_tail
                  ELSE RIGHT(COALESCE(log_tail,'') || $3, $7)
              END,
              tokens_in = COALESCE($4, tokens_in),
              tokens_out = COALESCE($5, tokens_out),
              cost_usd = COALESCE($6, cost_usd),
              finished_at = COALESCE(finished_at, NOW()),
              updated_at = NOW()
        WHERE id = $8`,
      [
        queueState,
        result.output ? JSON.stringify(result.output) : null,
        tail,
        result.tokens_in ?? null,
        result.tokens_out ?? null,
        result.cost_usd ?? null,
        LOG_TAIL_MAX,
        job.id,
      ]
    );

    const executionUpdate = await dbQuery(
      `UPDATE deo.task_executions
          SET status = $1,
              error = $2,
              finished_at = COALESCE(finished_at, NOW()),
              updated_at = NOW()
        WHERE id = $3
          AND status NOT IN ('succeeded','failed','cancelled','needs_review')`,
      [executionStatus, result.error ? JSON.stringify(result.error) : null, job.execution_id]
    );

    if (executionUpdate.rowCount && executionUpdate.rowCount > 0) {
      await dbQuery(
        `UPDATE deo.tasks SET execution_status = $1, updated_at = NOW() WHERE id = $2`,
        [taskExecStatus, job.task_id]
      );
    }
  }

  private async markDead(agentJobId: string, executionId: string, taskId: string, error: { message: string; details?: unknown }) {
    await dbQuery(
      `UPDATE deo.agent_jobs
          SET queue_state = 'dead',
              output = $2,
              finished_at = COALESCE(finished_at, NOW()),
              updated_at = NOW()
        WHERE id = $1`,
      [agentJobId, JSON.stringify({ error })]
    ).catch((e) => console.error('markDead agent_jobs update failed', e));

    const executionUpdate = await dbQuery(
      `UPDATE deo.task_executions
          SET status = 'failed',
              error = $1,
              finished_at = COALESCE(finished_at, NOW()),
              updated_at = NOW()
        WHERE id = $2
          AND status NOT IN ('succeeded','failed','cancelled','needs_review')`,
      [JSON.stringify(error), executionId]
    ).catch((e) => {
      console.error('markDead task_executions update failed', e);
      return null;
    });

    if (executionUpdate?.rowCount && executionUpdate.rowCount > 0) {
      await dbQuery(
        `UPDATE deo.tasks SET execution_status = 'failed', updated_at = NOW() WHERE id = $1`,
        [taskId]
      ).catch((e) => console.error('markDead tasks update failed', e));
    }
  }

  stop() {
    this.running = false;
    console.log('Worker stopping');
  }
}

const worker = new Worker();

process.on('SIGTERM', () => {
  console.log('SIGTERM received, stopping worker');
  worker.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, stopping worker');
  worker.stop();
  process.exit(0);
});

worker.start().catch((error) => {
  console.error('Worker failed to start', error);
  process.exit(1);
});
