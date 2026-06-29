# Embed mode — client iframe delivery (`?embed=1`)

> How to embed the virtual tour on iShare or a client website: URL format, UI
> differences, parent-page `postMessage`, and local QA.

**Product contract (short):**
[PRODUCT_SPEC.md](./PRODUCT_SPEC.md#url-query-contract)  
**Local QA:** [DEV_PANEL.md](./DEV_PANEL.md#debug-tab) — Debug tab → `embed`
flag + log

---

## What embed mode does

`?embed=1` tells the viewer it runs inside a **host page iframe**. The tour
should feel like part of the parent site — not a standalone marketing visit.

| Behavior                 | Standalone                     | `?embed=1`                                    |
| ------------------------ | ------------------------------ | --------------------------------------------- |
| Client intro at `/`      | Per catalog rules              | Skipped → default tour                        |
| FAB dock                 | Explore, Share, Controls, Help | **Explore only** (Share/Help/Controls hidden) |
| Glass panel share        | NO + location preview headers  | **Hidden**                                    |
| PSV control pill         | Toggle via Controls FAB        | **Always visible** (zoom, move, fullscreen)   |
| Immersive ambience (BGM) | PSV navbar music control       | **Off** — iframe audio is unreliable          |
| Load splash              | ~3.2s curtain                  | **~1.1s** lighter splash                      |
| First-visit coach pill   | Shown once                     | Hidden                                        |
| `postMessage` to parent  | No                             | Yes (when in iframe)                          |

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
https://tour.ishare.ca/med-surg-inpatient/entrance?embed=1
https://tour.ishare.ca/ken-sargent-house/overview?embed=1
```

`embed` is preserved when the visitor navigates inside the tour (scene changes,
Explore picks, naming deep links). See `PRESERVED_SEARCH_KEYS` in
`src/utils/tourPaths.ts`.

### Naming-opportunity deep link in embed

```
https://tour.ishare.ca/{tourId}/{sceneId}?embed=1&no={hotspotId}
```

Opens the tour in embed chrome with the naming panel focused (same as non-embed
`?no=` behavior).

### What not to put in production embed URLs

| Param                         | Why                                       |
| ----------------------------- | ----------------------------------------- |
| `dev=1`                       | Dev panel — local authoring only          |
| `chatTest`, `notFoundTest`, … | QA flags — [DEV_PANEL.md](./DEV_PANEL.md) |
| `intro=0`                     | Legacy; use `embed=1` + path              |

---

## iframe markup (host page)

Minimum:

```html
<iframe
  src="https://tour.ishare.ca/med-surg-inpatient/entrance?embed=1"
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
[CLIENT_REQUIRED_INFORMATION.md §10](./CLIENT_REQUIRED_INFORMATION.md#10-launch--embed).

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
| `tour:ready`  | Once — first panorama reveal (splash done, viewer usable) | `tourId`, `sceneId`                                              |
| `tour:scene`  | Every scene change or naming panel open/close after ready | `tourId`, `sceneId`, `namingHotspotId` (`null` if none)          |
| `tour:resize` | Initial load + viewport height changes (`ResizeObserver`) | `tourId`, `height` (px, `document.documentElement.clientHeight`) |

### Example payloads

```json
{
  "source": "ishare-virtual-tour",
  "type": "tour:ready",
  "tourId": "med-surg-inpatient",
  "sceneId": "entrance"
}
```

```json
{
  "source": "ishare-virtual-tour",
  "type": "tour:scene",
  "tourId": "med-surg-inpatient",
  "sceneId": "kitchen",
  "namingHotspotId": null
}
```

```json
{
  "source": "ishare-virtual-tour",
  "type": "tour:resize",
  "tourId": "med-surg-inpatient",
  "height": 720
}
```

`postMessage` is **not sent** when `embed=1` is missing, even inside an iframe.

**Code:** `src/constants/tourEmbed.ts`, `src/hooks/useTourEmbedMessaging.ts`

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

### 2. Dev panel + log (no iframe)

```
http://localhost:5173/{tourId}/{sceneId}?dev=1&embed=1
```

Open **Dev** → **Debug** → check **`embed`** — the **Embed** subsection appears.
Use it for status, embed URL, and scrollable **postMessage log**

- Log shows `[local only]` until you test inside an iframe

See [DEV_PANEL.md — Debug tab](./DEV_PANEL.md#debug-tab).

### 3. iframe test page (recommended)

Built-in parent-page harness (same origin as `npm run dev`):

```
http://localhost:5173/embed-test.html
```

Optional query: `?tour={tourId}&scene={sceneId}&dev=0` (omit `dev` to load
iframe with `embed=1&dev=1`). Tour and scene are **dropdowns** populated from
`public/embed-test-manifest.json` (generated by `npm run sync-assets` from
`tours/catalog.json` and tour JSONs; internal tours are omitted). Use
`?w={px}&h={px}` for iframe size (width default = full-width preview stage;
height default 720px). Settings and log sit side by side above the full-width
preview stage (`1100px` max).

From the dev panel: **Debug** → **Embed** → **Open iframe test** (new tab,
current tour/scene).

The parent page shows:

- Live iframe with the tour (width/height sliders)
- **Iframe URL** — built from tour/scene/dev; editable for custom embed links
- **Parent received** log — `postMessage` payloads from the child

Inside the iframe, open **Dev** → **Debug** → confirm **In iframe: yes** and
`[parent]` on the child log lines.

If you edit **Iframe URL** away from the picker-built link, the test page stores
`?src=` on its own URL instead of `tour`/`scene`.

**Files:** `public/embed-test.html`, `public/embed-test-manifest.json`
(generated; do not edit by hand)

### 4. Manual HTML (optional)

Copy embed URL from dev panel (or build manually), open a local HTML file or
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
      src="http://localhost:5173/med-surg-inpatient/entrance?embed=1"
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

Dev panel log should show `[parent]` when the tour runs in this iframe.

---

## Build embed links in code

```ts
import { buildAbsoluteEmbedUrl } from '../src/utils/buildShareUrl';

const url = buildAbsoluteEmbedUrl({
  tourId: 'med-surg-inpatient',
  sceneId: 'entrance',
  firstSceneId: 'entrance',
});
// → https://…/med-surg-inpatient/entrance?embed=1
```

Strips `dev` and other internal flags. Used by dev panel **Copy URL**.

---

## Related documents

| Document                                                           | Topic                                     |
| ------------------------------------------------------------------ | ----------------------------------------- |
| [PRODUCT_SPEC.md](./PRODUCT_SPEC.md)                               | URL contract, catalog visibility          |
| [DEV_PANEL.md](./DEV_PANEL.md)                                     | `embed` toggle + message log in Debug tab |
| [TECH_STACK.md](./TECH_STACK.md)                                   | Hosting, static deploy                    |
| [ROADMAP.md](./ROADMAP.md)                                         | Phase 1 embed success criteria            |
| [CLIENT_REQUIRED_INFORMATION.md](./CLIENT_REQUIRED_INFORMATION.md) | Client launch / IT intake                 |
