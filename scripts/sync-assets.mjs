import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'assets');
const dest = join(root, 'public', 'assets');

if (!existsSync(src)) {
  console.error('assets/ folder not found');
  process.exit(1);
}

mkdirSync(join(root, 'public'), { recursive: true });
if (existsSync(dest)) {
  rmSync(dest, { recursive: true });
}
cpSync(src, dest, {
  recursive: true,
  filter: (path) => !path.endsWith('README.md'),
});
const faviconSrc = join(src, 'favicon.ico');
const faviconDest = join(root, 'public', 'favicon.ico');
if (existsSync(faviconSrc)) {
  copyFileSync(faviconSrc, faviconDest);
  console.log('Synced favicon.ico → public/favicon.ico');
}

console.log('Synced assets/ → public/assets/');
