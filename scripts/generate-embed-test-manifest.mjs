import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function generateEmbedTestManifest() {
  const toursDir = join(root, 'tours');
  const catalogPath = join(toursDir, 'catalog.json');
  const outPath = join(root, 'public', 'embed-test-manifest.json');

  if (!existsSync(catalogPath)) {
    throw new Error('tours/catalog.json not found');
  }

  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const tours = [];

  for (const client of catalog.clients ?? []) {
    for (const entry of client.tours ?? []) {
      if (entry.visibility === 'internal') continue;

      const tourPath = join(toursDir, `${entry.id}.json`);
      if (!existsSync(tourPath)) continue;

      const tour = JSON.parse(readFileSync(tourPath, 'utf8'));
      const scenes = Object.values(tour.scenes ?? {})
        .map((scene) => ({
          id: scene.id,
          title: scene.title ?? scene.id,
        }))
        .sort((a, b) =>
          a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
        );

      tours.push({
        id: entry.id,
        name: entry.name ?? tour.title ?? entry.id,
        clientName: client.name,
        firstScene: tour.firstScene,
        scenes,
      });
    }
  }

  tours.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

  writeFileSync(outPath, `${JSON.stringify({ tours }, null, 2)}\n`, 'utf8');
  console.log(`Wrote embed-test-manifest.json (${tours.length} tours)`);
}

const isMain = process.argv[1]?.endsWith('generate-embed-test-manifest.mjs');
if (isMain) {
  generateEmbedTestManifest();
}
