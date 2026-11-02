# Bootcamp Genesis (extra, no canon)

> Antes se llamaba «Academia Genesis». Documento del autor: [BOOTCAMP_ESPECIFICACION.md](BOOTCAMP_ESPECIFICACION.md). Aquí está cómo quedó implementado.
>
> **Estado:** solo local (usa el IDE del Capítulo 2). Lo que no cuenta para la historia: todo esto es un extra.

## Qué es

Una parodia de los bootcamps de programación. El jugador entra sin saber nada y sale como **«desarrollador explotado, con sobrepeso y propenso a diabetes tipo 2»**. Jair es el instructor y enseña **Coffee**, el lenguaje ficticio basado en JavaScript, el mismo del minijuego de la espada DELETE. Los ejercicios son reales: cada uno enseña algo verdadero de programación, aunque esté envuelto en sátira.

## Cómo se ve

- **Dónde se entra:** desde su botón en el menú principal, al lado de Boringram. Antes de terminar el Capítulo 1, el botón sale con candado y la pantalla dice «Bootcamp cerrado».
- **El monitor:**
  - ocupa toda la pantalla, pero se ven sus bordes;
  - abajo, el logo del monitor (`public/marca/logo_monitor.webp`, sacado de `docs/logo_monitor.png`), la luz de encendido y el botón de apagar;
  - se prende como uno viejo (una línea blanca que se abre) y se apaga igual, con el botón o con Escape.
- **Arranque:** al entrar aparece el emblema `</>` girando, el logo metálico del Bootcamp y una barra que «instala» cosas, con chistes de carga («Instalando 1.847 dependencias para imprimir hola mundo…»). Se salta con un clic.
- **Apagado:** al salir, «Cerrando sesión… tu progreso se guardó. Tus horas extra, no.», con el emblema; después la pantalla se cierra.
- **Inscripción:** la primera vez se pide el nombre del alumno (mínimo 2 letras, máximo 32), con una vista previa manuscrita. Se cambia desde el inicio con «Alumno: … ✎».
- **El botón del menú:** lleva el emblema `</>` del Bootcamp.
- **El inicio:**
  - cabecera con el lema, las clases hechas, las estrellas y el porcentaje;
  - los cinco niveles en tarjetas, con su estado y su barra de progreso;
  - las clases del nivel elegido, en tarjetas con sus estrellas.
- **Cada clase:**
  1. La **charla**, en el aula: quien habla, su caja de texto y los puntos de avance.
  2. El **ejercicio** en el IDE del minijuego, con huecos, paleta de palabras, archivos de notas y terminal. Los comentarios de los personajes salen con su sprite y su globo, y a veces otro personaje responde.
  3. El **cierre**, con las estrellas ganadas.
- **Al terminar un nivel, el diploma:**
  - el nombre del alumno, manuscrito (fuente Great Vibes, licencia OFL, en `public/fonts/`);
  - un **código de verificación al azar** con cara de oficial (`BG-TRA-2026-XXXX-XXXX`), que se emite una vez y no cambia;
  - la fecha, las firmas («Jair · instructor (sueldo pendiente)», «GENESIS · IA (no disponible)») y un sello «NO VÁLIDO, PERO BONITO»;
  - la letra chica: no tiene validez académica, legal ni emocional, y nadie sabe si el bootcamp es legal;
  - los enlaces del juego: el repositorio de GitHub y la página del autor. Salen de `src/data/conoce_mas.json` (marcados con `en_diploma`), el único lugar con datos del autor.
- **Qué se hace con el diploma:**
  - **Descargar:** una imagen PNG de 1600 × 1130;
  - **Compartir:** LinkedIn, Facebook, Instagram (con el menú del celular si se puede; si no, se descarga y avisa), WhatsApp, X o copiar el enlace;
  - **Publicar en LinkedFired:** la publicación, las vistas y los comentarios de los cuatro.
- **Música:** tiene su propio tema (`musica_bootcamp` en `src/data/juego.json`). Falta el archivo; mientras tanto suena el del título.

## Niveles y desbloqueo

El **nivel N se abre al terminar el Capítulo N**. El motor busca la escena con `fin_capitulo` de ese capítulo, así que no hay que tocar nada cuando se escriban los capítulos que faltan. Cada nivel tiene un **color de dificultad**, del verde al rojo:

| Nivel | Se abre al terminar | Color | Clases |
|---|---|---|---|
| 1 · Trainee | Capítulo 1 | verde `#3ddc84` | 9: variables, funciones, condicionales, bucles, tipos y operadores, brew y let, listas, objetos y el examen de depuración |
| 2 · Junior | Capítulo 2 | verde lima `#b6e34a` | 3: clases (`blend`, `cup`, `refill`), herencia (`extra`, `super`) y el examen de `espresso`/`await` |
| 3 · Semi-senior | Capítulo 3 | amarillo `#ffd23f` | por escribir: estructuras de datos y algoritmos |
| 4 · Senior | Capítulo 4 | naranja `#ff9a3c` | por escribir: Reckt y arquitectura |
| 5 · Desarrollador explotado | Capítulo 5 | rojo `#ff4d5e` | la graduación final, con el remate de la foto |

