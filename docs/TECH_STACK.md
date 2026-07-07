# Technology Stack

## Overview

| Layer       | Technology                             | Version                                  |
| ----------- | -------------------------------------- | ---------------------------------------- |
| Runtime     | React                                  | ^19                                      |
| Language    | TypeScript                             | ~5.7                                     |
| Build tool  | Vite                                   | ^6                                       |
| 360 viewer  | Photo Sphere Viewer (PSV)              | ^5.11                                    |
| PSV plugins | markers-plugin, virtual-tour-plugin    | ^5.11                                    |
| 3D viewer   | Three.js (GLTF walkthrough)            | ^0.170                                   |
| Styling     | CSS + design tokens                    | —                                        |
| AI (MVP)    | Client-side mock (JSON + FAQ matching) | —                                        |
| Deployment  | Static SPA                             | Vercel / Netlify / Azure Static Web Apps |

## Why This Stack

### Vite + React + TypeScript (not Next.js)

The virtual tour is a **client-side 360 viewer** embedded in the iShare website
via iframe. It does not require:

- Server-side rendering (SSR)
- SEO landing pages (handled by iShare)
- API routes in the same repo (MVP)

Vite provides fast dev feedback and a simple static build suitable for iframe
embed. Next.js can be added later if a marketing site or admin backend is
needed.

### Photo Sphere Viewer (not raw Three.js for panoramas)

PSV is a **specialised 360° panorama library** built on WebGL/Three.js
internally. For panorama tours it provides:

- Equirectangular texture mapping
- Touch/mouse drag and zoom controls
- HTML marker anchoring (yaw/pitch)
- Multi-scene virtual tour with fade transitions
- Mature plugin ecosystem (markers, virtual tour)

Building the same from raw Three.js would require implementing sphere geometry,
camera constraints, marker projection, and scene management — estimated 2–4
weeks of infrastructure work before feature development.

### Three.js (3D model walkthrough)

For tours that use **GLTF/GLB 3D models** instead of equirectangular panoramas,
a dedicated `ThreeDViewer` renders the scene with Three.js directly. This viewer
is lazy-loaded (`React.lazy`) and only included in the bundle when a `model3d`
tour is accessed — panorama-only deploys pay zero bundle cost.

Three.js is already a transitive dependency of PSV, so adding it as a direct
dependency does not introduce a new library to the build graph.

Both viewer implementations conform to the shared `TourViewerHandle` interface
(`src/viewer/viewerHandle.ts`), allowing `TourPage` to remain agnostic to the
rendering engine.

### Mock AI (not LLM in MVP)

The scene-aware assistant uses `tours/ken-sargent-knowledge.json` with FAQ and
keyword matching. This allows:

- Demo without API keys or backend
- Controlled answers (important for care facility content)
- UI/UX validation before LLM integration

Production path: replace `src/services/mockAssistant.ts` with
`POST /api/tour/chat` (Azure OpenAI / OpenAI via serverless or iShare API).

---

## Library Comparison (Decision Record)

### Pannellum vs Photo Sphere Viewer vs Three.js

| Criterion             | Pannellum                         | Photo Sphere Viewer          | Three.js (direct)              |
| --------------------- | --------------------------------- | ---------------------------- | ------------------------------ |
| Setup speed           | Fastest                           | Moderate                     | Slowest                        |
| Bundle size           | ~50 KB                            | Larger (core + plugins)      | Largest                        |
| Scene transitions     | Fade only (+ manual zoom wrapper) | Fade + animate API + plugins | Fully custom                   |
| Hotspot / marker UX   | CSS + `createTooltipFunc`         | HTML markers plugin          | Manual raycasting + projection |
| TypeScript            | Community types                   | Official TS support          | Full                           |
| MVP demo impact       | Good                              | **Best**                     | Over-engineered                |
| Long-term 3D features | Limited                           | Extensible                   | Maximum                        |

**Decision:** Photo Sphere Viewer for **panorama tours** — best balance of demo
quality (transitions, markers) and development speed. Three.js for **3D model
tours** — first-person GLTF/GLB walkthroughs where equirectangular projection
does not apply. Both coexist via `TourViewerHandle` abstraction and `React.lazy`
code-splitting.

### Why Not Next.js

