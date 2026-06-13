# Assets

Source-of-truth for tour media, organised **per client**. Synced to
`public/assets/` via `npm run sync-assets` (runs before `dev` and `build`).

## Structure

```
assets/
    ├── favicon.ico              # Platform default → synced to public/favicon.ico
    ├── brand/
│   ├── logo_ishare.png      # iShare product logo (platform-wide)
│   ├── symbol_ishare.png    # iShare symbol mark
│   └── tour-guide.png       # iShare Guide avatar (platform-wide)
└── {clientId}/              # id = website hostname without TLD
    ├── favicon.ico          # Client tab icon → /assets/{clientId}/favicon.ico
    ├── panoramas/           # 360° equirectangular images
    │   ├── overview.jpg
    │   ├── main-entrance.jpg   # gphospitalfoundation
    │   ├── reception.jpg           # cancerresearchsociety, gphospitalfoundation
    └── brand/
        └── logo.png
```

### Current clients

| id                      | website                           | assets folder                   |
| ----------------------- | --------------------------------- | ------------------------------- |
| `gphospitalfoundation`  | https://gphospitalfoundation.ca/  | `assets/gphospitalfoundation/`  |
| `cancerresearchsociety` | https://cancerresearchsociety.ca/ | `assets/cancerresearchsociety/` |

## Client id convention

The `id` matches the tour JSON `id` field and the `?tour=` URL parameter.

Derive from the client website URL — hostname without `www` and without TLD:

| URL                                 | id                      |
| ----------------------------------- | ----------------------- |
| `https://gphospitalfoundation.ca/`  | `gphospitalfoundation`  |
| `https://cancerresearchsociety.ca/` | `cancerresearchsociety` |
| `https://www.example.com/`          | `example`               |

Use `clientIdFromUrl()` in `src/utils/clientId.ts` when adding new clients.

## Adding a new client

1. Create `assets/{clientId}/panoramas/` and `assets/{clientId}/brand/`
2. Add `tours/{clientId}.json` and `tours/{clientId}-knowledge.json`
3. Register in `src/data/loadTour.ts`
4. Run `npm run sync-assets`

### Path examples

| File type | Location                                      | JSON reference                                        |
| --------- | --------------------------------------------- | ----------------------------------------------------- |
| Panorama  | `gphospitalfoundation/panoramas/overview.jpg` | `/assets/gphospitalfoundation/panoramas/overview.jpg` |
| Logo      | `gphospitalfoundation/brand/logo.png`         | `/assets/gphospitalfoundation/brand/logo.png`         |
| Favicon   | `gphospitalfoundation/favicon.ico`            | `/assets/gphospitalfoundation/favicon.ico` (auto)     |
