# Technology Stack

## Overview

| Layer       | Technology                             | Version                                  |
| ----------- | -------------------------------------- | ---------------------------------------- |
| Runtime     | React                                  | ^19                                      |
| Language    | TypeScript                             | ~5.7                                     |
| Build tool  | Vite                                   | ^6                                       |
| 360 viewer  | Photo Sphere Viewer (PSV)              | ^5.11                                    |
| PSV plugins | markers-plugin, virtual-tour-plugin    | ^5.11                                    |
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

### Photo Sphere Viewer (not raw Three.js)

PSV is a **specialised 360° panorama library** built on WebGL/Three.js
internally. For this MVP it provides:

- Equirectangular texture mapping
- Touch/mouse drag and zoom controls
- HTML marker anchoring (yaw/pitch)
- Multi-scene virtual tour with fade transitions
- Mature plugin ecosystem (markers, virtual tour)

Building the same from raw Three.js would require implementing sphere geometry,
camera constraints, marker projection, and scene management — estimated 2–4
weeks of infrastructure work before feature development.

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

**Decision:** Photo Sphere Viewer — best balance of demo quality (transitions,
markers) and development speed for a SeekBeak replacement proof.

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
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
}
```

### Development

```json
{
  "@types/react": "^19.0.0",
  "@types/react-dom": "^19.0.0",
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
│   │   ├── tokens.css           # iShare brand tokens
│   │   ├── layout.css
│   │   └── hotspots.css
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
tours/ken-sargent.json
        │
        ├─► PanoramaViewer (PSV nodes + markers)
        ├─► SceneNav (scene list)
        └─► transition.ts → virtualTour.setCurrentNode (rotateTo / zoomTo)

tours/ken-sargent-knowledge.json
        │
        └─► mockAssistant.ts ◄── useTourAssistant ◄── currentSceneId

useTourState
        │
        ├─► currentSceneId → SceneNav, LocationBadge
        ├─► history stack → Back button
        └─► isTransitioning → disable nav during animation
```

---

## Styling

- **Design tokens:** `src/styles/tokens.css` — iShare brand colours (placeholder
  until brand hex provided)
- **Hotspot styles:** `src/styles/hotspots.css` — nav pulse ring, info icon
- **Component styles:** colocated `.css` files per component

No CSS framework in MVP — keeps bundle small and embed-friendly.

---

## Deployment

### Build

```bash
npm run build   # outputs to dist/
```

### Hosting options

- Vercel / Netlify — zero-config static deploy
- Azure Static Web Apps — aligns with enterprise infra
- Any static file server + CDN

### iShare embed

```html
<iframe
  src="https://tour.yourdomain.com/?embed=1"
  title="Ken Sargent House Virtual Tour"
  allow="fullscreen"
  loading="lazy"
  style="width:100%; height:min(80vh, 720px); border:0;"
></iframe>
```

### URL parameters

| Param               | Purpose                              |
| ------------------- | ------------------------------------ |
| `?embed=1`          | Hide header, full-height viewer      |
| `?dev=1`            | Hotspot placement logger (yaw/pitch) |
| `?scene=reception`  | Deep link to scene                   |
| `?tour=ken-sargent` | Tour selector (single tour for now)  |

---

## Future Stack Additions

| Feature        | Suggested addition                             |
| -------------- | ---------------------------------------------- |
| LLM assistant  | Vercel serverless or iShare API + Azure OpenAI |
| Analytics      | postMessage to iShare parent                   |
| Admin editor   | Separate Next.js app or iShare backend         |
| Viewport zones | Extend tour JSON + `viewer.getPosition()`      |
| Thumbnails     | Generated assets in `public/assets/thumbs/`    |
