# Dev panel — authoring & QA (`?dev=1`)

> Local tour authoring and QA UI in the Vite viewer. Writes `tours/*.json`,
> catalog entries, and assets via the dev API (`/__dev/api`). **Not available in
> production builds** — precursor to Phase 2 Admin CMS.

---

## Quick start

1. Run the dev server: `npm run dev`
2. Open a tour with dev mode:

   ```
   http://localhost:5173/t_l01wnq8eh6/s_dtv27wfrbi?dev=1
   ```

3. Open the panel:
   - Click the **Dev** FAB, or
   - Press the backtick key (`` ` ``) when focus is not in an input

`dev` is a **preserved query param** — it stays on the URL as you navigate
scenes. See [PRODUCT_SPEC.md](../product/PRODUCT_SPEC.md) for the full URL contract.

---

## Catalog data model (dev writes)

Authoring touches two catalog layers plus per-tour JSON:

| Layer          | Source                                     | What it holds                                                                                                              |
| -------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| **Client**     | `tours/catalog.json` → `clients[]`         | Display name, website, contact, **shared branding** (logo, favicon, primary color, fonts)                                  |
| **Tour entry** | `tours/catalog.json` → `clients[].tours[]` | Tour id, display name, category, `visibility`, optional `summary`                                                          |
| **Tour body**  | `tours/{tourId}.json`                      | Scenes, hotspots, naming catalog, transitions, immersive bg, optional **tour-only** `branding`, optional `askGuideEnabled` |

**Branding resolution** (runtime): `catalog.clients[].branding` is the default;
`tour.branding` overrides when present. Conventional logo/favicon paths are
**omitted** in JSON (`/assets/{clientId}/brand/logo.png`, client/tour
`favicon.png|ico`) and inferred at load. Tour-only logo uses `"logo": true`.
Favicon is probed (png then ico), not a single inferred field. Dev create/update
uses `brandingMode: 'client' | 'custom'` to choose where uploads are saved.

**Asset paths**

| Branding mode   | Logo / favicon path                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| Client (shared) | Logo: `assets/{clientId}/brand/logo.png`. Favicon: `assets/{clientId}/favicon.png\|ico` (not under `brand/`) |
| Tour (custom)   | Logo: `assets/{clientId}/{tourId}/brand/logo.png`. Favicon: `assets/{clientId}/{tourId}/favicon.png\|ico`    |

Panoramas and scene thumbs stay under `assets/{clientId}/{tourId}/panoramas/`
and `…/scene-thumbs/`. Pin-card bakes go under `…/hotspot-thumbs/` (`h_*`).

**Code:** `src/utils/resolveTourBranding.ts`, `scripts/lib/tourBrandDev.mjs`,
`scripts/lib/tourCatalogDev.mjs`

---

## Panel layout

```
┌─ Sticky header ─────────────────────────────┐
│  [logo] Tour name | Switch tour    Intro  ✕ │
├─ Primary tabs ──────────────────────────────┤
│  Scene | Scenes | Namings | Tours | Clients | Debug │
├─ Accordion sections (per tab) ──────────────┤
│  …                                          │
└─────────────────────────────────────────────┘
```

| Tab         | Purpose                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------ |
| **Scene**   | Current place — landing view / panorama, hotspots (nav, naming pins, info, place overview) |
| **Scenes**  | Tour scene list — add, edit, duplicate, reorder Explore order, delete                      |
| **Namings** | Tour-level naming opportunity catalog (the “what”); place pins under Scene → Hotspots      |
| **Tours**   | Catalog tours — create under a client, edit metadata / experience / branding, delete       |
| **Clients** | Catalog clients — contact + shared branding; create clients here before Tours → Add        |
| **Debug**   | URL flags, Tour Guide fixtures, Device / Embed viewport modes                              |

Sticky **Intro** opens the tour picker at `/?intro=1` (not a Debug flag card).

**Code:** `src/constants/devPanel.ts`, `src/components/dev/DevTools.tsx`,
`src/components/dev/DevViewPanel.tsx` (shell; tab bodies: `DevSceneTabPanel`,
`DevScenesListPanel`, `DevNamingCatalogPanel`, `DevToursCatalogPanel`,
`DevClientPanel`)

---

## Keyboard shortcuts

| Key     | Action                       |
| ------- | ---------------------------- |
| `` ` `` | Toggle dev panel open/closed |

Shortcuts are ignored while typing in inputs (`isTypingTarget`). Landing view
(`defaultView` + thumbnail bake) is **Apply defaultView** on the Scene tab — pan
/ orbit first so a live camera readout exists.

---

## Scene tab

### Panorama / Viewpoint

| Block                | What it does                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Landing view**     | Saves the current camera as `defaultView` and rebakes the scene thumbnail                                            |
| **Replace panorama** | Upload JPG/PNG/WebP → overwrites `{sceneId}.webp` via shared encode (≤**8192**w, WebP q**90**) and rebakes thumbnail |

(3D model tours show **Viewpoint** instead of Replace panorama.)

### Hotspots

**Add hotspot** opens create tabs: **Overview** | **Navigation** | **Naming** |
**Info** (Overview omitted on model3d tours).

#### Manage

Lists hotspots on the **current scene** (filters: All / Nav / NO / Info). Each
row shows name, kind badge, and actions:

| Action     | Flow                                                       |
| ---------- | ---------------------------------------------------------- |
| **Move**   | Click **Move** → click panorama → **Apply click position** |
| **Edit**   | Inline form for nav / naming / info / overview → **Save**  |
| **Delete** | Removes hotspot from scene JSON                            |

Naming rows edit the **placement** (which catalog entry); business fields live
on the **Namings** tab.

#### Create

1. **Click the panorama** for marker position (yaw / pitch shown in form).
2. Choose type: **Overview** | **Navigation** | **Naming** | **Info**
3. Fill fields → **Create**.

| Type           | Notes                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| **Overview**   | Place-overview pin (`role: placeOverview`, opaque `h_*`) — one per scene; inherits scene title / description |
| **Navigation** | Target scene; opaque pin id assigned on create                                                               |
| **Naming**     | Pick an existing catalog entry (create entries on **Namings** first)                                         |
| **Info**       | Title, body, display mode, optional media / visit-scene                                                      |

---

## Scenes tab

Accordion: **Add scene** | **Manage scenes**.

### Add scene

New panorama (or 3D viewpoint) with title, optional description / video URLs,
visibility. Panorama tours can check **Create place overview hotspot** (off by
default — otherwise add Overview later under Scene → Hotspots).

### Manage scenes

Groups follow nav hierarchy. Drag reorders the **Explore tour list only** — not
in-viewer floor links. Actions per scene: **Open**, **Edit**, **Duplicate**,
**Delete** (not `firstScene`).

#### Duplicate

Copies the scene (and optionally its child places). Options:

| Option                         | Effect                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| **Clone naming opportunities** | On → new catalog entries (`namingMode: 'duplicate'`); off → share originals (`keep`) |
| **Link under same parent**     | Add a nav from the same parent to the copy                                           |
| **Include child places**       | Clone the nav subtree and remap links among copies                                   |

API also accepts `namingMode: 'clear'` (strip naming links on the copy) —
`POST /__dev/api/scene/duplicate`. The panel checkbox only toggles duplicate /
keep.

Edit fields: title, description, preview/video URLs, visibility, set as first
scene.

---

## Namings tab

Tour-level **naming opportunity catalog** — name, price, status, donor, body,
video, image, visibility. Create / edit / duplicate / delete entries here.

Place pins on a scene under **Scene → Hotspots → Naming**. Deleting a catalog
entry also removes its hotspot placements.

Duplicate options: include placements; reset copy as open (clear donor).

---

## Tours tab

Accordion: **Add tour** | **Manage tours**.

### Add tour

Pick an **existing catalog client** (create clients on **Clients**), then tour
details, experience, optional branding override, and first scene panorama. Tour
and first-scene ids are **opaque `t_*` / `s_*` only** — Dev allocates them;
there is no custom kebab id field.

| Field                     | Notes                                                     |
| ------------------------- | --------------------------------------------------------- |
| **Enable Ask Tour Guide** | Writes `askGuideEnabled: true` on the new tour JSON       |
| Branding                  | Use client branding, or custom override on this tour only |

### Manage tours

Filter by client. Per tour: open, copy public link, edit, delete.

Edit includes basics (title, category, summary, visibility), **Enable Ask Tour
Guide** (`askGuideEnabled`), experience (transitions / immersive), branding
mode, and a **Danger zone** (deletes tour JSON, catalog entry, assets).

Shared client contact / branding: **Clients** tab.

---

## Clients tab

Accordion: **Add client** | **Manage clients**.

#### Add client

Create a **client without a tour** — name, optional id, website, contact, shared
branding. Empty id uses the website hostname without TLD. Then add tours from
Tours → Add.

#### Manage clients

Pick a client; edit identity, contact, shared branding (color, logo, favicon,
fonts). Suggest contact / branding from website URL. Lists tours under the
client.

### Dev API

| Route                            | Purpose                                       |
| -------------------------------- | --------------------------------------------- |
| `GET /__dev/api/catalog/clients` | List clients                                  |
| `POST /__dev/api/client/create`  | New `clients[]` entry + optional brand assets |
| `PATCH /__dev/api/client/update` | Patch contact + `clients[].branding`          |
| `POST /__dev/api/client/delete`  | Remove client (when allowed)                  |

---

## Debug tab

Two accordion cards (source: `src/constants/devUrlFlags.ts`). Toggles apply
immediately via URL `replace` (no full page reload).

### URL flags

General QA — **not** intro / Tour Guide (those are separate):

| Flag                | Effect                                              |
| ------------------- | --------------------------------------------------- |
| `notFoundTest`      | Force tour not-found (404) screen                   |
| `loadErrorTest`     | Force viewer load-error overlay (panorama + 3D)     |
| `disableNavPreview` | Disable nav hotspot mini viewer                     |
| `skipLanding`       | Skip landing zoom — start at `defaultView`          |
| `splashHold`        | Hold load splash longer (loader UX test)            |
| `firstVisitHint`    | Force first-visit coach pill (ignores localStorage) |

`embed=1` is applied by **Embed mode** (Viewport), not as a Debug URL-flag
checkbox — see below.

**Intro gallery** — sticky header **Intro** button → `/?intro=1` (tri-state
`intro` query still works from the URL; it is not listed on this card).

### Tour Guide

Separate group for guide / chat fixtures:

| Flag          | Effect                                                                   |
| ------------- | ------------------------------------------------------------------------ |
| `askGuide`    | Show Tour Guide FAB + panel (overrides missing `askGuideEnabled`)        |
| `guideMock`   | Chat with scripted mock replies — no OpenAI                              |
| `guideUiTest` | Frozen UI preview — scroll + thinking fixtures; also turns on `askGuide` |

Product default: guide shows when `tour.askGuideEnabled === true`. Use
`?askGuide=1` for QA without enabling the tour flag.

Combine with `dev=1` as needed, e.g. `?dev=1&askGuide=1`.

### Viewport — Device / Embed

**Debug → Viewport**:

| Mode            | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| **Device mode** | Layout / rem / breakpoint QA (presets + responsive resize)     |
| **Embed mode**  | Host iframe harness (`?embed=1`) — Copy URL/HTML, Messages log |

Embed mode toolbar:

| Control       | Meaning                                                         |
| ------------- | --------------------------------------------------------------- |
| **Copy URL**  | Production-style link (`?embed=1`, no `dev`)                    |
| **Copy HTML** | Ready-to-paste iframe markup (`allow="fullscreen"` included)    |
| **Messages**  | Parent `postMessage` log (`tour:ready` / `tour:scene` / resize) |

Typical message sequence:

1. `tour:ready` — after first panorama reveal (splash done)
2. `tour:scene` — on scene or naming-panel change
3. `tour:resize` — on viewport height change

Full `postMessage` contract: [EMBED.md](../ops/EMBED.md).

**Code:** `src/components/dev/DevEmbedPreviewFrame.tsx`,
`src/hooks/useTourEmbedMessaging.ts`

---

## Tour switcher

When more than one tour exists in the catalog, the sticky header shows a
**Switch tour** dropdown. Selecting a tour navigates to its `firstScene` while
preserving query flags (`dev`, `embed`, etc.).

---

## What gets written

| Action                                     | Files / paths touched                                             |
| ------------------------------------------ | ----------------------------------------------------------------- |
| Tour CRUD                                  | `tours/{id}.json`, `tours/catalog.json`                           |
| Client contact / shared branding (Clients) | `tours/catalog.json` `clients[]`                                  |
| Tour-only branding                         | `tours/{id}.json` `branding`, `assets/{clientId}/{tourId}/brand/` |
| Client branding                            | `catalog.json` `clients[].branding`, `assets/{clientId}/brand/`   |
| Scene / hotspot / naming catalog           | `tours/{id}.json` (scene graph + `namingOpportunities`)           |
| Scene duplicate                            | `tours/{id}.json` (+ optional cloned naming assets)               |
| Panorama / scene thumb                     | `assets/{clientId}/{tourId}/panoramas/`, `…/scene-thumbs/`        |
| Naming pin thumb                           | `assets/{clientId}/{tourId}/hotspot-thumbs/{hotspotId}.webp`      |

The viewer refreshes from an in-memory dev cache after mutations — no manual
page reload. API routes live under `/__dev/api` (Vite plugin
`viteDevTourApiPlugin` — dev server only).

---

## Limitations

- **Dev server only** — `npm run build` / production host has no write API.
- **No auth / audit** — JSON edits are local and immediate; production will use
  Admin + publish
  ([ROADMAP Sprint B½](../ROADMAP.md#sprint-b½--dev-panel-authoring-dev1)).
- **Click-to-place** — hotspots are positioned by panorama click, not drag (drag
  planned for Admin).
- **Phone** — panel defaults open and can overlap chrome; see
  [MOBILE.md](./MOBILE.md).

---

## Related documents

| Document                                                 | Topic                              |
| -------------------------------------------------------- | ---------------------------------- |
| [ROADMAP.md](../ROADMAP.md)                               | Dev panel backlog → Admin CMS      |
| [PRODUCT_SPEC.md](../product/PRODUCT_SPEC.md)                     | URL params, embed, schemas         |
| [EMBED.md](../ops/EMBED.md)                                   | Embed mode — iframe & postMessage  |
| [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)           | `?dev=1` gating in code            |
| [ARCHITECT_DELIVERABLES.md](../client/ARCHITECT_DELIVERABLES.md) | Spatial defaults before dev tuning |
| [assets/README.md](../../assets/README.md)                  | Panorama / logo folder layout      |
