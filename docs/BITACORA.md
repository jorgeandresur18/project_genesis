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


## 3 de noviembre (tarde y noche) — Conoce más, títulos, peleas del Capítulo 2, Boringplace y PayFoe, galería y robustez

- **Hecho:** dos secciones nuevas en la parte del autor, después de «La influencia latinoamericana» (español e inglés):
  - **«Manejar de noche»:** Bad Bunny y la fantasía de manejar de noche por la ciudad; lista de nueve canciones (DÁKITI, YONAGUNI, DOS MIL 16, MOJABI GHOST, LO SIENTO BB:/, Después de la Playa, AMORFODA, NI BIEN NI MAL, un x100to) y, al cierre, la historia personal de «un x100to».
  - **«Un poco de Mac Miller»:** la influencia puntual de The Divine Feminine en las chicas, sus discos favoritos y lo que escuchaba a los 16; botones a los tres discos.
  - Sin enlaces directos inventados: esas canciones abren la búsqueda de Spotify. `Panels.tsx` tipa la canción con `spotify` y `nota` opcionales.
- **Pendiente:** si el autor quiere enlaces directos de Spotify para estas canciones, pasarlos.
- **Cambio del autor (misma sesión):** no quiso secciones aparte. Bad Bunny quedó al final de «La influencia latinoamericana» y Mac Miller al final de «Notas del autor», como bloques `anexos` (párrafos, canciones y cierre) que se muestran después del cierre de la sección. `Panels.tsx` los dibuja con el mismo componente (`BloqueConoce`).
- **Título del Capítulo 5 (decisión del autor):** pasa de «Conflicto de fusión» / «Merge Conflict» a **«Conflicto de dependencias» / «Dependency Hell»** («fusión» no se entendía en español). Actualizados el canon y el cronograma; los capítulos 3 a 7 todavía no tienen JSON, así que no hay más que cambiar.
- **Peleas del Capítulo 2 (plantillas):** el autor pidió dejar los lugares del RPG. Molino en dos peleas (los tres con Rikka y después Cami armored); las otras tres, vacías. Se engancharon `cap02_muralla` (en `cap02_143`), `cap02_campamento` (`cap02_183`), `cap02_molino` (`cap02_p2_071r07`) y `cap02_molino_armored` (`cap02_p2_082`); `cap02_molino_cassette` quedó creada sin enganchar. Perder repite la pelea. Tabla en `BIBLIA_RPG.md`, sección 12.
  - **Pendiente:** qué pasa en la muralla y en el campamento, qué es el cassette, los bad ends de cada pelea, el sprite de Cami armored.
- **Boringplace (pedido del autor):** sin la pestaña «Para ti». La «Tienda» es una grilla como un marketplace real (foto, precio afuera, nombre): primero los objetos de las peleas y después lo que vende la gente. Al entrar a un objeto: foto, precio, descripción, cuántos tienes y cuántos comprar (− / +, con el total). En el objeto abierto, solo el dibujo flota de arriba abajo con un leve giro en 3D; el cuadro de atrás queda quieto (corregido por el autor; se apaga con «reducir movimiento»). La mochila se sigue vendiendo en «Tus artículos».
- **Tokens y la tienda (pedido del autor):** la moneda del juego se llama **tokens** en toda la interfaz (Boringplace, peleas, Equipo, «Conoce más»; la variable sigue siendo `monedas`). En la tienda, primero el nombre y después el precio; el fondo de cada foto es un resplandor sutil, como el de Boringram, con el **color del tipo de objeto** (los colores de la sección 15 de la biblia del RPG; corregido por el autor: no el color del dibujo). Se sacaron de la tienda las publicaciones de relleno de la gente (siguen en `boringplace.json`, sin mostrarse); en «Tus artículos» siguen las de Jair.
- **PayFoe y el Torneo Genesis (diseño del autor):** dos billeteras (la de la partida y PayFoe, del jugador, con tope de 999.999); se transfiere de la partida a PayFoe, nunca al revés; la «versión sin censura» cuesta 1.000.000 y es solo un chiste. Torneo Genesis: se abre al terminar el Capítulo 1, simple/doble/triple, copas de dificultad creciente, premios a PayFoe, Nikki campeona con seis ataques (tres especiales). Diseño en `BIBLIA_RPG.md`, sección 17.
  - **Hecho (parte 1):** PayFoe (`src/engine/payfoe.ts`, en el estado global) y la tarjeta en Boringplace (se ve también desde el menú; dentro de una partida, «Transferir a PayFoe»). Contra la duplicación: `partida_id` (al empezar) y `tokens_ganados` (solo sube); PayFoe anota cuánto recibió de cada partida. Pruebas en `tests/payfoe.test.ts`.
  - **Ojo:** las partidas guardadas antes de este cambio no tienen `tokens_ganados`, así que no pueden transferir lo que ya tenían (sí lo que ganen de ahora en adelante).
  - **Pendiente:** el torneo, Nikki campeona, los desbloqueables a la venta y los datos `TODO(canon)` de la sección 17.
