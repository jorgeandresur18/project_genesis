// El equipo de cada personaje (docs/BIBLIA_RPG.md, secciones 14 y 15): cuatro espacios (cabeza, traje, pies y amuleto),
// se cambia fuera de las peleas y no se gasta. Lo que no se lleva puesto está en la mochila (`mochila_<id>`); lo puesto,
// en `puesto_<héroe>_<espacio>` de la partida. Aquí también se usan los permanentes fuera de las peleas (los caramelos).
// Son cuentas sobre las variables de la partida, sin pantalla: el store las aplica y `Equipo.tsx` las muestra.
import { tipoDe, type Objeto, type Progreso } from './batalla';
import type { Vars } from './types';

export const ESPACIOS = ['cabeza', 'traje', 'pies', 'amuleto'] as const;
export type Espacio = (typeof ESPACIOS)[number];

export const varPuesto = (heroe: string, espacio: Espacio) => `puesto_${heroe}_${espacio}`;
const cantidad = (vars: Vars, id: string) => (typeof vars[`mochila_${id}`] === 'number' ? (vars[`mochila_${id}`] as number) : 0);

/** Si es un objeto que se equipa, con su espacio. */
export const esEquipo = (o?: Objeto): o is Objeto & { espacio: Espacio } => !!o && tipoDe(o) === 'equipo' && ESPACIOS.includes(o.espacio as Espacio);

/** Quién lleva puesta una prenda y en qué espacio (null si nadie). */
export function quienLleva(vars: Vars, id: string): { heroe: string; espacio: Espacio } | null {
  for (const [k, v] of Object.entries(vars)) {
    if (v !== id) continue;
    const m = k.match(/^puesto_(.+)_(cabeza|traje|pies|amuleto)$/);
    if (m) return { heroe: m[1], espacio: m[2] as Espacio };
  }
  return null;
}

/** Si la prenda ya es de la partida: en la mochila o puesta. La ropa es única: se compra una sola vez. */
export const yaTiene = (vars: Vars, id: string) => cantidad(vars, id) > 0 || !!quienLleva(vars, id);

/** Se pone una prenda de la mochila (cualquiera puede ponérsela); lo que tenía en ese espacio vuelve a la mochila. */
export function ponerEquipo(vars: Vars, heroe: string, id: string, o?: Objeto): Vars | null {
  if (!esEquipo(o) || cantidad(vars, id) <= 0) return null;
  const k = varPuesto(heroe, o.espacio);
  const antes = vars[k];
  const nuevas: Vars = { ...vars, [k]: id, [`mochila_${id}`]: cantidad(vars, id) - 1 };
  if (typeof antes === 'string' && antes) nuevas[`mochila_${antes}`] = cantidad(vars, antes) + 1;
  return nuevas;
}

/** Se saca lo que lleva en ese espacio: vuelve a la mochila. */
export function quitarEquipo(vars: Vars, heroe: string, espacio: Espacio): Vars | null {
  const k = varPuesto(heroe, espacio);
  const id = vars[k];
  if (typeof id !== 'string' || !id) return null;
  return { ...vars, [k]: '', [`mochila_${id}`]: cantidad(vars, id) + 1 };
}

/** Lo que suma todo lo que lleva puesto. */
export function bonos(ids: string[] = [], objetos: Record<string, Objeto>) {
  const b = { atq: 0, def: 0, vel: 0, critico: 0, sinConfusion: false, resisteVeneno: false };
  for (const id of ids) {
    const o = objetos[id];
    if (!o) continue;
    b.atq += o.atq ?? 0;
    b.def += o.def ?? 0;
    b.vel += o.vel ?? 0;
    b.critico += o.critico ?? 0;
    b.sinConfusion ||= !!o.sin_confusion;
    b.resisteVeneno ||= !!o.resiste_veneno;
  }
  return b;
}

/** Lo que lleva puesto cada héroe, según el progreso de la partida. */
export const puestosDe = (p: Progreso | undefined, heroe: string) => Object.values(p?.puestos?.[heroe] ?? {});

/** Un permanente fuera de la pelea (un caramelo): sube los niveles, la experiencia vuelve a 0 y se gasta. */
export function usarPermanente(vars: Vars, id: string, heroe: string, nivelActual: number, o?: Objeto): Vars | null {
  if (!o?.niveles || tipoDe(o) !== 'permanente' || cantidad(vars, id) <= 0) return null;
  return { ...vars, [`nivel_${heroe}`]: nivelActual + o.niveles, [`xp_${heroe}`]: 0, [`mochila_${id}`]: cantidad(vars, id) - 1 };
}
