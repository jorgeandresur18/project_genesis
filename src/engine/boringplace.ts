// Boringplace: el marketplace de Boringram (la gente vende su basura y alguna estafa; Jair vende sus cosas).
// - Datos en src/data/boringplace.json; el inglés (src/data/en/boringplace.json) solo trae los textos y se mezcla
//   por posición, como Boringram.
// - Se abre al visitar la escena de «desbloqueo» (al ganar la pelea del Bastión); antes no hay nadie vendiendo nada.
// - «Tienda»: los objetos de las peleas, con precio en monedas; lo de la mochila se vende a la mitad.
import { useStore } from './store';
import { config, scenes } from './story';
import { partidaParaComprar } from './tienda';
import { useLang } from './i18n';
import dataEs from '../data/boringplace.json';
import dataEn from '../data/en/boringplace.json';
import { tipoDe, type Objeto } from './batalla';
import { FICHAS } from './batallas';

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
  tienda: { objeto: string; precio: number; descripcion: string; /** Cuántos se venden por capítulo (lo permanente); sin esto, sin límite. */ stock_por_capitulo?: number; /** Escena desde la que se vende (como en los artículos). */ desbloqueo?: string }[];
  vacio: { titulo: string; texto: string };
  textos: Record<string, string>;
  articulos: Articulo[];
  /** El «?» de la billetera: para qué sirve PayFoe (con chistes). */
  ayuda_payfoe: string[];
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

/** Todos los objetos del juego (también el equipo, que no está en ninguna pelea), para la tienda. */
export const OBJETOS_TIENDA = new Map<string, Objeto>(Object.entries(FICHAS.objetos));
/**
 * El color de la foto de un objeto en la tienda, según su tipo (los colores aprobados de la biblia del RPG, sección 15):
 * curación verde menta, mejora dorado, para el rival rojo, para un aliado plateado. Los que la biblia no tiene
 * (permanente, equipo, colección) son propuesta.
 */
export function colorDeObjeto(o: Objeto): string {
  const tipo = tipoDe(o);
  if (tipo === 'curacion') return '#5fe3b0';
  if (tipo === 'mejora') return '#e6b84a';
  if (tipo === 'tactico') return o.objetivo === 'rival' || o.objetivo === 'rivales' ? '#e0524f' : '#c9d3e0';
  if (tipo === 'permanente') return '#a07bff';
  if (tipo === 'equipo') return '#4f8cff';
  return '#8d8d99';
}
/** Para qué partida se compra: la que se está jugando o, en el título, la elegida (o la más reciente). */
export function usePartidaTienda() {
  const game = useStore((st) => st.game);
  const saves = useStore((st) => st.saves);
  const slotCompra = useStore((st) => st.slotCompra);
  const slot = partidaParaComprar(saves, slotCompra);
  // Comprar desde el título para una partida guardada: no en la demo publicada (`tienda_solo`).
  const guardada = !game && slot >= 0 && !config.tienda_solo ? saves[slot] : null;
  const sceneId = game?.sceneId ?? guardada?.sceneId;
  return {
    vars: game?.vars ?? guardada?.vars,
    capitulo: (sceneId && scenes.get(sceneId)?.chapter) || 1,
    desdeTitulo: !game,
    slot,
    saves,
  };
}
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
    // En la demo publicada, solo lo de la tienda del Capítulo 1 (`tienda_solo` en juego.json).
    tienda: abierto ? data.tienda.filter((x) => OBJETOS_TIENDA.has(x.objeto) && open({ desbloqueo: x.desbloqueo ?? null }) && (!config.tienda_solo || config.tienda_solo.includes(x.objeto))) : [],
  };
}
