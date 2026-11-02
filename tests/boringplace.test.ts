// Boringplace (el marketplace de Boringram): que lo abra una escena que existe (del Capítulo 2, nunca del 1), que el
// inglés tenga los mismos artículos y que el tutorial de Boringram tenga los mismos pasos en los dos idiomas.
import { describe, expect, it } from 'vitest';
import { storyFiles } from '../src/engine/story';
import { unlockScenesBoringplace } from '../src/engine/boringplace';
import es from '../src/data/boringplace.json';
import en from '../src/data/en/boringplace.json';
import bes from '../src/data/boringram.json';
import ben from '../src/data/en/boringram.json';

const escenas = new Map(storyFiles.flatMap((f) => f.scenes).map((s) => [s.scene_id, s]));

describe('Boringplace', () => {
  it('se abre en el Capítulo 2 (no antes) con escenas que existen', () => {
    for (const id of unlockScenesBoringplace()) {
      expect(escenas.has(id), id).toBe(true);
      expect(escenas.get(id)!.chapter, id).toBeGreaterThanOrEqual(2);
    }
    expect(es.desbloqueo).toBeTruthy();
  });
  it('cada artículo tiene precio, foto (placeholder), respuesta y su texto en inglés', () => {
    expect(en.articulos.length).toBe(es.articulos.length);
    const ids = new Set<string>();
    for (const a of es.articulos) {
      expect(ids.has(a.id), a.id).toBe(false);
      ids.add(a.id);
      expect(a.precio && a.imagen.startsWith('PLACEHOLDER:') && a.respuesta && a.descripcion, a.id).toBeTruthy();
      if (!('de_jair' in a && a.de_jair)) expect('vendedor' in a && a.vendedor, a.id).toBeTruthy();
    }
    expect(es.articulos.some((a) => 'de_jair' in a && a.de_jair)).toBe(true);
    expect(es.articulos.some((a) => a.estafa)).toBe(true);
  });
  it('el tutorial de Boringram tiene los mismos pasos en los dos idiomas (se mezclan por posición) y explica Boringplace', () => {
    expect(ben.tutorial.length).toBe(bes.tutorial.length);
    bes.tutorial.forEach((_, i) => expect(!!ben.tutorial[i].titulo, `paso ${i}`).toBe(true));
    expect(bes.tutorial.some((p) => 'vista' in p && p.vista === 'tienda')).toBe(true);
  });
});
