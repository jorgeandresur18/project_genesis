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
  // META INCUMPLIDA HOY (2026-11-04), a la espera de la decisión del autor: el Capitán en nivel 12 se eligió con la
  // simulación vieja, que contaba un solo golpe del cañón (~71 %). Son 9 (el fuerte y 8 barridos): el atento gana ~32 %.
  // `it.fails` avisa en cuanto la pelea vuelva a cumplir la meta: ahí se cambia por `it`.
  it.fails('el descuidado pierde casi siempre (menos de 45 %) y el atento gana la mayoría (entre 55 % y 90 %)', () => {
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
