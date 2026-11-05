// El Capítulo 2 recorrido en el navegador, de punta a punta (como la torre del 3): tres pasadas, cada una tomando otra
// opción en las decisiones (la primera, la segunda o la tercera, si la hay) salvo las que terminan el juego ahí; las
// peleas y el minijuego de Coffee se dan por ganados. Además: perder cada pelea (de relleno: se vuelve a intentar) y
// cada opción que lleva a un final, que tiene que terminar en un final registrado.
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type { Scene } from '../../src/engine/types';
import { empezar, escenasDe, nuevaPartida, recorrer } from './historia';

const ESCENAS = escenasDe('cap02');
const FINALES = new Set((JSON.parse(readFileSync('src/data/registro_finales.json', 'utf8')) as { id: string }[]).map((f) => f.id));

/** Si una opción lleva derecho a un final (sin otra decisión ni pelea en el medio). */
function llevaAFinal(next: string): boolean {
  let s = ESCENAS.get(next);
  for (let i = 0; s && i < 500; i++) {
    if (s.ending) return true;
    if (s.choices.length || s.batalla || s.minijuego || s.nivel || s.fin_capitulo || typeof s.next !== 'string') return false;
    s = ESCENAS.get(s.next);
  }
  return false;
}
/** Las opciones que terminan el juego ahí: [escena, índice entre todas sus opciones]. */
const SALIDAS: [string, number][] = [...ESCENAS.values()].flatMap((s) =>
  s.choices.map((_, i) => [s.scene_id, i] as [string, number]).filter(([, i]) => llevaAFinal(s.choices[i].next)),
);

/** Elige la opción `k` (o la última) entre las que no terminan el juego. */
const sinSalir = (k: number) => (opciones: Scene['choices'], escena: string) => {
  const todas = ESCENAS.get(escena)!.choices;
  const seguras = opciones.map((c, i) => [c, i] as const).filter(([c]) => !SALIDAS.some(([e, j]) => e === escena && todas[j] === c));
  return seguras.length ? seguras[Math.min(k, seguras.length - 1)][1] : 0;
};

for (const k of [0, 1, 2])
  test(`pasada ${k + 1}: tomando la opción ${k + 1} en cada decisión, llega al fin del capítulo`, async ({ page }) => {
    test.setTimeout(240_000);
    const errores = await empezar(page, 'cap02_001');
    const r = await recorrer(page, ESCENAS, sinSalir(k));
    expect(r.fin).toBe('capitulo:2');
    // Pasó por los cuatro reinos y por la torre del Oráculo.
    for (const p of ['cap02_013', 'cap02_p2_049', 'cap02_t_a01', 'cap02_ve_001', 'cap02_or_046']) expect(r.vistas).toContain(p);
    expect(errores).toEqual([]);
  });

const PELEAS = [...ESCENAS.values()].filter((s) => s.batalla).map((s) => s.batalla!);
// En el Capítulo 2 perder es de relleno: «vuelven a intentarlo» y la pelea empieza de nuevo (TODO(canon): sus bad ends).
for (const pelea of PELEAS)
  test(`perder ${pelea} vuelve a la pelea y el capítulo sigue`, async ({ page }) => {
    test.setTimeout(240_000);
    const derrota = [...ESCENAS.values()].find((s) => s.batalla === pelea)!.batalla_derrota!;
    const errores = await empezar(page, 'cap02_001');
    const r = await recorrer(page, ESCENAS, sinSalir(0), pelea);
    expect(r.vistas).toContain(derrota);
    expect(r.fin).toBe('capitulo:2');
    expect(errores).toEqual([]);
  });

test('cada opción que termina el juego lleva a un final registrado', async ({ page }) => {
  test.setTimeout(300_000);
  expect(SALIDAS.length).toBeGreaterThan(0);
  const errores = await empezar(page, SALIDAS[0][0]);
  const finales: string[] = [];
  for (const [escena, j] of SALIDAS) {
    await nuevaPartida(page, escena);
    const opcion = ESCENAS.get(escena)!.choices[j];
    const r = await recorrer(page, ESCENAS, (opciones, e) => (e === escena ? opciones.indexOf(opcion) : sinSalir(0)(opciones, e)));
    expect(r.fin !== 'capitulo:2' && FINALES.has(r.fin!), `${escena} «${opcion.text}»: ${r.fin}`).toBe(true);
    finales.push(r.fin!);
  }
  console.log('finales', [...new Set(finales)]);
  expect(finales).toContain('bad_cap02_prendas');
  expect(errores).toEqual([]);
});
