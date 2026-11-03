# BITÁCORA — PROJECT GENESIS

Qué se hizo cada día, qué decidió el autor y qué quedó pendiente. La fuente es el historial de git (incluida la
rama local `respaldo-historial-2026-11-02`, que guarda el detalle de los días que se subieron juntos en el commit
«cap1») y los documentos del proyecto. Desde el 2026-11-02 se agrega una entrada al terminar cada sesión.

Para lo que viene, ver `docs/CRONOGRAMA.md`.

---

## Resumen de los primeros 9 días (24 de octubre – 2 de noviembre de 2026)

| Día | Commits | Foco |
|---|---|---|
| 24–25 oct | 10 | Nace la novela: motor, Capítulo 1 en borrador, título, celular |
| 26 oct | 16 | Música, sonido, fundidos, primeros sprites y fondos reales, dirección psicológica |
| 27 oct | 39 | El mundo: lore, Noodle, la Voz, Geekdump, correo, IDE; pantallas de fin y bad end |
| 28 oct | 28 | Capítulo 2 en borrador, Boringram en la historia, inglés, menú nuevo, mapa |
| 29 oct | 34 | Galería, Boringram completo, zona de peligro, retroceder y adelantar |
| 30 oct | 31 | Boringram con la hora real, guardados con nombre, Bootcamp Genesis, Conoce más |
| 31 oct | 9 | Nombre corregido a PROJECT GENESIS; el Bastión pasa de nivel de acción a RPG por turnos |
| 1 nov | 40 | Nace el RPG de verdad (Bastión, bar con Nikki, especiales, probador); escena secreta del traje rojo; Boringplace |
| 2 nov | 78 | Todo RPG: hangar y Capitán, beso, Cebo, clon, Mega Bola, tienda, pausa, equipo, reglas de esquivar; canon del Capítulo 4 |

**Total:** ~285 commits (235 en `main` y el detalle del 31 y el 1 en el respaldo).

### Horas por día (calculadas con los commits)
Cada tramo va del primer al último commit, más 30 minutos de trabajo antes del primero; una pausa de más de 1 h 15 min corta el tramo. Lo que pasa antes de las 6:00 cuenta para el día anterior (es la misma noche). Es una estimación: no registra lo que se conversó o probó sin commit, ni el 24 de octubre (el primer commit es del 25).

| Día | Horas | Commits | Tramos |
|---|---|---|---|
| 25 oct | 3,0 | 19 | 22:43–1:13 |
| 26 oct | 2,7 | 8 | 20:24–21:16 · 23:11–0:00 |
| 27 oct | 6,3 | 38 | 13:46–13:58 · 16:27–21:34 |
| 28 oct | 14,6 | 66 | 12:15–14:26 · 16:56–4:18 |
| 29 oct | 10,3 | 77 | 13:03–14:41 · 20:19–0:28 · 2:10–5:10 |
| 30 oct | 5,1 | 34 | 13:38–18:16 |
| 31 oct | 3,5 | 14 | 14:51–15:48 · 23:03–0:39 |
| 1 nov | 12,5 | 63 | 9:47–12:57 · 15:19–16:07 · 21:07–3:38 |
| 2 nov | 13,3 | 70 | 11:27–18:21 · 20:01–1:26 |
| **Total** | **~71** | **389** | promedio ~7,9 h por día |

---

## 24–25 de octubre — Nace la novela
- Claude escribe el borrador completo del Capítulo 1 (`cap01.json`) y el motor: texto que se escribe solo, velocidad, decisiones.
- Logo, advertencia de lenguaje, fondo espacial en el título, «Conoce más del proyecto» en lugar de créditos.
- El protagonista pasa a llamarse **Jair**. Adaptación a celular. Primeros sonidos.

## 26 de octubre — Que se sienta como un juego
- Música del título y del Capítulo 1, sonido del texto, fundidos (negro al cambiar de lugar, blanco al entrar al juego).
- Bad ends de la noche que crea el juego, galería, «el fin de un capítulo no es un final», modo auto.
- Sprites nuevos (Cami, Rikka, Nikki, enemigos) y los primeros fondos reales (oficina, departamento, bar).
- Entra `docs/DIRECCION_PSICOLOGICA.md`.

