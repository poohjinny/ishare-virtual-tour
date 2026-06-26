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
- [x] Embed mode ready for iShare iframe (`?embed=1` chrome trim +
      `postMessage`)
- [x] Invalid tour id shows dedicated “Tour not found” (no silent default
      fallback)
- [ ] Deployed to production host

### Sprint A — Embed & demo safety

- [x] **`?embed=1` chrome trim** — reduce FAB dock (hide Share/Help; keep
      Explore + Controls); lighter splash for iframe
- [x] **Unknown tour URL** — dedicated “Tour not found” view
- [ ] **Explore scene thumbnails** — small equirect preview per location in
      Explore list (intro gallery already has tour-level preview). Asset
      approach:
      [PERFORMANCE P0 — thumbnails](./PERFORMANCE.md#p0--panorama-assets-highest-impact).

### Sprint B — Orientation & content sync

- [x] **Hotspot coordinate fine-tuning** — `?dev=1` dev panel: click-to-place,
      move, nav/info/NO create & edit, `targetView` / `instant` /
      `preview.image`
- [ ] **Floor plan coverage** — `map` coordinates for all Ken Sargent scenes on
      `floorplan.svg` (kitchen, comfort-corner, base-level entrance)
- [ ] **Holodomor / Cancer Research** — scene and NO content pass
- [ ] **Mobile layout pass** — React UI chrome on phone: FAB dock vs minimap vs
      guide FAB, safe-area, panel sizing. Spec: [MOBILE.md](./MOBILE.md). PSV
      viewer acceptable as-is (reference only). If load or jank on device:
      [PERFORMANCE P0–P1](./PERFORMANCE.md#when-to-start).
- [x] **Scene transition feedback** — load progress bar on scene navigation (dim
      overlay not needed; sufficient on slow panoramas)

### Sprint B½ — Dev panel authoring (`?dev=1`)

Local JSON authoring in the Vite dev server — **precursor to Phase 2 Admin
CMS**. The panel writes `tours/*.json`, `tours/*-knowledge.json`,
`tours/catalog.json`, and `assets/{clientId}/{tourId}/` without redeploy. Admin
will reuse the same schemas and API shapes; viewer stays iframe-only.

**Evolution:** `DevViewPanel` → `apps/admin` (Next.js) + authenticated dev API.
Do not embed PSV in admin — preview via iframe to this viewer.

#### Delivered — dev panel v1

**Tour & catalog**

- [x] Create tour (new client or existing) — first scene, logo/favicon, branding
- [x] Update tour — title, category, website, primary color, logo/favicon alt
- [x] Catalog visibility (`public` / `unlisted` / `internal`) and featured flag
- [x] Delete tour — JSON, knowledge, catalog entry, asset folder (danger zone)
- [x] Live catalog snapshot — intro gallery updates without page reload
- [x] Dev tour cache — create/edit/delete reflects in viewer without reload
- [x] Bootstrap unknown tour in dev mode (`devFetchTour` when not in static
      repo)

**Scenes**

- [x] Create scene — panorama upload, title, description, defaultView
- [x] Update scene — title, description, firstScene, floor-plan pin (`map`
      x/y/heading)
- [x] Delete scene (non-`firstScene`)
- [x] Apply landing view (`defaultView` + thumbnail)
- [x] Replace panorama

**Hotspots**

- [x] Create nav / naming (NO) / general info hotspots — click-to-place
- [x] Move hotspot — reposition from panorama click
- [x] Edit nav — label, target scene, `targetView`, `instant`, `preview.image`
- [x] Create nav — `instant`, `preview.image`
- [x] Edit naming — title, price, status, body
- [x] Edit info — title, body, display, video URL, image
- [x] Delete hotspot

**Floor plan & knowledge**

- [x] Floor plan CRUD — upload SVG/PNG/JPG/WebP, width/height, remove
- [x] Knowledge JSON editor — global + per-scene facts, FAQs, suggested
      questions

**Viewer integration**

- [x] General info hotspots — full badge label “Information”, nav-style pill +
      info icon
- [x] DevTools FAB — collapsible panel shell
- [x] Dev URL flags — preserved across in-app navigation

#### Backlog — dev panel → Admin CMS

Maps to [Admin MVP pages](#7--admin-mvp-pages) below. Keep building in dev panel
until Admin app exists; then port endpoints and retire duplicate UI.

**Tour settings** (`/tours/[tourId]`)

- [x] Organization — name, email, phone(s), fax, address
- [x] Branding — `fontFamily`, `fontSourceUrl` (Google Fonts)
- [x] Product copy — `productFullName`
- [x] Scene transitions — `defaultTransition` (fade/black, speed)
- [x] Immersive background — audio / playlist / manifest / volume

**Scenes & assets**

- [ ] Nav create — custom `targetView` (edit-only today)
- [ ] Scene thumbnail — trigger `generate-thumbnails` or upload
- [ ] Bulk floor-plan pin placement — visual editor on plan image

**Hotspots & naming**

- [ ] Info popup advanced — `cta` / `ctas`, `sponsor`, `width`, `videoPoster`
- [ ] Naming advanced — `namingOpportunity.name`, `priceLabel`
- [ ] Hotspot drag on panorama (Phase 3 admin; dev uses click-to-place)

**Platform**

- [ ] Auth + multi-user (Admin only)
- [ ] Draft vs publish separation (Admin + API)
- [ ] Client CRUD — not just tour-level client pick on create
- [ ] Asset browser — list/replace/delete beyond single-file upload

**Docs & QA**

- [ ] Dev API reference in `docs/` (endpoint list mirrors
      `viteDevTourApiPlugin`)
- [ ] Smoke-test checklist for new tours (qch-hospital, ken-sargent-house)

### Sprint C — Discovery & share polish

- [x] **First-visit hint** — one-time “drag to look around · tap hotspots” coach
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

| Route                              | Purpose                                            | Dev panel today (`?dev=1`)                   |
| ---------------------------------- | -------------------------------------------------- | -------------------------------------------- |
| `/login`                           | Entra ID / Auth.js                                 | — (local dev only)                           |
| `/`                                | dashboard — clients, tours, draft/published status | partial — create tour, catalog visibility    |
| `/clients/[clientId]`              | tour list, visibility, featured                    | partial — featured/visibility on tour update |
| `/tours/[tourId]`                  | tour settings — branding, org, floor plan          | partial — tour tab, org, fonts, floor plan   |
| `/tours/[tourId]/scenes`           | scene list, firstScene, panoramas                  | partial — scene tab CRUD                     |
| `/tours/[tourId]/scenes/[sceneId]` | hotspot editor (MVP: yaw/pitch + popup form)       | partial — hotspot tab + move                 |
| `/tours/[tourId]/preview`          | iframe preview with token URL                      | — (viewer `?dev=1` is the preview today)     |

Follow-ups: `/tours/[tourId]/knowledge` (dev panel ✅), `/tours/[tourId]/naming`
(NO + CTA — partial via NO hotspot forms).

**Migration rule:** new authoring features land in dev panel first (JSON + dev
API), then move to Admin when auth and publish exist — same payload shapes.

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
| Hotspot coordinates off          | `?dev=1` dev panel — click logger + CRUD                                                                           |
| overview → entrance disorienting | Tune `targetView` in dev panel or JSON                                                                             |
| Mock AI limited until Phase 2    | Rich FAQs + suggested chips; dev knowledge editor                                                                  |
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

| Date       | Note                                                                                    |
| ---------- | --------------------------------------------------------------------------------------- |
| 2026-06-25 | MOBILE.md — React UI layout spec; PSV reference-only; links from ROADMAP/PERFORMANCE    |
| 2026-06-11 | Dev panel — organization + Google Fonts branding on tour update                         |
| 2026-06-11 | Dev panel v1 — full tour/scene/hotspot/floor-plan/knowledge CRUD; Admin migration table |
| 2026-06-11 | Scene transition feedback done — progress bar only (no dim overlay)                     |
| 2026-06-11 | Phase 2 platform architecture (sections 1–9) + Sprint 2A checklist                      |
| 2026-06-11 | Initial roadmap — VR/XR, database, mobile themes                                        |
| 2026-06-11 | PERFORMANCE.md → playbook (no checkboxes); ROADMAP = sole task list                     |
