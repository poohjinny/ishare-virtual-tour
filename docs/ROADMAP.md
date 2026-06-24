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

| Phase | Name                            | Status         |
| ----- | ------------------------------- | -------------- |
| **0** | Proof / stakeholder demo        | ✅ Complete    |
| **1** | Production v1 — iShare embed    | 🟡 In progress |
| **2** | Platform integration            | Planned        |
| **3** | Scale — VR/XR, analytics, depth | Planned        |

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
- Floor plan minimap, immersive bg, share tour, naming directory
- Embed / dev URL params, panorama error UI, WebP workflow
- Catalog `visibility` filter (`public` on `/`, routable `public` + `unlisted`)

Demo script and SeekBeak context: [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

---

## Phase 1 — Production v1 (ishare embed)

**Goal:** Replace the SeekBeak embed on ishare.ca with a safe, polished
`?embed=1` experience and deploy to `tour.ishare.ca` (or chosen host).

### Success criteria

- [x] Complete tour navigation without confusion (scene panel, history,
      transitions)
- [x] Naming directory and `?no=` deep links work
- [x] AI answers scene-relevant FAQs (mock)
- [x] `npm run dev` and `npm run build` succeed
- [ ] Embed mode ready for iShare iframe (`?embed=1` chrome trim +
      `postMessage`)
- [x] Invalid tour id shows dedicated “Tour not found” (no silent default
      fallback)
- [ ] Deployed to production host

### Sprint A — Embed & demo safety

- [ ] **`?embed=1` chrome trim** — reduce FAB dock (e.g. hide Share/Help or
      collapse to essentials); optional lighter splash for iframe
- [x] **Unknown tour URL** — dedicated “Tour not found” view
- [ ] **Explore scene thumbnails** — small equirect preview per location in
      Explore list (intro gallery already has tour-level preview). Asset
      approach:
      [PERFORMANCE P0 — thumbnails](./PERFORMANCE.md#p0--panorama-assets-highest-impact).

### Sprint B — Orientation & content sync

- [ ] **Hotspot coordinate fine-tuning** — `?dev=1` on real panoramas
- [ ] **Floor plan coverage** — `map` coordinates for all Ken Sargent scenes on
      `floorplan.svg` (kitchen, comfort-corner, base-level entrance)
- [ ] **Holodomor / Cancer Research** — scene and NO content pass
- [ ] **Mobile layout pass** — FAB dock vs minimap vs guide FAB on ≤480px;
      safe-area padding audit. If load or jank on device:
      [PERFORMANCE P0–P1](./PERFORMANCE.md#when-to-start).
- [x] **Scene transition feedback** — load progress bar on scene navigation (dim
      overlay not needed; sufficient on slow panoramas)

### Sprint C — Discovery & share polish

- [ ] **First-visit hint** — one-time “drag to look around · tap hotspots” coach
      mark or prominent Help entry
- [ ] **Visit progress** — optional “N / M locations” in Explore or breadcrumb
- [ ] **Share link OG meta** — `og:title`, `og:image` per tour/scene
- [ ] **Guide voice button** — hide or clearly disable “coming soon” mic in chat

### Platform (Phase 1 exit)

- [x] Catalog `visibility` + intro gallery filter
- [ ] **iShare iframe integration** — `postMessage` to parent (analytics,
      resize)
- [ ] **Deploy** — `tour.ishare.ca` (or chosen host), SPA fallback, env config

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

| Method | Path                          | Purpose                           |
| ------ | ----------------------------- | --------------------------------- |
| `GET`  | `/v1/catalog`                 | intro gallery, client list        |
| `GET`  | `/v1/tours/:tourId`           | `PublishedTourBundle` (viewer)    |
| `GET`  | `/v1/tours/:tourId/knowledge` | AI knowledge (or in bundle)       |
| `POST` | `/v1/tour/chat`               | live assistant                    |
| `POST` | `/v1/analytics/events`        | scene view, hotspot click (batch) |

Admin (auth required): CRUD clients/tours/scenes, asset upload URLs, publish,
preview tokens.

### 6 — Database (PostgreSQL, MVP)

Start with **JSONB** `draft_json` / `published_json` per tour; normalize scenes
and hotspots when hotspot drag editor lands (Phase 3).

Core tables: `clients`, `tours`, `tour_knowledge`, `assets`, `publish_log`,
admin `users` / roles.

### 7 — Admin MVP pages

| Route                              | Purpose                                            |
| ---------------------------------- | -------------------------------------------------- |
| `/login`                           | Entra ID / Auth.js                                 |
| `/`                                | dashboard — clients, tours, draft/published status |
| `/clients/[clientId]`              | tour list, visibility, featured                    |
| `/tours/[tourId]`                  | tour settings — branding, org, floor plan          |
| `/tours/[tourId]/scenes`           | scene list, firstScene, panoramas                  |
| `/tours/[tourId]/scenes/[sceneId]` | hotspot editor (MVP: yaw/pitch + popup form)       |
| `/tours/[tourId]/preview`          | iframe preview with token URL                      |

Follow-ups: `/tours/[tourId]/knowledge`, `/tours/[tourId]/naming` (NO + CTA).

### 8 — Three.js placement

| Use                          | Approach                                            |
| ---------------------------- | --------------------------------------------------- |
| 360 panorama tour            | **PSV** (current)                                   |
| Custom 3D / floor plan depth | `packages/viewer-3d` or `viewer/extensions/`        |
| VR / XR (Phase 3)            | WebXR + Three **or** PSV plugin — decide at Phase 3 |

Do not replace PSV wholesale unless product requires walk mode beyond 360°.

### 9 — What to avoid

| Anti-pattern                     | Why                                           |
| -------------------------------- | --------------------------------------------- |
| Everything in one Next.js app    | embed bundle + admin + API blast radius       |
| Move viewer to Next now          | Phase 1 embed risk; little SSR gain for WebGL |
| NoSQL-only for tour graph        | scene/hotspot relations fit SQL               |
| Bundle tour JSON in viewer build | admin publish useless; redeploy per edit      |

### Phase 2 sprints (engineering)

| Sprint | Viewer (Vite)                                  | Platform                                                  |
| ------ | ---------------------------------------------- | --------------------------------------------------------- |
| **2A** | `TourRepository` + `JsonTourRepository`        | `PublishedTourBundle` type; extract `tour-schema` package |
| **2B** | `ApiTourRepository` behind `VITE_TOUR_API_URL` | Postgres + `GET /v1/tours/:id` mirroring JSON             |
| **2C** | embed QA unchanged                             | Admin: login + dashboard + tour settings                  |
| **2D** | preview URL support in viewer                  | Admin: scenes + hotspots + publish                        |
| **2E** | —                                              | `POST /v1/tour/chat`, analytics ingest                    |
| **2F** | optional JSON fallback removal                 | Giftabulator status sync job                              |

#### Sprint 2A checklist

- [x] **`TourRepository`** — `src/services/tourRepository.ts`, JSON + API stubs
- [x] **`PublishedTourBundle`** — `src/types/publishedTour.ts`
- [x] **`normalizeTourAssets`** — shared JSON/API path
- [x] **`loadTourAsync` / `VITE_TOUR_API_URL`** — env-gated API mode
- [ ] Extract **`packages/tour-schema`** in monorepo
- [ ] **`TourPage` async load** when API mode enabled (keep sync JSON default)

### Live AI assistant

Replace `askMockAssistant()` in `src/services/mockAssistant.ts`:

```typescript
POST /v1/tour/chat
{
  tourId, sceneId, sceneTitle, messages[]
}
```

Server loads tour knowledge, builds system prompt, calls Azure OpenAI / OpenAI.
API keys stay server-side.

### Database & API (product)

- Single source of truth for clients, scenes, hotspots, naming opportunities,
  pricing, status (`on_sale` | `sold` | `reserved`)
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

Onboard new clients:

- `assets/{clientId}/` — panoramas, brand
- `tours/{tourId}.json` — tour config
- `tours/{tourId}-knowledge.json` — AI knowledge
- Register tour JSON in `src/services/jsonTourRepository.ts` and
  `tours/catalog.json`

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

Immersive viewing on supported headsets; reuse panoramas, hotspots, and naming
data — no duplicate content per format.

**Open questions:** Which headsets/browsers for v1? Full walk mode vs seated
360°?

### Deeper platform

- Hotspot drag editor / placement admin
- Viewport zone detection (L2 gaze — “what you’re looking at”)
- Native apps only if VR/XR or audience requires (web-first default)

---

## Out of scope (for now)

- Replacing professional 360° capture / photography workflow
- Full SeekBeak feature parity where it does not serve iShare fundraising UX
- Native iOS/Android apps (unless VR/XR requires otherwise)

---

## Risks (active)

| Risk                             | Mitigation                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Hotspot coordinates off          | `?dev=1` click logger                                                                                              |
| overview → entrance disorienting | Tune `targetView` in JSON                                                                                          |
| Mock AI limited until Phase 2    | Rich FAQs + suggested chips                                                                                        |
| Large panorama load on mobile    | [PERFORMANCE P0](./PERFORMANCE.md#p0--panorama-assets-highest-impact), [P1](./PERFORMANCE.md#p1--preload-strategy) |

---

## Related documents

| Document                                       | Relevance                                           |
| ---------------------------------------------- | --------------------------------------------------- |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)           | URL contract, catalog visibility, schemas           |
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)     | SeekBeak context, stakeholder demo script           |
| [TECH_STACK.md](./TECH_STACK.md)               | Stack; note DB/API when added                       |
| [CODING_GUIDELINES.md](./CODING_GUIDELINES.md) | Engineering conventions                             |
| [PERFORMANCE.md](./PERFORMANCE.md)             | Performance playbook (how to tune; not a task list) |
| [assets/README.md](../assets/README.md)        | Per-client asset layout                             |

---

## Changelog

| Date       | Note                                                                |
| ---------- | ------------------------------------------------------------------- |
| 2026-06-11 | Scene transition feedback done — progress bar only (no dim overlay) |
| 2026-06-11 | Phase 2 platform architecture (sections 1–9) + Sprint 2A checklist  |
| 2026-06-11 | Initial roadmap — VR/XR, database, mobile themes                    |
| 2026-06-11 | PERFORMANCE.md → playbook (no checkboxes); ROADMAP = sole task list |
