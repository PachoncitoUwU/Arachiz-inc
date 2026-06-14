// Servidor simple para servir la presentación con soporte GLB
const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 5500;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.glb':  'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.ico':  'image/x-icon',
};

const ROOTS = [
  path.join(__dirname),                                           // presentaciones/
  path.join(__dirname, '..'),                                     // raíz del proyecto
  path.join(__dirname, '..', 'docs', 'presentations'),           // docs/presentations/
  path.join(__dirname, '..', 'frontend', 'public'),              // frontend/public/
];

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // Buscar el archivo en todas las raíces
  for (const root of ROOTS) {
    const filePath = path.join(root, urlPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext  = path.extname(filePath).toLowerCase();
      const mime = MIME[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': mime,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }

  res.writeHead(404); res.end('Not found: ' + urlPath);
}).listen(PORT, () => {
  console.log('\n  ╔══════════════════════════════════════╗');
  console.log('  ║  Arachiz Presentación — servidor     ║');
  console.log(`  ║  http://localhost:${PORT}             ║`);
  console.log('  ║  Ctrl+C para detener                 ║');
  console.log('  ╚══════════════════════════════════════╝\n');
});
