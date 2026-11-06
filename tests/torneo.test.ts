// El Torneo Genesis (src/engine/torneo.ts): cada ronda de cada copa y modalidad arma una pelea válida, todos al nivel
// de la copa, la final contra Nikki (que sube con cada defensa), los premios y cuándo se abre cada copa.
import { describe, expect, it } from 'vitest';
import { TORNEO, armarRonda, copaAbierta, premioDe } from '../src/engine/torneo';

const CLAVES = ['inicio', 'refuerzos', 'jefe', 'jefe_huye', 'victoria', 'derrota', 'huir_no', 'huir', 'descanso', 'cae_jair', 'hablar_ok', 'hablar_no', 'esquiva_ok', 'botin'];

describe('Torneo Genesis', () => {
  it('cada ronda de cada copa y modalidad es una pelea válida', () => {
    for (const c of TORNEO.copas) {
      for (const m of TORNEO.modalidades) {
        const heroes = ['jair', 'cami', 'rikka'].slice(0, m.peleadores);
        TORNEO.rondas.forEach((_, i) => {
          const d = armarRonda(c, i, m, heroes);
          const donde = `${c.id}/${m.id}/ronda ${i}`;
          for (const k of heroes) expect(d.personajes[k].nivel, donde).toBe(c.nivel);
          // Termina cuando el jefe se retira: tiene que poder retirarse.
          expect(d.enemigos[d.jefe.enemigo].jefe, donde).toBe(true);
          expect(d.enemigos[d.jefe.enemigo].huye_a, donde).toBeGreaterThan(0);
          expect(d.enemigos[d.horda.enemigo], donde).toBeTruthy();
          // Equipos parejos: el jefe y los de su horda, tantos como los peleadores; los de más, de refuerzo.
          expect(d.jefe_con_horda, donde).toBe(true);
          expect(d.horda.al_inicio + 1, donde).toBe(m.peleadores);
          expect(d.horda.niveles.length, donde).toBeGreaterThanOrEqual(d.horda.al_inicio);
          for (const k of Object.keys(d.mochila_inicial ?? {})) expect(d.objetos[k], `${donde}: ${k}`).toBeTruthy();
          for (const k of CLAVES) expect(d.dialogos[k]?.length, `${donde}: ${k}`).toBeGreaterThan(0);
          for (const ls of Object.values(d.dialogos)) for (const l of ls) if (l.quien !== 'Voz') expect(d.retratos[l.quien], `${donde}: ${l.quien}`).toBeTruthy();
          expect(d.huir).toBe(false);
        });
      }
    }
  });

  it('la final es contra Nikki, sin el perdón del bar, y sube con cada defensa del título', () => {
    const c = TORNEO.copas[0];
    const m = TORNEO.modalidades[0];
    const ultima = TORNEO.rondas.length - 1;
    const a = armarRonda(c, ultima, m, ['jair'], 0);
    const b = armarRonda(c, ultima, m, ['jair'], 3);
    expect(a.jefe.enemigo).toBe('nikki');
    expect(a.enemigos.nikki.perdon).toBeUndefined();
    expect(a.jefe.nivel).toBeGreaterThan(c.nivel);
    expect(b.jefe.nivel).toBe(a.jefe.nivel + 3 * TORNEO.nikki.por_defensa);
  });

  it('premios: crecen por ronda y bajan con más peleadores', () => {
    const c = TORNEO.copas[0];
    const [simple, , triple] = TORNEO.modalidades;
    for (let i = 1; i < c.premios.length; i++) expect(premioDe(c, i, simple)).toBeGreaterThan(premioDe(c, i - 1, simple));
    expect(premioDe(c, 0, triple)).toBeLessThan(premioDe(c, 0, simple));
  });

  it('la primera copa se abre al terminar el Capítulo 1; las demás, al ganar la anterior', () => {
    const [bronce, plata] = TORNEO.copas;
    expect(copaAbierta(bronce, {}, {})).toBe(false);
    expect(copaAbierta(bronce, { cap01_g8_072: {} }, {})).toBe(true);
    expect(copaAbierta(plata, { cap01_g8_072: {} }, {})).toBe(false);
    expect(copaAbierta(plata, {}, { bronce: 1 })).toBe(true);
  });
});

