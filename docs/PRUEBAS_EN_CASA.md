# Qué probar en la computadora de casa

Lista de lo que se hizo el 4 de noviembre de 2026 en la segunda computadora (`MARKETING1ICSH`), donde no se pudo jugar
ni ver nada en pantalla. Todo pasó las pruebas automáticas, pero **nadie lo vio funcionando**.

**Para Claude en la computadora de casa:** lee este archivo, guía al autor punto por punto, y tacha aquí lo que quede
confirmado. Si algo falla, primero mira `docs/BITACORA.md` (entrada del 4 de noviembre) y, para las peleas, la lógica
que se movió a `src/engine/turnos.ts`.

**Cómo pedírselo:** «Lee `docs/PRUEBAS_EN_CASA.md` y guíame para probar todo».

## 1. Antes de probar: juntar las dos computadoras

- [x] En la carpeta del proyecto: `git checkout desarrollo` y `git status`. *(4 nov, computadora principal)*
- [x] Revisar si quedó algo sin subir de la noche del 3 de noviembre: `git log --branches --not --remotes`. **Nada:** `desarrollo` estaba igual que en GitHub; lo único local es la rama `respaldo-historial-2026-11-02`. El autor
      recuerda cambios de cerca de las 23:00, pero en GitHub lo último de esa noche es de las 22:44.
- [x] Si hay cambios sin guardar, hacer un commit con ellos. *(No había: solo el material de arte suelto, que nunca estuvo en git.)*
- [x] `git pull` (33 commits, sin conflictos). Si dice `CONFLICT`, Claude ayuda a elegir qué se queda (lo más probable: `BITACORA.md` y
      `CRONOGRAMA.md`). Nunca `push --force`.
- [x] `npm install` y `npm test` (deben pasar todas: 195) y `npm run dev`.

## 2. Las peleas (se cambió cómo está armado el código, no cómo se juega)

**Primera revisión hecha: el autor jugó las peleas la noche del 4 de noviembre y salieron bien, también con los cambios de esa noche.** Queda una **segunda revisión**, a pedido del autor: por eso estos puntos siguen sin marcar.

Tienen que jugarse **igual que antes**. Lo que más hay que mirar: que nada se trabe y que no aparezcan errores.

- [ ] `http://localhost:5173/?batalla=bastion`: los refuerzos llegan cuando cae un soldado, sale la sombra al final, su
      parálisis funciona y se gana cuando se retira.
- [ ] `http://localhost:5173/?batalla=nikki`:
  - [ ] El beso confunde y a veces Jair se pega a sí mismo.
  - [ ] Hablarle 3 turnos seguidos termina la pelea con el perdón.
  - [ ] **La traición:** hablarle y después atacarla. Tiene que salir la Mega Bola Tóxica contra Jair y, después, la
        cachetada que remata.
  - [ ] Cuando aparece, el clon de sombra le cuesta vida a Nikki y se evapora a los 3 turnos.
- [ ] `http://localhost:5173/?batalla=hangar`: ver el punto 3.
- [ ] `http://localhost:5173/?batalla=demo`: con Rikka; se puede huir y usar objetos (el condón protege, el veneno quita
      vida cada turno).

## 3. El hangar, ahora más fácil

El Capitán bajó de nivel 12 a 10, porque su cañón da 9 golpes y la simulación vieja contaba uno. Medido: un jugador
atento gana ~72 % y uno descuidado ~30 %.

- [ ] ¿Se siente justa la pelea? Más difícil que el Bastión, pero ganable.
- [ ] El cañón: un rayo fuerte a quien eligió y barridos flojos al otro.
- [ ] Si quedó muy fácil o muy difícil, las otras opciones medidas están en `docs/BITACORA.md`.

## 4. El equipo y la ropa (nuevo; la pantalla es lo que más hay que revisar)

Hay que jugar la historia (o usar `/all`) hasta ganar el Bastión, porque ahí se abre Boringplace.

