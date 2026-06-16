import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const svgFont = readFileSync('scripts/hrec-icofont.svg', 'utf8');
const path1 = svgFont.match(/unicode="&#xe900;"[^>]* d="([^"]+)"/)[1];
const path2 = svgFont.match(/unicode="&#xe901;"[^>]* d="([^"]+)"/)[1];

const logoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1689 896">
  <g transform="scale(1,-1) translate(0,-896)">
    <path fill="#000000" d="${path1}"/>
    <path fill="#eec768" d="${path2}"/>
  </g>
</svg>`;

writeFileSync('assets/holodomor/holodomor-museum/brand/logo.svg', logoSvg);

await sharp(Buffer.from(logoSvg))
  .resize(840, null, { fit: 'inside' })
  .png()
  .toFile('assets/holodomor/holodomor-museum/brand/logo.png');

const meta = await sharp('assets/holodomor/holodomor-museum/brand/logo.png').metadata();
console.log(
  `Wrote assets/holodomor/holodomor-museum/brand/logo.png (${meta.width}x${meta.height})`,
);
