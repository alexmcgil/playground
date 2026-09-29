import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'client',
  plugins: [react()],
  server: {
    port: 4310,
    strictPort: true,
    proxy: {
      '^/api/': { target: 'http://127.0.0.1:4311' },
      // LAB: .invalid is reserved; this request fails at the proxy's DNS lookup.
      '/dns-api': {
        target: 'http://playground.invalid:4311',
        rewrite: (path) => path.replace(/^\/dns-api/, '/api'),
      },
      // LAB: the API is reachable, but the rewritten route does not exist.
      '/wrong-api': {
        target: 'http://127.0.0.1:4311',
        rewrite: (path) => path.replace(/^\/wrong-api/, '/api/missing'),
      },
    },
  },
  build: { outDir: '../dist/client', emptyOutDir: true, sourcemap: true },
});