- [ ] En Boringplace aparecen el gorro de navidad (120), la chaqueta jean (90) y las zapatillas buenas (80).
- [ ] Al comprar una prenda no sale el selector de cantidad y, después de comprarla, dice que ya es tuya.
- [ ] En Equipo › Mochila aparece la prenda con un botón por personaje («Poner a Jair»). *(Claude ya lo comprobó sin ventana: `tests/e2e/equipo.spec.ts`; falta ver cómo se ve.)*
- [ ] Al ponerla: sale de la mochila, se ve en la ficha del personaje y suben sus números (DEF, VEL). *(Claude ya lo comprobó sin ventana: `tests/e2e/equipo.spec.ts`; falta ver cómo se ve.)*
- [ ] «Quitar» la devuelve a la mochila. Poner otra en el mismo espacio devuelve la anterior. *(Claude ya lo comprobó sin ventana: `tests/e2e/equipo.spec.ts`; falta ver cómo se ve.)*
- [ ] En una pelea, la tarjeta del personaje muestra «DEF +n»; en la pausa, el Equipo se mira pero no se cambia.
- [ ] Se guarda: guardar la partida, cargarla y que siga puesta.
- [ ] Lo que no se lleva puesto se vende a la mitad en «Tus artículos». Lo puesto no aparece para vender.
- [ ] El bar con Nikki **no** cuenta la ropa (es la vida real).
- [ ] ¿Los botones se ven bien? Se hicieron sin verlos, también en el celular.

## 5. Los caramelos fuera de las peleas (nuevo)

- [ ] Ganarle a Nikki (bajarle la mitad de la vida) da el caramelo rancio.
- [ ] En Equipo › Mochila, «Usar en Jair» sube 10 niveles, la experiencia vuelve a 0 y se gasta. *(Claude ya lo comprobó sin ventana: `tests/e2e/equipo.spec.ts`; falta ver cómo se ve.)*
- [ ] Los números de la ficha suben, y en la siguiente pelea entra con ese nivel.

## 5b. Tienda: consumibles, stock, título e inglés (nuevo)

- [ ] En Boringplace están Elixit++, Condón Spartan, Hepatol y las 4 galletas, con su dibujo, y se usan en las peleas.
- [ ] Hepatol quita solo el veneno. En la pelea, su marca puede salir como «+0»: revisar si queda feo.
- [ ] Caramelo dulce y rancio: se vende uno de cada uno por capítulo; después dice «Se acabó por este capítulo», y en el capítulo siguiente vuelve.
- [ ] **Desde el título** (Extras › Boringram › Boringplace): arriba dice «Comprando para:» con la partida más reciente; se puede elegir otra; al cargar esa partida, lo comprado está ahí y los tokens bajaron. Sin partidas guardadas, solo se mira.
- [ ] **En inglés:** nombres y descripciones de objetos y cassettes, en Boringplace y en Equipo. Cambiar de idioma no desequipa nada. En las peleas todavía sale en español (ver la bitácora).

## 5c. Exportar e importar partidas (nuevo)

En Guardar y en Cargar, cada espacio tiene «Exportar» e «Importar».

- [ ] «Exportar» baja un archivo `.json` a descargas, también en el celular.
- [ ] «Importar» en un espacio vacío la pone ahí; en uno ocupado, pregunta antes de reemplazar. *(Claude ya lo comprobó sin ventana: `tests/e2e/partidas.spec.ts`; falta ver cómo se ve.)*
- [ ] **La prueba importante:** exportar en un navegador, importar en otro y seguir jugando. Comprobar nivel, mochila, ropa y tokens. *(Claude ya lo comprobó entre dos navegadores sin ventana: `tests/e2e/partidas.spec.ts`. Falta la prueba entre la computadora y el celular.)*
- [ ] Importar un archivo cualquiera (una foto, un `.txt`) da un aviso y no rompe nada. *(Claude ya lo comprobó sin ventana: `tests/e2e/partidas.spec.ts`; falta ver cómo se ve.)*
- [ ] Los botones caben en el celular (ahora son cinco por espacio y se acomodan en dos filas).

## 6. Limpieza (revisar que no se rompió nada)

- [ ] Se partieron `Boringram.tsx` y `App.tsx` en archivos más chicos. Boringram tiene que verse y andar igual: inicio,
      historias, mensajes, perfil, compartir, el panel de notificaciones y el tour.

## 7. Las mecánicas nuevas (hechas sin verlas; lo visual es provisional)

Reglas en `docs/BIBLIA_RPG.md`, sección 19. Se compran en Boringplace después de ganar el Bastión y se equipan desde Equipo.
Lo que más hay que mirar: **que la pelea no se trabe** después de cada efecto.

