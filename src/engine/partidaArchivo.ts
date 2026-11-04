// Exportar e importar una partida guardada como archivo: el juego es web y las partidas viven en el navegador, así que
// sirve para pasarlas a otro navegador o a otra computadora, o para tener una copia de seguridad. Solo es la partida
// (escena, variables e historial): la galería, los finales y PayFoe son de todo el juego y no viajan.
// Lo que se importa puede venir de cualquier lado: se valida todo y se copia solo lo que tiene la forma esperada.
import type { HistoryEntry, SaveSlot } from './store';
import type { Vars } from './types';

const FORMATO = 'project-genesis-partida';
/** Un archivo más grande que esto no es una partida (además, no entraría en el navegador). */
const TAMANO_MAX = 5_000_000;
const NOMBRE_MAX = 60;
/** Nombres que nunca se copian de un archivo ajeno: podrían alterar los objetos del juego. */
const CLAVES_PROHIBIDAS = new Set(['__proto__', 'constructor', 'prototype']);

export type ErrorImportar = 'grande' | 'no_es' | 'escena';

export const textoExportado = (partida: SaveSlot, versionJuego: string) =>
  JSON.stringify({ formato: FORMATO, version_juego: versionJuego, partida }, null, 2);

/** El nombre del archivo: el de la partida, solo con letras y números, y la fecha. */
export function nombreArchivo(partida: SaveSlot): string {
  const base = (partida.nombre ?? 'partida').normalize('NFD').replace(/[^\w-]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'partida';
  return `genesis_${base}_${partida.date.slice(0, 10)}.json`;
}

const esObjeto = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);

function limpiarVars(v: Record<string, unknown>): Vars {
  const out: Vars = {};
  for (const [k, x] of Object.entries(v)) {
    if (CLAVES_PROHIBIDAS.has(k)) continue;
    if (typeof x === 'string' || typeof x === 'boolean' || (typeof x === 'number' && Number.isFinite(x))) out[k] = x;
  }
  return out;
}

function limpiarHistorial(h: unknown): HistoryEntry[] {
  if (!Array.isArray(h)) return [];
  return h.filter(esObjeto).flatMap((e): HistoryEntry[] => {
    if (typeof e.text !== 'string') return [];
    return [
      {
        speaker: typeof e.speaker === 'string' ? e.speaker : null,
        text: e.text,
        ...(e.choice === true ? { choice: true } : {}),
        ...(typeof e.sid === 'string' ? { sid: e.sid } : {}),
        ...(typeof e.ci === 'number' && Number.isFinite(e.ci) ? { ci: e.ci } : {}),
      },
    ];
  });
}

/**
 * Lee un archivo exportado. `existeEscena`: la partida tiene que apuntar a una escena de esta versión del juego. No lanza
 * errores: devuelve la partida limpia o qué salió mal.
 */
export function leerPartida(texto: string, existeEscena: (id: string) => boolean): { partida: SaveSlot } | { error: ErrorImportar } {
  if (texto.length > TAMANO_MAX) return { error: 'grande' };
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return { error: 'no_es' };
  }
  if (!esObjeto(datos) || datos.formato !== FORMATO || !esObjeto(datos.partida)) return { error: 'no_es' };
  const p = datos.partida;
  if (typeof p.sceneId !== 'string' || !esObjeto(p.vars)) return { error: 'no_es' };
  if (!existeEscena(p.sceneId)) return { error: 'escena' };
  const fecha = typeof p.date === 'string' && !Number.isNaN(Date.parse(p.date)) ? p.date : new Date().toISOString();
  return {
    partida: {
      sceneId: p.sceneId,
      vars: limpiarVars(p.vars),
      history: limpiarHistorial(p.history),
      date: fecha,
      preview: typeof p.preview === 'string' ? p.preview : '',
      ...(typeof p.finished === 'string' ? { finished: p.finished } : {}),
      ...(typeof p.nombre === 'string' && p.nombre.trim() ? { nombre: p.nombre.trim().slice(0, NOMBRE_MAX) } : {}),
      // Ya no es un guardado automático: el próximo no la pisa.
    },
  };
}
