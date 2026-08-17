# iShare Virtual Tour Admin

Next.js CMS for editing tour drafts, previewing them in the Vite viewer, and
publishing approved snapshots.

## Development

From the repository root:

```bash
npm run dev:admin
```

Open [http://localhost:5174](http://localhost:5174) — `/` redirects to
`/overview`. Tours live at `/tours`.

The tab icon is the platform favicon (`apps/tour-viewer/assets/favicon.ico`),
synced into `src/app/favicon.ico` by `npm run sync-favicon` (also runs before
`dev` / `build`).

The tour detail preview uses `NEXT_PUBLIC_TOUR_VIEWER_URL` (defaults to
`http://localhost:5173`). See `.env.local.example`.

From the root:

```bash
npm run dev          # viewer + admin
npm run dev:viewer   # Vite viewer only :5173
npm run dev:admin    # this app only :5174
```

Build only the admin:

```bash
npm run build:admin
```

UI rules, MVP routes, and customization policy:
[`docs/engineering/ADMIN_UI.md`](../../docs/engineering/ADMIN_UI.md).

The first production slice is authentication plus DB-backed
`draft_json`/`published_json`; see
[`docs/product/TOUR_DB.md`](../../docs/product/TOUR_DB.md).
