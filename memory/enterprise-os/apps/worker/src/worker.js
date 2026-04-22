console.log('deo-enterprise-worker started');
setInterval(() => {
  console.log(`[${new Date().toISOString()}] worker heartbeat`);
}, 15000);
