/**
 * Bot / social-crawler Open Graph edge for tour.ishare.ca.
 *
 * - Known crawler UAs → 200 HTML with tour/scene/naming og:* (no JS).
 * - Everyone else → proxy GitHub Pages; deep-link 404 → SPA shell 200.
 * - og:image → /__og/jpg/{tourId}/{sceneId}.jpg (R2 bake-on-miss via Images).
 * - Share warm: POST /__og/ensure { tourId, sceneId, no? }.
 *
 * Origin fetches use resolveOverride so subrequests do not re-enter this Worker.
 */

const BOT_UA =
  /facebookexternalhit|Facebot|facebookcatalog|meta-externalagent|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp\/|TelegramBot|SkypeUriPreview|Pinterest|redditbot|Embedly|Iframely|Quora Link Preview|Showyoubot|outbrain|vkShare|W3C_Validator|bingbot|Googlebot|Applebot|iMessageBot|Slack-ImgProxy|kakaotalk-scrap|Linespider|LineBot|BitlyBot|Snapchat|PetalBot/i;

const DESC_MAX = 220;
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const TOUR_ID_RE = /^t_[a-z0-9]+$/i;
const SCENE_ID_RE = /^s_[a-z0-9]+$/i;
const SLUG_RE = /^[a-z0-9-]+$/i;
const NO_RE = /^[a-z0-9][a-z0-9_-]{0,120}$/i;

/** Served by the Worker so Cloudflare Managed robots.txt does not replace it. */
const ROBOTS_TXT = `# Allow social link-preview crawlers (Facebook, Kakao, Slack, etc.).
User-agent: *
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: Facebot
Allow: /

User-agent: meta-externalagent
Allow: /

User-agent: meta-externalfetcher
Allow: /

User-agent: KakaoTalk
Allow: /

User-agent: kakaotalk-scrap
Allow: /

User-agent: Daum
Allow: /

User-agent: WhatsApp
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: LinkedInBot
Allow: /

User-agent: Slackbot
Allow: /
`;

export default {
  async fetch(request, env, ctx) {
    const publicOrigin = (
      env.PUBLIC_ORIGIN ||
      env.ORIGIN ||
      'https://tour.ishare.ca'
    ).replace(/\/$/, '');
    const url = new URL(request.url);

    if (url.pathname === '/robots.txt') {
      return robotsResponse();
    }

    // Public JPEG path (prefer /og/jpg — __og kept as alias for old shares).
    if (url.pathname === '/og/ensure' || url.pathname === '/__og/ensure') {
      return handleEnsure(request, env, publicOrigin, ctx);
    }

    const jpgMatch = url.pathname.match(
      /^\/(?:__)?og\/jpg\/([^/]+)\/([^/]+)\.jpe?g$/i,
    );
    if (jpgMatch) {
      return handleOgJpegGet(
        request,
        env,
        publicOrigin,
        jpgMatch[1],
        jpgMatch[2],
        ctx,
      );
    }

    if (url.pathname.startsWith('/__og/') || url.pathname.startsWith('/og/')) {
      return new Response('Not found', { status: 404 });
    }

    if (isAssetOrApiPath(url.pathname)) {
      return proxyToOrigin(request, env);
    }

    if (shouldServeOpenGraph(request, url.pathname)) {
      try {
        const html = await buildBotHtml(url, publicOrigin, env, ctx);
        if (html) return openGraphResponse(html);
      } catch (error) {
        console.error('tour-og bot html failed', error);
      }
    }

    return proxySpa(request, env);
  },
};

function robotsResponse() {
  const bytes = new TextEncoder().encode(ROBOTS_TXT);
  return fixedLengthResponse(bytes, {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'public, max-age=300',
  });
}

function shouldServeOpenGraph(request, pathname) {
  if (!isTourDeepLink(pathname)) return false;
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  const ua = request.headers.get('user-agent') || '';
  return BOT_UA.test(ua);
}

function isTourDeepLink(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return false;
  return TOUR_ID_RE.test(parts[0]) || SLUG_RE.test(parts[0]);
}