- Dentro de un nivel, cada clase se abre al terminar la anterior.
- **Antes de terminar el Capítulo 1:** el botón del menú tiene candado, y al entrar dice «Todavía no completas el Capítulo 1».
- **Aviso en el menú:** la primera vez que se termina un capítulo, al volver al menú aparece el aviso «¡Nivel N desbloqueado: …!», con el emblema y el color de su dificultad. Tocarlo abre el Bootcamp.
- **Modo de prueba:** con `?bootcamp=todo` en la dirección (por ejemplo `https://project-genesis-yeah.vercel.app/?bootcamp=todo` o `http://localhost:5173/?bootcamp=todo`) se abren todos los niveles con clases y todas sus clases. En ese modo no se guarda el progreso (ni estrellas ni diplomas), así que no cuenta para el 100 %. Arriba sale el chip «Modo prueba: todo desbloqueado (no se guarda el progreso)».

## Reseñas del curso

Al final del inicio, las reseñas de alumnos genéricos, sobre el curso y no sobre los personajes (`resenas` en `curso.json`):
- algunas agradecen;
- otras son graciosas, rancias o molestas («Mi hijo hizo el bootcamp y ahora trabaja 14 horas al día. Estamos muy orgullosos. Lo vemos en Navidad.»).

El jugador puede poner su propia calificación (`bootcampCalificacion`), que entra en el promedio.

## Puntaje y progreso

- **Estrellas por clase**, según las compilaciones fallidas: ninguna da ★★★, una o dos dan ★★, más dan ★. Se guarda la mejor.
- **Lo que se guarda** (`bootcampHechas` en la tienda): las clases con sus estrellas, la introducción vista y los diplomas (1 = visto, 2 = publicado en LinkedFired).
- **Cuenta para el 100 %:** «Clases del Bootcamp» en Extras.

## Personajes (del documento del autor)

| Personaje | Papel | Ejemplos ya escritos |
|---|---|---|
| **Jair** | Lo técnico, y la realidad laboral del programador | «TypeError: Assignment to constant variable. El error más honesto de la industria.» |
| **Rikka** | Ayuda a enseñar: explica con metáforas de su reino. Es el contraste, y no es solo objeto de bromas | «Como una formación de soldados: el primero de la fila es el soldado cero.» |
| **Cami** | Provocadora y bisexual (lo suyo, **no** de Rikka); el gag del trasero de Rikka, con progresión a lo largo del nivel | «Yo soy como el +: con chicos sumo, con chicas junto.» |
| **Nikki** | Humor negro y crítica social con segunda lectura. Con Jair, ambigua como su relación: a veces tierna, triste o distante. Con Rikka y Cami, normal o cínica | «las listas empiezan en cero. como los derechos laborales de un practicante» / «a mí sí me esperarías, ¿no? con await y todo… olvídalo. no respondas» |

- **Respuestas de Rikka:** cuando Cami habla de su cuerpo, Rikka contesta enojada, celosa o sonrojada, siempre con carácter propio («Mi escritorio lo ocupo yo, entera, con mis apuntes.»).
- **El chiste de la ocupación de espacios:** está en la clase 6 (`brew` y `let`). Nikki dice la regla («no ocupes un espacio que ya está ocupado. no importa si lo reclama un gobierno, un ejército o el gran ingeniero en persona con su libro sagrado…») justo cuando el ejercicio enseña que `brew` no se reasigna a la fuerza. No nombra países ni conflictos. Jair: «No sé si estamos hablando de Coffee». Nikki: «claro que estamos hablando de coffee, jair».
- **La IA que nunca está: GENESIS.** Un botón del IDE con su ícono (la «G» sin letras, en blanco) abre su ventana de chat. Le preguntas y siempre contesta que se quedó **sin tokens**: se los gastó todos **haciendo este bootcamp sin validación académica**. Dice la cifra entera (10.000.000…, un 1 con cien ceros), sin la palabra «googol». Sus tokens se restauran en **8.112 años**, lo mismo que tarda la restauración completa del canon. A veces alguien lo comenta. No promete nada.
- **El gag de Rikka:**
  - progresión en el nivel Trainee: tapa la pizarra → la función del tamaño → la nalgada → «Infinity» → la grúa → el scroll → las tres veces que se agachó → el lugar detrás de ella en el examen;
  - remate: la foto en la graduación final (`PLACEHOLDER:foto_rikka_graduacion`).

## Límites

