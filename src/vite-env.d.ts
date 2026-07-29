/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public tour API base URL — unset uses bundled JSON (Phase 1 default). */
  readonly VITE_TOUR_API_URL?: string;
  readonly VITE_TOUR_PUBLIC_ORIGIN?: string;
  /**
   * Ask Guide chat API base ending in `/api` (Cloudflare Worker or Azure).
   * Unset in DEV → Vite `/__dev/api/ask-guide/*`.
   * Unset in production → same-origin `/api` (SWA only).
   */
  readonly VITE_ASK_GUIDE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