function isSafeTourId(value) {
  return TOUR_ID_RE.test(value) || SLUG_RE.test(value);
}

function isSafeSceneId(value) {
  return SCENE_ID_RE.test(value) || SLUG_RE.test(value);
}

function sanitizeNo(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed || !NO_RE.test(trimmed)) return '';
  return trimmed;
}

/**
 * Full 200 HTML only — never honor Range (Facebook 206 truncates meta).
 * Use FixedLengthStream so Cloudflare keeps Content-Length (not chunked).
 */
function openGraphResponse(html) {
  const bytes = new TextEncoder().encode(html);
  return fixedLengthResponse(bytes, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'private, no-store',
    'x-ishare-og': 'bot',
    'accept-ranges': 'none',
    'disable-features': 'email_obfuscation,rocket_loader',
  });
}

function fixedLengthResponse(bytes, extraHeaders = {}) {
  const length = bytes.byteLength;
  const { readable, writable } = new FixedLengthStream(length);
  const writer = writable.getWriter();
  writer.write(bytes);
  writer.close();
  return new Response(readable, {
    status: 200,
    headers: { ...extraHeaders, 'content-length': String(length) },
  });
}

function isAssetOrApiPath(pathname) {
  if (pathname === '/robots.txt') return false;
  if (pathname.startsWith('/__og/') || pathname.startsWith('/og/'))
    return false;
  return (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/tours/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

function resolveOverride(env) {
  return env.ORIGIN_RESOLVE_OVERRIDE || 'poohjinny.github.io';
}

function publicOriginFromEnv(env) {
  return (env.PUBLIC_ORIGIN || env.ORIGIN || 'https://tour.ishare.ca').replace(
    /\/$/,
    '',
  );
}

async function proxyToOrigin(request, env) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, publicOriginFromEnv(env));
  return fetch(target.toString(), {
    method: request.method,
    headers: request.headers,
    redirect: 'manual',
    cf: { resolveOverride: resolveOverride(env) },
  });
}

async function proxySpa(request, env) {
  const url = new URL(request.url);
  const response = await proxyToOrigin(request, env);
  if (response.status !== 404) return response;

  const fallbackUrl = new URL('/404.html', publicOriginFromEnv(env));
  const fallback = await fetch(fallbackUrl.toString(), {
    headers: { accept: 'text/html' },
    cf: { resolveOverride: resolveOverride(env) },
  });

  if (fallback.ok) {
    const headers = new Headers(fallback.headers);
    headers.set('x-ishare-spa-fallback', '1');
    return new Response(fallback.body, { status: 200, headers });
  }

  if (isTourDeepLink(url.pathname) && response.body) {
    const headers = new Headers(response.headers);
    headers.set('x-ishare-spa-fallback', '1');
    return new Response(response.body, { status: 200, headers });
  }

  return response;
}

async function handleEnsure(request, env, publicOrigin, ctx) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: ensureCorsHeaders(request),
    });
  }
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, request);
  }

  const tourId = String(body?.tourId || '').trim();
  const sceneId = String(body?.sceneId || '').trim();
  const no = sanitizeNo(body?.no);
  if (!isSafeTourId(tourId) || !isSafeSceneId(sceneId)) {
    return jsonResponse({ error: 'invalid_ids' }, 400, request);
  }

  const url = ogJpgPublicUrl(publicOrigin, tourId, sceneId, no);
  const bake = ensureOgJpeg(env, publicOrigin, tourId, sceneId, no);

  // Client may disconnect after a short wait — finish put via waitUntil.
  if (ctx?.waitUntil) {
    ctx.waitUntil(
      bake.catch((error) => {
        console.error('tour-og ensure background failed', error);
      }),
    );
  }

  try {
    const result = await Promise.race([
      bake,
      sleep(2500).then(() => ({ ok: true, url, pending: true })),
    ]);
    if (!result.ok) {
      return jsonResponse(
        { error: result.error || 'bake_failed' },
        result.status || 502,
        request,
      );
    }
    return jsonResponse(
      { url: result.url || url, pending: Boolean(result.pending) },
      200,
      request,
    );
  } catch (error) {
    console.error('tour-og ensure failed', error);
    return jsonResponse({ error: 'bake_failed' }, 502, request);
  }
}

