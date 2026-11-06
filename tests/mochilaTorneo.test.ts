// La mochila del torneo y el equipo de sus peleadores (decisiones del autor, 2026-11-06): src/engine/mochilaTorneo.ts.
import { describe, expect, it } from 'vitest';
import {
  TOPE_OBJETO,
  TOPE_TRASPASO,
  equipoDe,
  gastarEnRonda,
  lugarPara,
  mochilaDeRonda,
  piezas,
  ponerPrenda,
  restaurarEquipo,
  sacarPrenda,
  traspasables,
  traspasar,
} from '../src/engine/mochilaTorneo';
import { TORNEO } from '../src/engine/torneo';

describe('el equipo de los peleadores del torneo', () => {
  it('cada uno sale con su equipo de fábrica (Jair, sus lentes de programador)', () => {
    expect(equipoDe('jair', {})).toEqual(['lentes_programador']);
  });
  it('se le pone una prenda de la mochila; la de fábrica que tenía no se suma a la mochila', () => {
    const m = ponerPrenda({ mochila: { gorro_navidad: 1 } }, 'jair', 'gorro_navidad')!;
    expect(piezas('jair', m).cabeza).toBe('gorro_navidad');
    expect(m.mochila).toEqual({});
    // Sacarla: vuelve a la mochila; y la de fábrica se puede volver a poner sin comprarla.
    const sin = sacarPrenda(m, 'jair', 'cabeza')!;
    expect(sin.mochila).toEqual({ gorro_navidad: 1 });
    expect(ponerPrenda(sin, 'jair', 'lentes_programador')).toBeTruthy();
  });
  it('sin la prenda en la mochila no se puede poner; restaurar devuelve lo comprado', () => {
    expect(ponerPrenda({}, 'jair', 'casco_obra')).toBeNull();
    const m = ponerPrenda({ mochila: { casco_obra: 1 } }, 'billy', 'casco_obra')!;
    const r = restaurarEquipo(m, 'billy');
    expect(r.mochila).toEqual({ casco_obra: 1 });
    expect(equipoDe('billy', r)).toEqual(equipoDe('billy', {}));
  });
});

describe('la mochila en las rondas', () => {
  it('entra solo con la mochila del torneo (nadie regala nada) y lo usado se descuenta', () => {
    expect(TORNEO.mochila).toEqual({});
    const m = { mochila: { vida: 2, revivir_plus: 1 } };
    const antes = mochilaDeRonda(m);
    expect(antes.vida).toBe((TORNEO.mochila.vida ?? 0) + 2);
    // Usó la fija de agua y una más: la mochila del torneo pierde una.
    const despues = { ...antes, vida: antes.vida - (TORNEO.mochila.vida ?? 0) - 1 };
    expect(gastarEnRonda(m, antes, despues).mochila).toEqual({ vida: 1, revivir_plus: 1 });
  });
});

describe('el tope de cada objeto', () => {
  it(`hasta ${TOPE_OBJETO} de cada objeto que se gasta; 3 de cada prenda, puestas o no`, () => {
    expect(lugarPara({ mochila: { revivir_plus: 7 } }, 'revivir_plus')).toBe(2);
    expect(lugarPara({ mochila: { revivir_plus: 9 } }, 'revivir_plus')).toBe(0);
    expect(lugarPara({ mochila: { gorro_navidad: 1 }, equipo: { jair: { cabeza: 'gorro_navidad' } } }, 'gorro_navidad')).toBe(1);
    expect(lugarPara({}, 'gorro_navidad')).toBe(3);
  });
});

describe('de una partida al torneo, al terminar un capítulo', () => {
  const vars = { partida_id: 'p1', mochila_vida: 4, mochila_revivir: 3, mochila_traje_rojo: 1, mochila_caramelo_dulce: 2 };
  it('solo lo que se gasta (ni la ropa ni los permanentes)', () => {
    expect(traspasables(vars)).toEqual({ vida: 4, revivir: 3 });
  });
  it(`con tope de ${TOPE_TRASPASO} por capítulo, anotado fuera de la partida`, () => {
    const r = traspasar({}, vars, { vida: 4, revivir: 3 }, 1)!;
    expect(r.pasados).toBe(TOPE_TRASPASO);
    expect(r.vars.mochila_vida).toBe(0);
    expect(r.vars.mochila_revivir).toBe(2);
    expect(r.mochila.mochila).toEqual({ vida: 4, revivir: 1 });
    // Cargar el guardado viejo no reinicia el tope de ese capítulo.
    expect(traspasar(r.mochila, vars, { revivir: 3 }, 1)).toBeNull();
    // Otro capítulo, otro tope.
    expect(traspasar(r.mochila, vars, { revivir: 3 }, 2)!.pasados).toBe(3);
  });
});
