// La torre del Capítulo 3, recorrida en el navegador: cada camino de punta a punta (las peleas se dan por ganadas o
// perdidas desde el estado del juego, sin jugarlas; el balance de cada una lo mira tests/balance.test.ts). Comprueba
// que las escenas se dibujan sin errores, que lo del cofre llega a la mochila y que cada derrota lleva a su final.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const cap03 = JSON.parse(readFileSync('src/data/chapters/cap03.json', 'utf8'));

/** Lo que las pruebas usan del juego (src/engine/store.ts lo deja en window.__genesis solo en desarrollo). */
type Juego = {
  game?: { sceneId: string; finished?: string | null; vars: Record<string, unknown> };
  error: string | null;
  newGame: (inicio: string) => void;
  choose: (n: number) => void;
  advance: () => void;
  solveMinigame: () => void;
  loseLevel: () => void;
};
type W = { __genesis: { getState: () => Juego } };
type Escena = { scene_id: string; batalla?: string; batalla_derrota?: string; choices: { text: string; next: string }[] };
const ESCENAS = new Map((cap03.scenes as unknown as Escena[]).map((s) => [s.scene_id, s]));

/** Abre el juego, acepta la advertencia y empieza una partida en `inicio`. Devuelve la lista de errores. */
async function empezar(page: Page, inicio: string) {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  page.on('console', (m) => {
    // Los cuadros grises de arte (PLACEHOLDER) y los audios que faltan no son errores del juego.
    if (m.type() === 'error' && !/Failed to load resource|404/.test(m.text())) errores.push(m.text());
  });
  await page.goto('/');
  const aceptar = page.getByRole('button', { name: /mayor de edad/i });
  if (await aceptar.isVisible({ timeout: 8_000 }).catch(() => false)) await aceptar.click();
  await page.waitForFunction(() => !!(window as unknown as { __genesis?: unknown }).__genesis);
  await page.evaluate((s) => (window as unknown as W).__genesis.getState().newGame(s), inicio);
  return errores;
}

const estado = (page: Page) =>
  page.evaluate(() => {
    const g = (window as unknown as W).__genesis.getState();
    return { escena: g.game?.sceneId as string, fin: (g.game?.finished ?? null) as string | null, vars: g.game?.vars as Record<string, unknown>, error: g.error as string | null };
  });

/**
 * Recorre la historia: en cada decisión elige la opción cuyo texto coincide con alguna de `elecciones`; las peleas se
 * ganan, salvo la que esté en `pierde`. Termina en un final o un fin de capítulo.
 */
async function recorrer(page: Page, elecciones: RegExp[], pierde?: string) {
  const vistas: string[] = [];
  for (let i = 0; i < 2000; i++) {
    const e = await estado(page);
    expect(e.error, `error del juego en ${e.escena}`).toBeNull();
    if (e.fin) return { ...e, vistas };
    vistas.push(e.escena);
    const s = ESCENAS.get(e.escena);
    expect(s, `escena fuera del Capítulo 3: ${e.escena}`).toBeTruthy();
    if (s!.choices.length) {
      const i2 = s!.choices.findIndex((c) => elecciones.some((r) => r.test(c.text)));
      expect(i2, `no sé qué elegir en ${e.escena}: ${s!.choices.map((c) => c.text).join(' | ')}`).toBeGreaterThanOrEqual(0);
      await page.evaluate((n) => (window as unknown as W).__genesis.getState().choose(n), i2);
    } else if (s!.batalla) {
      const accion = s!.batalla === pierde ? 'loseLevel' : 'solveMinigame';
      await page.evaluate((a) => (window as unknown as W).__genesis.getState()[a as 'loseLevel' | 'solveMinigame'](), accion);
    } else {
      await page.evaluate(() => (window as unknown as W).__genesis.getState().advance());
    }
    // Un respiro para que la escena se dibuje (así salen los errores de dibujo, si los hay).
    await page.waitForTimeout(5);
  }
  throw new Error('la historia no terminó');
}

