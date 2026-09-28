const https = require('https');

module.exports = async (req, res) => {
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

  // Belirlenen hedef yol
  let targetPath = '';
  if (req.query && req.query.path) {
    const p = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    targetPath = '/' + p.replace(/^\//, '');
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'path') {
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v));
        } else {
          searchParams.append(key, value);
        }
      }
    }
    const qs = searchParams.toString();
    if (qs) {
      targetPath += (targetPath.includes('?') ? '&' : '?') + qs;
    }
  } else {
    targetPath = (req.url || '')
      .replace(/^\/odeal-proxy/, '')
      .replace(/^\/api\/odeal-proxy/, '');
    if (!targetPath.startsWith('/')) {
      targetPath = '/' + targetPath;
    }
  }

  // İstek gövdesi (body) hazırlığı
  let requestBody = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (req.body) {
      if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
        requestBody = Buffer.from(JSON.stringify(req.body), 'utf8');
      } else if (typeof req.body === 'string') {
        requestBody = Buffer.from(req.body, 'utf8');
      } else if (Buffer.isBuffer(req.body)) {
        requestBody = req.body;
      }
    } else {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      if (chunks.length > 0) {
        requestBody = Buffer.concat(chunks);
      }
    }
  }

  const forwardHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    const lower = key.toLowerCase();
    if (
      ![
        'host',
        'x-target-host',
        'origin',
        'referer',
        'connection',
        'content-length',
        'x-forwarded-for',
        'x-forwarded-host',
        'x-forwarded-proto',
        'x-vercel-id',
        'x-vercel-deployment-url',
        'x-real-ip',
      ].includes(lower)
    ) {
      forwardHeaders[key] = value;
    }
  }
  forwardHeaders['host'] = targetHost;

  if (req.headers['referencecode']) {
    forwardHeaders['referenceCode'] = req.headers['referencecode'];
  }

  if (requestBody && requestBody.length > 0) {
    forwardHeaders['content-type'] = 'application/json; charset=utf-8';
    forwardHeaders['content-length'] = requestBody.length;
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
      resHeaders['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH';
      resHeaders['access-control-allow-headers'] = '*';

      res.writeHead(proxyRes.statusCode || 200, resHeaders);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    if (!res.headersSent) {
      res.writeHead(504, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify({ error: 'Ödeal sunucusu zaman aşımına uğradı (25s)' }));
    }
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
      res.end(JSON.stringify({ error: 'Ödeal sunucusuna bağlanılamadı: ' + err.message }));
    }
  });

  if (requestBody && requestBody.length > 0) {
    proxyReq.write(requestBody);
  }
  proxyReq.end();
};
