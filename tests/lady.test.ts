// Lady y la copia (decisión del autor, 2026-11-06; docs/BIBLIA_RPG.md, sección 22).
import { describe, expect, it } from 'vitest';
import { ataqueCopiado, type Ataque } from '../src/engine/batalla';
import personajes from '../src/data/rpg/personajes.json';
import { HEROES_TORNEO } from '../src/engine/torneo';

const copia = (personajes.heroes as unknown as Record<string, { ataques: Ataque[] }>).lady.ataques.find((a) => a.copia)!;

describe('la copia de Lady', () => {
  it('Lady tiene su copia y pelea en el torneo', () => {
    expect(copia).toBeDefined();
    expect(HEROES_TORNEO).toContain('lady');
  });

  it('si nadie le pegó, es su golpe simple', () => {
    expect(ataqueCopiado(copia, undefined)).toBe(copia);
  });

  it('copia el daño y el efecto, con su nombre y su texto', () => {
    const puno: Ataque = { nombre: 'Puñetazo eléctrico', poder: 14, deja: { estado: 'paralizado', prob: 0.25 }, texto: 'otro texto', anim: 'puno' };
    const r = ataqueCopiado(copia, puno);
    expect(r.poder).toBe(14);
    expect(r.deja).toEqual(puno.deja);
    expect(r.nombre).toBe(copia.nombre);
    expect(r.texto).toBe(copia.texto);
    expect(r.anim).toBe(copia.anim);
    expect(r.usos).toBe(copia.usos);
  });

  it('copia la parálisis, la confusión, el veneno y a quién apunta', () => {
    expect(ataqueCopiado(copia, { nombre: 'x', poder: 0, paraliza: 2, texto: '' }).paraliza).toBe(2);
    expect(ataqueCopiado(copia, { nombre: 'x', poder: 0, confunde: 3, texto: '' }).confunde).toBe(3);
    const veneno = ataqueCopiado(copia, { nombre: 'x', poder: 8, aplica: { veneno: { danio: 3, turnos: 2 } }, texto: '' });
    expect(veneno.aplica?.veneno).toEqual({ danio: 3, turnos: 2 });
    expect(ataqueCopiado(copia, { nombre: 'x', poder: 5, objetivo: 'todos', texto: '' }).objetivo).toBe('todos');
  });

  it('la ráfaga de balas se copia como un golpe con las balas de en medio; la de la sombra, como una', () => {
    const r = ataqueCopiado(copia, { nombre: 'Ráfaga', poder: 4, balas: [2, 4], texto: '' });
    expect(r.poder).toBe(12);
    expect(r.balas).toBeUndefined();
    const s = ataqueCopiado(copia, { nombre: 'Sombra', poder: 7, rafagas: 5, texto: '' });
    expect(s.poder).toBe(7);
    expect(s.rafagas).toBeUndefined();
  });

  it('no copia cebos, curas, nada sobre sí mismo ni otra copia', () => {
    for (const a of [
      { nombre: 'c', poder: 0, cebo: true, texto: '' },
      { nombre: 'c', poder: 0, cura: 0.3, texto: '' },
      { nombre: 'c', poder: 0, alMismo: true, aplica: { atq: 2 }, texto: '' },
      { nombre: 'c', poder: 0, autodestruccion: 0.5, texto: '' },
      { ...copia },
    ] as Ataque[])
      expect(ataqueCopiado(copia, a)).toBe(copia);
  });

  it('un ataque normal no cambia aunque le hayan pegado', () => {
    const otro: Ataque = { nombre: 'Barra luminosa', poder: 11, texto: '' };
    expect(ataqueCopiado(otro, { nombre: 'x', poder: 30, texto: '' })).toBe(otro);
  });
});
