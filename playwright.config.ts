// Pruebas en un navegador de verdad, sin ventana (Playwright; docs/QA.md). Levantan el juego con Vite en el puerto 5199
// y lo juegan como una persona: abren peleas, eligen comandos y miran que nada se trabe ni aparezcan errores.
// `npm run e2e` (todas) o `npx playwright test tests/e2e/cebos.spec.ts` (una). Con ventana, para mirar: `--headed`.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  // Una a la vez: cada pelea pide su tiempo y en paralelo se pisan los sonidos y las animaciones.
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5199/',
    headless: true,
    // El juego espera un clic antes de sonar; sin audio el navegador automático no necesita permisos.
    launchOptions: { args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] },
    // En español: los nombres de los ataques y los avisos que buscan las pruebas están en español.
    locale: 'es-EC',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'computadora', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } }],
  webServer: { command: 'npx vite --port 5199 --strictPort', url: 'http://localhost:5199/', reuseExistingServer: true, timeout: 60_000 },
});
