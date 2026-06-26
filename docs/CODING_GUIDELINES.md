# Coding guidelines — iShare Virtual Tour

Engineering reference for **this repository** — structure, conventions, and
linked specs.

---

## Document map

| Topic                          | Document                                               | When to read                                 |
| ------------------------------ | ------------------------------------------------------ | -------------------------------------------- |
| **Git commit / push**          | [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)                   | Before every push                            |
| **Tailwind + custom CSS**      | [STYLING.md](./STYLING.md)                             | Migrating React components off colocated CSS |
| **Shared UI (React + HTML)**   | [COMPONENTS.md](./COMPONENTS.md)                       | Badges, accordions, glass panels             |
| **Naming opportunity CTAs**    | [NAMING_OPPORTUNITIES.md](./NAMING_OPPORTUNITIES.md)   | NO popups, status, Giftabulator footer       |
| **Giftabulator give-now URLs** | [GIFTABULATOR_GIVE_NOW.md](./GIFTABULATOR_GIVE_NOW.md) | `calc` prefill, preset, bounded scaling      |
| **Product / copy names**       | [PRODUCT_NAMING.md](./PRODUCT_NAMING.md)               | Tab title, Help, Guide, splash               |
| **Tech stack & deploy**        | [TECH_STACK.md](./TECH_STACK.md)                       | PSV, Vite, iframe embed                      |
| **Performance playbook**       | [PERFORMANCE.md](./PERFORMANCE.md)                     | When embed/mobile feels slow (no task list)  |
| **Client assets**              | [`assets/README.md`](../assets/README.md)              | Panoramas, logos, new client                 |
| **Backlog & phasing**          | [ROADMAP.md](./ROADMAP.md)                             | What to build next                           |
| **Product contracts**          | [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)                   | URL, embed, catalog, schemas                 |

---

## Engineering habits (this repo)

- **Minimal diff** — one task at a time; match surrounding code style.
- **Git** — one task per commit; see [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)
  (including **End-of-session push** and **Agent checklist**). Never mix
  unrelated routing, shared UI, and docs in one commit.
- **Config over literals** — tour data in `tours/*.json`, labels in
  `src/constants/*`, tokens in `globals.css` `@theme`, not scattered in
  components.
- **Reuse** — `ui/*`, existing hooks/utils; extract on third duplication.
- **Readable over clever** — straightforward logic; avoid unnecessary
  abstractions.
- **Git** — commit only when asked; one task per commit
  ([GIT_WORKFLOW.md](./GIT_WORKFLOW.md)); `npm run build` before push.
- **HTML markers** — always `escapeHtml()` for dynamic copy in
  `tourGlassPanelHtml.ts`.

---

## Project principles

### React + PSV HTML (two rendering paths)

