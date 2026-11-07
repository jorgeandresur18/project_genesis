// El turno de los héroes sin dibujo (src/engine/turnos.ts, etapa 3 de partir Batalla.tsx): a quién le llega un
// objeto, cuándo se pierde la acción, qué tipo de ataque es, hablar y pedir perdón.
import { describe, expect, it } from 'vitest';
import { crearLuchador, type Ataque, type DatosBatalla, type Luchador } from '../src/engine/batalla';
import { BATALLAS } from '../src/engine/batallas';
import {
  cortarRacha,
  curarse,
  decidirEnemigo,
  finDeTurno,
  ponerEspinas,
  resolverGolpe,
  efectoRepetido,
  estadoInicial,
  hablarFunciona,
  objetivoVivo,
  pedirPerdon,
  puedeActuarHeroe,
  resolverObjeto,
  sumarEnemigo,
  tienePrioridad,
  tipoDeAtaque,
} from '../src/engine/turnos';

const D = () => BATALLAS.bastion as DatosBatalla;
/** Bastión con dos soldados en el campo y la mochila vacía. */
function pelea() {
  const d = D();
  const s = estadoInicial(d);
  const e1 = sumarEnemigo(s, d, 'soldado', 3);
  const e2 = sumarEnemigo(s, d, 'soldado', 3);
  for (const k of Object.keys(d.objetos)) s.mochila[k] = 0;
  const [jair, cami] = s.heroes;
  return { d, s, jair, cami, e1, e2 };
}
const atacar = { tipo: 'atacar', ataque: 0, objetivo: '' } as const;
const usar = (clave: string, objetivo: string) => ({ tipo: 'objeto', clave, objetivo }) as const;
const ataque = (a: Record<string, unknown>) => ({ nombre: 'x', poder: 10, texto: '', ...a }) as unknown as Ataque;

describe('a quién le llega un objeto', () => {
  it('a uno: al elegido, de cualquier lado', () => {
    const { d, s, cami, e1 } = pelea();
    expect(resolverObjeto(s, d, usar('vida', cami.id))).toEqual({ tipo: 'usa', blancos: [cami], protegidos: [] });
    // Libres: también se le puede dar al rival (aunque sea una curación).
    expect(resolverObjeto(s, d, usar('vida', e1.id))).toMatchObject({ tipo: 'usa', blancos: [e1] });
  });

  it('de grupo: a todo el lado del elegido (los caídos, no)', () => {
    const { d, s, jair, cami, e1, e2 } = pelea();
    expect(resolverObjeto(s, d, usar('galleta_arcoiris', jair.id))).toMatchObject({ blancos: [jair, cami] });
    cami.ps = 0;
    expect(resolverObjeto(s, d, usar('galleta_arcoiris', jair.id))).toMatchObject({ blancos: [jair] });
    expect(resolverObjeto(s, d, usar('galleta_arcoiris', e2.id))).toMatchObject({ blancos: [e1, e2] });
  });

  it('si el elegido cayó, nadie lo recibe y vuelve a la mochila', () => {
    const { d, s, e1 } = pelea();
    e1.ps = 0;
    expect(resolverObjeto(s, d, usar('vida', e1.id))).toEqual({ tipo: 'nadie', revive: false });
    expect(s.mochila.vida).toBe(1);
  });

  it('revivir: solo a un caído; si ya se levantó, vuelve a la mochila', () => {
    const { d, s, cami } = pelea();
    expect(resolverObjeto(s, d, usar('revivir', cami.id))).toEqual({ tipo: 'nadie', revive: true });
    expect(s.mochila.revivir).toBe(1);
    cami.ps = 0;
    expect(resolverObjeto(s, d, usar('revivir', cami.id))).toMatchObject({ tipo: 'usa', blancos: [cami] });
  });

  it('si ya tiene ese estado, no se gasta (un solo estado a la vez)', () => {
    const { d, s, e1 } = pelea();
    e1.confundido = 2;
    expect(resolverObjeto(s, d, usar('pastillas_felices', e1.id))).toMatchObject({ tipo: 'ya', estado: 'confundido' });
    expect(s.mochila.pastillas_felices).toBe(1);
  });

  it('al que protege su equipo de la confusión no le hace nada, pero el objeto se gasta', () => {
    const { d, s, e1 } = pelea();
    e1.equipo = { ...(e1.equipo ?? {}), sinConfusion: true } as Luchador['equipo'];
    expect(resolverObjeto(s, d, usar('pastillas_felices', e1.id))).toEqual({ tipo: 'usa', blancos: [], protegidos: [e1] });
    expect(s.mochila.pastillas_felices).toBe(0);
  });
});

