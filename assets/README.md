# Assets

Source-of-truth for tour media, organised **per client and tour**. Synced to
`public/assets/` via `npm run sync-assets` (runs before `dev` and `build`).

## Structure

```
assets/
├── favicon.ico              # Platform default → synced to public/favicon.ico
├── brand/                   # Platform-wide (iShare product, immersive playlist, …)
└── {clientId}/              # id = website hostname without TLD
    └── {tourId}/            # matches tour JSON `id` (e.g. ken-sargent-house)
        ├── favicon.ico      # Tour tab icon → auto via resolveClientFavicon()
        ├── panoramas/       # 360° equirectangular images (WebP in repo — see below)
        ├── thumbnails/      # Baked scene previews at defaultView (see below)
        ├── maps/            # Floor plans (optional)
        ├── brand/
        │   ├── logo.png
        │   └── tour-guide.png   # Optional AI guide avatar override
        └── audio/           # Optional tour-specific audio
```

### Current clients & tours

| clientId                | tourId              | website                           | assets folder                                    |
| ----------------------- | ------------------- | --------------------------------- | ------------------------------------------------ |
| `gphospitalfoundation`  | `ken-sargent-house` | https://gphospitalfoundation.ca/  | `assets/gphospitalfoundation/ken-sargent-house/` |
| `cancerresearchsociety` | `cancer-research`   | https://cancerresearchsociety.ca/ | `assets/cancerresearchsociety/cancer-research/`  |
| `holodomor`             | `holodomor-museum`  | https://holodomor.ca/             | `assets/holodomor/holodomor-museum/`             |
| `qchfoundation`         | `qch-hospital`      | https://qchfoundation.ca/         | `assets/qchfoundation/qch-hospital/`             |

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

1. Place the source JPG under `assets/{clientId}/{tourId}/panoramas/` (e.g.
   `overview.jpg`).
2. Convert in place with the project script (writes `{name}.webp` next to the
   JPG):

   ```bash
   node scripts/convert-jpg-to-webp.mjs gphospitalfoundation/ken-sargent-house/panoramas/overview.jpg
   ```

   Multiple files in one run:

   ```bash
   node scripts/convert-jpg-to-webp.mjs \
     gphospitalfoundation/ken-sargent-house/panoramas/overview.jpg \
     gphospitalfoundation/ken-sargent-house/panoramas/reception.jpg
   ```

   Optional quality (default `82`):
   `WEBP_QUALITY=85 node scripts/convert-jpg-to-webp.mjs …`

3. Point the scene `panorama` (and any popup `image` under `panoramas/`) at the
   `.webp` file in `tours/{tourId}.json`.
4. Delete the source `.jpg` from `panoramas/` — do not commit JPG panoramas to
   the repo.
5. Run `npm run sync-assets` (or `npm run dev` / `npm run build`, which sync
   automatically).

Target size after conversion: roughly **800 KB–1.2 MB** per scene at acceptable
quality. Re-export or lower `WEBP_QUALITY` if a WebP is still too large.

## Scene thumbnails (defaultView)

Explore location gallery/list cards use baked `scene.thumbnail` when set. Intro
gallery and catalog cards use the same hook. Generate from each scene's
`defaultView`:

```bash
npm run generate-thumbnails
```

Options:

```bash
node scripts/generate-scene-thumbnails.mjs --tour ken-sargent-house
node scripts/generate-scene-thumbnails.mjs --dry-run
THUMBNAIL_WIDTH=640 THUMBNAIL_QUALITY=85 npm run generate-thumbnails
```

Writes `assets/{clientId}/{tourId}/thumbnails/{sceneId}.webp` and updates
`tours/{tourId}.json` with `scene.thumbnail` paths. Re-run after changing
`defaultView` or swapping a panorama. Naming-opportunity gallery cards fall back
to a small runtime rectilinear crop at the hotspot view when no dedicated NO
thumbnail exists.

## Adding a new tour

1. Create `assets/{clientId}/{tourId}/panoramas/` and `…/brand/`
2. Add panorama JPGs, **convert each to WebP** (see above), reference `.webp` in
   JSON
3. Add `tours/{tourId}.json` and `tours/{tourId}-knowledge.json`
4. Register in `src/data/loadTour.ts` and `tours/catalog.json`
5. Run `npm run sync-assets`

### Path examples (Ken Sargent House)

| File type | Location                                                         | JSON reference                                                           |
| --------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Panorama  | `gphospitalfoundation/ken-sargent-house/panoramas/overview.webp` | `/assets/gphospitalfoundation/ken-sargent-house/panoramas/overview.webp` |
| Logo      | `gphospitalfoundation/ken-sargent-house/brand/logo.png`          | `/assets/gphospitalfoundation/ken-sargent-house/brand/logo.png`          |
| Favicon   | `gphospitalfoundation/ken-sargent-house/favicon.ico`             | `/assets/gphospitalfoundation/ken-sargent-house/favicon.ico` (auto)      |
| Guide     | `gphospitalfoundation/ken-sargent-house/brand/tour-guide.png`    | auto via `resolveGuideAvatarUrl()`                                       |

Use `tourAssetPath()` in `src/utils/tourAssetPath.ts` when building paths in
code.
