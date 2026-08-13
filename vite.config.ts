import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error Dev-only Vite plugin (plain .mjs)
import { viteDevTourApiPlugin } from './scripts/dev/viteDevTourApiPlugin.mjs';

/** https://poohjinny.github.io/ishare-virtual-tour/ — legacy demo subpath only */
const GITHUB_PAGES_BASE = '/ishare-virtual-tour/';

/** Shared vendor chunks — keep `three` in one place (PSV + ThreeDViewer). */
function vendorChunk(id: string): string | undefined {
  const normalized = id.replace(/\\/g, '/');
  if (!normalized.includes('/node_modules/')) return undefined;
  if (normalized.includes('/@photo-sphere-viewer/')) return 'psv';
  if (normalized.includes('/three/')) return 'three';
  if (
    normalized.includes('/react-dom/') ||
    normalized.includes('/react-router/') ||
    normalized.includes('/react-router-dom/') ||
    normalized.includes('/node_modules/react/')
  ) {
    return 'react-vendor';
  }
  return undefined;
}

export default defineConfig(({ mode, command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    command === 'serve' ? viteDevTourApiPlugin() : null,
  ].filter(Boolean),
  /** Production (`npm run build`) → `/` for tour.ishare.ca. `ghpages` → GitHub project demo. */
  base: mode === 'ghpages' ? GITHUB_PAGES_BASE : '/',
  // PSV + viewer-3d both import three; one copy avoids "Multiple instances" warnings.
  resolve: { dedupe: ['three'] },
  optimizeDeps: { include: ['three'] },
  build: { rollupOptions: { output: { manualChunks: vendorChunk } } },
}));
