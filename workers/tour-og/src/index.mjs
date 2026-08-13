/**
 * Bot / social-crawler Open Graph edge for tour.ishare.ca.
 *
 * - Known crawler UAs → 200 HTML with tour/scene/naming og:* (no JS).
 * - Everyone else → proxy GitHub Pages; deep-link 404 → SPA shell 200.
 * - og:image → /og/jpg/{tour}/{scene}.jpg — live WebP→JPEG via Images
 *   (1200×630). Facebook requires JPEG/PNG/GIF; raw WebP often fails.
 *
 * Origin fetches keep Host `tour.ishare.ca` but `resolveOverride` to
 * GitHub Pages so subrequests do not re-enter this Worker.
 *
 * Title/description rules: keep in sync with
 * `src/utils/buildShareMessage` + `resolveShareDescription`.
 */

const BOT_UA =
  /facebookexternalhit|Facebot|facebookcatalog|meta-externalagent|meta-externalfetcher|meta-webindexer|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp\/|TelegramBot|SkypeUriPreview|Pinterest|redditbot|Embedly|Iframely|Quora Link Preview|Showyoubot|outbrain|vkShare|W3C_Validator|bingbot|Googlebot|Applebot|iMessageBot|Slack-ImgProxy|kakaotalk-scrap|Linespider|LineBot|BitlyBot|Snapchat|PetalBot/i;