- [ ] Los 7 cebos y la autodestrucción aparecen en Boringplace en gris, con precio, y se equipan desde Equipo.
- [ ] Cada cebo se ve del color de su estado (¿se distinguen?, ¿el filtro se ve bien?).
- [ ] Cuando un enemigo golpea un cebo con efecto, al terminar su ataque sale «¡Era una trampa!» y le aparece el estado en su
      tarjeta. Probarlo con el Capitán también, porque sus balas llegan a destiempo.
- [ ] **Dormido, congelado y paralizado** (cebos sueño, frío y paralizante): el enemigo pierde su turno de 2 a 4 turnos.
- [ ] **En un héroe** (la sombra del Bastión paraliza; para los otros dos, pedirle a Claude que los fuerce): dice que sigue así y salta su turno, sin menú; un compañero con un objeto lo saca; un golpe, no. Peleando solo, dura 1 o 2 turnos.
- [ ] **Quemado:** pierde vida cada turno y pega a la mitad.
- [ ] **Cebo explosivo:** le quita vida al que lo atacó y a su dueño. ¿Es justo lo que quita (25 % y 10 %)?
- [ ] **Autodestrucción:** cae el que la usa y a todos los demás les quita vida, también a los compañeros.
- [ ] **Bomba:** se gana con un 2 % por enemigo. Para probarla sin esperar, pedirle a Claude que suba `BOMBA_BOTIN` (solo para
      la prueba, sin subirlo) o que dé el cassette en la partida. Se equipa como especial, pide la barra llena, se ve la
      cuenta en medio del campo y explota a los 5 turnos. No deja poner otra mientras haya una.
- [ ] **Empate:** Jair solo y un rival: que caigan los dos (la autodestrucción o la bomba). Tiene que decir «¡Empate!» y llevar
      al bad end de esa pelea.
- [ ] **Contra un jefe:** la bomba y la autodestrucción lo dejan justo antes de retirarse, sin ganar solas. Si caen todos los héroes en la explosión, es empate. ¿Se siente bien?
- [ ] **La bomba en el torneo:** al ganar una copa por primera vez, pregunta a qué partida va; al cargarla, el cassette aparece en Equipo. Sin partidas guardadas, espera.

## 8. Lo que queda pendiente de decidir

No hay que probarlo: son decisiones del autor. Claude puede repasarlas una por una.

**Historia**
- [ ] **Capítulo 3:** las 13 preguntas de `docs/guion/cap03_plan.md`. La primera: con qué se llenan sus 2 h 30 min a 3 h.
- [ ] **Capítulo 2:** la historia de las peleas de la muralla y el campamento, y sus bad ends.
- [ ] **El conflicto de fusión del 7B:** qué choca entre Rikka y Cami, y si Jair ejecuta `git merge`.
- [ ] El resto de la lista, en `docs/CRONOGRAMA.md`, «Decisiones pendientes del autor».

**RPG**
- [ ] **Las 6 prendas que no se consiguen** (dos trajes de combate, prendas de sacerdotisa, flor, chaqueta de cuero y zapatos de plataforma). Propuesta de Claude: Cami y Rikka reciben las suyas al empezar el Capítulo 2, sin ponérselas, para no cambiar el Capítulo 1. Falta aclarar si el traje que vende Rikka es uno de estos.
- [ ] **Los números que propuso Claude:** precios de la tienda y de los cassettes; la bomba (90 %, y 2 % de que caiga); la autodestrucción (50 %); el cebo explosivo (25 % y 10 %); dormido, congelado y paralizado en 1 vs 1 (1 a 2 turnos).
- [ ] **«Reunión que pudo ser un correo»** (ataque de Jair): ahora paraliza de 2 a 4 turnos, no 1. ¿Queda muy fuerte?
- [ ] **La final en triple del torneo** sale casi regalada (~99 %). Es de relleno: se balancea cuando se armen las copas de verdad.

**Técnico, para después de probar las peleas**
- [ ] **El inglés en las peleas:** menús, mensajes, y ataques y diálogos de los rivales siguen en español.
- [ ] **La opción C:** que la velocidad (VEL) decida quién actúa primero.
- [ ] **Lo visual provisional:** los colores de los cebos y estados, y la bomba (un 💣 con la cuenta).
- [x] **Sacar los turnos de los héroes** de `Batalla.tsx` a `engine/turnos.ts` (hecho el 2026-11-07, con 16 pruebas). Solo revisar que las peleas se jueguen igual que antes.

