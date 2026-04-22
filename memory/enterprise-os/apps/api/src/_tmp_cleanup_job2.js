const { markAuroraJobDone } = require('./deo-db');
(async () => {
  const out = await markAuroraJobDone('19d61197-be3b-4567-98d4-6236feecd035', { metadata: { testCleanup: true, cleanedAt: new Date().toISOString() } });
  console.log(JSON.stringify(out));
})();
