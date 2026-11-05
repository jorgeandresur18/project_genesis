import { allAbierto } from './puerta';

// Modo «todo unido» (/all en la dirección): todo lo que hay hasta ahora, de corrido. Al terminar un capítulo,
// «Continuar» sigue en el siguiente (aunque todavía no esté enlazado) y el Bootcamp abre todos sus niveles.
// Sin /all, el juego es el publicado: cada capítulo termina en «próximamente» hasta que se enlaza.
// /all también funciona en lo publicado y ahí prende todo (ver `config` en story.ts): el autor lo usa para probar desde
// el celular o cualquier PC. En lo publicado pide antes un PIN (engine/puerta.ts; decisión del autor, 2026-11-05).
const EN_ALL = typeof location !== 'undefined' && /\/all\/?$/i.test(location.pathname);
/** En lo publicado, /all sin el PIN puesto: se muestra la puerta en vez del juego. */
export const PIDE_PIN = EN_ALL && import.meta.env.PROD && !allAbierto();
export const MODO_TODO = EN_ALL && !PIDE_PIN;

/**
 * La galería con todo desbloqueado (para revisarla): en /all o, fuera de lo publicado, con ?galeria=todo. Solo se mira: no cambia la partida
 * ni lo desbloqueado de verdad.
 */
export const GALERIA_COMPLETA =
  MODO_TODO || (!import.meta.env.PROD && typeof location !== 'undefined' && new URLSearchParams(location.search).get('galeria') === 'todo');