async function handleOgJpegGet(
  request,
  env,
  publicOrigin,
  tourId,
  sceneId,
  ctx,
) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!isSafeTourId(tourId) || !isSafeSceneId(sceneId)) {
    return new Response('Not found', { status: 404 });
  }
  const url = new URL(request.url);
  const no = sanitizeNo(url.searchParams.get('no'));

  try {
    const result = await ensureOgJpeg(env, publicOrigin, tourId, sceneId, no);
    if (!result.ok || !result.bytes) {
      // Keep failed image responses uncached so crawlers retry after bake.
      return new Response('Not found', {
        status: result.status || 404,
        headers: { 'cache-control': 'no-store' },
      });
    }
    if (request.method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': String(result.bytes.byteLength),
          'cache-control': 'public, max-age=31536000, immutable',
          'x-ishare-og-jpeg': result.source || 'r2',
        },
      });
    }
    return fixedLengthResponse(result.bytes, {
      'content-type': 'image/jpeg',
      'cache-control': 'public, max-age=31536000, immutable',
      'x-ishare-og-jpeg': result.source || 'r2',
    });
  } catch (error) {
    console.error('tour-og jpg get failed', error);
    if (ctx?.waitUntil) {
      ctx.waitUntil(
        ensureOgJpeg(env, publicOrigin, tourId, sceneId, no).catch((err) => {
          console.error('tour-og jpg background bake failed', err);
        }),
      );
    }
    return new Response('Bake failed', {
      status: 502,
      headers: { 'cache-control': 'no-store' },
    });
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureCorsHeaders(request) {
  const origin = request.headers.get('origin') || '';
  const allowed =
    origin === 'https://tour.ishare.ca' ||
    origin.endsWith('.pages.dev') ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  const headers = {
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
  };
  if (allowed) headers['access-control-allow-origin'] = origin;
  return headers;
}

function jsonResponse(payload, status, request) {
  const body = JSON.stringify(payload);
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    ...ensureCorsHeaders(request),
  };
  return new Response(body, { status, headers });
}

function r2ObjectKey(tourId, sceneId, no) {
  const suffix = no ? `__${no}` : '';
  return `og/${tourId}/${sceneId}${suffix}.jpg`;
}

function ogJpgPublicUrl(origin, tourId, sceneId, no) {
  const base = `${origin}/og/jpg/${tourId}/${sceneId}.jpg`;
  return no ? `${base}?no=${encodeURIComponent(no)}` : base;
}

/**
 * R2 hit → bytes. Miss → origin WebP → Images JPEG 1200x630 → put R2.
 */
async function ensureOgJpeg(env, publicOrigin, tourId, sceneId, no) {
  if (!env.OG_JPEG) {
    return { ok: false, status: 503, error: 'r2_unavailable' };
  }

  const key = r2ObjectKey(tourId, sceneId, no);
  const url = ogJpgPublicUrl(publicOrigin, tourId, sceneId, no);

  const hit = await env.OG_JPEG.get(key);
  if (hit) {
    const bytes = new Uint8Array(await hit.arrayBuffer());
    return { ok: true, url, bytes, source: 'r2' };
  }

  const sourcePath = await resolveOgSourcePath(env, tourId, sceneId, no);
  if (!sourcePath) {
    return { ok: false, status: 404, error: 'source_missing' };
  }

  const jpegBytes = await bakeJpegFromOrigin(env, sourcePath);
  if (!jpegBytes) {
    return { ok: false, status: 502, error: 'transform_failed' };
  }

  await env.OG_JPEG.put(key, jpegBytes, {
    httpMetadata: { contentType: 'image/jpeg' },
  });

  return { ok: true, url, bytes: jpegBytes, source: 'baked' };
}

