# iShare Virtual Tour — Roadmap

> **Single source of truth** for what to build next — Phase 1 checklists through
> long-term platform work.  
> Product contracts (URL, catalog, schemas):
> [PRODUCT_SPEC.md](./PRODUCT_SPEC.md).  
> Project context and demo narrative:
> [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

---

## Overview

Phase 0 proved in-house navigation, transitions, hotspot UX, naming
opportunities, multi-client branding, and scene-aware AI over the SeekBeak
embed. **Phase 1** ships an iframe-ready **Production v1** on iShare. Later
phases turn the static JSON prototype into a **scalable product** integrated
with Giftabulator®, Power Donor Platform, and a central content API.

| Phase | Name                            | Status      |
| ----- | ------------------------------- | ----------- |
| **0** | Proof / stakeholder demo        | ✅ Complete |
| **1** | Production v1 — iShare embed    | ✅ Complete |
| **2** | Platform integration            | Planned     |
| **3** | Scale — VR/XR, analytics, depth | Planned     |

Work **top-down** within each phase. **Checklists live here only.** When work
feels slow on device, apply [PERFORMANCE.md](./PERFORMANCE.md) (playbook, not a
second task list).

---

## Phase 0 — Proof demo ✅

Delivered scope (reference only — do not reopen unless regressing):

- Vite + React + TS, PSV virtual tour + markers
- Nav / info / nav-preview hotspots, TourNavFloat, breadcrumb + history
- Zoom + fade transitions, landing animation, InfoPopup, NO panels
- Mock AI assistant, client intro + multi-tour catalog
- Immersive bg, share tour, naming directory
- Embed / dev URL params, panorama error UI, WebP workflow
- Catalog `visibility` filter (`public` on `/`, routable `public` + `unlisted`)
- Floor-plan minimap (later removed from product)

Demo script and SeekBeak context: [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

---

## Phase 1 — Production v1 (ishare embed) ✅

**Goal:** Ship an iframe-ready **Production v1** on `tour.ishare.ca` with
`?embed=1` chrome trim + `postMessage`. Parent-site iframe `src` swaps happen
per tour during [Client rollout](#client-rollout-until-cms-exists) (not a Phase
1 blocker).

### Success criteria

- [x] Complete tour navigation without confusion (scene panel, history,
  ```
  transitions)
  ```
- [x] Naming directory and `?no=` deep links work
- [x] Scene-aware Tour Guide answers FAQs (mock + production live Worker)
- [x] `npm run dev` and `npm run build` succeed
- [x] Embed mode ready for iShare iframe (`?embed=1` chrome trim +
  ```
  `postMessage`)
  ```
- [x] Invalid tour id shows dedicated “Tour not found” (no silent default
  ```
  fallback)
  ```
- [x] Deployed to production host — CI + `tour.ishare.ca` DNS; see
  ```
  [DEPLOY.md](./DEPLOY.md)
  ```

### Sprint A — Embed & demo safety

- [x] `?embed=1` **chrome trim** — reduce FAB dock (hide Share/Help/Controls;
  ```
  keep Explore); PSV control pill always on; lighter splash for iframe
  ```
- [x] **Unknown tour URL** — dedicated “Tour not found” view
- [x] **Explore scene thumbnails** — baked `scene.thumbnail` previews for
  ```
  location gallery/list cards (`npm run generate-thumbnails`). Naming
  gallery cards still use a lightweight runtime crop at the hotspot view
  when no per-NO thumb exists. See
  [assets/README.md](../assets/README.md#scene-thumbnails-defaultview) and
  [PERFORMANCE P0 — thumbnails](./PERFORMANCE.md#p0--panorama-assets-highest-impact).
  ```

### Sprint B — Orientation & content sync

- [x] **Hotspot coordinate fine-tuning** — `?dev=1` dev panel: click-to-place,
  ```
  move, nav/info/NO create & edit, `targetView` / `instant` /
  `preview.image`
  ```
- ~~**Floor plan coverage**~~ — **Cancelled / removed.** Full Ken Sargent `map`
  ```
  pin coverage and the floor-plan minimap UI were dropped from the product
  (viewer + Dev + schema). Do not restore without a new product decision.
  ```
- [x] **Mobile layout pass** — React UI chrome on phone: FAB dock vs Guide FAB,
  ```
  safe-area, panel sizing. **M0+M1 shipped** (chrome tiers, overflow dock,
  safe-area). Remaining polish: [MOBILE.md](./MOBILE.md) P1–P3.
  ```
- [x] **Scene transition feedback** — load progress bar on scene navigation (dim
  ```
  overlay not needed; sufficient on slow panoramas)
  ```

### Sprint B½ — Dev panel authoring (`?dev=1`)

Local JSON authoring in the Vite dev server — **precursor to Phase 2 Admin
CMS**. The panel writes `tours/*.json`, `tours/catalog.json`, and
`assets/{clientId}/{tourId}/` without redeploy. Admin will reuse the same
schemas and API shapes; viewer stays iframe-only.

**Evolution:** `DevViewPanel` → `apps/admin` (Next.js) + authenticated dev API.
Do not embed PSV in admin — preview via iframe to this viewer.

#### Delivered — dev panel v1

**Tour & catalog**

- [x] Create tour (new client or existing) — first scene, logo/favicon, branding
- [x] Update tour — title, category, website, primary color, logo/favicon alt
- [x] Catalog visibility (`public` / `unlisted` / `internal`) and featured flag
- [x] Delete tour — JSON, catalog entry, asset folder (danger zone)
- [x] Live catalog snapshot — intro gallery updates without page reload
- [x] Dev tour cache — create/edit/delete reflects in viewer without reload
- [x] Bootstrap unknown tour in dev mode (`devFetchTour` when not in static
  ```
  repo)
  ```

**Scenes**

- [x] Create scene — panorama upload, title, description, defaultView
- [x] Update scene — title, description, firstScene, visibility / Explore order
- [x] Delete scene (non-`firstScene`)
- [x] Duplicate scene — optional child places + naming modes (keep / duplicate /
  ```
  clear)
  ```
- [x] Apply landing view (`defaultView` + thumbnail)
- [x] Replace panorama

**Hotspots**

- [x] Create nav / naming (NO) / general info hotspots — click-to-place
- [x] Move hotspot — reposition from panorama click
- [x] Edit nav — label, target scene, `targetView` sync from landing, `instant`,
  ```
  `preview.image`
  ```
- [x] Create nav — `instant`, `preview.image`; `targetView` from target
  ```
  `defaultView`
  ```
- [x] Edit naming — title, price, status, body
- [x] Edit info — title, body, display, video URL, image
- [x] Delete hotspot

**Viewer integration**

- [x] General info hotspots — full badge label “Information”, nav-style pill +
  ```
  info icon
  ```
- [x] DevTools FAB — collapsible panel shell
- [x] Dev URL flags — preserved across in-app navigation

#### Backlog — dev panel → Admin CMS

Maps to [Admin MVP pages](#7--admin-mvp-pages) below. Keep building in dev panel
until Admin app exists; then port endpoints and retire duplicate UI.

**Tour settings** (`/tours/[tourId]`)

- [x] Organization — name, email, phone(s), fax, address
- [x] Branding — `fontFamily`, `fontSourceUrl` (Google Fonts)
- [x] Product copy — `productFullName`
- [x] Enable Ask Tour Guide — `askGuideEnabled` on create/edit
- [x] Scene transitions — `defaultTransition` (fade/black, speed)
- [x] Immersive background — audio / playlist / manifest / volume

**Scenes & assets**

- [x] Scene thumbnail (per scene) — dev panel **Apply defaultView (L)** and
  ```
  **Replace panorama** bake `scene.thumbnail` via dev API; Explore cards
  consume baked paths. No separate thumbnail upload — landing view / panorama
  replace is the source of truth. Bulk offline: `npm run generate-thumbnails`
  (see [assets/README.md](../assets/README.md#scene-thumbnails-defaultview)).
  ```
- ~~Bulk thumbnail regen~~ — **Cancelled.** Whole-tour button in dev panel not
  ```
  planned; use per-scene bake or CLI `npm run generate-thumbnails`.
  ```
- ~~Bulk floor-plan pin placement~~ — **Cancelled** with floor-plan minimap
  ```
  removal
  ```

**Hotspots & naming**

- [ ] Info popup advanced — `cta` / `ctas`, `sponsor`, `width`, `videoPoster`
- [x] Naming — title, price, status, body, video, image in dev panel
- [ ] Hotspot drag on panorama (Phase 3 admin; dev uses click-to-place)

**Platform**

- [ ] Auth + multi-user (Admin only)
- [ ] Draft vs publish separation (Admin + API)
- [x] Client CRUD — Client tab Manage + Create (contact, branding, tours list);
  ```
  tour create uses existing-client picker only
  ```
- [ ] Asset browser — list/replace/delete beyond single-file upload

**Docs & QA**

- [ ] Dev API reference in `docs/` (endpoint list mirrors
  ```
  `viteDevTourApiPlugin`)
  ```
- [ ] Smoke-test checklist for new tours (queensway-carleton-hospital,
  ```
  ken-sargent-house)
  ```

### Sprint C — Discovery & share polish

- [x] **First-visit hint** — one-time “drag to look around · tap hotspots” coach
  ```
  mark or prominent Help entry
  ```
- [x] **Share link OG meta** — `og:title`, `og:image` (+ description, url) per
  ```
  tour/scene; client-side sync for share previews (see `useTourOpenGraph`)
  ```
- [x] **Share panel link preview** — in-panel card (image, host, title,
  ```
  description) aligned with OG meta before copy / Share via; scene thumbnail or
  client logo
  ```
- [x] **Share via Email** — Gmail web compose (reliable in browsers where
  ```
  `mailto:` handlers are blocked)
  ```

### Tour chrome (recent)

- [x] **Play Tour** — navbar guided walkthrough + Help tips when a sequence
  ```
  exists
  ```
- [x] **Place overview / soft-lead** — overview pins, suppress flags, Explore
  ```
  place lead copy
  ```
- [x] **Dev scene duplicate** — duplicate hub (+ optional child places) with
  ```
  naming keep / duplicate / clear
  ```

### Tour Guide (Ask Guide)

Scene-aware assistant over assembled tour + catalog context
(`assembleTourContext`). Early live LLM is shipped (Cloudflare Worker); platform
DB-backed chat remains under [Live AI assistant](#live-ai-assistant).

**Delivered**

- [x] Mock assistant — scene/tour copy, namings, suggested question chips
  ```
  (`?guideMock=1` or when live unavailable)
  ```
- [x] Guide FAB + chat panel (`AiAssistant`, `AiChatPanel`) — FAB label
  ```
  **Ask Tour Guide**; idle ring ↔ speaking orb morph
  ```
- [x] CSS orb avatar (`GuideAvatar`) — shared mark, no per-tour guide image
- [x] Voice input (mic) + read aloud + copy on replies
- [x] Production live path — Cloudflare Worker + `VITE_ASK_GUIDE_API_URL` on
  ```
  `tour.ishare.ca`
  ```
- [x] Per-tour `askGuideEnabled` (Dev Tours create/edit); global
  ```
  `SHOW_ASK_GUIDE` stays off; QA `?askGuide=1`
  ```
- [x] Help ↔ Guide chrome — how-to replies → Open Help + Explore tour; Help
  ```
  panel → Explore / Ask Tour Guide links
  ```
- [x] Nav-preview Guide nudge + proximity / overview welcome FAB bubbles

**Backlog**

- _(none for Phase 1 Tour Guide UI)_ — server-assembled context /
  `POST /v1/tour/chat` → [Live AI assistant](#live-ai-assistant)

### 3D viewer prototype

- [x] `TourViewerHandle` abstraction — renderer-agnostic interface for
  ```
  TourPage ↔ viewer communication (`src/viewer-shared/viewerHandle.ts`)
  ```
- [x] `ThreeDViewer` — GLTF loader + OrbitControls + render loop
  ```
  (`src/viewer-3d/ThreeDViewer.tsx`, lazy-loaded)
  ```
- [x] `tour.viewerType` discriminator — `'panorama' | 'model3d'` on Tour type
- [x] `scene.model` field — GLTF/GLB URL per scene
- [x] `HotspotPosition` 3D extension — `WorldPosition { x, y, z }` union
- [x] Demo tour (`tours/3d-demo.json`) — Sponza atrium test scene
- [x] Catalog integration — Demo category badge, placeholder thumbnail

### Platform (Phase 1 exit)

- [x] Catalog `visibility` + intro gallery filter
- [x] **iShare iframe integration** — viewer `postMessage` contract
  ```
  (`tour:ready` / `tour:scene` / `tour:resize`); Embed mode host harness +
  Debug → embed. Parent `src` cutover → Client rollout (per tour).
  ```
- [x] **Deploy pipeline** — production `npm run build`, GitHub Actions, `CNAME`,
  ```
  `staticwebapp.config.json`, [DEPLOY.md](./DEPLOY.md). `tour.ishare.ca` DNS +
  GitHub Pages custom domain live.
  ```

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
| `/clients/[clientId]`              | tour list, visibility, featured                    | partial — featured/visibility on tour update |
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
- `tours/{tourId}.json` — tour config
- Register tour JSON in `src/services/jsonTourRepository.ts` and
  `tours/catalog.json`
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

Immersive viewing on supported headsets via **WebXR** (session API) +
**Three.js** (engine). Same tour JSON, panoramas, hotspots, and naming — no
duplicate content per format. Native OpenXR / visionOS apps stay out of scope.

**v1 decisions (locked):**

| Topic             | Choice                                                                     |
| ----------------- | -------------------------------------------------------------------------- |
| Session           | WebXR `immersive-vr`                                                       |
| Engine            | Three.js (`WebGLRenderer.xr`)                                              |
| Headset / browser | Meta Quest Browser first; PC VR browsers nice-to-have                      |
| Mode              | Seated look-around (no teleport / room-scale walk)                         |
| Content order     | **Panorama** equirect sphere MVP first, then **model3d** on `ThreeDViewer` |
| Flat UI           | Keep Photo Sphere Viewer; XR is a parallel seated path (PSV has no WebXR)  |

**Ship checklist:**

- [x] Enter/Exit VR for panorama tours (Quest Browser / WebXR-capable)
- [x] Hide flat Explore / Dev / Ask Guide chrome while XR session is active
- [x] Nav hotspot select via controller ray in XR
- [x] Reuse shared WebXR session helper on `ThreeDViewer`
- [x] Embed / iframe: hide Enter VR (WebXR permission / top-level)

### 3D model tours (production)

Prototype shipped in Phase 1. Production-readiness requires:

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
| overview → entrance disorienting | Tune `targetView` in dev panel or JSON                                                                             |
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
| [TECH_STACK.md](./TECH_STACK.md)                                   | Stack; note DB/API when added                       |
| [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)                     | Engineering conventions                             |
| [DEV_PANEL.md](./DEV_PANEL.md)                                     | Dev panel usage (`?dev=1`)                          |
| [EMBED.md](./EMBED.md)                                             | Embed mode (`?embed=1`) — iframe & postMessage      |
| [PERFORMANCE.md](./PERFORMANCE.md)                                 | Performance playbook (how to tune; not a task list) |
| [MOBILE.md](./MOBILE.md)                                           | React UI layout on phone; PSV reference-only        |
| [assets/README.md](../assets/README.md)                            | Per-client asset layout                             |
| [CLIENT_REQUIRED_INFORMATION.md](./CLIENT_REQUIRED_INFORMATION.md) | Client intake checklist (sales)                     |
| [ARCHITECT_DELIVERABLES.md](./ARCHITECT_DELIVERABLES.md)           | 3D architect → engineering handoff                  |

---

## Changelog

| Date       | Note                                                                                                                                                                                         |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-01 | Docs sweep — Phase 1 complete; remove minimap; Tour Guide live; Dev panel tabs; naming status `open`/`soon`; intake/architect cleanup                                                        |
| 2026-08-01 | Docs: floor-plan minimap removed from product (viewer + Dev + schema); fix leftover “CRUD remains” wording                                                                                   |
| 2026-08-01 | Phase 1 → ✅ Complete; parent iframe `src` cutover moved to Client rollout (per-tour launch)                                                                                                 |
| 2026-08-01 | Cancel bulk thumbnail regen in Dev panel (CLI / per-scene bake remain)                                                                                                                       |
| 2026-08-01 | Cancel Floor plan coverage (+ bulk pin editor); floor-plan feature later fully removed                                                                                                       |
| 2026-08-01 | Phase 1 sync — Tour Guide live + per-tour enable + Help chrome CTAs; Play Tour / place overview / scene duplicate delivered; drop mock-only framing (knowledge JSON already removed earlier) |
| 2026-07-03 | 3D viewer prototype — ThreeDViewer, TourViewerHandle, lazy-load, demo tour + catalog                                                                                                         |
| 2026-08-04 | VR/XR v1 — WebXR + Three.js seated panorama first; Quest Browser; model3d WebXR next                                                                                                         |
| 2026-07-03 | Share panel link preview + Gmail web compose for Share via Email                                                                                                                             |
| 2026-07-03 | Share link OG meta — per tour/scene Open Graph + Twitter Card tags                                                                                                                           |
| 2026-07-03 | AI guide section (Phase 1 mock) — move voice-input backlog out of Sprint C                                                                                                                   |
| 2026-07-03 | Drop visit-progress; thumbnail auto-bake note; trim naming backlog (priceLabel, name sync)                                                                                                   |
| 2026-07-03 | Phase 1 sprint checkoffs — deploy, mobile M0+M1, client CRUD, embed postMessage                                                                                                              |
| 2026-06-25 | MOBILE.md — React UI layout spec; PSV reference-only; links from ROADMAP/PERFORMANCE                                                                                                         |
| 2026-06-11 | Dev panel — organization + Google Fonts branding on tour update                                                                                                                              |
| 2026-06-11 | Dev panel v1 — full tour/scene/hotspot/floor-plan/knowledge CRUD; Admin migration table                                                                                                      |
| 2026-06-11 | Scene transition feedback done — progress bar only (no dim overlay)                                                                                                                          |
| 2026-06-11 | Phase 2 platform architecture (sections 1–9) + Sprint 2A checklist                                                                                                                           |
| 2026-06-11 | Initial roadmap — VR/XR, database, mobile themes                                                                                                                                             |
| 2026-06-11 | PERFORMANCE.md → playbook (no checkboxes); ROADMAP = sole task list                                                                                                                          |
