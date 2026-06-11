# iShare Virtual Tour — MVP Plan

> Feature specifications and data schemas. See also:
> [PLANNING.md](./PLANNING.md) (goals, phases, demo script) ·
> [TECH_STACK.md](./TECH_STACK.md) (library choices, dependencies) ·
> [docs index](./README.md)

## Purpose

Demonstrate that an **in-house 360° virtual tour** can replace the SeekBeak
embed on the iShare website, with better:

- Scene navigation and orientation (`targetView` per transition)
- Smooth zoom + fade transitions
- Branded hotspot and popup UX
- Scene-aware AI tour assistant

## Tour: Ken Sargent House

### Scenes

| Scene ID        | Image               | Role                                    |
| --------------- | ------------------- | --------------------------------------- |
| `overview`      | `overview.jpg`      | Aerial campus view — **starting scene** |
| `main-entrance` | `main-entrance.jpg` | Exterior entrance                       |
| `reception`     | `reception.jpg`     | Interior lobby / welcome desk           |

### Navigation Flow

```
overview ──Main Entrance──▶ main-entrance ──Reception──▶ reception
    ▲                           │                          │
    └──────── Overview ─────────┘                          │
    └──────────────── Main Entrance ───────────────────────┘
```

### Hotspots per Scene

| Scene         | Type | Label / Content         |
| ------------- | ---- | ----------------------- |
| overview      | info | Ken Sargent House intro |
| overview      | nav  | Main Entrance           |
| main-entrance | nav  | Overview (back)         |
| main-entrance | info | Welcome message         |
| main-entrance | nav  | Reception               |
| reception     | nav  | Main Entrance (back)    |
| reception     | info | Reception desk info     |

## Tech Stack

See [TECH_STACK.md](./TECH_STACK.md) for full rationale (PSV vs Pannellum vs
Three.js, why not Next.js).

| Layer    | Choice                                                |
| -------- | ----------------------------------------------------- |
| Build    | Vite + React 19 + TypeScript                          |
| Viewer   | Photo Sphere Viewer 5.x                               |
| Plugins  | core, markers-plugin, virtual-tour-plugin             |
| Styling  | CSS + design tokens (`src/styles/tokens.css`)         |
| AI (MVP) | Client-side mock (`ken-sargent-knowledge.json`)       |
| Deploy   | Static SPA (Vercel / Netlify / Azure Static Web Apps) |

## Architecture

```
tours/ken-sargent.json           → Viewer, SceneNav, hotspots
tours/ken-sargent-knowledge.json → AI assistant context
useTourState                     → currentSceneId, history, transitions
PanoramaViewer                   → PSV + VirtualTour + Markers
mockAssistant.ts                 → FAQ/keyword matching (swap for API later)
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ App.tsx                                                      │
├──────────┬──────────────────────────────────────────────────┤
│ SceneNav │  PanoramaViewer (PSV)                             │
│          │    ├─ VirtualTourPlugin (3 scenes)                │
│          │    ├─ MarkersPlugin (nav + info hotspots)        │
│          │    └─ transition.ts (zoom + fade)                 │
│          │  LoadingOverlay                                   │
│          │  AiAssistantFab + AiChatPanel                     │
├──────────┴──────────────────────────────────────────────────┤
│ InfoPopup (modal overlay)                                    │
└─────────────────────────────────────────────────────────────┘
         ▲                    ▲
         │                    │
   useTourState         useTourAssistant
   (scene + history)    (mockAssistant + knowledge JSON)
```

## Data Schemas

### Tour (`tours/ken-sargent.json`)

- `firstScene`: `"overview"`
- Per scene: `title`, `panorama`, `defaultView`, `hotspots[]`
- Hotspot types: `nav` | `info`
- Nav hotspots: `targetScene`, `targetView` (critical for orientation)

### Knowledge (`tours/ken-sargent-knowledge.json`)

- `global`: facility name and summary
- Per scene: `facts[]`, `faqs[]`, `suggestedQuestions[]`

## Feature Specifications

### 1. Panorama Viewer

- Photo Sphere Viewer with Virtual Tour (3 nodes) and Markers plugins
- Custom HTML markers for nav (pulse ring + arrow) and info (`i` icon)
- No default PSV navbar — custom UI overlay

### 2. Navigation

- **SceneNav** (left): all scenes, active highlight, click to navigate
- **Back button**: history stack, restores previous scene
- **targetView** on every nav transition
- Nav disabled during transitions

### 3. Transitions (`src/viewer/transition.ts`)

1. Pan toward hotspot (optional)
2. Zoom in (300ms)
3. Virtual tour fade (500ms)
4. Apply target yaw/pitch/zoom
5. Unlock navigation

### 4. Hotspots + Popups

- Nav: animated CSS markers, 48px touch target
- Info: opens React `InfoPopup` modal (ESC / backdrop / X to close)

### 5. AI Assistant (mock)

- FAB bottom-right of viewer
- Chat panel with location badge (current scene)
- Suggested question chips per scene
- `mockAssistant.ts`: FAQ match → facts → fallback
- On scene change while open: assistant notes new location
- **Future**: replace with `POST /api/tour/chat` + LLM

### 6. Embed Mode

- `?embed=1` — hide header, full-height viewer
- `?scene=` — deep link
- `?dev=1` — hotspot placement logger

## UI Layout

```
┌──────────────────────────────────────────────────────────┐
│ TourHeader (hidden if embed=1)                           │
├──────────┬───────────────────────────────────────────────┤
│ SceneNav │ Panorama Viewer                    [AI FAB]  │
│ + Back   │                                               │
└──────────┴───────────────────────────────────────────────┘
```

## Implementation Checklist

- [x] Vite + React + TS scaffold
- [x] PSV + 3-scene virtual tour
- [x] Nav/info hotspots with custom design
- [x] SceneNav + history back
- [x] Zoom + fade transitions
- [x] InfoPopup modals
- [x] Mock AI assistant
- [x] Embed / dev URL params
- [ ] Hotspot coordinate fine-tuning (use `?dev=1`)
- [ ] Production LLM API
- [ ] iShare iframe integration + postMessage
- [ ] Scene thumbnails for nav panel

## Out of Scope (MVP)

- Real LLM / serverless API
- Viewport zone detection (L2 gaze)
- Hotspot drag editor
- postMessage to iShare parent

## Future: LLM Integration

Replace `askMockAssistant()` in `src/services/mockAssistant.ts` with:

```typescript
POST /api/tour/chat
{
  tourId, sceneId, sceneTitle, messages[]
}
```

Server loads `ken-sargent-knowledge.json`, builds system prompt, calls Azure
OpenAI / OpenAI. API keys stay server-side.

## Success Criteria

- [x] Complete overview → entrance → reception → back without confusion
- [x] Scene panel shows current location
- [x] Transitions use zoom + fade
- [x] AI answers scene-relevant FAQs
- [x] `npm run dev` and `npm run build` succeed

## Risks

| Risk                             | Mitigation                  |
| -------------------------------- | --------------------------- |
| Hotspot coordinates off          | `?dev=1` click logger       |
| overview → entrance disorienting | Tune `targetView` in JSON   |
| Mock AI limited                  | Rich FAQs + suggested chips |
