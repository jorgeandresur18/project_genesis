/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * El editor de diálogos en vivo (pedido del autor, 2026-11-06; solo en `npm run dev`): el juego lee y guarda lo que el
 * autor corrige mientras juega en `docs/guion/ediciones_en_vivo.json` ({ escena: { original, texto, fecha } }).
 * Claude lo lee, corrige la redacción y lo aplica al JSON de la historia (con el inglés) cuando el autor lo pide.
 * El complemento va dentro de `plugins` (así Vite le da los tipos; el lint lee este archivo como JavaScript).
 */
const EDICIONES = path.resolve(__dirname, 'docs/guion/ediciones_en_vivo.json');
const leerEdiciones = () => {
  try {
    return JSON.parse(fs.readFileSync(EDICIONES, 'utf8'));
  } catch {
    return {};
  }
};
/** Las líneas que escribió el autor y corrigió Claude, ya en la historia (la marca ✓; `docs/guion/revisadas.json`). */
const REVISADAS = path.resolve(__dirname, 'docs/guion/revisadas.json');
const leerRevisadas = () => {
  try {
    return JSON.parse(fs.readFileSync(REVISADAS, 'utf8'));
  } catch {
    return {};
  }
};

export default defineConfig({
  // Rutas relativas: el juego funciona en Vercel, GitHub Pages o itch.io sin cambiar nada.
  base: './',
  plugins: [
    react(),
    {
      name: 'ediciones-en-vivo',
      apply: 'serve',
      configureServer(server) {
        // El avance de la revisión de diálogos, al día en cada visita (tools/avance_dialogos.mjs).
        server.middlewares.use('/__avance', async (req, res) => {
          const archivo = pathToFileURL(path.resolve(__dirname, 'tools/avance_dialogos.mjs')).href + '?t=' + Date.now();
          const { generarAvance } = await import(archivo);
          const cap = new URL(req.url ?? '/', 'http://x').searchParams.get('cap') ?? 'cap01';
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.end(generarAvance(__dirname, cap));
        });
        // La marca ✓: GET la lista; POST { escena, poner } la pone (aprobada por el autor) o la quita.
        server.middlewares.use('/__revisadas', (req, res) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          if (req.method === 'GET') return res.end(JSON.stringify(leerRevisadas()));
          let cuerpo = '';
          req.on('data', (c) => (cuerpo += c));
          req.on('end', () => {
            try {
              const { escena, poner } = JSON.parse(cuerpo);
              const todo = leerRevisadas();
              if (poner) todo[escena] = { fecha: new Date().toISOString().slice(0, 10), origen: 'aprobada' };
              else delete todo[escena];
              fs.writeFileSync(REVISADAS, JSON.stringify(todo, null, 2) + String.fromCharCode(10), 'utf8');
              res.end(JSON.stringify(todo));
            } catch {
              res.statusCode = 400;
              res.end('{}');
            }
          });
        });
        server.middlewares.use('/__ediciones', (req, res) => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          if (req.method === 'GET') return res.end(JSON.stringify(leerEdiciones()));
          if (req.method !== 'POST') {
            res.statusCode = 405;
            return res.end('{}');
          }
          let cuerpo = '';
          req.on('data', (c) => (cuerpo += c));
          req.on('end', () => {
            try {
              const { escena, texto, original } = JSON.parse(cuerpo);
              const todo = leerEdiciones();
              if (texto === null) delete todo[escena];
              else todo[escena] = { original, texto, fecha: new Date().toISOString() };
              fs.writeFileSync(EDICIONES, JSON.stringify(todo, null, 2) + String.fromCharCode(10), 'utf8');
              res.end(JSON.stringify(todo));
            } catch {
              res.statusCode = 400;
              res.end('{}');
            }
          });
        });
      },
    },
  ],
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
