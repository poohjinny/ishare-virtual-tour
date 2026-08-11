# Tour Open Graph edge — Cloudflare Worker

Serves **crawler-friendly Open Graph HTML** for `tour.ishare.ca` deep links
(Facebook, X, LinkedIn, Kakao, WhatsApp, etc.). Humans still get the SPA.

Contract:

- **Bot UA** → `200` HTML with `og:*` / `twitter:*` from `/tours/{id}.json`
  (including `?no=` naming).
- **`og:image`** → origin WebP thumbnail / naming preview under `/assets/…`
  (no R2 JPEG bake, no `/og/jpg` proxy).
- **Everyone else** → proxy GitHub Pages; deep-link `404.html` → `200`.

## What it does

| Client                 | Behavior                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------- |
| Social bots (UA match) | `200` HTML; `og:image` = scene/naming WebP on CDN                                     |
| Everyone else          | Proxy to GitHub Pages origin; deep-link `404.html` rewritten to `200`                 |

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
4. Facebook / Kakao scrapers → expect **200**, scene title, and
   `og:image` pointing at `/assets/…/thumbnails/….webp`.

```bash
curl -sA "facebookexternalhit/1.1" \
  "https://tour.ishare.ca/t_…/s_…" | grep og:image
```

Naming share:

```text
https://tour.ishare.ca/{tourId}/{sceneId}?no={kebab-name}
```

## Ask Guide

Leave Ask Guide on `workers/ask-guide` (`*.workers.dev`). Do not collide
`/api/tour/chat*` routes with this Worker unless you merge carefully.
