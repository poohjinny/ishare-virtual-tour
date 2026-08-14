# 3D architect deliverables — virtual tour production

> **Audience:** In-house 3D architect / visualization team — what to deliver to
> engineering **after** receiving the client intake
> ([CLIENT_REQUIRED_INFORMATION.md](./CLIENT_REQUIRED_INFORMATION.md)).  
> **Goal:** A complete, consistently named package we can drop into
> `assets/{clientId}/{tourId}/` and wire into `tours/{tourId}.json` without
> guesswork.

---

## Pipeline position

```text
Client intake doc  →  YOU (model + render + annotate)  →  Engineering (JSON + hotspots + QA)
```

You own **spatial accuracy**, **visual quality**, and **camera placement**.
Engineering owns **hotspot tuning**, **tour JSON**, and **launch**.

---

## Before you start

Confirm you have from sales / client intake:

- [ ] Final **scene list** (titles + which are in v1)
- [ ] **Start scene** (usually Overview)
- [ ] **Navigation graph** — which scenes link to which
- [ ] **Naming opportunity** anchors per scene (if any)
- [ ] **Brand references** — photos, CAD, style direction
- [ ] **`clientId`**, **`tourId`**, and **`sceneId`s** from engineering (see
      below)

**Id rules** (must match repo conventions):

| Id         | Rule                                                          | Example                                 |
| ---------- | ------------------------------------------------------------- | --------------------------------------- |
| `clientId` | Client website hostname **without** `www` and **without** TLD | `qchfoundation` from `qchfoundation.ca` |
| `tourId`   | Opaque `t_*` issued by engineering — not the display title    | `t_l01wnq8eh6`                          |
| `sceneId`  | Opaque `s_*` issued by engineering — not the scene title      | `s_dtv27wfrbi`                          |

Paths: `assets/{clientId}/{tourId}/…` — [assets/README.md](../../assets/README.md)

---

## Delivery package structure

Deliver one folder per tour, matching the repo layout:

```text
{clientId}/
└── {tourId}/
    ├── panoramas/           # REQUIRED — one {sceneId}.webp per scene
    ├── brand/               # If not already supplied by client intake
    │   └── logo.png         # Only if engineering asks you to include it
    ├── scene-thumbs/        # OPTIONAL — we usually auto-generate
    └── delivery-notes.md    # REQUIRED — your readme (template below)
```

**Handoff method:** Shared drive / zip with the structure above. Do **not**
rename files after engineering starts — filenames become JSON references.

---

## Panoramas (required)

### Technical spec

| Property               | Requirement                                     |
| ---------------------- | ----------------------------------------------- |
| Projection             | **Equirectangular** (2:1 aspect ratio)          |
| Recommended resolution | **8192 × 4096** px                              |
| Minimum resolution     | **4096 × 2048** px (only if file size critical) |
| **Format on delivery** | **WebP** (`.webp`) — lossy, **sRGB**            |
| WebP quality           | **80–85** (match across all scenes in a tour)   |
| Target file size       | **~800 KB–1.2 MB** per scene after export       |
| Seams                  | No visible stitch line at 0°/360° yaw           |
| Tripod / camera        | Remove or paint out tripod cap; no crew in shot |
| Lighting               | Consistent across scenes in the same wing       |
| Verticals              | Level horizon; pitch 0° = true horizon          |

**Do not deliver** JPEG/PNG panoramas in the handoff package — tour JSON
references `.webp` only. Re-export at lower quality if a file is still above
**~2 MB**.

**File naming:**

```text
panoramas/{sceneId}.webp
```

`sceneId` must be the opaque `s_*` id engineering issued for that scene.

**Export tips:** If your DCC tool does not export WebP directly, render to
lossless PNG first, then convert once with consistent quality (e.g. Photoshop
**Save for Web**, Squoosh, or `cwebp -q 82`). Do not commit intermediate JPGs.

**One panorama = one scene camera position.** Multiple donor views in the same
room = multiple scenes only if product agrees (usually one per space).

### Per-scene panorama checklist

