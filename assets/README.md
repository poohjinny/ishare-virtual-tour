# Assets

Source-of-truth for tour media, organised **per client and tour**. Synced to
`public/assets/` via `npm run sync-assets` (runs before `dev` and `build`).

## Structure

```
assets/
├── favicon.ico              # Platform default → synced to public/favicon.ico
├── brand/                   # Platform-wide (iShare product, immersive playlist, …)
└── {clientId}/              # id = website hostname without TLD
    ├── favicon.png|.ico     # Client tab icon — probed; omit from catalog.json
    ├── brand/
    │   └── logo.png         # Client logo — omit from catalog.json (inferred)
    └── {tourId}/            # matches tour JSON `id` (`t_*`)
        ├── favicon.png|.ico # Tour tab icon override — probed
        ├── panoramas/       # Full 360° equirects, keyed by sceneId (`s_*`)
        ├── scene-thumbs/    # Scene-card bakes at defaultView, keyed by sceneId
        ├── hotspot-thumbs/  # Pin-card bakes at pin position, keyed by hotspotId (`h_*`)
        ├── naming/          # Donor logos per pin, keyed by hotspotId
        ├── brand/
        │   └── logo.png     # Tour logo override — `"logo": true` in tour JSON
        └── audio/           # Optional tour-specific audio
```

| Folder            | Keyed by         | Purpose                                     | JSON field                                         |
| ----------------- | ---------------- | ------------------------------------------- | -------------------------------------------------- |
| `panoramas/`      | `s_*` scene id   | Full 360° source for the viewer             | omit (inferred) / override `scene.panorama`        |
| `scene-thumbs/`   | `s_*` scene id   | Explore / intro / catalog **scene** card    | omit (inferred) / override `scene.thumbnail`       |
| `hotspot-thumbs/` | `h_*` hotspot id | Explore **naming pin** card (pin yaw/pitch) | omit (inferred) / override `hotspot.preview.image` |
| `naming/`         | `h_*` hotspot id | Donor logo for that pin                     | `"logo": true` / override string / omit            |

Tour JSON and `catalog.json` store identity, not conventional `/assets/…` URLs.
Load infers paths via `src/utils/tourAssetResolve.mjs`. Keep an explicit string
only for a non-default file or `https://…`. Donor / tour logo: `true` = default
file, string = override, omit = inherit or none. Client logo: omit = infer
`{clientId}/brand/logo.png`. Favicon: omit and probe png then ico (tour, then
client). model3d tours have no `scene.panorama` — cards use
`scene-thumbs/{sceneId}.webp`.

### Current clients & tours

| clientId                | tourId         | website                           | assets folder                                |
| ----------------------- | -------------- | --------------------------------- | -------------------------------------------- |
| `gphospitalfoundation`  | `t_l01wnq8eh6` | https://gphospitalfoundation.ca/  | `assets/gphospitalfoundation/t_l01wnq8eh6/`  |
| `cancerresearchsociety` | `t_8kx3m2p9qa` | https://cancerresearchsociety.ca/ | `assets/cancerresearchsociety/t_8kx3m2p9qa/` |
| `holodomor`             | `t_r7v4n1c0wd` | https://holodomor.ca/             | `assets/holodomor/t_r7v4n1c0wd/`             |
| `qchfoundation`         | `t_9zs0j4a7xt` | https://qchfoundation.ca/         | `assets/qchfoundation/t_9zs0j4a7xt/`         |
| `ishare-demos`          | `t_ctx4e6rkty` | https://ishare.ca/                | `assets/ishare-demos/t_ctx4e6rkty/` (3D)     |
| `ishare-demos`          | `t_fhvnghlrky` | https://ishare.ca/                | `assets/ishare-demos/t_fhvnghlrky/` (3D)     |
| `ishare-demos`          | `t_oyryn1va9b` | https://ishare.ca/                | `assets/ishare-demos/t_oyryn1va9b/` (3D)     |
| `ishare-demos`          | `t_ciqe1etmpq` | https://ishare.ca/                | `assets/ishare-demos/t_ciqe1etmpq/` (3D)     |

## Client id convention

`clientId` matches the client website hostname without `www` and without TLD.
`tourId` matches the tour JSON `id` field and the first URL path segment
(`/{tourId}/{sceneId}`).

| URL                                 | clientId                |
| ----------------------------------- | ----------------------- |
| `https://gphospitalfoundation.ca/`  | `gphospitalfoundation`  |
| `https://cancerresearchsociety.ca/` | `cancerresearchsociety` |
| `https://holodomor.ca/`             | `holodomor`             |
| `https://qchfoundation.ca/`         | `qchfoundation`         |

Use `clientIdFromUrl()` in `src/utils/clientId.ts` when adding new clients.

## Panoramas — JPG → WebP (required)

**Every `.jpg` (or `.jpeg`) dropped into a `panoramas/` folder must be converted
to WebP before the tour references it.** Tour JSON uses `.webp` paths only.

Encode settings are shared with Dev Panel upload
([`scripts/lib/panoramaEncode.mjs`](../scripts/lib/panoramaEncode.mjs)):