describe('balance del torneo (Copa Bronce, jugador atento)', () => {
  it('la primera ronda es accesible y la final contra Nikki es la más difícil, sin ser imposible ni regalada', async () => {
    const { informe } = await import('./simulador');
    const c = TORNEO.copas[0];
    const ultima = TORNEO.rondas.length - 1;
    for (const m of TORNEO.modalidades) {
      const heroes = ['jair', 'cami', 'rikka'].slice(0, m.peleadores);
      const primera = informe(armarRonda(c, 0, m, heroes)).atento.gana;
      const final = informe(armarRonda(c, ultima, m, heroes)).atento.gana;
      expect(primera, `${m.id}: primera`).toBeGreaterThan(0.85);
      expect(final, `${m.id}: final`).toBeLessThan(primera);
      expect(final, `${m.id}: final`).toBeGreaterThan(0.03);
      if (m.peleadores < 3) expect(final, `${m.id}: final`).toBeLessThan(0.97);
    }
  }, 300000);

  // Se cumplió el 2026-11-05 con los equipos parejos (el jefe sale de entrada con su equipo): antes ~99 %, hoy ~28 %.
  it('la final en triple no está regalada', async () => {
    const { informe } = await import('./simulador');
    const m = TORNEO.modalidades[2];
    const final = informe(armarRonda(TORNEO.copas[0], TORNEO.rondas.length - 1, m, ['jair', 'cami', 'rikka'])).atento.gana;
    expect(final).toBeLessThan(0.97);
  }, 300000);
});

describe('el torneo: jefes de la torre y personajes repetidos (decisiones del autor, 2026-11-05)', () => {
  it('los 8 jefes de la torre son peleadores con sus ataques (sin lo que solo hace la máquina) y su especial', async () => {
    const { JEFES_TORRE, fichaPeleador } = await import('../src/engine/torneo');
    expect(JEFES_TORRE).toHaveLength(8);
    for (const k of JEFES_TORRE) {
      const f = fichaPeleador(k);
      expect(f.ataques.length, k).toBeGreaterThan(0);
      expect(f.ataques.every((a) => !('balas' in a) && !('peso' in a)), k).toBe(true);
      expect(f.especial, k).toBeDefined();
      expect(f.hablar.length, k).toBeGreaterThan(0);
    }
  });
  it('una ronda con el mismo personaje tres veces y con un jefe: cada uno con su identificador y con esencia', async () => {
    const { TORNEO, armarRonda } = await import('../src/engine/torneo');
    const { estadoInicial } = await import('../src/engine/turnos');
    const d = armarRonda(TORNEO.copas[0], 0, TORNEO.modalidades[2], ['jair', 'jair', 'sargento'], 0, 'torneo-1');
    const s = estadoInicial(d, undefined, d.semilla_esencia);
    expect(s.heroes.map((h) => h.id)).toEqual(['jair', 'jair#2', 'sargento']);
    expect(s.heroes.every((h) => h.esencia)).toBe(true);
  });
});

describe('los nuevos peleadores del torneo (pedido del autor, 2026-11-05)', () => {
  it('Jordy, Billy y Maggie tienen ficha, ataques y especial, y Nikki pelea como peleadora', async () => {
    const { HEROES_TORNEO, NIKKI_PELEADORA, fichaPeleador } = await import('../src/engine/torneo');
    for (const k of ['jordy', 'billy', 'maggie']) {
      expect(HEROES_TORNEO, k).toContain(k);
      const f = fichaPeleador(k);
      expect(f.ataques.length, k).toBeGreaterThanOrEqual(3);
      expect(f.especial, k).toBeDefined();
      expect(f.seguido, k).toBe(true);
    }
    const n = fichaPeleador(NIKKI_PELEADORA);
    expect(n.nombre).toBe('Nikki');
    expect(n.ataques.map((a) => a.nombre)).toContain('Beso confusión');
  });
  it('una ronda en triple con Billy, Maggie y Nikki es una pelea válida', async () => {
    const { estadoInicial } = await import('../src/engine/turnos');
    const d = armarRonda(TORNEO.copas[0], 0, TORNEO.modalidades[2], ['billy', 'maggie', 'nikki'], 0, 't');
    const s = estadoInicial(d, undefined, d.semilla_esencia);
    expect(s.heroes.map((h) => h.clave)).toEqual(['billy', 'maggie', 'nikki']);
  });
});

