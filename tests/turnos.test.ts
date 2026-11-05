// La lógica de turnos sin dibujo (src/engine/turnos.ts; etapa 2 de partir Batalla.tsx): el estado con que empieza
// la pelea, qué decide cada enemigo, los cebos y el fin del turno.
import { describe, expect, it } from 'vitest';
import { CARGA, crearCebo, crearLuchador, yaTiene, type DatosBatalla, type Luchador } from '../src/engine/batalla';
import { BATALLAS } from '../src/engine/batallas';
import {
  blancoDelCanon,
  decidirEnemigo,
  desviarACebo,
  envenenarConBola,
  estadoInicial,
  evaporarClones,
  estadosTerminados,
  finDeTurno,
  fotoEstados,
  sufreAlFinal,
  quemarConEspecial,
  aplicarEstado,
  golpesDelCanon,
  hacerClon,
  llegaRefuerzo,
  paralizarA,
  poderBarrido,
  resolverGolpe,
  sumarEnemigo,
} from '../src/engine/turnos';

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

describe('reglas compartidas con el simulador', () => {
  const D = () => BATALLAS.bastion as DatosBatalla;

  it('protegido: el golpe no hace nada, gasta la protección y no carga la barra', () => {
    const s = estadoInicial(D());
    const [h] = s.heroes;
    const e = enemigo(D(), 'soldado');
    h.protegido = 1;
    const ps = h.ps;
    expect(resolverGolpe(s, D(), e, h, 50)).toMatchObject({ n: 0, bloqueado: true });
    expect([h.ps, h.protegido, h.carga]).toEqual([ps, 0, 0]);
  });

  it('a medias: hace la mitad (al menos 1); recibir carga la barra', () => {
    const s = estadoInicial(D());
    const [h] = s.heroes;
    const e = enemigo(D(), 'soldado');
    const azar = fijo(0.99);
    const entero = resolverGolpe(s, D(), e, h, 10, false, azar).n;
    h.ps = h.psMax;
    expect(resolverGolpe(s, D(), e, h, 10, true, azar).n).toBe(Math.max(1, Math.round(entero / 2)));
    expect(h.carga).toBe(CARGA.recibir * 2);
  });

  it('el jefe que se retira nunca llega a 0; su clon, sí', () => {
    const d = BATALLAS.nikki as DatosBatalla;
    const s = estadoInicial(d);
    const nikki = enemigo(d, 'nikki', 20);
    resolverGolpe(s, d, s.heroes[0], nikki, 100000);
    expect(nikki.ps).toBe(1);
    const k = enemigo(d, 'nikki', 20);
    k.clon = 3;
    resolverGolpe(s, d, s.heroes[0], k, 100000);
    expect(k.ps).toBe(0);
  });

  it('paralizar reemplaza el descanso; los refuerzos llegan solo con los de la horda', () => {
    const s = estadoInicial(D());
    const [h] = s.heroes;
    s.actuaron = [h.id];
    s.cansados.add(h.id);
    paralizarA(s, h, fijo(0));
    expect([h.paralizado, s.actuaron.length, s.cansados.size, s.paralizadoRecien[0]]).toEqual([2, 0, 0, h.id]);
    const soldado = enemigo(D(), D().horda.enemigo);
    expect(llegaRefuerzo(s, D(), soldado)).toBe(true);
    expect(llegaRefuerzo(s, D(), enemigo(D(), D().jefe.enemigo))).toBe(false);
    s.salieron = D().horda.niveles.length;
    expect(llegaRefuerzo(s, D(), soldado)).toBe(false);
  });

  it('el clon cuesta vida y se evapora al terminar sus turnos', () => {
    const d = BATALLAS.nikki as DatosBatalla;
    const s = estadoInicial(d);
    const nikki = sumarEnemigo(s, d, 'nikki', 20, fijo(0));
    const c = d.enemigos.nikki.clon!;
    const { clon, costo } = hacerClon(s, c, nikki, 'clon-1');
    expect(nikki.ps).toBe(nikki.psMax - costo);
    expect(s.enemigos).toContain(clon);
    for (let i = 0; i < c.turnos; i++) expect(evaporarClones(s)).toEqual([]);
    expect(evaporarClones(s)).toEqual([clon]);
    expect(clon.ps).toBe(0);
  });

  it('el veneno de la bola no se acumula y al que esquiva le dura un turno menos', () => {
    const s = estadoInicial(D());
    const [h, otro] = s.heroes;
    envenenarConBola(h, { danio: 6, turnos: 3 }, true);
    expect(h.envenenado?.turnos).toBe(2);
    envenenarConBola(h, { danio: 9, turnos: 9 });
    expect(h.envenenado?.danio).toBe(6);
    otro.ps = 0;
    envenenarConBola(otro, { danio: 6, turnos: 3 });
    expect(otro.envenenado).toBeNull();
  });

  it('el cañón: un solo golpe fuerte, el primer rayo horizontal; cada barrido nuevo es flojo', () => {
    const rayo = { 1: [0, 0, 0], 2: [0, 0, -5], 3: [0, 0, 5] };
    expect(golpesDelCanon([0, 1, 1, 2, 2, 3, 0, 1], rayo)).toEqual([
      { ms: 1, fuerte: true },
      { ms: 3, fuerte: false },
      { ms: 5, fuerte: false },
      { ms: 7, fuerte: false },
    ]);
    expect(poderBarrido(24)).toBe(4);
    expect(poderBarrido(6)).toBe(3);
  });

  it('a quién le da el cañón: el fuerte a su blanco; los barridos, a otro; sin nadie de pie, a nadie', () => {
    const s = estadoInicial(D());
    const [a, b] = s.heroes;
    expect(blancoDelCanon(s.heroes, a, true)).toBe(a);
    expect(blancoDelCanon(s.heroes, a, false)).toBe(b);
    b.ps = 0;
    expect(blancoDelCanon(s.heroes, a, false)).toBe(a);
    a.ps = 0;
    expect(blancoDelCanon(s.heroes, a, true)).toBeNull();
  });
});