**Publicar y limpiar**
- [ ] **La demo publicada** (`main`) sigue en la versión 1.0, con el Capitán del hangar en nivel 12, el más difícil. Publicar solo con orden del autor, cuando las pruebas de arriba estén bien (pasos en `docs/METODOLOGIA.md`).
- [ ] **La segunda computadora** (`MARKETING1ICSH`): si no se va a usar más, borrar la credencial `git:https://jorgeandresur18@github.com` y revocar «Git Credential Manager» en GitHub (Settings → Applications).

## 9. Lo que ya se probó en un navegador real (4 de noviembre)

En la segunda computadora, con un navegador automático sin ventana y sin sonido, que lee texto y errores. **No mira cómo se ve:** los puntos de arriba sobre colores, tamaños y botones siguen pendientes. Los scripts no están en el repositorio.

**Corrieron sin errores en la consola:**
- Bastión y hangar (110 segundos cada uno, sin trabarse; no llegaron al final), demo y bar con Nikki.
- La traición de Nikki: hablarle y después atacarla (sale el veneno y la pelea termina).
- Cebos sueño, tóxico y caliente, con su efecto; cebo explosivo; autodestrucción; la bomba, que explota.
- Exportar, importar en otro espacio y el aviso con un archivo que no es una partida.

**Confirmado (4 nov, principal, con `tests/e2e/cebos.spec.ts`): poner un cebo con otro en pie no traba la pelea.** Sale «Ya hay un cebo…», el menú sigue respondiendo y la pelea avanza. Los 30 s eran el script, que insistía sin leer el aviso. *Antes decía:* las dos pruebas de cebos de estado (sueño, frío y paralizante; tóxico, confuso y caliente) marcaron 30 segundos sin cambios. Lo más probable es que sea el script, que insistía en poner un cebo cuando ya había uno en pie, pero **no está confirmado**. Probar a mano: poner un cebo, intentar poner otro y seguir la pelea.

**No se llegó a probar en navegador:** el empate, un héroe dormido o congelado, la tienda, la ropa y el premio del torneo.

## 10. El Capítulo 3, en borrador (nuevo, 5 de noviembre)

Se juega con `npm run dev`: al terminar el Capítulo 2, «Continuar» sigue al 3 (o `?escena=cap03_calabozo_01`). Claude ya jugó sus peleas sin ventana (sin errores) y la prueba de rutas recorre todo el capítulo.

- [ ] **Leerlo:** ¿la historia y el tono van bien? Es un borrador para corregir.
- [ ] **Las peleas** (calabozo, cuarteles, biblioteca, arsenal y el Rey): son de relleno y sin balance. El Rey usa el dibujo del Capitán hasta que exista el suyo.
- [ ] **Los especiales del Rey** (`?batalla=cap03_rey`): la Espada de las estaciones (dice qué estación cae) y la Tajada del abismo (el héroe casi desaparece de la pantalla, con la etiqueta «desaparecido», y vuelve a los 2 o 3 turnos). Claude ya los vio funcionar sin ventana; falta ver cómo se ven.
- [ ] **El momento del DELETE:** la sentencia letra por letra. ¿Tiene el peso que buscas?
- [ ] **El final «Cancelar»** (cruzar solo) y el despertar.
- [ ] **La torre del Capítulo 3** (`/cap3`): los caminos (cloacas, bodegas o montacargas; comedor o forja; celdas o patio; salón o galería) y los descansos. Las peleas nuevas abren con `?batalla=cap03_cloacas_1` y las demás de `src/data/batallas/cap03_*`. Están sin balancear: anotar cuáles se sienten largas o injustas.
- [ ] **Los cofres de los descansos** del Capítulo 3: Claude ya comprobó sin ventana que lo elegido llega a la mochila (`tests/e2e/torre.spec.ts`); falta ver cómo se ven.
- Nota (5 de noviembre, noche): en las cloacas, la Ráfaga de Jair quemó a un bicho y nunca se vio el daño. Es lo esperado: la quemadura empieza al final del turno siguiente y el bicho cayó antes. **Decisión del autor: la mecánica queda como está.**
- [ ] **Los jefes nuevos:** que se vean bien sus ataques (la reina pone huevos, el chef sirve la olla, el yunque del herrero, los grilletes del alcaide) y que el Rey pelee con espada.

