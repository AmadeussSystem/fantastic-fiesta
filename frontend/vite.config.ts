import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import UnoCSS from 'unocss/vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    UnoCSS(),
    solidPlugin(),
    nodePolyfills({
      // Enable polyfills for Buffer (required by gray-matter)
      globals: {
        Buffer: true,
      },
    }),
  ],
  base: '/fantastic-fiesta/',
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
