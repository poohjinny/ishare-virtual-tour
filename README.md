# iShare Tour Platform

In-house 360° / 3D virtual tour for iShare fundraising — panorama (Photo Sphere
Viewer) and model3d (Three.js), embedded on ishare.ca and client sites as a
SeekBeak replacement.

Production: **`https://tour.ishare.ca`**. Public tours today include Ken Sargent
House and Queensway Carleton Hospital; more clients live as unlisted / demo.

## Quick Start

```bash
npm install
npm run dev
```

`npm run dev` starts **both** local apps:

- Viewer → [http://localhost:5173](http://localhost:5173)
- Admin → [http://localhost:5174](http://localhost:5174)

```bash
npm run dev:viewer   # viewer only :5173
npm run dev:admin    # admin only  :5174
```

### Build for production

```bash
npm run build           # alias for build:viewer (Pages CI)
npm run build:viewer
npm run build:admin
npm run preview
```

Deploy: [docs/ops/DEPLOY.md](docs/ops/DEPLOY.md).

## Tour flow

Start at `/` (client intro) or a direct `/{tourId}/{sceneId}` link. Move with
**Explore**, pulsing **nav hotspots**, breadcrumb, or **Back**. Scene titles and
opaque ids live in each `apps/tour-viewer/tours/t_*.json` — not kebab slugs.

Ken Sargent House (demo path): **Overview** (`s_dtv27wfrbi`) → **Main Entrance**
(`s_zlz39v1fjz`) → **Reception** (`s_vddzraqi1q`).

## Routes

Path-based URLs — `{tourId}` (`t_*`) and `{sceneId}` (`s_*`) come from
[`apps/tour-viewer/tours/catalog.json`](apps/tour-viewer/tours/catalog.json) and
each tour JSON. Scene changes update the address bar; browser back/forward
works.

| Path                  | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `/`                   | Client intro — pick a tour from the gallery               |
| `/{tourId}/{sceneId}` | A specific tour and scene                                 |
| `/{tourId}`           | Tour first scene (canonicalizes to `/{tourId}/{sceneId}`) |

Legacy kebab / client-id paths and `?tour=` / `?scene=` query links redirect to
the canonical `/{tourId}/{sceneId}` form.

`?embed=1` on `/` skips the intro and loads a tour directly (iframe embeds).

## Query flags

| Parameter       | Example             | Description                                             |
| --------------- | ------------------- | ------------------------------------------------------- |
| `embed`         | `?embed=1`          | Minimal chrome for iShare iframe embed                  |
| `dev`           | `?dev=1`            | Dev panel — authoring, URL flags, embed QA              |
| `no`            | `?no=no_vdqq3f4hfw` | Deep link — open a naming-opportunity panel (`no_*` id) |
| `notFoundTest`  | `?notFoundTest=1`   | Force tour not-found (404) screen                       |
| `loadErrorTest` | `?loadErrorTest=1`  | Force viewer load-error overlay (panorama + 3D)         |

**Examples:**

- Dev mode: `http://localhost:5173/t_l01wnq8eh6/s_dtv27wfrbi?dev=1`
- Embed: `http://localhost:5173/?embed=1`
- Direct tour link: `http://localhost:5173/t_8kx3m2p9qa/s_ktujv5s3bg`
- Naming opportunity deep link:
  `http://localhost:5173/t_l01wnq8eh6/s_hfiucp83au?no=no_vdqq3f4hfw`

Full flag list: [docs/product/PRODUCT_SPEC.md](docs/product/PRODUCT_SPEC.md),
[docs/engineering/DEV_PANEL.md](docs/engineering/DEV_PANEL.md).

## iShare Embed

```html
<iframe
  src="https://tour.ishare.ca/t_l01wnq8eh6/s_dtv27wfrbi?embed=1"
  title="Ken Sargent House Virtual Tour"
  allow="fullscreen"
  loading="lazy"
  style="width:100%; height:min(80vh, 720px); border:0; border-radius:8px;"
></iframe>
```

Contract: [docs/ops/EMBED.md](docs/ops/EMBED.md).

## Project structure

```
apps/
  tour-viewer/                Vite viewer (`tour.ishare.ca`)
    assets/                   Source tour media
    apps/tour-viewer/public/assets/            Auto-synced copy (served at /assets/…)
    tours/                    `{tourId}.json`, `catalog.json`
    src/                      Viewer application source
  admin/                      Next.js CMS (`admin.ishare.ca`, target)
packages/                     Shared schema and API client (next extraction)
workers/tour-og/              Crawler OG HTML (Facebook / LinkedIn)
workers/ask-guide/            Production Tour Guide API
docs/                         Index: docs/README.md (product/ engineering/ ops/ client/)
```

## Assets

Add files under `apps/tour-viewer/assets/{clientId}/{tourId}/` (see
[`apps/tour-viewer/assets/README.md`](apps/tour-viewer/assets/README.md).
**Panorama JPGs in `panoramas/` must be converted to WebP** before the tour uses
them. Conventional paths are inferred at load — do not store `/assets/…` URLs in
JSON unless they are overrides.

```bash
npm run sync-assets
```

Copies `apps/tour-viewer/assets/` → `apps/tour-viewer/public/assets/` (also runs
on `dev` and `build`).

## Hotspot & landing coordinate tuning

```
http://localhost:5173/t_l01wnq8eh6/s_dtv27wfrbi?dev=1
```

| Goal                             | Action                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Landing view** (`defaultView`) | Pan/zoom to the desired start angle → **Apply defaultView (L)** (saves JSON + bakes thumbnail) |
| **Nav hotspot**                  | Click panorama → name + target scene → **Create nav**                                          |
| **Naming opportunity**           | Click panorama → name, price, status, body → **Create NO**                                     |

Details: [docs/engineering/DEV_PANEL.md](docs/engineering/DEV_PANEL.md).

## Tour Guide

Bottom-right **Ask Tour Guide** knows the current scene. Context comes from tour
JSON + catalog (`assembleTourContext`). Live replies: Cloudflare Worker
(`workers/ask-guide/`, `VITE_ASK_GUIDE_API_URL`). Mock fallback: `?guideMock=1`.
Per-tour on via `askGuideEnabled`; QA force `?askGuide=1`.

See [docs/ops/DEPLOY.md](docs/ops/DEPLOY.md#ask-guide-live-ai-readiness).

## Tech stack

Vite + React + TypeScript viewer · Next.js admin · Photo Sphere Viewer ·
Three.js (model3d) · Cloudflare Workers (OG + Ask Guide). Why:
[docs/engineering/TECH_STACK.md](docs/engineering/TECH_STACK.md).

## Documentation

| Document                                                                         | Description                       |
| -------------------------------------------------------------------------------- | --------------------------------- |
| [`docs/README.md`](docs/README.md)                                               | Documentation index               |
| [`docs/engineering/CODING_GUIDELINES.md`](docs/engineering/CODING_GUIDELINES.md) | Engineering conventions & doc map |
| [`docs/engineering/ADMIN_UI.md`](docs/engineering/ADMIN_UI.md)                   | Tour Admin UI — shadcn rules      |
| [`docs/engineering/GIT_WORKFLOW.md`](docs/engineering/GIT_WORKFLOW.md)           | Commit/push — one task per commit |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)                                             | What to build next (Phase 2+)     |
| [`docs/product/PRODUCT_SPEC.md`](docs/product/PRODUCT_SPEC.md)                   | URL, embed, catalog, schemas      |
| [`docs/product/PROJECT_CONTEXT.md`](docs/product/PROJECT_CONTEXT.md)             | SeekBeak context, demo script     |
| [`docs/engineering/TECH_STACK.md`](docs/engineering/TECH_STACK.md)               | Why this stack                    |
| [`docs/ops/DEPLOY.md`](docs/ops/DEPLOY.md)                                       | `tour.ishare.ca` deploy           |
| [`docs/ops/EMBED.md`](docs/ops/EMBED.md)                                         | iframe + postMessage              |
