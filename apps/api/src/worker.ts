import { query as dbQuery } from './db';
import * as redis from './redis';
import { connectRedis } from './redis';

class Worker {
  private running = false;
  private jobTimeout = 30000;

  async start() {
    this.running = true;
    console.log('Worker started');

    await connectRedis();
    console.log('Connected to Redis');

    while (this.running) {
      try {
        await this.processQueues();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Worker error', error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  private async processQueues() {
    try {
      // PR2: queue payload is agent_job.id. We discover company queues via
      // tasks (agents are platform-wide and have no company_id). PR3 will
      // refactor to per-runtime-type queues with a proper dispatcher.
      const companiesResult = await dbQuery(
        'SELECT DISTINCT company_id FROM deo.tasks WHERE company_id IS NOT NULL'
      );

      for (const { company_id } of companiesResult.rows) {
        const queueKey = `jobs:queue:${company_id}`;
        const agentJobId = await redis.lpop(queueKey);

        if (!agentJobId) {
          continue;
        }

        await this.processAgentJob(agentJobId, company_id);
      }
    } catch (error) {
      console.error('Failed to process queues', error);
    }
  }

  private async processAgentJob(agentJobId: string, companyId: string) {
    try {
      const jobResult = await dbQuery(
        `SELECT aj.*, te.task_id, te.attempt_number, t.company_id
           FROM deo.agent_jobs aj
           JOIN deo.task_executions te ON te.id = aj.execution_id
           JOIN deo.tasks t ON t.id = te.task_id
          WHERE aj.id = $1 AND t.company_id = $2`,
        [agentJobId, companyId]
      );

      if (jobResult.rows.length === 0) {
        console.log(`Agent job ${agentJobId} not found for company ${companyId}`);
        return;
      }

      const job = jobResult.rows[0];

      if (job.queue_state !== 'queued') {
        console.log(`Agent job ${agentJobId} state is ${job.queue_state}, skipping`);
        return;
      }

      let agentId = job.agent_id;
      if (!agentId) {
        const agent = await this.findAvailableAgent(job.runtime_type);
        if (!agent) {
          // Re-enqueue: no online agent for this runtime
          await redis.lpush(`jobs:queue:${companyId}`, agentJobId);
          console.log(`No ${job.runtime_type} agents available for job ${agentJobId}, requeuing`);
          return;
        }
        agentId = agent.id;
      }

      await dbQuery(
        `UPDATE deo.agent_jobs
            SET agent_id = $1,
                queue_state = 'claimed',
                started_at = COALESCE(started_at, NOW()),
                updated_at = NOW()
          WHERE id = $2`,
        [agentId, agentJobId]
      );

      await dbQuery(
        `UPDATE deo.task_executions
            SET status = 'running',
                started_at = COALESCE(started_at, NOW()),
                updated_at = NOW()
          WHERE id = $1`,
        [job.execution_id]
      );

      console.log(`Agent job ${agentJobId} claimed by agent ${agentId} (runtime ${job.runtime_type})`);

      // PR2 keeps the existing "wait then timeout" behavior so external
      // agents that PATCH /api/agent-jobs/:id/status still work end-to-end.
      // PR3 introduces per-runtime adapters that actually invoke the runtime.
      const processStart = Date.now();
      let jobCompleted = false;

      while (Date.now() - processStart < this.jobTimeout && !jobCompleted) {
        const updated = await dbQuery(
          'SELECT queue_state FROM deo.agent_jobs WHERE id = $1',
          [agentJobId]
        );

        if (updated.rows.length > 0) {
          const state = updated.rows[0].queue_state;
          if (['done', 'dead', 'cancelled'].includes(state)) {
            jobCompleted = true;
            console.log(`Agent job ${agentJobId} finished with state ${state}`);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!jobCompleted) {
        console.log(`Agent job ${agentJobId} timeout, marking dead`);
        await dbQuery(
          `UPDATE deo.agent_jobs
              SET queue_state = 'dead',
                  finished_at = COALESCE(finished_at, NOW()),
                  updated_at = NOW()
            WHERE id = $1 AND queue_state IN ('claimed','running')`,
          [agentJobId]
        );
        await dbQuery(
          `UPDATE deo.task_executions
              SET status = 'failed',
                  finished_at = COALESCE(finished_at, NOW()),
                  updated_at = NOW()
            WHERE id = $1 AND status NOT IN ('succeeded','failed','cancelled','needs_review')`,
          [job.execution_id]
        );
      }
    } catch (error) {
      console.error(`Failed to process agent job ${agentJobId}`, error);
      try {
        await dbQuery(
          `UPDATE deo.agent_jobs
              SET queue_state = 'dead',
                  finished_at = COALESCE(finished_at, NOW()),
                  updated_at = NOW()
            WHERE id = $1`,
          [agentJobId]
        );
      } catch (updateError) {
        console.error(`Failed to mark agent job ${agentJobId} dead`, updateError);
      }
    }
  }

  private async findAvailableAgent(runtimeType: string) {
    try {
      const result = await dbQuery(
        `SELECT id, runtime_type FROM deo.agents
           WHERE runtime_type = $1 AND status = 'online'
           ORDER BY last_heartbeat DESC NULLS LAST
           LIMIT 1`,
        [runtimeType]
      );

      if (result.rows.length === 0) {
        return null;
      }

      return result.rows[0];
    } catch (error) {
      console.error('Failed to find agent', error);
      return null;
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