| Need          | Next.js benefit    | MVP approach       |
| ------------- | ------------------ | ------------------ |
| 360 rendering | None (client-only) | Vite SPA           |
| iShare embed  | None               | Static `iframe`    |
| Tour admin    | Future             | JSON files for now |
| SEO           | iShare handles     | Not required       |

---

## Dependencies

### Production

```json
{
  "@photo-sphere-viewer/core": "^5.11.0",
  "@photo-sphere-viewer/markers-plugin": "^5.11.0",
  "@photo-sphere-viewer/virtual-tour-plugin": "^5.11.0",
  "three": "^0.170.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

### Development

```json
{
  "@types/react": "^19.0.0",
  "@types/react-dom": "^19.0.0",
  "@types/three": "^0.170.0",
  "@vitejs/plugin-react": "^4.3.4",
  "typescript": "~5.7.2",
  "vite": "^6.0.0"
}
```

### PSV Plugin Responsibilities

| Plugin                | Role in this project                                    |
| --------------------- | ------------------------------------------------------- |
| `core`                | Panorama render, zoom, fullscreen, `animate()`          |
| `markers-plugin`      | Custom HTML hotspots (nav + info)                       |
| `virtual-tour-plugin` | Multi-node scenes, `setCurrentNode()`, fade transitions |

### Three.js Viewer Responsibilities

| Module            | Role in this project                                         |
| ----------------- | ------------------------------------------------------------ |
| `ThreeDViewer`    | GLTF/GLB scene loader, OrbitControls, render loop            |
| `GLTFLoader`      | Loads `.gltf` / `.glb` models from tour `scene.model` URL    |
| `OrbitControls`   | First-person camera with mouse/touch drag                    |
| `viewerHandle.ts` | Shared `TourViewerHandle` interface (PSV + Three.js conform) |

`ThreeDViewer` lives in `src/viewer-3d/` and is loaded via `React.lazy()` only
when `tour.viewerType === 'model3d'`. Panorama-only builds never download the
Three.js viewer chunk.

---

## Project Structure

```
ishare-virtual-tour/
├── assets/                    # Source media (see assets/README.md)
│   ├── panoramas/             # 360° equirectangular images
│   └── brand/                 # Client logos
├── public/assets/             # Auto-synced from assets/ (/assets/...)
├── tours/
│   ├── ken-sargent.json       # Tour definition (scenes, hotspots)
│   └── ken-sargent-knowledge.json  # AI knowledge base
├── docs/                      # Project documentation
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/tour.ts
│   ├── data/loadTour.ts
│   ├── viewer/
│   │   ├── PanoramaViewer.tsx   # PSV instance + plugins
│   │   ├── viewerHandle.ts      # TourViewerHandle — shared viewer interface
│   │   ├── buildMarkers.ts      # Hotspot HTML → marker config
│   │   └── transition.ts        # VT setCurrentNode wrapper (see SCENE_TRANSITIONS.md)
│   ├── components/
│   │   ├── SceneNav.tsx
│   │   ├── TourHeader.tsx
│   │   ├── InfoPopup.tsx
│   │   ├── LoadingOverlay.tsx
│   │   └── ai/                  # AI assistant UI
│   ├── hooks/
│   │   ├── useTourState.ts
│   │   ├── useEmbedMode.ts
│   │   └── useTourAssistant.ts
│   ├── services/
│   │   └── mockAssistant.ts
│   ├── styles/
│   │   ├── globals.css          # @theme + layer imports
│   │   ├── components-layer.css # badge, accordion, skeleton shells
│   │   ├── glass-panels-layer.css
│   │   └── psv-layer.css        # PSV navbar + hotspot markers
│   ├── viewer-3d/
│   │   └── ThreeDViewer.tsx   # Three.js GLTF walkthrough (lazy-loaded)
│   └── utils/
│       ├── devHotspotLogger.ts
│       ├── urlParams.ts
│       └── psvZoom.ts
├── index.html
├── package.json
└── vite.config.ts
```

---

## Data Flow

```
tours/{tourId}.json
        │
        ├─► TourPage checks tour.viewerType
        │     ├─ 'panorama' (default) → PanoramaViewer (PSV nodes + markers)
        │     └─ 'model3d'            → ThreeDViewer   (GLTF + OrbitControls)
        ├─► SceneNav (scene list)
        └─► transition.ts → virtualTour.setCurrentNode (panorama only)

tours/{tourId}-knowledge.json
        │
        └─► mockAssistant.ts ◄── useTourAssistant ◄── currentSceneId

