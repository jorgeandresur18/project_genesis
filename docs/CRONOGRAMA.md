# CRONOGRAMA — PROJECT GENESIS

Plan de trabajo por semanas. Es una guía, no un contrato: se ajusta cuando el autor cambia prioridades. Lo hecho
se marca con [x] y se anota en `docs/BITACORA.md`.

## Cómo se organiza

**La historia manda.** El juego base se juega en orden: un capítulo sin terminar frena todo lo que viene después.
El RPG, Boringram y el arte se hacen **para el capítulo que toca**, no por adelantado.

**Cada semana tiene un foco y tareas livianas alrededor.** Según el costo:

| Tipo | Costo | Quién | Ejemplos |
|---|---|---|---|
| Liviana | Bajo | El autor (Gemini, Photoshop, Upscayl) y Claude solo la integra | Sprites de la novela, fondos, CG |
| Media | Medio | Claude con revisión del autor | Escribir y enlazar escenas, Boringram, pulir diálogos |
| Pesada | Alto (muchos tokens) | Claude | Sprites del RPG (hojas, animaciones, efectos), mecánicas nuevas |

**Reglas para gastar menos:**
1. **Los sprites del RPG se hacen en tanda,** todos los de una pelea en la misma sesión, y solo cuando la historia necesita esa pelea.
2. **El RPG queda congelado en mecánicas.** Mientras no llegue una pelea que lo pida, no se agregan estados, objetos ni sistemas: solo arreglos y lo que cada pelea nueva necesita.
3. **Los diálogos se pulen por capítulo,** cuando el capítulo ya está enlazado y se juega de corrido.
4. **Cada sesión cierra con una entrada en la bitácora** y commits chicos (nada de otro «cap1»).

---

## Dónde estamos (4 de noviembre, mediodía)

| Parte | Estado |
|---|---|
| Capítulo 1 | **Lógica cerrada** (2026-11-03). Completo y jugable; tiene el RPG (bar, Bastión, hangar). Diálogos y arte, al final. |
| Capítulo 2 | Borrador avanzado en `cap02.json`, **enlazado** al Capítulo 1 (2026-11-03: «Continuar» en la pantalla de fin). Coherencia revisada. Faltan la historia de sus peleas y el arte. |
| Capítulo 3 | **Borrador jugable** (2026-11-05): torre de 9 pisos con caminos que se cruzan, 23 peleas equilibradas con el simulador, cofres en los descansos, 12 bad ends y `alt_1`. Faltan los enemigos del autor y el arte. |
| Capítulo 4 | Borrador del autor (17 escenas) en `docs/CANON.md`; sin guion. |
| Capítulos 5 a 7 | Esquema en el canon. |
| RPG | Ficha única por personaje, varios especiales, ataques intercambiables con cassettes, ataques nuevos y sueltos, Torneo Genesis y PayFoe (de relleno). Faltan: olvidar ataques, la regla anti-farmeo y sacar de `Batalla.tsx` los turnos de los héroes (los de los enemigos ya están en `engine/turnos.ts`). |
| Boringram y Boringplace | Completos para los Capítulos 1 y 2. |
| Robustez | Hecha el 3 de noviembre: pantalla de error, guardado seguro, ESLint y CI. |

---

## Proyección con 44 horas por semana (hecha el 4 de noviembre de 2026)

La misma proyección, para mirarla en el navegador: `docs/proyeccion.html`.

**Ritmo que dio el autor:** 6 horas de lunes a viernes (3 en el trabajo y 3 en casa) y 7 los sábados y domingos: **44 horas por semana**. Es una estimación de Claude, con un margen de ±30 %: mide con solo dos capítulos escritos. **Reemplaza a las fechas por semana de abajo**, que suponían menos horas; esas listas siguen valiendo como lista de tareas.

**De dónde salen los números:** ~83 horas hasta hoy (calculadas con los commits, que no cuentan lo que se conversó o probó sin commit) dieron dos capítulos con ~2.580 escenas, además del RPG y los sistemas. Medida usada: ~15 horas por cada hora de lectura de historia.

