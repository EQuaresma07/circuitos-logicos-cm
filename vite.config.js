import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path matches the GitHub Pages URL: https://EQuaresma07.github.io/circuitos-logicos-cm/
export default defineConfig({
  plugins: [react()],
  base: '/circuitos-logicos-cm/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
});
