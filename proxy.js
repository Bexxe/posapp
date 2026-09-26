const http = require('http');
const https = require('https');

const PORT = 3001;

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const targetHost = req.headers['x-target-host'] || 'api.odeal.com';
  const targetPath = req.url.startsWith('/proxy') ? req.url.replace('/proxy', '') : req.url;

  console.log(`[ODEAL PROXY] ${req.method} https://${targetHost}${targetPath}`);

  const chunks = [];
  req.on('data', (chunk) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    const bodyBuffer = Buffer.concat(chunks);

    const forwardHeaders = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (!['host', 'x-target-host', 'origin', 'referer', 'connection', 'content-length'].includes(lower)) {
        forwardHeaders[key] = value;
      }
    }
    forwardHeaders['host'] = targetHost;
    if (bodyBuffer.length > 0) {
      forwardHeaders['content-length'] = bodyBuffer.length;
    }

    const proxyReq = https.request(
      {
        hostname: targetHost,
        port: 443,
        path: targetPath,
        method: req.method,
        headers: forwardHeaders,
        timeout: 25000,
      },
      (proxyRes) => {
        const resHeaders = { ...proxyRes.headers };
        resHeaders['access-control-allow-origin'] = '*';
        resHeaders['access-control-allow-headers'] = '*';
        resHeaders['access-control-allow-methods'] = '*';

        res.writeHead(proxyRes.statusCode || 200, resHeaders);
        proxyRes.pipe(res);
      }
    );

    proxyReq.on('timeout', () => {
      proxyReq.destroy();
      res.writeHead(504, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify({ message: 'Ödeal sunucusu zaman aşımına uğradı.' }));
    });

    proxyReq.on('error', (err) => {
      console.error('[ODEAL PROXY ERROR]', err.message);
      res.writeHead(502, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify({ message: 'Ödeal Proxy Hatası: ' + err.message }));
    });

    if (bodyBuffer.length > 0) {
      proxyReq.write(bodyBuffer);
    }
    proxyReq.end();
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[ODEAL PROXY] Running on http://localhost:${PORT}`);
});
