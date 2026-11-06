import { alEntrar, applyChoice } from '../src/engine/logic';
// El equipo (la ropa: docs/BIBLIA_RPG.md, secciones 14 y 15) y los permanentes fuera de las peleas (src/engine/equipo.ts).
import { describe, expect, it } from 'vitest';
import { eligeAtaque, progresoDeVars, tickVeneno, usableEnPelea, type Ataque, type DatosBatalla } from '../src/engine/batalla';
import { BATALLAS, FICHAS } from '../src/engine/batallas';
import { ESPACIOS, bonos, esEquipo, ponerEquipo, quienLleva, quitarEquipo, usarPermanente, yaTiene } from '../src/engine/equipo';
import { confundirA, estadoInicial, resolverGolpe } from '../src/engine/turnos';

const O = FICHAS.objetos;
const D = BATALLAS.bastion as DatosBatalla;

describe('el equipo de la biblia', () => {
  it('las 23 prendas (9 de la biblia, 8 de la propuesta del 2026-11-05, la placa de piloto de Cami, los lentes de programador de Jair y las 4 de Maggie) tienen su espacio, se equipan y no se usan en la pelea', () => {
    const ropa = Object.values(O).filter((o) => o.tipo === 'equipo');
    expect(ropa).toHaveLength(23);
    for (const o of ropa) {
      expect(esEquipo(o), o.nombre).toBe(true);
      expect(usableEnPelea(o), o.nombre).toBe(false);
    }
    expect(ESPACIOS).toEqual(['cabeza', 'traje', 'pies', 'amuleto']);
  });

  it('los efectos, como dice la tabla', () => {
    expect(bonos(['chaqueta_jean', 'zapatos_plataforma'], O)).toMatchObject({ def: 4, vel: 1, atq: 0 });
    expect(bonos(['traje_rojo'], O)).toMatchObject({ def: 4, atq: 3 });
    expect(bonos(['gorro_navidad'], O).critico).toBe(0.05);
    expect(bonos(['flor_pureza'], O).sinConfusion).toBe(true);
    expect(bonos(['prendas_sacerdotisa'], O)).toMatchObject({ def: 5, resisteVeneno: true });
  });
});

describe('ponerse y sacarse la ropa', () => {
  it('sale de la mochila y lo que tenía en ese espacio vuelve', () => {
    let v = ponerEquipo({ mochila_chaqueta_jean: 1, mochila_traje_azul: 1 }, 'jair', 'chaqueta_jean', O.chaqueta_jean)!;
    expect(v.puesto_jair_traje).toBe('chaqueta_jean');
    expect(v.mochila_chaqueta_jean).toBe(0);
    v = ponerEquipo(v, 'jair', 'traje_azul', O.traje_azul)!;
    expect(v.puesto_jair_traje).toBe('traje_azul');
    expect([v.mochila_chaqueta_jean, v.mochila_traje_azul]).toEqual([1, 0]);
    v = quitarEquipo(v, 'jair', 'traje')!;
    expect(v.puesto_jair_traje).toBe('');
    expect(v.mochila_traje_azul).toBe(1);
  });

  it('no se puede sin tenerla, ni con algo que no es ropa, ni sacar un espacio vacío', () => {
    expect(ponerEquipo({}, 'jair', 'chaqueta_jean', O.chaqueta_jean)).toBeNull();
    expect(ponerEquipo({ mochila_vida: 1 }, 'jair', 'vida', O.vida)).toBeNull();
    expect(quitarEquipo({}, 'jair', 'traje')).toBeNull();
  });

  it('la prenda puesta sigue siendo tuya: no se vuelve a comprar; el nombre del héroe puede tener guion bajo', () => {
    const v = { puesto_un_heroe_pies: 'zapatillas_buenas' };
    expect(quienLleva(v, 'zapatillas_buenas')).toEqual({ heroe: 'un_heroe', espacio: 'pies' });
    expect(yaTiene(v, 'zapatillas_buenas')).toBe(true);
    expect(yaTiene({ mochila_zapatillas_buenas: 1 }, 'zapatillas_buenas')).toBe(true);
    expect(yaTiene({}, 'zapatillas_buenas')).toBe(false);
  });

  it('se guarda en la partida y se lee en el progreso', () => {
    const p = progresoDeVars({ puesto_jair_cabeza: 'gorro_navidad', puesto_jair_traje: '', mochila_vida: 2 });
    expect(p.puestos).toEqual({ jair: { cabeza: 'gorro_navidad' } });
    expect(p.mochila).toEqual({ vida: 2 });
  });
});

