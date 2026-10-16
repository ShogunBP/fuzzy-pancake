const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const START_TIME = Date.now();

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png'
};

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

const server = http.createServer((req, res) => {
  // Rota de telemetria da PoC
  if (req.url === '/api/telemetry') {
    const memory = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());
    const data = {
      status: 'online',
      deviceTarget: 'Poco X5 Pro (Android 14)',
      uptimeSeconds: uptimeSec,
      uptimeFormatted: formatUptime(uptimeSec),
      memory: {
        rssMb: Math.round(memory.rss / 1024 / 1024 * 100) / 100,
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100
      },
      startedAt: new Date(START_TIME).toISOString(),
      timestamp: new Date().toISOString()
    };
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify(data, null, 2));
    return;
  }

  // Roteamento de arquivos estáticos
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  // Evitar escape do diretório public
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Proibido');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Arquivo não encontrado');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const pad = (n) => String(n).padStart(2, '0');
  const d = new Date();
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  console.log(`[poc-server] ${time} - Servidor PoC Android 24/7 ativo em http://localhost:${PORT}`);
  console.log(`[poc-server] ${time} - Acessível na rede local via http://<IP_DO_APARELHO>:${PORT}`);
});
