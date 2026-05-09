import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const files = [
  'apps/api/src/routes/dashboard.ts',
  'deo-enterprise-os/apps/api/src/routes/dashboard.ts',
];

const forbiddenPatterns = [
  /FROM deo\.expenses[^`]*\bstatus\b/s,
  /FROM deo\.clarifications\s+WHERE\s+company_id\b/s,
];

const webClientSource = readFileSync(resolve('apps/web/src/api/client.ts'), 'utf8');

if (!webClientSource.includes('const unwrapObject = <T>(payload: unknown): T => {')) {
  throw new Error('apps/web/src/api/client.ts no longer unwraps enveloped dashboard summary payloads');
}

if (!webClientSource.includes("window.location.assign('/login?expired=1')")) {
  throw new Error('apps/web/src/api/client.ts no longer preserves expired-login redirect marker');
}

for (const file of files) {
  const source = readFileSync(resolve(file), 'utf8');

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(source)) {
      throw new Error(`${file} contains dashboard query incompatible with production schema: ${pattern}`);
    }
  }

  if (!source.includes('SUM(CAST(amount AS BIGINT)) as approved')) {
    throw new Error(`${file} no longer reports approved expenses from production-safe amount total`);
  }

  if (!source.includes('JOIN deo.tasks t ON t.id = c.task_id')) {
    throw new Error(`${file} no longer scopes clarifications through tasks.company_id`);
  }

  if (!source.includes('offline: parseInt(agentsData.offline) || 0')) {
    throw new Error(`${file} no longer returns agents.offline for dashboard notifications`);
  }
}

console.log('dashboard schema-safe check passed');
