/**
 * Node-side rectilinear preview from equirect panoramas.
 * Mirrors src/utils/equirectPreviewRender.ts for build-time thumbnail baking.
 */
import { join } from 'node:path';
import sharp from 'sharp';

const PREVIEW_ASPECT = 10 / 16;
const PSV_MIN_FOV = 18;
const PSV_MAX_FOV = 105;

function toPsvZoom(zoom) {
  if (zoom === undefined || zoom === 0) return 50;
  return zoom;
}

function psvZoomLevelToVerticalFov(zoomLvl) {
  const t = Math.max(0, Math.min(100, zoomLvl)) / 100;
  return PSV_MAX_FOV - t * (PSV_MAX_FOV - PSV_MIN_FOV);
}

function viewPositionToVerticalFov(view) {
  return psvZoomLevelToVerticalFov(toPsvZoom(view.zoom));
}

function normalize(v) {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a, b) {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function buildCameraBasis(yawDeg, pitchDeg) {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const sinY = Math.sin(yaw);
  const cosY = Math.cos(yaw);
  const forward = { x: sinY * cosP, y: sinP, z: cosY * cosP };
  let right = cross({ x: 0, y: 1, z: 0 }, forward);
  if (Math.hypot(right.x, right.y, right.z) < 1e-6) {
    right = { x: 1, y: 0, z: 0 };
  }
  right = normalize(right);
  const up = normalize(cross(forward, right));
  return { forward, right, up };
}

function sampleBilinear(px, width, height, u, v) {
  u = ((u % 1) + 1) % 1;
  v = Math.max(0, Math.min(1, v));

  const x = u * (width - 1);
  const y = v * (height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const tx = x - x0;
  const ty = y - y0;

  const i00 = (y0 * width + x0) * 4;
  const i10 = (y0 * width + x1) * 4;
  const i01 = (y1 * width + x0) * 4;
  const i11 = (y1 * width + x1) * 4;

  const out = [0, 0, 0, 255];
  for (let c = 0; c < 3; c += 1) {
    out[c] = Math.round(
      px[i00 + c] * (1 - tx) * (1 - ty) +
        px[i10 + c] * tx * (1 - ty) +
        px[i01 + c] * (1 - tx) * ty +
        px[i11 + c] * tx * ty,
    );
  }
  return out;
}

function directionToEquirectUv(dir) {
  const lon = Math.atan2(dir.x, dir.z);
  const lat = Math.asin(Math.max(-1, Math.min(1, dir.y)));
  return { u: lon / (2 * Math.PI) + 0.5, v: 0.5 - lat / Math.PI };
}

async function loadPanoramaPixels(panoramaPath, maxWidth = 2048) {
  const pipeline = sharp(panoramaPath);
  const meta = await pipeline.metadata();
  const sourceWidth = meta.width ?? maxWidth;
  const sourceHeight = meta.height ?? Math.round(maxWidth / 2);
  const scale = Math.min(1, maxWidth / sourceWidth);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const { data } = await pipeline
    .resize(width, height)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return { width, height, data };
}

function renderRectilinearPreview(src, view, width, height) {
  const { forward, right, up } = buildCameraBasis(view.yaw, view.pitch);
  const vFovRad = (viewPositionToVerticalFov(view) * Math.PI) / 180;
  const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * (width / height));
  const tanHalfH = Math.tan(hFovRad / 2);
  const tanHalfV = Math.tan(vFovRad / 2);
  const out = Buffer.alloc(width * height * 4);

  for (let py = 0; py < height; py += 1) {
    const sy = (1 - (2 * py) / height) * tanHalfV;
    for (let px = 0; px < width; px += 1) {
      const sx = ((2 * px) / width - 1) * tanHalfH;
      const ray = normalize({
        x: forward.x + right.x * sx + up.x * sy,
        y: forward.y + right.y * sx + up.y * sy,
        z: forward.z + right.z * sx + up.z * sy,
      });
      const { u, v } = directionToEquirectUv(ray);
      const [r, g, b, a] = sampleBilinear(
        src.data,
        src.width,
        src.height,
        u,
        v,
      );
      const i = (py * width + px) * 4;
      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
      out[i + 3] = a;
    }
  }

  return out;
}

/**
 * @param {string} panoramaPath absolute filesystem path
 * @param {{ yaw: number, pitch: number, zoom?: number }} view
 * @param {string} outputPath absolute filesystem path
 * @param {{ width?: number, quality?: number }} [options]
 */
export async function renderEquirectPreviewToFile(
  panoramaPath,
  view,
  outputPath,
  options = {},
) {
  const width = options.width ?? 640;
  const height = Math.round(width * PREVIEW_ASPECT);
  const quality = options.quality ?? 85;
  const src = await loadPanoramaPixels(panoramaPath);
  const pixels = renderRectilinearPreview(src, view, width, height);

  await sharp(pixels, { raw: { width, height, channels: 4 } })
    .webp({ quality, effort: 4 })
    .toFile(outputPath);
}

export function resolveThumbnailWebPath(panoramaWebPath, sceneId) {
  const normalized = panoramaWebPath.replace(/\\/g, '/');
  const marker = '/panoramas/';
  const index = normalized.indexOf(marker);
  if (index === -1) {
    throw new Error(
      `Cannot derive thumbnail path from panorama: ${panoramaWebPath}`,
    );
  }
  const prefix = normalized.slice(0, index);
  return `${prefix}/thumbnails/${sceneId}.webp`;
}

export function resolveThumbnailFilePath(assetsRoot, thumbnailWebPath) {
  const relative = thumbnailWebPath.replace(/^\/assets\//, '');
  return join(assetsRoot, relative);
}