useTourState
        │
        ├─► currentSceneId → SceneNav, LocationBadge
        ├─► history stack → Back button
        └─► isTransitioning → disable nav during animation

TourViewerHandle (src/viewer/viewerHandle.ts)
        │
        ├─► PanoramaViewer implements via useImperativeHandle
        └─► ThreeDViewer   implements via useImperativeHandle
```

---

## Styling

- **Design tokens:** `src/styles/globals.css` `@theme` — iShare brand colours
  (runtime override via `clientTheme.ts`)
- **Layer CSS:** `components-layer.css`, `glass-panels-layer.css`,
  `psv-layer.css` — HTML marker shells and PSV chrome
- **React UI:** Tailwind utilities + `cn()` + `cva()` (`*Variants.ts`)

See [STYLING.md](./STYLING.md) for migration conventions.

---

## Deployment

### Build

```bash
npm run build   # outputs to dist/
```

### Hosting options

- **Production:** `https://tour.ishare.ca` — see [DEPLOY.md](./DEPLOY.md)
- Vercel / Netlify — zero-config static deploy
- Azure Static Web Apps — `public/staticwebapp.config.json` included
- Any static file server + CDN

### iShare embed

See [EMBED.md](./EMBED.md) for URL format, `postMessage`, and QA.

```html
<iframe
  src="https://tour.ishare.ca/{tourId}/{firstScene}?embed=1"
  title="Virtual Tour"
  allow="fullscreen"
  loading="lazy"
  style="width:100%; height:min(80vh, 720px); border:0;"
></iframe>
```

### URL routing

Tour and scene use **path segments**, not query strings:

```
/{tourId}/{sceneId}
```

Example: `/ken-sargent-house/overview`

Root `/` with multiple catalog tours shows the **client intro picker**.
Single-tour deploys redirect to that tour automatically. Override with
`?intro=1|0` (see below).

### URL parameters (query flags)

Parsed in [`useAppSearchParams()`](../src/hooks/useAppSearchParams.ts).
Preserved across in-app navigation — see `PRESERVED_SEARCH_KEYS` in
[`tourPaths.ts`](../src/utils/tourPaths.ts).

| Param              | Purpose                                                                                            |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `?embed=1`         | Embed mode — see [EMBED.md](./EMBED.md)                                                            |
| `?intro=1`         | Force client intro gallery at `/` (non-embed; incl. single-tour QA)                                |
| `?intro=0`         | Skip client intro at `/` — load default tour directly                                              |
| `?dev=1`           | Dev panel — authoring, tour switch, URL flags ([DEV_PANEL.md](./DEV_PANEL.md))                     |
| `?chatTest=1`      | AI chat scroll test messages (toggle in dev panel)                                                 |
| `?notFoundTest=1`  | Force tour not-found / 404 screen (toggle in dev panel)                                            |
| `?loadErrorTest=1` | Force viewer load-error overlay — panorama + 3D (toggle in dev panel; legacy: `panoramaErrorTest`) |
| `?navPreview=0`    | Disable nav-preview mini viewer (default: on; toggle in dev panel)                                 |
| `?skipLanding=1`   | Skip landing zoom animation (toggle in dev panel)                                                  |
| `?splashHold=1`    | Hold load splash longer for loader UX testing (toggle in dev panel)                                |

Combine flags as needed, e.g. `?embed=1&skipLanding=1`. With `?dev=1`, the dev
panel includes **Switch tour** (multi-tour) and **URL flags** checkboxes.

**Legacy (redirect only):** `?tour=` and `?scene=` are accepted once and
rewritten to `/{tourId}/{sceneId}`; they are not kept in the URL after redirect.

---

## Future Stack Additions

| Feature              | Suggested addition                                      |
| -------------------- | ------------------------------------------------------- |
| LLM assistant        | Vercel serverless or iShare API + Azure OpenAI          |
| Analytics            | postMessage to iShare parent                            |
| Admin editor         | Separate Next.js app or iShare backend                  |
| Viewport zones       | Extend tour JSON + `viewer.getPosition()`               |
| Thumbnails           | Generated assets in `public/assets/thumbs/`             |
| 3D hotspots          | Raycasting + world-position markers in ThreeDViewer     |
| VR / XR              | WebXR session on Three.js viewer (Phase 3)              |
| 3D scene transitions | Multi-room GLTF + camera path animation in ThreeDViewer |