UI renders in **React** (dock panels, modals) and as **HTML strings** in PSV
markers (nav preview, NO popups). Shared visuals must work in **both** paths —
see [COMPONENTS.md](./COMPONENTS.md).

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
├── tours/               Tour JSON + *-knowledge.json per client
├── public/              Static output + synced assets
├── src/
│   ├── components/      React UI + feature CSS
│   │   └── ui/          Shared primitives (Badge, Accordion, …)
│   ├── constants/       Copy strings, tour UX labels
│   ├── data/            Tour load, naming status, platform contact
│   ├── hooks/           Route sync, controls preference, assistant, …
│   ├── pages/           TourPage (main shell)
│   ├── styles/          globals.css (@theme), layout, hotspots
│   ├── types/           tour.ts — canonical tour schema
│   ├── utils/           Paths, directory, popup layout, preferences
│   └── viewer/          PSV, markers, transitions, panel markers
└── docs/
```

| Layer           | Responsibility                                    |
| --------------- | ------------------------------------------------- |
| `types/tour.ts` | Shapes only — no runtime logic                    |
| `data/`         | Load, normalize, naming opportunity rules         |
| `viewer/`       | Photo Sphere Viewer, markers, camera, transitions |
| `components/`   | React trees + colocated feature CSS               |
| `utils/`        | Stateless helpers shared across layers            |

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
- Import marker-shared CSS from [`main.tsx`](../src/main.tsx).
- Hooks: `useTourState`, `useViewerControlsVisible`, `useTourRouteSync`.
- Viewer API: `PanoramaViewer` ref.
- FAB labels: `src/constants/tourNavActions.ts` (`aria-label` + `title`).

---

## Styling

### Tokens

[`src/styles/globals.css`](../src/styles/globals.css) — `@theme` tokens and
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

- HTML: [`buildMarkers.ts`](../src/viewer/buildMarkers.ts)
- `data-hotspot-type="nav" | "info"` — click routing in `PanoramaViewer`
- `namingOpportunity` on info popup → anchored glass panel

### Anchored panels (NO / info / nav preview)

| Concern           | Location                                                              |
| ----------------- | --------------------------------------------------------------------- |
| HTML build        | `tourGlassPanelHtml.ts`                                               |
| Panel CSS         | `TourGlassPanel.css`, `NavPreviewPanel.css`                           |
| Open/close        | `infoPanelMarker.ts`, `navPreviewPanelMarker.ts`                      |
| Height measure    | `glassPanelMarkerSize`, `#glass-panel-measure-host`                   |
| Hotspot gap       | `anchoredPanelPosition.ts` — **32px** (`ANCHORED_PANEL_GAP_PX`)       |
| `data-info-panel` | On **`<article>`** — `[data-info-panel='true']`, not `:has()` on self |

### Scene navigation & URL

- Preload → `setCurrentNode()` — [`transition.ts`](../src/viewer/transition.ts)
- URL sync — `useTourRouteSync` + [`tourPaths.ts`](../src/utils/tourPaths.ts)
- Paths: `/`, `/{sceneId}`, `/{tourId}`, `/{tourId}/{sceneId}`
- Preserved query: `embed`, `dev`, `chatTest`, `notFoundTest`,
  `panoramaErrorTest`, `navPreview`
- Legacy `?tour=` / `?scene=` → path redirect

### Fullscreen

- Target **`.viewer-area`** (not `.viewer-container` alone) — keeps overlay UI
  visible. See `tourFullscreenNavbarButton.ts`, `TourPage.tsx`.

### Dev tuning

- `?dev=1` — hotspot / landing JSON copy; gate with `searchParams.dev` /
  `devMode` only.

---

## Tour content & new clients

1. `assets/{clientId}/{tourId}/` + `tours/{tourId}.json` (+ `-knowledge.json`)
2. Register in [`loadTour.ts`](../src/data/loadTour.ts)
3. `clientId` / `tourId` layout — [`assets/README.md`](../assets/README.md)
4. **Panoramas:** convert every JPG in `panoramas/` to WebP before commit; JSON
   paths use `.webp` —
   [`assets/README.md`](../assets/README.md#panoramas--jpg--webp-required)
5. JSON paths `/assets/{clientId}/{tourId}/...` — `withBaseUrl()` at load

Naming CTAs: [NAMING_OPPORTUNITIES.md](./NAMING_OPPORTUNITIES.md) — do not
hand-roll footer buttons in JSON unless overriding.

---

## Copy & branding

[PRODUCT_NAMING.md](./PRODUCT_NAMING.md):

| UI                                 | Source                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Tab / splash title                 | `getTourProductFullName(tour)`                                                              |
| AI assistant                       | `VIRTUAL_TOUR_GUIDE_NAME`                                                                   |
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

1. [README.md](../README.md) — `npm install` && `npm run dev`
2. Read this file + [COMPONENTS.md](./COMPONENTS.md) +
   [GIT_WORKFLOW.md](./GIT_WORKFLOW.md)
3. Walk: `?dev=1` → scene transition → open one NO popup
4. Before push: `npm run build`, one task per commit

---

## Maintaining this doc

Update when this project gains a new cross-cutting pattern (marker type,
`localStorage` key, URL flag, shared primitive). Keep project-only detail here;
link to topic docs in the map above instead of duplicating them.
