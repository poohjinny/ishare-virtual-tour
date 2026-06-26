# Dev panel — authoring & QA (`?dev=1`)

> Local tour authoring and QA UI in the Vite viewer. Writes `tours/*.json`,
> knowledge files, catalog entries, and assets via the dev API (`/__dev/api`).
> **Not available in production builds** — precursor to Phase 2 Admin CMS.

---

## Quick start

1. Run the dev server: `npm run dev`
2. Open a tour with dev mode:

   ```
   http://localhost:5173/med-surg-inpatient/entrance?dev=1
   ```

3. Open the panel:
   - Click the **Dev** FAB, or
   - Press **`D`** (when focus is not in an input)

`dev` is a **preserved query param** — it stays on the URL as you navigate
scenes. See [PRODUCT_SPEC.md](./PRODUCT_SPEC.md) for the full URL contract.

---

## Panel layout

```
┌─ Sticky header ─────────────────────────────┐
│  [logo] Tour name | Client    ▼ Switch tour │
├─ Primary tabs ──────────────────────────────┤
│  Scene  |  Tour  |  Debug                   │
├─ Accordion sections (per tab) ──────────────┤
│  …                                          │
└─────────────────────────────────────────────┘
```

| Tab       | Purpose                                             |
| --------- | --------------------------------------------------- |
| **Scene** | Current scene — panorama, hotspots                  |
| **Tour**  | Tour metadata, floor plan, AI knowledge, all scenes |
| **Debug** | URL flag toggles, embed QA                          |

**Code:** `src/components/DevTools.tsx`, `src/components/DevViewPanel.tsx`

---

## Keyboard shortcuts

| Key | Action                                              |
| --- | --------------------------------------------------- |
| `D` | Toggle dev panel open/closed                        |
| `L` | Apply landing view (`defaultView` + thumbnail bake) |

Shortcuts are ignored while typing in inputs (`isTypingTarget`).

---

## Scene tab

### Panorama

| Block                | What it does                                                              |
| -------------------- | ------------------------------------------------------------------------- |
| **Landing view**     | Saves the current camera as `defaultView` and rebakes the scene thumbnail |
| **Replace panorama** | Upload JPG/PNG/WebP → overwrites `{sceneId}.webp` and rebakes thumbnail   |

Landing view requires a live camera readout (pan the scene first). Button label
also shows **`(L)`** for the keyboard shortcut.

### Hotspots

Secondary tabs: **Manage** | **Create**

#### Manage

Lists every hotspot on the **current scene**. Each row shows:

**name · category · id**

- **name** — nav label or popup title
- **category** — `Nav`, `NO`, or `Info`
- **id** — JSON hotspot id (`code`)

Actions per hotspot:

| Action     | Flow                                                       |
| ---------- | ---------------------------------------------------------- |
| **Move**   | Click **Move** → click panorama → **Apply click position** |
| **Edit**   | Inline form for nav / NO / info fields → **Save**          |
| **Delete** | Removes hotspot from scene JSON                            |

#### Create

1. **Click the panorama** for marker position (yaw / pitch shown in form).
2. Choose type tab: **Navigation** | **Naming opportunity** | **Info**
3. Fill fields → **Create** button.

Nav hotspots need a target scene; id is auto-slugged from the name (preview
shown). Session storage remembers recent names for faster re-entry.

---

## Tour tab

Accordion sections:

### Tour

**Manage** — edit the open tour (title, category, visibility, branding, contact,
immersive background, transitions, …).

**Create** — new tour under an existing or new catalog client (first scene
upload, branding, visibility).

Changes write to `tours/{tourId}.json` and `tours/catalog.json`.

### Floor plan

Upload or replace `floorplan.svg`, set dimensions, edit per-scene `map` pin (x,
y, heading).

### Knowledge (AI assistant)

Edit `tours/{tourId}-knowledge.json` — global intro, per-scene copy, FAQs. Used
by the mock Guide until Phase 2 LLM integration.

### Scenes

**Manage** — list all scenes: **Open**, **Edit** (title, description, map pin),
**Delete** (not `firstScene`).

**Create** — new scene with panorama upload, title, description, optional
defaultView from current camera.

---

## Debug tab

Single accordion card: **URL flags**. Toggles apply immediately via URL
`replace` (no full page reload). Source of truth:
`src/constants/devUrlFlags.ts`.

### URL flags

