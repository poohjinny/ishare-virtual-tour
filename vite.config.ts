import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** https://poohjinny.github.io/ishare-virtual-tour/ */
const GITHUB_PAGES_BASE = '/ishare-virtual-tour/';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  base: mode === 'ghpages' ? GITHUB_PAGES_BASE : '/',
}));