## 11. Las peleas en inglés (nuevo, 5 de noviembre)

Cambiar el idioma a inglés (Opciones) y abrir una pelea (`?batalla=bastion` o `?batalla=cap03_rey`).

- [ ] Que se lea en inglés: los enemigos, sus ataques y especiales, los diálogos de la pelea y lo de «Hablar».
- [ ] **Importante:** con el juego en inglés, que los ataques equipados de Jair, Cami y Rikka sigan siendo los mismos que en español (nada se desequipa al cambiar de idioma).
- [ ] Volver a español: todo como antes.

## 12. La velocidad decide el orden (nuevo, 5 de noviembre, noche)

El más rápido actúa primero: héroes y enemigos mezclados. Esquivar, los objetos, protegerse y los cebos van siempre
primero. Las pruebas automáticas y el simulador ya lo usan (el equilibrio no se movió).

- [ ] **El bar con Nikki** (`?batalla=nikki`): Jair sigue actuando antes que ella (está ebria, más lenta).
- [ ] **Una pelea con un enemigo más rápido** que alguno de los héroes (`?batalla=cap03_rey`: los caballeros empatan con Jair): que el orden se entienda y que esquivar funcione aunque el enemigo sea más rápido.
- [ ] **Que nada se trabe:** dormir o paralizar a un héroe antes de que actúe (pierde la acción y su objeto vuelve a la mochila).
- [ ] **La barra del orden** (arriba a la derecha): que se entienda quién va a actuar, que el ⚡ marque al que esquiva o usa un objeto, y que no tape nada en el celular.

## 13. La esencia y el torneo nuevo (nuevo, 5 de noviembre, noche)

- [ ] **La esencia:** no se ve en el juego. Para mirarla, abrir la consola del navegador (F12) al empezar una pelea: sale «[esencias]» con la de cada héroe. Que en otra partida salgan otras.
- [ ] **El torneo** (Extras › Torneo Genesis, con `?galeria=todo` para tener todo abierto): elegir tres veces el mismo personaje, o un jefe de la torre (el Sargento, la reina…), y pelear. Que sus ataques y su especial funcionen.

## 14. La ropa de inicio y el robo de Nail (nuevo, 5 de noviembre, noche)

- [ ] **Partida nueva › Equipo:** Rikka con la flor y las prendas de sacerdotisa; Cami con el traje azul y la placa de piloto; Jair sin nada.
- [ ] **Las termas del Capítulo 2** (después de la decisión del traje): en Equipo, Rikka con el traje rojo y las prendas ya no están en ninguna parte.
- [ ] **Después del molino**, cuando Rikka vuelve con su kimono: en Equipo, otra vez con las prendas; el traje rojo ya no está, y en Boringplace aparece a la venta.
- [ ] **El menú principal:** al abrir el juego, tocar donde van a salir los botones y los íconos antes de que aparezcan: no tiene que pasar nada.
- [ ] **El torneo en Triple:** que salgan 3 rivales de entrada (el jefe de la ronda con dos soldados) y que la final con Nikki se sienta difícil pero ganable (ahora ~28 % con buen juego).
- [ ] **Los nuevos del torneo** (con `?galeria=todo`): elegir a Jordy, Billy, Maggie y Nikki. Que se vean (con la hoja prestada y otro color), que el puño de Jordy a veces paralice, la hipnosis de Maggie duerma y su Sesión de grupo deje dormidos o confundidos.
- [ ] **Influencer y otaku en el torneo:** que el influencer muestre «+1 seguidor» al hacer un crítico o derribar a alguien y que pegue más; que el otaku duerma con la explicación del lore.

## 15. La escena secreta de las termas y las cajas de texto (nuevo, 6 de noviembre)

