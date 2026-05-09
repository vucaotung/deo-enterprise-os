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
}

console.log('dashboard schema-safe check passed');
