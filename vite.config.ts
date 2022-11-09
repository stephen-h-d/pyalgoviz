import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    // see https://vitejs.dev/config/server-options.html#server-proxy
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
    }
  },
  build: {
    target: 'esnext',
  },
});
