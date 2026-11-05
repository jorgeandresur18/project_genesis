// Modo «todo unido» (/all en la dirección): todo lo que hay hasta ahora, de corrido. Al terminar un capítulo,
// «Continuar» sigue en el siguiente (aunque todavía no esté enlazado) y el Bootcamp abre todos sus niveles.
// Sin /all, el juego es el publicado: cada capítulo termina en «próximamente» hasta que se enlaza.
// /all también funciona en lo publicado y ahí prende todo (ver `config` en story.ts): el autor lo usa para probar desde
// el celular, sin computadora a mano (decisión del autor, 2026-11-05). Quien conozca la dirección ve lo que está apagado.
export const MODO_TODO = typeof location !== 'undefined' && /\/all\/?$/i.test(location.pathname);

/**
 * La galería con todo desbloqueado (para revisarla): en /all o, fuera de lo publicado, con ?galeria=todo. Solo se mira: no cambia la partida
 * ni lo desbloqueado de verdad.
 */
export const GALERIA_COMPLETA =
  MODO_TODO || (!import.meta.env.PROD && typeof location !== 'undefined' && new URLSearchParams(location.search).get('galeria') === 'todo');
