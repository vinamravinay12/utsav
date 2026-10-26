import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // React DOM alone is ~190 kB minified; the dashboard is a separate lazy chunk.
    chunkSizeWarningLimit: 300,
  },
  server: {
    // The API key lives on the server. The browser only ever talks to /api.
    proxy: { '/api': 'http://localhost:8099' },
  },
});
