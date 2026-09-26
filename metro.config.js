const { getDefaultConfig } = require('expo/metro-config');
const https = require('https');

const config = getDefaultConfig(__dirname);

config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      // CORS başlıkları
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', '*');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // /odeal-proxy/ yönlendirmesi
      if (req.url && req.url.startsWith('/odeal-proxy/')) {
        const targetPath = req.url.replace('/odeal-proxy', '');
        const targetHost = req.headers['x-target-host'] || 'api.odeal.com';

        const chunks = [];
        let isDone = false;

        req.on('data', (chunk) => {
          chunks.push(chunk);
        });

        const handleForward = () => {
          if (isDone) return;
          isDone = true;

          const bodyBuffer = Buffer.concat(chunks);
          const bodyStr = bodyBuffer.toString('utf8');
          console.log(`[PROXY -> ${targetHost}${targetPath}] Body (${bodyBuffer.length} bytes):`, bodyStr);

          const forwardHeaders = {};
          for (const [key, value] of Object.entries(req.headers)) {
            const lowerKey = key.toLowerCase();
            if (
              !['host', 'x-target-host', 'origin', 'referer', 'content-length', 'connection'].includes(lowerKey)
            ) {
              forwardHeaders[key] = value;
            }
          }
          forwardHeaders['host'] = targetHost;
          if (req.headers['referencecode']) {
            forwardHeaders['referenceCode'] = req.headers['referencecode'];
          }
          if (bodyBuffer.length > 0) {
            forwardHeaders['content-type'] = 'application/json; charset=utf-8';
            forwardHeaders['content-length'] = bodyBuffer.length;
          } else if (req.method === 'GET' || req.method === 'DELETE') {
            delete forwardHeaders['content-type'];
          } else {
            forwardHeaders['content-type'] = 'application/json; charset=utf-8';
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
              if (res.headersSent) return;

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
            if (!res.headersSent) {
              res.writeHead(504, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
              res.end(JSON.stringify({ error: 'Ödeal sunucusu zaman aşımına uğradı (25s)' }));
            }
          });

          proxyReq.on('error', (err) => {
            console.error('[PROXY ERROR]', err.message);
            if (!res.headersSent) {
              res.writeHead(502, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
              res.end(JSON.stringify({ error: 'Proxy bağlantı hatası: ' + err.message }));
            }
          });

          if (bodyBuffer.length > 0) {
            proxyReq.write(bodyBuffer);
          }
          proxyReq.end();
        };

        req.on('end', handleForward);
        return;
      }

      return metroMiddleware(req, res, next);
    };
  },
};

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (moduleName === 'react-native/Libraries/Utilities/DevLoadingView') {
      return context.resolveRequest(context, 'react-native/Libraries/Utilities/LoadingView', platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
