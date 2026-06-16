# iShare Virtual Tour

In-house 360° virtual tour MVP for **Ken Sargent House** (Grande Prairie
Regional Hospital Foundation) and **Cancer Research Society**, built to
demonstrate a SeekBeak replacement with improved navigation, smooth scene
transitions, styled hotspots, and a scene-aware AI assistant.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Build for production

```bash
npm run build
npm run preview
```

## Tour Flow

```
Overview → Main Entrance → Reception
```

Use the left **Locations** panel, **nav hotspots** (pulsing arrows), or **Back**
to move between scenes.

## Routes

Path-based URLs — `{tourId}` and `{sceneId}` come from
[`tours/catalog.json`](tours/catalog.json) and each tour JSON. Scene changes
update the address bar; browser back/forward works.

| Path                  | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `/`                   | Client intro — pick a tour from the gallery               |
| `/{tourId}/{sceneId}` | A specific tour and scene                                 |
| `/{tourId}`           | Tour first scene (canonicalizes to `/{tourId}/{sceneId}`) |

Legacy client-id paths and `?tour=` / `?scene=` query links redirect to the
canonical `/{tourId}/{sceneId}` form.

`?embed=1` on `/` skips the intro and loads a tour directly (for iframe embeds).

## Query flags

| Parameter   | Example              | Description                                        |
| ----------- | -------------------- | -------------------------------------------------- |
| `embed`     | `?embed=1`           | Minimal chrome for iShare iframe embed             |
| `dev`       | `?dev=1`             | Click panorama to log yaw/pitch for hotspot tuning |
| `no`        | `?no=info-reception` | Open a naming-opportunity panel (survives refresh) |
| `errorTest` | `?errorTest=1`       | Show panorama load-error UI for layout debugging   |

**Examples:**

- Dev mode: `http://localhost:5173/ken-sargent-house/overview?dev=1`
- Embed: `http://localhost:5173/?embed=1`
- Direct tour link: `http://localhost:5173/cancer-research/reception`
- Naming opportunity deep link:
  `http://localhost:5173/ken-sargent-house/reception?no=info-reception`

## iShare Embed

```html
<iframe
  src="https://your-domain.com/ken-sargent-house/overview?embed=1"
  title="Ken Sargent House Virtual Tour"
  allow="fullscreen"
  loading="lazy"
  style="width:100%; height:min(80vh, 720px); border:0; border-radius:8px;"
></iframe>
```

## Project Structure

```
assets/{clientId}/     Per-client media (panoramas, brand logos)
public/assets/         Auto-synced copy (served at /assets/...)
tours/                 `{tourId}.json`, `{tourId}-knowledge.json`, `catalog.json`
src/
  viewer/            Photo Sphere Viewer integration
  components/        UI (nav, popups, AI assistant)
    ui/              Shared primitives (Badge, Accordion, …)
  hooks/             Tour state, embed mode, assistant
  services/          Mock AI assistant
docs/MVP_PLAN.md     Full specification
docs/COMPONENTS.md   Shared component reuse (React + HTML)
```

## Assets

Add files under `assets/{clientId}/{tourId}/` (see
[`assets/README.md`](assets/README.md)). **Panorama JPGs in `panoramas/` must be
converted to WebP** before referencing them in tour JSON — see
[`assets/README.md` — Panoramas — JPG → WebP](assets/README.md#panoramas--jpg--webp-required).
Then run:

```bash
npm run sync-assets
```

This copies `assets/` → `public/assets/` (also runs automatically on `dev` and
`build`). See [`assets/README.md`](assets/README.md).

## Hotspot & Landing Coordinate Tuning

Open dev mode (works in Cursor Simple Browser too):

```
http://localhost:5173/ken-sargent-house/overview?dev=1
```

| Goal                             | Action                                                          |
| -------------------------------- | --------------------------------------------------------------- |
| **Landing view** (`defaultView`) | Pan/zoom to the desired start angle → **Copy landing JSON (L)** |
| **Hotspot** (`position`)         | Click the panorama → **Copy hotspot JSON**                      |

Paste into the relevant scene in `tours/{tourId}.json`.

## AI Assistant

The bottom-right **AI** button opens a chat panel that knows your current scene.
MVP uses mock responses from `tours/{tourId}-knowledge.json`. Replace
`mockAssistant.ts` with an API call for production LLM integration.

## Tech Stack

- Vite + React + TypeScript
- [Photo Sphere Viewer](https://photo-sphere-viewer.js.org/) (core, markers,
  virtual-tour plugins)

## Documentation

| Document                                                 | Description                                           |
| -------------------------------------------------------- | ----------------------------------------------------- |
| [`docs/README.md`](docs/README.md)                       | Documentation index                                   |
| [`docs/CODING_GUIDELINES.md`](docs/CODING_GUIDELINES.md) | Engineering conventions & doc map                     |
| [`docs/GIT_WORKFLOW.md`](docs/GIT_WORKFLOW.md)           | Commit/push — one task per commit                     |
| [`docs/PLANNING.md`](docs/PLANNING.md)                   | Project goals, SeekBeak context, phases, demo script  |
| [`docs/TECH_STACK.md`](docs/TECH_STACK.md)               | Technology choices, library comparison, deployment    |
| [`docs/MVP_PLAN.md`](docs/MVP_PLAN.md)                   | Feature specs, data schemas, implementation checklist |
