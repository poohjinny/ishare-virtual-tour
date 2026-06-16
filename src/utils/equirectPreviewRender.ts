import type { ViewPosition } from '../types/tour';
import { viewPositionToVerticalFov } from './psvZoom';

const PREVIEW_WIDTH = 640;
const PREVIEW_ASPECT = 10 / 16;

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function buildCameraBasis(yawDeg: number, pitchDeg: number) {
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

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load panorama: ${url}`));
    img.src = url;
  });
}

function sampleBilinear(
  data: ImageData,
  u: number,
  v: number,
): [number, number, number, number] {
  const { width, height, data: px } = data;
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

  const out: [number, number, number, number] = [0, 0, 0, 255];
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

function directionToEquirectUv(dir: Vec3): { u: number; v: number } {
  const lon = Math.atan2(dir.x, dir.z);
  const lat = Math.asin(Math.max(-1, Math.min(1, dir.y)));
  return { u: lon / (2 * Math.PI) + 0.5, v: 0.5 - lat / Math.PI };
}

/** Render a rectilinear preview from an equirectangular panorama at a tour view. */
export async function renderEquirectPreview(
  panoramaUrl: string,
  view: ViewPosition,
  width = PREVIEW_WIDTH,
  height = Math.round(PREVIEW_WIDTH * PREVIEW_ASPECT),
): Promise<string> {
  const img = await loadImage(panoramaUrl);
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = img.naturalWidth;
  srcCanvas.height = img.naturalHeight;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) throw new Error('Canvas not supported');
  srcCtx.drawImage(img, 0, 0);
  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const { forward, right, up } = buildCameraBasis(view.yaw, view.pitch);
  const vFovRad = (viewPositionToVerticalFov(view) * Math.PI) / 180;
  const hFovRad = 2 * Math.atan(Math.tan(vFovRad / 2) * (width / height));
  const tanHalfH = Math.tan(hFovRad / 2);
  const tanHalfV = Math.tan(vFovRad / 2);

  const out = ctx.createImageData(width, height);

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
      const [r, g, b, a] = sampleBilinear(srcData, u, v);
      const i = (py * width + px) * 4;
      out.data[i] = r;
      out.data[i + 1] = g;
      out.data[i + 2] = b;
      out.data[i + 3] = a;
    }
  }

  ctx.putImageData(out, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Preview encode failed'));
      },
      'image/jpeg',
      0.88,
    );
  });

  return URL.createObjectURL(blob);
}
