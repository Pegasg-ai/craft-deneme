const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dist = path.join(root, 'dist');
const indexSrc = path.join(root, 'index.html');
const vendorSrc = path.join(root, 'vendor');
const jsSrc = path.join(root, 'js');
const assetsSrc = path.join(root, 'assets');

function copyDir(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  ensureDir(destDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

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

  // Bundle vendor libs for offline/Tauri builds
  if (fs.existsSync(vendorSrc)) {
    copyDir(vendorSrc, path.join(dist, 'vendor'));
  }

  // Copy JS modules
  if (fs.existsSync(jsSrc)) {
    copyDir(jsSrc, path.join(dist, 'js'));
  }

  // Copy assets (vehicles, textures, etc.)
  if (fs.existsSync(assetsSrc)) {
    copyDir(assetsSrc, path.join(dist, 'assets'));
  }
}

main();