| Etapa | Horas | Con 44 h/semana | Con atrasos (~31 h/semana) |
|---|---|---|---|
| **Lógica del juego base** (Capítulos 2 a 7, finales alternativos y RPG) | ~365 | principios de enero de 2027 | fines de enero de 2027 |
| **Versión 2.0** (diálogos, arte, sprites, inglés, sonido y pruebas completas) | ~425 | mediados de marzo de 2027 | principios de mayo de 2027 |
| **Total hasta el lanzamiento** | **~790** | **~4 meses** | **~6 meses** |
| *Después del lanzamiento:* las tres expansiones (Génesis++, RikkaQuest y Génesis#) | ~375 | sin fecha | sin fecha |

**Las expansiones quedan para después del lanzamiento** (decisión del autor, 2026-11-04): el proyecto es el juego base. Las horas ya incluyen un 25 % para arreglos y cambios de idea. La columna «con atrasos» supone que se cumple el 70 % del ritmo.

**Detalle de la lógica del juego base (con ese 25 %):**

| Qué | Horas | Terminaría, con 44 h/semana |
|---|---|---|
| Probar lo del 4 de noviembre, las peleas del Capítulo 2 y lo que falta del RPG | ~56 | 14 de noviembre |
| Capítulo 3 (con la pelea de THE KING) | ~69 | 25 de noviembre |
| Capítulo 4 (con los otakus y Boringram) | ~54 | 3 de diciembre |
| Capítulo 5 | ~38 | 9 de diciembre |
| Capítulo 6 (con la batalla de las cinco manifestaciones) | ~81 | 22 de diciembre |
| Epílogos 7A y 7B y finales alternativos | ~66 | 2 de enero de 2027 |

**Lo que más puede mover estas fechas:**
- **Las decisiones del autor:** cada capítulo espera sus respuestas antes de escribirse (empezando por `docs/guion/cap03_plan.md`).
- **El arte:** es lo más incierto de la 2.0, y buena parte la hace el autor (se estimaron ~125 horas de novela y ~70 de sprites del RPG).
- **La duración del Capítulo 3:** se calculó con las 2 h 30 min a 3 h del canon; si baja a 1 h 30 min, son unas 25 horas menos.
- **Diciembre:** las fechas no descuentan feriados.

---

## Semana 1 (3–9 de noviembre): cerrar los Capítulos 1 y 2
- [x] **Robustez** (hecha el 2026-11-03): pantalla de error dentro del juego (`src/components/Robustez.tsx`), guardado seguro (`src/engine/guardado.ts`), ESLint (`npm run lint`) y CI en GitHub Actions (`.github/workflows/ci.yml`).
- [x] **Resincronizar el guion del Capítulo 1** (hecho el 2026-11-03; también el del Capítulo 2).
- [x] **Cerrar la lógica del Capítulo 1** (2026-11-03): revisión de coherencia contra el canon, regla en `CLAUDE.md` y etiqueta `cap01-logica-cerrada`.
- [ ] **Pulir los diálogos del Capítulo 1:** el autor lee el guion y marca; Claude corrige con `docs/TONO.md`. *Pasa al final* (decisión del autor del 2026-11-03: diálogos y arte después de la lógica).
- [x] Título del Capítulo 2: «El viaje del héroe*», que al terminar pasa a «El viaje del antihéroe» (portada y pantalla de fin).
- [x] **Terminar el Capítulo 2 (lo que no depende del autor):** revisión de coherencia contra el canon y enlazado al Capítulo 1 (2026-11-03). Falta del autor: la historia de las peleas de la muralla y el campamento y sus bad ends.
- [ ] *Liviana:* arte del Capítulo 2 que falte (`docs/guion/cap02_arte.md`): Rikka con traje rojo y espada, etc.

## Semana 2 (10–16 de noviembre): las peleas del Capítulo 2
- [x] **Ordenar el RPG antes de sumar peleas** (2026-11-03): una sola ficha por personaje, `Batalla.tsx` partido (etapa 1: el dibujo), varios especiales y balance simulado del Bastión, el bar, el hangar y el torneo. Etapa 2 (2026-11-04, segunda computadora): la lógica de turnos sin dibujo en `src/engine/turnos.ts` (estado inicial, decisión de los enemigos, cebos, fin del turno). El simulador del balance ya juega con esas reglas (`tests/simulador.ts`, 2026-11-04). Queda para después: los turnos de los héroes y el bucle de la pelea en pantalla.
- [ ] **Decidir y hacer las peleas del Capítulo 2:** la muralla (Rikka sola), el campamento, el molino con el cassette y Cami acorazada. **Plantillas de relleno ya enganchadas** (2026-11-03; ver `BIBLIA_RPG.md`, sección 12): falta la historia de cada una. El plan simplificado de la cuenta regresiva espera la confirmación del autor.
- [ ] *Pesada:* sprites del RPG de esas peleas, en tanda.
- [ ] **Pulir los diálogos del Capítulo 2.**
- [ ] *Media:* Boringram del Capítulo 2 completo (Jordan, Lady, las fotos del viaje).

- [x] **Ataques intercambiables** (hecho el 2026-11-03; diseño en `BIBLIA_RPG.md`, sección 18): 3 ataques y 2 especiales equipados, el resto en la mochila; los originales vinculados a su personaje; los sueltos se compran, se venden y se ganan en el torneo. Falta probarlos en el navegador y los ataques del torneo.
- [x] **Partir `Boringram.tsx` y `App.tsx`** (2026-11-04, segunda computadora): solo se movió código.
- [x] **Mecánicas nuevas** (2026-11-04, segunda computadora; `BIBLIA_RPG.md`, sección 19): dormido, quemado y congelado, cebos con efecto, cebo explosivo, autodestrucción, bomba del día del juicio y empate. Falta probarlas en pantalla y lo visual definitivo.
- [x] **Equipo y permanentes fuera de pelea** (2026-11-04, segunda computadora; `src/engine/equipo.ts`). Falta probarlo en pantalla.
- [ ] **PayFoe y el Torneo Genesis** (pedido del autor el 2026-11-03; diseño en `BIBLIA_RPG.md`, sección 17), en partes: (1) ~~PayFoe y la transferencia~~, (2) ~~el torneo y sus copas~~ y (3) ~~Nikki campeona~~ **hechos el 2026-11-03 (de relleno)**; falta (4): los desbloqueables a la venta y la versión sin censura de 1.000.000, y los seis ataques de Nikki.

## Semanas 3 y 4 (17–30 de noviembre): el Capítulo 3
- [x] **Borrador del Capítulo 3** (2026-11-05, computadora del trabajo: `src/data/chapters/cap03.json`, 168 escenas, 5 peleas de relleno, 8 bad ends y `alt_1`). Falta: los enemigos y el arte del autor, el balance de las peleas, la pasada de diálogos. Antes decía: **Escribir el guion del Capítulo 3** desde el canon (`docs/guion/cap03_plan.md`: lo decidido y las 13 preguntas): el Rey Malvado, la espada DELETE, el DELETE sin WHERE, el regreso (`alt_1`: volver solo) y el despertar con Cami y Rikka en el cuarto.
- [x] **La torre del Capítulo 3** (2026-11-05): 9 pisos, 23 peleas (~15 por partida), enemigos provisionales, guardias de las estaciones (presos y al servicio del Rey), cofres en los descansos, botín por piso y equilibrio en cadena (`tests/torre_ajuste.test.ts`).
- [ ] **Los enemigos del autor para la torre** (hoy fichas provisionales; ideas en la bitácora del 5 de noviembre). Después, reequilibrar con `TORRE=1 AJUSTAR=1`.
- [ ] **Resolver antes de escribir:** las decisiones pendientes del Capítulo 3 (ver abajo).
- [ ] **La pelea contra el Rey Malvado del Capítulo 3:** solo THE KING, en su forma normal (la gigante, en el Capítulo 6), con la cara oculta, hasta el DELETE sin WHERE. *Pesada:* su sprite (el autor todavía no lo hizo). La batalla de las cinco manifestaciones es del Capítulo 6, rama del 7A (`docs/BATALLA_FINAL.md`).
- [ ] *Liviana:* fondos y CG del Capítulo 3.
- [ ] *Media:* la notificación de la migración en el celular de Jair.

## Semanas 5 y 6 (1–14 de diciembre): el Capítulo 4
- [ ] **Escribir el guion del Capítulo 4** desde el borrador del autor (escenas 1 a 9: del despertar a «conseguí trabajo en el centro»).
- [ ] **Pelea RPG con los otakus en la convención** (Cami). *Pesada:* sprites de los otakus. Es la primera pelea en el mundo real después del bar: ¿«vida real» como la de Nikki?
- [ ] *Liviana:* fondos del mundo real del Capítulo 4 (departamento de día, la convención, las calles donde buscan trabajo).
- [ ] *Liviana:* sprites nuevos: Lady (la compañera de tesis), Jordan, Billy, Maggi, amigos de Nikki, Cami con uniforme de Dulce Frío. Hojas de pelea de Jordan, Billy y Maggi (propuesta en `BIBLIA_RPG.md`, sección 20).
- [ ] *Media:* Boringram del Capítulo 4 (las fotos de la convención, lo que ven Lady, Jordan y Nikki).
- [ ] **Pendientes del RPG que el Capítulo 4 pide:** la tienda desde el título y equiparse de verdad, si la historia lo necesita.

## Después (desde el 15 de diciembre)
- Capítulo 5 (escenas 10 a 17 del borrador: Dulce Frío, el beso, el parque y el bar; el medio que falta; el descubrimiento). Fondos: Dulce Frío por dentro, el parque, el centro. (Génesis++ y las demás expansiones, después del lanzamiento.)
- Capítulo 6 (la bifurcación y sus dos ramas: la cara del Rey; en la rama A, la fusión en AnothergIrl y la batalla de las cinco manifestaciones) y los epílogos 7A y 7B.
- Pendientes del RPG sin fecha: olvidar un ataque, regla anti-farmeo, `npm run escalar` con Upscayl.

---

## Para mañana (6 de noviembre, desde la computadora del trabajo: nada que requiera probar)

Decisiones y datos que solo puede dar el autor; Claude los aplica sin pedir pruebas (las pruebas, de noche, en la
computadora de Jorge: ver `docs/PRUEBAS_EN_CASA.md`).

0. **Publicada la 1.1.3** (5 de noviembre, orden del autor; la 1.1.2 cerró los atajos): `/all` y los demás atajos piden el PIN del autor. Publicar en tandas, para no gastar el límite de Vercel; probar a diario con `npm run dev`.
1. **Los enlaces de Lolabúm** que faltan: «16 Phantasmas», «Tócame» y «Novedades ecuatorianas» (hoy abren la búsqueda
   de Spotify).
2. **El repositorio sigue público** (decisión del autor, 5 de noviembre: por ahora no pasa a privado).
3. **Mirar que Vercel haya publicado la 1.1.0** (la CI de `main` dio bien: comprobado el 5 de noviembre).
4. **Boringram del menú:** si en el menú se pueden comprar objetos de pelea con PayFoe, ¿llegan a la próxima partida
   («cofre») o no se venden ahí? (ver «Ideas anotadas»).
5. **Estados (opcionales):** ¿a los jefes les duran menos dormido, congelado y paralizado? ¿un golpe despierta al
   dormido? ¿subirle al veneno o bajarle al quemado contra jefes?
6. **Precios** propuestos por Claude (pastelillo herbal 90, pastillas felices 45, CeBiDol 400, Multicebo 150 y los de
   la tabla): revisarlos cuando quiera.
7. **Capítulo 2:** las decisiones de abajo («Decisiones pendientes del autor») y las preguntas de
   `docs/guion/cap03_plan.md`.
8. **Boringram en los Capítulos 2 y 3 (lo hace el autor):** hacer más eventos de Boringram (posts, historias, pensamientos de Jair) para el Capítulo 2 y el 3. Anotado el 2026-11-05.
9. **Capítulo 3, tres preguntas de coherencia** (al final de `docs/guion/cap03_plan.md`).
10. **Inglés de la historia de los Capítulos 2 y 3:** cuando se cierren sus diálogos.
11. **Arte (cuando toque):** si quiere el mosaico de la censura más grueso en los archivos; si la mano de abajo de espalda
   queda como está.

**Para la noche (computadora de Jorge), lo que falta probar:** la segunda revisión de las peleas del Bastión, Nikki y el hangar con las reglas
nuevas (veneno y quemadura desde el turno siguiente, turno libre, quemar de Jair, saltos al esquivar); la galería de
Rikka (manos, nalgadas, la marca a las 7, el grito a los 30); el CeBiDol desde Equipo; y la demo publicada 1.1.0.

## Ideas anotadas (por diseñar)

**Dos Boringram (idea del autor, 2026-11-05).** Hoy hay uno solo: lo que muestra depende de las escenas vistas en *cualquier* partida (`snapshots`), así que al empezar de nuevo ya aparecen publicaciones del futuro.
- **El de la historia** (el que se abre jugando): va ligado a la partida en curso: solo lo que desbloquearon las escenas por las que pasó *esta* partida (su `history`), en el orden en que ocurren, con la hora y la batería de ese momento.
- **El del menú**: el archivo de todo lo que ya desbloqueaste y viste, en todas las partidas (como hoy).
- **PayFoe y las compras (propuesta de Claude, a confirmar):**
  - En la historia, Boringplace vende con los **tokens de la partida** y lo comprado va a **su mochila** (consumibles, cassettes, ropa: cosas que sirven en las peleas de esa partida). La tarjeta de PayFoe sigue arriba, para pasar tokens de la partida a la billetera.
  - En el menú no hay partida abierta (no hay mochila ni tokens): la tienda vende solo con **PayFoe** y solo cosas de todo el juego (los desbloqueables a la venta, sprites o imágenes de la galería, la entrada al torneo). Lo de las peleas no se vende ahí, o se guarda en un «cofre» que llega a la próxima partida que cargues (a decidir).
  - Así PayFoe es la cuenta de todo el juego y los tokens son el dinero de cada partida, como ya está en `BIBLIA_RPG.md` (sección 17).

## Decisiones pendientes del autor
Se responden cuando toque su semana; mientras, no se inventan.

**Capítulo 2**
- El plan de las peleas (la cuenta regresiva simplificada).
- Qué espiaba entre los arbustos en la escena secreta.
- El nombre del plato de la resaca.

**Capítulo 3**
- Cómo es la pelea final del Capítulo 6 (la del Capítulo 3 ya tiene su forma: THE KING, sin la versión gigante, que queda para el Capítulo 6).

**Capítulo 4**
- Los demás amigos nuevos (Lady y Jordan ya están).
- Cuál es el adelanto en la primera convención.

**Capítulo 5**
- Por qué Cami besa a Jair a propósito.
- Cómo sigue después de la cuenta del bar, y el medio hasta el descubrimiento.

**Modo Retro CRT**
- Rehacer el logo del televisor con letras propias (hoy imita el de una consola real).
- Retocar el fondo del cuarto (el robot parecido a Gundam y el control con forma de Super Nintendo).
- ¿Canales del televisor que muestran algo en ciertos capítulos? (idea de Claude, sin aprobar).

**Títulos de los capítulos 3 a 7 (resuelto el 2026-11-03; ya no está pendiente)**
- Elegidos: Capítulo 3, «Sin DÓNDE ir» / «NoWHERE»; Capítulo 4, «"Hola, mundo real"» / «"Hello, Real World"» (con las comillas); Capítulo 5, «Conflicto de dependencias» / «Dependency Hell»; Capítulo 6, «Dios ha muerto;» / «God Is Dead;». Epílogo 7B, «Mientras sea verdad» / «While It Holds True». Epílogo 7A, «Rompiendo lo escrito» / «Breaking from the Script». Están todos en `docs/CANON.md`.

**General**
- Las preguntas abiertas de Blueberries y Nikki.
- El clon del lado de los héroes.
- Cuánto tardó GENESIS en terminar el juego.
- `AnothergIrl`: si las mayúsculas forman «AI» a propósito.
- El conflicto de fusión del 7B (en la pelea final del Capítulo 6): qué choca entre Rikka y Cami y si Jair ejecuta el comando.
- Cómo se consiguen las prendas que no se compran (trajes, flor, chaqueta de cuero, zapatos): `docs/BIBLIA_RPG.md`, sección 15.
- Las frases de confusión del RPG, para aprobar o corregir.
