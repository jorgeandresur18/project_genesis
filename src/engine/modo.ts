// Modo «todo unido» (/all en la dirección): todo lo que hay hasta ahora, de corrido. Al terminar un capítulo,
// «Continuar» sigue en el siguiente (aunque todavía no esté enlazado) y el Bootcamp abre todos sus niveles.
// Sin /all, el juego es el publicado: cada capítulo termina en «próximamente» hasta que se enlaza.
export const MODO_TODO = typeof location !== 'undefined' && /\/all\/?$/i.test(location.pathname);