For **each** scene:

- [ ] `{sceneId}.webp` exported
- [ ] Camera height documented (e.g. 1.6 m eye level)
- [ ] **Recommended default view** documented (see below)
- [ ] Nav targets visible from this camera (doorways, corridors)
- [ ] NO anchor visible if scene has a naming opportunity

### Default view (required per scene)

Engineering needs a **starting look direction** when the scene loads.

Document in `delivery-notes.md` per scene:

| Field   | Description                               | Example |
| ------- | ----------------------------------------- | ------- |
| `yaw`   | Horizontal look angle (degrees, 0–360)    | `100.4` |
| `pitch` | Vertical angle (degrees, negative = down) | `-13`   |
| `zoom`  | App zoom level (0–100 scale)              | `15`    |

**How to pick:** Frame the **hero content** — signage, desk, bed bay, or path to
the next nav target. Match what a donor should notice first.

Optional: screenshot circle overlay or marked still from your DCC tool.

Engineering fine-tunes in `?dev=1` mode; your defaults should be within ~10°.

---

## Navigation & spatial graph (required)

Deliver a **nav map** engineering uses to place arrows.

### Format

Spreadsheet or diagram with:

| From scene   | To scene     | Label on arrow | Notes                      |
| ------------ | ------------ | -------------- | -------------------------- |
| s_dtv27wfrbi | s_vddzraqi1q | Reception      | Door visible at yaw ~140°  |
| s_vddzraqi1q | s_dtv27wfrbi | Overview       | Instant back-link optional |

Also mark:

- [ ] **firstScene** / start scene id
- [ ] Any **one-way** vs **bidirectional** links
- [ ] Scenes with **no outbound nav** (dead ends)

You do **not** need final yaw/pitch for each arrow — approximate direction +
screenshot is enough. Engineering places hotspots with the dev panel.

### Optional but helpful

- Annotated panorama stills with arrows drawn in Photoshop / Figurative
- Blender (or source) file path for re-renders

---

## Naming opportunity anchors (when applicable)

For each NO from client intake:

| Field                                 | You deliver              |
| ------------------------------------- | ------------------------ |
| Scene id                              |                          |
| What is being named (physical object) |                          |
| Camera already shows it?              | yes / needs camera nudge |
| Suggested panel direction             | left / right of hotspot  |
| Reference render or crop              | screenshot               |

Engineering places the **info hotspot** on the heart marker at your anchor. Body
copy and price come from client intake — not from you.

---

## Brand folder (usually from client)

Normally supplied in client intake, not by 3D. Include only if asked:

- `brand/logo.png` — transparent PNG
- Do **not** embed client logos into panorama pixels unless product requests it

---

## delivery-notes.md (required template)

Create this file at the tour root:

```markdown
# Delivery notes — {tourTitle}

- clientId: {clientId}
- tourId: {tourId}
- Delivery date:
- Source file: (Blender path / version)
- Contact:

## Scenes

| sceneId      | title    | panorama file     | defaultView yaw | pitch | zoom | notes       |
| ------------ | -------- | ----------------- | --------------- | ----- | ---- | ----------- |
| s_dtv27wfrbi | Overview | s_dtv27wfrbi.webp | 100.5           | -62   | 15   | start scene |

## Navigation

| from         | to           | label     | direction notes      |
| ------------ | ------------ | --------- | -------------------- |
| s_dtv27wfrbi | s_vddzraqi1q | Reception | doorway at ~140° yaw |

## Naming anchors

| sceneId      | hotspot intent | visible in default view? |
| ------------ | -------------- | ------------------------ |
| s_vddzraqi1q | bed bay NO     | yes                      |

## Known issues / re-render list

- (none)

## Changelog

- v1 initial delivery
```

---

## Quality checklist (before handoff)

### Visual

- [ ] No floating geometry, z-fighting, or obvious LOD pops at panorama
      resolution
- [ ] Textures sharp at equator (viewer look direction)
- [ ] Glass / reflections consistent; no fireflies
- [ ] People / PHI / real signage not present unless approved