## 27 de octubre — Nace el mundo
- **Decisiones del autor:** Cami acompañante, el orgullo noble de Rikka, el embarazo no se revela, sin cifras de dinero.
- Lore de las dos dimensiones, THE NEXUS, la Voz que solo oye Jair, la Federación del Rey, el framework Reckt.
- Pantallas hechas en código: IDE GRAVITY, correo (con spam de humor negro), celular, Geekdump (parodia de GitHub).
- Pantalla de fin de capítulo, pantalla de bad end con glitch, decisiones más visibles, todos los fondos y CG del Capítulo 1.

## 28 de octubre — Capítulo 2 y Boringram
- Inicio del Capítulo 2 en borrador (la ciudadela de la Primavera), trabajado solo en local por pedido del autor.
- Boringram aparece en la historia (modo oscuro, la historia de Nikki).
- **La semilla del RPG:** «las opciones de pelear» eran 4 decisiones (dos fallan, dos son bad ends).
- Español e inglés, menú del título nuevo con paneles de terminal, easter egg de Nikki, mapa de decisiones.
- Finales tempranos (borrar el correo, «la única vez que dijo que no»), el rechazo en el bar y el taxi.
- Capítulo 1 traducido al inglés.

## 29 de octubre — Galería y Boringram completo
- Galería con fichas de humor negro, pestañas por personaje, «nuevo» en lo desbloqueado.
- Boringram como extra y dentro de la partida: me gusta, comentarios, teclado propio, compartir en redes, tutorial.
- Opciones: «Zona de peligro» al estilo GitHub y el borrado con barra de archivos y chistes.
- Retroceder y adelantar (x2 a x16), «Decisión anterior / Próxima decisión», probar un capítulo con `/capN`.
- **Aprobado y nunca hecho:** robustez (ErrorBoundary, guardado seguro, CI, ESLint). Sigue pendiente.

## 30 de octubre — El celular en la hora real
- Boringram sigue la hora del mundo real (escala 45 a 1, «hace» calculados, día de la semana), lupa, linterna, modo avión.
- Guardados con nombre, «Renombrar» y confirmaciones al volver al menú.
- **Bootcamp Genesis** (extra no canon) en español e inglés.
- «Conoce más»: tono, mirada psicológica, influencias.

## 31 de octubre — El giro hacia el RPG
- El nombre se corrige: **PROJECT GENESIS** (antes «PROYECT»), con logo nuevo.
- Primero un nivel de acción en el Bastión (Phaser, estilo Metroid). El mismo día se cambia a **pelea por turnos** (estilo EarthBound / Final Fantasy). El nivel de acción queda guardado, sin usar.
- **Decisión del autor:** `CREADORA_A`, `CREADORA_B` e `INFLUENCER_C` son personajes ficticios.
- Escena secreta del traje rojo de Rikka (solo con el juego al 100 %).

## 1 de noviembre — Nace el RPG de verdad
- El Bastión como RPG con los sprites del autor: Jair y Cami en el mismo turno, mochila, especiales con barra, la Sombra con su vórtice.
- **La pelea con Nikki en el bar** (nivel 20, «VS», pedirle perdón, remate, clon de sombra) desde la primera partida.
- El **probador de sprites** (`?sprites`), música de pelea, cámara lenta al perder.
- Escena secreta del traje rojo más picante sin mostrar más: vapor, toques en los emblemas, la imagen secreta.
- `docs/BIBLIA_RPG.md` con las reglas de todas las peleas. Boringplace (marketplace de Boringram).
- **Canon del autor:** el Rey Malvado es Promptmetheus; las bandas parodia.