| Setting   | Default | Env                                       |
| --------- | ------- | ----------------------------------------- |
| Max width | 8192    | `PANORAMA_MAX_WIDTH` or `WEBP_MAX_WIDTH`  |
| Quality   | 90      | `PANORAMA_WEBP_QUALITY` or `WEBP_QUALITY` |

Do **not** chase a single MB-per-scene number — simple interiors compress small;
outdoor scenes stay larger at the same settings.

1. Place the source JPG under `assets/{clientId}/{tourId}/panoramas/` (e.g.
   `s_dtv27wfrbi.jpg`).
2. Convert in place with the project script (writes `{name}.webp` next to the
   JPG):

   ```bash
   node scripts/convert-jpg-to-webp.mjs gphospitalfoundation/t_l01wnq8eh6/panoramas/s_dtv27wfrbi.jpg
   ```

   Multiple files in one run:

   ```bash
   node scripts/convert-jpg-to-webp.mjs \
     gphospitalfoundation/t_l01wnq8eh6/panoramas/s_dtv27wfrbi.jpg \
     gphospitalfoundation/t_l01wnq8eh6/panoramas/s_h310pim38b.jpg
   ```

3. Point the scene `panorama` (and any popup `image` under `panoramas/`) at the
   `.webp` file in `tours/{tourId}.json`.
4. Delete the source `.jpg` from `panoramas/` — do not commit JPG panoramas to
   the repo.
5. Run `npm run sync-assets` (or `npm run dev` / `npm run build`, which sync
   automatically).

Optional: normalize existing WebPs (max width + quality) with
`node scripts/recompress-panorama-webp.mjs <client>/<tour>/panoramas` then
`npm run sync-assets`. Lower `WEBP_QUALITY` only when deliberately trading
quality for size.

## Scene thumbnails (defaultView)

Explore location gallery/list cards use baked `scene.thumbnail` when set. Intro
gallery and catalog cards use the same hook. Generate from each scene's
`defaultView`:

```bash
npm run generate-thumbnails
```

Options:

```bash
node scripts/generate-scene-thumbnails.mjs --tour t_l01wnq8eh6
node scripts/generate-scene-thumbnails.mjs --dry-run
THUMBNAIL_WIDTH=640 THUMBNAIL_QUALITY=85 npm run generate-thumbnails
```

Writes `assets/{clientId}/{tourId}/scene-thumbs/{sceneId}.webp`. Tour JSON omits
the conventional path. Re-run after changing `defaultView` or swapping a
panorama.

## Naming opportunity previews (hotspot view)

Explore naming gallery/list cards use baked `hotspot.preview.image` when set
(same field model3d Dev captures write). Generate from each naming pin’s
`position` (yaw/pitch/zoom):

```bash
npm run generate-naming-thumbnails
```

Or bake scenes + naming together:

```bash
npm run generate-thumbnails
```

Options:

```bash
node scripts/generate-naming-thumbnails.mjs --tour t_l01wnq8eh6
node scripts/generate-naming-thumbnails.mjs --dry-run
THUMBNAIL_WIDTH=640 THUMBNAIL_QUALITY=85 npm run generate-naming-thumbnails
```

Writes `assets/{clientId}/{tourId}/hotspot-thumbs/{hotspotId}.webp` (`h_*` pin
id). Tour JSON omits the conventional path. Panorama Dev create/move of a naming
pin rebakes automatically. model3d tours still use canvas capture uploads
(script skips them). Without a baked file, Explore falls back to a small runtime
crop.

## Adding a new tour

1. Create `assets/{clientId}/{tourId}/panoramas/` and `…/brand/`
2. Add panorama JPGs, **convert each to WebP** named `{sceneId}.webp` (see
   above)
3. Add `tours/{tourId}.json` (omit conventional panorama/thumb/preview paths)
4. Register in `src/data/loadTour.ts` and `tours/catalog.json`
5. Run `npm run sync-assets`

### Path examples (Ken Sargent House)

| File type     | Location                                                               | JSON                                 |
| ------------- | ---------------------------------------------------------------------- | ------------------------------------ |
| Panorama      | `gphospitalfoundation/t_l01wnq8eh6/panoramas/s_dtv27wfrbi.webp`        | omit (inferred from `s_dtv27wfrbi`)  |
| Scene thumb   | `gphospitalfoundation/t_l01wnq8eh6/scene-thumbs/s_dtv27wfrbi.webp`     | omit                                 |
| Hotspot thumb | `gphospitalfoundation/t_l01wnq8eh6/hotspot-thumbs/h_elw8cjn2sv.webp`   | omit                                 |
| Donor logo    | `gphospitalfoundation/t_l01wnq8eh6/naming/h_elw8cjn2sv/donor-logo.png` | `"logo": true`                       |
| Tour logo     | `gphospitalfoundation/t_l01wnq8eh6/brand/logo.png`                     | explicit (branding, not scene-keyed) |
| Favicon       | `gphospitalfoundation/t_l01wnq8eh6/favicon.ico`                        | auto                                 |

Use `tourAssetPath()` in `src/utils/tourAssetPath.ts` when building paths in
code.
