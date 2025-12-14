const fs = require('fs');
const path = require('path');
const http = require('http');

const root = process.cwd();
const dist = path.join(root, 'dist');
const PORT = 3000;

// Build first
console.log('Building...');
require('./build.js');

const server = http.createServer((req, res) => {
    let filePath = path.join(dist, req.url === '/' ? 'index.html' : req.url);
    
    // Default to index.html for SPA
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(dist, 'index.html');
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        
        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml'
        }[ext] || 'application/octet-stream';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        // If something is already listening, assume the dev server is already running.
        // This avoids confusing "npm run dev failed" cases when the user already has it open.
        console.log(`\n! Port ${PORT} zaten kullanımda. Muhtemelen dev server zaten çalışıyor: http://localhost:${PORT}`);
        process.exit(0);
    }
    throw err;
});

server.listen(PORT, () => {
    console.log(`\n✓ Dev server çalışıyor: http://localhost:${PORT}`);
    console.log('  index.html değiştiğinde manuel refresh yapın\n');
});

process.on('SIGINT', () => {
    console.log('\n  Server kapatılıyor...');
    process.exit(0);
});
