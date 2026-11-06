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
          expect(d.horda.niveles, donde).toHaveLength(d.horda.al_inicio);
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

  // META INCUMPLIDA HOY (2026-11-04): el torneo es de relleno. La simulación vieja no contaba la mochila fija (2 aguas y
  // un Elixit) y daba ~93 %; con ella, la final en triple sale ~99 %. `it.fails` avisa cuando se balancee: ahí, a `it`.
  it.fails('la final en triple no está regalada', async () => {
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
