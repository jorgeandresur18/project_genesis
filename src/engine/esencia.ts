// La esencia (docs/BIBLIA_RPG.md, sección 21; idea del autor, 2026-11-05): un pequeño plus oculto de cada personaje
// de las peleas. Nunca se muestra. Sale de un sorteo con semilla: la misma toda la partida (o todo el torneo) y
// distinta en otra. Todos la tienen: los principales (héroes, amigos del héroe y jefes) de verdad; los genéricos de
// la horda, baja (casi no se nota). Una sola por personaje y nunca mala.

export type TipoEsencia = 'fuerza' | 'firmeza' | 'vitalidad' | 'rapidez' | 'reflejos' | 'punteria' | 'concentracion' | 'temple';
export interface Esencia {
  tipo: TipoEsencia;
  /** Cuánto: una fracción (0,05 = +5 %) o, en reflejos y puntería, puntos de probabilidad; en temple, la probabilidad de que un estado le dure un turno menos. */
  valor: number;
}

/** El rango de cada esencia (mínimo y máximo). */
export const RANGOS: Record<TipoEsencia, [number, number]> = {
  fuerza: [0.03, 0.08],
  firmeza: [0.03, 0.08],
  vitalidad: [0.04, 0.1],
  rapidez: [0.03, 0.08],
  reflejos: [0.02, 0.05],
  punteria: [0.02, 0.04],
  concentracion: [0.05, 0.12],
  temple: [0.25, 0.5],
};
export const TIPOS = Object.keys(RANGOS) as TipoEsencia[];

/** Un número entre 0 y 1 a partir de un texto (siempre el mismo para el mismo texto). */
function azarDe(semilla: string): () => number {
  let h = 1779033703 ^ semilla.length;
  for (let i = 0; i < semilla.length; i++) {
    h = Math.imul(h ^ semilla.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * La esencia de un personaje: `semilla` la fija (partida o torneo + quién es). Los principales sortean el escalón:
 * común 70 % (el tercio bajo del rango), rara 25 % (el medio) y excepcional 5 % (el alto). Los genéricos, la mitad del
 * mínimo.
 */
export function sortearEsencia(semilla: string, principal: boolean): Esencia {
  const azar = azarDe(semilla);
  const tipo = TIPOS[Math.floor(azar() * TIPOS.length)];
  const [min, max] = RANGOS[tipo];
  if (!principal) return { tipo, valor: +(min / 2).toFixed(4) };
  const r = azar();
  const tercio = r < 0.7 ? 0 : r < 0.95 ? 1 : 2;
  const desde = min + ((max - min) * tercio) / 3;
  return { tipo, valor: +(desde + ((max - min) / 3) * azar()).toFixed(4) };
}

/** Una semilla nueva (para el torneo o una pelea suelta). */
export const nuevaSemilla = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
