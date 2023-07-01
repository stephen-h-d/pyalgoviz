import { defineConfig } from 'vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import solidPlugin from 'vite-plugin-solid';
import { string } from 'rollup-plugin-string';
import { resolve } from 'path';

export default defineConfig({
  base: '/pyalgoviz',
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
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        public: resolve(__dirname, 'public/edit3.html'),
      },
    },
  },
  plugins: [
    vanillaExtractPlugin(),
    solidPlugin(),
    string({
      include: '**/executor.py', // TODO figure out if I can point to exactly the right file
    }),
  ],
});
