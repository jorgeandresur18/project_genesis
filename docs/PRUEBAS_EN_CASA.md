# Qué probar en la computadora de casa

Lista de lo que se hizo el 4 de noviembre de 2026 en la segunda computadora (`MARKETING1ICSH`), donde no se pudo jugar
ni ver nada en pantalla. Todo pasó las pruebas automáticas, pero **nadie lo vio funcionando**.

**Para Claude en la computadora de casa:** lee este archivo, guía al autor punto por punto, y tacha aquí lo que quede
confirmado. Si algo falla, primero mira `docs/BITACORA.md` (entrada del 4 de noviembre) y, para las peleas, la lógica
que se movió a `src/engine/turnos.ts`.

**Cómo pedírselo:** «Lee `docs/PRUEBAS_EN_CASA.md` y guíame para probar todo».

## 1. Antes de probar: juntar las dos computadoras

- [ ] En la carpeta del proyecto: `git checkout desarrollo` y `git status`.
- [ ] Revisar si quedó algo sin subir de la noche del 3 de noviembre: `git log --branches --not --remotes`. El autor
      recuerda cambios de cerca de las 23:00, pero en GitHub lo último de esa noche es de las 22:44.
- [ ] Si hay cambios sin guardar, hacer un commit con ellos.
- [ ] `git pull`. Si dice `CONFLICT`, Claude ayuda a elegir qué se queda (lo más probable: `BITACORA.md` y
      `CRONOGRAMA.md`). Nunca `push --force`.
- [ ] `npm install` y `npm test` (deben pasar todas) y `npm run dev`.

## 2. Las peleas (se cambió cómo está armado el código, no cómo se juega)

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
- [ ] En Equipo › Mochila aparece la prenda con un botón por personaje («Poner a Jair»).
- [ ] Al ponerla: sale de la mochila, se ve en la ficha del personaje y suben sus números (DEF, VEL).
- [ ] «Quitar» la devuelve a la mochila. Poner otra en el mismo espacio devuelve la anterior.
- [ ] En una pelea, la tarjeta del personaje muestra «DEF +n»; en la pausa, el Equipo se mira pero no se cambia.
- [ ] Se guarda: guardar la partida, cargarla y que siga puesta.
- [ ] Lo que no se lleva puesto se vende a la mitad en «Tus artículos». Lo puesto no aparece para vender.
- [ ] El bar con Nikki **no** cuenta la ropa (es la vida real).
- [ ] ¿Los botones se ven bien? Se hicieron sin verlos, también en el celular.

## 5. Los caramelos fuera de las peleas (nuevo)

- [ ] Ganarle a Nikki (bajarle la mitad de la vida) da el caramelo rancio.
- [ ] En Equipo › Mochila, «Usar en Jair» sube 10 niveles, la experiencia vuelve a 0 y se gasta.
- [ ] Los números de la ficha suben, y en la siguiente pelea entra con ese nivel.

## 5b. Tienda: consumibles, stock, título e inglés (nuevo)

- [ ] En Boringplace están Elixit++, Condón Spartan, Hepatol y las 4 galletas, con su dibujo, y se usan en las peleas.
- [ ] Hepatol quita solo el veneno. En la pelea, su marca puede salir como «+0»: revisar si queda feo.
- [ ] Caramelo dulce y rancio: se vende uno de cada uno por capítulo; después dice «Se acabó por este capítulo», y en el capítulo siguiente vuelve.
- [ ] **Desde el título** (Extras › Boringram › Boringplace): arriba dice «Comprando para:» con la partida más reciente; se puede elegir otra; al cargar esa partida, lo comprado está ahí y los tokens bajaron. Sin partidas guardadas, solo se mira.
- [ ] **En inglés:** nombres y descripciones de objetos y cassettes, en Boringplace y en Equipo. Cambiar de idioma no desequipa nada. En las peleas todavía sale en español (ver la bitácora).

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
- [ ] **Sacar los turnos de los héroes** de `Batalla.tsx` a `engine/turnos.ts`.

**Publicar y limpiar**
- [ ] **La demo publicada** (`main`) sigue en la versión 1.0, con el Capitán del hangar en nivel 12, el más difícil. Publicar solo con orden del autor, cuando las pruebas de arriba estén bien (pasos en `docs/METODOLOGIA.md`).
- [ ] **La segunda computadora** (`MARKETING1ICSH`): si no se va a usar más, borrar la credencial `git:https://jorgeandresur18@github.com` y revocar «Git Credential Manager» en GitHub (Settings → Applications).
