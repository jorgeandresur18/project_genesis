// Boringplace (el marketplace de Boringram): que lo abra la escena que sigue a la pelea del Bastión, que la tienda venda objetos de las peleas, que el
// inglés tenga los mismos artículos y que el tutorial de Boringram tenga los mismos pasos en los dos idiomas.
import { describe, expect, it } from 'vitest';
import { storyFiles } from '../src/engine/story';
import { OBJETOS_TIENDA, precioVenta, unlockScenesBoringplace } from '../src/engine/boringplace';
import es from '../src/data/boringplace.json';
import en from '../src/data/en/boringplace.json';
import bes from '../src/data/boringram.json';
import ben from '../src/data/en/boringram.json';

const escenas = new Map(storyFiles.flatMap((f) => f.scenes).map((s) => [s.scene_id, s]));

describe('Boringplace', () => {
  it('se abre al ganar la pelea del Bastión (no antes) con escenas que existen', () => {
    for (const id of unlockScenesBoringplace()) expect(escenas.has(id), id).toBe(true);
    expect(es.desbloqueo).toBe('cap01_n06');
    // La escena que lo abre es la que sigue a la pelea del Bastión (ganarla lleva ahí).
    const pelea = [...escenas.values()].find((x) => x.batalla === 'bastion');
    expect(pelea?.next).toBe(es.desbloqueo);
  });
  it('la tienda: cada artículo es un objeto de las peleas, con precio y descripción en los dos idiomas', () => {
    expect(en.tienda.length).toBe(es.tienda.length);
    for (const [i, x] of es.tienda.entries()) {
      expect(OBJETOS_TIENDA.has(x.objeto), x.objeto).toBe(true);
      expect(x.precio > 0 && x.descripcion && en.tienda[i].descripcion, x.objeto).toBeTruthy();
      expect(precioVenta(x.precio)).toBe(Math.floor(x.precio / 2));
    }
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
