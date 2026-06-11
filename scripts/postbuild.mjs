import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = join(root, 'dist', 'index.html');
const notFoundHtml = join(root, 'dist', '404.html');

if (existsSync(indexHtml)) {
  copyFileSync(indexHtml, notFoundHtml);
  console.log('Copied dist/index.html → dist/404.html (SPA fallback)');
}