describe('la ropa en la pelea', () => {
  const con = (cabeza: string, espacio = 'traje') => estadoInicial(D, { heroes: {}, mochila: {}, puestos: { jair: { [espacio]: cabeza } } });

  it('sin ropa, nada cambia; ATQ y DEF van en los extras (subir de nivel no los borra)', () => {
    const [jair] = estadoInicial(D).heroes;
    expect([jair.extra, jair.extraDef, jair.equipo]).toEqual([0, 0, undefined]);
    const [rojo, cami] = con('traje_rojo').heroes;
    expect([rojo.extra, rojo.extraDef]).toEqual([3, 4]);
    expect(cami.extraDef).toBe(0);
  });

  it('el gorro suma al crítico', () => {
    const s = con('gorro_navidad', 'cabeza');
    const [jair] = s.heroes;
    const e = estadoInicial(BATALLAS.nikki as DatosBatalla).heroes[0];
    e.lado = 'enemigo';
    e.clave = 'soldado';
    // 0,08 de base y 0,05 del gorro: con 0,10 es crítico solo con el gorro.
    expect(resolverGolpe(s, D, jair, e, 10, false, () => 0.1).critico).toBe(true);
    expect(resolverGolpe(estadoInicial(D), D, estadoInicial(D).heroes[0], e, 10, false, () => 0.1).critico).toBe(false);
  });

  it('con la flor no se lo puede confundir, y los rivales no lo eligen para el beso', () => {
    const s = con('flor_pureza', 'amuleto');
    const [jair, cami] = s.heroes;
    confundirA(s, jair, 3);
    expect(jair.confundido).toBe(0);
    const beso = { nombre: 'Beso', poder: 0, confunde: 3, texto: '' } as Ataque;
    expect(eligeAtaque([beso], [jair, cami])?.blancos).toEqual([cami]);
    expect(eligeAtaque([beso], [jair])).toBeNull();
  });

  it('con las prendas de sacerdotisa, el veneno hace la mitad', () => {
    const [h] = con('prendas_sacerdotisa').heroes;
    h.envenenado = { danio: 6, turnos: 3 };
    expect(tickVeneno(h, false)).toBe(3);
  });

  it('en la vida real (sin progreso) no cuenta la ropa', () => {
    expect(estadoInicial(BATALLAS.nikki as DatosBatalla, undefined).heroes[0].extraDef).toBe(0);
  });
});

describe('permanentes fuera de la pelea', () => {
  it('el caramelo sube niveles desde el actual, la experiencia vuelve a 0 y se gasta', () => {
    const v = usarPermanente({ mochila_caramelo_rancio: 2, xp_jair: 7 }, 'caramelo_rancio', 'jair', 5, O.caramelo_rancio)!;
    expect([v.nivel_jair, v.xp_jair, v.mochila_caramelo_rancio]).toEqual([15, 0, 1]);
    expect(usarPermanente({ mochila_caramelo_dulce: 1 }, 'caramelo_dulce', 'cami', 15, O.caramelo_dulce)!.nivel_cami).toBe(16);
  });

  it('sin caramelo, o con algo que no es permanente, no se puede', () => {
    expect(usarPermanente({}, 'caramelo_rancio', 'jair', 5, O.caramelo_rancio)).toBeNull();
    expect(usarPermanente({ mochila_vida: 1 }, 'vida', 'jair', 5, O.vida)).toBeNull();
  });
});

