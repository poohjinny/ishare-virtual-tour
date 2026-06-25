import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join } from 'node:path';
import sharp from 'sharp';
import {
  readTourJson,
  resolveTourJsonPath,
  writeTourJson,
} from './tourSceneDev.mjs';

const ALLOWED_FLOOR_PLAN_EXTENSIONS = new Set([
  'svg',
  'png',
  'jpg',
  'jpeg',
  'webp',
]);

function syncAssetToPublic(root, assetsFilePath, webPath) {
  const relative = webPath.replace(/^\/assets\//, '');
  const publicPath = join(root, 'public', 'assets', relative);
  mkdirSync(dirname(publicPath), { recursive: true });
  copyFileSync(assetsFilePath, publicPath);
}

function assertFloorPlanFileName(fileName) {
  const ext = extname(fileName ?? '')
    .slice(1)
    .toLowerCase();
  if (!ALLOWED_FLOOR_PLAN_EXTENSIONS.has(ext)) {
    throw new Error('Floor plan must be svg, png, jpg, or webp');
  }
  return ext === 'jpeg' ? 'jpg' : ext;
}

function resolveSvgDimensions(buffer) {
  const text = buffer.toString('utf8');
  const viewBoxMatch = text.match(/viewBox=["']([^"']+)["']/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    if (parts.length >= 4 && parts[2] > 0 && parts[3] > 0) {
      return { width: Math.round(parts[2]), height: Math.round(parts[3]) };
    }
  }

  const widthMatch = text.match(/\bwidth=["']([\d.]+)/i);
  const heightMatch = text.match(/\bheight=["']([\d.]+)/i);
  if (widthMatch && heightMatch) {
    return {
      width: Math.round(Number(widthMatch[1])),
      height: Math.round(Number(heightMatch[1])),
    };
  }

  return null;
}

async function resolveFloorPlanDimensions(buffer, ext, width, height) {
  const parsedWidth = Number(width);
  const parsedHeight = Number(height);
  if (
    Number.isFinite(parsedWidth) &&
    parsedWidth > 0 &&
    Number.isFinite(parsedHeight) &&
    parsedHeight > 0
  ) {
    return { width: Math.round(parsedWidth), height: Math.round(parsedHeight) };
  }

  if (ext === 'svg') {
    const dims = resolveSvgDimensions(buffer);
    if (dims) return dims;
    throw new Error(
      'SVG floor plan requires width and height fields (or viewBox in the file)',
    );
  }

  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) {
    throw new Error('Could not read floor plan image dimensions');
  }

  return { width: meta.width, height: meta.height };
}

function removeExistingFloorPlanFiles(mapsDir) {
  if (!existsSync(mapsDir)) return;
  for (const name of readdirSync(mapsDir)) {
    if (name.startsWith('floorplan.')) {
      unlinkSync(join(mapsDir, name));
    }
  }
}

export function validateUpdateTourFloorPlanPayload(body) {
  const {
    tourId,
    floorPlanFileBase64,
    floorPlanFileName,
    width,
    height,
    clearFloorPlan,
  } = body ?? {};

  if (!tourId?.trim()) {
    throw new Error('tourId is required');
  }

  if (clearFloorPlan === true) {
    return { tourId: tourId.trim(), clearFloorPlan: true };
  }

  let floorPlanFileBuffer = null;
  if (floorPlanFileBase64) {
    floorPlanFileBuffer = Buffer.from(floorPlanFileBase64, 'base64');
    if (!floorPlanFileBuffer.length) {
      throw new Error('Floor plan file is empty');
    }
    assertFloorPlanFileName(floorPlanFileName);
  }

  const hasWidth =
    width !== undefined && width !== null && `${width}`.trim() !== '';
  const hasHeight =
    height !== undefined && height !== null && `${height}`.trim() !== '';

  if (!floorPlanFileBuffer && !(hasWidth && hasHeight)) {
    throw new Error(
      'floorPlanFile or both width and height are required (unless clearFloorPlan is true)',
    );
  }

  return {
    tourId: tourId.trim(),
    floorPlanFileBuffer,
    floorPlanFileName,
    width: hasWidth ? Number(width) : undefined,
    height: hasHeight ? Number(height) : undefined,
    clearFloorPlan: false,
  };
}

export async function updateTourFloorPlan({
  root,
  toursDir,
  assetsRoot,
  tourId,
  floorPlanFileBuffer,
  floorPlanFileName,
  width,
  height,
}) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const clientId = tour.clientId ?? tour.id;
  const mapsDir = join(assetsRoot, clientId, tourId, 'maps');

  if (floorPlanFileBuffer?.length) {
    const ext = assertFloorPlanFileName(floorPlanFileName);
    const dims = await resolveFloorPlanDimensions(
      floorPlanFileBuffer,
      ext,
      width,
      height,
    );
    mkdirSync(mapsDir, { recursive: true });
    removeExistingFloorPlanFiles(mapsDir);

    const fileName = `floorplan.${ext}`;
    const filePath = join(mapsDir, fileName);
    const webPath = `/assets/${clientId}/${tourId}/maps/${fileName}`;

    writeFileSync(filePath, floorPlanFileBuffer);
    syncAssetToPublic(root, filePath, webPath);

    tour.floorPlan = { image: webPath, width: dims.width, height: dims.height };
  } else if (tour.floorPlan) {
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error('width and height must be positive numbers');
    }
    tour.floorPlan.width = Math.round(width);
    tour.floorPlan.height = Math.round(height);
  } else {
    throw new Error('Upload a floor plan image first');
  }

  writeTourJson(tourPath, tour);
  return { tourPath, tour, floorPlan: tour.floorPlan };
}

export function clearTourFloorPlan({ root, toursDir, assetsRoot, tourId }) {
  const tourPath = resolveTourJsonPath(toursDir, tourId);
  const tour = readTourJson(tourPath);
  const clientId = tour.clientId ?? tour.id;
  const mapsDir = join(assetsRoot, clientId, tourId, 'maps');

  if (tour.floorPlan?.image) {
    const relative = tour.floorPlan.image.replace(/^\/assets\//, '');
    const filePath = join(assetsRoot, relative);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
    const publicPath = join(root, 'public', 'assets', relative);
    if (existsSync(publicPath)) {
      unlinkSync(publicPath);
    }
  }

  removeExistingFloorPlanFiles(mapsDir);
  delete tour.floorPlan;
  writeTourJson(tourPath, tour);

  return { tourPath, tour };
}
