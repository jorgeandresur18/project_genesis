// Cuentas de la tienda de Boringplace, sin pantalla (docs/BIBLIA_RPG.md, sección 14): para qué partida se compra desde
// el título y el stock limitado por capítulo de lo permanente.
import type { Vars } from './types';

/** La partida para la que se compra desde el título: la elegida o, por defecto, la más reciente (-1 si no hay ninguna). */
export function partidaParaComprar(saves: ({ date: string } | null)[], elegida: number | null): number {
  if (elegida !== null && saves[elegida]) return elegida;
  return saves.reduce((mejor, p, i) => (p && (mejor < 0 || p.date > saves[mejor]!.date) ? i : mejor), -1);
}

/** La variable que cuenta cuántos se compraron de un objeto en un capítulo. */
export const varStock = (objeto: string, capitulo: number) => `stock_${objeto}_${capitulo}`;

/** Cuántos quedan en este capítulo. Sin límite: Infinity. */
export function quedanStock(vars: Vars | undefined, objeto: string, capitulo: number, stock?: number): number {
  if (stock === undefined) return Infinity;
  const comprados = vars?.[varStock(objeto, capitulo)];
  return Math.max(0, stock - (typeof comprados === 'number' ? comprados : 0));
}
