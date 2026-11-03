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