- **Boringplace (pedido del autor):** el nombre PayFoe va en blanco, con letra gruesa e inclinada al estilo de la marca que parodia (sin copiar su logo). Se sacó «Lo que publicaste» (las publicaciones de Jair): en «Tus artículos» queda solo la mochila para vender. Las publicaciones siguen en `boringplace.json`, sin mostrarse.
- **La billetera (pedido del autor):** la moneda del token (`public/objetos/token.webp`, del dibujo del autor; en `tools/objetos.py`) con un brillo sutil de moneda nueva que la cruza cada tanto. Va en los precios y en los saldos. La tarjeta de PayFoe es una fila compacta (moneda, nombre, saldo, «Billetera ›») que abre la pantalla de la billetera: saldo grande (de 999.999 posibles), la billetera de la partida con cuánto transferir (− / + / Todo), para qué sirve cada una y los últimos movimientos (se guardan 30).
- **Galería (pedido del autor):** los desbloqueables de Rikka se llaman **«Nalgada ancestral»** (`cg_rikka_nalgada`; en inglés «Ancestral Spank») y **«Exceso de confianza al vapor»** (`cg_rikka_secreto`; «Steamed Overconfidence»). Todos los desbloqueables especiales (imágenes y sprites secretos) tienen, además del borde magenta, un resplandor suave y fijo y, adentro, un reflejo metálico muy sutil que cruza la imagen despacio (corregido por el autor: no intermitente).
- **Galería, lugares (pedido del autor):** el hangar destruido sale en la dimensión espacial, después del hangar («Hangar destruido»: no hay fuego; texto: borrador de Claude). Se desbloquea al pasar por la pelea del hangar (camino alternativo). Ojo: ahora cuenta para el total de lugares, así que el 100 % pide tomar ese camino.
- **Regla de los desbloqueables (del autor):** en la galería, todo lo que la historia ya usa sale como casilla vacía hasta descubrirlo, en el orden en que aparece. Lugares se ordenan por la primera escena con ese fondo; Pixel art muestra solo los sprites de las peleas de la historia, por la primera pelea que los usa (la demo no cuenta). Anotado en `SPEC.md`.
- **Pixel art (pedido del autor):** en el visor, el botón «Especial» se llama como el especial de ese personaje en las peleas («Ráfaga de puños», «Lluvia de plasma», «Tajo de primavera», «Desgarro sombrío», «Embestida de acero», «Cañón de blaster», «Ráfaga de cachetadas infinitas»).
- **PayFoe (pedido del autor):** el tope nunca se muestra (se sacó «de 999.999 posibles» y el número del aviso de límite). «Para qué sirve» pasó a un botón «?» en la barra de la billetera, con chistes (`ayuda_payfoe` en `boringplace.json`; borrador de Claude).
- **Robustez (cronograma, Semana 1):**
  - **Guardado seguro** (`src/engine/guardado.ts`): leer o escribir nunca lanza un error (modo privado, sin espacio). Si lo guardado está corrupto, se aparta en `genesis-vn:corrupto` y se usa `genesis-vn:respaldo` (se toma al abrir el juego). `sanear` limpia lo cargado: lo que no tiene la forma esperada vuelve a su valor por defecto. Si el navegador no deja guardar, sale un aviso. Pruebas en `tests/guardado.test.ts`.
  - **Pantalla de error** (`src/components/Robustez.tsx`): si algo falla al dibujarse, en vez de la pantalla en blanco sale «GENESIS encontró un error» con «Volver al menú» y «Recargar» (las partidas, la galería y PayFoe no se tocan).
  - **ESLint** (`npm run lint`; `eslint.config.js`): reglas recomendadas de JS, TypeScript y hooks de React. Arreglados 2 errores; quedan 2 avisos de dependencias de efectos (`App.tsx:421`, `useSceneTransition.ts:95`) que no se tocaron porque cambiarlos puede alterar cuándo se disparan; hay que probarlo jugando.
  - **CI** (`.github/workflows/ci.yml`): tipos, ESLint, todas las pruebas y la compilación en cada push a `main`. Se activa al subir los commits a GitHub.
  - `npm install` de ESLint subió vitest y el plugin de React dentro de sus rangos; las 92 pruebas pasan.
