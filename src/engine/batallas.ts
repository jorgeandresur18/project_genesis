// Las peleas, completas: cada una (src/data/batallas/<id>.json) dice quién pelea, en qué nivel y lo que cambia en esa
// pelea; la ficha única de cada personaje, los objetos y los retratos están en src/data/rpg/personajes.json
// (docs/BIBLIA_RPG.md, sección 13). Aquí se juntan: todo el juego y las pruebas leen las peleas desde este módulo.
import type { Ataque, DatosBatalla, Enemigo, Especial, Heroe, Objeto } from './batalla';
import fichas from '../data/rpg/personajes.json';

/** Una pelea tal como está en su archivo: los héroes con lo que cambia, los enemigos y los objetos por nombre. */
export interface PeleaArchivo extends Omit<DatosBatalla, 'personajes' | 'enemigos' | 'objetos' | 'retratos'> {
  personajes: Record<string, Partial<Heroe> & { nivel: number }>;
  enemigos: string[];
  /** Lo que cambia de un enemigo solo en esta pelea (p. ej. Nikki ebria en el bar: más lenta). `base` y `crece` se mezclan. */
  enemigos_cambios?: Record<string, Partial<Enemigo>>;
  objetos: string[];
  retratos?: Record<string, string>;
}

/** Un cassette suelto (docs/BIBLIA_RPG.md, sección 18): un ataque que puede usar cualquiera, con su precio en tokens. */
export interface Suelto {
  /** Sin precio: no se vende (se gana). */
  precio?: number;
  ataque?: Ataque;
  /** Un especial suelto (la bomba del día del juicio): se equipa en los espacios de especial. */
  especial?: Especial;
}

export interface Fichas {
  heroes: Record<string, Omit<Heroe, 'nivel'>>;
  /** Las formas de los especiales+ (Cami armored): fichas que se toman a mitad de una pelea. */
  formas?: Record<string, Omit<Heroe, 'nivel'>>;
  sueltos: Record<string, Suelto>;
  enemigos: Record<string, Enemigo>;
  objetos: Record<string, Objeto>;
  retratos: Record<string, string>;
}

export const FICHAS = fichas as unknown as Fichas;

/** Junta una pelea con las fichas: cada héroe es su ficha con lo que esa pelea cambia encima. */
export function armarBatalla(p: PeleaArchivo, f: Fichas = FICHAS, id = '?'): DatosBatalla {
  const personajes: Record<string, Heroe> = {};
  for (const [k, cambios] of Object.entries(p.personajes)) {
    const base = f.heroes[k];
    if (!base) throw new Error(`Pelea ${id}: el héroe «${k}» no tiene ficha en src/data/rpg/personajes.json`);
    personajes[k] = { ...base, ...cambios } as Heroe;
  }
  const enemigos: Record<string, Enemigo> = {};
  for (const k of p.enemigos) {
    if (!f.enemigos[k]) throw new Error(`Pelea ${id}: el enemigo «${k}» no tiene ficha`);
    const c = p.enemigos_cambios?.[k];
    enemigos[k] = c ? { ...f.enemigos[k], ...c, base: { ...f.enemigos[k].base, ...c.base }, crece: { ...f.enemigos[k].crece, ...c.crece } } : f.enemigos[k];
  }
  const objetos: Record<string, Objeto> = {};
  for (const k of p.objetos) {
    if (!f.objetos[k]) throw new Error(`Pelea ${id}: el objeto «${k}» no tiene ficha`);
    objetos[k] = f.objetos[k];
  }
  // Lo demás que se puede usar en una pelea: se compra en Boringplace y sirve en cualquiera (salvo el equipo).
  for (const [k, o] of Object.entries(f.objetos)) if (!objetos[k] && o.tipo !== 'equipo' && o.tipo !== 'coleccion') objetos[k] = o;
  return { ...p, personajes, enemigos, objetos, retratos: { ...f.retratos, ...p.retratos } } as DatosBatalla;
}

const ARCHIVOS = import.meta.glob<PeleaArchivo>('../data/batallas/*.json', { eager: true, import: 'default' });

/** Todas las peleas, completas, por su id (el nombre del archivo: `bastion`, `nikki`, `cap02_molino`…). */
export const BATALLAS: Record<string, DatosBatalla> = Object.fromEntries(
  Object.entries(ARCHIVOS).map(([ruta, p]) => {
    const id = ruta.split('/').pop()!.replace('.json', '');
    return [id, armarBatalla(p, FICHAS, id)];
  }),
);

/**
 * Los cassettes sueltos que se venden en Boringplace (la bomba no: se gana). Los de especial (el Multicebo) van con su
 * especial en `ataque`, para que la tienda muestre su nombre y su texto igual.
 */
export const SUELTOS_EN_VENTA = Object.fromEntries(
  Object.entries(FICHAS.sueltos)
    .filter(([, c]) => (c.ataque || c.especial) && c.precio !== undefined)
    .map(([id, c]) => [id, { ...c, ataque: (c.ataque ?? c.especial) as Ataque }]),
) as Record<string, { precio: number; ataque: Ataque }>;

/** Lo que se vende al vender un cassette suelto: la mitad de lo que cuesta. */
export const precioVentaCassette = (precio: number) => Math.floor(precio / 2);

/**
 * Los cassettes sueltos que se tienen, como ataques para equipar: uno por cada id con al menos una copia. Cuántos
 * héroes pueden llevar el mismo a la vez lo limita la cantidad de copias (ver `copiasLibres`).
 */
export const sueltosQueTengo = (cassettes: Record<string, number> = {}): (Ataque | Especial)[] =>
  Object.entries(FICHAS.sueltos)
    .filter(([id]) => (cassettes[id] ?? 0) > 0)
    .map(([, s]) => (s.ataque ?? s.especial)!);

/** Cuántas copias de un suelto quedan sin equipar (las que tiene menos los héroes que lo llevan equipado). */
export function copiasLibres(id: string, cassettes: Record<string, number> = {}, equipo: Record<string, { ataques?: string[]; especiales?: string[] }> = {}): number {
  const s = FICHAS.sueltos[id];
  const nombre = (s?.ataque ?? s?.especial)?.nombre ?? '';
  const usado = Object.values(equipo).filter((e) => e.ataques?.includes(nombre) || e.especiales?.includes(nombre)).length;
  return (cassettes[id] ?? 0) - usado;
}