- Hay palabras directas de vez en cuando (culo, senos, pene…), pero ninguna descripción de actos sexuales.
- **La foto de la graduación:** el chiste es el encuadre de Cami, con Rikka vestida (por ejemplo, con la toga, de espaldas). Nada de desnudos: Cami y Rikka son copias de mujeres reales (CANON §4).
- Ningún chiste sexual va junto a una edad de menor.

## Cómo está armado

| Qué | Dónde |
|---|---|
| Lógica: niveles, desbloqueo por historia, estrellas y progreso | `src/engine/bootcamp.ts` |
| Pantalla: monitor, arranque, inscripción, inicio, charla, IDE y LinkedFired | `src/components/Bootcamp.tsx` |
| El diploma: en pantalla, como imagen y para compartir | `src/components/BootcampDiploma.tsx` |
| Logos | `public/marca/bootcamp_logo.webp` y `bootcamp_emblema.webp` (de `docs/`), `genesis_icono_blanco.webp` y `genesis_icono_negro.webp` |
| Curso: niveles, diplomas, textos, IDE común, asistente e introducción | `src/data/bootcamp/curso.json` |
| Clases | `src/data/bootcamp/lecciones/NN_<id>.json` |
| IDE compartido con el minijuego (intentos fallidos, asistente, retratos y respuestas) | `src/components/CoffeeIDE.tsx` |
| Las clases y su inglés (van con la pantalla) | `src/components/bootcampDatos.ts` |
| Inglés | `src/data/en/bootcamp/` (`curso.json` y `lecciones/`) |
| Pruebas | `tests/bootcamp.test.ts` |

`tests/bootcamp.test.ts` comprueba que:
- cada clase existe y tiene solución;
- la paleta tiene distractores y no repite palabras;
- los sprites existen;
- los niveles se abren con escenas reales;
- las estrellas se guardan bien.

**Para agregar una clase:** crear su JSON en `lecciones/` y poner su `id` en el nivel que corresponde de `curso.json`.

## Inglés

Todo el Bootcamp está en inglés si el juego está en inglés: los textos, la introducción, las clases, los comentarios, GENESIS, el diploma, LinkedFired y las reseñas.
- **Cómo se traduce:** como en Boringram. En `src/data/en/bootcamp/` están solo los textos, y se mezclan por posición sobre el español.
- **El código de los ejercicios:** conserva los nombres en español (`alumna`, `sueldo`, `trabajar`), porque Coffee es así. Se traducen los comentarios, los textos entre comillas y las notas; en las notas se aclara qué significa cada nombre.
- **La prueba:** comprueba que cada clase tenga su traducción con los mismos huecos, las mismas respuestas y la misma paleta.

## Carga

La pantalla del Bootcamp (con sus clases) y la de Boringram se descargan recién al abrirlas. El código del juego también va separado de la historia (`historia`) y de las librerías (`librerias`), así que si solo cambia el código, el navegador no vuelve a bajar los capítulos (ver `vite.config.ts`).

## Sprites recomendados (a futuro)

No usar uniformes escolares: son adultas y el humor es picante.

- **Jair instructor:** camisa con la corbata floja, marcador, frente a la pizarra; facepalm; orgulloso con café; derrotado sobre el escritorio.
- **Cami:** con laptop y lentes, mordiendo el lápiz; mano levantada; guiñando un ojo; con el celular listo para «la foto».
- **Rikka:** tomando apuntes; explicando en la pizarra (es la ayudante); tapándose la cara; con la toga de la graduación.
- **Nikki:** con café y celular, de lado sin mirar la pizarra; ojos en blanco; tierna, para los cierres.
- **Fondos:** `aula_bootcamp` (salón con pizarra llena de Coffee); el aula de noche; el escenario de la graduación.
- **Imágenes:** la foto de la graduación (ver Límites).

## Propuestas (para que las revises)

1. **Ejercicios de «encuentra el bug» con tiempo**, solo en los exámenes y opcionales: un reloj que da una estrella extra si terminas antes. Sin castigo si se acaba.
2. **LinkedFired en Boringram:** al publicar el diploma, que llegue una notificación de LinkedFired al celular de Jair, que también cuente para el 100 %.
3. **Semi-senior:** pilas y colas (la fila de tickets de soporte), búsqueda y ordenamiento (ordenar a los candidatos «por mérito», según Nikki) y recursión (el «autocompletado» de GENESIS).
4. **Senior:** Reckt (componentes, estado) y una clase de «arquitectura» que es una reunión de una hora para decidir el nombre de una variable.
5. ~~Versión en inglés~~: hecha.

## Pendientes `[PENDIENTE]`

- ¿En qué capítulos se abren Semi-senior, Senior y la graduación final?
- El arte de la foto de la graduación y los sprites exclusivos.
- El archivo de la música.