describe('aviso de fin de estado', () => {
  it('dice qué estados se le pasaron a cada uno (por turnos o por un objeto), y no a los caídos', () => {
    const d = D('bastion');
    const a = enemigo(d, Object.keys(d.enemigos)[0]);
    const b = { ...enemigo(d, Object.keys(d.enemigos)[0]), id: 'otro' };
    a.dormido = 1;
    a.quemado = 2;
    b.paralizado = 1;
    const antes = fotoEstados([a, b]);
    a.dormido = 0; // se despierta
    b.paralizado = 0; // se le pasa, pero cayó
    b.ps = 0;
    expect(estadosTerminados(antes, [a, b]).map((x) => [x.l.id, x.estado])).toEqual([[a.id, 'dormido']]);
  });
});

describe('veneno y quemadura: desde el turno siguiente', () => {
  it('al que lo envenenan o queman durante el turno no le baja la vida al final de ese turno', () => {
    const d = D('bastion');
    const ya = enemigo(d, Object.keys(d.enemigos)[0]);
    const nuevo = { ...enemigo(d, Object.keys(d.enemigos)[0]), id: 'nuevo' };
    ya.envenenado = { danio: 3, turnos: 3 };
    const alEmpezar = fotoEstados([ya, nuevo]);
    nuevo.envenenado = { danio: 3, turnos: 3 };
    nuevo.quemado = 3;
    expect(sufreAlFinal(alEmpezar, ya, 'envenenado')).toBe(true);
    expect(sufreAlFinal(alEmpezar, nuevo, 'envenenado')).toBe(false);
    expect(sufreAlFinal(alEmpezar, nuevo, 'quemado')).toBe(false);
    // Al turno siguiente, ya le toca.
    expect(sufreAlFinal(fotoEstados([nuevo]), nuevo, 'envenenado')).toBe(true);
  });
});

describe('turno libre al salir de dormido, congelado o paralizado', () => {
  it('al despertarse no se lo puede volver a dormir, congelar ni paralizar ese turno; después, sí', () => {
    const d = D('bastion');
    const s = estadoInicial(d);
    const e = enemigo(d, Object.keys(d.enemigos)[0]);
    s.enemigos = [e];
    expect(aplicarEstado(s, e, 'dormido', fijo(0))).toBe(true);
    // Dormido: no se le pone otro de los tres encima.
    expect(aplicarEstado(s, e, 'congelado', fijo(0))).toBe(false);
    expect(yaTiene(e, { paraliza: 1 })).toBe('dormido');
    finDeTurno(s); // el turno en que lo durmieron no cuenta
    while (e.dormido) finDeTurno(s);
    expect(e.inmuneParalisis).toBe(1);
    expect(aplicarEstado(s, e, 'dormido', fijo(0))).toBe(false);
    expect(aplicarEstado(s, e, 'congelado', fijo(0))).toBe(false);
    expect(yaTiene(e, { paraliza: 1 })).toBe('paralizado');
    finDeTurno(s); // pasó su turno libre
    expect(aplicarEstado(s, e, 'congelado', fijo(0))).toBe(true);
  });
});

describe('la Ráfaga de puños de Jair a veces quema', () => {
  it('con 10 %: una tirada por uso; quema al blanco si sale, nada si no', () => {
    const d = D('bastion');
    const s = estadoInicial(d);
    const esp = d.personajes.jair.especial!;
    expect(esp.quema).toBe(0.1);
    const e = enemigo(d, Object.keys(d.enemigos)[0]);
    expect(quemarConEspecial(s, esp, [e], fijo(0.5))).toEqual([]);
    expect(quemarConEspecial(s, esp, [e], fijo(0.05))).toEqual([e]);
    expect(e.quemado).toBeGreaterThan(0);
  });
});
