/**
 * Shared panorama encode settings — Dev upload, JPG→WebP CLI, and optional
 * recompress all use the same max width + WebP quality.
 *
 * Env (any alias works):
 *   PANORAMA_MAX_WIDTH / WEBP_MAX_WIDTH     default 8192
 *   PANORAMA_WEBP_QUALITY / WEBP_QUALITY     default 90
 *
 * Byte size is not capped — complex outdoor scenes stay larger at the same
 * settings; do not force a uniform MB budget.
 */
import sharp from 'sharp';

export const PANORAMA_MAX_WIDTH = Number(
  process.env.PANORAMA_MAX_WIDTH ?? process.env.WEBP_MAX_WIDTH ?? 8192,
);

export const PANORAMA_WEBP_QUALITY = Number(
  process.env.PANORAMA_WEBP_QUALITY ?? process.env.WEBP_QUALITY ?? 90,
);

/**
 * @param {string | Buffer} input file path or buffer
 * @param {string} outputPath
 * @param {{ quality?: number, maxWidth?: number, effort?: number }} [opts]
 */
export async function encodePanoramaWebp(input, outputPath, opts = {}) {
  const quality = opts.quality ?? PANORAMA_WEBP_QUALITY;
  const maxWidth = opts.maxWidth ?? PANORAMA_MAX_WIDTH;
  const effort = opts.effort ?? 4;

  await sharp(input)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality, effort })
    .toFile(outputPath);
}
