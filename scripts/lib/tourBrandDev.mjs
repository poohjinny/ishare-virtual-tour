import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const MAX_BRAND_FETCH_BYTES = 2 * 1024 * 1024;
const FETCH_USER_AGENT = 'ishare-dev-tour/1.0';
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function syncAssetToPublic(root, assetsFilePath, webPath) {
  const relative = webPath.replace(/^\/assets\//, '');
  const publicPath = join(root, 'public', 'assets', relative);
  mkdirSync(dirname(publicPath), { recursive: true });
  copyFileSync(assetsFilePath, publicPath);
}

/** Windows ICONDIR — type 1 = icon. Sharp cannot decode ICO containers. */
function isIcoBuffer(buffer) {
  return (
    Buffer.isBuffer(buffer) &&
    buffer.length >= 6 &&
    buffer.readUInt16LE(0) === 0 &&
    buffer.readUInt16LE(2) === 1
  );
}

/**
 * Modern .ico files often embed PNG images. Extract the largest PNG payload
 * so we can rasterize with sharp (no new dependency).
 */
function extractLargestPngFromIco(buffer) {
  if (!isIcoBuffer(buffer)) return null;
  const count = buffer.readUInt16LE(4);
  if (count < 1 || buffer.length < 6 + count * 16) return null;

  let best = null;
  let bestArea = -1;
  for (let i = 0; i < count; i += 1) {
    const entryOffset = 6 + i * 16;
    const widthByte = buffer[entryOffset] ?? 0;
    const heightByte = buffer[entryOffset + 1] ?? 0;
    const width = widthByte === 0 ? 256 : widthByte;
    const height = heightByte === 0 ? 256 : heightByte;
    const bytesInRes = buffer.readUInt32LE(entryOffset + 8);
    const imageOffset = buffer.readUInt32LE(entryOffset + 12);
    if (
      !Number.isFinite(bytesInRes) ||
      !Number.isFinite(imageOffset) ||
      bytesInRes < 8 ||
      imageOffset + bytesInRes > buffer.length
    ) {
      continue;
    }
    const slice = buffer.subarray(imageOffset, imageOffset + bytesInRes);
    if (!slice.subarray(0, 4).equals(PNG_MAGIC)) continue;
    const area = width * height;
    if (area >= bestArea) {
      bestArea = area;
      best = Buffer.from(slice);
    }
  }
  return best;
}

/**
 * Normalize uploaded / fetched brand rasters to PNG.
 * ICO → embedded PNG when present; otherwise callers may fall back to raw .ico.
 */
async function brandImageToPngBuffer(buffer, { resize } = {}) {
  let source = buffer;
  if (isIcoBuffer(buffer)) {
    const png = extractLargestPngFromIco(buffer);
    if (!png) {
      const error = new Error(
        'Favicon .ico has no embedded PNG (legacy BMP-only ICO).',
      );
      error.code = 'ICO_WITHOUT_PNG';
      throw error;
    }
    source = png;
  }

  let pipeline = sharp(source);
  if (resize) {
    pipeline = pipeline.resize(resize, resize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }
  return pipeline.png().toBuffer();
}

async function writeFaviconAsset({
  root,
  faviconBuffer,
  pngFilePath,
  pngWebPath,
  icoFilePath,
  icoWebPath,
}) {
  try {
    const pngBuffer = await brandImageToPngBuffer(faviconBuffer, {
      resize: 32,
    });
    mkdirSync(dirname(pngFilePath), { recursive: true });
    writeFileSync(pngFilePath, pngBuffer);
    syncAssetToPublic(root, pngFilePath, pngWebPath);
    return pngWebPath;
  } catch (error) {
    if (isIcoBuffer(faviconBuffer)) {
      // BMP-only / undecodable ICO — keep the original file browsers still accept.
      mkdirSync(dirname(icoFilePath), { recursive: true });
      writeFileSync(icoFilePath, faviconBuffer);
      syncAssetToPublic(root, icoFilePath, icoWebPath);
      return icoWebPath;
    }
    throw error;
  }
}

export function normalizePrimaryColor(color) {
  const raw = color?.trim();
  if (!raw) return null;
  const value = raw.startsWith('#') ? raw.slice(1) : raw;
  if (/^[0-9a-f]{6}$/i.test(value)) {
    return `#${value.toLowerCase()}`;
  }
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return `#${value
      .split('')
      .map((ch) => ch + ch)
      .join('')
      .toLowerCase()}`;
  }
  return null;
}

function resolveAbsoluteUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return null;
  }
}

