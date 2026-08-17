import {
  existsSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { readTourJson, resolveTourJsonPath } from './tourSceneDev.mjs';

function readCatalogJson(toursDir) {
  const catalogPath = join(toursDir, 'catalog.json');
  if (!existsSync(catalogPath)) {
    throw new Error('catalog.json not found');
  }
  return JSON.parse(readFileSync(catalogPath, 'utf8'));
}

function writeCatalogJson(toursDir, catalog) {
  const catalogPath = join(toursDir, 'catalog.json');
  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
}

function removeTourFromCatalog(catalog, clientId, tourId) {
  const client = catalog.clients?.find((entry) => entry.id === clientId);
  if (client?.tours) {
    client.tours = client.tours.filter((entry) => entry.id !== tourId);
  }

  catalog.clients = (catalog.clients ?? []).filter(
    (entry) => (entry.tours?.length ?? 0) > 0,
  );
}

function findRedirectTourId(catalog) {
  for (const client of catalog.clients ?? []) {
    for (const tour of client.tours ?? []) {
      if (tour.visibility !== 'internal') {
        return tour.id;
      }
    }
  }

  for (const client of catalog.clients ?? []) {
    const first = client.tours?.[0];
    if (first) return first.id;
  }

  return null;
}

function removePathIfExists(path) {
  if (!existsSync(path)) return false;
  rmSync(path, { recursive: true, force: true });
  return true;
}

export function validateDeleteTourPayload(body) {
  const { tourId, confirmTourId } = body ?? {};
  const normalizedTourId = tourId?.trim();
  const normalizedConfirm = confirmTourId?.trim();

  if (!normalizedTourId) {
    throw new Error('tourId is required');
  }
  if (!normalizedConfirm) {
    throw new Error('confirmTourId is required');
  }
  if (normalizedTourId !== normalizedConfirm) {
    throw new Error('confirmTourId must match tourId');
  }

  return { tourId: normalizedTourId, confirmTourId: normalizedConfirm };
}

export function deleteTour({ root, toursDir, assetsRoot, tourId }) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const clientId = tour.clientId ?? tour.id;

  const catalog = readCatalogJson(toursDir);
  const hadCatalogEntry = catalog.clients?.some((client) =>
    client.tours?.some((entry) => entry.id === tourId),
  );
  removeTourFromCatalog(catalog, clientId, tourId);
  writeCatalogJson(toursDir, catalog);

  const knowledgePath = join(toursDir, `${tourId}-knowledge.json`);
  const hadKnowledge = existsSync(knowledgePath);
  if (hadKnowledge) {
    unlinkSync(knowledgePath);
  }
  unlinkSync(tourPath);

  const assetsDir = join(assetsRoot, clientId, tourId);
  const publicAssetsDir = join(root, 'public', 'assets', clientId, tourId);
  const removedAssetsDir = removePathIfExists(assetsDir);
  const removedPublicAssetsDir = removePathIfExists(publicAssetsDir);

  return {
    tourId,
    clientId,
    redirectTourId: findRedirectTourId(catalog),
    removed: {
      tourJson: true,
      knowledgeJson: hadKnowledge,
      catalogEntry: hadCatalogEntry,
      assetsDir: removedAssetsDir,
      publicAssetsDir: removedPublicAssetsDir,
    },
  };
}
