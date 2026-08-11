/**
 * Bot / social-crawler Open Graph edge for tour.ishare.ca.
 *
 * - Known crawler UAs → 200 HTML with tour/scene/naming og:* (no JS).
 * - Everyone else → proxy GitHub Pages; deep-link 404 → SPA shell 200.
 * - og:image points at static *.jpg sibling of WebP thumbnails (build-time).
 *
 * Origin fetches use resolveOverride so subrequests do not re-enter this Worker.
 */

const BOT_UA =
  /facebookexternalhit|Facebot|facebookcatalog|meta-externalagent|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp\/|TelegramBot|SkypeUriPreview|Pinterest|redditbot|Embedly|Iframely|Quora Link Preview|Showyoubot|outbrain|vkShare|W3C_Validator|bingbot|Googlebot|Applebot|iMessageBot|Slack-ImgProxy|kakaotalk-scrap|Linespider|LineBot|BitlyBot|Snapchat|PetalBot/i;

const DESC_MAX = 220;

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
    const publicOrigin = (
      env.PUBLIC_ORIGIN ||
      env.ORIGIN ||
      'https://tour.ishare.ca'
    ).replace(/\/$/, '');
    const url = new URL(request.url);

    if (url.pathname === '/robots.txt') {
      return robotsResponse();
    }

    if (url.pathname.startsWith('/__og/')) {
      return new Response('Gone', { status: 410 });
    }

    if (isAssetOrApiPath(url.pathname)) {
      return proxyToOrigin(request, env);
    }

    if (shouldServeOpenGraph(request, url.pathname)) {
      try {
        const html = await buildBotHtml(url, publicOrigin, env);
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
  return /^t_[a-z0-9]+$/i.test(parts[0]) || /^[a-z0-9-]+$/i.test(parts[0]);
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
    headers: {
      ...extraHeaders,
      'content-length': String(length),
    },
  });
}

function isAssetOrApiPath(pathname) {
  if (pathname === '/robots.txt') return false;
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

function publicOrigin(env) {
  return (env.PUBLIC_ORIGIN || env.ORIGIN || 'https://tour.ishare.ca').replace(
    /\/$/,
    '',
  );
}

async function proxyToOrigin(request, env) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, publicOrigin(env));
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

  const fallbackUrl = new URL('/404.html', publicOrigin(env));
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

async function buildBotHtml(url, origin, env) {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const tourId = parts[0];
  if (!/^t_[a-z0-9]+$/i.test(tourId) && !/^[a-z0-9-]+$/i.test(tourId)) {
    return null;
  }

  const tour = await fetchOriginJson(`/tours/${tourId}.json`, env);
  if (!tour?.id || !tour.scenes) return null;

  const sceneId =
    parts[1] && tour.scenes[parts[1]] ? parts[1] : tour.firstScene;
  if (!sceneId || !tour.scenes[sceneId]) return null;

  const no = url.searchParams.get('no')?.trim() || '';
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
      buildNamingMeta(tour, sceneId, naming, catalogEntry, logo, origin, url)
    : buildSceneMeta(tour, sceneId, catalogEntry, logo, origin, url);

  return renderOgHtml(meta, env.SITE_NAME || 'iShare Virtual Tour');
}

async function fetchOriginJson(path, env) {
  const href = new URL(path, publicOrigin(env)).toString();
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

/** Meta-only: WebP share assets use the static JPG sibling on CDN. */
function ogShareImage(origin, imageUrl) {
  if (!imageUrl) return imageUrl;
  try {
    const parsed = new URL(imageUrl, origin);
    if (parsed.origin !== new URL(origin).origin) return imageUrl;
    if (!parsed.pathname.startsWith('/assets/')) return imageUrl;
    if (!/\.webp$/i.test(parsed.pathname)) return imageUrl;
    return `${origin}${parsed.pathname.replace(/\.webp$/i, '.jpg')}`;
  } catch {
    return imageUrl;
  }
}

function imageTypeForUrl(imageUrl) {
  if (/\.jpe?g$/i.test(imageUrl)) return 'image/jpeg';
  if (/\.png$/i.test(imageUrl)) return 'image/png';
  if (/\.webp$/i.test(imageUrl)) return 'image/webp';
  if (/\.gif$/i.test(imageUrl)) return 'image/gif';
  return '';
}

function buildSceneMeta(tour, sceneId, catalogEntry, logo, origin, url) {
  const tourTitle = tour.title?.trim() || tour.id;
  const scene = tour.scenes[sceneId];
  const sceneTitle = scene?.title?.trim() || sceneId;
  const authored =
    plainText(scene?.description || '') ||
    plainText(catalogEntry?.summary || '');
  const intro = `Explore ${sceneTitle} in the ${tourTitle} virtual tour.`;
  const image = ogShareImage(
    origin,
    abs(origin, scene?.thumbnail, abs(origin, logo)),
  );
  return {
    title: `${sceneTitle} — ${tourTitle}`,
    description:
      authored ?
        plainText(`${intro} ${authored}`)
      : `${intro} Open the link to look around in 360°.`,
    image,
    ...ogImageSizeMeta(image),
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
) {
  const tourTitle = tour.title?.trim() || tour.id;
  const hostSceneId = naming.sceneId || sceneId;
  const sceneTitle = tour.scenes[hostSceneId]?.title?.trim() || hostSceneId;
  const authored =
    plainText(naming.body || '') || plainText(catalogEntry?.summary || '');
  const intro = `${naming.name} is a naming opportunity at ${sceneTitle} in ${tourTitle}.`;
  const image = ogShareImage(
    origin,
    abs(origin, naming.image) ||
      abs(origin, tour.scenes[hostSceneId]?.thumbnail) ||
      abs(origin, logo),
  );
  return {
    title: `${naming.name} — ${tourTitle}`,
    description:
      authored ?
        plainText(`${intro} ${authored}`)
      : `${intro} Open the link to learn more and look around.`,
    image,
    ...ogImageSizeMeta(image),
    url: `${origin}${url.pathname}${url.search}`,
  };
}

function ogImageSizeMeta(imageUrl) {
  if (!/\.jpe?g$/i.test(imageUrl || '')) return {};
  return { imageWidth: 1200, imageHeight: 630 };
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
