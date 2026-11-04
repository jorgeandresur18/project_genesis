// Ataques intercambiables (docs/BIBLIA_RPG.md, sección 18): los especiales comparten una sola barra y se elige cuál
// usar; todo ataque tiene usos limitados por pelea, menos los especiales.
import { describe, expect, it } from 'vitest';
import { MAX_ESPECIALES, especialesDe, type Especial, type Heroe } from '../src/engine/batalla';
import { FICHAS } from '../src/engine/batallas';

const esp = (nombre: string): Especial => ({ nombre, poder: 5, golpes: 3, objetivo: 'uno', color: '#ffffff', ojos: [0, 0, 1, 1], texto: '', posicion: 'objetivo' });

describe('ataques y especiales', () => {
  it('sin lista de especiales, tiene solo el suyo; con lista, los equipados en orden', () => {
    const jair = FICHAS.heroes.jair as Heroe;
    expect(especialesDe(jair).map((e) => e.nombre)).toEqual([jair.especial!.nombre]);
    const conDos = { ...jair, especiales: [esp('Primero'), esp('Segundo')] } as Heroe;
    expect(especialesDe(conDos).map((e) => e.nombre)).toEqual(['Primero', 'Segundo']);
    expect(especialesDe({ ...jair, especial: undefined } as Heroe)).toEqual([]);
  });

  it('se equipan hasta 2 especiales en cada ficha (3 con el caramelo premium, por construir)', () => {
    for (const [k, h] of Object.entries(FICHAS.heroes)) expect(especialesDe(h as Heroe).length, k).toBeLessThanOrEqual(MAX_ESPECIALES);
  });

  it('todo ataque de un héroe tiene usos limitados por pelea (los especiales no: dependen de la barra)', () => {
    for (const [k, h] of Object.entries(FICHAS.heroes)) {
      for (const a of [...h.ataques, ...(h.aprende ?? []).map((x) => x.ataque)]) expect(a.usos, `${k}: ${a.nombre}`).toBeGreaterThan(0);
    }
  });
});
