// Minijuegos de código (src/data/minijuegos/*.json): que se puedan resolver y que la historia espere.
import { describe, expect, it } from 'vitest';
import { useStore } from '../src/engine/store';
import { storyFiles } from '../src/engine/story';

interface Data {
  principal: string;
  archivos: { ruta: string; lineas: string[] }[];
  huecos: Record<string, { respuesta: string; error: string }>;
  paleta: string[];
}
const GAMES = import.meta.glob<Data>('../src/data/minijuegos/*.json', { eager: true, import: 'default' });

describe('minijuegos', () => {
  for (const [path, data] of Object.entries(GAMES)) {
    it(`${path.split('/').pop()} tiene solución`, () => {
      const main = data.archivos.find((f) => f.ruta === data.principal);
      expect(main, 'el archivo principal existe').toBeTruthy();
      const inCode = [...main!.lineas.join('\n').matchAll(/\[\[(\d+)\]\]/g)].map((m) => m[1]).sort();
      expect(inCode).toEqual(Object.keys(data.huecos).sort());
      for (const [n, h] of Object.entries(data.huecos)) {
        expect(data.paleta, `la respuesta del hueco ${n} está en la paleta`).toContain(h.respuesta);
        expect(h.error).toContain('{valor}');
      }
    });
  }

  it('la historia no pasa de la escena del minijuego hasta resolverlo', () => {
    const scene = storyFiles.flatMap((f) => f.scenes).find((s) => s.minijuego);
    expect(scene).toBeTruthy();
    useStore.getState().newGame(scene!.scene_id);
    useStore.getState().advance();
    useStore.getState().toNextChoice();
    expect(useStore.getState().game!.sceneId).toBe(scene!.scene_id);
    useStore.getState().solveMinigame();
    expect(useStore.getState().game!.sceneId).toBe(scene!.next);
  });

  it('salir del minijuego lleva a su escena de salida, y desde ahí se vuelve a él', () => {
    const scene = storyFiles.flatMap((f) => f.scenes).find((s) => s.minijuego && s.minijuego_salida);
    expect(scene).toBeTruthy();
    useStore.getState().newGame(scene!.scene_id);
    useStore.getState().exitMinigame();
    expect(useStore.getState().game!.sceneId).toBe(scene!.minijuego_salida);
    useStore.getState().toNextChoice();
    useStore.getState().choose(0); // «Volver al IDE»
    expect(useStore.getState().game!.sceneId).toBe(scene!.scene_id);
  });
});
