import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const MAX_BRAND_FETCH_BYTES = 2 * 1024 * 1024;
const FETCH_USER_AGENT = 'ishare-dev-tour/1.0';

function syncAssetToPublic(root, assetsFilePath, webPath) {
  const relative = webPath.replace(/^\/assets\//, '');
  const publicPath = join(root, 'public', 'assets', relative);
  mkdirSync(dirname(publicPath), { recursive: true });
  copyFileSync(assetsFilePath, publicPath);
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
    const pngBuffer = await sharp(buffer).png().toBuffer();
    return { base64: pngBuffer.toString('base64'), fileName: 'suggested.png' };
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
  const faviconWebPath = `/assets/${clientId}/favicon.png`;
  const logoFilePath = join(assetsRoot, clientId, 'brand', 'logo.png');
  const faviconFilePath = join(assetsRoot, clientId, 'favicon.png');

  let savedLogo = false;
  let savedFavicon = false;

  if (logoFileBuffer?.length) {
    mkdirSync(dirname(logoFilePath), { recursive: true });
    await sharp(logoFileBuffer).png().toFile(logoFilePath);
    syncAssetToPublic(root, logoFilePath, logoWebPath);
    savedLogo = true;
  }

  let faviconBuffer = faviconFileBuffer;
  if (!faviconBuffer?.length && logoFileBuffer?.length) {
    faviconBuffer = await sharp(logoFileBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  }

  if (faviconBuffer?.length) {
    mkdirSync(dirname(faviconFilePath), { recursive: true });
    await sharp(faviconBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(faviconFilePath);
    syncAssetToPublic(root, faviconFilePath, faviconWebPath);
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
  const faviconWebPath = `/assets/${clientId}/${tourId}/favicon.png`;
  const logoFilePath = join(assetsRoot, clientId, tourId, 'brand', 'logo.png');
  const faviconFilePath = join(assetsRoot, clientId, tourId, 'favicon.png');

  let savedLogo = false;
  let savedFavicon = false;

  if (logoFileBuffer?.length) {
    mkdirSync(dirname(logoFilePath), { recursive: true });
    await sharp(logoFileBuffer).png().toFile(logoFilePath);
    syncAssetToPublic(root, logoFilePath, logoWebPath);
    savedLogo = true;
  }

  let faviconBuffer = faviconFileBuffer;
  if (!faviconBuffer?.length && logoFileBuffer?.length) {
    faviconBuffer = await sharp(logoFileBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
  }

  if (faviconBuffer?.length) {
    mkdirSync(dirname(faviconFilePath), { recursive: true });
    await sharp(faviconBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(faviconFilePath);
    syncAssetToPublic(root, faviconFilePath, faviconWebPath);
    savedFavicon = true;
  }

  return { savedLogo, savedFavicon, logoWebPath, faviconWebPath };
}
