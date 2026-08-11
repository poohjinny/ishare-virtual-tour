# Tour Open Graph edge — Cloudflare Worker

Serves **crawler-friendly Open Graph HTML** for `tour.ishare.ca` deep links
(Facebook, X, LinkedIn, Kakao, WhatsApp, etc.). Humans still get the SPA.

Contract:

- **Bot UA** → `200` HTML with `og:*` / `twitter:*` from `/tours/{id}.json`
  (including `?no=` naming). Includes `meta-externalfetcher` (Facebook).
- **`og:image`** → `https://tour.ishare.ca/og/jpg/{tourId}/{sceneId}.jpg`
  (optional `?no=`). JPEG is produced **on the fly** from scene/naming WebP via
  the Workers **Images** binding (1200×630). No R2 storage. Facebook requires
  JPEG/PNG/GIF for reliable previews; raw WebP often fails.
- **Everyone else** → proxy GitHub Pages; deep-link `404.html` → `200`.
- **Topology** → orange-cloud CNAME `tour` → `poohjinny.github.io` plus Worker
  route `tour.ishare.ca/*`. Do **not** use Workers custom domain for this
  hostname: same-URL `fetch` re-enters the Worker (522) and GitHub Pages rejects
  `github.io` fetches without Host `tour.ishare.ca`.

## What it does

| Client                 | Behavior                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| Social bots (UA match) | `200` HTML; `og:image` = `/og/jpg/...` JPEG (Images live transform)   |
| `GET /og/jpg/...`      | WebP→JPEG 1200×630 (no R2); Cache-Control for edge cache              |
| Everyone else          | Proxy to GitHub Pages origin; deep-link `404.html` rewritten to `200` |

## One-time setup

1. Cloudflare account; add the **ishare.ca** zone (or the zone that hosts
   `tour`).
2. Change DNS for `tour` from GitHub Pages CNAME-only to **proxied** (orange
   cloud). Typical pattern:
   - `CNAME` `tour` → `poohjinny.github.io` (or your Pages target)
   - Proxy **on**
3. Install and deploy:

```bash
cd workers/tour-og
npm install
npx wrangler login
npm run deploy
```

4. Confirm `[vars].ORIGIN` in `wrangler.toml` points at the viewer origin
   (`https://tour.ishare.ca` is fine when the Worker is the edge in front of
   Pages).
5. Images binding (`[images] binding = "IMAGES"`) must be available on the
   account — used only for live JPEG transforms.

## Local

```bash
cd workers/tour-og
npm run dev
```

```bash
curl -sA "facebookexternalhit/1.1" "http://127.0.0.1:8787/t_l01wnq8eh6/s_h310pim38b" | head
```

## Smoke (production)

1. Deploy a build that includes `dist/tours/` and WebP thumbnails under
   `assets/`.
2. Deploy this Worker and attach `tour.ishare.ca/*`.
3. **Disable Cloudflare Managed robots.txt** (Dashboard → zone `ishare.ca` → AI
   Crawl Control / robots.txt managed feature).
4. Facebook / Kakao scrapers → expect **200**, scene title, and `og:image`
   pointing at `/og/jpg/…/*.jpg` (not WebP).

```bash
curl -sA "facebookexternalhit/1.1" \
  "https://tour.ishare.ca/t_…/s_…" | grep og:image
curl -sI "https://tour.ishare.ca/og/jpg/t_…/s_….jpg"
```

After deploy, use Meta
[Sharing Debugger](https://developers.facebook.com/tools/debug/) → **Scrape
Again** (often twice) to clear a prior **404** cache from when the Worker was
missing.

Naming share:

```text
https://tour.ishare.ca/{tourId}/{sceneId}?no={kebab-name}
```

## Ask Guide

Leave Ask Guide on `workers/ask-guide` (`*.workers.dev`). Do not collide
`/api/tour/chat*` routes with this Worker unless you merge carefully.
