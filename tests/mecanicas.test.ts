// Las mecánicas nuevas (docs/BIBLIA_RPG.md, sección 19): dormido, quemado y congelado, los cebos con efecto, el cebo
// explosivo, la autodestrucción, la bomba del día del juicio y el empate.
import { describe, expect, it } from 'vitest';
import { crearCebo, crearLuchador, dano, disponibles, enMochila, noActua, equipados, tickQuemado, turnosDormido, usarObjeto, type DatosBatalla, type Heroe, type Luchador } from '../src/engine/batalla';
import { conBomba, ganaBomba } from '../src/engine/torneo';
import type { Vars } from '../src/engine/types';
import { BATALLAS, FICHAS, SUELTOS_EN_VENTA, copiasLibres, sueltosQueTengo } from '../src/engine/batallas';
import { EXPLOSION_CEBO, aplicarEstado, autodestruir, decidirEnemigo, estadoInicial, finDeTurno, paralizarA, ponerBomba, reaccionCebo, resolverGolpe, resultado, tickBomba, type EstadoPelea } from '../src/engine/turnos';

const D = BATALLAS.bastion as DatosBatalla;
const fijo = (n: number) => () => n;
const soldado = (id = 's') => crearLuchador(id, 'soldado', 'enemigo', D.enemigos.soldado, 4);
const conCebo = (s: EstadoPelea, efecto: Parameters<typeof crearCebo>[2], de = s.heroes[0]) => {
  const k = crearCebo(de, 'cebo', efecto);
  s.cebos.push({ l: k, de: de.id, x: 0, y: 0, turnos: 3 });
  return k;
};

describe('dormido', () => {
  it('duerme de 2 a 4 turnos', () => {
    expect([turnosDormido(fijo(0)), turnosDormido(fijo(0.5)), turnosDormido(fijo(0.999))]).toEqual([2, 3, 4]);
  });

  it('el turno en que se duerme no cuenta y después baja hasta despertar', () => {
    const s = estadoInicial(D);
    const [h] = s.heroes;
    aplicarEstado(s, h, 'dormido', fijo(0));
    finDeTurno(s);
    expect(h.dormido).toBe(2);
    finDeTurno(s);
    finDeTurno(s);
    expect(h.dormido).toBe(0);
  });

  it('un rival dormido o congelado no actúa', () => {
    const s = estadoInicial(D);
    const e = soldado();
    e.dormido = 2;
    expect(decidirEnemigo(s, D, e).tipo).toBe('dormido');
    e.dormido = 0;
    e.congelado = 2;
    expect(decidirEnemigo(s, D, e).tipo).toBe('congelado');
  });
});

describe('dormido, congelado y paralizado: la misma mecánica', () => {
  const aplicar = (s: EstadoPelea, x: Luchador, cual: 'dormido' | 'congelado' | 'paralizado', azar: () => number) =>
    cual === 'paralizado' ? paralizarA(s, x, azar) : aplicarEstado(s, x, cual, azar);

  it.each(['dormido', 'congelado', 'paralizado'] as const)('%s: pierde el turno; un compañero con un objeto lo saca; un golpe, no', (cual) => {
    const s = estadoInicial(D);
    const [h, compa] = s.heroes;
    aplicar(s, h, cual, fijo(0.999));
    expect(h[cual]).toBe(4);
    expect(noActua(h)).toBe(true);
    expect(disponibles(s.heroes, D.personajes, [])).toEqual([compa]);
    resolverGolpe(s, D, soldado(), h, 1);
    expect(h[cual]).toBe(4);
    usarObjeto(FICHAS.objetos.veneno_ratas, h);
    expect(h[cual]).toBe(4);
    usarObjeto(FICHAS.objetos.vida, h);
    expect(h[cual]).toBe(0);
    expect(noActua(h)).toBe(false);
  });

  it.each(['dormido', 'congelado', 'paralizado'] as const)('%s, sin compañero de pie (1 vs 1): dura de 1 a 2 turnos y se pasa solo', (cual) => {
    const s = estadoInicial(D);
    const [h, compa] = s.heroes;
    compa.ps = 0;
    aplicar(s, h, cual, fijo(0));
    expect(h[cual]).toBe(1);
    h[cual] = 0;
    aplicar(s, h, cual, fijo(0.999));
    expect(h[cual]).toBe(2);
    finDeTurno(s);
    finDeTurno(s);
    expect(h[cual]).toBe(1);
    finDeTurno(s);
    expect(noActua(h)).toBe(false);
  });

  it('al rival le dura siempre de 2 a 4, aunque esté solo', () => {
    const s = estadoInicial(D);
    const e = soldado();
    s.enemigos = [e];
    aplicarEstado(s, e, 'dormido', fijo(0));
    expect(e.dormido).toBe(2);
  });
});