| Flag                | Effect                                                         |
| ------------------- | -------------------------------------------------------------- |
| `embed`             | `?embed=1` — trim Share/Help FABs, lighter splash, postMessage |
| `chatTest`          | AI chat scroll test messages                                   |
| `notFoundTest`      | Force tour not-found (404) screen                              |
| `panoramaErrorTest` | Force panorama load-error overlay                              |
| `disableNavPreview` | Disable nav hotspot mini viewer                                |
| `skipLanding`       | Skip landing zoom — start at `defaultView`                     |
| `splashHold`        | Hold load splash longer (loader UX test)                       |
| `firstVisitHint`    | Force first-visit coach pill (ignores localStorage)            |

Combine with `dev=1` as needed, e.g. `?dev=1&embed=1`.

### Embed subsection

Shown below the checkboxes **only when `embed` is checked**. Product guide:
[EMBED.md](./EMBED.md). Dev-panel QA fields:

| Field                | Meaning                                                             |
| -------------------- | ------------------------------------------------------------------- |
| **In iframe**        | `window.parent !== window` — parent actually receives messages      |
| **Message source**   | Filter key for parent listeners: `ishare-virtual-tour`              |
| **Embed URL**        | Production-style link for current scene (`?embed=1`, no `dev`)      |
| **Open iframe test** | New tab — `embed-test.html` parent harness ([EMBED.md](./EMBED.md)) |
| **postMessage log**  | Last 20 outbound messages (scrollable)                              |

**Log entries** appear after embed mode is on and the tour loads/navigates.
Typical sequence:

1. `tour:ready` — after first panorama reveal (splash done)
2. `tour:scene` — on scene or naming-panel change
3. `tour:resize` — on viewport height change

In a top-level tab, log lines show `[local only]` — the dev panel still records
them, but nothing is posted to a parent. In an iframe, lines show `[parent]`.

**Iframe test** — **Open iframe test** (or
[`/embed-test.html`](http://localhost:5173/embed-test.html) while `npm run dev`
is running). Parent page logs `postMessage`; inside the iframe Dev panel shows
**In iframe: yes** and `[parent]` log lines.

Full `postMessage` contract: [EMBED.md](./EMBED.md).

**Code:** `src/components/DevPanelEmbedDebug.tsx`,
`src/hooks/useTourEmbedMessaging.ts`

---

## Tour switcher

When more than one tour exists in the catalog, the sticky header shows a
**Switch tour** dropdown. Selecting a tour navigates to its `firstScene` while
preserving query flags (`dev`, `embed`, etc.).

---

## What gets written

| Action              | Files / paths touched                                      |
| ------------------- | ---------------------------------------------------------- |
| Tour CRUD           | `tours/{id}.json`, `tours/catalog.json`                    |
| Knowledge           | `tours/{id}-knowledge.json`                                |
| Scene / hotspot     | `tours/{id}.json` (scene graph)                            |
| Panorama / branding | `assets/{clientId}/{tourId}/…`, `public/assets/…` (synced) |

The viewer refreshes from an in-memory dev cache after mutations — no manual
page reload. API routes live under `/__dev/api` (Vite dev server only).

---

## Limitations

- **Dev server only** — `npm run build` / production host has no write API.
- **No auth / audit** — JSON edits are local and immediate; production will use
  Admin + publish
  ([ROADMAP Sprint B½](./ROADMAP.md#sprint-b½--dev-panel-authoring-dev1)).
- **Click-to-place** — hotspots are positioned by panorama click, not drag (drag
  planned for Admin).
- **Phone** — panel defaults open and can overlap chrome; see
  [MOBILE.md](./MOBILE.md).

---

## Related documents

| Document                                                 | Topic                              |
| -------------------------------------------------------- | ---------------------------------- |
| [ROADMAP.md](./ROADMAP.md)                               | Dev panel backlog → Admin CMS      |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)                     | URL params, embed, schemas         |
| [EMBED.md](./EMBED.md)                                   | Embed mode — iframe & postMessage  |
| [CODING_GUIDELINES.md](./CODING_GUIDELINES.md)           | `?dev=1` gating in code            |
| [ARCHITECT_DELIVERABLES.md](./ARCHITECT_DELIVERABLES.md) | Spatial defaults before dev tuning |
| [assets/README.md](../assets/README.md)                  | Panorama / logo folder layout      |
