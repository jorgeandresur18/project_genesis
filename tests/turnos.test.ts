// La lógica de turnos sin dibujo (src/engine/turnos.ts; etapa 2 de partir Batalla.tsx): el estado con que empieza
// la pelea, qué decide cada enemigo, los cebos y el fin del turno.
import { describe, expect, it } from 'vitest';
import { CARGA, crearCebo, crearLuchador, type DatosBatalla, type Luchador } from '../src/engine/batalla';
import { BATALLAS } from '../src/engine/batallas';
import { decidirEnemigo, desviarACebo, estadoInicial, finDeTurno } from '../src/engine/turnos';

const D = (id: string) => BATALLAS[id] as DatosBatalla;
/** Un azar que siempre devuelve lo mismo. */
const fijo = (n: number) => () => n;
const enemigo = (d: DatosBatalla, clave: string, nivel = 10): Luchador => crearLuchador(`${clave}-0`, clave, 'enemigo', d.enemigos[clave], nivel);

describe('estado inicial de la pelea', () => {
  it('sin progreso: los héroes con el nivel de su ficha, sin enemigos, sin monedas', () => {
    const d = D('bastion');
    const s = estadoInicial(d);
    expect(s.heroes.map((h) => h.clave)).toEqual(d.heroes);
    s.heroes.forEach((h) => expect(h.nivel).toBe(d.personajes[h.clave].nivel));
    expect(s.enemigos).toEqual([]);
    expect(s.monedas).toBe(0);
    expect(s.salieron).toBe(0);
    expect(s.cansados.size).toBe(0);
  });

  it('con progreso: niveles, experiencia y monedas de la partida; la mochila inicial completa lo que falte', () => {
    const d = { ...D('bastion'), mochila_inicial: { agua: 2, revivir: 1 } } as DatosBatalla;
    const s = estadoInicial(d, { heroes: { jair: { nivel: 7, xp: 3 } }, mochila: { agua: 5, revivir: 0, chicle: 1 }, monedas: 40 });
    const jair = s.heroes.find((h) => h.clave === 'jair')!;
    expect([jair.nivel, jair.xp]).toEqual([7, 3]);
    // Cami no viene en el progreso: usa su ficha.
    expect(s.heroes.find((h) => h.clave === 'cami')!.nivel).toBe(d.personajes.cami.nivel);
    expect(s.monedas).toBe(40);
    expect(s.mochila).toEqual({ agua: 5, revivir: 1, chicle: 1 });
  });
});

describe('qué decide un enemigo', () => {
  it('siempre carga su barra; paralizado no hace nada', () => {
    const d = D('bastion');
    const s = estadoInicial(d);
    const e = enemigo(d, 'soldado');
    e.paralizado = 2;
    expect(decidirEnemigo(s, d, e, false, fijo(0.5))).toEqual({ tipo: 'paralizado' });
    expect(e.carga).toBe(CARGA.turnoEnemigo);
  });

  it('distraído: pierde el ataque y se le pasa la distracción', () => {
    const d = D('bastion');
    const s = estadoInicial(d);
    const e = enemigo(d, 'soldado');
    e.distraido = true;
    expect(decidirEnemigo(s, d, e, false, fijo(0.99)).tipo).toBe('distraido');
    expect(e.distraido).toBe(false);
  });

  it('un ataque normal gasta su uso y va contra un héroe de pie', () => {
    const d = D('bastion');
    const s = estadoInicial(d);
    s.heroes[0].ps = 0;
    const e = enemigo(d, 'soldado');
    const r = decidirEnemigo(s, d, e, false, fijo(0.99));
    expect(r.tipo).toBe('ataque');
    if (r.tipo !== 'ataque') return;
    expect(r.blancos.every((h) => h.ps > 0)).toBe(true);
    if (r.ataque.usos !== undefined) expect(e.usados?.[r.ataque.nombre]).toBe(1);
  });

  it('Nikki: si la traicionaron, la Mega Bola va contra el traidor (y la traición se gasta)', () => {
    const d = D('nikki');
    const s = estadoInicial(d);
    const nikki = enemigo(d, 'nikki', 20);
    s.enemigos = [nikki];
    s.traicion = s.heroes[0].id;
    const r = decidirEnemigo(s, d, nikki, false, fijo(0.99));
    expect(r).toEqual({ tipo: 'bola', traidor: s.heroes[0] });
    expect(s.traicion).toBeNull();
  });

  it('Nikki: después de la Mega Bola, remata con una cachetada (no la confusión) y el remate se gasta', () => {
    const d = D('nikki');
    const s = estadoInicial(d);
    const nikki = enemigo(d, 'nikki', 20);
    s.enemigos = [nikki];
    s.remate = s.heroes[0].id;
    const r = decidirEnemigo(s, d, nikki, false, fijo(0.99));
    expect(r.tipo).toBe('remate');
    if (r.tipo !== 'remate') return;
    expect(r.blanco).toBe(s.heroes[0]);
    expect(r.golpe.confunde).toBeFalsy();
    expect(s.remate).toBeNull();
  });
});

describe('cebos', () => {
  it('sin cebos, el golpe va a quien iba', () => {
    const s = estadoInicial(D('bastion'));
    expect(desviarACebo(s, [s.heroes[0]], 1, fijo(0))).toEqual([s.heroes[0]]);
  });

  it('a uno solo: cae en el cebo según la probabilidad de quien ataca', () => {
    const s = estadoInicial(D('bastion'));
    const k = crearCebo(s.heroes[0], 'cebo-1');
    s.cebos.push({ l: k, de: s.heroes[0].id, x: 0, y: 0, turnos: 3 });
    expect(desviarACebo(s, [s.heroes[0]], 0.5, fijo(0.2))).toEqual([k]);
    expect(desviarACebo(s, [s.heroes[0]], 0.5, fijo(0.8))).toEqual([s.heroes[0]]);
  });

  it('a varios: les pega también a todos los cebos en pie', () => {
    const s = estadoInicial(D('bastion'));
    const k = crearCebo(s.heroes[0], 'cebo-1');
    s.cebos.push({ l: k, de: s.heroes[0].id, x: 0, y: 0, turnos: 3 });
    expect(desviarACebo(s, s.heroes, 0, fijo(0.99))).toEqual([...s.heroes, k]);
  });
});

describe('fin del turno', () => {
  it('nadie sigue esquivando; la parálisis y la confusión de este turno recién bajan desde el siguiente', () => {
    const s = estadoInicial(D('bastion'));
    const [a, b] = s.heroes;
    a.esquivando = true;
    a.paralizado = 2;
    b.paralizado = 2;
    b.confundido = 2;
    s.paralizadoRecien = [b.id];
    s.confundidoRecien = [b.id];
    finDeTurno(s);
    expect(a.esquivando).toBe(false);
    expect([a.paralizado, b.paralizado, b.confundido]).toEqual([1, 2, 2]);
    expect(s.paralizadoRecien).toEqual([]);
    expect(s.confundidoRecien).toEqual([]);
  });

  it('al salir de la parálisis queda un turno de respiro', () => {
    const s = estadoInicial(D('bastion'));
    const h = s.heroes[0];
    h.paralizado = 1;
    finDeTurno(s);
    expect([h.paralizado, h.inmuneParalisis]).toEqual([0, 1]);
    finDeTurno(s);
    expect(h.inmuneParalisis).toBe(0);
  });
});
