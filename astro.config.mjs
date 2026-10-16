import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://coastal-concept.example',
  trailingSlash: 'ignore',
  build: { inlineStylesheets: 'auto' },
  devToolbar: { enabled: false },
  vite: { build: { chunkSizeWarningLimit: 900 } },
});
