/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public tour API base URL — unset uses bundled JSON (Phase 1 default). */
  readonly VITE_TOUR_API_URL?: string;
  readonly VITE_TOUR_PUBLIC_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