- **Pendiente al cerrar la sesión:** subir los commits a GitHub (no se hizo push); las decisiones del Capítulo 2 (muralla, campamento, cassette, bad ends de las peleas, cuenta regresiva, qué espiaba en los arbustos, el plato de la resaca); el Torneo Genesis (copas, rivales, los tres especiales de Nikki); enlazar el Capítulo 2 al final del Capítulo 1.
- **Metodología y versiones (decisión del autor):** la demo publicada es la **1.0.0** (etiqueta `v1.0.0`, el commit `f637c72`). El trabajo pasa a la rama **`desarrollo`**, que se sube a GitHub pero Vercel no publica (`vercel.json`); `main` queda como la demo y solo cambia con orden del autor. La versión en curso es **1.1.0-dev**. Reglas en `docs/METODOLOGIA.md` (y en `CLAUDE.md`); registro en `docs/VERSIONES.md`. La CI revisa también `desarrollo`.
- **Revisión de coherencia del Capítulo 1 (lógica, no prosa):** rutas (sin escenas inalcanzables ni advertencias), variables, números del canon (edad de Jair, ocho años con Nikki, batería, horas, 847 años), nombres de quien habla, opciones y líneas repetidas, el orden de «Federación» (nadie lo dice antes de `cap01_g4_037`) y el final (termina al conocer a Rikka, con los tres). Todo cuadra. Se corrigieron dos contradicciones fuera de la historia: «Conoce más» decía que RikkaQuest eran «los más de ochocientos años que vive Rikka» (Rikka tiene más de 500; los 800 son del reino) y `FINALES.md` decía que la pelea con Nikki era de una escena secreta (desde el 2026-11-01 está desde la primera partida).
  - Variables escritas que todavía nadie lee: `confianza_rikka`, `romance_cami`, `romance_rikka` (para capítulos futuros). Declaradas sin uso: `descubrieron_el_edit`, `sashi_murio`, `sospecha_nikki` (reservadas).
- **PayFoe escondida:** como todavía no hay nada que comprar con PayFoe, se apagó con `payfoe_activo: false` (`juego.json`). Boringplace en el Capítulo 1 funciona solo con los tokens de la partida. Se prende cuando estén el torneo o los desbloqueables a la venta. Así la 1.1 se puede publicar sin una billetera a medias. (La demo 1.0 publicada no tiene nada de esto.)
- **Capítulo 1, lógica cerrada:** guiones resincronizados con el juego (`docs/guion/cap01.md` y `cap02.md`; el `.md` no tenía ediciones a mano: el último commit era la exportación unificada del 2 de noviembre). Regla en `CLAUDE.md` y etiqueta `cap01-logica-cerrada`. El capítulo sigue como `borrador` hasta la pasada de diálogos del final.
- **RPG: una sola ficha por personaje.** Los 3 héroes, los 4 enemigos, los objetos y los retratos están una vez en `src/data/rpg/personajes.json`; cada pelea guarda solo quién pelea, el nivel y lo que cambia (la Cami del tobillo, las frases de Jair con Nikki). `src/engine/batallas.ts` las junta y todo el código y las pruebas leen de ahí. Se comprobó que las 9 peleas armadas son iguales a las de antes (las únicas diferencias: algunas peleas heredan las frases de «confundido» de Jair y Cami, que ahí no se usan, y todos los retratos). Los datos bajaron de 110 KB a 48 KB. Guía nueva en `BIBLIA_RPG.md`, sección 13.
- **Balance: la simulación ahora modela las ráfagas** del Capitán (3 a 5 balas, cada una puede fallar) y las medias lunas de la sombra (una a cada héroe y las que sobran al azar); antes contaba cada una como un solo golpe. El Bastión sigue dentro de su meta (descuidado ~28 %, atento ~99 %).
  - **Hallazgo, para decidir:** con eso, el **hangar** sale muy difícil en la simulación (atento ~34 %, descuidado ~5 %). Ojo: simula a Jair y Cami en sus niveles base (5 y 15); en el juego llegan con la experiencia del Bastión, así que debe ser algo menos. Las plantillas del Capítulo 2 no están balanceadas (la muralla casi imposible, el campamento y el molino regalados): se balancean cuando tengan su historia.
