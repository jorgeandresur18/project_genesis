// Modo «todo unido» (/all en la dirección): todo lo que hay hasta ahora, de corrido. Al terminar un capítulo,
// «Continuar» sigue en el siguiente (aunque todavía no esté enlazado) y el Bootcamp abre todos sus niveles.
// Sin /all, el juego es el publicado: cada capítulo termina en «próximamente» hasta que se enlaza.
// En lo publicado (`import.meta.env.PROD`) los atajos no funcionan: si no, se saltaban lo que está apagado (el Capítulo 2,
// los secretos). En `npm run dev` y en las pruebas, sí.
const ATAJOS = !import.meta.env.PROD;
export const MODO_TODO = ATAJOS && typeof location !== 'undefined' && /\/all\/?$/i.test(location.pathname);

/**
 * La galería con todo desbloqueado (para revisarla): en /all o con ?galeria=todo. Solo se mira: no cambia la partida
 * ni lo desbloqueado de verdad.
 */
export const GALERIA_COMPLETA =
  MODO_TODO || (ATAJOS && typeof location !== 'undefined' && new URLSearchParams(location.search).get('galeria') === 'todo');