describe('quemado y congelado', () => {
  it('quemado: pega a la mitad y pierde vida cada turno durante 3; un jefe no baja de 1', () => {
    const h = estadoInicial(D).heroes[0];
    const e = soldado();
    const normal = dano(h, e, 50, fijo(0.5)).n;
    h.quemado = 3;
    expect(Math.abs(dano(h, e, 50, fijo(0.5)).n - normal / 2)).toBeLessThanOrEqual(1);
    const ps = h.ps;
    expect(tickQuemado(h, false)).toBeGreaterThan(0);
    expect(h.ps).toBeLessThan(ps);
    expect(h.quemado).toBe(2);
    e.ps = 1;
    e.quemado = 1;
    expect(tickQuemado(e, true)).toBe(0);
    expect(e.ps).toBe(1);
  });

});

describe('los cebos con efecto', () => {
  it.each([
    ['paraliza', 'paralizado'],
    ['veneno', 'envenenado'],
    ['confunde', 'confundido'],
    ['quema', 'quemado'],
    ['congela', 'congelado'],
    ['duerme', 'dormido'],
  ] as const)('%s: le causa %s al que lo golpea', (efecto, estado) => {
    const s = estadoInicial(D);
    const e = soldado();
    expect(reaccionCebo(s, D, conCebo(s, efecto), e)).toEqual({ tipo: 'estado', estado });
    const valor = estado === 'envenenado' ? e.envenenado : e[estado];
    expect(valor).toBeTruthy();
  });

  it('si ya lo tiene, no se acumula; el cebo común no hace nada', () => {
    const s = estadoInicial(D);
    const e = soldado();
    e.quemado = 2;
    expect(reaccionCebo(s, D, conCebo(s, 'quema'), e)).toBeNull();
    expect(e.quemado).toBe(2);
    expect(reaccionCebo(s, D, conCebo(s, undefined), e)).toBeNull();
  });

  it('el explosivo lastima al que lo atacó y a su dueño', () => {
    const s = estadoInicial(D);
    const [dueno] = s.heroes;
    const e = soldado();
    const r = reaccionCebo(s, D, conCebo(s, 'explota'), e);
    expect(r).toMatchObject({ tipo: 'explota', dueno });
    expect(e.psMax - e.ps).toBe(Math.round(e.psMax * EXPLOSION_CEBO.atacante));
    expect(dueno.psMax - dueno.ps).toBe(Math.round(dueno.psMax * EXPLOSION_CEBO.dueno));
  });

  it('todos son genéricos: cualquiera los equipa, y se venden en Boringplace', () => {
    const cebos = Object.values(SUELTOS_EN_VENTA).filter((c) => c.ataque.cebo_efecto);
    expect(cebos.map((c) => c.ataque.nombre).sort()).toEqual(['Cebo caliente', 'Cebo confuso', 'Cebo explosivo', 'Cebo frío', 'Cebo paralizante', 'Cebo sueño', 'Cebo tóxico']);
    const cami = FICHAS.heroes.cami as Heroe;
    expect(equipados(cami, 15, { ataques: ['Cebo frío'] }, sueltosQueTengo({ cebo_frio: 1 })).ataques.map((a) => a.nombre)).toEqual(['Cebo frío']);
  });
});

describe('la autodestrucción', () => {
  it('el que la usa cae y les pega a todos los demás, también a sus compañeros y a los cebos', () => {
    const s = estadoInicial(D);
    const [yo, otro] = s.heroes;
    const e = soldado();
    s.enemigos = [e];
    const k = conCebo(s, undefined, otro);
    const golpes = autodestruir(s, D, yo, 0.5);
    expect(yo.ps).toBe(0);
    expect(golpes.map((g) => g.l)).toEqual([otro, e, k]);
    expect(otro.ps).toBe(otro.psMax - Math.round(otro.psMax * 0.5));
    expect(k.ps).toBe(0);
  });

  it('un solo uso por pelea', () => {
    expect(SUELTOS_EN_VENTA.autodestruccion.ataque).toMatchObject({ autodestruccion: 0.5, usos: 1 });
  });
});