describe('cuándo un héroe pierde su acción', () => {
  it('caído, dormido, congelado, paralizado o desterrado: no actúa y el objeto vuelve a la mochila', () => {
    for (const quitar of [{ ps: 0 }, { dormido: 1 }, { congelado: 1 }, { paralizado: 1 }, { desterrado: 2 }]) {
      const { s, jair, cami } = pelea();
      Object.assign(jair, quitar);
      expect(puedeActuarHeroe(s, jair, usar('vida', cami.id))).toBe(false);
      expect(s.mochila.vida).toBe(1);
    }
  });

  it('sin enemigos en pie: atacar y hablar se pierden; esquivar y los objetos, no', () => {
    const { s, jair, cami, e1, e2 } = pelea();
    e1.ps = e2.ps = 0;
    expect(puedeActuarHeroe(s, jair, atacar)).toBe(false);
    expect(puedeActuarHeroe(s, jair, { tipo: 'hablar', objetivo: e1.id })).toBe(false);
    expect(puedeActuarHeroe(s, jair, { tipo: 'esquivar' })).toBe(true);
    expect(puedeActuarHeroe(s, jair, usar('vida', cami.id))).toBe(true);
    expect(s.mochila.vida).toBe(0);
  });

  it('si su objetivo cayó, va contra el primero que quede', () => {
    const { s, e1, e2 } = pelea();
    expect(objetivoVivo(s, e2.id)).toBe(e2);
    e2.ps = 0;
    expect(objetivoVivo(s, e2.id)).toBe(e1);
  });
});

describe('el orden y el tipo de cada acción', () => {
  it('van primero esquivar, los objetos, los cebos y lo que se hace sobre sí mismo', () => {
    expect(tienePrioridad({ tipo: 'esquivar' })).toBe(true);
    expect(tienePrioridad(usar('vida', 'x'))).toBe(true);
    expect(tienePrioridad(atacar, ataque({ cebo: true }))).toBe(true);
    expect(tienePrioridad(atacar, ataque({ alMismo: true }))).toBe(true);
    expect(tienePrioridad(atacar, ataque({}))).toBe(false);
    expect(tienePrioridad({ tipo: 'especial', objetivo: '', cual: 0 })).toBe(false);
  });

  it('el tipo de un ataque, en el orden en que lo revisa la pelea', () => {
    expect(tipoDeAtaque(ataque({ cebo: true }))).toBe('cebo');
    expect(tipoDeAtaque(ataque({ cura: 0.3 }))).toBe('cura');
    expect(tipoDeAtaque(ataque({ alMismo: true, aplica: { atq: 2 } }))).toBe('al_mismo');
    // Sobre sí mismo pero sin efecto: es un golpe normal.
    expect(tipoDeAtaque(ataque({ alMismo: true }))).toBe('golpe');
    expect(tipoDeAtaque(ataque({ objetivo: 'todos', confunde: 2 }))).toBe('todos');
    expect(tipoDeAtaque(ataque({ confunde: 2, paraliza: 1 }))).toBe('confunde');
    expect(tipoDeAtaque(ataque({ paraliza: 1 }))).toBe('paraliza');
    expect(tipoDeAtaque(ataque({}))).toBe('golpe');
  });

  it('un ataque de efecto contra quien ya tiene un estado: pierde el turno, pero no el uso', () => {
    const { jair, e1 } = pelea();
    const beso = ataque({ nombre: 'Beso', confunde: 2 });
    jair.usados = { Beso: 1 };
    expect(efectoRepetido(jair, e1, beso)).toBeNull();
    e1.confundido = 2;
    expect(efectoRepetido(jair, e1, beso)).toBe('confundido');
    expect(jair.usados.Beso).toBe(0);
    // Un golpe normal nunca se repite.
    expect(efectoRepetido(jair, e1, ataque({}))).toBeNull();
  });

  it('curarse: una parte de la vida máxima, sin pasarse', () => {
    const { jair } = pelea();
    jair.ps = 1;
    expect(curarse(jair, 0.25)).toBe(Math.round(jair.psMax * 0.25));
    jair.ps = jair.psMax - 1;
    expect(curarse(jair, 0.5)).toBe(1);
    expect(jair.ps).toBe(jair.psMax);
  });
});