- **Ataques intercambiables (diseño del autor):** 3 ataques y 2 especiales equipados (el caramelo premium sube a 3 especiales; es el premio por ganarle a Nikki en la dificultad más alta del torneo); se desequipan y van a la mochila si no hay espacio; solo fuera de las peleas; los originales de cada personaje están vinculados y no se venden; algunos ataques son sueltos, se compran, se venden (y se recompran) y se ganan en el torneo; se aprenden al subir de nivel. Detalle en `BIBLIA_RPG.md`, sección 18.
- **Hangar rebalanceado (el autor dejó la decisión a Claude):** medido con los niveles reales con que se llega (Jair sale del Bastión en 5,7 en promedio; Cami sigue en 15), el atento ganaba ~34 %. Se bajó el Capitán de nivel 14 a 12 (las ráfagas de 3 a 5 balas y el cañón, que son canon, no se tocaron): descuidado ~25 %, atento ~71 %. Queda más difícil que el Bastión (camino alternativo) pero ganable. Prueba nueva en `tests/balance.test.ts`.
- **Torneo (decisión del autor):** en cada dificultad todos pelean al mismo nivel, como en el competitivo de Pokémon (`BIBLIA_RPG.md`, sección 17).
- **Partir `Batalla.tsx` (etapa 1):** las piezas de dibujo salieron a `src/components/batalla/`: `sprites.tsx` (las hojas, su caché y `SpriteHoja`), `escena.tsx` (cada luchador en escena, su tarjeta, sus estados, el aviso del especial y la cuadrícula) y `presentacion.tsx` (el pixelado y el «VS»). Se comprobó línea por línea que es el mismo código (solo se agregaron imports). `Batalla.tsx` bajó de 2.895 a ~2.360 líneas. Hay que probarlo jugando (el Bastión, el bar y el hangar) para confirmar que se ve igual.
- **Varios especiales (etapa 2 de ordenar el RPG):** los especiales comparten una sola barra y se elige cuál usar; todo ataque tiene usos limitados, menos los especiales (decisiones del autor). En el motor: `especiales` en la ficha del héroe y `especialesDe` (hasta 2); el menú los muestra todos y el comando dice cuál. Prueba: `?batalla=demo` (Jair con un segundo especial de relleno). Pruebas en `tests/ataques.test.ts`. Falta el equipamiento desde el panel de Equipo.
- **Cassettes (decisión del autor):** los ataques de la mochila son cassettes; solo los de los protagonistas tienen color (Jair ámbar, Cami azul, Rikka rojo y Nikki rosa: los de su caja de diálogo), los genéricos van en gris `#c9ced6`. El autor está haciendo los sprites.
- **Equipamiento de ataques (con los cassettes del autor):** en el panel de Equipo, los cassettes equipados (3 ataques y 2 especiales) y los de la mochila; tocar uno lo equipa o lo guarda (fuera de las peleas; siempre queda un ataque). Se guarda en la partida (`ataques_<héroe>`, `especiales_<héroe>`) y la pelea usa lo equipado. Aura de su color en cada cassette; los especiales brillan más con un reflejo de lujo (pedido del autor). Hoy nadie tiene más de 3 ataques, así que las peleas de la historia no cambian. Falta probarlo en el navegador.
- **Ataques nuevos (placeholder, sin sprites):** Jair (Ctrl+Z, Reunión que pudo ser un correo, Excusa elaborada, Commit a medianoche), Cami (Tiro certero, Barrido de cobertura) y Rikka (Pétalos al viento, Postura de la guardiana), aprendidos en niveles que el Capítulo 1 no alcanza. El motor de los héroes suma: atacar a todos, efectos de objeto en un ataque (veneno; protegerse o potenciarse con `alMismo`) y sus descripciones en el menú. La descripción de la curación pasó a neutra («Recupera el N % de su vida»), porque ahora también la tiene Jair.
- **Cassettes sueltos (placeholder):** Piedra, Grito de guerra y Botella rota, con precio, en la tienda de Boringplace (grises); se venden a la mitad en «Tus artículos» y se recompran. Los puede equipar cualquiera desde Equipo, tantos a la vez como copias haya. Pruebas en `tests/equipo.test.ts`. Con esto quedan hechos los ataques intercambiables (falta probarlos en el navegador y los ataques del torneo).
- **Arreglo (visto por el autor en `?batalla=demo`): la «bola de luz» al pegarle a la sombra.** Dos causas: la luz de los golpes se llamaba `.batalla-luz`, igual que las luces del bar, que la pisaban (quedaba una bola quieta en vez del destello que crece y se apaga); y se dibujaba en el centro del cuadro, no del cuerpo (el cuadro de la sombra tiene mucho aire arriba). Ahora es `.batalla-golpe-luz` y se centra en el cuerpo de cada sprite (`cuerpo` de su hoja; espejado en los héroes).
- **Por qué Jair y Rikka saltan al ganar y Cami no:** nadie tiene animación de victoria; la de victoria usa «sonrojada» si la hoja la tiene (solo Cami) y si no, el salto en bucle. No es un error: al autor le pareció gracioso y va con la personalidad de Cami.
- **Torneo Genesis (de relleno):** Extras › Torneo Genesis: cuatro copas (Bronce se abre al terminar el Capítulo 1; cada una al ganar la anterior), simple/doble/triple con los peleadores que la historia desbloqueó, cuatro rondas hasta Nikki campeona, premios a PayFoe (que se prendió). Balance medido y con su prueba (`tests/torneo.test.ts`). Pendiente: la vida entre rondas (hoy se recupera entera), los seis ataques de Nikki, las copas y rivales de verdad.
- **Victorias (diseño del autor):** Jair y Rikka saltan; Cami se sonroja (como fastidio); Nikki hace el beso más corto y suelta un corazoncito rojo con brillos que se disuelve unos pasos más allá; los demás, pendientes. Van también en el probador de sprites. Rikka todavía no tiene «derrotado» (lo pasa el autor).
- **Nikki, la cachetada (pedido del autor, para probar):** la onda pasó de azul a una ráfaga blanca con bordes celestes, rellena en los cuadros del golpe; el último se deshace en chispas. En un commit aparte, para deshacerlo con `git revert` si no convence.
- **Victorias:** la de Cami se llama «victoria» (antes «sonrojada», pedido del autor); Nikki tiene su «victoria» (un tramo corto del beso, en bucle, con un corazoncito rojo con brillos que avanza unos pasos y se disuelve). Se ven en el probador de sprites (`?sprites`) y en la galería. En el torneo, si gana la campeona, festeja; en el bar sigue llorando (historia).
- **Nikki, la cachetada:** después de varias pruebas (recolor a blanco, rellenos), el autor pidió volver al sprite original: la onda azul de siempre. Lección: la tarea era solo pintar el medio de la onda; Claude la complicó rehaciéndola. Para un pedido así, cambiar lo mínimo y mostrar antes de aplicar.
- **Revisión de coherencia del Capítulo 2 (lógica):** 1.183 escenas, todas alcanzables; los 10 bad ends del canon; el Rey habla como «???» y sin sprite; no se dice «nexus»; el plato de la resaca no se nombra; Kira y Zaki, Tzai, el Gran Ingeniero, la puerta que no abre con tres sacerdotisas, Cami memorizando la clave (sin decirla), Rikka vendiendo el traje y la guardia que se los lleva al final: todo como en el canon. **Corregido:** la batería subía sola (4 % después del Otoño y 5 % en la taberna): `cap02_p2_054` pasa a «Cinco por ciento» (lo que marca el celular desde las termas, como dice el canon) y el celular marca 9 % desde `cap02_p2_005` (lo que dice el texto en el camino).
  - **Para enlazar el Capítulo 2 al final del Capítulo 1** hay que tocar la escena final del Capítulo 1 (`cap01_g8_072`, lógica cerrada): espera la orden del autor.
