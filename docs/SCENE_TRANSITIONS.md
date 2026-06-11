# Scene transitions

How the virtual tour moves between panoramas. Implemented in
`src/viewer/transition.ts`; depth detection in `src/viewer/sceneDepth.ts`.

## Design goal

Transitions should feel like **walking into** or **stepping back from** a space,
not a hard cut. We use Photo Sphere Viewer's native **fade** for the panorama
swap, and orchestrate camera motion before and after with `viewer.animate()`.

**Do not** pass `rotateTo` / `zoomTo` into `setCurrentNode` fade options — that
path has caused load errors. Pose changes happen **after** the fade completes.

## Depth

Scenes are ordered by BFS from `firstScene` along `nav` hotspots:

```
overview (0) → main-entrance (1) → reception (2)
```

| Direction     | Condition                 | Function            |
| ------------- | ------------------------- | ------------------- |
| **Deeper**    | `depth(to) > depth(from)` | `navigateDeeper`    |
| **Shallower** | `depth(to) < depth(from)` | `navigateShallower` |

## Zoom vocabulary

| Name              | PSV zoom                      | Tour JSON `zoom` | Use                          |
| ----------------- | ----------------------------- | ---------------- | ---------------------------- |
| **Max zoom out**  | `0` (`LANDING_ZOOM_OUT`)      | —                | Deeper arrive wide           |
| **Default wide**  | `50` (`toPsvZoom(0)`)         | `0`              | Scene `defaultView` baseline |
| **Ingress tight** | `86` (`SHALLOW_INGRESS_ZOOM`) | —                | Shallower arrive at door     |
| **Focus bump**    | current + `38` (max `92`)     | —                | Pre-fade hotspot focus       |

Tour JSON `zoom: 0` means “default framing” (PSV 50), not maximum FOV.

## Deeper transition

**Feel:** approach the threshold → crossfade → arrive wide → settle into the
scene default.

```
[Scene A — current]
  ① Focus: nav hotspot center + zoom in
  ② Fade (PSV setCurrentNode)
[Scene B — target]
  ③ Arrive wide: targetView yaw/pitch + PSV zoom 0
  ④ Settle: same yaw/pitch, zoom in to targetView.zoom
```

### Step detail

| Step     | Trigger                     | Camera                                  | Duration |
| -------- | --------------------------- | --------------------------------------- | -------- |
| ① Focus  | Hotspot click               | `hotspot.position` + zoom +38           | 600ms    |
| ①′ Menu  | Locations / breadcrumb      | Zoom +20 only                           | 220ms    |
| ② Fade   | `fadeToScene`               | PSV crossfade                           | 400ms    |
| ③ Wide   | After fade + panorama ready | `targetView` yaw/pitch, zoom `0` (snap) | instant  |
| ③′ Hold  | After wide                  | —                                       | 280ms    |
| ④ Settle | After hold                  | zoom only → `toPsvZoom(zoom)`           | 900ms    |

`targetView` = hotspot `targetView` if set, else scene `defaultView`.

### Example: overview → main-entrance

1. Focus `(117.3°, -62.5°)` — nav-to-entrance hotspot
2. Fade
3. Wide at `(120.5°, -1.5°)`, PSV zoom 0
4. Settle to `defaultView` zoom 0 (PSV 50)

## Shallower transition

**Feel:** face the exit → crossfade → land at the ingress door zoomed in → pull
back to the parent default view. Mirror of deeper.

```
[Scene A — deeper]
  ① Focus: egress nav hotspot (to parent) + zoom in
  ② Fade
[Scene B — shallower]
  ③ Arrive tight: ingress hotspot yaw/pitch + zoom 86
  ④ Settle: targetView yaw/pitch + zoom out to defaultView
```

### Ingress & egress

| Term        | Scene              | Definition                                             |
| ----------- | ------------------ | ------------------------------------------------------ |
| **Egress**  | Current (deeper)   | Nav hotspot where `targetScene ===` shallower target   |
| **Ingress** | Target (shallower) | Nav hotspot where `targetScene ===` scene we came from |

Helpers: `findEgressHotspot`, `findIngressHotspot` in `sceneDepth.ts`.

### Step detail

| Step      | Trigger       | Camera                       | Duration |
| --------- | ------------- | ---------------------------- | -------- |
| ① Focus   | Egress found  | `egress.position` + zoom +38 | 600ms    |
| ①′ Menu   | No egress     | Zoom +20 only                | 220ms    |
| ② Fade    | `fadeToScene` | PSV crossfade                | 400ms    |
| ③ Ingress | Ingress found | `ingress.position`, zoom 86  | 500ms    |
| ④ Settle  | Always        | `targetView` full            | 900ms    |

If no ingress hotspot exists (e.g. menu jump overview ← reception), step ③ is
skipped and ④ runs from the post-fade pose.

### Example: main-entrance → overview

1. Focus `(180°, -10°)` — nav-back-overview (egress)
2. Fade
3. Tight at `(117.3°, -62.5°)` — nav-to-entrance on overview (ingress)
4. Settle to overview `defaultView` `(86.5°, -53.8°, zoom 24)`

## PSV native vs custom

| Layer           | API                                              | Role                  |
| --------------- | ------------------------------------------------ | --------------------- |
| Panorama swap   | `virtualTour.setCurrentNode({ effect: 'fade' })` | Native crossfade      |
| Pre/post motion | `viewer.animate()`                               | Custom UX             |
| Hotspots        | MarkersPlugin HTML                               | Not VT `links` arrows |

## Tuning constants

All in `src/viewer/transition.ts`:

```ts
DEEP_FOCUS_MS = 600;
DEEP_ARRIVE_WIDE_HOLD_MS = 280;
DEEP_ARRIVE_ZOOM_MS = 900;
SHALLOW_FOCUS_MS = 600;
SHALLOW_INGRESS_MS = 500;
SHALLOW_ARRIVE_MS = 900;
SHALLOW_INGRESS_ZOOM = 86;
HOTSPOT_ZOOM_DELTA = 38;
FADE_MS = '400ms';
```

## Related

- Landing (first load): `src/viewer/landingTransition.ts`
- Error handling during fade: `PanoramaViewer.tsx` deferred error guard
- Coordinates: `?dev=1` click logger, `anchor: 'center center'` on markers
- Transition debug: `?dev=1` logs `[transition]` steps in the browser console