describe('la bomba del día del juicio', () => {
  const bomba = FICHAS.sueltos.bomba_juicio.especial!.bomba!;

  it('explota a los 5 turnos y le pega a todos', () => {
    const s = estadoInicial(D);
    const e = soldado();
    s.enemigos = [e];
    expect(ponerBomba(s, s.heroes[0], bomba)).toBe(true);
    expect(bomba.turnos).toBe(5);
    for (let i = 0; i < 4; i++) expect(tickBomba(s, D)).toBeNull();
    const golpes = tickBomba(s, D)!;
    expect(golpes.map((g) => g.l)).toEqual([...s.heroes, e]);
    expect(s.bomba).toBeNull();
    for (const h of s.heroes) expect(h.ps).toBe(h.psMax - Math.round(h.psMax * bomba.vida));
  });

  it('una a la vez y gasta la barra; sin bomba, no pasa nada', () => {
    const s = estadoInicial(D);
    const [h, otro] = s.heroes;
    h.carga = 100;
    expect(tickBomba(s, D)).toBeNull();
    ponerBomba(s, h, bomba);
    expect(h.carga).toBe(0);
    expect(ponerBomba(s, otro, bomba)).toBe(false);
  });

  it('no hace retirar sola al jefe: queda justo por encima y falta el último golpe', () => {
    const d = BATALLAS.nikki as DatosBatalla;
    const s = estadoInicial(d);
    const nikki = crearLuchador('n', 'nikki', 'enemigo', d.enemigos.nikki, 20);
    s.enemigos = [nikki];
    s.heroes[0].psMax = 1000;
    s.heroes[0].ps = 1000;
    ponerBomba(s, s.heroes[0], { turnos: 1, vida: 0.9 });
    tickBomba(s, d);
    expect(nikki.ps).toBe(Math.floor(nikki.psMax * d.enemigos.nikki.huye_a!) + 1);
    expect(resultado(s, d)).toBeNull();
  });

  it('si la bomba se lleva a todos los héroes con el jefe en el campo, es empate', () => {
    const d = BATALLAS.nikki as DatosBatalla;
    const s = estadoInicial(d);
    s.enemigos = [crearLuchador('n', 'nikki', 'enemigo', d.enemigos.nikki, 20)];
    s.heroes[0].ps = 1;
    ponerBomba(s, s.heroes[0], { turnos: 1, vida: 0.9 });
    tickBomba(s, d);
    expect(s.heroes[0].ps).toBe(0);
    expect(resultado(s, d)).toBe('empate');
  });

  it('en el torneo: se gana la primera vez de cada copa y queda en la partida elegida', () => {
    expect(ganaBomba({}, 'bronce')).toBe(true);
    expect(ganaBomba({ bronce: 1 }, 'bronce')).toBe(false);
    expect(ganaBomba({ bronce: 1 }, 'plata')).toBe(true);
    const p = conBomba(conBomba({ vars: {} as Vars }));
    expect(p.vars.cassette_bomba_juicio).toBe(2);
  });

  it('es un especial genérico, se equipa como especial, no se vende y se cuentan sus copias', () => {
    expect(SUELTOS_EN_VENTA.bomba_juicio).toBeUndefined();
    const jair = FICHAS.heroes.jair as Heroe;
    const sueltos = sueltosQueTengo({ bomba_juicio: 1 });
    expect(enMochila(jair, 5, undefined, sueltos).especiales.map((e) => e.nombre)).toContain('Bomba del día del juicio');
    expect(equipados(jair, 5, undefined, sueltos).especiales.map((e) => e.nombre)).not.toContain('Bomba del día del juicio');
    const eq = { especiales: ['Bomba del día del juicio'] };
    expect(equipados(jair, 5, eq, sueltos).especiales[0].bomba).toBeTruthy();
    expect(copiasLibres('bomba_juicio', { bomba_juicio: 1 }, { jair: eq })).toBe(0);
  });
});

describe('el empate', () => {
  const todos = (s: EstadoPelea, ls: Luchador[]) => ls.forEach((l) => (l.ps = 0)) ?? s;

  it('si caen todos, es empate; si queda un rival, se pierde; si queda un héroe, sigue', () => {
    const s = estadoInicial(D);
    const e = soldado();
    s.enemigos = [e];
    expect(resultado(s, D)).toBeNull();
    todos(s, s.heroes);
    expect(resultado(s, D)).toBe('pierde');
    e.ps = 0;
    expect(resultado(s, D)).toBe('empate');
    s.heroes[0].ps = 1;
    expect(resultado(s, D)).toBeNull();
  });

  it('caen los héroes y el jefe queda por retirarse: también es empate', () => {
    const d = BATALLAS.nikki as DatosBatalla;
    const s = estadoInicial(d);
    const nikki = crearLuchador('n', 'nikki', 'enemigo', d.enemigos.nikki, 20);
    nikki.ps = 1;
    s.enemigos = [nikki];
    todos(s, s.heroes);
    expect(resultado(s, d)).toBe('empate');
  });
});
