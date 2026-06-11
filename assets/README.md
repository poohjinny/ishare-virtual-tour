# Assets

Source-of-truth for tour media, organised **per client**. Synced to
`public/assets/` via `npm run sync-assets` (runs before `dev` and `build`).

## Structure

```
assets/
├── favicon.ico              # Site favicon → synced to public/favicon.ico
├── brand/
│   └── logo_ishare.png      # iShare product logo (platform-wide)
└── {clientId}/              # id = website hostname without TLD
    ├── panoramas/           # 360° equirectangular images
    │   ├── overview.jpg
    │   ├── main-entrance.jpg
    │   └── reception.jpg
    └── brand/
        └── logo_ken-sargent-house.png
```

### Current clients

| id                | website                     | assets folder             |
| ----------------- | --------------------------- | ------------------------- |
| `kensargenthouse` | https://kensargenthouse.ca/ | `assets/kensargenthouse/` |

## Client id convention

The `id` matches the tour JSON `id` field and the `?tour=` URL parameter.

Derive from the client website URL — hostname without `www` and without TLD:

| URL                           | id                |
| ----------------------------- | ----------------- |
| `https://kensargenthouse.ca/` | `kensargenthouse` |
| `https://www.example.com/`    | `example`         |

Use `clientIdFromUrl()` in `src/utils/clientId.ts` when adding new clients.

## Adding a new client

1. Create `assets/{clientId}/panoramas/` and `assets/{clientId}/brand/`
2. Add `tours/{clientId}.json` and `tours/{clientId}-knowledge.json`
3. Register in `src/data/loadTour.ts`
4. Run `npm run sync-assets`

### Path examples

| File type | Location                                 | JSON reference                                   |
| --------- | ---------------------------------------- | ------------------------------------------------ |
| Panorama  | `kensargenthouse/panoramas/overview.jpg` | `/assets/kensargenthouse/panoramas/overview.jpg` |
| Logo      | `kensargenthouse/brand/logo.png`         | `/assets/kensargenthouse/brand/logo.png`         |