## 2 de noviembre — Todo RPG (y el canon del Capítulo 4)
- Subida unificada: todo lo anterior en el commit «cap1» (el detalle quedó en la rama local de respaldo).
- **RPG:**
  - Beso confusión, el Cebo de Jair, estados (veneno, parálisis, confusión, protegido) que no se acumulan, usos de cada ataque.
  - Monedas, tipos de objeto, el equipo (cabeza, traje, pies, amuleto), la tienda de Boringplace (se abre al ganar el Bastión).
  - La ruta alternativa del **hangar** con el Capitán de la Federación (ráfagas y cañón).
  - La cuadrícula por fondo, la arena mezclada del probador, la galería de pixel art.
  - La **Mega Bola Tóxica** de Nikki y la traición en el bar. La pelea del bar es «vida real».
  - Pausa de verdad (cajas de JRPG), autoguardado antes de pelear, borrar todo en plena pelea con glitch.
  - Fallar y esquivar según nivel y estado; los especiales no se esquivan (hacen la mitad al que esquiva); hablar según el estado (confundido, envenenado).
  - Arreglos del clon: salía lejos y grande, perdía lo oscuro con veneno y no podía morir.
- **Arte:** piel de Rikka igualada en la novela, fondos escalados con Upscayl, censura de la imagen secreta.
- **Canon del autor:**
  - El cron job de Noodle; Cami (su pasado lo inventó la IA) y Rikka (`docs/CAMI.md`, `docs/RIKKA.md`).
  - Nikki y Cami se odian; la media amistad de Nikki y Rikka por The Blueberries.
  - **El final del Capítulo 3 y el borrador del Capítulo 4:**
    - Jair nunca entró al juego: viajó su conciencia.
    - El celular está ligado al mundo real.
    - Despierta y ve a Cami y Rikka en su cuarto.
    - La restauración pasa al Capítulo 4.
    - La convención con los otakus, Cami en Dulce Frío, el beso a propósito, Nikki y Rikka en el bar.
- **Filtro TV CRT** (Opciones, pedido del autor): la partida en un televisor de tubo gris de los 90, en 4:3, con líneas de barrido, desenfoque y el logo del modo TV (`public/marca/logo_tv.webp`, del autor). En el celular no hay televisor: 4:3 con dos barras a los costados con el logo. El menú no cambia.
- Títulos de los capítulos: «Una vida en bucle», «El viaje del héroe*» (al terminar, «antihéroe»); los del 3 al 7, en discusión. Se mantienen 7 capítulos.
- «Conoce más» en dos partes (el juego y el autor). El repositorio pasa a llamarse `project_genesis`.
- **Pendiente:** ver «Decisiones pendientes» en `docs/CRONOGRAMA.md`.

