# Coding guidelines — iShare Virtual Tour

Engineering reference for **this repository** — structure, conventions, and
linked specs.

---

## Document map

| Topic                          | Document                                                        | When to read                                               |
| ------------------------------ | --------------------------------------------------------------- | ---------------------------------------------------------- |
| **Git commit / push**          | [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)                            | Before every push                                          |
| **Tailwind + custom CSS**      | [STYLING.md](./STYLING.md)                                      | Migrating off colocated CSS; **rem-first** chrome sizing   |
| **Shared UI (React + HTML)**   | [COMPONENTS.md](./COMPONENTS.md)                                | Badges, accordions, glass panels                           |
| **Naming opportunity CTAs**    | [NAMING.md](../product/NAMING.md)                               | NO popups, status, Giftabulator footer                     |
| **Giftabulator**               | [GIFTABULATOR.md](../product/GIFTABULATOR.md) | Give Now URLs / `calc`; future modules                     |
| **Product / copy names**       | [NAMING.md](../product/NAMING.md)                               | Tab title, Help, Guide, splash                             |
| **Tech stack & deploy**        | [TECH_STACK.md](./TECH_STACK.md)                                | Why Vite/PSV/Three; deploy → [DEPLOY.md](../ops/DEPLOY.md) |
| **Performance playbook**       | [PERFORMANCE.md](./PERFORMANCE.md)                              | When embed/mobile feels slow (no task list)                |
| **Mobile React UI layout**     | [MOBILE.md](./MOBILE.md)                                        | Phone chrome, collisions, safe-area                        |
| **Client assets**              | [`assets/README.md`](../../assets/README.md)                    | Panoramas, logos, new client                               |
| **Backlog & phasing**          | [ROADMAP.md](../ROADMAP.md)                                     | What to build next                                         |
| **Product contracts**          | [PRODUCT_SPEC.md](../product/PRODUCT_SPEC.md)                           | URL, embed, catalog, schemas                               |
| **Dev panel (`?dev=1`)**       | [DEV_PANEL.md](./DEV_PANEL.md)                                  | Local authoring, Debug tab, embed QA                       |
| **Embed (`?embed=1`)**         | [EMBED.md](../ops/EMBED.md)                                     | iframe delivery, postMessage, host integration             |

---

## Engineering habits (this repo)

- **Minimal diff** — one task at a time; match surrounding code style.
- **Git** — one task per commit; see [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)
  (including **End-of-session push** and **Agent checklist**). Never mix
  unrelated routing, shared UI, and docs in one commit.
- **Config over literals** — tour data in `tours/*.json`, labels in
  `src/constants/*`, tokens in `globals.css` `@theme`, not scattered in
  components.
