// El enlace entre capítulos: al terminar uno, «Continuar» sigue al siguiente si ya se puede jugar
// (`capitulo_maximo` en src/data/juego.json).
import { describe, expect, it } from 'vitest';
import { config, scenes, storyFiles } from '../src/engine/story';

describe('capítulos enlazados', () => {
  it('cada capítulo jugable después del 1 existe y empieza en una escena real', () => {
    const max = config.capitulo_maximo ?? 1;
    for (let n = 2; n <= max; n++) {
      const f = storyFiles.find((x) => x.ruta === 'base' && x.chapter === n);
      expect(f, `capítulo ${n}`).toBeTruthy();
      expect(scenes.has(f!.scenes[0].scene_id)).toBe(true);
    }
  });

  it('el capítulo anterior termina en una pantalla de fin de capítulo (desde ahí sigue «Continuar»)', () => {
    const max = config.capitulo_maximo ?? 1;
    for (let n = 1; n < max; n++) {
      const f = storyFiles.find((x) => x.ruta === 'base' && x.chapter === n)!;
      expect(f.scenes.some((s) => s.fin_capitulo === n && s.next === null), `fin del capítulo ${n}`).toBe(true);
    }
  });
});
