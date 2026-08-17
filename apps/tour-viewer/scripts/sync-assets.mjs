import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
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

function collectKnownFaviconPaths(assetsRoot) {
  const paths = [];
  for (const entry of readdirSync(assetsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'brand') continue;
    const clientId = entry.name;
    const clientDir = join(assetsRoot, clientId);
    for (const ext of ['png', 'ico']) {
      if (existsSync(join(clientDir, `favicon.${ext}`))) {
        paths.push(`/assets/${clientId}/favicon.${ext}`);
      }
    }
    for (const tourEntry of readdirSync(clientDir, { withFileTypes: true })) {
      if (!tourEntry.isDirectory()) continue;
      for (const ext of ['png', 'ico']) {
        if (existsSync(join(clientDir, tourEntry.name, `favicon.${ext}`))) {
          paths.push(`/assets/${clientId}/${tourEntry.name}/favicon.${ext}`);
        }
      }
    }
  }
  return paths.sort();
}

const knownFaviconFile = join(root, 'src', 'data', 'knownFaviconPaths.json');
writeFileSync(
  knownFaviconFile,
  `${JSON.stringify(collectKnownFaviconPaths(src), null, 2)}\n`,
);
console.log('Wrote src/data/knownFaviconPaths.json');