- **Rem-first chrome** — size React/CSS UI with `rem` (and tokens) so it follows
  root UI scale; use `px` only when necessary. See
  [STYLING.md § Units](./STYLING.md#units--rem-first-responsive-chrome).
- **Reuse** — `ui/*`, existing hooks/utils; extract on third duplication.
- **Readable over clever** — straightforward logic; avoid unnecessary
  abstractions.
- **Git** — commit only when asked; one task per commit
  ([GIT_WORKFLOW.md](./GIT_WORKFLOW.md)); `npm run build` before push.
- **HTML markers** — always `escapeHtml()` for dynamic copy in
  `tourGlassPanelHtml.ts`.

---

## Project principles

### React + PSV HTML + Three.js (rendering paths)

UI renders in **React** (dock panels, modals), as **HTML strings** in PSV
markers (nav preview, NO popups), and via **Three.js** for 3D model tours.
Shared visuals must work in **both** HTML paths — see
[COMPONENTS.md](./COMPONENTS.md).

`TourPage` selects the viewer at runtime based on `tour.viewerType`:

| `viewerType`       | Viewer component          | Loaded via   |
| ------------------ | ------------------------- | ------------ |
| `'panorama'` (def) | `PanoramaViewer` (PSV)    | `React.lazy` |
| `'model3d'`        | `ThreeDViewer` (Three.js) | `React.lazy` |

Both implement `TourViewerHandle` (`src/viewer-shared/viewerHandle.ts`) — the
imperative contract between orchestrator and renderer.

### Viewer-type isolation (panorama vs model3d)

Reuse shared contracts and tour chrome when it helps. **Changing one viewer must
not silently restyle or resize the other.**

| Surface                 | Own here                                                                 |
| ----------------------- | ------------------------------------------------------------------------ |
| Panorama                | `src/viewer/`, `.viewer-container` / `.psv-*`, most of `psv-layer.css`   |
| Shared hotspot pills    | `hotspot-layer.css` (`.hotspot-nav` / `.hotspot-info` / …)               |
| Model3d                 | `src/viewer-3d/`, `.viewer-3d-*`, `viewer-3d-layer.css`, `.hotspot-3d-*` |
| Shared JS (both)        | `src/viewer-shared/` — handle, markers HTML, panel layout, scene depth   |
| Shared only by decision | Design tokens both already consume; React dock panels                    |

**Required practice**

1. Before editing hotspot / marker / background / navbar styles, decide
   panorama-only vs model3d-only vs intentional shared.
2. Scope CSS under the owning container — do not “fix” 3D by widening a global
   hotspot font or padding used by panorama (or the reverse).
3. Shared token or HTML-builder changes → verify **both** viewer types, or
   document which type was out of scope.
4. No drive-by restyles of the other medium while fixing one (past regressions:
   3D hotspot text size, model clear-color / gradient).

Cursor enforces this via `.cursor/rules/viewer-type-isolation.mdc`
(`alwaysApply`).

### Data over hard-coding

| Content                        | Location                                     |
| ------------------------------ | -------------------------------------------- |
| Scenes, hotspots, copy         | `tours/*.json`                               |
| Naming status / default CTAs   | `src/data/namingOpportunityStatus.ts`        |
| UX labels (Help, FAB tooltips) | `src/constants/*`                            |
| Platform / FMI contact         | `src/data/platformContact.ts`, `branding.ts` |

### Build & assets

```bash
npm run dev    # sync-assets + vite
npm run build  # required before push — see GIT_WORKFLOW.md
```

`npm run sync-assets` copies `assets/` → `public/assets/` (runs on `dev` and
`build`). `postbuild` copies `dist/index.html` → `dist/404.html` for GitHub
Pages SPA routing — see `scripts/`.

---

## Repository layout

```
ishare-virtual-tour/
├── assets/              Source media (synced → public/assets/)
├── scripts/             Node build scripts (not bundled — run via package.json)
├── tours/               Tour JSON + catalog.json
├── public/              Static output + synced assets
├── src/
│   ├── components/      React UI + feature CSS
│   │   ├── dev/         Dev panel (`?dev=1`)
│   │   ├── explore/     Explore dock + directory
│   │   └── ui/          Shared primitives (Badge, Accordion, …)
│   ├── constants/       Copy strings, tour UX labels
│   ├── data/            Tour load, naming status, platform contact
│   ├── hooks/           Route sync, controls preference, assistant, …
│   ├── pages/           TourPage (main shell)
│   ├── styles/          globals.css (@theme), layout, hotspots
│   ├── types/           tour.ts — canonical tour schema
│   ├── utils/           Paths, directory, popup layout, preferences
│   ├── viewer/          PSV-only (markers, camera, transitions)
│   ├── viewer-shared/   Shared viewer contract + hotspot/panel helpers
│   └── viewer-3d/       Three.js GLTF walkthrough (lazy-loaded)
└── docs/
```

| Layer            | Responsibility                                                                                                                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `types/tour.ts`  | Shapes only — no runtime logic                                                                                                                                                                                                                                                                   |
| `data/`          | Load, normalize, naming opportunity rules                                                                                                                                                                                                                                                        |
| `viewer/`        | PSV-only: markers, camera, transitions                                                                                                                                                                                                                                                           |
| `viewer-shared/` | Shared contract, hotspot HTML, panel layout, scene graph helpers                                                                                                                                                                                                                                 |
| `viewer-3d/`     | Three.js GLTF viewer (lazy-loaded for `model3d`)                                                                                                                                                                                                                                                 |
| `components/`    | React trees + colocated feature CSS. Explore → `explore/`; Dev panel → `dev/`                                                                                                                                                                                                                    |
| `utils/`         | Stateless helpers shared across layers. Cross-runtime SoT is `*.mjs` + `.d.mts` (`ogShareCopy`, `tourAssetResolve`, `namingDonor`, `legacyTourPathAliases`, `opaqueId`, `clientId`, `slugifyHotspotName`, `namingPriceParse`, `catalogVisibilityCore`); `scripts/lib` re-exports — no twin copy. |

---

## TypeScript & React

- Strict typing; avoid `any`. Use `import type { … }` for types only.
- Named exports unless the file already uses default export.
- Function components; colocate `ComponentName.css`; props interface
  `ComponentNameProps` at top of file.
- Cross-cutting UI state → custom hooks; imperative child API → ref +
  `useImperativeHandle`.
- Tour shapes: `src/types/tour.ts` — extend types before loaders/UI.
- **No path aliases** — relative imports within `src/`.
- Import marker-shared CSS from [`main.tsx`](../../src/main.tsx).
- Hooks: `useTourState`, `useViewerControlsVisible`, `useTourRouteSync`.
- Viewer API: `TourViewerHandle` ref (`PanoramaViewer` or `ThreeDViewer`).
- FAB labels: `src/constants/tourNavActions.ts` (`aria-label` + `title`).

---

## Styling

### Tokens

[`src/styles/globals.css`](../../src/styles/globals.css) — `@theme` tokens and
legacy `--ishare-*` shims. No hard-coded hex in feature CSS unless adding a
token.

### Class prefixes

| Prefix                               | Use                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `ishare-*`                           | Shared primitives (`ishare-badge`, `ishare-accordion`, `ishare-scrollbar`) |
| `tour-glass-panel__*`                | Glass panel shell (React + anchored HTML)                                  |
| `tour-nav-actions__*`                | Top-right dock, explore directory                                          |
| `nav-preview-panel__*`               | Nav hotspot preview marker HTML                                            |
| `hotspot-nav__*` / `hotspot-info__*` | PSV hotspot pills                                                          |
| `viewer-container` / `psv-*`         | PSV chrome in `psv-layer.css`                                              |

Generic patterns → `src/components/ui/` with `ishare-` prefix.

### Explore directory hover (`tourNavFloatVariants.ts`)

- Hover **text** → `var(--ishare-text)`; hover **icons** →
  `var(--ishare-primary)`.
- **Active location** (`--active`): no hover.
- **Active NO** (`--naming-active`): hover allowed.

---

## Photo Sphere Viewer

### Hotspots

- HTML: [`buildMarkers.ts`](../../src/viewer-shared/buildMarkers.ts)
- `data-hotspot-type="nav" | "info"` — click routing in `PanoramaViewer`
- `namingOpportunity` on info popup → anchored glass panel

### Anchored panels (NO / info / nav preview)

| Concern           | Location                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| HTML build        | `tourGlassPanelHtml.ts`                                                  |
| Panel CSS         | `TourGlassPanel.css`, `NavPreviewPanel.css`                              |
| Open/close        | `infoPanelMarker.ts`, `navPreviewPanelMarker.ts`                         |
| Height measure    | `glassPanelMarkerSize`, `#glass-panel-measure-host`                      |
| Hotspot gap       | `viewer-shared/anchoredPanelGap.ts` — **15px** (`ANCHORED_PANEL_GAP_PX`) |
| `data-info-panel` | On **`<article>`** — `[data-info-panel='true']`, not `:has()` on self    |

### Scene navigation & URL

- Preload → `setCurrentNode()` —
  [`transition.ts`](../../src/viewer/transition.ts)
- URL sync — `useTourRouteSync` + [`tourPaths.ts`](../../src/utils/tourPaths.ts)
- Paths: `/`, `/{sceneId}`, `/{tourId}`, `/{tourId}/{sceneId}`
- Preserved query: `embed`, `dev`, `guideUiTest`, `notFoundTest`,
  `loadErrorTest`, `disableNavPreview`, …
- Legacy `?tour=` / `?scene=` → path redirect; old QA aliases (`chatTest`,
  `askGuideMock`, `panoramaErrorTest`) rewrite once to the canonical keys

### Scene transitions

Minimal setup — **Virtual Tour plugin defaults only**.

```ts
virtualTour.setCurrentNode(sceneId, { showLoader: false });
```

No custom preload, focus, align, or post-swap camera snap. Plugin defaults:
`effect: fade`, `speed: 20rpm`, `rotation: true`; we only override
`showLoader: false` for inter-scene moves.

Avoid:

- `rotateTo` / `zoomTo` on `setCurrentNode` — breaks panorama swap
- Instant `viewer.rotate()` / `viewer.zoom()` after swap — causes flash
- Custom `effect: 'none'` on node changes — old texture removed first (white
  gap)

First load: initial node still uses `effect: 'none'` + `landingTransition.ts`.
Viewer uses `canvasBackground: '#000'` and `alpha: false` so the page background
does not show through the fade.

### Fullscreen

- Target **`.viewer-area`** (not `.viewer-container` alone) — keeps overlay UI
  visible. See `tourFullscreenNavbarButton.ts`, `TourPage.tsx`.

### Dev tuning

- `?dev=1` — dev panel (hotspot CRUD, tour authoring, URL flags, embed QA). Full
  guide: [DEV_PANEL.md](./DEV_PANEL.md). Gate UI with `searchParams.dev` /
  `devMode` only.

---

## Tour content & new clients

1. `assets/{clientId}/{tourId}/` + `tours/{tourId}.json`
2. Register in [`loadTour.ts`](../../src/data/loadTour.ts)
3. `clientId` / `tourId` layout — [`assets/README.md`](../../assets/README.md)
4. **Panoramas:** convert every JPG in `panoramas/` to WebP before commit; JSON
   paths use `.webp` —
   [`assets/README.md`](../../assets/README.md#panoramas--jpg--webp-required)
5. Conventional media paths are inferred at load (`tourAssetResolve.mjs` +
   `normalizeTourAssets`). Tour JSON and `catalog.json` omit conventional
   `/assets/…` URLs; store overrides / `"logo": true` only. Client favicon is
   probed (png then ico), not a single inferred field.

Naming CTAs: [NAMING.md](../product/NAMING.md) — do not hand-roll footer buttons
in JSON unless overriding.

---

## Copy & branding

[NAMING.md](../product/NAMING.md):

| UI                                 | Source                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Tab / splash title                 | `getTourProductFullName(tour)`                                                              |
| Tour Guide (Ask Guide)             | `VIRTUAL_TOUR_GUIDE_NAME` / `VIRTUAL_TOUR_GUIDE_FAB_LABEL`                                  |
| **iShare Virtual Tour** (platform) | Platform-level UI only — e.g. client intro `/` (`TourProductBranding` without `clientName`) |

---

## Project-specific preferences

**Viewer controls visibility** — default ON on first visit; only persisted after
the user toggles Controls (`localStorage` key
`ishare-tour-viewer-controls-visible-v2` via `useViewerControlsVisible` /
`viewerControlsPreference.ts`).

---

## Accessibility (PSV-specific)

- Icon buttons: `aria-label` (+ `title` for FAB tooltips where used).
- Do not break panorama drag; use `suppressKeyboard` when overlays capture keys.
- Glass panels: `role="dialog"`, `aria-labelledby`.
- Camera nudge / view animate: honour `prefers-reduced-motion` —
  `pendingNamingInfoHotspot.ts`.

---

## Pitfalls

- Do not duplicate badge/accordion/glass chrome — use `ui/*` +
  [COMPONENTS.md](./COMPONENTS.md).
- Do not add PSV plugins or heavy deps without discussion —
  [PERFORMANCE.md](./PERFORMANCE.md).
- Multi-topic commits — see [GIT_WORKFLOW.md](./GIT_WORKFLOW.md).

---

## Onboarding

1. [README.md](../.../README.md) — `npm install` && `npm run dev`
2. Read this file + [COMPONENTS.md](./COMPONENTS.md) +
   [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)
3. Walk: `?dev=1` → scene transition → open one NO popup
4. Before push: `npm run build`, one task per commit

---

## Maintaining this doc

Update when this project gains a new cross-cutting pattern (marker type,
`localStorage` key, URL flag, shared primitive). Keep project-only detail here;
link to topic docs in the map above instead of duplicating them.
