import { defineConfig } from 'vite';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import solidPlugin from 'vite-plugin-solid';
import { string } from 'rollup-plugin-string';

export default defineConfig({
  // NOTE: the `server` part only applies to running the development server
  server: {
    port: 3000,
    // see https://vitejs.dev/config/server-options.html#server-proxy
    proxy: {
      '/api': {
        // target: 'https://pyalgoviz-backend-kfy32uqpsa-uc.a.run.app',
        target: 'http://localhost:5000',
        changeOrigin: true,
        // rewrite: path => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      mangle: {
        // keep the functions used for drawing. these are needed by the python
        // script that creates the JavaScript script
        reserved: ['drawText', 'drawLine', 'drawRect', 'drawCircle', 'drawArc'],
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