describe('Rikka empieza con su flor (decisión del autor, 2026-11-05)', () => {
  it('en una partida nueva, la flor de pureza ya está en su amuleto y le quita la confusión', async () => {
    const variables = (await import('../src/data/variables.json')).default as Record<string, unknown>;
    expect(variables.puesto_rikka_amuleto).toBe('flor_pureza');
    expect(variables.puesto_rikka_traje).toBe('prendas_sacerdotisa');
    expect(variables.puesto_cami_traje).toBe('traje_azul');
    expect(variables.puesto_cami_amuleto).toBe('placa_piloto');
    expect(bonos(['placa_piloto'], O).critico).toBeCloseTo(0.05);
    expect(quienLleva(variables as never, 'flor_pureza')).toEqual({ heroe: 'rikka', espacio: 'amuleto' });
    const p = progresoDeVars(variables as never);
    expect(bonos(Object.values(p.puestos?.rikka ?? {}), O).sinConfusion).toBe(true);
  });
});

describe('Nail roba las prendas en las termas (decisión del autor, 2026-11-05)', () => {
  const robo = { text: '', next: 'x', equipo: { quita: ['prendas_sacerdotisa'], viste: { rikka: { traje: 'traje_rojo' } } } };
  it('Rikka queda con el traje rojo puesto y las prendas desaparecen', () => {
    const v = applyChoice(robo, { puesto_rikka_traje: 'prendas_sacerdotisa', mochila_prendas_sacerdotisa: 0, mochila_traje_rojo: 0 });
    expect(v.puesto_rikka_traje).toBe('traje_rojo');
    expect(v.mochila_prendas_sacerdotisa).toBe(0);
    expect(quienLleva(v, 'prendas_sacerdotisa')).toBeNull();
  });
  it('si las llevaba otro o tenía otra cosa, igual se las roban y lo de Rikka vuelve a la mochila', () => {
    const v = applyChoice(robo, { puesto_cami_traje: 'prendas_sacerdotisa', puesto_rikka_traje: 'chaqueta_jean', mochila_chaqueta_jean: 0 });
    expect(v.puesto_cami_traje).toBe('');
    expect(v.puesto_rikka_traje).toBe('traje_rojo');
    expect(v.mochila_chaqueta_jean).toBe(1);
  });
  it('las tres opciones de la escena del traje (y su versión perturbada) hacen el cambio', async () => {
    const cap = (await import('../src/data/chapters/cap02.json')).default as { scenes: { scene_id: string; choices: { equipo?: unknown }[] }[] };
    for (const id of ['cap02_p2_029', 'cap02_p2_029_p']) {
      const e = cap.scenes.find((x) => x.scene_id === id)!;
      expect(e.choices.length).toBe(3);
      for (const c of e.choices) expect(c.equipo).toEqual(robo.equipo);
    }
  });
});

describe('Rikka vende el traje rojo y vuelve a sus prendas (decisión del autor, 2026-11-05)', () => {
  it('al volver con el kimono, el traje rojo desaparece y queda con las prendas de sacerdotisa', async () => {
    const cap = (await import('../src/data/chapters/cap02.json')).default as unknown as { scenes: Parameters<typeof alEntrar>[0][] };
    const e = cap.scenes.find((x) => x.scene_id === 'cap02_p2_092')!;
    const v = alEntrar(e, { puesto_rikka_traje: 'traje_rojo', mochila_traje_rojo: 0, mochila_prendas_sacerdotisa: 0 });
    expect(v.puesto_rikka_traje).toBe('prendas_sacerdotisa');
    expect(quienLleva(v, 'traje_rojo')).toBeNull();
    expect(v.mochila_traje_rojo).toBe(0);
  });
  it('desde ahí lo revenden en Boringplace', async () => {
    const t = (await import('../src/data/boringplace.json')).default as { tienda: { objeto: string; desbloqueo?: string }[] };
    expect(t.tienda.find((x) => x.objeto === 'traje_rojo')?.desbloqueo).toBe('cap02_p2_092');
  });
});
