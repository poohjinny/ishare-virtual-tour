/**
 * Publish tour JSON next to the SPA so the Open Graph Worker can fetch
 * `/tours/{tourId}.json` at runtime (no per-scene HTML shells).
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const toursDir = join(root, 'tours');
const outDir = join(root, 'dist', 'tours');

function listTourJsonFiles() {
  if (!existsSync(toursDir)) return [];
  return readdirSync(toursDir).filter(
    (name) =>
      name.endsWith('.json') &&
      name !== 'catalog.json' &&
      !name.endsWith('-knowledge.json'),
  );
}

function main() {
  if (!existsSync(join(root, 'dist'))) {
    console.warn('publish-tour-json: dist/ missing — skip');
    return;
  }

  mkdirSync(outDir, { recursive: true });
  let count = 0;
  for (const name of listTourJsonFiles()) {
    copyFileSync(join(toursDir, name), join(outDir, name));
    count += 1;
  }
  const catalogPath = join(toursDir, 'catalog.json');
  if (existsSync(catalogPath)) {
    copyFileSync(catalogPath, join(outDir, 'catalog.json'));
    count += 1;
  }
  console.log(`publish-tour-json: ${count} files → dist/tours/`);
}

main();
