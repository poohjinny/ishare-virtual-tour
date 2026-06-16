import { writeFileSync } from 'node:fs';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const FAVICON_SOURCE_URL =
  'https://holodomor.ca/wp-content/themes/sitegist-theme/img/cropped-favicon-32x32.png';

const sourceResponse = await fetch(FAVICON_SOURCE_URL);
if (!sourceResponse.ok) {
  throw new Error(`Failed to download favicon (${sourceResponse.status})`);
}

const sourceBuffer = Buffer.from(await sourceResponse.arrayBuffer());
const sizes = [16, 32, 48];
const pngBuffers = await Promise.all(
  sizes.map((size) =>
    sharp(sourceBuffer).resize(size, size, { fit: 'contain' }).png().toBuffer(),
  ),
);

const ico = await pngToIco(pngBuffers);
writeFileSync('assets/holodomor/holodomor-museum/favicon.ico', ico);
console.log(`Wrote assets/holodomor/holodomor-museum/favicon.ico (${sizes.join(', ')}px)`);
