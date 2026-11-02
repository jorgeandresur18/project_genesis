// Escenas secretas (`secreto: true`): solo se abren con el juego al 100 %, no cuentan para el 100 % ni para la
// galería, y cada sprite desbloqueable tiene sus emblemas +18 (la censura va pegada en la imagen).
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { useStore } from '../src/engine/store';
import { storyFiles } from '../src/engine/story';
import { CGS, CGS_SECRETOS, CHARACTERS } from '../src/engine/gallery';
import emblemas from '../src/data/emblemas_18.json';

const escenas = storyFiles.flatMap((f) => f.scenes);
const secretas = escenas.filter((s) => s.secreto);
// Las del 100 % (Capítulo 2); las del bar (Capítulo 1) se abren por otro lado (ver su prueba).
const delCien = secretas.filter((s) => s.chapter === 2);
const entrada = escenas.find((s) => Array.isArray(s.next) && s.next.some((b) => b.to === delCien[0]?.scene_id));

describe.runIf(secretas.length > 0)('escenas secretas', () => {
  it('sin el 100 % se salta la escena secreta; con el 100 % se entra', () => {
    expect(entrada).toBeTruthy();
    useStore.setState({ juegoCompleto: false });
    useStore.getState().newGame(entrada!.scene_id);
    useStore.getState().advance();
    expect(useStore.getState().game!.sceneId).not.toBe(delCien[0].scene_id);
    useStore.setState({ juegoCompleto: true });
    useStore.getState().newGame(entrada!.scene_id);
    useStore.getState().advance();
    expect(useStore.getState().game!.sceneId).toBe(delCien[0].scene_id);
    useStore.setState({ juegoCompleto: false });
  });

  it('no suman sprites a la galería', () => {
    const ids = new Set(secretas.map((s) => s.scene_id));
    for (const c of CHARACTERS) for (const sp of c.sprites) for (const id of sp.scenes) expect(ids.has(id), id).toBe(false);
  });

  it('cada sprite desbloqueable existe y tiene sus emblemas', () => {
    const lista = emblemas.sprites as Record<string, unknown[]>;
    for (const s of secretas) {
      for (const c of s.characters) {
        const m = c.sprite.match(/^sprites\/([^/]+\/[^/.]+)\.webp$/);
        if (!m || !m[1].includes('desbloqueable')) continue;
        expect(existsSync(`public/${c.sprite}`), c.sprite).toBe(true);
        expect(lista[m[1]]?.length, m[1]).toBeGreaterThan(0);
      }
    }
    expect(existsSync(`public/${emblemas.emblema}`)).toBe(true);
  });

  it('tocar los emblemas hasta el grito salta a la imagen secreta, que no cuenta para el 100 %', () => {
    const conToques = secretas.filter((s) => s.toques_salida);
    expect(conToques.length).toBeGreaterThan(0);
    const salida = conToques[0].toques_salida!;
    useStore.setState({ juegoCompleto: true });
    useStore.getState().newGame(conToques[0].scene_id);
    useStore.getState().salirPorToques();
    expect(useStore.getState().game!.sceneId).toBe(salida);
    // Después de la imagen secreta, Rikka queda perturbada en la escena del traje.
    for (const [k, v] of Object.entries(conToques[0].toques_set ?? {})) expect(useStore.getState().game!.vars[k]).toBe(v);
    useStore.setState({ juegoCompleto: false });
    const cg = escenas.find((s) => s.scene_id === salida)!.background!.match(/^fondos\/(cg_[a-z0-9_]+)\.webp$/)![1];
    expect(CGS).not.toContain(cg);
    expect(CGS_SECRETOS).toContain(cg);
    expect((emblemas.fondos as Record<string, { emblemas: unknown[] }>)[`fondos/${cg}`]?.emblemas.length).toBeGreaterThan(0);
  });

  it('cada paso de las secuencias de toques tiene su sprite y sus emblemas, en orden, y alguna termina en un grito', () => {
    const lista = emblemas.sprites as Record<string, unknown[]>;
    type Paso = { toques: number; sprite?: string; luego?: string; grito?: string };
    const secuencias = emblemas.secuencias as { sprites: string[]; pasos: Paso[] }[];
    for (const sec of secuencias) {
      for (const s of sec.sprites) expect(lista[s]?.length, s).toBeGreaterThan(0);
      sec.pasos.forEach((p, i) => {
        if (i > 0) expect(p.toques).toBeGreaterThan(sec.pasos[i - 1].toques);
        for (const s of [p.sprite, p.luego].filter(Boolean) as string[]) {
          expect(existsSync(`public/sprites/${s}.webp`), s).toBe(true);
          expect(lista[s]?.length, s).toBeGreaterThan(0);
        }
        if (p.grito) expect(p.luego, 'el grito pasa a otro sprite').toBeTruthy();
      });
    }
    expect(secuencias.some((s) => s.pasos.at(-1)?.grito)).toBe(true);
  });

  it('con Rikka perturbada, en la escena del traje se ven las líneas alternativas', () => {
    const alt = escenas.filter((s) => s.conditions.some((c) => c.var === 'rikka_perturbada' && c.value === true));
    expect(alt.length).toBeGreaterThan(0);
    for (const s of alt) {
      expect(s.secreto, s.scene_id).toBe(true);
      // La original que reemplaza tiene la condición contraria.
      const orig = escenas.find((o) => o.scene_id === s.next);
      expect(orig?.conditions.some((c) => c.var === 'rikka_perturbada' && c.value === false), s.scene_id).toBe(true);
    }
  });

  it('el bar del Capítulo 1: «Propasarte» está desde la primera partida y lleva a la pelea con Nikki', () => {
    const bar = escenas.find((s) => s.choices.some((c) => c.next === 'cap01_nk01'))!;
    expect(bar).toBeTruthy();
    const i = bar.choices.findIndex((c) => c.next === 'cap01_nk01');
    expect(bar.choices[i].conditions ?? []).toEqual([]);
    useStore.setState({ cap01Completo: false, juegoCompleto: false });
    useStore.getState().newGame(bar.scene_id);
    useStore.getState().choose(i);
    expect(useStore.getState().game!.sceneId).toBe('cap01_nk01');
    // Por ahí se llega a la batalla.
    let s = escenas.find((x) => x.scene_id === 'cap01_nk01')!;
    for (let k = 0; k < 20 && !s.batalla; k++) s = escenas.find((x) => x.scene_id === s.next)!;
    expect(s.batalla).toBe('nikki');
    // Perderla: la imagen desbloqueable de Nikki llorando y el bad end (los dos cuentan para el 100 %).
    let d = escenas.find((x) => x.scene_id === s.batalla_derrota)!;
    const fondos = new Set<string>();
    for (let k = 0; k < 20 && !d.ending; k++) {
      if (d.background) fondos.add(d.background);
      expect(d.secreto, d.scene_id).toBeFalsy();
      d = escenas.find((x) => x.scene_id === d.next)!;
    }
    expect(d.ending).toBe('bad_cap01_nikki');
    expect(fondos.has('fondos/cg_nikki_cachetadas.webp')).toBe(true);
    expect(CGS).toContain('cg_nikki_cachetadas');
    // El perdón también es un camino de la pelea.
    expect(s.batalla_perdon).toBeTruthy();
  });

  it('la herramienta de sprites nunca exporta los grupos desbloqueables (no tienen censura)', () => {
    expect(readFileSync('tools/sprites.mjs', 'utf8')).toMatch(/desbloqueable/);
  });
});
