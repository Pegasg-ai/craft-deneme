const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dist = path.join(root, 'dist');
const indexSrc = path.join(root, 'index.html');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} -> ${dest}`);
}

function main() {
  ensureDir(dist);
  if (!fs.existsSync(indexSrc)) {
    console.error('index.html not found at project root');
    process.exit(1);
  }
  copyFile(indexSrc, path.join(dist, 'index.html'));
}

main();