- [ ] **La caja de diálogo nueva** en cualquier escena: que se lea bien en el celular y con el modo Retro CRT.
- [ ] **Las termas** (`?escena=cap02_p2_s01`): Rikka más grande; antes de la ráfaga no se la puede tocar; desde la ráfaga, un solo globo que cambia al tocarla, las manos del jugador (pecho desde afuera, nalgada, la que apunta) y el «¡¡KYAAAH!!» arriba.
- [ ] **Después del grito:** la imagen secreta, el fundido a negro lento, y Cami y Jair diciendo que está pálida con Rikka callada.
- [ ] **La galería de Rikka** (`?galeria=todo` › Personajes › «Termas:»): las manos del jugador (no las de Cami), las tres del mismo tamaño; el sprite grande, con las piernas justo en el borde de abajo y un poco de margen arriba; el globo oscuro a la izquierda de la cara.
- [ ] **Jordy** (antes Jordan) en Boringram del Capítulo 2 y en el torneo: que diga «Jordy» en todos lados.

## 16. Los recuerdos de Noodle en Boringram (nuevo, 6 de noviembre)

Jugar el Capítulo 2 hasta la taberna y el 3 hasta el despertar (o `?escena=cap02_p2_049`, `?escena=cap02_t_bc01` y `?escena=cap03_despertar_01`), y abrir Boringram.

- [ ] Llegan los avisos de **Noodle Fotos** («¿Recuerdas esto?»): en el Otoño (hace 14 años), al cargar el celular en la taberna (hace 13) y al despertar (hace 8, la fiesta).
- [ ] Se ven las fotos de Nikki de antes (cuadros grises por ahora), los pensamientos de Jair y, en el chat con Nikki, los mensajes de hace 14 años («estas muy guapa en tu foto 😍» / «gracias jejeje») **arriba de todo**, antes de «nunca te vayas de mi vida».

## 17. El torneo con equipo y Maggie (nuevo, 6 de noviembre)

En el Torneo (`npm run dev`, desde Extras):

- [ ] Elegir a **Maggie**: dormir o confundir al rival y pegarle. ¿Se notan los críticos (casi siempre) contra el dormido?
- [ ] Que los peleadores se sientan parejos, con Billy apenas por encima.
- [ ] En Boringplace aparecen los cuatro objetos de Maggie (no en la demo publicada).

## 18. El Capítulo 1 con los lentes de Jair y reajustado (nuevo, 6 de noviembre)

- [ ] Jair empieza con sus lentes de programador puestos (Equipo).
- [ ] El Bastión (la sombra ahora es nivel 15) y el hangar (el Capitán, nivel 11): ¿se sienten como antes de la ropa de inicio, ni regalados ni imposibles?
- [ ] **La sombra de roca** (`?escena=cap01_g7b_020` o jugando hasta el claro): elegir «Enfrentar al monstruo». La pelea (ahora con tu gólem de piedra; ver abajo), perderla (el final malo de siempre) y ganarla (se congela en el arroyo y sigue la historia). ¿Va o no va?

## 19. Estados y torneo (nuevo, 6 de noviembre)

- [ ] Golpear a alguien dormido: sale «¡DESPIERTA!» y se despierta. A los jefes, dormir, congelar y paralizar les dura menos.
- [ ] En el torneo (con `npm run dev` se ven todos): Nikki y el Rey Malvado como peleadores. En una partida nueva (sin `/all`), solo Jair y Maggie hasta pelear en la historia.
- [ ] **Rivales variados:** jugar dos torneos seguidos y ver que los rivales cambian (personajes como rivales: que miren hacia el lado correcto y peleen bien).
- [ ] **PayFoe al terminar un capítulo:** al llegar al fin del Capítulo 1 o 2 con tokens ganados, aparece «Transferir N tokens»; tocarlo y ver el saldo en la billetera de PayFoe.

## 20. La mochila del torneo (nuevo, 6 de noviembre)

