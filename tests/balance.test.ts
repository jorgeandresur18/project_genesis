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