### Technical

- [ ] Every intake v1 scene has a panorama file
- [ ] All filenames match `sceneId` slugs
- [ ] 2:1 aspect ratio verified on every export
- [ ] File size per WebP noted (target ~800 KB–1.2 MB; flag any > 2 MB)
- [ ] `delivery-notes.md` complete with default views

### Spatial

- [ ] Walking from scene A to B feels coherent (door aligns with nav intent)
- [ ] NO anchors match client-approved naming locations
- [ ] Overview / aerial reads as the right “you are here” context

---

## What engineering does after your delivery

You do **not** need to deliver:

| Item                            | Engineering                                    |
| ------------------------------- | ---------------------------------------------- |
| Scene thumbnails                | `npm run generate-thumbnails`                  |
| WebP re-compress (if oversized) | `scripts/convert-jpg-to-webp.mjs` or manual QA |
| `tours/{tourId}.json`           | Hotspots, transitions, scene copy              |
| Hotspot yaw/pitch/zoom          | Dev panel `?dev=1`                             |
| Catalog entry                   | `tours/catalog.json`                           |
| 3D model optimization           | Mesh merging, LOD if needed (model3d tours)    |
| `viewerType` in tour JSON       | Set to `'model3d'` for GLTF tours              |

Typical turnaround: panoramas in repo → first walkable tour → hotspot polish →
client review.

---

## 3D model tours (GLTF/GLB)

Some tours use **3D model walkthroughs** instead of equirectangular panoramas.
The viewer loads GLTF/GLB files directly via Three.js.

### When this applies

If the tour JSON specifies `"viewerType": "model3d"`, scenes reference a `model`
URL instead of (or in addition to) a `panorama`. Engineering will confirm
whether a tour requires panoramas, 3D models, or both.

### Technical spec

| Property          | Requirement                                            |
| ----------------- | ------------------------------------------------------ |
| Format            | **GLTF** (`.gltf` + `.bin` + textures) or **GLB**      |
| Coordinate system | Y-up, meters (Three.js default)                        |
| Max file size     | **~20 MB** GLB recommended (web download budget)       |
| Textures          | Embedded in GLB or relative paths in GLTF              |
| Materials         | PBR (metallic-roughness); avoid custom shaders         |
| Mesh count        | Keep draw calls reasonable (< 500 meshes preferred)    |
| Lighting          | Baked lightmaps or emissive; viewer adds ambient light |

### Delivery

```text
{clientId}/
└── {tourId}/
    ├── models/              # REQUIRED for model3d tours
    │   └── {sceneId}.glb    # One GLB per scene (or .gltf + assets)
    ├── panoramas/           # OPTIONAL — thumbnail or fallback
    ├── scene-thumbs/        # Placeholder card image for catalog
    └── delivery-notes.md
```

### Per-scene model checklist

- [ ] Model exports cleanly in glTF Validator (no errors)
- [ ] Camera / spawn position documented (x, y, z in meters)
- [ ] Textures packed (no missing references)
- [ ] File size noted (flag any > 20 MB)
- [ ] Navigation targets documented (doorways, corridors for future hotspots)

---

## Revisions

Version panoramas when re-rendering:

```text
panoramas/{sceneId}.webp        # always replace in place (`s_*`)
delivery-notes.md               # add changelog row
```

If a **sceneId changes**, tell engineering before files land — URLs and JSON
keys depend on it.

---

## Related documents

| Document                                                           | Purpose                             |
| ------------------------------------------------------------------ | ----------------------------------- |
| [CLIENT_REQUIRED_INFORMATION.md](./CLIENT_REQUIRED_INFORMATION.md) | What sales collects from the client |
| [assets/README.md](../../assets/README.md)                            | Repo paths, WebP rules, thumbnails  |
| [PRODUCT_SPEC.md](../product/PRODUCT_SPEC.md)                               | Scene / hotspot JSON shapes         |
| [SCENE_TRANSITIONS.md](../engineering/CODING_GUIDELINES.md#scene-transitions)                     | How scene changes feel in-app       |
