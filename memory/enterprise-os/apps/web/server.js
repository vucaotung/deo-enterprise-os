const http = require('http');
const port = process.env.PORT || 3000;
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Deo Enterprise OS</title></head>
<body style="font-family: Arial; padding: 24px;">
  <h1>Deo Enterprise OS</h1>
  <p>Web scaffold is running.</p>
  <ul>
    <li>API base: ${apiBase}</li>
    <li>Purpose: VPS control plane + dashboard</li>
    <li>Status: scaffold only</li>
  </ul>
</body>
</html>`;

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}).listen(port, () => {
  console.log(`WEB listening on ${port}`);
});
