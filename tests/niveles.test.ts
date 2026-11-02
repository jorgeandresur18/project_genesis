// Niveles de acción (src/data/niveles/*.json): que la historia espere hasta ganarlos, que perder lleve a su
// bad end y que cada diálogo del nivel tenga un evento que el juego dispara.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { useStore } from '../src/engine/store';
import { storyFiles } from '../src/engine/story';
import type { DatosNivel } from '../src/game/bastion';

const NIVELES = import.meta.glob<DatosNivel>('../src/data/niveles/*.json', { eager: true, import: 'default' });
const escenas = storyFiles.flatMap((f) => f.scenes);
const porId = new Map(escenas.map((s) => [s.scene_id, s]));

describe('niveles de acción', () => {
  it('la escena del nivel no avanza hasta ganarlo, y ganarlo sigue con la historia', () => {
    const scene = escenas.find((s) => s.nivel || s.batalla);
    expect(scene).toBeTruthy();
    useStore.getState().newGame(scene!.scene_id);
    useStore.getState().advance();
    useStore.getState().toNextChoice();
    expect(useStore.getState().game!.sceneId).toBe(scene!.scene_id);
    useStore.getState().solveMinigame();
    expect(useStore.getState().game!.sceneId).toBe(scene!.next);
  });

  it('perder lleva a un bad end', () => {
    const scene = escenas.find((s) => s.nivel || s.batalla)!;
    useStore.getState().newGame(scene.scene_id);
    useStore.getState().loseLevel();
    expect(useStore.getState().game!.sceneId).toBe(scene.nivel_derrota ?? scene.batalla_derrota);
    // Siguiendo desde ahí se llega a una escena con final.
    let s = porId.get((scene.nivel_derrota ?? scene.batalla_derrota)!);
    for (let i = 0; i < 50 && s && !s.ending; i++) s = porId.get(s.next as string);
    expect(s?.ending).toMatch(/^bad_/);
  });

  for (const [path, datos] of Object.entries(NIVELES)) {
    it(`${path.split('/').pop()}: cada diálogo tiene un evento que el juego dispara`, () => {
      const codigo = readFileSync('src/game/bastion.ts', 'utf8');
      const eventos = new Set([...codigo.matchAll(/evento\('([a-z_]+)'\)|evento: '([a-z_]+)'/g)].map((m) => m[1] ?? m[2]));
      // Los de cambiar de personaje se arman con el nombre.
      eventos.add('cambio_cami').add('cambio_jair');
      for (const d of datos.dialogos) {
        expect(eventos, `evento «${d.evento}»`).toContain(d.evento);
        expect(['Jair', 'Cami', 'Voz', 'Soldado'], d.quien).toContain(d.quien);
        expect(d.texto.length).toBeGreaterThan(0);
      }
      expect(datos.jugador.vida).toBeGreaterThan(0);
    });
  }
});
