# Versiones

Qué trae cada versión. La que está en curso lleva `-dev` y todavía no se publicó. Cómo se numeran y cómo se publica:
`docs/METODOLOGIA.md`.

## 1.2.0-dev (en curso, rama `desarrollo`; sin publicar)

## 1.1.1 (publicada el 5 de noviembre de 2026; etiqueta `v1.1.1`)

**Sigue apagado en lo publicado** (`demo_publica`): el Capítulo 2, el Torneo, PayFoe y la tienda nueva, con lo nuevo de ella (como el CeBiDol).

- **Galería, Rikka:** si la tocas demasiado (30 veces en las termas, de frente, de espalda o vistiéndose), grita sin darse vuelta: tiembla todo, zoom lento a su cara, luz blanca y de vuelta a la pantalla de inicio.
- **Advertencia de contenido:** «Alcohol y drogas» en un solo tema.
- **Lo publicado, más cerrado:** `?galeria=todo` solo funciona en desarrollo, y `/all` pide un PIN del autor; con él, prende todo, para probar desde el celular o cualquier PC.
- **Después del grito de Rikka,** un degradado de blanco al título, que vuelve a empezar.
- **CeBiDol:** +2 ATQ y +2 DEF para siempre, fuera de las peleas (Boringplace, 400 tokens, uno por capítulo).

## 1.1.0 (publicada el 5 de noviembre de 2026; etiqueta `v1.1.0`)

**Qué se publica (decisión del autor):** lo del Capítulo 1 y lo general (balance de las peleas, estados, Conoce más,
galería, guardado seguro, exportar partidas, inglés). **Queda apagado** en lo publicado (`demo_publica` en
`juego.json`): el Capítulo 2 (y con él sus peleas y la escena secreta de Rikka), el Torneo Genesis, PayFoe y la tienda
nueva (la tienda vende lo mismo que en la 1.0: vida, ataque, defensa, carga, revivir, veneno para ratas y condón; sin
cassettes sueltos ni comprar desde el título). Todo eso sigue en el código y se prende al publicar el Capítulo 2.


- **Robustez:** guardado seguro (se recupera de un guardado corrupto y nunca rompe el juego), pantalla de error dentro
  del juego, ESLint y CI en GitHub.
- **PayFoe:** la billetera del jugador (aparte de las partidas), con transferencia desde la partida, movimientos y su
  «?» de ayuda. **Escondida** (`payfoe_activo: false` en `juego.json`) hasta que haya algo que comprar con ella. La moneda del juego se llama **tokens**, con su moneda dibujada.
- **Boringplace:** la tienda como un marketplace (foto con el color del tipo de objeto, nombre, precio; adentro,
  descripción y cuántos comprar; el objeto flota en 3D con la luz de su tipo). Sin «Para ti» ni las publicaciones de
  relleno.
- **Capítulo 2 jugable:** al terminar el Capítulo 1, «Continuar» sigue al Capítulo 2 (`capitulo_maximo: 2` en `juego.json`; ponerlo en 1 si no se quiere publicar todavía). El cassette del molino es el especial Armored de Cami.
- **Capítulo 2:** plantillas de las peleas (muralla, campamento, molino con Rikka, Cami armored; la del cassette sin
  enganchar), con perder que repite la pelea.
- **Galería:** casillas vacías en el orden en que salen en la historia (lugares y pixel art), el hangar destruido entre
  los lugares, «Nalgada ancestral» y «Exceso de confianza al vapor», luz y reflejo metálico en los especiales, el
  nombre de cada especial en el pixel art, el Capitán y la sombra centrados.
- **Canon:** el Capítulo 5 se llama «Conflicto de dependencias» («Dependency Hell»).
- **Conoce más:** Bad Bunny en «La influencia latinoamericana» y Mac Miller en «Notas del autor».
- **Torneo Genesis (de relleno):** cuatro copas, simple/doble/triple, cuatro rondas hasta Nikki campeona; premios a PayFoe (que se prende con el torneo).
- **Ataques intercambiables:** 3 ataques y 2 especiales equipados con cassettes, ataques nuevos sin sprites, cassettes sueltos en Boringplace.
- **Equipo:** ponerse y quitarse la ropa desde el panel de Equipo, con efecto en las peleas; gorro, chaqueta jean y zapatillas en Boringplace; los caramelos se comen fuera de las peleas.
- **Estados y ataques nuevos:** dormido, quemado y congelado; cebos con efecto y explosivo; autodestrucción; la bomba del día del juicio; y el empate.
- **Tienda:** todos los consumibles de la tabla, caramelos con stock por capítulo y comprar desde el título para una partida guardada.
- **Inglés:** objetos, cassettes y ataques de los héroes, en Boringplace y en Equipo.
- **Exportar e importar partidas** como archivo, para pasarlas de un navegador a otro.
- **Hangar más justo:** el Capitán baja de nivel 12 a 10 (su cañón da 9 golpes; el jugador atento ganaba ~32 %, ahora ~73 %).
- **RPG ordenado:** una sola ficha por personaje, `Batalla.tsx` partido (el dibujo y, desde el 4 de noviembre, la
  lógica de turnos de los enemigos en `engine/turnos.ts`), varios especiales con una barra.
- **Pelea más clara:** el cuadro de opciones no queda vacío fuera de tu turno; la caja de diálogo mide lo que el retrato; aviso cuando a alguien se le pasa un estado.

## 1.0.0 — Demo 1.0 (publicada el 3 de noviembre de 2026; etiqueta `v1.0.0`)

La primera demo pública: el Capítulo 1 completo y jugable, con sus finales y bad ends, las peleas por turnos (el bar,
el Bastión y el hangar), Boringram y Boringplace, el Bootcamp Genesis, la galería, el modo Retro CRT y «Conoce más».