- [ ] En Boringplace, desde el título: comprar un objeto de pelea y una prenda (dice «Para la mochila del torneo» y se paga con PayFoe).
- [ ] En el Torneo, al tocar «Empezar»: la **preparación** (la ropa de cada peleador y la mochila de combate: 4, 6 u 8 según la modalidad). Cambiar una prenda, «Equipo de fábrica», armar la mochila y «¡A pelear!». Al terminar, lo que sobró vuelve a la mochila.
- [ ] Al terminar un capítulo con objetos en la mochila: «¿Quieres pasar objetos a la mochila del torneo?» (hasta 5).
- [ ] En una ronda del torneo, usar algo de la mochila y ver que después baja.
- [ ] **El rival usa su mochila:** en una ronda del torneo (mejor en Bronce o en triple), ver que se cura, se saca estados o se potencia (texto del objeto y número verde).
- [ ] **En el torneo ya no se gana experiencia** ni caen tokens ni objetos al vencer a un rival.
- [ ] **Las curas por porcentaje:** en una pelea, el agua cura el 30 % de la vida (en Jair, en el Capítulo 1, unos 16; en el torneo, mucho más). En Boringplace dice «+30 % de vida».
- [ ] **La pelea de práctica** (`?escena=cap01_g1_086` o jugando hasta que Cami se presenta): Cami explica cada comando, el soldado llama a su cabo, el agua en la mochila. Al ganar, sigue «El piso tiembla». ¿Va o no va?


## 21. El prólogo del Capítulo 1 condensado y corregido (nuevo, 6 de noviembre)

- Jugar desde el principio hasta entrar al bar: se avanza con menos clics (varias líneas seguidas en una sola caja) y
  ningún texto se corta ni se sale de la caja (las más largas: la `001` de la oficina y la `021` de La Lechuza).
- La llamada de la refrigeradora: el chiste nuevo de la carne y la leche (`o08`, `o08b`, `o09`) se lee bien seguido.
- La historia de Nikki en Boringram dice «La Lechuza»; el correo del repositorio dice «granja-bots-final-final-v2».
- Con el juego en inglés, lo mismo (The Owl).
- (Capítulo 2) En el celular, cerca de las 4:48, la notificación de Glitch: «milka está en vivo». Se lee completa.
- (Capítulo 3, al despertar) En Boringram, la publicación de Ari sobre la convención y su perfil `ari.cosplay` (foto en placeholder).

## 22. Lady en el torneo (nuevo, 6 de noviembre; en `npm run dev`)

- Elegir a Lady. Antes de que le peguen, «Copia de fan» dice que es un golpe simple. Después de recibir un golpe, el
  menú dice qué va a copiar y con cuánto poder; al usarlo, Lady golpea con su animación y hace ese daño (y el estado,
  si el golpe copiado dejaba uno).
- Se ve rosada (la hoja de Jair con filtro): es provisional hasta que tenga arte.
- También está la **KJPoper** (amarilla): su «Grito de fan» confunde y «Barra coordinada» pega a todos.
- (Conoce más) La sección nueva «El cine, los actores y los directores», después de la de música latinoamericana, con su subtítulo; y la línea de cine de «Las influencias». En inglés también.

## 23. Objetos libres y un solo estado (nuevo, 6 de noviembre, noche)

- [ ] En cualquier pelea, tocar un objeto: la lista trae a tus peleadores y a los rivales. Darle agua a un rival (se cura) o el pastelillo herbal a un compañero (se confunde).
- [ ] Rikka con la flor de pureza: darle pastillas felices o el pastelillo herbal no le hace nada («no le hace nada: lo protege lo que lleva puesto») y el objeto se gasta.
- [ ] Un personaje envenenado no se puede quemar, dormir, paralizar ni confundir: el ataque o el objeto no le hacen nada hasta que se le pasa el veneno (o se lo sacas con un antídoto).

## 24. El editor de diálogos en vivo (nuevo, 6 de noviembre, noche; en `npm run dev`)

- [ ] Jugar el Capítulo 1 y, en cualquier línea, tocar «✎ Editar»: cambiar el texto y «Guardar». Sale la etiqueta amarilla «EDITADO» y la línea queda con tu texto (también si vuelves a pasar por ahí).
- [ ] «Volver al original» la deja como estaba. Mientras escribes, Espacio y Enter no hacen avanzar la historia.
- [ ] Cuando termines una tanda, avisar a Claude: lee `docs/guion/ediciones_en_vivo.json`, te corrige la redacción y lo aplica con el inglés.
- [ ] Las flechas ◀ ▶ al lado de la caja: la anterior y la siguiente línea (en las decisiones, ▶ espera a que elijas).
- [ ] La marca ✓ verde en las líneas que corregiste (por ejemplo, la clienta de la refrigeradora). En el editor, «Poner ✓» en una línea de Claude que apruebes y «Quitar ✓».

## 25. La sombra de roca con tus sprites (nuevo, 7 de noviembre)

