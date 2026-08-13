# iShare Virtual Tour — Roadmap

> **What to build next.** Product contracts:
> [PRODUCT_SPEC.md](./PRODUCT_SPEC.md). Demo narrative:
> [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

---

## Overview

| Phase | Name                         | Status      |
| ----- | ---------------------------- | ----------- |
| **0** | Proof / stakeholder demo     | ✅ Complete |
| **1** | Production v1 — iShare embed | ✅ Complete |
| **2** | Platform integration         | Planned     |
| **3** | Scale — 3D parity, analytics | Planned     |

Work **top-down** within the open phase. **Checklists live here only.** When
embed/mobile feels slow, use [PERFORMANCE.md](./PERFORMANCE.md) (playbook, not a
second task list).

---

## Phase 0 — Proof demo ✅

Vite + React + PSV, nav/info hotspots, Explore + breadcrumb, zoom+fade,
InfoPopup / naming panels, mock Guide, multi-tour catalog, embed/dev flags.
Narrative: [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

---

## Phase 1 — Production v1 (ishare embed) ✅

Shipped on `tour.ishare.ca`: `?embed=1` + `postMessage`, Tour not found, baked
`scene-thumbs` / `hotspot-thumbs`, `?dev=1` authoring, mobile chrome M0+M1, Tour
Guide live Worker, Play Tour, place overview, share/OG (`workers/tour-og`), 3D
prototype (`tours/t_ctx4e6rkty.json`), XR v1 panorama, catalog visibility,
GitHub Pages deploy.

Parent iframe `src` cutover is per-tour during
[Client rollout](#client-rollout-until-cms-exists) (not a Phase 1 blocker).

### Sprint A — Embed & demo safety

Delivered: embed chrome trim, unknown-tour view, baked scene thumbs. Naming pin
cards use `hotspot-thumbs/` (not runtime crop). See
[assets/README.md](../assets/README.md).

### Sprint B — Orientation & content sync

Delivered: `?dev=1` click-to-place, mobile M0+M1, scene-nav progress bar.
Remaining polish: [MOBILE.md](./MOBILE.md) P1–P3. Floor-plan minimap cancelled —
do not restore without a new product decision.

### Sprint B½ — Dev panel authoring (`?dev=1`)

Local JSON authoring is the precursor to Phase 2 Admin CMS. Usage:
[DEV_PANEL.md](./DEV_PANEL.md). Admin will iframe this viewer — do not embed PSV
in the admin bundle.

**Still open (carry into Admin):**

- [ ] Info popup advanced — `cta` / `ctas`, `sponsor`, `width`, `videoPoster`
- [ ] Hotspot drag on panorama (Phase 3 admin; dev uses click-to-place)
- [ ] Auth + multi-user (Admin only)
- [ ] Draft vs publish separation (Admin + API)
- [ ] Asset browser — list/replace/delete beyond single-file upload
- [ ] Dev API reference in `docs/` (mirrors `viteDevTourApiPlugin`)
- [ ] Smoke-test checklist for new tours (`t_9zs0j4a7xt`, `t_l01wnq8eh6`)

### Sprint C / Tour chrome / Tour Guide / 3D / Platform exit

Delivered: first-visit hint, OG + share panel, Play Tour, place overview, scene
duplicate, Guide live Worker + per-tour `askGuideEnabled`, `TourViewerHandle` +
`ThreeDViewer`, catalog visibility, iframe `postMessage`, deploy pipeline.

3D demo: `tours/t_ctx4e6rkty.json` (Sponza). Remaining 3D gaps:
[3D model tours](#3d-model-tours-production).

---

## Phase 2 — Platform integration

Turn JSON files into a maintainable product tied to iShare systems.

**Target architecture (do not merge viewer + admin into one Next app):**

> **Vite embed viewer** + **Next.js admin** + **Public API** + **PostgreSQL** +
> **Blob/CDN** — share types via monorepo; Three.js only as a PSV extension
> layer.

### 1 — Layer stack

| Layer                | Choice                         | Why                                         |
| -------------------- | ------------------------------ | ------------------------------------------- |
| **360 embed viewer** | Vite SPA (this repo)           | iframe + WebGL; no SSR benefit              |
| **Admin / CMS**      | Next.js (separate app)         | auth, forms, preview iframe, API routes     |
| **Public API**       | Hono/Fastify or Next API       | embed, iShare, future VR clients            |
| **DB**               | PostgreSQL                     | client → tour → scene → hotspot relations   |
| **Assets**           | Azure Blob + CDN               | large panoramas; draft/publish separation   |
| **AI**               | Azure OpenAI (server)          | keys server-side; see Live AI below         |
| **360 engine**       | PSV + optional Three.js module | PSV = tour UX; Three = custom 3D / VR later |

### 2 — Monorepo layout (target)

```
ishare-platform/
├── apps/
│   ├── tour-viewer/          ← this repo (Vite)
│   └── admin/                ← Next.js CMS
├── packages/
│   ├── tour-schema/          ← types, Zod, PublishedTourBundle
│   └── tour-api-client/      ← fetch helpers (viewer + admin)
├── services/
│   └── api/                  ← public + admin API (optional split)
└── infra/                    ← CDN, env (optional)
```

Admin previews tours via **iframe** to `tour-viewer` — do not embed PSV inside
admin bundle.

### 3 — Publish model

```
Draft (DB)  →  Preview URL (?preview=token)
           →  Publish  →  immutable JSON snapshot + CDN cache bust
           →  Viewer fetches published bundle only
```

- `tours/*.json` schema remains the **DB design reference**
- `PublishedTourBundle` (`src/types/publishedTour.ts`) is the viewer/API
  contract
- Giftabulator sync: **status / price / CTA URL** in DB → included on publish

### 4 — Deploy domains (target)

| Service | URL                              |
| ------- | -------------------------------- |
| Viewer  | `tour.ishare.ca`                 |
| Admin   | `admin.ishare.ca`                |
| API     | `api.ishare.ca`                  |
| Assets  | CDN / Blob in front of panoramas |

### 5 — Public API (MVP)

| Method | Path                   | Purpose                           |
| ------ | ---------------------- | --------------------------------- |
| `GET`  | `/v1/catalog`          | intro gallery, client list        |
| `GET`  | `/v1/tours/:tourId`    | `PublishedTourBundle` (viewer)    |
| `POST` | `/v1/tour/chat`        | live assistant                    |
| `POST` | `/v1/analytics/events` | scene view, hotspot click (batch) |

Admin (auth required): CRUD clients/tours/scenes, asset upload URLs, publish,
preview tokens.

### 6 — Database (PostgreSQL, MVP)

Start with **JSONB** `draft_json` / `published_json` per tour; normalize scenes
and hotspots when hotspot drag editor lands (Phase 3).

Core tables: `clients`, `tours`, `assets`, `publish_log`, admin `users` / roles.

### 7 — Admin MVP pages

| Route                              | Purpose                                            | Dev panel today (`?dev=1`)                   |
| ---------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| `/login`                           | Entra ID / Auth.js                                 | — (local dev only)                           |
| `/`                                | dashboard — clients, tours, draft/published status | partial — create tour, catalog visibility    |
| `/clients/[clientId]`              | tour list, visibility                              | partial — visibility on tour update          |
| `/tours/[tourId]`                  | tour settings — branding, org                      | partial — tour tab, org, fonts               |
| `/tours/[tourId]/scenes`           | scene list, firstScene, panoramas                  | partial — scene tab CRUD                     |
| `/tours/[tourId]/scenes/[sceneId]` | hotspot editor (MVP: yaw/pitch + popup form)       | partial — hotspot tab + move                 |
| `/tours/[tourId]/preview`          | iframe preview with token URL                      | — (viewer `?dev=1` is the preview today)     |

Follow-ups: `/tours/[tourId]/naming` (NO + CTA — partial via NO hotspot forms).

**Migration rule:** new authoring features land in dev panel first (JSON + dev
API), then move to Admin when auth and publish exist — same payload shapes.

### 8 — Three.js placement

| Use                         | Approach                                                            |
| --------------------------- | ------------------------------------------------------------------- |
| 360 panorama tour           | **PSV** (current)                                                   |
| 3D model walkthrough (GLTF) | **ThreeDViewer** (`src/viewer-3d/`) — **shipped**                   |
| Custom 3D depth / overlays  | Extend `ThreeDViewer` or `viewer/extensions/`                       |
| VR / XR (Phase 3)           | WebXR + Three.js: panorama seated sphere first, then `ThreeDViewer` |

Both viewers conform to `TourViewerHandle`
(`src/viewer-shared/viewerHandle.ts`). `TourPage` switches via `React.lazy`
based on `tour.viewerType` — panorama tours never load the Three.js viewer
chunk.

**Current state:** ThreeDViewer loads GLTF with OrbitControls; markers and
anchored panels exist. Remaining gaps vs panorama: nav-preview parity, place
overview toggle, modal InfoPopup path, Play Tour prefetch — see Phase 3
checklist below.

### 9 — What to avoid

| Anti-pattern                     | Why                                           |
| -------------------------------- | --------------------------------------------- |
| Everything in one Next.js app    | embed bundle + admin + API blast radius       |
| Move viewer to Next now          | Phase 1 embed risk; little SSR gain for WebGL |
| NoSQL-only for tour graph        | scene/hotspot relations fit SQL               |
| Bundle tour JSON in viewer build | admin publish useless; redeploy per edit      |

### Phase 2 sprints (engineering)

| Sprint | Viewer (Vite)                                  | Platform                                                    |
| ------ | ---------------------------------------------- | ----------------------------------------------------------- |
| **2A** | `TourRepository` + `JsonTourRepository`        | `PublishedTourBundle` type; extract `tour-schema` package   |
| **2B** | `ApiTourRepository` behind `VITE_TOUR_API_URL` | Postgres + `GET /v1/tours/:id` mirroring JSON               |
| **2C** | embed QA unchanged                             | Admin: login + dashboard + tour settings                    |
| **2D** | preview URL support in viewer                  | Admin: scenes + hotspots + publish                          |
| **2E** | —                                              | DB-backed `POST /v1/tour/chat` (server context) + analytics |
| **2F** | optional JSON fallback removal                 | Giftabulator status sync job                                |

#### Sprint 2A checklist

- [x] `TourRepository` — `src/services/tourRepository.ts`, JSON + API stubs
- [x] `PublishedTourBundle` — `src/types/publishedTour.ts`
- [x] `normalizeTourAssets` — shared JSON/API path
- [x] `loadTourAsync` **/** `VITE_TOUR_API_URL` — env-gated API mode
- [ ] Extract `packages/tour-schema` in monorepo
- [ ] `TourPage` **async load** when API mode enabled (keep sync JSON default)

### Live AI assistant

**Status:** early live is **shipped / in production** on `tour.ishare.ca` via
Cloudflare Worker. Tour Guide stays **per-tour** (`askGuideEnabled`); global
`SHOW_ASK_GUIDE` remains `false`; QA with `?askGuide=1` / `?guideMock=1`.

**In-repo path (early live — current):**

- Shared core: [`api/shared/askGuideCore.mjs`](../api/shared/askGuideCore.mjs)
- DEV proxy: Vite `/__dev/api/ask-guide/*`
  ([`scripts/lib/askGuideDev.mjs`](../scripts/lib/askGuideDev.mjs))
- **Production API:** Cloudflare Worker
  [`workers/ask-guide/`](../workers/ask-guide/) — `GET /api/tour/chat/status`,
  `POST /api/tour/chat`
- Optional: Azure Functions [`api/`](../api/) (same routes)
- Client: [`src/services/askGuide.ts`](../src/services/askGuide.ts) —
  `VITE_ASK_GUIDE_API_URL` (Worker `…/api`); mock when live unavailable /
  `?guideMock=1`

```typescript
POST /api/tour/chat
{
  tourId, sceneId, context, messages[]
}
```

The browser builds a small **context pack** from the loaded tour JSON (current
place, namings, facility summary) and sends it with the chat. API keys stay
server-side (`OPENAI_API_KEY`).

**Sprint 2E follow-up (not the current Worker):** when tours are DB-backed, move
packing to the server as `POST /v1/tour/chat` — same chat UI, different base
URL. Do not confuse with today’s Worker `POST /api/tour/chat`.

See [DEPLOY.md — Ask Guide](./DEPLOY.md#ask-guide-live-ai-readiness) and
[workers/ask-guide/README.md](../workers/ask-guide/README.md).

### Database & API (product)

- Single source of truth for clients, scenes, hotspots, naming opportunities,
  pricing, status (`open` | `sold` | `reserved` | `soon`)
- Sync availability and CTAs with **Giftabulator** and donor workflows
- Serve tours to iShare website, embed mode, and admin tools
- Non-developer updates without redeploying static JSON

| System               | Purpose                                   |
| -------------------- | ----------------------------------------- |
| iShare website       | Embed tours, deep links, client pages     |
| Giftabulator®        | CTA URLs, calc context, giving flows      |
| Power Donor Platform | Donor / opportunity data where applicable |

JSON schema in `tours/*.json` remains the reference model for DB design. Client
id convention (`gphospitalfoundation`, etc.) stays stable across URLs and
assets.

### Content admin (CMS)

Admin UI for scenes, hotspot positions, copy, video URLs, pricing, and status —
reducing JSON edits and redeploys. See **Admin MVP pages** above.

### Analytics & insights

Scene views, hotspot clicks, popup opens, Giftabulator CTA clicks.

### Client rollout (until CMS exists)

Onboard new clients / tours:

- `assets/{clientId}/` — panoramas, brand
- `tours/{tourId}.json` — tour config (`import.meta.glob` picks it up)
- `tours/catalog.json` — client + tour entry
- **Parent embed cutover (per tour)** — on ishare.ca (or client site), set
  iframe `src` to `https://tour.ishare.ca/{tourId}/{sceneId}?embed=1` when that
  tour goes live. See [EMBED.md](./EMBED.md) /
  [DEPLOY.md](./DEPLOY.md#ishareca-iframe-integration). Not a Phase 1 gate — do
  it as each tour launches.

### Accessibility & performance (ongoing)

- Extend keyboard navigation and screen reader labels
- CDN or asset pipeline for large panoramas —
  [PERFORMANCE P0 — CDN / cache](./PERFORMANCE.md#p0--panorama-assets-highest-impact)
- Error recovery and slow-network messaging
- Full playbook: [PERFORMANCE.md](./PERFORMANCE.md)

**Phasing note:** Database integration may move earlier if multiple clients and
live pricing updates become urgent.

---

## Phase 3 — Scale

### VR / XR support

Immersive viewing on supported headsets via **WebXR** + **Three.js**. Same tour
JSON — no duplicate content per format. Native OpenXR / visionOS apps stay out
of scope.

**v1 (shipped):** `immersive-vr`, seated look-around, Quest Browser first,
panorama equirect sphere then model3d on `ThreeDViewer`, hide flat chrome while
XR is active, hide Enter VR in embed.

### 3D model tours (production)

Prototype shipped in Phase 1 (`t_ctx4e6rkty` and other `ishare-demos` tours).
Production-readiness still needs:

- [ ] 3D hotspot rendering — raycasting + world-position markers
- [ ] Anchored panels in 3D — CSS2DRenderer or HTML overlay
- [ ] Multi-room GLTF navigation — camera path transitions between rooms
- [ ] 3D scene thumbnails — auto-capture from Three.js renderer
- [ ] Dev panel support for 3D tours — model upload, world-position hotspot
      placement

### Deeper platform

- Hotspot drag editor / placement admin
- Viewport zone detection (L2 gaze — “what you’re looking at”)
- Native apps only if VR/XR or audience requires (web-first default)

---

## Out of scope (for now)

- Replacing professional 360° capture / photography workflow
- Full SeekBeak feature parity where it does not serve iShare fundraising UX
- Native iOS/Android apps (unless VR/XR requires otherwise)
- Floor-plan minimap / pin coverage / bulk pin editor (removed from product)

---

## Risks (active)

| Risk                             | Mitigation                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Hotspot coordinates off          | `?dev=1` dev panel — click logger + CRUD                                                                           |
| Overview → entrance disorienting | Tune `targetView` in dev panel or JSON                                                                             |
| Tour Guide live gaps             | Worker key / URL health; richer `assembleTourContext`; keep global ON off — enable per tour                        |
| Large panorama load on mobile    | [PERFORMANCE P0](./PERFORMANCE.md#p0--panorama-assets-highest-impact), [P1](./PERFORMANCE.md#p1--preload-strategy) |
| React UI overlap on phone        | [MOBILE.md](./MOBILE.md) — layout pass M1–M2                                                                       |
| JSON edits bypass admin audit    | Dev panel local-only; Admin + publish for production                                                               |

---

## Related documents

| Document                                                           | Relevance                                           |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)                               | URL contract, catalog visibility, schemas           |
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)                         | SeekBeak context, stakeholder demo script           |
| [TECH_STACK.md](./TECH_STACK.md)                                   | Why this stack                                      |
| [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)                     | Engineering conventions                             |
| [DEV_PANEL.md](./DEV_PANEL.md)                                     | Dev panel usage (`?dev=1`)                          |
| [EMBED.md](./EMBED.md)                                             | Embed mode (`?embed=1`) — iframe & postMessage      |
| [DEPLOY.md](./DEPLOY.md)                                           | `tour.ishare.ca`                                    |
| [PERFORMANCE.md](./PERFORMANCE.md)                                 | Performance playbook (how to tune; not a task list) |
| [MOBILE.md](./MOBILE.md)                                           | React UI layout on phone                            |
| [assets/README.md](../assets/README.md)                            | Per-client asset layout                             |
| [CLIENT_REQUIRED_INFORMATION.md](./CLIENT_REQUIRED_INFORMATION.md) | Client intake checklist (sales)                     |
| [ARCHITECT_DELIVERABLES.md](./ARCHITECT_DELIVERABLES.md)           | 3D architect → engineering handoff                  |

---

## Changelog

| Date       | Note                                                                                  |
| ---------- | ------------------------------------------------------------------------------------- |
| 2026-08-13 | Collapse Phase 0–1 checklists; 3D demo id `t_ctx4e6rkty`; archive CURSOR_GLOBAL_RULES |
| 2026-08-01 | Phase 1 → ✅ Complete; parent iframe `src` cutover → Client rollout                   |
