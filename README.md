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

Path-based URLs (scene changes update the address bar; browser back/forward
works).

| Path                              | Description                          |
| --------------------------------- | ------------------------------------ |
| `/`                               | Default tour, overview (first scene) |
| `/main-entrance`                  | Default tour, main entrance          |
| `/reception`                      | Default tour, reception              |
| `/gphospitalfoundation`           | GPRHF tour, first scene              |
| `/gphospitalfoundation/reception` | GPRHF tour + scene                   |
| `/cancerresearchsociety`          | Cancer Research Society, first scene |

Legacy query links (`?tour=` / `?scene=`) redirect to the paths above.

## Query flags

| Parameter   | Example        | Description                                        |
| ----------- | -------------- | -------------------------------------------------- |
| `embed`     | `?embed=1`     | Minimal chrome for iShare iframe embed             |
| `dev`       | `?dev=1`       | Click panorama to log yaw/pitch for hotspot tuning |
| `errorTest` | `?errorTest=1` | Show panorama load-error UI for layout debugging   |

**Examples:**

- Dev mode: `http://localhost:5173/?dev=1`
- Main entrance: `http://localhost:5173/main-entrance`
- Reception + dev: `http://localhost:5173/reception?dev=1`
- Embed: `http://localhost:5173/?embed=1`

## iShare Embed

```html
<iframe
  src="https://your-domain.com/?embed=1"
  <!-- or https://your-domain.com/main-entrance?embed=1 -->
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
tours/                 Tour JSON + AI knowledge base per client
src/
  viewer/            Photo Sphere Viewer integration
  components/        UI (nav, popups, AI assistant)
  hooks/             Tour state, embed mode, assistant
  services/          Mock AI assistant
docs/MVP_PLAN.md     Full specification
```

## Assets

Add files under `assets/{clientId}/` (see
[`assets/README.md`](assets/README.md)), then run:

```bash
npm run sync-assets
```

This copies `assets/` → `public/assets/` (also runs automatically on `dev` and
`build`). See [`assets/README.md`](assets/README.md).

## Hotspot & Landing Coordinate Tuning

Open dev mode (works in Cursor Simple Browser too):

```
http://localhost:5173/?dev=1
```

| Goal                             | Action                                                          |
| -------------------------------- | --------------------------------------------------------------- |
| **Landing view** (`defaultView`) | Pan/zoom to the desired start angle → **Copy landing JSON (L)** |
| **Hotspot** (`position`)         | Click the panorama → **Copy hotspot JSON**                      |

Paste into [`tours/gphospitalfoundation.json`](tours/gphospitalfoundation.json)
under the relevant scene.

## AI Assistant

The bottom-right **AI** button opens a chat panel that knows your current scene.
MVP uses mock responses from
[`tours/gphospitalfoundation-knowledge.json`](tours/gphospitalfoundation-knowledge.json).
Replace `mockAssistant.ts` with an API call for production LLM integration.

## Tech Stack

- Vite + React + TypeScript
- [Photo Sphere Viewer](https://photo-sphere-viewer.js.org/) (core, markers,
  virtual-tour plugins)

## Documentation

| Document                                   | Description                                           |
| ------------------------------------------ | ----------------------------------------------------- |
| [`docs/README.md`](docs/README.md)         | Documentation index                                   |
| [`docs/PLANNING.md`](docs/PLANNING.md)     | Project goals, SeekBeak context, phases, demo script  |
| [`docs/TECH_STACK.md`](docs/TECH_STACK.md) | Technology choices, library comparison, deployment    |
| [`docs/MVP_PLAN.md`](docs/MVP_PLAN.md)     | Feature specs, data schemas, implementation checklist |
