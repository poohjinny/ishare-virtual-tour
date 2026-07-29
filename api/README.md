# Ask Guide API (Azure Functions — optional)

Prefer **Cloudflare Worker** for early live on GitHub Pages:
[`workers/ask-guide/README.md`](../workers/ask-guide/README.md).

This folder keeps an Azure Functions v4 implementation with the **same** route
contract if infra prefers Azure.

## Local

```bash
cd api
cp local.settings.json.example local.settings.json
# set OPENAI_API_KEY in local.settings.json
npm install
func start
```

Endpoints:

- `GET  http://localhost:7071/api/tour/chat/status`
- `POST http://localhost:7071/api/tour/chat`

Point the Vite app at the local API with:

```bash
# repo root `.env.local` (client only — never put the OpenAI key here as VITE_*)
VITE_ASK_GUIDE_API_URL=http://localhost:7071/api
```

When `VITE_ASK_GUIDE_API_URL` is unset in DEV, the app still uses
`/__dev/api/ask-guide/*` (Vite plugin).

## Deploy

1. Create a Function App (Node 20, Linux).
2. Deploy the `api/` folder (`func azure functionapp publish <name>` or CI).
3. App settings:
   - `OPENAI_API_KEY` (required)
   - `OPENAI_ASK_GUIDE_MODEL` (optional, default `gpt-4o-mini`)
   - `ASK_GUIDE_CORS_ORIGINS` (optional extras; `https://tour.ishare.ca` is
     built-in)
   - `ASK_GUIDE_RATE_LIMIT_PER_MIN` (optional, default `30`)
4. Set production client env:
   - `VITE_ASK_GUIDE_API_URL=https://<function-app>.azurewebsites.net/api`

Smoke: `https://tour.ishare.ca/{tourId}?askGuide=1` with a live key configured.
