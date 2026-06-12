# Scene transitions

Minimal setup — **Virtual Tour plugin defaults only**.

## Flow

```ts
virtualTour.setCurrentNode(sceneId, { showLoader: false });
```

No custom preload, focus, align, or post-swap camera snap.

## Plugin defaults (PSV Virtual Tour)

| Option       | Default                |
| ------------ | ---------------------- |
| `effect`     | `fade`                 |
| `speed`      | `20rpm`                |
| `rotation`   | `true`                 |
| `showLoader` | `false` (our override) |

We only override `showLoader: false` for inter-scene moves.

## Avoid

- `rotateTo` / `zoomTo` on `setCurrentNode` — breaks panorama swap
- Instant `viewer.rotate()` / `viewer.zoom()` after swap — causes flash
- Custom `effect: 'none'` on node changes — old texture removed first (white
  gap)

## First load

Initial node still uses `effect: 'none'` + `landingTransition.ts`.

## Canvas

Viewer uses `canvasBackground: '#000'` and `alpha: false` to avoid page bg
showing through fade.
