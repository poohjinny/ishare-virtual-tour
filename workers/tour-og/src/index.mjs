/**
 * Bot / social-crawler Open Graph edge for tour.ishare.ca.
 *
 * - Known crawlers → 200 HTML with tour/scene/naming og:* tags (no JS).
 * - Everyone else → proxy to ORIGIN; rewrite SPA deep-link 404 → 200.
 *
 * Requires Cloudflare proxy on tour.ishare.ca (see README).
 * Build must publish /tours/{tourId}.json (postbuild publish-tour-json).
 */

const BOT_UA =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Discordbot|WhatsApp|TelegramBot|SkypeUriPreview|Pinterest|redditbot|Embedly|Quora Link Preview|Showyoubot|outbrain|vkShare|W3C_Validator|bingbot|Googlebot|Applebot|iMessageBot|Slack-ImgProxy|meta-externalagent/i;

const DESC_MAX = 220;

export default {
  async fetch(request, env) {
    const origin = (env.ORIGIN || 'https://tour.ishare.ca').replace(/\/$/, '');
    const url = new URL(request.url);

    if (isAssetOrApiPath(url.pathname)) {
      return proxyToOrigin(request, origin);
    }

    if (BOT_UA.test(request.headers.get('user-agent') || '')) {
      try {
        const html = await buildBotHtml(url, origin, env);
        if (html) {
          return new Response(html, {
            status: 200,
            headers: {
              'content-type': 'text/html; charset=utf-8',
              'cache-control': 'public, max-age=300',
              'x-ishare-og': 'bot',
            },
          });
        }
      } catch (error) {
        console.error('tour-og bot html failed', error);
      }
    }

    return proxySpa(request, origin);
  },
};

function isAssetOrApiPath(pathname) {
  return (
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/tours/') ||
    pathname.startsWith('/fonts/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico' ||
    /\.[a-z0-9]+$/i.test(pathname)
  );
}

async function proxyToOrigin(request, origin) {
  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, origin);
  return fetch(target, {
    method: request.method,
    headers: request.headers,
    redirect: 'manual',
  });
}

async function proxySpa(request, origin) {
  const response = await proxyToOrigin(request, origin);
  if (response.status !== 404) return response;

  // GitHub Pages SPA fallback uses 404.html — rewrite status for humans.
  const fallback = await fetch(new URL('/404.html', origin), {
    headers: { accept: 'text/html' },
  });
  if (!fallback.ok) return response;

  const headers = new Headers(fallback.headers);
  headers.set('x-ishare-spa-fallback', '1');
  return new Response(fallback.body, { status: 200, headers });
}

async function buildBotHtml(url, origin, env) {
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const tourId = parts[0];
  if (!/^t_[a-z0-9]+$/i.test(tourId) && !/^[a-z0-9-]+$/i.test(tourId)) {
    return null;
  }

  const tour = await fetchJson(`${origin}/tours/${tourId}.json`);
  if (!tour?.id || !tour.scenes) {
    // Legacy alias paths are not published as JSON filenames — skip.
    return null;
  }

  const sceneId =
    parts[1] && tour.scenes[parts[1]] ? parts[1] : tour.firstScene;
  if (!sceneId || !tour.scenes[sceneId]) return null;

  const no = url.searchParams.get('no')?.trim() || '';
  const naming = no ? resolveNaming(tour, sceneId, no) : null;
  const catalog = await fetchJson(`${origin}/tours/catalog.json`).catch(
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

async function fetchJson(href) {
  const response = await fetch(href, {
    headers: { accept: 'application/json' },
    cf: { cacheTtl: 300, cacheEverything: true },
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

  // Search all scenes if not on this scene's pin list.
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

function buildSceneMeta(tour, sceneId, catalogEntry, logo, origin, url) {
  const tourTitle = tour.title?.trim() || tour.id;
  const scene = tour.scenes[sceneId];
  const sceneTitle = scene?.title?.trim() || sceneId;
  const authored =
    plainText(scene?.description || '') ||
    plainText(catalogEntry?.summary || '');
  const intro = `Explore ${sceneTitle} in the ${tourTitle} virtual tour.`;
  return {
    title: `${sceneTitle} — ${tourTitle}`,
    description:
      authored ?
        plainText(`${intro} ${authored}`)
      : `${intro} Open the link to look around in 360°.`,
    image: abs(origin, scene?.thumbnail, abs(origin, logo)),
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
  const image =
    abs(origin, naming.image) ||
    abs(origin, tour.scenes[hostSceneId]?.thumbnail) ||
    abs(origin, logo);
  return {
    title: `${naming.name} — ${tourTitle}`,
    description:
      authored ?
        plainText(`${intro} ${authored}`)
      : `${intro} Open the link to learn more and look around.`,
    image,
    url: `${origin}${url.pathname}${url.search}`,
  };
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
    <meta property="og:image" content="${image}" />
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
