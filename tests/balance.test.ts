// Balance de las peleas: se simulan miles con dos jugadores, el descuidado y el atento (tests/simulador.ts, que juega
// con las mismas reglas que el juego). La meta (docs/SPEC.md): que el descuidado pierda casi siempre y que el atento
// gane casi siempre, pero llegando justo. Si cambias números en src/data/batallas/ y esto falla, la pelea quedó muy
// fácil o muy difícil. Para ver los números: `npx vitest run tests/balance.test.ts --disable-console-intercept`.
import { describe, expect, it } from 'vitest';
import { BATALLAS } from '../src/engine/batallas';
import { informe, sim } from './simulador';


describe('balance del Bastión', () => {
  const D = BATALLAS.bastion;
  it('el jugador descuidado gana pocas veces (entre 10 % y 55 %)', () => {
    const r = sim(D, false);
    console.log('balance', JSON.stringify(informe(D)));
    expect(r.gana).toBeGreaterThan(0.1);
    expect(r.gana).toBeLessThan(0.55);
  });
  it('el jugador atento gana casi siempre (75 % o más), pero termina con menos de la mitad de la vida', () => {
    const r = sim(D, true);
    expect(r.gana).toBeGreaterThan(0.75);
    expect(r.vida).toBeLessThan(0.5);
  });
});

describe('balance del hangar (camino alternativo del Capítulo 1)', () => {
  const D = BATALLAS.hangar;
  // Más difícil que el Bastión (es el camino alternativo), pero ganable con cuidado. Jair llega del Bastión casi en el
  // mismo nivel (5,7 en promedio).
  // El cañón del Capitán da 9 golpes (el fuerte y 8 barridos): en nivel 12 el atento ganaba ~32 %; en 10, ~73 %
  // (decisión del autor, 2026-11-04).
  it('el descuidado pierde casi siempre (menos de 45 %) y el atento gana la mayoría (entre 55 % y 90 %)', () => {
    const r = informe(D);
    console.log('hangar', JSON.stringify(r));
    expect(r.descuidado.gana).toBeLessThan(0.45);
    expect(r.atento.gana).toBeGreaterThan(0.55);
    expect(r.atento.gana).toBeLessThan(0.9);
  });
});

describe('balance de Nikki en el bar (escena secreta del Capítulo 1)', () => {
  const D = BATALLAS.nikki;
  it('es muy, muy difícil ganarle: el jugador que solo ataca gana muy pocas veces (entre 2 % y 15 %; la salida es pedirle perdón)', () => {
    const r = sim(D, false);
    console.log('nikki', JSON.stringify(r));
    expect(r.gana).toBeGreaterThan(0.02);
    expect(r.gana).toBeLessThan(0.15);
  });
});

describe('balance de la torre del Capítulo 3 (con los niveles de cada pelea; para la cadena: tests/torre_ajuste.test.ts)', () => {
  const torre = Object.keys(BATALLAS).filter((k) => k.startsWith('cap03_'));
  it('el jugador atento gana todas las peleas de la torre más de la mitad de las veces (con margen: 45 % o más; la torre sube de dificultad piso a piso)', () => {
    // El Rey (la última, nivel 28) puede bajar a ~43 % con los niveles más bajos con que se llega; con los normales del
    // recorrido, ~58 % (la meta). Para él, el margen es 35 % (la simulación varía ±5; 2026-11-05, cuando Cami dejó de descansar fuera del Cap. 1).
    const malas = torre.map((k) => [k, sim(BATALLAS[k], true, 400).gana] as const).filter(([k, g]) => g < (k === 'cap03_rey' ? 0.35 : 0.45));
    expect(malas).toEqual([]);
  });
  it('el Rey no se gana siempre (atento: menos de 95 %)', () => {
    expect(sim(BATALLAS.cap03_rey, true, 600).gana).toBeLessThan(0.95);
  });
});

describe('balance del torneo: Billy, un poco más fuerte (pedido del autor, 2026-11-06)', () => {
  it('en las finales en simple, Billy le gana a Jordy por poco y no las gana casi siempre', async () => {
    const { TORNEO, armarRonda } = await import('../src/engine/torneo');
    const m = TORNEO.modalidades.find((x) => x.peleadores === 1)!;
    const final = TORNEO.rondas.length - 1;
    const media = (h: string) => TORNEO.copas.reduce((s, c) => s + sim(armarRonda(c, final, m, [h]), true, 400).gana, 0) / TORNEO.copas.length;
    const billy = media('billy');
    const jordy = media('jordy');
    console.log('torneo', JSON.stringify({ billy, jordy }));
    expect(billy).toBeGreaterThan(jordy - 0.03);
    expect(billy).toBeLessThan(0.92);
  });
});

describe('balance del torneo: Maggie, con sus objetos contra el dormido y el confundido (2026-11-06)', () => {
  it('Maggie gana una parte razonable de las finales en simple (entre 30 % y 75 %)', async () => {
    const { TORNEO, armarRonda } = await import('../src/engine/torneo');
    const m = TORNEO.modalidades.find((x) => x.peleadores === 1)!;
    const final = TORNEO.rondas.length - 1;
    const maggie = TORNEO.copas.reduce((s, c) => s + sim(armarRonda(c, final, m, ['maggie']), true, 400).gana, 0) / TORNEO.copas.length;
    console.log('maggie', maggie);
    expect(maggie).toBeGreaterThan(0.3);
    expect(maggie).toBeLessThan(0.75);
  });
});
