/**
 * Generate soft `scene.placeLead` copy from naming-opportunity bodies.
 *
 * Priority when writing:
 * - Skip scenes that already have `description` (client place copy wins)
 * - Skip scenes that already have `placeLead` unless `--force`
 * - Only scenes with at least one NO body
 *
 * Auth (optional — without a key, use Cursor/agent bake or paste leads):
 *   OPENAI_API_KEY=… node scripts/generate-scene-place-leads.mjs
 *   OPENAI_API_KEY=… node scripts/generate-scene-place-leads.mjs ken-sargent-house --force
 *
 * Usage:
 *   node scripts/generate-scene-place-leads.mjs [--dry-run] [--force] [tourId…]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const toursDir = path.join(__dirname, '..', 'tours');

const MAX_CHARS = 480;
const MODEL = process.env.OPENAI_PLACE_LEAD_MODEL || 'gpt-4o-mini';

function parseArgs(argv) {
  const flags = new Set();
  const tourIds = [];
  for (const arg of argv) {
    if (arg.startsWith('--')) flags.add(arg);
    else tourIds.push(arg);
  }
  return {
    dryRun: flags.has('--dry-run'),
    force: flags.has('--force'),
    tourIds,
  };
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

function firstNoBody(scene) {
  for (const hotspot of scene.hotspots ?? []) {
    if (!hotspot.popup?.namingOpportunity) continue;
    const body = hotspot.popup.body?.trim();
    if (body) {
      return {
        body,
        name:
          hotspot.popup.namingOpportunity.name?.trim() ||
          hotspot.popup.title?.trim() ||
          '',
      };
    }
  }
  return null;
}

function candidatesForTour(tour, { force }) {
  const out = [];
  for (const scene of Object.values(tour.scenes ?? {})) {
    if (scene.description?.trim()) continue;
    if (!force && scene.placeLead?.trim()) continue;
    const no = firstNoBody(scene);
    if (!no) continue;
    out.push({ scene, no });
  }
  return out;
}

function buildPrompt(sceneTitle, namingName, body) {
  return `Rewrite the naming-opportunity copy into a place lead for a virtual-tour Explore panel.

Rules:
- About 2–4 sentences (${MAX_CHARS} characters or fewer)
- Describe the place for visitors (not a donation pitch)
- No "Naming Opportunity", price, CTA, or "your support"
- Keep the tone warm and concrete
- Output ONLY the lead text, no quotes or preamble

Place title: ${sceneTitle}
Naming name: ${namingName || '(none)'}

Source copy:
${body}`;
}

async function generateWithOpenAI(prompt) {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'OPENAI_API_KEY is not set. Export a key, or bake placeLead another way.',
    );
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You write concise place leads for nonprofit virtual tours. Output plain text only.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI ${response.status}: ${detail.slice(0, 400)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() ?? '';
  return text.replace(/^["“]|["”]$/g, '').trim();
}

async function main() {
  const { dryRun, force, tourIds } = parseArgs(process.argv.slice(2));
  const files = listTourFiles(tourIds);
  let written = 0;
  let skipped = 0;

  for (const file of files) {
    const tour = JSON.parse(fs.readFileSync(file, 'utf8'));
    const candidates = candidatesForTour(tour, { force });
    console.log(
      `\n${path.basename(file)}: ${candidates.length} scene(s) to generate`,
    );

    for (const { scene, no } of candidates) {
      const prompt = buildPrompt(scene.title, no.name, no.body);
      if (dryRun) {
        console.log(`  [dry-run] ${scene.id}`);
        skipped += 1;
        continue;
      }

      const lead = await generateWithOpenAI(prompt);
      if (!lead) {
        console.warn(`  skip ${scene.id}: empty model output`);
        skipped += 1;
        continue;
      }

      scene.placeLead = lead;
      written += 1;
      console.log(`  ${scene.id}: ${lead}`);
    }

    if (!dryRun && candidates.length > 0) {
      fs.writeFileSync(file, `${JSON.stringify(tour, null, 2)}\n`, 'utf8');
    }
  }

  console.log(`\nDone. wrote=${written} skipped=${skipped}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
