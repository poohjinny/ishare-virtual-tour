import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error Dev-only Vite plugin (plain .mjs)
import { viteDevTourApiPlugin } from './scripts/dev/viteDevTourApiPlugin.mjs';

/** https://poohjinny.github.io/ishare-virtual-tour/ */
const GITHUB_PAGES_BASE = '/ishare-virtual-tour/';

export default defineConfig(({ mode, command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    command === 'serve' ? viteDevTourApiPlugin() : null,
  ].filter(Boolean),
  base: mode === 'ghpages' ? GITHUB_PAGES_BASE : '/',
}));