describe('hablar y pedir perdón', () => {
  it('hablar distrae según la probabilidad de la pelea; al jefe y a un clon, nunca', () => {
    const { d, s, e1 } = pelea();
    expect(hablarFunciona(d, e1, () => d.hablar - 0.01)).toBe(true);
    expect(hablarFunciona(d, e1, () => d.hablar)).toBe(false);
    const jefe = sumarEnemigo(s, d, d.jefe.enemigo, d.jefe.nivel);
    expect(hablarFunciona(d, jefe, () => 0)).toBe(false);
    const clon = crearLuchador('c', 'soldado', 'enemigo', d.enemigos.soldado, 3);
    clon.clon = 1;
    expect(hablarFunciona(d, clon, () => 0)).toBe(false);
  });

  it('pedir perdón: tantas veces seguidas y perdona', () => {
    const { s } = pelea();
    expect(pedirPerdon(s, 3)).toEqual({ vez: 0, perdona: false });
    expect(pedirPerdon(s, 3)).toEqual({ vez: 1, perdona: false });
    expect(pedirPerdon(s, 3)).toEqual({ vez: 2, perdona: true });
  });

  it('hacer otra cosa corta la racha; atacar es traición (en la arena, no)', () => {
    const { s, jair } = pelea();
    expect(cortarRacha(s, jair, atacar)).toBe(false);
    s.racha = 2;
    expect(cortarRacha(s, jair, { tipo: 'hablar', objetivo: '' })).toBe(false);
    expect(s.racha).toBe(2);
    expect(cortarRacha(s, jair, { tipo: 'esquivar' })).toBe(true);
    expect([s.racha, s.traicion]).toEqual([0, null]);
    s.racha = 1;
    cortarRacha(s, jair, atacar, true);
    expect(s.traicion).toBeNull();
    s.racha = 1;
    cortarRacha(s, jair, { tipo: 'especial', objetivo: '', cual: 0 });
    expect(s.traicion).toBe(jair.id);
  });
});

describe('el modo bola de la sombra de roca (idea del autor, 2026-11-07)', () => {
  const roca = () => {
    const d = BATALLAS.sombra_roca as DatosBatalla;
    const s = estadoInicial(d);
    const e = sumarEnemigo(s, d, 'sombra_roca', 20);
    const [jair, cami] = s.heroes;
    const esp = d.enemigos.sombra_roca.especiales!.find((x) => x.espinas)!;
    return { d, s, e, jair, cami, esp, bola: esp.espinas! };
  };

  it('es un especial: gasta la barra, sube su DEF por 3 o 4 turnos (desde el siguiente) y después la devuelve', () => {
    const { d, s, e } = roca();
    const def = e.extraDef;
    const soloBola = { ...d, enemigos: { ...d.enemigos, sombra_roca: { ...d.enemigos.sombra_roca, especial: d.enemigos.sombra_roca.especiales![0], especiales: [] } } } as DatosBatalla;
    e.carga = 100;
    const r = decidirEnemigo(s, soloBola, e, false, () => 0.99);
    expect(r).toMatchObject({ tipo: 'especial', especial: { nombre: 'Bola de espinas' } });
    expect(e.carga).toBe(0);
    expect(e.espinas?.turnos).toBe(4);
    expect(e.extraDef).toBe(def + e.espinas!.def);
    finDeTurno(s);
    expect(e.espinas?.turnos).toBe(4);
    for (let i = 0; i < 4; i++) finDeTurno(s);
    expect(e.espinas).toBeUndefined();
    expect(e.extraDef).toBe(def);
  });

  it('mientras es bola no carga el especial (ni en su turno ni con los golpes)', () => {
    const { d, s, e, jair, bola } = roca();
    ponerEspinas(e, bola);
    e.carga = 0;
    decidirEnemigo(s, d, e, false, () => 0.5);
    resolverGolpe(s, d, jair, e, 20, false, () => 0.5);
    expect(e.carga).toBe(0);
  });

  it('dura 3 o 4 turnos, al azar', () => {
    const { e, bola } = roca();
    ponerEspinas(e, bola, () => 0);
    expect(e.espinas?.turnos).toBe(3);
  });

  it('mientras es bola: ni especiales ni sus otros ataques, solo rueda contra uno', () => {
    const { d, s, e, bola } = roca();
    ponerEspinas(e, bola);
    for (let i = 0; i < 20; i++) {
      e.carga = 100;
      const r = decidirEnemigo(s, d, e, false, () => (i % 10) / 10);
      expect(r).toMatchObject({ tipo: 'ataque', ataque: { nombre: 'Rodar' } });
      if (r.tipo === 'ataque') expect(r.blancos).toHaveLength(1);
    }
  });

  it('las espinas pinchan al que pega de cerca (menos que lo que pega la bola, al menos 1, sin matar); las balas de Cami, no', () => {
    const { d, s, e, jair, cami, bola } = roca();
    ponerEspinas(e, bola);
    const antes = jair.ps;
    const g = resolverGolpe(s, d, jair, e, 40, false, () => 0.5);
    expect(g.espinas).toBe(Math.max(1, Math.round(g.n * bola.devuelve)));
    expect(jair.ps).toBe(antes - g.espinas!);
    jair.ps = 1;
    expect(resolverGolpe(s, d, jair, e, 40, false, () => 0.5).espinas).toBeUndefined();
    expect(jair.ps).toBe(1);
    expect(d.personajes.cami.distancia).toBe(true);
    const ps = cami.ps;
    expect(resolverGolpe(s, d, cami, e, 40, false, () => 0.5).espinas).toBeUndefined();
    expect(cami.ps).toBe(ps);
  });
});