Abrir `http://localhost:5173/?batalla=sombra_roca`. Claude ya vio cada ataque sin ventana (capturas); falta verlo en movimiento.
- [ ] **El fondo nuevo** (el tuyo, el claro con el arroyo congelado): que la roca y los héroes pisen bien (con `&cuadricula` se ven los puntos).
- [ ] **La lluvia de meteoritos:** el cielo morado con nubes, los meteoritos cayendo hacia los héroes y el estallido morado. ¿Son suficientes? ¿El cielo se nota?
- [ ] **Las montañitas del brazo:** brotan por el suelo hasta cada uno. ¿Más grandes, más, más lentas?
- [ ] **La bola de espinas (especial):** de pie, se arrodilla, carga mientras le llegan pedruscos y se transforma en la bola (más grande); se queda así 3 o 4 turnos. Mientras tanto solo rueda contra uno (sin especiales) y su barra no se carga. Si le pegas, solo brilla. A Jair el puño le devuelve un poco («se pincha») y a Cami «las balas rebotan». ¿DEF +10 y el 25 % se sienten bien?
- [ ] **Derrotarla siendo bola:** se desintegra (brilla, estallidos morados y desaparece) y sigue la historia.
- [ ] **El puño:** se ve entero (con las llamas y la vuelta a la guardia), unos 2,7 segundos. ¿Muy lento?
- [ ] **La dificultad:** simulada, ~98 % si juegas atento y ~87 % sin cuidado (la bajé porque la sentiste difícil). ¿Ahora sí?

## 26. Cami armored y el Berserk (nuevo, 7 de noviembre)

Abrir `http://localhost:5173/?batalla=prueba_armored`.
- [ ] **La transformación:** Cami empieza normal. Llena su barra (Objetos › 4Low-Co) y usa **★ Armored**: se cubre con la armadura (tu sprite, con el parpadeo) y ese es su turno. El turno siguiente ya pelea como armored.
- [ ] **Blaster+:** dispara desde el puño, sin números en el menú. Lo bajé de 22 a 16 (ya no borra soldados de un tiro).
- [ ] **El botón BERSERK:** grande, azul y blanco, siempre listo (sin porcentaje; la tarjeta de Cami no tiene barra).
- [ ] **Berserk:** se le cierra el casco (cambia al sprite con visor y cañones), grita «¡Agáchense!» y Jair y Rikka se agachan; va al medio y suelta el frenesí: la espiral cada vez más cargada y misiles que explotan, 7,5 segundos. ¿Es la monstruosidad que buscabas? ¿Las explosiones tapan demasiado?
- [ ] Al terminar: se saca el casco y **pierde la armadura: vuelve a ser la Cami de siempre** (traje azul, sus ataques y su barra) el resto de la pelea. El turno siguiente descansa agachada y después vuelve a elegir. **El Armored ya no aparece** en su menú (un especial+ por pelea).

## 27. Rikka princesa de luna y lo nuevo del armored (nuevo, 8 de noviembre)

Abrir `http://localhost:5173/?batalla=prueba_luna` (Rikka) y `?batalla=prueba_armored` (Cami). Para la barra: Objetos › 4Low-Co.
- [ ] **Rikka se transforma** con «★ Princesa de luna» (gasta el turno) en tu princesa de luna; el turno siguiente su menú es **Corte de luna** y **SENTENCIA LUNAR**.
- [ ] **Corte de luna:** saca la espada y sale la media luna. ¿El tramo de la animación que elegí sirve, o prefieres otro?
- [ ] **Sentencia lunar:** reza, se hace de noche detrás de todos, sube tu luna en pixel art con su luz y los brillos, se alza y suelta la onda. Los soldados quedan confundidos y tu equipo se cura. Al bajar vuelve a ser Rikka y queda confundida.
- [ ] **Rikka derrotada:** tu sprite nuevo (para verlo, que la tumben).
- [ ] **El Blaster+:** tu animación (carga y rayo) y el rayo sigue hasta el soldado. **El Berserk:** la pose de los cañones abiertos y el brillo loco.
- [ ] **Los HTML separados:** en `docs/sprites de prueba/personajes/` hay una carpeta por personaje con su HTML (y `index.html`). Para cambiar a uno, reemplazas su HTML; `python -I -X utf8 tools/sprites_separar.py juntar` los vuelve a unir en `todos.html`.

