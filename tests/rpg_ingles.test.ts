// El inglés de los objetos, los cassettes y los ataques de los héroes: que no falte ninguno y que no se pierdan los marcadores.
import { describe, expect, it } from 'vitest';
import en from '../src/data/en/rpg.json';
import type { Ataque, Especial, Heroe } from '../src/engine/batalla';
import { FICHAS } from '../src/engine/batallas';
import { ataqueEn, nombreAtaque, objetoEn } from '../src/engine/rpgTexto';

const marcas = (t: string) => [...new Set(t.match(/\{\w+\}/g) ?? [])].sort();
const ataques: (Ataque | Especial)[] = [
  ...Object.values(FICHAS.sueltos).map((c) => (c.ataque ?? c.especial)!),
  ...Object.values(FICHAS.heroes).flatMap((h) => {
    const x = h as Heroe;
    return [...x.ataques, ...(x.aprende ?? []).map((a) => a.ataque), ...(x.especial ? [x.especial] : []), ...(x.especiales ?? []), ...(x.especiales_extra ?? []).map((e) => e.especial)];
  }),
];

describe('el inglés del RPG', () => {
  it('cada objeto tiene su inglés, con los mismos marcadores', () => {
    for (const [id, o] of Object.entries(FICHAS.objetos)) {
      const x = (en.objetos as Record<string, { nombre: string; texto: string }>)[id];
      expect(x, id).toBeTruthy();
      expect(marcas(x.texto), id).toEqual(marcas(o.texto));
    }
  });

  it('cada cassette y cada ataque o especial de los héroes también', () => {
    for (const a of ataques) {
      const x = (en.ataques as Record<string, { nombre: string; texto: string }>)[a.nombre];
      expect(x, a.nombre).toBeTruthy();
      expect(marcas(x.texto), a.nombre).toEqual(marcas(a.texto));
    }
  });

  it('solo cambia lo que se ve: el original sigue igual y en español no se toca', () => {
    const o = FICHAS.objetos.vida;
    expect(objetoEn('es', 'vida', o)).toBe(o);
    expect(objetoEn('en', 'vida', o).nombre).toBe('Still Water');
    expect(objetoEn('en', 'vida', o).ps).toBe(o.ps);
    expect(o.nombre).toBe('Agua sin gas');
    expect(nombreAtaque('en', 'Puñetazo')).toBe('Punch');
    expect(nombreAtaque('es', 'Puñetazo')).toBe('Puñetazo');
    const a = ataques[0];
    expect(ataqueEn('es', a)).toBe(a);
  });
});