## 2 y 3 de noviembre (noche) — Capítulos 4 y 5, y el modo Retro CRT · cierre: 3 de noviembre, 1:25
- **Horas del 2 de noviembre (según los commits):** 11:27–18:21 y 20:01–1:26, unas 13 h 20 min (el tramo de 0:19 a 3:38 era la continuación de la noche del 1).
- **Canon del autor:**
  - La compañera de tesis es **Lady** (`lady.compila` de Boringram) y **Jordan** aparece en el Capítulo 4.
  - Se mantienen **7 capítulos**. El borrador se reparte: Capítulo 4 = escenas 1 a 9 (hasta «conseguí trabajo en el centro»); Capítulo 5 = desde Dulce Frío hasta el descubrimiento (falta el medio).
  - **Los títulos son chistes de programación.** «Una vida en bucle» (bucles) y «El viaje del héroe*» (el puntero de C, como Génesis++ y Génesis#); al terminar el Capítulo 2 pasa a «El viaje del antihéroe». Del 3 al 7, en discusión (propuestas de Claude: «return 0;», «Una caja de zapatos», «Sonríe… aunque ella te gane», «La muerte de Dios», «AnothergIrl» / «La jaula voluntaria»).
- **Modo de pantalla Retro CRT** (Opciones › Pantalla, pedido del autor):
  - Tarjetas con miniatura: Panorámico (16:9) o Retro CRT (la partida dentro de un televisor de tubo, en 4:3). El menú no cambia.
  - Casilla «Efecto de tubo» (marcada por defecto): sin ella, 4:3 nítido.
  - **Botones que funcionan:** POWER (apaga y prende como un tubo y silencia el juego), − VOL + (barras verdes, cambia el volumen de verdad), − CH + y TV/VIDEO (AUX es el juego; 5 canales sin señal con nieve y su ruido, sin la música). Entradas VIDEO y L-AUDIO-R con cables, PHONES, logo del autor.
  - **Fondo a elegir:** sin fondo, azul espacial, morado cósmico (el fondo del menú, oscuro y teñido, con logos blancos que suben despacio, sin glitch y con cometas tenues) o el cuarto de Jair (imagen del autor, oscurecida, con la lámpara y el cielo que respiran).
  - **Celular:** sin televisor; 4:3 con barras a los costados, el logo flotando con brillo metálico.
  - **El juego se escala a la pantalla del televisor** (nada con zoom). Prenderlo en plena pelea no la reinicia. En una pantalla 4:3 de verdad no hay televisor dentro del televisor.
- **Arreglos:**
  - El sonido de tecleo seguía con la pestaña en segundo plano: ahora el audio se pausa y el modo auto no avanza.
  - La caja de diálogo se apoya sobre la barra según su altura real (en pantallas angostas la barra la pisaba); las decisiones se centran encima.
  - VS: Nikki ya no cruza al lado de Jair (figuras centradas en su mitad, aparte del fondo en diagonal).
  - Volver al menú siempre con la transición a negro (también desde la pausa de una pelea).
- **Bar (fondo de la pelea):** las luces laten (focos, guirnalda, velas; morado en los reflectores) y el cielo de la ventana respira con estrellas.
- **Pendiente de esta sesión:**
  - El logo del modo TV imita el estilo de letra del logo de una consola real: rehacerlo con letras propias antes de publicar en serio (Claude ofreció el prompt).
  - Fondo del cuarto: el robot que parece Gundam y el control con forma de Super Nintendo, para retocar.
  - Idea sin aprobar: canales del televisor que en ciertos capítulos muestran algo (un comercial de Noodle, la Voz).
  - El plan de la Semana 1 del cronograma no empezó: esta sesión fue al modo Retro CRT.


## 3 de noviembre — Conoce más: Bad Bunny y Mac Miller

- **Hecho:** dos secciones nuevas en la parte del autor, después de «La influencia latinoamericana» (español e inglés):
  - **«Manejar de noche»:** Bad Bunny y la fantasía de manejar de noche por la ciudad; lista de nueve canciones (DÁKITI, YONAGUNI, DOS MIL 16, MOJABI GHOST, LO SIENTO BB:/, Después de la Playa, AMORFODA, NI BIEN NI MAL, un x100to) y, al cierre, la historia personal de «un x100to».
  - **«Un poco de Mac Miller»:** la influencia puntual de The Divine Feminine en las chicas, sus discos favoritos y lo que escuchaba a los 16; botones a los tres discos.
  - Sin enlaces directos inventados: esas canciones abren la búsqueda de Spotify. `Panels.tsx` tipa la canción con `spotify` y `nota` opcionales.
- **Pendiente:** si el autor quiere enlaces directos de Spotify para estas canciones, pasarlos.
- **Cambio del autor (misma sesión):** no quiso secciones aparte. Bad Bunny quedó al final de «La influencia latinoamericana» y Mac Miller al final de «Notas del autor», como bloques `anexos` (párrafos, canciones y cierre) que se muestran después del cierre de la sección. `Panels.tsx` los dibuja con el mismo componente (`BloqueConoce`).
- **Título del Capítulo 5 (decisión del autor):** pasa de «Conflicto de fusión» / «Merge Conflict» a **«Conflicto de dependencias» / «Dependency Hell»** («fusión» no se entendía en español). Actualizados el canon y el cronograma; los capítulos 3 a 7 todavía no tienen JSON, así que no hay más que cambiar.