async function resolveOgSourcePath(env, tourId, sceneId, no) {
  const tour = await fetchOriginJson(`/tours/${tourId}.json`, env);
  if (!tour?.scenes?.[sceneId]) return null;

  if (no) {
    const naming = resolveNaming(tour, sceneId, no);
    const namingImage = naming?.image?.trim();
    if (namingImage && isSafeAssetPath(namingImage)) {
      return namingImage.startsWith('/') ? namingImage : `/${namingImage}`;
    }
    const hostId =
      naming?.sceneId && tour.scenes[naming.sceneId] ? naming.sceneId : sceneId;
    const thumb = tour.scenes[hostId]?.thumbnail?.trim();
    if (thumb && isSafeAssetPath(thumb)) {
      return thumb.startsWith('/') ? thumb : `/${thumb}`;
    }
    return null;
  }

  const thumb = tour.scenes[sceneId]?.thumbnail?.trim();
  if (thumb && isSafeAssetPath(thumb)) {
    return thumb.startsWith('/') ? thumb : `/${thumb}`;
  }
  return null;
}

function isSafeAssetPath(path) {
  if (!path || /^https?:\/\//i.test(path)) return false;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!normalized.startsWith('/assets/')) return false;
  if (normalized.includes('..')) return false;
  return true;
}

async function bakeJpegFromOrigin(env, assetPath) {
  if (!env.IMAGES) return null;

  const href = new URL(assetPath, publicOriginFromEnv(env)).toString();
  const source = await fetch(href, {
    cf: { resolveOverride: resolveOverride(env) },
  });
  if (!source.ok || !source.body) return null;

  const quality = Number(env.OG_JPEG_QUALITY) || 82;
  const transformOnce = async (body) => {
    const out = await env.IMAGES.input(body)
      .transform({ width: OG_WIDTH, height: OG_HEIGHT, fit: 'cover' })
      .output({ format: 'image/jpeg', quality });
    const response = out.response();
    return new Uint8Array(await response.arrayBuffer());
  };

  try {
    return await transformOnce(source.body);
  } catch (error) {
    console.error('tour-og transform retry', error);
    const retry = await fetch(href, {
      cf: { resolveOverride: resolveOverride(env) },
    });
    if (!retry.ok || !retry.body) return null;
    try {
      return await transformOnce(retry.body);
    } catch (retryError) {
      console.error('tour-og transform failed', retryError);
      return null;
    }
  }
}

async function buildBotHtml(url, origin, env, ctx) {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const tourId = parts[0];
  if (!isSafeTourId(tourId)) return null;

  const tour = await fetchOriginJson(`/tours/${tourId}.json`, env);
  if (!tour?.id || !tour.scenes) return null;

  const sceneId =
    parts[1] && tour.scenes[parts[1]] ? parts[1] : tour.firstScene;
  if (!sceneId || !tour.scenes[sceneId] || !isSafeSceneId(sceneId)) return null;

  const no = sanitizeNo(url.searchParams.get('no'));
  const naming = no ? resolveNaming(tour, sceneId, no) : null;
  const catalog = await fetchOriginJson('/tours/catalog.json', env).catch(
    () => null,
  );
  const catalogEntry = findCatalogTour(catalog, tour.id);
  const logo =
    catalogEntry?.logo ||
    findClientLogo(catalog, tour.clientId) ||
    env.DEFAULT_IMAGE ||
    `${origin}/assets/brand/logo_ishare.png`;

  const hostSceneId =
    naming?.sceneId && tour.scenes[naming.sceneId] ? naming.sceneId : sceneId;

  const includeImage = isOgImageEnabled(env);
  const imageMode = ogImageMode(env);

  // R2 warm only when og:image points at baked JPEG.
  if (includeImage && imageMode === 'r2' && ctx?.waitUntil) {
    ctx.waitUntil(
      ensureOgJpeg(env, origin, tour.id, hostSceneId, no).catch((error) => {
        console.error('tour-og bot warm failed', error);
      }),
    );
  }

  const meta =
    naming ?
      buildNamingMeta(
        tour,
        sceneId,
        naming,
        catalogEntry,
        logo,
        origin,
        url,
        no,
        imageMode,
      )
    : buildSceneMeta(tour, sceneId, catalogEntry, logo, origin, url, imageMode);

  return renderOgHtml(
    meta,
    env.SITE_NAME || 'iShare Virtual Tour',
    includeImage,
  );
}

function isOgImageEnabled(env) {
  const raw = String(env.OG_INCLUDE_IMAGE ?? '1')
    .trim()
    .toLowerCase();
  return raw !== '0' && raw !== 'false' && raw !== 'off' && raw !== 'no';
}

function ogImageMode(env) {
  const raw = String(env.OG_IMAGE_MODE || 'r2')
    .trim()
    .toLowerCase();
  return raw === 'webp' ? 'webp' : 'r2';
}

async function fetchOriginJson(path, env) {
  const href = new URL(path, publicOriginFromEnv(env)).toString();
  const response = await fetch(href, {
    headers: { accept: 'application/json' },
    cf: {
      cacheTtl: 300,
      cacheEverything: true,
      resolveOverride: resolveOverride(env),
    },
  });
  if (!response.ok) return null;
  return response.json();
}

function findCatalogTour(catalog, tourId) {
  for (const client of catalog?.clients ?? []) {
    for (const entry of client.tours ?? []) {
      if (entry.id === tourId) {
        return {
          summary: entry.summary?.trim() || '',
          logo: client.branding?.logo?.trim() || '',
        };
      }
    }
  }
  return null;
}

function findClientLogo(catalog, clientId) {
  const client = (catalog?.clients ?? []).find(
    (entry) => entry.id === clientId,
  );
  return client?.branding?.logo?.trim() || '';
}

function resolveNaming(tour, sceneId, searchValue) {
  const scene = tour.scenes?.[sceneId];
  const hotspots = [...(tour.hotspots ?? []), ...(scene?.hotspots ?? [])];
  const needle = searchValue.toLowerCase();

  for (const hotspot of hotspots) {
    if (!hotspot?.namingId && hotspot?.type !== 'naming') continue;
    const record =
      tour.namingOpportunities?.[hotspot.namingId] ||
      hotspot.namingOpportunity ||
      null;
    const name = (record?.name || hotspot.title || '').trim();
    const slug = kebab(name);
    if (
      hotspot.id === searchValue ||
      hotspot.namingId === searchValue ||
      slug === needle ||
      kebab(hotspot.id) === needle
    ) {
      return {
        name: name || hotspot.namingId || hotspot.id,
        image: record?.image || hotspot.popup?.image,
        body: record?.body || hotspot.popup?.body,
        priceLabel: record?.priceLabel,
        price: record?.price,
      };
    }
  }

  for (const [sid, sc] of Object.entries(tour.scenes ?? {})) {
    for (const hotspot of sc.hotspots ?? []) {
      if (!hotspot?.namingId) continue;
      const record = tour.namingOpportunities?.[hotspot.namingId];
      const name = (record?.name || '').trim();
      if (kebab(name) === needle || hotspot.namingId === searchValue) {
        return {
          name: name || hotspot.namingId,
          image: record?.image,
          body: record?.body,
          priceLabel: record?.priceLabel,
          price: record?.price,
          sceneId: sid,
        };
      }
    }
  }
  return null;
}

function kebab(value) {
  // Match client `slugifyHotspotName` (apostrophes stripped, not hyphenated).
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function plainText(text, maxChars = DESC_MAX) {
  const plain = String(text || '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[*_`#>/\\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return '';
  if (plain.length <= maxChars) return plain;
  const within = plain.slice(0, maxChars);
  const lastSpace = within.lastIndexOf(' ');
  const clipped =
    lastSpace > Math.floor(maxChars * 0.6) ?
      within.slice(0, lastSpace)
    : within;
  return `${clipped.replace(/[,;:.–—-]+$/u, '').trimEnd()}…`;
}

function abs(origin, path, fallback) {
  const trimmed = path?.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

function buildSceneMeta(
  tour,
  sceneId,
  catalogEntry,
  logo,
  origin,
  url,
  imageMode = 'r2',
) {
  const tourTitle = tour.title?.trim() || tour.id;
  const scene = tour.scenes[sceneId];
  const sceneTitle = scene?.title?.trim() || sceneId;
  const authored =
    plainText(scene?.description || '') ||
    plainText(catalogEntry?.summary || '');
  const intro = `Explore ${sceneTitle} in the ${tourTitle} virtual tour.`;
  const thumb = scene?.thumbnail?.trim() || '';
  const image =
    thumb ?
      imageMode === 'webp' ?
        abs(origin, thumb)
      : ogJpgPublicUrl(origin, tour.id, sceneId, '')
    : abs(origin, logo);
  const sized = Boolean(thumb) && imageMode === 'r2';
  return {
    title: `${sceneTitle} — ${tourTitle}`,
    description:
      authored ?
        plainText(`${intro} ${authored}`)
      : `${intro} Open the link to look around in 360°.`,
    image,
    imageWidth: sized ? OG_WIDTH : undefined,
    imageHeight: sized ? OG_HEIGHT : undefined,
    url: `${origin}${url.pathname}${url.search}`,
  };
}

function buildNamingMeta(
  tour,
  sceneId,
  naming,
  catalogEntry,
  logo,
  origin,
  url,
  no,
  imageMode = 'r2',
) {
  const tourTitle = tour.title?.trim() || tour.id;
  const hostSceneId = naming.sceneId || sceneId;
  const sceneTitle = tour.scenes[hostSceneId]?.title?.trim() || hostSceneId;
  const authored =
    plainText(naming.body || '') || plainText(catalogEntry?.summary || '');
  const intro = `${naming.name} is a naming opportunity at ${sceneTitle} in ${tourTitle}.`;
  const namingImage = naming.image?.trim() || '';
  const thumb = tour.scenes[hostSceneId]?.thumbnail?.trim() || '';
  const sourcePath = namingImage || thumb;
  const image =
    sourcePath ?
      imageMode === 'webp' ?
        abs(origin, sourcePath)
      : ogJpgPublicUrl(origin, tour.id, hostSceneId, no)
    : abs(origin, logo);
  const sized = Boolean(sourcePath) && imageMode === 'r2';
  return {
    title: `${naming.name} — ${tourTitle}`,
    description:
      authored ?
        plainText(`${intro} ${authored}`)
      : `${intro} Open the link to learn more and look around.`,
    image,
    imageWidth: sized ? OG_WIDTH : undefined,
    imageHeight: sized ? OG_HEIGHT : undefined,
    url: `${origin}${url.pathname}${url.search}`,
  };
}

function imageTypeForUrl(imageUrl) {
  if (/\.jpe?g$/i.test(imageUrl)) return 'image/jpeg';
  if (/\.png$/i.test(imageUrl)) return 'image/png';
  if (/\.webp$/i.test(imageUrl)) return 'image/webp';
  if (/\.gif$/i.test(imageUrl)) return 'image/gif';
  return '';
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function renderOgHtml(meta, siteName, includeImage = true) {
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);
  const pageUrl = escapeAttr(meta.url);
  const site = escapeAttr(siteName);

  let imageTags = '';
  let twitterImageTag = '';
  const twitterCard =
    includeImage && meta.image ? 'summary_large_image' : 'summary';

  if (includeImage && meta.image) {
    const image = escapeAttr(meta.image);
    const imageType = imageTypeForUrl(meta.image);
    const imageTypeTag =
      imageType ?
        `\n    <meta property="og:image:type" content="${imageType}" />`
      : '';
    const imageSizeTags =
      meta.imageWidth && meta.imageHeight ?
        `\n    <meta property="og:image:width" content="${meta.imageWidth}" />\n    <meta property="og:image:height" content="${meta.imageHeight}" />`
      : '';
    imageTags = `\n    <meta property="og:image" content="${image}" />${imageTypeTag}${imageSizeTags}`;
    twitterImageTag = `\n    <meta name="twitter:image" content="${image}" />`;
  }

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${site}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />${imageTags}
    <meta property="og:url" content="${pageUrl}" />
    <meta name="twitter:card" content="${twitterCard}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />${twitterImageTag}
    <link rel="canonical" href="${pageUrl}" />
  </head>
  <body>
    <p><a href="${pageUrl}">Open this virtual tour</a></p>
  </body>
</html>`;
}
