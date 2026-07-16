/**
 * Sync soft `scene.placeLead` from naming-opportunity bodies (no API).
 *
 * Skips scenes that already have `description` (client place copy wins).
 *
 * Usage:
 *   node scripts/sync-scene-place-leads.mjs [--dry-run] [tourId…]
 *   node scripts/sync-scene-place-leads.mjs ken-sargent-house
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncScenePlaceLeadFromNaming } from './lib/scenePlaceLead.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toursDir = path.join(__dirname, '..', 'tours');

function parseArgs(argv) {
  const flags = new Set();
  const tourIds = [];
  for (const arg of argv) {
    if (arg.startsWith('--')) flags.add(arg);
    else tourIds.push(arg);
  }
  return { dryRun: flags.has('--dry-run'), tourIds };
}

function listTourFiles(tourIds) {
  const all = fs
    .readdirSync(toursDir)
    .filter(
      (name) =>
        name.endsWith('.json') &&
        name !== 'catalog.json' &&
        !name.includes('knowledge'),
    )
    .sort();

  if (tourIds.length === 0) return all.map((name) => path.join(toursDir, name));

  return tourIds.map((id) => {
    const file = path.join(toursDir, id.endsWith('.json') ? id : `${id}.json`);
    if (!fs.existsSync(file)) {
      throw new Error(`Tour not found: ${file}`);
    }
    return file;
  });
}

function main() {
  const { dryRun, tourIds } = parseArgs(process.argv.slice(2));
  const files = listTourFiles(tourIds);
  let updated = 0;
  let unchanged = 0;

  for (const file of files) {
    const tour = JSON.parse(fs.readFileSync(file, 'utf8'));
    let fileChanged = false;
    console.log(`\n${path.basename(file)}`);

    for (const scene of Object.values(tour.scenes ?? {})) {
      if (scene.description?.trim()) {
        unchanged += 1;
        continue;
      }
      const before = scene.placeLead?.trim() ?? '';
      const changed = syncScenePlaceLeadFromNaming(tour, scene);
      if (!changed) {
        unchanged += 1;
        continue;
      }
      fileChanged = true;
      updated += 1;
      const after = scene.placeLead?.trim() ?? '';
      console.log(`  ${scene.id}: ${before.length} → ${after.length} chars`);
      if (after)
        console.log(
          `    ${after.slice(0, 120)}${after.length > 120 ? '…' : ''}`,
        );
    }

    if (!dryRun && fileChanged) {
      fs.writeFileSync(file, `${JSON.stringify(tour, null, 2)}\n`, 'utf8');
    }
  }

  console.log(
    `\nDone. updated=${updated} unchanged=${unchanged}${dryRun ? ' (dry-run)' : ''}`,
  );
}

main();