async function fetchImageBuffer(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': FETCH_USER_AGENT },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status})`);
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    throw new Error('URL returned HTML, not an image');
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (!buffer.length) {
    throw new Error('Image is empty');
  }
  if (buffer.length > MAX_BRAND_FETCH_BYTES) {
    throw new Error('Image is too large (max 2 MB)');
  }
  return buffer;
}

function extractMetaContent(html, name) {
  const patterns = [
    new RegExp(
      `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`,
      'i',
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

function extractLinkHrefs(html, relTest) {
  const hrefs = [];
  const tagPattern = /<link[^>]+>/gi;
  let match = tagPattern.exec(html);
  while (match) {
    const tag = match[0];
    if (relTest.test(tag)) {
      const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
      if (href) hrefs.push(href);
    }
    match = tagPattern.exec(html);
  }
  return hrefs;
}

function extractLogoCandidates(html) {
  const candidates = [];
  const tagPattern = /<img[^>]+>/gi;
  let match = tagPattern.exec(html);
  while (match) {
    const tag = match[0];
    const src = tag.match(/\ssrc=["']([^"']+)["']/i)?.[1];
    if (!src) {
      match = tagPattern.exec(html);
      continue;
    }
    const alt = tag.match(/\salt=["']([^"']*)["']/i)?.[1] ?? '';
    const className = tag.match(/\sclass=["']([^"']*)["']/i)?.[1] ?? '';
    const id = tag.match(/\sid=["']([^"']*)["']/i)?.[1] ?? '';
    const blob = `${src} ${alt} ${className} ${id}`.toLowerCase();
    let score = 0;
    if (/logo/.test(blob)) score += 10;
    if (/brand/.test(blob)) score += 4;
    if (/header|site-identity|navbar|nav/.test(blob)) score += 2;
    if (/banner|hero|slide|background|photo/.test(blob)) score -= 5;
    if (score > 0) {
      candidates.push({ src, score });
    }
    match = tagPattern.exec(html);
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

function pickPrimaryColorGuess(html) {
  const themeColor =
    normalizePrimaryColor(extractMetaContent(html, 'theme-color')) ??
    normalizePrimaryColor(extractMetaContent(html, 'msapplication-TileColor'));
  return themeColor;
}

async function tryFetchImageAsBase64(url) {
  try {
    const buffer = await fetchImageBuffer(url);
    try {
      const pngBuffer = await brandImageToPngBuffer(buffer);
      return {
        base64: pngBuffer.toString('base64'),
        fileName: 'suggested.png',
      };
    } catch (error) {
      // BMP-only favicon.ico — keep raw bytes so save can write .ico.
      if (error?.code === 'ICO_WITHOUT_PNG' && isIcoBuffer(buffer)) {
        return { base64: buffer.toString('base64'), fileName: 'suggested.ico' };
      }
      return null;
    }
  } catch {
    return null;
  }
}

export async function suggestBrandingFromWebsite(websiteUrl) {
  const trimmed = websiteUrl?.trim();
  if (!trimmed) {
    throw new Error('websiteUrl is required');
  }

  let pageUrl;
  try {
    pageUrl = new URL(trimmed);
  } catch {
    throw new Error('websiteUrl must be a valid URL');
  }

  const response = await fetch(pageUrl.href, {
    headers: { 'User-Agent': FETCH_USER_AGENT },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch website (${response.status})`);
  }

  const html = await response.text();
  const notes = [];

  const faviconHrefs = [
    ...extractLinkHrefs(html, /rel=["'][^"']*icon/i),
    '/favicon.ico',
  ];
  const faviconUrls = [
    ...new Set(
      faviconHrefs
        .map((href) => resolveAbsoluteUrl(pageUrl.href, href))
        .filter(Boolean),
    ),
  ];

  let faviconSuggestion = null;
  for (const url of faviconUrls) {
    faviconSuggestion = await tryFetchImageAsBase64(url);
    if (faviconSuggestion) {
      notes.push(`Favicon from ${url}`);
      break;
    }
  }

  const logoCandidates = extractLogoCandidates(html);
  const ogImage = extractMetaContent(html, 'og:image');
  const logoUrls = [
    ...logoCandidates.map((entry) =>
      resolveAbsoluteUrl(pageUrl.href, entry.src),
    ),
    ogImage ? resolveAbsoluteUrl(pageUrl.href, ogImage) : null,
  ].filter(Boolean);

  let logoSuggestion = null;
  for (const url of logoUrls) {
    logoSuggestion = await tryFetchImageAsBase64(url);
    if (logoSuggestion) {
      notes.push(
        url === resolveAbsoluteUrl(pageUrl.href, ogImage) ?
          `Logo fallback from og:image (${url}) — verify manually`
        : `Logo from ${url}`,
      );
      break;
    }
  }

  const primaryColor = pickPrimaryColorGuess(html);
  if (primaryColor) {
    notes.push(`Primary color from meta theme-color (${primaryColor})`);
  } else {
    notes.push(
      'No theme-color meta found — set primary color manually from brand guide',
    );
  }

  return {
    primaryColor,
    faviconFileBase64: faviconSuggestion?.base64 ?? null,
    faviconFileName: faviconSuggestion?.fileName ?? null,
    logoFileBase64: logoSuggestion?.base64 ?? null,
    logoFileName: logoSuggestion?.fileName ?? null,
    notes,
  };
}

export async function saveClientBrandAssets({
  root,
  assetsRoot,
  clientId,
  logoFileBuffer,
  faviconFileBuffer,
}) {
  const logoWebPath = `/assets/${clientId}/brand/logo.png`;
  const logoFilePath = join(assetsRoot, clientId, 'brand', 'logo.png');
  const faviconPngWebPath = `/assets/${clientId}/favicon.png`;
  const faviconPngFilePath = join(assetsRoot, clientId, 'favicon.png');
  const faviconIcoWebPath = `/assets/${clientId}/favicon.ico`;
  const faviconIcoFilePath = join(assetsRoot, clientId, 'favicon.ico');

  let savedLogo = false;
  let savedFavicon = false;
  let faviconWebPath = faviconPngWebPath;

  if (logoFileBuffer?.length) {
    mkdirSync(dirname(logoFilePath), { recursive: true });
    const logoPng = await brandImageToPngBuffer(logoFileBuffer);
    writeFileSync(logoFilePath, logoPng);
    syncAssetToPublic(root, logoFilePath, logoWebPath);
    savedLogo = true;
  }

  let faviconBuffer = faviconFileBuffer;
  if (!faviconBuffer?.length && logoFileBuffer?.length) {
    faviconBuffer = await brandImageToPngBuffer(logoFileBuffer, { resize: 32 });
  }

  if (faviconBuffer?.length) {
    faviconWebPath = await writeFaviconAsset({
      root,
      faviconBuffer,
      pngFilePath: faviconPngFilePath,
      pngWebPath: faviconPngWebPath,
      icoFilePath: faviconIcoFilePath,
      icoWebPath: faviconIcoWebPath,
    });
    savedFavicon = true;
  }

  return { savedLogo, savedFavicon, logoWebPath, faviconWebPath };
}

export async function saveTourBrandAssets({
  root,
  assetsRoot,
  clientId,
  tourId,
  logoFileBuffer,
  faviconFileBuffer,
}) {
  const logoWebPath = `/assets/${clientId}/${tourId}/brand/logo.png`;
  const logoFilePath = join(assetsRoot, clientId, tourId, 'brand', 'logo.png');
  const faviconPngWebPath = `/assets/${clientId}/${tourId}/favicon.png`;
  const faviconPngFilePath = join(assetsRoot, clientId, tourId, 'favicon.png');
  const faviconIcoWebPath = `/assets/${clientId}/${tourId}/favicon.ico`;
  const faviconIcoFilePath = join(assetsRoot, clientId, tourId, 'favicon.ico');

  let savedLogo = false;
  let savedFavicon = false;
  let faviconWebPath = faviconPngWebPath;

  if (logoFileBuffer?.length) {
    mkdirSync(dirname(logoFilePath), { recursive: true });
    const logoPng = await brandImageToPngBuffer(logoFileBuffer);
    writeFileSync(logoFilePath, logoPng);
    syncAssetToPublic(root, logoFilePath, logoWebPath);
    savedLogo = true;
  }

  let faviconBuffer = faviconFileBuffer;
  if (!faviconBuffer?.length && logoFileBuffer?.length) {
    faviconBuffer = await brandImageToPngBuffer(logoFileBuffer, { resize: 32 });
  }

  if (faviconBuffer?.length) {
    faviconWebPath = await writeFaviconAsset({
      root,
      faviconBuffer,
      pngFilePath: faviconPngFilePath,
      pngWebPath: faviconPngWebPath,
      icoFilePath: faviconIcoFilePath,
      icoWebPath: faviconIcoWebPath,
    });
    savedFavicon = true;
  }

  return { savedLogo, savedFavicon, logoWebPath, faviconWebPath };
}
