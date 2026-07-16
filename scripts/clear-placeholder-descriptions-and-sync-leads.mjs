/**
 * One-shot: clear default "Explore … virtual tour" scene descriptions,
 * then sync placeLead from NO bodies.
 *
 *   node scripts/clear-placeholder-descriptions-and-sync-leads.mjs [tourId…]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { syncScenePlaceLeadFromNaming } from './lib/scenePlaceLead.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toursDir = path.join(__dirname, '..', 'tours');

function isPlaceholderDescription(tourTitle, sceneTitle, description) {
  const tour = (tourTitle || '').trim() || 'this';
  const scene = (sceneTitle || '').trim() || 'this place';
  const expected = `Explore ${scene} as part of the ${tour} virtual tour.`;
  return description.trim() === expected;
}

const tourIds = process.argv.slice(2);
const files =
  tourIds.length > 0 ?
    tourIds.map((id) =>
      path.join(toursDir, id.endsWith('.json') ? id : `${id}.json`),
    )
  : [
      'ken-sargent-house.json',
      'queensway-carleton-general-hospital.json',
      'queensway-carleton-hospital.json',
    ].map((name) => path.join(toursDir, name));

for (const file of files) {
  const tour = JSON.parse(fs.readFileSync(file, 'utf8'));
  let cleared = 0;
  let synced = 0;

  for (const scene of Object.values(tour.scenes ?? {})) {
    const description = scene.description?.trim() ?? '';
    if (
      description &&
      isPlaceholderDescription(tour.title, scene.title, description)
    ) {
      delete scene.description;
      cleared += 1;
    }
    if (syncScenePlaceLeadFromNaming(tour, scene)) synced += 1;
  }

  fs.writeFileSync(file, `${JSON.stringify(tour, null, 2)}\n`, 'utf8');
  console.log(
    `${path.basename(file)}: cleared=${cleared} placeLeadUpdated=${synced}`,
  );
}
