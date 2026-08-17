# Embed mode — client iframe delivery (`?embed=1`)

> How to embed the virtual tour on iShare or a client website: URL format, UI
> differences, parent-page `postMessage`, and local QA.

**Product contract (short):**
[PRODUCT_SPEC.md](../product/PRODUCT_SPEC.md#url-query-contract)  
**Local QA:** [DEV_PANEL.md](../engineering/DEV_PANEL.md#viewport--device--embed) — Debug →
Viewport → Embed mode

---

## What embed mode does

`?embed=1` tells the viewer it runs inside a **host page iframe**. The tour
should feel like part of the parent site — not a standalone marketing visit.

| Behavior                 | Standalone                       | `?embed=1`                                    |
| ------------------------ | -------------------------------- | --------------------------------------------- |
| Client intro at `/`      | Per catalog rules                | Skipped → default tour                        |
| FAB dock                 | Explore, Share, Controls, Help   | **Explore only** (Share/Help/Controls hidden) |
| Glass panel share        | NO + location preview headers    | **Hidden**                                    |
| PSV control pill         | Toggle via Controls FAB          | **Always visible** (zoom, move, fullscreen)   |
| Immersive ambience (BGM) | PSV navbar music control         | **Off** — iframe audio is unreliable          |
| Load splash              | ~3.2s curtain                    | **~1.1s** lighter splash                      |
| Look-around coach pill   | First visit, dismiss on drag/tap | Hidden                                        |
| `postMessage` to parent  | No                               | Yes (when in iframe)                          |

Guide FAB (AI assistant) and Explore/navigation stay available unless product
decides otherwise later. Embed does not expose the Controls FAB — the bottom PSV
pill stays on so visitors can zoom and enter fullscreen without an extra dock
button.

**Do not use `?intro=0` for client embeds** — use `embed=1` on a tour path.
`intro=0` is a legacy root-only shortcut.

---

## Canonical embed URL

Tour and scene live in the **path**; `embed` stays in the **query**:

```
https://tour.ishare.ca/{tourId}/{firstScene}?embed=1
```

Examples:

```
https://tour.ishare.ca/t_9zs0j4a7xt/s_sxeq0eovm7?embed=1
https://tour.ishare.ca/t_l01wnq8eh6/s_dtv27wfrbi?embed=1
```

`embed` is preserved when the visitor navigates inside the tour (scene changes,
Explore picks, naming deep links). See `PRESERVED_SEARCH_KEYS` in
`apps/tour-viewer/src/utils/tourPaths.ts`.

### Naming-opportunity deep link in embed

```
https://tour.ishare.ca/{tourId}/{sceneId}?embed=1&no={no_*}
```

Opens the tour in embed chrome with the naming panel focused (same as non-embed
`?no=` behavior).

### What not to put in production embed URLs

| Param                            | Why                                       |
| -------------------------------- | ----------------------------------------- |
| `dev=1`                          | Dev panel — local authoring only          |
| `guideUiTest`, `notFoundTest`, … | QA flags — [DEV_PANEL.md](../engineering/DEV_PANEL.md) |
| `intro=0`                        | Legacy; use `embed=1` + path              |

---

## iframe markup (host page)

Minimum:

```html
<iframe
  src="https://tour.ishare.ca/t_l01wnq8eh6/s_dtv27wfrbi?embed=1"
  title="Med/Surg Inpatient Virtual Tour"
  allow="fullscreen"
  loading="lazy"
  style="width:100%; height:min(80vh, 720px); border:0;"
></iframe>
```

Recommendations:

- **`title`** — accessible name for the iframe (tour / facility name).
- **`allow="fullscreen"`** — viewer fullscreen targets `.viewer-area`.
- **Height** — fixed `min(80vh, 720px)` or similar; optional dynamic resize via
  `tour:resize` messages (below).
- **No `?dev=1`** in client-facing `src`.

### Client IT checklist

| Check            | Notes                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| iframe allowed   | Parent CSP `frame-src` / tour host `X-Frame-Options` or `Content-Security-Policy: frame-ancestors` |
| HTTPS            | Match production tour host                                                                         |
| Cookie / storage | Tour is static SPA; no login in Phase 1                                                            |

Sales intake:
[CLIENT_REQUIRED_INFORMATION.md §10](../client/CLIENT_REQUIRED_INFORMATION.md#10-launch--embed).

---

## `postMessage` — parent page integration

When the tour runs **inside an iframe** (`window.parent !== window`) and
`?embed=1` is set, the viewer notifies the parent for analytics and optional
layout sync.

### Filter on `source`

Every message includes:

```ts
source: 'ishare-virtual-tour';
```

Parent listener (minimal):

```js
window.addEventListener('message', (event) => {
  if (event.data?.source !== 'ishare-virtual-tour') return;

  switch (event.data.type) {
    case 'tour:ready':
      // First panorama interactive — good for "tour loaded" analytics
      console.log(event.data.tourId, event.data.sceneId);
      break;
    case 'tour:scene':
      // Scene or naming panel changed
      console.log(event.data.sceneId, event.data.namingHotspotId);
      break;
    case 'tour:resize':
      // Optional: resize iframe to event.data.height
      break;
  }
});
```

**Production hardening:** validate `event.origin` against your tour host (e.g.
`https://tour.ishare.ca`) before trusting payloads. The viewer currently posts
with target `'*'`; origin checks belong on the parent.

### Message types

| `type`        | When fired                                                | Fields                                                           |
| ------------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| `tour:ready`  | Once — first panorama reveal (splash overlay fading). Posted from any iframe, not only `embed=1`. | `tourId`, `sceneId`                                              |
| `tour:scene`  | Every scene change or naming panel open/close after ready | `tourId`, `sceneId`, `namingHotspotId` (`null` if none)          |
| `tour:resize` | Initial load + viewport height changes (`ResizeObserver`) | `tourId`, `height` (px, `document.documentElement.clientHeight`) |

### Example payloads

```json
{
  "source": "ishare-virtual-tour",
  "type": "tour:ready",
  "tourId": "t_l01wnq8eh6",
  "sceneId": "s_dtv27wfrbi"
}
```

```json
{
  "source": "ishare-virtual-tour",
  "type": "tour:scene",
  "tourId": "t_l01wnq8eh6",
  "sceneId": "s_vddzraqi1q",
  "namingHotspotId": null
}
```

```json
{
  "source": "ishare-virtual-tour",
  "type": "tour:resize",
  "tourId": "t_l01wnq8eh6",
  "height": 720
}
```

`tour:ready` is also posted when the tour is iframed without `embed=1` (admin
authoring preview). `tour:scene` and `tour:resize` still require `embed=1`.

**Code:** `apps/tour-viewer/src/constants/tourEmbed.ts`, `apps/tour-viewer/src/hooks/useTourEmbedMessaging.ts`

### Optional: auto-resize iframe

```js
const iframe = document.querySelector('#virtual-tour');

window.addEventListener('message', (event) => {
  if (event.origin !== 'https://tour.ishare.ca') return;
  if (event.data?.source !== 'ishare-virtual-tour') return;
  if (event.data.type !== 'tour:resize') return;
  iframe.style.height = `${event.data.height}px`;
});
```

Use only if the host layout should hug content height; fixed viewport height is
simpler and avoids layout jump on mobile.

---

## Local development & QA

### 1. Quick UI check (same tab)

```
http://localhost:5173/{tourId}/{sceneId}?embed=1
```

Confirm Share/Help FABs are hidden and splash is short.

### 2. Embed mode (recommended)

```
http://localhost:5173/{tourId}/{sceneId}?dev=1
```

Open **Dev** → **Debug** → **Viewport** → **Embed mode**. That loads a host
iframe harness with `?embed=1`:

- Live preview (resize + optional browser chrome)
- **Copy URL** / **Copy HTML** — production embed link and iframe markup
- **Messages** — parent `postMessage` log (`tour:ready` / `tour:scene` /
  `tour:resize`)

See [DEV_PANEL.md](../engineering/DEV_PANEL.md#viewport--device--embed).

### 3. Manual HTML (optional)

Copy embed URL from Embed mode (or build manually), open a local HTML file or
test page:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Embed test</title>
  </head>
  <body>
    <iframe
      id="tour"
      src="http://localhost:5173/t_l01wnq8eh6/s_dtv27wfrbi?embed=1"
      title="Virtual Tour"
      allow="fullscreen"
      width="100%"
      height="600"
      style="border:0"
    ></iframe>
    <pre id="log"></pre>
    <script>
      window.addEventListener('message', (e) => {
        if (e.data?.source !== 'ishare-virtual-tour') return;
        document.getElementById('log').textContent +=
          JSON.stringify(e.data) + '\n';
      });
    </script>
  </body>
</html>
```

Embed mode **Messages** should show entries when the tour runs in this iframe
(or in the built-in Embed preview).

---

## Build embed links in code

```ts
import { buildAbsoluteEmbedUrl } from '../../apps/tour-viewer/src/utils/buildShareUrl';

const url = buildAbsoluteEmbedUrl({
  tourId: 't_l01wnq8eh6',
  sceneId: 's_dtv27wfrbi',
  firstSceneId: 's_dtv27wfrbi',
});
// → https://…/t_l01wnq8eh6/s_dtv27wfrbi?embed=1
```

Strips `dev` and other internal flags. Used by dev panel **Copy URL**.

---

## Related documents

| Document                                                           | Topic                                      |
| ------------------------------------------------------------------ | ------------------------------------------ |
| [PRODUCT_SPEC.md](../product/PRODUCT_SPEC.md)                               | URL contract, catalog visibility           |
| [DEV_PANEL.md](../engineering/DEV_PANEL.md)                                     | Embed mode — Copy URL/HTML + Messages log  |
| [TECH_STACK.md](../engineering/TECH_STACK.md)                                   | Hosting, static deploy                     |
| [ROADMAP.md](../ROADMAP.md)                                         | Phase 2+ backlog; Phase 1 embed is shipped |
| [CLIENT_REQUIRED_INFORMATION.md](../client/CLIENT_REQUIRED_INFORMATION.md) | Client launch / IT intake                  |
