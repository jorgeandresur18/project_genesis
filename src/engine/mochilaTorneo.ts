// La mochila del torneo y el equipo de sus peleadores (decisiones del autor, 2026-11-06). Son cuentas sin pantalla:
// el store las aplica y Torneo.tsx, Boringplace.tsx y ChapterEnd.tsx las muestran.
// - Lo que se compra en el Boringplace del menú con PayFoe (objetos de pelea y ropa) va a la mochila del torneo y sirve
//   solo ahí. De las partidas pueden pasar objetos que se gastan, al terminar cada capítulo, con tope.
// - Cada peleador sale con su equipo armado (`equipo_peleadores` en torneo.json); el jugador se lo cambia con la ropa de
//   la mochila. Lo suyo de fábrica no se pierde ni se suma a la mochila: al sacarlo, se guarda «en su casillero».
import { tipoDe, type Objeto } from './batalla';
import { FICHAS } from './batallas';
import { ESPACIOS, type Espacio } from './equipo';
import { TORNEO } from './torneo';
import type { Vars } from './types';

export interface EstadoMochila {
  /** Lo que hay en la mochila del torneo: objeto → cantidad. */
  mochila?: Record<string, number>;
  /** El equipo cambiado por el jugador: peleador → espacio → objeto ('' = vacío). Sin entrada, el de fábrica. */
  equipo?: Record<string, Partial<Record<Espacio, string>>>;
  /** Cuántos objetos ya pasó cada partida en cada capítulo («partida|capítulo» → cantidad). */
  traspasos?: Record<string, number>;
}

/** Cuántos objetos pueden pasar de una partida al torneo por capítulo. */
export const TOPE_TRASPASO = 5;
/** Lo que se gasta en las peleas: lo único que pasa de una partida al torneo (la ropa y los permanentes, no). */
export const esGastable = (o?: Objeto) => !!o && ['curacion', 'mejora', 'tactico'].includes(tipoDe(o));
/**
 * El tope de cada objeto en la mochila del torneo (2026-11-06): 9 de cada uno de los que se gastan (si no, diez Elixit++
 * por ronda y nadie pierde) y 3 de cada prenda, puestas o no (para vestir igual a tres peleadores repetidos).
 */
export const TOPE_OBJETO = 9;
export const TOPE_PRENDA = 3;
export const topeDe = (id: string) => (tipoDe(FICHAS.objetos[id]) === 'equipo' ? TOPE_PRENDA : TOPE_OBJETO);
/** Cuántos más de un objeto entran en la mochila (contando los que llevan puestos). */
export function lugarPara(m: EstadoMochila, id: string): number {
  const puestos = tipoDe(FICHAS.objetos[id]) === 'equipo' ? Object.values(m.equipo ?? {}).filter((e) => Object.values(e).includes(id)).length : 0;
  return Math.max(0, topeDe(id) - (m.mochila?.[id] ?? 0) - puestos);
}
/** Lo que se puede comprar para el torneo: lo que se gasta y la ropa. */
export const esDelTorneo = (o?: Objeto) => !!o && (esGastable(o) || tipoDe(o) === 'equipo');

const espacioDe = (id: string) => FICHAS.objetos[id]?.espacio as Espacio | undefined;
const deFabrica = (k: string): string[] => {
  const e = TORNEO.equipo_peleadores[k];
  return Array.isArray(e) ? e : [];
};

/** Lo que lleva puesto un peleador, por espacio (el de fábrica, con los cambios del jugador encima). */
export function piezas(k: string, m: EstadoMochila): Partial<Record<Espacio, string>> {
  const out: Partial<Record<Espacio, string>> = {};
  for (const id of deFabrica(k)) {
    const e = espacioDe(id);
    if (e) out[e] = id;
  }
  return { ...out, ...(m.equipo?.[k] ?? {}) };
}
/** Lo que lleva puesto, como lista (para la pelea: `equipo_fijo`). */
export const equipoDe = (k: string, m: EstadoMochila) =>
  ESPACIOS.map((e) => piezas(k, m)[e]).filter((x): x is string => !!x);

const sumar = (mochila: Record<string, number>, id: string, n: number) => {
  const v = (mochila[id] ?? 0) + n;
  const out = { ...mochila };
  if (v > 0) out[id] = v;
  else delete out[id];
  return out;
};
/** Lo que se saca: si es de fábrica de ese peleador, vuelve a su casillero; si no, a la mochila. */
const devolver = (k: string, mochila: Record<string, number>, id?: string) => (id && !deFabrica(k).includes(id) ? sumar(mochila, id, 1) : mochila);

