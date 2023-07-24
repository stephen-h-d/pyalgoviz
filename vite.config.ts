import { defineConfig } from 'vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import solidPlugin from 'vite-plugin-solid';
import {string} from 'rollup-plugin-string';

export default defineConfig({
  server: {
    port: 3000,
    // see https://vitejs.dev/config/server-options.html#server-proxy
    proxy: {
      '/api': {
        target: 'https://pyalgoviz-backend-kfy32uqpsa-uc.a.run.app',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
  },
  plugins: [vanillaExtractPlugin(), solidPlugin(), string({
    include: '**/executor.py', // TODO figure out if I can point to exactly the right file
  })],
});
