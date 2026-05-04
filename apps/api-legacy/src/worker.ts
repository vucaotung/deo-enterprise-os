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
        await this.processJobs();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Worker error', error);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  private async processJobs() {
    try {
      const companiesResult = await dbQuery('SELECT DISTINCT company_id FROM deo.agents');

      for (const { company_id } of companiesResult.rows) {
        const queueKey = `jobs:queue:${company_id}`;
        const jobId = await redis.lpop(queueKey);

        if (!jobId) {
          continue;
        }

        await this.processJob(jobId, company_id);
      }
    } catch (error) {
      console.error('Failed to process jobs', error);
    }
  }

  private async processJob(jobId: string, companyId: string) {
    try {
      const taskResult = await dbQuery(
        'SELECT * FROM deo.tasks WHERE id = $1 AND company_id = $2',
        [jobId, companyId]
      );

      if (taskResult.rows.length === 0) {
        console.log(`Job ${jobId} not found`);
        return;
      }

      const task = taskResult.rows[0];

      if (task.status !== 'open') {
        console.log(`Job ${jobId} is already ${task.status}`);
        return;
      }

      const agent = await this.findAvailableAgent(companyId);

      if (!agent) {
        await redis.lpush(`jobs:queue:${companyId}`, jobId);
        console.log(`No agents available for job ${jobId}, requeuing`);
        return;
      }

      await dbQuery(
        'UPDATE deo.tasks SET status = $1, assigned_to = $2, updated_at = NOW() WHERE id = $3',
        ['assigned', agent.id, jobId]
      );

      console.log(`Job ${jobId} assigned to agent ${agent.id}`);

      const processStart = Date.now();

      const maxWait = this.jobTimeout;
      let jobCompleted = false;

      while (Date.now() - processStart < maxWait && !jobCompleted) {
        const updatedTask = await dbQuery(
          'SELECT * FROM deo.tasks WHERE id = $1',
          [jobId]
        );

        if (updatedTask.rows.length > 0) {
          const status = updatedTask.rows[0].status;

          if (status === 'completed' || status === 'failed') {
            jobCompleted = true;
            console.log(`Job ${jobId} finished with status ${status}`);
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!jobCompleted) {
        console.log(`Job ${jobId} timeout, marking as failed`);

        await dbQuery(
          'UPDATE deo.tasks SET status = $1, updated_at = NOW() WHERE id = $2',
          ['failed', jobId]
        );
      }
    } catch (error) {
      console.error(`Failed to process job ${jobId}`, error);

      try {
        await dbQuery(
          'UPDATE deo.tasks SET status = $1, updated_at = NOW() WHERE id = $2',
          ['failed', jobId]
        );
      } catch (updateError) {
        console.error(`Failed to update job ${jobId} status`, updateError);
      }
    }
  }

  private async findAvailableAgent(companyId: string) {
    try {
      const result = await dbQuery(
        `SELECT * FROM deo.agents WHERE company_id = $1 AND status = 'online' ORDER BY last_heartbeat DESC LIMIT 1`,
        [companyId]
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
