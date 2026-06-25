import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readTourJson, resolveTourJsonPath } from './tourSceneDev.mjs';

export function resolveKnowledgeJsonPath(toursDir, tourId) {
  return join(toursDir, `${tourId}-knowledge.json`);
}

function emptySceneKnowledge(sceneId, sceneTitle) {
  return {
    title: sceneTitle ?? sceneId,
    description: '',
    facts: [],
    faqs: [],
    suggestedQuestions: [],
  };
}

export function buildKnowledgeStub(toursDir, tourId) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const scenes = {};

  for (const [sceneId, scene] of Object.entries(tour.scenes ?? {})) {
    scenes[sceneId] = emptySceneKnowledge(sceneId, scene.title);
  }

  return {
    id: tourId,
    url: tour.url ?? tour.organization?.website ?? 'https://example.com',
    global: { facilityName: tour.title, summary: '' },
    scenes,
  };
}

export function readKnowledgeJson(toursDir, tourId) {
  const knowledgePath = resolveKnowledgeJsonPath(toursDir, tourId);
  if (!existsSync(knowledgePath)) {
    return { knowledgePath, knowledge: null, missing: true };
  }

  const knowledge = JSON.parse(readFileSync(knowledgePath, 'utf8'));
  return { knowledgePath, knowledge, missing: false };
}

function assertOptionalString(value, label) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string`);
  }
  return value;
}

function assertStringArray(value, label) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }

  return value
    .map((item, index) => {
      if (typeof item !== 'string') {
        throw new Error(`${label}[${index}] must be a string`);
      }
      return item.trim();
    })
    .filter(Boolean);
}

function assertFaqs(value) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new Error('faqs must be an array');
  }

  return value.map((entry, index) => {
    const q = assertOptionalString(entry?.q, `faqs[${index}].q`);
    const a = assertOptionalString(entry?.a, `faqs[${index}].a`);
    if (!q?.trim() || !a?.trim()) {
      throw new Error(`faqs[${index}] requires both q and a`);
    }
    return { q: q.trim(), a: a.trim() };
  });
}

export function validateUpdateKnowledgePayload(body) {
  const { tourId, url, global, sceneId, scene } = body ?? {};
  if (!tourId?.trim()) {
    throw new Error('tourId is required');
  }

  if (url !== undefined && typeof url !== 'string') {
    throw new Error('url must be a string');
  }

  let globalPatch;
  if (global !== undefined) {
    if (typeof global !== 'object' || global === null) {
      throw new Error('global must be an object');
    }
    globalPatch = {
      facilityName: assertOptionalString(
        global.facilityName,
        'global.facilityName',
      ),
      summary: assertOptionalString(global.summary, 'global.summary'),
    };
  }

  let scenePatch;
  if (scene !== undefined) {
    if (!sceneId?.trim()) {
      throw new Error('sceneId is required when scene is provided');
    }
    if (typeof scene !== 'object' || scene === null) {
      throw new Error('scene must be an object');
    }
    scenePatch = {
      title: assertOptionalString(scene.title, 'scene.title'),
      description: assertOptionalString(scene.description, 'scene.description'),
      facts: assertStringArray(scene.facts, 'scene.facts'),
      faqs: assertFaqs(scene.faqs),
      suggestedQuestions: assertStringArray(
        scene.suggestedQuestions,
        'scene.suggestedQuestions',
      ),
    };
  }

  return {
    tourId: tourId.trim(),
    url,
    global: globalPatch,
    sceneId: sceneId?.trim(),
    scene: scenePatch,
  };
}

export function updateKnowledge({
  toursDir,
  tourId,
  url,
  global: globalPatch,
  sceneId,
  scene: scenePatch,
}) {
  const knowledgePath = resolveKnowledgeJsonPath(toursDir, tourId);
  const existing = readKnowledgeJson(toursDir, tourId);
  const knowledge = existing.knowledge ?? buildKnowledgeStub(toursDir, tourId);

  if (url !== undefined) {
    knowledge.url = url.trim();
  }

  if (globalPatch) {
    knowledge.global = knowledge.global ?? {};
    if (globalPatch.facilityName !== undefined) {
      knowledge.global.facilityName = globalPatch.facilityName.trim();
    }
    if (globalPatch.summary !== undefined) {
      knowledge.global.summary = globalPatch.summary.trim();
    }
  }

  if (sceneId && scenePatch) {
    knowledge.scenes = knowledge.scenes ?? {};
    const current = knowledge.scenes[sceneId] ?? emptySceneKnowledge(sceneId);

    if (scenePatch.title !== undefined) {
      current.title = scenePatch.title.trim();
    }
    if (scenePatch.description !== undefined) {
      current.description = scenePatch.description.trim();
    }
    if (scenePatch.facts !== undefined) {
      current.facts = scenePatch.facts;
    }
    if (scenePatch.faqs !== undefined) {
      current.faqs = scenePatch.faqs;
    }
    if (scenePatch.suggestedQuestions !== undefined) {
      current.suggestedQuestions = scenePatch.suggestedQuestions;
    }

    knowledge.scenes[sceneId] = current;
  }

  writeFileSync(
    knowledgePath,
    `${JSON.stringify(knowledge, null, 2)}\n`,
    'utf8',
  );
  return { knowledgePath, knowledge, created: existing.missing };
}
