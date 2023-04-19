import { defineConfig } from 'vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  server: {
    port: 3000,
    // see https://vitejs.dev/config/server-options.html#server-proxy
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
  },
  plugins: [vanillaExtractPlugin(), solidPlugin()],
});
