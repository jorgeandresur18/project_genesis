// Boringplace: el marketplace de Boringram (la gente vende su basura y alguna estafa; Jair vende sus cosas).
// - Datos en src/data/boringplace.json; el inglés (src/data/en/boringplace.json) solo trae los textos y se mezcla
//   por posición, como Boringram.
// - Se abre al visitar la escena de «desbloqueo» (al ganar la pelea del Bastión); antes no hay nadie vendiendo nada.
// - «Tienda»: los objetos de las peleas, con precio en monedas; lo de la mochila se vende a la mitad.
import { useStore } from './store';
import { useLang } from './i18n';
import dataEs from '../data/boringplace.json';
import dataEn from '../data/en/boringplace.json';
import type { DatosBatalla, Objeto } from './batalla';

export interface Articulo {
  id: string;
  titulo: string;
  precio: string;
  estado: string;
  /** Usuario y nombre de quien lo vende (los de Jair no lo llevan: es él). */
  vendedor?: string;
  vendedor_nombre?: string;
  estrellas?: number;
  publicado: string;
  lugar: string;
  /** Placeholder hasta la fase de arte. */
  imagen: string;
  descripcion: string;
  /** Lo vende Jair (sale en «Tus artículos»). */
  de_jair?: boolean;
  /** Cuántos lo vieron (los de Jair). */
  vistas?: number;
  /** Es una estafa (no se dice en la tienda: se nota). */
  estafa: boolean;
  /** Lo que pasa al preguntar si sigue disponible (o, en los de Jair, al marcarlo como vendido). */
  respuesta: string;
  desbloqueo: string | null;
}
export interface BoringplaceData {
  desbloqueo: string | null;
  /** Lo que se compra con monedas: la clave del objeto de las peleas y su precio (se vende a la mitad). */
  tienda: { objeto: string; precio: number; descripcion: string; /** El color del objeto, para el fondo de su foto. */ color?: string }[];
  vacio: { titulo: string; texto: string };
  textos: Record<string, string>;
  articulos: Articulo[];
}

/** Mezcla los textos en inglés sobre los datos en español (objetos por clave, listas por posición). */
function merge(a: unknown, b: unknown): unknown {
  if (b === undefined) return a;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => merge(x, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const [k, v] of Object.entries(b as Record<string, unknown>)) out[k] = merge(out[k], v);
    return out;
  }
  return b;
}

const ES = dataEs as unknown as BoringplaceData;
const EN = merge(dataEs, dataEn) as BoringplaceData;

/** Las escenas que abren algo de Boringplace (para la prueba de rutas). */
export const unlockScenesBoringplace = (): string[] =>
  [ES.desbloqueo, ...ES.articulos.map((a) => a.desbloqueo)].filter((x): x is string => !!x);

/** Los objetos de las peleas (el primero que aparece con cada clave), para la tienda. */
const BATALLAS = import.meta.glob<DatosBatalla>('../data/batallas/*.json', { eager: true, import: 'default' });
export const OBJETOS_TIENDA = new Map<string, Objeto>();
for (const d of Object.values(BATALLAS)) for (const [k, o] of Object.entries(d.objetos)) if (!OBJETOS_TIENDA.has(k)) OBJETOS_TIENDA.set(k, o);
/** Lo que se paga al vender: la mitad de lo que cuesta. */
export const precioVenta = (precio: number) => Math.floor(precio / 2);

/** Lo que se ve en Boringplace según la partida: si ya abrió y qué artículos hay. */
export function useBoringplace() {
  const data = useLang() === 'en' ? EN : ES;
  const visited = useStore((s) => s.snapshots);
  const open = (x: { desbloqueo: string | null }) => !x.desbloqueo || !!visited[x.desbloqueo];
  const abierto = open(data);
  const articulos = abierto ? data.articulos.filter(open) : [];
  return {
    data,
    abierto,
    ajenos: articulos.filter((a) => !a.de_jair),
    deJair: articulos.filter((a) => a.de_jair),
    tienda: abierto ? data.tienda.filter((x) => OBJETOS_TIENDA.has(x.objeto)) : [],
  };
}
