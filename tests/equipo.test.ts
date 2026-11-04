// El equipamiento de ataques (docs/BIBLIA_RPG.md, sección 18): hasta 3 ataques y 2 especiales; lo que no está
// equipado va a la mochila; se guarda en la partida por nombre.
import { describe, expect, it } from 'vitest';
import { MAX_ATAQUES, enMochila, equipados, escribirEquipo, leerEquipo, progresoDeVars, type Ataque, type Heroe } from '../src/engine/batalla';
import { FICHAS } from '../src/engine/batallas';

const at = (nombre: string): Ataque => ({ nombre, poder: 5, texto: '', usos: 5 });
const jair = FICHAS.heroes.jair as Heroe;
const conMuchos = { ...jair, ataques: [at('A'), at('B'), at('C'), at('D')] } as Heroe;

describe('equipamiento de ataques', () => {
  it('sin elección: los primeros 3 equipados y el resto en la mochila', () => {
    expect(equipados(conMuchos, 5).ataques.map((a) => a.nombre)).toEqual(['A', 'B', 'C']);
    expect(enMochila(conMuchos, 5).ataques.map((a) => a.nombre)).toEqual(['D']);
  });

  it('con elección: los elegidos en su orden, sin pasar del máximo y solo los que conoce', () => {
    expect(equipados(conMuchos, 5, { ataques: ['D', 'A', 'Z'] }).ataques.map((a) => a.nombre)).toEqual(['D', 'A']);
    expect(equipados(conMuchos, 5, { ataques: ['A', 'B', 'C', 'D'] }).ataques).toHaveLength(MAX_ATAQUES);
  });

  it('Jair aprende el Cebo en el nivel 6: desde ahí lo tiene equipado (hay espacio)', () => {
    expect(equipados(jair, 5).ataques.map((a) => a.nombre)).not.toContain('Cebo');
    expect(equipados(jair, 6).ataques.map((a) => a.nombre)).toContain('Cebo');
  });

  it('se guarda en la partida como texto y se vuelve a leer', () => {
    expect(leerEquipo(escribirEquipo(['Puñetazo', 'Cebo']))).toEqual(['Puñetazo', 'Cebo']);
    const p = progresoDeVars({ ataques_jair: 'Cebo|Puñetazo', especiales_jair: '', nivel_jair: 6 });
    expect(p.equipo?.jair?.ataques).toEqual(['Cebo', 'Puñetazo']);
    expect(p.equipo?.jair?.especiales).toBeUndefined();
  });
});

describe('cassettes sueltos', () => {
  it('no se equipan solos; se pueden elegir; sin copias, no están', async () => {
    const { sueltosQueTengo } = await import('../src/engine/batallas');
    const sueltos = sueltosQueTengo({ piedra: 1 });
    expect(sueltos.map((a) => a.nombre)).toEqual(['Piedra']);
    expect(equipados(jair, 5, undefined, sueltos).ataques.map((a) => a.nombre)).not.toContain('Piedra');
    expect(enMochila(jair, 5, undefined, sueltos).ataques.map((a) => a.nombre)).toContain('Piedra');
    expect(equipados(jair, 5, { ataques: ['Piedra', 'Puñetazo'] }, sueltos).ataques.map((a) => a.nombre)).toEqual(['Piedra', 'Puñetazo']);
    // Vendido: aunque siga elegido, ya no está.
    expect(equipados(jair, 5, { ataques: ['Piedra', 'Puñetazo'] }, sueltosQueTengo({})).ataques.map((a) => a.nombre)).toEqual(['Puñetazo']);
  });

  it('las copias limitan cuántos lo llevan a la vez', async () => {
    const { copiasLibres } = await import('../src/engine/batallas');
    expect(copiasLibres('piedra', { piedra: 1 }, {})).toBe(1);
    expect(copiasLibres('piedra', { piedra: 1 }, { jair: { ataques: ['Piedra'] } })).toBe(0);
    expect(copiasLibres('piedra', { piedra: 2 }, { jair: { ataques: ['Piedra'] } })).toBe(1);
    expect(progresoDeVars({ cassette_piedra: 2 }).cassettes).toEqual({ piedra: 2 });
  });

  it('cada suelto tiene precio, usos limitados y su variable declarada en la partida', async () => {
    const variables = (await import('../src/data/variables.json')).default as Record<string, unknown>;
    for (const [id, c] of Object.entries(FICHAS.sueltos)) {
      expect(c.precio, id).toBeGreaterThan(0);
      expect(c.ataque.usos, id).toBeGreaterThan(0);
      expect(variables, id).toHaveProperty(`cassette_${id}`);
    }
  });
});