const CAMINO_A = [/forzar|cerradura/i, /cloacas/i, /comedor/i, /agua sin gas/i, /celdas/i, /Elixit \(2\)/, /salón/i, /Elixit\+\+/, /directo por la espada/i, /con las dos/i];
const CAMINO_B = [/cerradura/i, /bodegas/i, /forja/i, /Furia Roja/i, /patio/i, /monedas/i, /galería/i, /Caramelo dulce/i, /directo por la espada/i, /con las dos/i];

test.describe('la torre del Capítulo 3', () => {
  test('camino A (cloacas, comedor, celdas, salón) hasta el final del capítulo, con los cofres', async ({ page }) => {
    const errores = await empezar(page, 'cap03_calabozo_01');
    const r = await recorrer(page, CAMINO_A);
    expect(r.fin).toBe('capitulo:3');
    for (const p of ['cap03_cloacas_01', 'cap03_comedor_01', 'cap03_celdas_01', 'cap03_salon_01', 'cap03_rey_01', 'cap03_despertar_07'].filter((x) => ESCENAS.has(x)))
      expect(r.vistas).toContain(p);
    // Lo del cofre llega a la mochila (y sigue ahí: ganar las peleas siguientes no lo borra).
    expect(Number(r.vars.mochila_vida)).toBeGreaterThanOrEqual(3);
    expect(Number(r.vars.mochila_revivir)).toBeGreaterThanOrEqual(2);
    expect(Number(r.vars.mochila_revivir_plus)).toBeGreaterThanOrEqual(1);
    expect(errores).toEqual([]);
  });

  test('camino B (bodegas, forja, patio, galería) hasta el final del capítulo, con los cofres', async ({ page }) => {
    const errores = await empezar(page, 'cap03_calabozo_01');
    const r = await recorrer(page, CAMINO_B);
    expect(r.fin).toBe('capitulo:3');
    for (const p of ['cap03_bodegas_01', 'cap03_forja_01', 'cap03_patio_01', 'cap03_galeria_01'])
      expect(r.vistas).toContain(p);
    expect(Number(r.vars.mochila_atq)).toBeGreaterThanOrEqual(2);
    expect(Number(r.vars.monedas)).toBeGreaterThanOrEqual(200);
    expect(Number(r.vars.mochila_caramelo_dulce)).toBeGreaterThanOrEqual(1);
    expect(errores).toEqual([]);
  });

  // Cada pelea perdida lleva a su final malo.
  const DERROTAS: [string, RegExp[], string][] = [
    ['cap03_cloacas_2', CAMINO_A, 'bad_cap03_subsuelo'],
    ['cap03_forja_1', CAMINO_B, 'bad_cap03_piso2'],
    ['cap03_patio_2', CAMINO_B, 'bad_cap03_prision'],
    ['cap03_galeria_1', CAMINO_B, 'bad_cap03_guardia'],
    ['cap03_rey', CAMINO_A, 'bad_cap03_rey'],
  ];
  for (const [pelea, camino, final] of DERROTAS)
    test(`perder ${pelea} lleva a ${final}`, async ({ page }) => {
      const errores = await empezar(page, 'cap03_calabozo_01');
      const r = await recorrer(page, camino, pelea);
      expect(r.fin).toBe(final);
      expect(errores).toEqual([]);
    });

  test('las salidas malas: el montacargas, el hacha dorada y cruzar solo', async ({ page }) => {
    await empezar(page, 'cap03_calabozo_01');
    expect((await recorrer(page, [/cerradura/i, /montacargas/i])).fin).toBe('bad_cap03_montacargas');
    await page.evaluate(() => (window as unknown as W).__genesis.getState().newGame('cap03_arsenal_01'));
    expect((await recorrer(page, [/hacha dorada/i])).fin).toBe('bad_cap03_trofeo');
    await page.evaluate(() => (window as unknown as W).__genesis.getState().newGame('cap03_vacio_01'));
    expect((await recorrer(page, [/solo/i])).fin).toBe('alt_1');
  });
});
