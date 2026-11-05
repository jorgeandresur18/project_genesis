import juego from '../data/juego.json';
import { allAbierto } from './puerta';

// Modo «todo unido» (/all en la dirección): todo lo que hay hasta ahora, de corrido. Al terminar un capítulo,
// «Continuar» sigue en el siguiente (aunque todavía no esté enlazado) y el Bootcamp abre todos sus niveles.
// Sin /all, el juego es el publicado: cada capítulo termina en «próximamente» hasta que se enlaza.
// /all también funciona en lo publicado y ahí prende todo (ver `config` en story.ts): el autor lo usa para probar desde
// el celular o cualquier PC. En lo publicado, /all y los demás atajos de prueba piden antes un PIN (engine/puerta.ts;
// decisión del autor, 2026-11-05).
const EN_ALL = typeof location !== 'undefined' && /\/all\/?$/i.test(location.pathname);
/** Los atajos de prueba por la dirección: se saltan lo que está apagado en lo publicado. */
const PARAMETROS_DE_PRUEBA = ['batalla', 'vars', 'sprites', 'cuadricula', 'escena', 'bootcamp', 'juego', 'nivel'];
/**
 * Si esta dirección usa un atajo de prueba: /all, uno de esos parámetros o /capN de un capítulo que no se publicó
 * (/cap1 sigue abierto: es el enlace de la demo).
 */
export function usaAtajo(ruta: string, busqueda: string, capituloPublicado = juego.demo_publica?.capitulo_maximo ?? Infinity): boolean {
  if (/\/all\/?$/i.test(ruta)) return true;
  const q = new URLSearchParams(busqueda);
  if (PARAMETROS_DE_PRUEBA.some((p) => q.has(p))) return true;
  const cap = ruta.match(/\/cap0?(\d+)\/?$/i);
  return !!cap && Number(cap[1]) > capituloPublicado;
}
/** En lo publicado, un atajo sin el PIN puesto: se muestra la puerta en vez del juego. */
export const PIDE_PIN = import.meta.env.PROD && typeof location !== 'undefined' && usaAtajo(location.pathname, location.search) && !allAbierto();
export const MODO_TODO = EN_ALL && !PIDE_PIN;

/**
 * La galería con todo desbloqueado (para revisarla): en /all o, fuera de lo publicado, con ?galeria=todo. Solo se mira: no cambia la partida
 * ni lo desbloqueado de verdad.
 */
export const GALERIA_COMPLETA =
  MODO_TODO || (!import.meta.env.PROD && typeof location !== 'undefined' && new URLSearchParams(location.search).get('galeria') === 'todo');
