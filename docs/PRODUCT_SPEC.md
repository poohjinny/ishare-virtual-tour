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
│ Floor plan minimap (optional)     Panorama viewer        │
│ (bottom-left)                      Guide FAB (bottom-right)│
│                                    PSV controls (bottom)   │
└──────────────────────────────────────────────────────────┘
```

- Client intro at `/` when multiple **public** catalog tours (see
  [Home policy](#home-policy--catalog-visibility)).
- Glass panels: Explore, Help, Share, naming-opportunity popups, nav previews,
  AI chat.
- Component details: [COMPONENTS.md](./COMPONENTS.md).

---

## Core behavior

### Panorama viewer

- Photo Sphere Viewer with Virtual Tour and Markers plugins.
- Custom HTML markers: nav (pulse ring + arrow), info (`i`), nav-preview,
  naming.
- No default PSV navbar — custom overlay UI.

### Navigation

- **TourNavFloat** — Explore, Search, Share, Controls, Help.
- **Breadcrumb + history** — back / forward across visited scenes.
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

- Nav: animated CSS markers, 48px touch target.
- Info: React `InfoPopup` modal (ESC / backdrop / close).
- Naming opportunities: anchored glass panels — see
  [NAMING_OPPORTUNITIES.md](./NAMING_OPPORTUNITIES.md).

### AI assistant (mock)

- Guide FAB + chat panel with current-scene badge.
- Suggested question chips per scene.
- `mockAssistant.ts`: FAQ match → facts → fallback.
- Production LLM contract:
  [ROADMAP.md — Phase 2](./ROADMAP.md#phase-2--platform-integration).

---

## Data schemas

Source of truth: `tours/*.json`, `tours/catalog.json`.  
Engineering notes: [CODING_GUIDELINES.md](./CODING_GUIDELINES.md).

### Tour (`tours/{tourId}.json`)

- `firstScene` — starting scene id.
- Per scene: `title`, `panorama`, `defaultView`, `hotspots[]`.
- Hotspot types: `nav` | `info` | `nav-preview` | naming (see tour JSON).
- Nav hotspots: `targetScene`, `targetView` (orientation after transition).

### Knowledge (`tours/{tourId}-knowledge.json`)

- `global` — facility name and summary.
- Per scene: `facts[]`, `faqs[]`, `suggestedQuestions[]`.

### Catalog (`tours/catalog.json`)

- `categories[]` — display order on client intro.
- `clients[]` — each with `id`, `name`, `tours[]`.
- Per tour: `id`, `category`, `name`, optional `visibility`, `featured`.

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
  "id": "ken-sargent-house",
  "category": "Healthcare",
  "name": "Ken Sargent House",
  "visibility": "public",
  "featured": true
}
```

- **`visibility`** — defaults to `public` when omitted.
- **`featured`** — optional; for curated marketing links (full gallery still
  lists all `public` tours unless a `?featured=1` mode is added later).

**Implementation:** `listCatalogTours()` → intro (`public` only);
`listRoutableCatalogTours()` → routing (`public` + `unlisted`); `internal`
excluded from `isKnownTourId` until dev gating exists.

---

## URL query contract

| Param                | Values              | Role                                                |
| -------------------- | ------------------- | --------------------------------------------------- |
| `embed`              | `1`                 | Client delivery — skip intro; chrome trim (backlog) |
| `intro`              | `1` / `0` / omitted | Tri-state override for intro at `/` only            |
| `no`                 | hotspot id          | Open naming-opportunity panel                       |
| `dev`, `chatTest`, … | `1`                 | Dev / QA only — not for production links            |

**Path vs query:** Tour and scene identity live in the path
(`/{tourId}/{sceneId}`). Product flags (`embed`, `no`) stay in the query.
Preserved across in-app navigation via `PRESERVED_SEARCH_KEYS` in
`src/utils/tourPaths.ts`.

**Canonical embed link:**

```
https://tour.ishare.ca/{tourId}/{firstScene}?embed=1
```

Do not rely on `?intro=0` for embeds — use `embed=1` and a tour path.

**Code reference:** `src/hooks/useAppSearchParams.ts`.

---

## Related documents

| Document                                   | Topic                                      |
| ------------------------------------------ | ------------------------------------------ |
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) | SeekBeak context, demo script              |
| [ROADMAP.md](./ROADMAP.md)                 | Backlog, phasing, success criteria for v1+ |
| [TECH_STACK.md](./TECH_STACK.md)           | Libraries, build, deploy                   |
| [PRODUCT_NAMING.md](./PRODUCT_NAMING.md)   | Platform vs client naming in UI            |
| [PERFORMANCE.md](./PERFORMANCE.md)         | Performance playbook (tuning guide)        |