/** Broader Meta/social preview signal (covers odd Debugger / fetcher UAs). */
const META_OR_PREVIEW_UA =
  /facebook|facebot|meta-external|meta-webindexer|whatsapp|telegram|discordbot|linkedinbot|slackbot|twitterbot|kakaotalk|pinterest|embedly|iframely|preview|crawl|bot|spider|slurp/i;

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
  async fetch(request, env) {
    const publicOrigin = publicOriginFromEnv(env);
    const url = new URL(request.url);

    if (url.pathname === '/robots.txt') {
      return robotsResponse();
    }

    const jpgMatch = url.pathname.match(
      /^\/og\/jpg\/([^/]+)\/([^/]+)\.jpe?g$/i,
    );
    if (jpgMatch) {
      return handleOgJpegGet(
        request,
        env,
        publicOrigin,
        jpgMatch[1],
        jpgMatch[2],
      );
    }

    if (isAssetOrApiPath(url.pathname)) {
      return proxyToOrigin(request, env);
    }

    if (shouldServeOpenGraph(request, url.pathname)) {
      try {
        const html = await buildBotHtml(url, publicOrigin, env);
        if (html) return openGraphResponse(html, request.method);
      } catch (error) {
        console.error('tour-og bot html failed', error);
      }
      // Never fall through to GitHub 404 for crawlers — Facebook Debugger
      // treats origin 404 + SPA shell as a hard failure ("Explore virtual tours").
      return openGraphResponse(
        renderOgHtml(
          {
            title: 'iShare Virtual Tour',
            description: 'Open this virtual tour link to look around in 360°.',
            image:
              env.DEFAULT_IMAGE ||
              `${publicOrigin}/assets/brand/logo_ishare.png`,
            url: `${publicOrigin}${url.pathname}${url.search}`,
          },
          env.SITE_NAME || 'iShare Virtual Tour',
        ),
        request.method,
      );
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
  if (BOT_UA.test(ua) || META_OR_PREVIEW_UA.test(ua)) return true;
  // Empty UA / non-browser fetches → OG (Facebook Debugger must not see GH 404).
  if (!ua.trim()) return true;
  if (!looksLikeBrowserDocument(request)) return true;
  return false;
}

/** Real browser document navigations keep the SPA; scrapers get OG HTML. */
function looksLikeBrowserDocument(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!/Mozilla\/\d/i.test(ua)) return false;
  if (META_OR_PREVIEW_UA.test(ua)) return false;
  const mode = (request.headers.get('sec-fetch-mode') || '').toLowerCase();
  const dest = (request.headers.get('sec-fetch-dest') || '').toLowerCase();
  if (mode === 'navigate' && (dest === 'document' || dest === '')) return true;
  // Some browsers omit one of the Sec-Fetch headers; site still set ⇒ browser-ish.
  if (
    request.headers.get('sec-fetch-site') &&
    /Chrome|Chromium|Firefox|Safari|Edg\//i.test(ua)
  ) {
    return true;
  }
  return false;
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

function openGraphResponse(html, method = 'GET') {
  const bytes = new TextEncoder().encode(html);
  const headers = {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'private, no-store',
    'x-ishare-og': 'bot',
    'accept-ranges': 'none',
    'disable-features': 'email_obfuscation,rocket_loader',
    // Workers strip body on HEAD and often drop Content-Length too; without
    // CL/chunked/close, keep-alive clients hang (Facebook Debugger → timeout/404).
    connection: 'close',
    'content-length': String(bytes.byteLength),
  };
  if (String(method || 'GET').toUpperCase() === 'HEAD') {
    // Empty body; CL still announces GET entity length when the runtime keeps it.
    return new Response(null, { status: 200, headers });
  }
  return fixedLengthResponse(bytes, headers);
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
  if (pathname.startsWith('/og/')) return false;
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
  return (env.ORIGIN || env.PUBLIC_ORIGIN || 'https://tour.ishare.ca').replace(
    /\/$/,
    '',
  );
}

function originRequestHeaders(request) {
  const headers = new Headers();
  for (const name of [
    'accept',
    'accept-encoding',
    'accept-language',
    'if-none-match',
    'if-modified-since',
    'range',
    'user-agent',
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

async function proxyToOrigin(request, env) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, publicOriginFromEnv(env));
  return fetch(target.toString(), {
    method: request.method,
    headers: originRequestHeaders(request),
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

  if (isTourDeepLink(url.pathname)) {
    return new Response('<!doctype html><title>iShare</title>', {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'x-ishare-spa-fallback': 'empty',
      },
    });
  }

  return response;
}

function ogJpgPublicUrl(origin, tourId, sceneId, no) {
  const base = `${origin}/og/jpg/${tourId}/${sceneId}.jpg`;
  return no ? `${base}?no=${encodeURIComponent(no)}` : base;
}

/** Live WebP → JPEG for Facebook. Cache-Control is a hint; transform is on miss. */
async function handleOgJpegGet(request, env, publicOrigin, tourId, sceneId) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!isSafeTourId(tourId) || !isSafeSceneId(sceneId)) {
    return new Response('Not found', { status: 404 });
  }
  const no = sanitizeNo(new URL(request.url).searchParams.get('no'));

  try {
    const sourcePath = await resolveOgSourcePath(env, tourId, sceneId, no);
    if (!sourcePath) {
      return new Response('Not found', {
        status: 404,
        headers: { 'cache-control': 'no-store' },
      });
    }
    const jpegBytes = await transformJpegFromOrigin(env, sourcePath);
    if (!jpegBytes) {
      return new Response('Transform failed', {
        status: 502,
        headers: { 'cache-control': 'no-store' },
      });
    }
    if (request.method === 'HEAD') {
      return new Response(null, {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'content-length': String(jpegBytes.byteLength),
          'cache-control': 'public, max-age=86400',
          'x-ishare-og-jpeg': 'images',
        },
      });
    }
    return fixedLengthResponse(jpegBytes, {
      'content-type': 'image/jpeg',
      'cache-control': 'public, max-age=86400',
      'x-ishare-og-jpeg': 'images',
    });
  } catch (error) {
    console.error('tour-og jpg get failed', error);
    return new Response('Transform failed', {
      status: 502,
      headers: { 'cache-control': 'no-store' },
    });
  }
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

async function transformJpegFromOrigin(env, assetPath) {
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
    return new Uint8Array(await out.response().arrayBuffer());
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

async function buildBotHtml(url, origin, env) {
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
      )
    : buildSceneMeta(tour, sceneId, catalogEntry, logo, origin, url);

  return renderOgHtml(meta, env.SITE_NAME || 'iShare Virtual Tour');
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
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Keep in sync with `TOUR_DIRECTORY_SCENE_EMPTY_PLACE_LEAD`. */
const EMPTY_PLACE_LEAD = 'Step inside and look around this space.';

/** Keep in sync with `defaultSceneDescription`. */
function defaultSceneDescription(tourTitle, sceneTitle) {
  const tour = String(tourTitle || '').trim() || 'this facility';
  const scene = String(sceneTitle || '').trim() || 'this area';
  return `Explore ${scene} as part of the ${tour} virtual tour.`;
}

function isDefaultSceneDescription(description, tourTitle, sceneTitle) {
  const trimmed = String(description || '').trim();
  if (!trimmed) return false;
  return trimmed === defaultSceneDescription(tourTitle, sceneTitle);
}

/** Keep in sync with `defaultNamingDescription`. */
function defaultNamingDescription(opportunityTitle, tourTitle) {
  const title = String(opportunityTitle || '').trim() || 'This space';
  const tour = String(tourTitle || '').trim() || 'this place';
  return `${title} is available to name. Contribute to support the people who rely on ${tour}.`;
}

function isDefaultNamingDescription(description, opportunityTitle, tourTitle) {
  const trimmed = String(description || '').trim();
  if (!trimmed) return false;
  return trimmed === defaultNamingDescription(opportunityTitle, tourTitle);
}

function lastCompleteSentenceEnd(text) {
  const pattern = /[.!?…]["'”’)]*(?=\s|$)/gu;
  let last = -1;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    last = match.index + match[0].length;
  }
  return last;
}

/**
 * Plain, length-capped copy — keep in sync with `formatShareDescriptionPlain`
 * (sentence-aware, no ellipsis).
 */
function formatShareDescriptionPlain(text, maxChars = DESC_MAX) {
  const plain = String(text || '')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/[*_`#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plain) return '';
  if (plain.length <= maxChars) return plain;

  const withinBudget = plain.slice(0, maxChars);
  const lastSentenceEnd = lastCompleteSentenceEnd(withinBudget);
  if (lastSentenceEnd > Math.floor(maxChars * 0.4)) {
    return withinBudget.slice(0, lastSentenceEnd).trimEnd();
  }

  const lastSpace = withinBudget.lastIndexOf(' ');
  const clipped =
    lastSpace > Math.floor(maxChars * 0.6) ?
      withinBudget.slice(0, lastSpace)
    : withinBudget;
  return clipped.replace(/[,;:–—-]+$/u, '').trimEnd();
}

function firstSceneNamingBody(tour, sceneId) {
  const tourTitle = tour.title?.trim() || tour.id;
  const scene = tour.scenes?.[sceneId];
  const hotspots = [...(scene?.hotspots ?? []), ...(tour.hotspots ?? [])];

  for (const hotspot of hotspots) {
    if (!hotspot?.namingId && hotspot?.type !== 'naming') continue;
    if (hotspot.sceneId && hotspot.sceneId !== sceneId) continue;

    const record =
      tour.namingOpportunities?.[hotspot.namingId] ||
      hotspot.namingOpportunity ||
      null;
    const name = (record?.name || hotspot.title || '').trim();
    const body = String(record?.body || hotspot.popup?.body || '').trim();
    if (!body) continue;
    if (isDefaultNamingDescription(body, name, tourTitle)) continue;
    return body;
  }
  return '';
}

/**
 * Same priority as SPA `resolveShareDescription` (scene, no `?no=`):
 * place lead → first real naming body → catalog summary.
 */
function resolveSceneShareDescription(tour, sceneId, catalogEntry) {
  const tourTitle = tour.title?.trim() || tour.id;
  const scene = tour.scenes?.[sceneId];
  const sceneTitle = scene?.title?.trim() || sceneId;
  const description = scene?.description?.trim() || '';

  if (
    description &&
    description !== EMPTY_PLACE_LEAD &&
    !isDefaultSceneDescription(description, tourTitle, sceneTitle)
  ) {
    return formatShareDescriptionPlain(description);
  }

  const namingBody = firstSceneNamingBody(tour, sceneId);
  if (namingBody) return formatShareDescriptionPlain(namingBody);

  const summary = catalogEntry?.summary?.trim() || '';
  if (summary && summary !== EMPTY_PLACE_LEAD) {
    return formatShareDescriptionPlain(summary);
  }
  return '';
}

function abs(origin, path, fallback) {
  const trimmed = path?.trim();
  if (!trimmed) return fallback;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${origin}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

function buildSceneMeta(tour, sceneId, catalogEntry, logo, origin, url) {
  const tourTitle = tour.title?.trim() || tour.id;
  const scene = tour.scenes[sceneId];
  const sceneTitle = scene?.title?.trim() || sceneId;
  const authored = resolveSceneShareDescription(tour, sceneId, catalogEntry);
  const intro = `Explore ${sceneTitle} in the ${tourTitle} virtual tour.`;
  const thumb = scene?.thumbnail?.trim() || '';
  const image =
    thumb ? ogJpgPublicUrl(origin, tour.id, sceneId, '') : abs(origin, logo);
  return {
    title: `${sceneTitle} | ${tourTitle}`,
    description:
      authored ?
        formatShareDescriptionPlain(`${intro} ${authored}`)
      : `${intro} Open the link to look around in 360°.`,
    image,
    imageWidth: thumb ? OG_WIDTH : undefined,
    imageHeight: thumb ? OG_HEIGHT : undefined,
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
) {
  void catalogEntry;
  const tourTitle = tour.title?.trim() || tour.id;
  const hostSceneId = naming.sceneId || sceneId;
  const sceneTitle = tour.scenes[hostSceneId]?.title?.trim() || hostSceneId;
  const namingBody = String(naming.body || '').trim();
  const authored =
    namingBody &&
    !isDefaultNamingDescription(namingBody, naming.name, tourTitle) ?
      formatShareDescriptionPlain(namingBody)
    : '';
  const priceText = formatNamingPriceForOg(naming);
  const intro = `${naming.name} is a naming opportunity at ${sceneTitle} in ${tourTitle}.`;
  const hasImage =
    Boolean(naming.image?.trim()) ||
    Boolean(tour.scenes[hostSceneId]?.thumbnail);
  const image =
    hasImage ?
      ogJpgPublicUrl(origin, tour.id, hostSceneId, no)
    : abs(origin, logo);

  return {
    title:
      priceText ?
        `${naming.name} · ${priceText} | ${tourTitle}`
      : `${naming.name} | ${tourTitle}`,
    description:
      authored ?
        formatShareDescriptionPlain(`${intro} ${authored}`)
      : `${intro} Open the link to learn more and look around.`,
    image,
    imageWidth: hasImage ? OG_WIDTH : undefined,
    imageHeight: hasImage ? OG_HEIGHT : undefined,
    url: `${origin}${url.pathname}${url.search}`,
  };
}

/** Keep in sync with `formatNamingGalleryItemPrice`. */
function formatNamingPriceForOg(naming) {
  const label = String(naming?.priceLabel || '').trim();
  if (label) return label;
  const amount = Math.round(Number(naming?.price));
  if (!Number.isFinite(amount) || amount <= 0) return '';
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted =
      millions % 1 === 0 ?
        String(millions)
      : String(Number(millions.toFixed(1)));
    return `$${formatted}M`;
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000;
    const formatted =
      thousands % 1 === 0 ?
        String(thousands)
      : String(Number(thousands.toFixed(1)));
    return `$${formatted}K`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

function imageTypeForUrl(imageUrl) {
  if (/\.jpe?g$/i.test(imageUrl)) return 'image/jpeg';
  if (/\.png$/i.test(imageUrl)) return 'image/png';
  if (/\.gif$/i.test(imageUrl)) return 'image/gif';
  return '';
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function renderOgHtml(meta, siteName) {
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);
  const image = escapeAttr(meta.image);
  const pageUrl = escapeAttr(meta.url);
  const site = escapeAttr(siteName);
  const imageType = imageTypeForUrl(meta.image);
  const imageTypeTag =
    imageType ?
      `\n    <meta property="og:image:type" content="${imageType}" />`
    : '';
  const imageSizeTags =
    meta.imageWidth && meta.imageHeight ?
      `\n    <meta property="og:image:width" content="${meta.imageWidth}" />\n    <meta property="og:image:height" content="${meta.imageHeight}" />`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${site}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />${imageTypeTag}${imageSizeTags}
    <meta property="og:url" content="${pageUrl}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <link rel="canonical" href="${pageUrl}" />
  </head>
  <body>
    <p><a href="${pageUrl}">Open this virtual tour</a></p>
  </body>
</html>`;
}
