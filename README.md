# iShare Virtual Tour

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

Open [http://localhost:5173](http://localhost:5173)

### Build for production

```bash
npm run build
npm run preview
```

Deploy: [docs/DEPLOY.md](docs/DEPLOY.md).

## Tour flow

Start at `/` (client intro) or a direct `/{tourId}/{sceneId}` link. Move with
**Explore**, pulsing **nav hotspots**, breadcrumb, or **Back**. Scene titles and
opaque ids live in each `tours/t_*.json` — not kebab slugs.

Ken Sargent House (demo path): **Overview** (`s_dtv27wfrbi`) → **Main Entrance**
(`s_zlz39v1fjz`) → **Reception** (`s_vddzraqi1q`).

## Routes

Path-based URLs — `{tourId}` (`t_*`) and `{sceneId}` (`s_*`) come from
[`tours/catalog.json`](tours/catalog.json) and each tour JSON. Scene changes
update the address bar; browser back/forward works.

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

Full flag list: [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md),
[docs/DEV_PANEL.md](docs/DEV_PANEL.md).

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

Contract: [docs/EMBED.md](docs/EMBED.md).

## Project structure

```
assets/{clientId}/{tourId}/   panoramas, scene-thumbs, hotspot-thumbs, naming, brand
public/assets/                Auto-synced copy (served at /assets/…)
tours/                        `{tourId}.json`, `catalog.json`
workers/tour-og/              Crawler OG HTML (Facebook / LinkedIn)
workers/ask-guide/            Production Tour Guide API
src/
  viewer/                     Photo Sphere Viewer (panorama)
  viewer-3d/                  Three.js GLTF walkthrough (lazy)
  viewer-shared/              TourViewerHandle, shared markers
  components/                 React chrome (Explore, Dev, Guide, …)
  pages/TourPage.tsx          SPA orchestrator
docs/                         Index: docs/README.md
```

## Assets

Add files under `assets/{clientId}/{tourId}/` (see
[`assets/README.md`](assets/README.md)). **Panorama JPGs in `panoramas/` must be
converted to WebP** before the tour uses them. Conventional paths are inferred
at load — do not store `/assets/…` URLs in JSON unless they are overrides.

```bash
npm run sync-assets
```

Copies `assets/` → `public/assets/` (also runs on `dev` and `build`).

## Hotspot & landing coordinate tuning

```
http://localhost:5173/t_l01wnq8eh6/s_dtv27wfrbi?dev=1
```

| Goal                             | Action                                                                                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Landing view** (`defaultView`) | Pan/zoom to the desired start angle → **Apply defaultView (L)** (saves JSON + bakes thumbnail) |
| **Nav hotspot**                  | Click panorama → name + target scene → **Create nav**                                          |
| **Naming opportunity**           | Click panorama → name, price, status, body → **Create NO**                                     |

Details: [docs/DEV_PANEL.md](docs/DEV_PANEL.md).

## Tour Guide

Bottom-right **Ask Tour Guide** knows the current scene. Context comes from tour
JSON + catalog (`assembleTourContext`). Live replies: Cloudflare Worker
(`workers/ask-guide/`, `VITE_ASK_GUIDE_API_URL`). Mock fallback: `?guideMock=1`.
Per-tour on via `askGuideEnabled`; QA force `?askGuide=1`.

See [docs/DEPLOY.md](docs/DEPLOY.md#ask-guide-live-ai-readiness).

## Tech stack

Vite + React + TypeScript · Photo Sphere Viewer · Three.js (model3d) ·
Cloudflare Workers (OG + Ask Guide). Why:
[docs/TECH_STACK.md](docs/TECH_STACK.md).

## Documentation

| Document                                                 | Description                       |
| -------------------------------------------------------- | --------------------------------- |
| [`docs/README.md`](docs/README.md)                       | Documentation index               |
| [`docs/CODING_GUIDELINES.md`](docs/CODING_GUIDELINES.md) | Engineering conventions & doc map |
| [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md)           | Commit/push — one task per commit |
| [`docs/ROADMAP.md`](docs/ROADMAP.md)                     | What to build next (Phase 2+)     |
| [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md)           | URL, embed, catalog, schemas      |
| [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md)     | SeekBeak context, demo script     |
| [`docs/TECH_STACK.md`](docs/TECH_STACK.md)               | Why this stack                    |
| [`docs/DEPLOY.md`](docs/DEPLOY.md)                       | `tour.ishare.ca` deploy           |
| [`docs/EMBED.md`](docs/EMBED.md)                         | iframe + postMessage              |