/** Le pone a un peleador una prenda de la mochila (o una suya de fábrica que tenía guardada). */
export function ponerPrenda(m: EstadoMochila, k: string, id: string): EstadoMochila | null {
  const e = espacioDe(id);
  const o = FICHAS.objetos[id];
  if (!e || tipoDe(o) !== 'equipo') return null;
  const propia = deFabrica(k).includes(id);
  const mochila = m.mochila ?? {};
  if (!propia && !((mochila[id] ?? 0) > 0)) return null;
  const antes = piezas(k, m)[e];
  if (antes === id) return null;
  let nueva = propia ? mochila : sumar(mochila, id, -1);
  nueva = devolver(k, nueva, antes);
  return { ...m, mochila: nueva, equipo: { ...(m.equipo ?? {}), [k]: { ...(m.equipo?.[k] ?? {}), [e]: id } } };
}
/** Le saca a un peleador lo que lleva en un espacio. */
export function sacarPrenda(m: EstadoMochila, k: string, e: Espacio): EstadoMochila | null {
  const antes = piezas(k, m)[e];
  if (!antes) return null;
  return { ...m, mochila: devolver(k, m.mochila ?? {}, antes), equipo: { ...(m.equipo ?? {}), [k]: { ...(m.equipo?.[k] ?? {}), [e]: '' } } };
}
/** Vuelve al equipo de fábrica: lo comprado que llevaba vuelve a la mochila. */
export function restaurarEquipo(m: EstadoMochila, k: string): EstadoMochila {
  let mochila = m.mochila ?? {};
  const fabrica = new Set(deFabrica(k));
  for (const id of Object.values(m.equipo?.[k] ?? {})) if (id && !fabrica.has(id)) mochila = sumar(mochila, id, 1);
  const equipo = { ...(m.equipo ?? {}) };
  delete equipo[k];
  return { ...m, mochila, equipo };
}

/**
 * Después de una ronda: lo que se gastó de la mochila. En cada pelea hay además una mochila fija (`TORNEO.mochila`),
 * que se gasta primero; lo que se usó de más sale de la mochila del torneo.
 */
export function gastarEnRonda(m: EstadoMochila, antes: Record<string, number>, despues: Record<string, number>): EstadoMochila {
  let mochila = m.mochila ?? {};
  for (const [id, n] of Object.entries(antes)) {
    const usado = Math.max(0, n - (despues[id] ?? 0) - (TORNEO.mochila[id] ?? 0));
    if (usado) mochila = sumar(mochila, id, -Math.min(usado, mochila[id] ?? 0));
  }
  return { ...m, mochila };
}
/** La mochila con que entra a una ronda: la fija de cada pelea más la del torneo (solo lo que se gasta). */
export function mochilaDeRonda(m: EstadoMochila): Record<string, number> {
  const out: Record<string, number> = { ...TORNEO.mochila };
  for (const [id, n] of Object.entries(m.mochila ?? {})) if (esGastable(FICHAS.objetos[id])) out[id] = (out[id] ?? 0) + n;
  return out;
}

/** Lo que una partida puede pasar al torneo: los objetos que se gastan que tiene en la mochila. */
export function traspasables(vars: Vars): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(vars)) {
    const id = k.startsWith('mochila_') ? k.slice(8) : '';
    if (id && typeof v === 'number' && v > 0 && esGastable(FICHAS.objetos[id])) out[id] = v;
  }
  return out;
}
/** Cuántos le quedan por pasar a esta partida en este capítulo. */
export const quedanTraspasos = (m: EstadoMochila, partida: string, capitulo: number) =>
  Math.max(0, TOPE_TRASPASO - (m.traspasos?.[`${partida}|${capitulo}`] ?? 0));
/**
 * Pasa objetos de una partida al torneo (al terminar un capítulo; nunca al revés). Respeta el tope por capítulo, que
 * queda anotado fuera de la partida (cargar un guardado viejo no lo reinicia).
 */
export function traspasar(m: EstadoMochila, vars: Vars, items: Record<string, number>, capitulo: number): { mochila: EstadoMochila; vars: Vars; pasados: number } | null {
  const partida = typeof vars.partida_id === 'string' ? vars.partida_id : '';
  if (!partida) return null;
  const tiene = traspasables(vars);
  let queda = quedanTraspasos(m, partida, capitulo);
  let mochila = m.mochila ?? {};
  const nuevas: Vars = { ...vars };
  let pasados = 0;
  for (const [id, pedido] of Object.entries(items)) {
    const n = Math.max(0, Math.min(Math.floor(pedido), tiene[id] ?? 0, queda, lugarPara({ ...m, mochila }, id)));
    if (!n) continue;
    nuevas[`mochila_${id}`] = (tiene[id] ?? 0) - n;
    mochila = sumar(mochila, id, n);
    queda -= n;
    pasados += n;
  }
  if (!pasados) return null;
  const clave = `${partida}|${capitulo}`;
  return { mochila: { ...m, mochila, traspasos: { ...(m.traspasos ?? {}), [clave]: (m.traspasos?.[clave] ?? 0) + pasados } }, vars: nuevas, pasados };
}