- **El cassette del molino (decisión del autor):** es el especial **Armored** de Cami, un especial normal (no «especial+»). Se gana al ganar la pelea de Cami armored (`premio` con `especial_cami_armored`) y queda como su segundo especial; la Voz lo avisa al salir del molino (`cap02_p2_084v`, de relleno). Se borró la pelea de relleno «El molino (cassette)». Motor: `especiales_extra` en la ficha del héroe. Falta el arte de Cami armored y el berserk.
- **Capítulo 2 enlazado (orden del autor):** sin tocar la escena cerrada del Capítulo 1: en la pantalla de «Fin del Capítulo 1», «Continuar» sigue al Capítulo 2 (antes solo en el modo `/all`) si `capitulo_maximo` de `juego.json` lo permite (hoy, 2). Pasan las variables (niveles, mochila, tokens). Para no publicarlo todavía en una versión, poner `capitulo_maximo: 1`. Prueba en `tests/capitulos.test.ts`.
- **Cierre de la noche del 3 de noviembre:**
  - **Hoja de ruta publicada** (página privada para el autor: https://claude.ai/artifact/PnEcugso2MmyF2gph5yFL6): lo real (10 días, 344 commits, ~2.580 escenas, demo 1.0) y la proyección hasta el 100 %. Escenario realista: lógica del juego base cerrada a fines de marzo de 2027, el 2.0 (con arte, diálogos e inglés) a fines de julio de 2027 y las tres expansiones hasta fines de enero de 2028; con atrasos, diciembre de 2027 y mediados de 2028. Cronograma al día con lo hecho hoy.
  - **Lo hecho en la sesión, en resumen:** Conoce más (Bad Bunny, Mac Miller), el título del Capítulo 5, robustez (guardado seguro, pantalla de error, ESLint, CI), metodología (rama `desarrollo`, versión 1.1.0-dev, Vercel solo publica `main`), Capítulo 1 con la lógica cerrada, Boringplace como marketplace con tokens, PayFoe, el RPG ordenado (ficha única, `Batalla.tsx` partido, varios especiales), ataques intercambiables con cassettes, ataques nuevos y sueltos, el Torneo Genesis, las victorias de Cami y Nikki, el especial Armored de Cami (el cassette del molino) y el Capítulo 2 revisado y enlazado al 1.
  - **Lo que decidió el autor:** el arte y los diálogos van al final; los cassettes de color solo para los protagonistas (Jair, Cami, Rikka y Nikki); el armored es un especial normal; el tope de PayFoe nunca se muestra; el torneo pelea con niveles alineados; la cachetada de Nikki vuelve a su sprite original.
  - **Del autor, para más adelante (fase de arte):** ya tiene el sprite de novela de **la sacerdotisa del Verano**. Lo va a usar en la imagen de recuerdo de Rikka en la playa (`cg_recuerdo_verano`, Capítulo 2; hoy placeholder), muy sutil. No se integra hasta la fase de arte. Pendiente también: el «derrotado» de Rikka, Cami armored y el berserk.
  - **Pendiente:** la historia de las peleas de la muralla y el campamento (y sus bad ends); las decisiones del Capítulo 3 antes de escribir su guion; los seis ataques de Nikki y las copas de verdad del torneo; los desbloqueables a la venta en PayFoe.

## 4 de noviembre (mediodía) — Segunda computadora: clon, orden de los documentos y lógica de turnos fuera de `Batalla.tsx`

**Computadora: segunda** (`MARKETING1ICSH`, clon en `C:\Users\Diseño\Documents\jorge\PROJECT_GENESIS`). Primera sesión
fuera de la computadora principal. **Al volver a la principal: `git checkout desarrollo` y `git pull`** (ver
`docs/METODOLOGIA.md`, «Trabajar desde varias computadoras»).

- **Clon y comprobación:** se clonó el repositorio en la rama `desarrollo` (último commit: el cierre del 3 de noviembre,
  22:44). Se buscaron cambios de cerca de las 23:00 del 3 de noviembre: **en GitHub no hay ninguno**; si existieron,
  quedaron sin subir en la computadora principal (revisar allá con `git status` y `git log --branches --not --remotes`).
  `npm ci`, las 111 pruebas, las rutas y ESLint pasaron igual que en la principal.
- **Identidad de git:** esta computadora tiene otra cuenta («Clinica Ser Humano»); para este repositorio se configuró
  `jorgeandresur18 <jorgeurgiles18@gmail.com>` (`git config` local, decisión del autor).
- **Documentos al día:** en el cronograma, los títulos de los capítulos 3 a 7 figuran como resueltos (quedaba una línea
  vieja de propuestas) y los ataques intercambiables ya no dicen que esperan partir `Batalla.tsx`. El nombre del plato de
  la resaca **sigue pendiente** (el canon lo marca `TODO(canon)`). Metodología nueva: cómo trabajar desde varias
  computadoras.
- **Partir `Batalla.tsx` (etapa 2):** la lógica de turnos que no espera animaciones pasó a `src/engine/turnos.ts`:
  `estadoInicial` (con qué empieza la pelea), `decidirEnemigo` (qué hace cada enemigo: paralizado, confundido,
  distraído, el remate y la Mega Bola de Nikki, el clon, su especial o un ataque), `desviarACebo` y `finDeTurno` (bajan
  la parálisis y la confusión). Mismas comprobaciones en el mismo orden; `Batalla.tsx` solo muestra lo que se decidió y
  bajó a ~2.340 líneas. 12 pruebas nuevas en `tests/turnos.test.ts` (123 en total). **Hay que probarlo jugando** (el
  Bastión, el bar con Nikki —la traición y el remate— y el hangar) para confirmar que se juega igual.
  - Queda para otra etapa: los turnos de los héroes (`actuarHeroe`) y el bucle de la pelea están muy unidos a las
    animaciones; sacarlos pide otra forma de armar la pelea (que el motor diga qué pasó y la pantalla lo muestre).
  - Hallazgo: la simulación del balance (`tests/balance.test.ts`) tiene su propia copia de la lógica de turnos y no
    cuenta el turno de respiro después de la parálisis. Ahora podría usar `finDeTurno` y `decidirEnemigo`, pero eso
    cambia un poco los números del balance: queda para decidir.
- **Esta computadora no tiene Python:** `npm run sprites` y las herramientas de `tools/*.py` solo andan en la principal.
- **Subir desde esta computadora:** el primer push fue rechazado (403) porque estaba guardada la cuenta de GitHub
  `clinicaserhumano`, sin permiso en el repositorio. Se resolvió sin darle acceso: la dirección del repositorio lleva el
  usuario (`https://jorgeandresur18@github.com/...`) y el autor inició sesión como `jorgeandresur18` con el código del
  dispositivo y GitHub Mobile. Desde ahí sube sin pedir nada.
- **Pendiente:** probar jugando la etapa 2 de `Batalla.tsx`. Lo demás, igual que el 3 de noviembre.
- **Canon nuevo del autor (Capítulo 6 y Promptmetheus):**
  - **THE GREAT MERGE:** así se llama lo que Promptmetheus quiere hacer, consumirlo todo para que todo forme parte de
    él. Anotado en `CANON.md` («El Rey Malvado es Promptmetheus») y `BATALLA_FINAL.md`. Pendiente: si en español se
    deja igual o se traduce.
  - **El conflicto de fusión (rama que lleva al 7B):** Rikka y Cami no logran fusionarse en AnothergIrl por un
    conflicto de fusión entre las dos. Cambia lo que decía el canon («en esta rama no hay fusión»): ahora la fusión
    **falla**. Actualizados `CANON.md`, `BATALLA_FINAL.md`, `FINALES.md` y `BIBLIA_RPG.md`. Pendiente: cuándo lo
    intentan, qué choca entre ellas y si Jair ejecuta el comando (Claude sugirió la respuesta de git «CONFLICT…
    Automatic merge failed»). Así el MERGE queda en las dos ramas: en el 7A sale, en el 7B choca, y THE GREAT MERGE es
    el de Promptmetheus.
  - **Respuestas del autor:** en español se dice **LA GRAN FUSIÓN** (en inglés, THE GREAT MERGE). La fusión pasa **en el
    Capítulo 6**, dentro del capítulo: en la rama que lleva al 7A se logra (AnothergIrl) y en la que lleva al 7B no
    (el conflicto de fusión). Sigue pendiente qué choca entre ellas y si Jair ejecuta el comando.
  - **Confirmado por el autor:** la fusión de Cami y Rikka ocurre en la rama del Capítulo 6 que lleva al 7A; en la otra
    rama no ocurre porque hay un conflicto de fusión, y eso desemboca en el 7B. Pendiente: en qué punto de la rama lo
    intentan (antes o después de que Rikka rompa la computadora).
  - **Cuándo se fusionan (decisión del autor):** en la pelea final contra el Rey Malvado del Capítulo 6. En la rama del
    7B, eso queda después de que Rikka rompe la computadora. Sigue pendiente en qué fase de las cinco entra AnothergIrl
    en la rama del 7A, qué choca entre ellas en la del 7B y si Jair ejecuta el comando.
  - **Aclaración del autor sobre los epílogos:** el 7A y el 7B pasan después de la batalla, no dentro del Capítulo 6. En
    `CANON.md` y `FINALES.md` quedó marcado qué parte es el epílogo: en el 7B, Cami se queda con Jair y pregunta si es su
    mayor creación; en el 7A, Jair consigue un trabajo mejor y arregla las cosas con Nikki. Confirmado después: primero
    amigos y luego el inicio de una relación. «Solo amigos» es verdad en el 7A y autoengaño en el 7B (Nikki embarazada).
- **El balance mide el juego real (decisión del autor: opción A):** más reglas pasaron a `engine/turnos.ts` (el golpe, entrar a la pelea, parálisis, confusión, clon, veneno de la bola y golpes del cañón; `Batalla.tsx` las muestra) y el simulador nuevo, `tests/simulador.ts`, juega con esas mismas funciones. Antes tenía su copia propia de las reglas. También dejó de correrse el balance dos veces (el torneo lo importaba desde `balance.test.ts`). 132 pruebas.
  - **Hallazgo, para decidir: el hangar es mucho más difícil de lo que se creía.** El cañón del Capitán da 9 golpes en el juego (el fuerte, de poder 24, y 8 barridos de poder 4) y la simulación vieja contaba uno. Atento: de ~70 % a **~32 %**; descuidado: de ~26 % a **~5 %**. Comprobado: con un solo golpe vuelve a dar ~72 %. Con Jair en nivel 6 (llega del Bastión con 5,7 en promedio), atento ~51 %. La meta (atento entre 55 % y 90 %) no se cumple; la prueba quedó con `it.fails`, a la vista. **No se tocaron los datos.** Opciones medidas (atento · descuidado): Capitán en nivel 11, 55 % · 15 %; en nivel 10, 73 % · 32 %; cañón de poder 20, 55 % · 11 %; de poder 16, 81 % · 16 %.
  - **La final del torneo en triple sale regalada (~99 %):** la simulación vieja no contaba la mochila fija (2 aguas y un Elixit). Las finales ahora: simple ~32 %, doble ~93 %, triple ~99 %. Es de relleno; también con `it.fails`.
  - El Bastión y el bar siguen dentro de sus metas (Bastión: descuidado ~26 %, atento ~98 %; bar: ~5 %).
  - **Falta probar jugando** las dos tandas de cambios en `Batalla.tsx`: nadie los vio en pantalla.
  - **Hangar, decisión del autor (2026-11-04):** se aplicó lo que propuso Claude: el Capitán baja de nivel 12 a **10** (atento ~73 %, descuidado ~32 %); el cañón no se tocó. La prueba del hangar vuelve a ser normal. El autor no puede probarlo en esta sesión: **queda para jugarlo en la computadora principal** (`?batalla=hangar`, y también `?batalla=bastion` y `?batalla=nikki`). La demo publicada (`main`) sigue con el Capitán en nivel 12 hasta la próxima versión.
