# iShare Virtual Tour — Product Specification

> Stable product contracts: routing, embed, catalog, and JSON schemas.  
> For backlog and phasing, see [ROADMAP.md](./ROADMAP.md).  
> For project context and demo narrative, see
> [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).

---

## UI layout (current)

```
┌──────────────────────────────────────────────────────────┐
│ Breadcrumb + history              TourNavFloat (FAB dock) │
├──────────────────────────────────────────────────────────┤
│                                  Panorama / 3D viewer     │
│                                  Guide FAB (bottom-right) │
│                                  PSV controls (desktop)   │
└──────────────────────────────────────────────────────────┘
```

- Client intro at `/` when multiple **public** catalog tours (see
  [Home policy](#home-policy--catalog-visibility)).
- Glass panels: Explore, Help, Share, naming-opportunity popups, nav previews,
  Tour Guide chat (when enabled).
- Floor-plan minimap was removed from the product.
- Component details: [COMPONENTS.md](./COMPONENTS.md).

---

## Core behavior

### Panorama viewer (`viewerType: 'panorama'`)

- Photo Sphere Viewer with Virtual Tour and Markers plugins.
- Custom HTML markers: nav (pulse ring + arrow), info (`i`), nav-preview,
  naming.
- No default PSV navbar — custom overlay UI.

### 3D model viewer (`viewerType: 'model3d'`)

- Three.js with GLTFLoader and OrbitControls.
- Loads GLTF/GLB from `scene.model` URL.
- Lazy-loaded via `React.lazy` — zero bundle cost for panorama-only tours.
- Shares `TourViewerHandle` interface with `PanoramaViewer`.
- Prototype: markers + anchored panels work; nav-preview / place-overview /
  modal InfoPopup parity with panorama is thinner — see
  [ROADMAP.md — 3D model tours](./ROADMAP.md#3d-model-tours-production).

### Navigation

- **TourNavFloat** — Explore, Share, Help (embed hides Share/Help).
- **Breadcrumb + history** — back / forward across visited scenes.
- **Play Tour** — optional guided walkthrough when `tour.playTour` is set.
- **`targetView`** on nav transitions (yaw / pitch / zoom).
- Navigation disabled during transitions.

### Transitions

See [SCENE_TRANSITIONS.md](./SCENE_TRANSITIONS.md) for tuning. Sequence:

1. Pan toward hotspot (optional)
2. Zoom in (~300ms)
3. Virtual tour fade (~500ms)
4. Apply target yaw / pitch / zoom
5. Unlock navigation

### Hotspots and popups

- Nav: animated CSS markers, 48px touch target; optional nav-preview card.
- Info: React `InfoPopup` modal and/or anchored glass (ESC / backdrop / close).
- Naming opportunities: anchored glass panels — see
  [NAMING_OPPORTUNITIES.md](./NAMING_OPPORTUNITIES.md).
- Place overview: info hotspot with `role: 'placeOverview'`.

### Tour Guide (Ask Guide)

- FAB label **Ask Tour Guide**; chat panel with scene context + cards/CTAs.
- Enabled per tour via `askGuideEnabled` (Dev Tours form). Global
  `SHOW_ASK_GUIDE` stays off; QA with `?askGuide=1`. Force mock with
  `?guideMock=1`.
- Live: Cloudflare Worker + `VITE_ASK_GUIDE_API_URL` — see
  [DEPLOY.md — Ask Guide](./DEPLOY.md#ask-guide-live-ai-readiness).
- Client mock fallback when live is unavailable.
- Naming / product copy: [PRODUCT_NAMING.md](./PRODUCT_NAMING.md).

---

## Data schemas

Source of truth: `tours/*.json`, `tours/catalog.json`.  
Engineering notes: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md).

### Tour (`tours/{tourId}.json`)

- `viewerType` — `'panorama'` (default) or `'model3d'`.
- `firstScene` — starting scene id.
- `askGuideEnabled` — optional; show Tour Guide FAB when `true`.
- `playTour` — optional guided walkthrough sequence.
- `namingOpportunities` — tour-level naming catalog (pins use `namingId`).
- `sceneOrder` — optional Explore / Play authoring order.
- `immersiveBackground` — optional BGM / playlist.
- Per scene: `title`, `panorama` (or `model`), `description`, `thumbnail`,
  `defaultView`, `hotspots[]`, optional `visibility`.
- Hotspot types: `nav` | `info` (naming via `namingId`; place overview via
  `role: 'placeOverview'`). Nav may include preview / `instant` / `targetView`.

### Catalog (`tours/catalog.json`)

- `categories[]` — display order on client intro.
- `clients[]` — each with `id`, `name`, `tours[]`, contact, optional `branding`
  (color / fonts / `logoAlt`; conventional logo & favicon paths omitted).
- Per tour: `id`, `category`, `name`, optional `visibility`, `summary`.

---

## Home policy & catalog visibility

The client intro at `/` is a **platform showcase**, not the client delivery
path. End users on a client site or iframe should not see other clients’ tours.

### When intro appears

| Context                                 | `/` behavior                                            |
| --------------------------------------- | ------------------------------------------------------- |
| Multi-tour host (e.g. `tour.ishare.ca`) | Intro gallery — `public` entries in `catalog.json`      |
| Single public tour in catalog           | Auto-redirect to that tour (unless `?intro=1`)          |
| `/{tourId}/…` or `/{tourId}/{sceneId}`  | Tour loads directly — no intro                          |
| `?embed=1` on `/`                       | Skip intro → default tour                               |
| `?intro=1` on `/`                       | Force intro even with one tour (demo / marketing)       |
| `?intro=0` on `/`                       | Skip intro → default tour (legacy; prefer path + embed) |

**Product rule:** A public multi-client gallery fits an **iShare portfolio
hub**. It does not fit a **single-client host** — use a one-tour catalog,
redirect, or `visibility` filtering.

### `visibility` values

| Value      | Home gallery | Direct URL `/{tourId}/…` | Typical use                                        |
| ---------- | ------------ | ------------------------ | -------------------------------------------------- |
| `public`   | Shown        | Allowed                  | Portfolio, live client tours approved for showcase |
| `unlisted` | Hidden       | Allowed                  | iframe embed, share links, naming-opportunity URLs |
| `internal` | Hidden       | Blocked (for now)        | QA, staging, unfinished content                    |

Example:

```json
{
  "id": "t_l01wnq8eh6",
  "category": "Healthcare",
  "name": "Ken Sargent House",
  "visibility": "public"
}
```

- **`visibility`** — defaults to `public` when omitted.

**Implementation:** `listCatalogTours()` → intro (`public` only);
`listRoutableCatalogTours()` → routing (`public` + `unlisted`); `internal`
excluded from `isKnownTourId` until dev gating exists.

---

## URL query contract

| Param         | Values              | Role                                                                                        |
| ------------- | ------------------- | ------------------------------------------------------------------------------------------- |
| `embed`       | `1`                 | Client delivery — skip intro; trim Share/Help FABs; lighter splash; `postMessage` to parent |
| `intro`       | `1` / `0` / omitted | Tri-state override for intro at `/` only                                                    |
| `no`          | `no_*` catalog id   | Open naming-opportunity panel                                                               |
| `askGuide`    | `1`                 | Force Tour Guide on (QA)                                                                    |
| `guideMock`   | `1`                 | Scripted Guide replies (no OpenAI)                                                          |
| `dev`         | `1`                 | Dev panel — not for production links                                                        |
| `guideUiTest` | `1`                 | Guide UI fixtures — not for production                                                      |

**Path vs query:** Tour and scene identity live in the path
(`/{tourId}/{sceneId}`). Product flags (`embed`, `no`, Guide flags) stay in the
query. Preserved across in-app navigation via `PRESERVED_SEARCH_KEYS` in
`src/utils/tourPaths.ts`.

**Canonical embed link:**

```
https://tour.ishare.ca/{tourId}/{firstScene}?embed=1
```

Do not rely on `?intro=0` for embeds — use `embed=1` and a tour path.

**Full embed guide:** [EMBED.md](./EMBED.md) — iframe markup, UI differences,
`postMessage` payloads, parent listener, local QA.

**Code reference:** `src/hooks/useAppSearchParams.ts`,
`src/constants/tourEmbed.ts`, `src/hooks/useTourEmbedMessaging.ts`.

---

## Related documents

| Document                                   | Topic                                 |
| ------------------------------------------ | ------------------------------------- |
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) | SeekBeak context, demo script         |
| [ROADMAP.md](./ROADMAP.md)                 | Backlog, phasing (Phase 2+)           |
| [EMBED.md](./EMBED.md)                     | iframe embed URL, chrome, postMessage |
| [TECH_STACK.md](./TECH_STACK.md)           | Why this stack; deploy → DEPLOY.md    |
| [PRODUCT_NAMING.md](./PRODUCT_NAMING.md)   | Platform vs client naming in UI       |
| [PERFORMANCE.md](./PERFORMANCE.md)         | Performance playbook (tuning guide)   |
