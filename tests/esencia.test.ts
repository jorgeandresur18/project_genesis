// La esencia (docs/BIBLIA_RPG.md, sección 21): un pequeño plus oculto, distinto en cada partida.
import { describe, expect, it } from 'vitest';
import { RANGOS, TIPOS, sortearEsencia } from '../src/engine/esencia';
import { BATALLAS } from '../src/engine/batallas';
import { estadoInicial, sumarEnemigo } from '../src/engine/turnos';
import type { DatosBatalla } from '../src/engine/batalla';

describe('la esencia', () => {
  it('la misma semilla da la misma esencia; otra partida, otra', () => {
    expect(sortearEsencia('p1|heroe|jair|1', true)).toEqual(sortearEsencia('p1|heroe|jair|1', true));
    const distintas = new Set(Array.from({ length: 40 }, (_, i) => JSON.stringify(sortearEsencia(`p${i}|heroe|jair|1`, true))));
    expect(distintas.size).toBeGreaterThan(20);
  });
  it('siempre suma, dentro de su rango; los genéricos, la mitad del mínimo', () => {
    for (let i = 0; i < 300; i++) {
      const e = sortearEsencia(`x${i}`, true);
      const [min, max] = RANGOS[e.tipo];
      expect(e.valor).toBeGreaterThanOrEqual(min);
      expect(e.valor).toBeLessThanOrEqual(max);
      const g = sortearEsencia(`x${i}`, false);
      expect(g.valor).toBeCloseTo(RANGOS[g.tipo][0] / 2, 4);
    }
  });
  it('salen todos los tipos', () => {
    const vistos = new Set(Array.from({ length: 400 }, (_, i) => sortearEsencia(`t${i}`, true).tipo));
    expect([...vistos].sort()).toEqual([...TIPOS].sort());
  });
  it('en la pelea: los héroes y los enemigos la reciben con la semilla; sin semilla, nadie', () => {
    const d = BATALLAS.bastion as DatosBatalla;
    const con = estadoInicial(d, undefined, 'partida-x');
    expect(con.heroes.every((h) => h.esencia)).toBe(true);
    expect(sumarEnemigo(con, d, d.horda.enemigo, 5).esencia).toBeDefined();
    const sin = estadoInicial(d);
    expect(sin.heroes.some((h) => h.esencia)).toBe(false);
    // Misma partida, misma esencia.
    expect(estadoInicial(d, undefined, 'partida-x').heroes[0].esencia).toEqual(con.heroes[0].esencia);
  });
  it('dos peleadores iguales (el torneo) tienen identificadores distintos', () => {
    const d = { ...(BATALLAS.bastion as DatosBatalla), heroes: ['jair', 'jair', 'jair'] };
    const ids = estadoInicial(d).heroes.map((h) => h.id);
    expect(ids).toEqual(['jair', 'jair#2', 'jair#3']);
  });
});
