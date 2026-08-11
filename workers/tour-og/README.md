# Tour Open Graph edge — Cloudflare Worker

Serves **crawler-friendly Open Graph HTML** for `tour.ishare.ca` deep links
(Facebook, X, LinkedIn, Kakao, WhatsApp, etc.). Humans still get the SPA.

Contract:

- **Bot UA** → `200` HTML with `og:*` / `twitter:*` from `/tours/{id}.json`
  (including `?no=` naming).
- **`og:image`** → `https://tour.ishare.ca/og/jpg/{tourId}/{sceneId}.jpg`
  (optional `?no=`; `/__og/jpg/...` still works as an alias). JPEG is **baked on
  first miss** into **R2** from the scene/naming WebP via the Workers **Images**
  binding (1200×630). Bot HTML scrapes also `waitUntil` a warm bake.
- **Share warm** → SPA `POST /og/ensure` `{ tourId, sceneId, no? }` so the
  object exists before social scrapers hit the link (Worker may return
  `{ pending: true }` while put finishes in the background).
- **Everyone else** → proxy GitHub Pages; deep-link `404.html` → `200`.

No per-scene static `assets/**/*.jpg` thumbs/previews for OG.

## What it does

| Client                 | Behavior                                                                |
| ---------------------- | ----------------------------------------------------------------------- |
| Social bots (UA match) | `200` HTML; `og:image` = `/og/jpg/...` (R2 warmed via `waitUntil`)      |
| `GET /og/jpg/...`      | Return JPEG from R2, or WebP→JPEG bake then `put` (`/__og/jpg` alias)   |
| `POST /og/ensure`      | Same bake; `{ url }` — called from Share (`waitUntil` if client leaves) |
| Everyone else          | Proxy to GitHub Pages origin; deep-link `404.html` rewritten to `200`   |

## One-time setup

1. Cloudflare account; add the **ishare.ca** zone (or the zone that hosts
   `tour`).
2. **Enable R2** in the Dashboard (R2 → Overview → Enable). Create bucket if
   needed: `npx wrangler r2 bucket create ishare-tour-og-jpeg` (bound as
   `OG_JPEG` in `wrangler.toml`).
3. Images binding is configured as `[images] binding = "IMAGES"`.
4. Change DNS for `tour` from GitHub Pages CNAME-only to **proxied** (orange
   cloud). Typical pattern:
   - `CNAME` `tour` → `poohjinny.github.io` (or your Pages target)
   - Proxy **on**
5. Install and deploy:

```bash
cd workers/tour-og
npm install
npx wrangler login
npm run deploy
```

6. Confirm `[vars].ORIGIN` in `wrangler.toml` points at the viewer origin
   (`https://tour.ishare.ca` is fine when the Worker is the edge in front of
   Pages).

## Local

```bash
cd workers/tour-og
npm run dev
```

Point a test UA at the worker:

```bash
curl -sA "facebookexternalhit/1.1" "http://127.0.0.1:8787/t_l01wnq8eh6/s_h310pim38b" | head
```

For local tour JSON + WebP, set `ORIGIN` to a tunnel or deployed Pages URL.

## Smoke (production)

1. Deploy a build that includes `dist/tours/` (`postbuild` →
   `publish-tour-json`) and WebP thumbnails under `assets/`.
2. Deploy this Worker (R2 + Images bindings) and attach `tour.ishare.ca/*`.
3. **Disable Cloudflare Managed robots.txt** (Dashboard → zone `ishare.ca` → AI
   Crawl Control / robots.txt managed feature). Otherwise Cloudflare rewrites
   `/robots.txt` after the Worker and social scrapers may fail.
4. Share once in the UI (warms R2 via `/og/ensure`), **or** open the deep link
   with a bot UA (HTML scrape also warms), **or** hit
   `GET /og/jpg/{tourId}/{sceneId}.jpg` once.
5. Facebook [Sharing Debugger](https://developers.facebook.com/tools/debug/) →
   Scrape Again on that scene URL.
6. Expect **200**, tour/scene title, and `og:image` pointing at `/og/jpg/...`.
   Second `GET` of that JPG should be served from R2 (`x-ishare-og-jpeg: r2`).

```bash
curl -sA "facebookexternalhit/1.1" \
  "https://tour.ishare.ca/t_…/s_…" | grep og:image
curl -sI "https://tour.ishare.ca/og/jpg/t_…/s_….jpg"
```

Naming share:

```text
https://tour.ishare.ca/{tourId}/{sceneId}?no={kebab-name}
og:image → /og/jpg/{tourId}/{sceneId}.jpg?no={kebab-name}
```

## Ask Guide

Leave Ask Guide on `workers/ask-guide` (`*.workers.dev`). Do not collide
`/api/tour/chat*` routes with this Worker unless you merge carefully.
