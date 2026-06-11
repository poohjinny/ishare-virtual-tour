# Project Planning

## Background

SeekBeak is currently embedded in the iShare website as a third-party 360°
virtual tour. Known limitations include:

- **Navigation** — disorienting scene changes, unclear current location
- **Transitions** — abrupt cuts between scenes
- **Hotspot UX** — limited customisation within embed constraints
- **No contextual AI** — cannot answer location-specific questions

This project builds an **in-house virtual tour** to prove we can deliver a
better experience and eventually replace the SeekBeak embed.

---

## MVP Goal (One Line)

> Demonstrate an iframe-ready in-house 360° tour where navigation, transitions,
> hotspot UX, and scene-aware AI are clearly superior to the current SeekBeak
> embed.

### Stakeholder Demo Message

> "We design entry views per scene, show the full tour path in a side panel, use
> zoom + fade transitions, and provide an AI assistant that knows where you are
> — things the SeekBeak embed cannot do with configuration alone."

---

## Tour: Ken Sargent House

### Assets

| File                | Scene ID        | Role                                            |
| ------------------- | --------------- | ----------------------------------------------- |
| `overview.jpg`      | `overview`      | Aerial / dollhouse campus view — **start here** |
| `main-entrance.jpg` | `main-entrance` | Exterior entrance                               |
| `reception.jpg`     | `reception`     | Interior lobby / welcome desk                   |

### Why Start at Overview

With only three scenes, starting at **overview** provides:

1. **Spatial context** — stakeholder understands the facility in 3 seconds
2. **Navigation demo value** — scene panel + "Main Entrance" hotspot shows
   intentional routing
3. **Transition impact** — wide aerial → ground-level entrance benefits from
   zoom + fade
4. **Info + nav hotspots** — overview intro popup + entrance nav in one scene

### Navigation Flow

```
┌─────────────┐   Main Entrance    ┌────────────────┐   Reception    ┌─────────────┐
│  overview   │ ────────────────▶ │ main-entrance  │ ─────────────▶ │  reception  │
│  (start)    │ ◀──────────────── │  (exterior)    │ ◀───────────── │  (lobby)    │
└─────────────┘      Overview      └────────────────┘  Main Entrance └─────────────┘
```

- **firstScene:** `overview`
- Bidirectional navigation on all connected scenes
- Info popups on each scene

---

## Feature Priorities

| Priority | Feature                | Why                                                                   |
| -------- | ---------------------- | --------------------------------------------------------------------- |
| 1        | **Navigation**         | Primary SeekBeak pain point — `targetView`, scene panel, back history |
| 2        | **Smooth transitions** | Zoom in → fade → apply target view                                    |
| 3        | **Hotspot design**     | Branded nav (pulse ring) + info icons                                 |
| 4        | **Info popups**        | Modal overlay vs basic tooltip                                        |
| 5        | **AI assistant**       | Scene-aware Q&A — key differentiator                                  |
| 6        | **Embed mode**         | iShare iframe integration                                             |

---

## SeekBeak vs In-House (Target UX)

| SeekBeak issue                            | In-house solution                                     |
| ----------------------------------------- | ----------------------------------------------------- |
| Wrong facing direction after scene change | `targetView` (yaw/pitch/zoom) per nav hotspot in JSON |
| User doesn't know where they are          | SceneNav panel with active highlight + Back history   |
| Unclear where hotspot leads               | Nav label on hover + scene panel                      |
| Abrupt scene cuts                         | `transition.ts` — pan → zoom → fade → target view     |
| No location-aware help                    | AI assistant with `currentSceneId` + knowledge JSON   |

---

## Implementation Phases

### Phase 1 — Scaffold (Day 1)

- [x] Vite + React + TypeScript project
- [x] PSV + plugins installed
- [x] Assets in `public/assets/`
- [x] Type definitions + tour JSON loader
- [x] Single scene renders in viewer

### Phase 2 — 3-Scene Tour (Day 2–3)

- [x] Virtual tour nodes (overview, main-entrance, reception)
- [x] Nav and info hotspots
- [x] `useTourState` + history stack
- [x] `?dev=1` hotspot placement logger

### Phase 3 — UX Polish (Day 4–5)

- [x] SceneNav, BackButton, InfoPopup, TourHeader, LoadingOverlay
- [x] Transition controller (zoom + fade)
- [x] Hotspot CSS design
- [ ] Hotspot coordinate fine-tuning with `?dev=1`

### Phase 4 — AI + Embed (Day 6)

- [x] Knowledge JSON + mock assistant
- [x] AiFab, ChatPanel, LocationBadge, SuggestedQuestions
- [x] Embed / dev URL params
- [x] README + documentation

---

## 3-Minute Stakeholder Demo Script

1. **Overview loads** — scene panel shows 3 locations, overview highlighted
2. **Info hotspot** — "Ken Sargent House" popup with branded UI
3. **Nav hotspot or panel** — transition to Main Entrance (zoom + fade)
4. **Entrance** — view faces the door naturally (`targetView`)
5. **Reception** — nav hotspot or panel, lands facing welcome desk
6. **Back button** — return to previous scene
7. **AI button** — ask "Is the entrance wheelchair accessible?" — scene-relevant
   answer
8. **Closing** — "Scene views are designed in JSON; SeekBeak embed cannot do
   this."

---

## Out of Scope (MVP)

- Real LLM / serverless API (architecture ready for swap)
- Viewport zone detection (L2 gaze — "what you're looking at")
- Hotspot drag editor
- postMessage to iShare parent
- Scene thumbnail images
- Next.js / backend admin

---

## Risks and Mitigations

| Risk                              | Impact                | Mitigation                                     |
| --------------------------------- | --------------------- | ---------------------------------------------- |
| Hotspot coordinates wrong         | Hotspots miss targets | `?dev=1` click logger + iterative JSON tuning  |
| overview → entrance feels jarring | Poor first impression | Aggressive `targetView` + zoom before fade     |
| Mock AI feels limited             | Weak demo             | Rich FAQs + suggested question chips per scene |
| PSV learning curve                | Delay                 | Official virtual-tour + markers examples       |
| Large panorama load time          | Slow first paint      | Loading overlay; future: lower-res preview     |

---

## Success Criteria

- [x] User completes overview → entrance → reception → back without confusion
- [x] Scene panel and back button always reflect current location
- [x] Transitions use zoom + fade (not hard cuts)
- [x] AI answers scene-relevant FAQs from knowledge JSON
- [x] `npm run dev` and `npm run build` succeed
- [ ] Stakeholder side-by-side comparison with SeekBeak embed
- [ ] Hotspot positions tuned on real images

---

## Future Roadmap

| Phase | Feature                              |
| ----- | ------------------------------------ |
| 1.1   | Hotspot coordinate tuning (`?dev=1`) |
| 1.2   | iShare brand colours in `tokens.css` |
| 2.0   | LLM API (`/api/tour/chat`)           |
| 2.1   | postMessage for iShare analytics     |
| 2.2   | Scene thumbnails in nav panel        |
| 3.0   | Hotspot placement admin UI           |
| 3.1   | Additional tours / facilities        |
