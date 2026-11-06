// Los consumibles de la tabla del autor, el stock por capítulo y comprar desde el título (docs/BIBLIA_RPG.md, secciones 14 y 15).
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { crearLuchador, usarObjeto, type Heroe } from '../src/engine/batalla';
import { BATALLAS, FICHAS } from '../src/engine/batallas';
import { partidaParaComprar, quedanStock, varStock } from '../src/engine/tienda';
import tiendaEs from '../src/data/boringplace.json';
import tiendaEn from '../src/data/en/boringplace.json';

const O = FICHAS.objetos;
const jair = () => crearLuchador('jair', 'jair', 'heroe', FICHAS.heroes.jair as Heroe, 5);

describe('los consumibles', () => {
  it('Hepatol quita solo el veneno', () => {
    const h = jair();
    h.envenenado = { danio: 6, turnos: 3 };
    h.confundido = 2;
    h.quemado = 2;
    usarObjeto(O.hepatol, h);
    expect([h.envenenado, h.confundido, h.quemado]).toEqual([null, 2, 2]);
  });

  it('la galleta clásica solo sube vida; las otras suben vida y quitan un estado (uno solo)', () => {
    const h = jair();
    h.ps = 1;
    h.envenenado = { danio: 6, turnos: 3 };
    usarObjeto(O.galleta_clasica, h);
    expect(h.ps).toBe(21);
    expect(h.envenenado).not.toBeNull();
    for (const [k, ps] of [['galleta_arcoiris', 20], ['galleta_brownie', 50], ['galleta_red_velvet', 35]] as const) {
      const x = jair();
      x.psMax = 1000;
      x.ps = 1;
      x.envenenado = { danio: 6, turnos: 3 };
      x.quemado = 2;
      x.confundido = 2;
      usarObjeto(O[k], x);
      expect(x.ps, k).toBe(1 + ps);
      expect([x.envenenado, x.quemado, x.confundido], k).toEqual([null, 2, 2]);
      usarObjeto(O[k], x);
      expect(x.quemado, k).toBe(0);
      usarObjeto(O[k], x);
      expect(x.confundido, k).toBe(0);
    }
  });

  it('el Elixit++ revive con toda la vida; el Spartan es para todo el equipo; la arcoíris también', () => {
    const h = jair();
    h.ps = 0;
    usarObjeto(O.revivir_plus, h);
    expect(h.ps).toBe(h.psMax);
    expect(O.condon_spartan).toMatchObject({ objetivo: 'equipo', protege: 1 });
    expect(O.galleta_arcoiris.objetivo).toBe('equipo');
  });

  it('se pueden usar en cualquier pelea; el equipo, no', () => {
    for (const d of Object.values(BATALLAS)) {
      expect(d.objetos.hepatol).toBeTruthy();
      expect(d.objetos.galleta_brownie).toBeTruthy();
      expect(d.objetos.gorro_navidad).toBeUndefined();
    }
  });

  it('la tienda vende lo que existe, con su dibujo si lo tiene, y tiene los mismos artículos en inglés', () => {
    // Los nuevos del 2026-11-05 van sin dibujo hasta la fase de arte (greyboxing): la tienda muestra el recuadro de su color.
    for (const x of tiendaEs.tienda) {
      expect(O[x.objeto], x.objeto).toBeTruthy();
      if (O[x.objeto].icono) expect(existsSync(`public/${O[x.objeto].icono}.webp`), x.objeto).toBe(true);
    }
    expect(tiendaEn.tienda).toHaveLength(tiendaEs.tienda.length);
  });
});

describe('el stock por capítulo', () => {
  it('sin límite: siempre hay; con límite: se acaba y vuelve en el capítulo siguiente', () => {
    expect(quedanStock({}, 'vida', 1)).toBe(Infinity);
    expect(quedanStock({}, 'caramelo_dulce', 1, 1)).toBe(1);
    const v = { [varStock('caramelo_dulce', 1)]: 1 };
    expect(quedanStock(v, 'caramelo_dulce', 1, 1)).toBe(0);
    expect(quedanStock(v, 'caramelo_dulce', 2, 1)).toBe(1);
  });

  it('lo permanente tiene límite', () => {
    for (const x of tiendaEs.tienda as { objeto: string; stock_por_capitulo?: number }[]) {
      if (O[x.objeto].tipo === 'permanente') expect(x.stock_por_capitulo, x.objeto).toBeGreaterThan(0);
    }
  });
});

describe('comprar desde el título', () => {
  const saves = [null, { date: '2026-11-01' }, { date: '2026-11-03' }, { date: '2026-11-02' }];
  it('por defecto, la más reciente; se puede elegir otra; sin partidas, ninguna', () => {
    expect(partidaParaComprar(saves, null)).toBe(2);
    expect(partidaParaComprar(saves, 1)).toBe(1);
    expect(partidaParaComprar(saves, 0)).toBe(2);
    expect(partidaParaComprar([null, null], null)).toBe(-1);
  });
});
