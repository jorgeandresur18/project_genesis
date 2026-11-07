// La torre del Capítulo 3, recorrida en el navegador: cada camino de punta a punta (las peleas se dan por ganadas o
// perdidas desde el estado del juego, sin jugarlas; el balance de cada una lo mira tests/balance.test.ts). Comprueba
// que las escenas se dibujan sin errores, que lo del cofre llega a la mochila y que cada derrota lleva a su final.
import { expect, test, type Page } from '@playwright/test';
import { empezar, escenasDe, nuevaPartida, porTexto, recorrer as recorrerHistoria } from './historia';

const ESCENAS = escenasDe('cap03');
/** Recorre la torre eligiendo por texto; las peleas se ganan, salvo `pierde`. */
const recorrer = (page: Page, elecciones: RegExp[], pierde?: string) => recorrerHistoria(page, ESCENAS, porTexto(elecciones), pierde);

const CAMINO_A = [/forzar|cerradura/i, /cloacas/i, /comedor/i, /agua sin gas/i, /celdas/i, /Elixit \(2\)/, /salón/i, /Elixit\+\+/, /directo por la espada/i, /con las dos/i];
const CAMINO_B = [/cerradura/i, /bodegas/i, /forja/i, /Furia Roja/i, /patio/i, /monedas|tokens/i, /galería/i, /Caramelo dulce/i, /directo por la espada/i, /con las dos/i];

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
    await nuevaPartida(page, 'cap03_arsenal_01');
    expect((await recorrer(page, [/hacha dorada/i])).fin).toBe('bad_cap03_trofeo');
    await nuevaPartida(page, 'cap03_vacio_01');
    expect((await recorrer(page, [/solo/i])).fin).toBe('alt_1');
  });
});
