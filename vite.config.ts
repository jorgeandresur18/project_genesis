/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Rutas relativas: el juego funciona en Vercel, GitHub Pages o itch.io sin cambiar nada.
  base: './',
  plugins: [react()],
  server: {
    // docs/ tiene el material del autor (PSB, imágenes, HTML de prueba): no es código del juego. Si se vigila,
    // un archivo grande que se está guardando (EBUSY en Windows) tumba el servidor.
    watch: { ignored: ['**/docs/**', '**/*.psb', '**/*.psd'] },
  },
  // Vitest: las pruebas de siempre. Las de navegador (tests/e2e, con Playwright) se corren aparte con `npm run e2e`.
  test: { exclude: ['**/node_modules/**', 'tests/e2e/**'] },
  build: {
    rollupOptions: {
      output: {
        // En archivos aparte, para que se descarguen en paralelo y el navegador los guarde por separado: si solo
        // cambia el código, la historia (lo más pesado) no se vuelve a bajar, y al revés.
        manualChunks(id) {
          // Phaser (el motor del nivel de acción) va aparte: se descarga recién al llegar al nivel.
          if (id.includes('node_modules/phaser')) return 'phaser';
          if (id.includes('node_modules')) return 'librerias';
          if (id.includes('/src/data/chapters/') || id.includes('/src/data/en/chapters/')) return 'historia';
        },
      },
    },
    // La historia es texto y pesa (cada capítulo ronda los 900 kB): el aviso de tamaño es para el código.
    chunkSizeWarningLimit: 1600,
  },
});
