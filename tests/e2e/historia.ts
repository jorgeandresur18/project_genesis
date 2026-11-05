// Ayudantes para recorrer la historia en el navegador sin jugar cada pelea: mueven el estado del juego (avanzar, elegir,
// ganar o perder una pelea o un minijuego), que src/engine/store.ts deja en window.__genesis solo en desarrollo. Las
// escenas se dibujan igual, así que salen los errores de dibujo si los hay.
import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { visibleChoices } from '../../src/engine/logic';
import type { Scene, Vars } from '../../src/engine/types';

/** Lo que las pruebas usan del juego. */
type Juego = {
  game?: { sceneId: string; finished?: string | null; vars: Vars };
  error: string | null;
  newGame: (inicio: string) => void;
  choose: (n: number) => void;
  advance: () => void;
  solveMinigame: () => void;
  loseLevel: () => void;
};
type W = { __genesis: { getState: () => Juego } };

/** Las escenas de un capítulo (src/data/chapters/<id>.json), por id. */
export function escenasDe(capitulo: string): Map<string, Scene> {
  const j = JSON.parse(readFileSync(`src/data/chapters/${capitulo}.json`, 'utf8')) as { scenes: Scene[] };
  return new Map(j.scenes.map((s) => [s.scene_id, s]));
}

/** Abre el juego, acepta la advertencia y empieza una partida en `inicio`. Devuelve la lista de errores. */
export async function empezar(page: Page, inicio: string) {
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
  await nuevaPartida(page, inicio);
  return errores;
}

/** Empieza otra partida en `inicio` (sin recargar la página). */
export const nuevaPartida = (page: Page, inicio: string) => page.evaluate((s) => (window as unknown as W).__genesis.getState().newGame(s), inicio);

const estado = (page: Page) =>
  page.evaluate(() => {
    const g = (window as unknown as W).__genesis.getState();
    return { escena: g.game?.sceneId as string, fin: (g.game?.finished ?? null) as string | null, vars: (g.game?.vars ?? {}) as Vars, error: g.error };
  });

/**
 * Recorre la historia hasta un final o un fin de capítulo. En cada decisión, `elige` dice qué opción tomar entre las
 * visibles (su índice); las peleas y los minijuegos se ganan, salvo la pelea `pierde`, que se pierde una vez (la
 * primera: si su derrota vuelve a la pelea, la segunda se gana).
 */
export async function recorrer(page: Page, escenas: Map<string, Scene>, elige: (opciones: Scene['choices'], escena: string) => number, pierde?: string) {
  const vistas: string[] = [];
  let perdio = false;
  for (let i = 0; i < 4000; i++) {
    const e = await estado(page);
    expect(e.error, `error del juego en ${e.escena}`).toBeNull();
    if (e.fin) return { ...e, vistas };
    // Recién empezada, la partida puede tardar un instante en existir.
    if (!e.escena && i < 50) {
      await page.waitForTimeout(100);
      continue;
    }
    vistas.push(e.escena);
    const s = escenas.get(e.escena);
    expect(s, `escena fuera del capítulo: ${e.escena}`).toBeTruthy();
    const opciones = visibleChoices(s!, e.vars);
    if (opciones.length) {
      const n = elige(opciones, e.escena);
      expect(n, `no sé qué elegir en ${e.escena}: ${opciones.map((c) => c.text).join(' | ')}`).toBeGreaterThanOrEqual(0);
      await page.evaluate((k) => (window as unknown as W).__genesis.getState().choose(k), n);
    } else if (s!.batalla || s!.minijuego || s!.nivel) {
      const accion = s!.batalla && s!.batalla === pierde && !perdio ? 'loseLevel' : 'solveMinigame';
      if (accion === 'loseLevel') perdio = true;
      await page.evaluate((a) => (window as unknown as W).__genesis.getState()[a as 'loseLevel' | 'solveMinigame'](), accion);
    } else {
      await page.evaluate(() => (window as unknown as W).__genesis.getState().advance());
    }
    // Un respiro para que la escena se dibuje.
    await page.waitForTimeout(5);
  }
  throw new Error('la historia no terminó');
}

/** Elige la opción cuyo texto coincide con alguna de las expresiones. */
export const porTexto = (elecciones: RegExp[]) => (opciones: Scene['choices']) => opciones.findIndex((c) => elecciones.some((r) => r.test(c.text)));
