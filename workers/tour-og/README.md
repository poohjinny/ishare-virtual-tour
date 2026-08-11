# Tour Open Graph edge — Cloudflare Worker

Serves **crawler-friendly Open Graph HTML** for `tour.ishare.ca` deep links
(Facebook, X, LinkedIn, Kakao, WhatsApp, etc.). Humans still get the SPA.

Contract (keep it boring):

- **Bot UA** → `200` HTML with `og:*` / `twitter:*` from `/tours/{id}.json`
  (including `?no=` naming).
- **`og:image`** → static CDN file. WebP thumbnails use a sibling **`.jpg`**
  written at bake/upload time (not edge-transcoded).
- **Everyone else** → proxy GitHub Pages; deep-link `404.html` → `200`.

No per-scene HTML files, no `/__og/*` image proxy, no Images/KV transform.

## What it does

| Client                 | Behavior                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ |
| Social bots (UA match) | `200` HTML with `og:title` / `description` / `image` / `url` from `/tours/{id}.json` |
| Everyone else          | Proxy to GitHub Pages origin; deep-link `404.html` rewritten to `200`                |

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

4. In the Cloudflare dashboard → Workers → `ishare-tour-og` → **Triggers** /
   **Routes**, add:

```text
tour.ishare.ca/*
```

5. Confirm `[vars].ORIGIN` in `wrangler.toml` points at the viewer origin
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

For local tour JSON, set `ORIGIN` to a tunnel or deployed Pages URL that already
has `/tours/*.json`.

## Smoke (production)

1. Deploy a build that includes `dist/tours/` (`postbuild` →
   `publish-tour-json`) and sibling `*.jpg` thumbnails under `assets/`.
2. Deploy this Worker and attach the `tour.ishare.ca/*` route.
3. Facebook [Sharing Debugger](https://developers.facebook.com/tools/debug/) →
   Scrape Again on a scene or naming URL.
4. Expect **200**, tour/scene (or naming) title, and a **`.jpg` thumbnail**
   (not the iShare logo), unless no image exists.

Backfill missing share JPGs:

```bash
node scripts/backfill-og-jpg.mjs
```

Naming share:

```text
https://tour.ishare.ca/{tourId}/{sceneId}?no={kebab-name}
```

## Ask Guide

Leave Ask Guide on `workers/ask-guide` (`*.workers.dev`). Do not collide
`/api/tour/chat*` routes with this Worker unless you merge carefully.