describe('golpes que dejan un estado (`deja`: el puño de Jordy, la hipnosis de Maggie)', () => {
  it('con la probabilidad, deja el estado; sin ella, no; a uno caído o que ya lo tiene, tampoco', async () => {
    const { dejarEstado, estadoInicial } = await import('../src/engine/turnos');
    const d = armarRonda(TORNEO.copas[0], 0, TORNEO.modalidades[0], ['jordy']);
    const s = estadoInicial(d);
    const x = s.heroes[0];
    expect(dejarEstado(s, x, { estado: 'dormido', prob: 0.5 }, () => 0.9)).toBeNull();
    expect(dejarEstado(s, x, { estado: 'dormido', prob: 0.5 }, () => 0.1)).toBe('dormido');
    expect(x.dormido).toBeGreaterThan(0);
    expect(dejarEstado(s, x, { estado: 'dormido', prob: 1 }, () => 0.1)).toBeNull();
    const y = { ...x, id: 'otro', dormido: 0, ps: 0 };
    expect(dejarEstado(s, y, { estado: 'quemado', prob: 1 }, () => 0)).toBeNull();
  });
});

describe('los seguidores del influencer (pedido del autor, 2026-11-05)', () => {
  it('gana uno al lucirse (hasta 5, +2 de ataque cada uno) y pierde uno por cada turno sin lucirse', async () => {
    const { estadoInicial, lucirse, finDeTurno } = await import('../src/engine/turnos');
    const d = armarRonda(TORNEO.copas[0], 0, TORNEO.modalidades[0], ['influencer']);
    const s = estadoInicial(d);
    const x = s.heroes[0];
    for (let i = 0; i < 7; i++) lucirse(d, x);
    expect(x.seguidores).toBe(5);
    expect(x.extra).toBe(10);
    finDeTurno(s); // se lució en este turno: no pierde
    expect(x.seguidores).toBe(5);
    finDeTurno(s); // un turno sin lucirse
    expect(x.seguidores).toBe(4);
    expect(x.extra).toBe(8);
    const otro = estadoInicial(armarRonda(TORNEO.copas[0], 0, TORNEO.modalidades[0], ['jair'])).heroes[0];
    expect(lucirse(d, otro)).toBe(false);
  });
});

describe('cuándo se puede elegir cada peleador (decisión del autor, 2026-11-06)', () => {
  it('después de su pelea RPG en la historia; el Rey Malvado y los del Capítulo 4, todavía no', async () => {
    const { peleadorAbierto } = await import('../src/engine/torneo');
    const nada = {};
    expect(peleadorAbierto('jair', nada)).toBe(true);
    expect(peleadorAbierto('cami', nada)).toBe(false);
    expect(peleadorAbierto('cami', { cap01_n05: true })).toBe(true);
    expect(peleadorAbierto('rikka', { cap02_143: true })).toBe(true);
    expect(peleadorAbierto('nikki', nada)).toBe(false);
    for (const k of ['jordy', 'billy', 'influencer', 'otaku', 'rey']) expect(peleadorAbierto(k, { cap01_n05: true, cap02_143: true }), k).toBe(false);
  });
  it('el Rey Malvado pelea con sus ataques y la Espada de las estaciones, sin transformaciones', async () => {
    const { fichaPeleador } = await import('../src/engine/torneo');
    const rey = fichaPeleador('rey');
    expect(rey.especial?.estaciones).toBe(true);
    expect(rey.nombre).not.toMatch(/gigante/i);
  });
});

describe('rivales variados (pedido del autor, 2026-11-06)', () => {
  it('con la semilla del torneo, las rondas sortean rivales distintos (personajes incluidos); la gran final sigue siendo Nikki', async () => {
    const { TORNEO, armarRonda } = await import('../src/engine/torneo');
    const { estadoInicial } = await import('../src/engine/turnos');
    const triple = TORNEO.modalidades.find((m) => m.peleadores === 3)!;
    const cruces = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const d = armarRonda(TORNEO.copas[0], 1, triple, ['jair', 'cami', 'rikka'], 0, `semilla${i}`);
      cruces.add(`${d.jefe.enemigo}+${d.horda.enemigo}`);
      // Una pelea válida: cada rival tiene su ficha y el jefe se rinde al final.
      expect(d.enemigos[d.jefe.enemigo]?.jefe).toBe(true);
      expect(d.enemigos[d.horda.enemigo]).toBeTruthy();
      expect(estadoInicial(d).heroes).toHaveLength(3);
    }
    expect(cruces.size).toBeGreaterThan(10);
    expect([...cruces].some((x) => x.includes('rival_'))).toBe(true);
    const final = armarRonda(TORNEO.copas[0], TORNEO.rondas.length - 1, triple, ['jair'], 0, 'semilla1');
    expect(final.jefe.enemigo).toBe('nikki');
  });
});
