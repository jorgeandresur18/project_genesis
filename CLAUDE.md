# PROJECT GENESIS — Instrucciones para Claude Code

Novela visual indie en código (React + Vite). Género: ciencia ficción psicológica, comedia negra, meta-horror. Obra para adultos (M / PEGI 18). Ambientada en una ciudad sin nombre; español neutro.

## Antes de escribir cualquier cosa

1. Lee `docs/CANON.md`. Es la fuente de verdad de la historia.
2. Al escribir diálogos o textos, lee `docs/TONO.md`.
3. Al tocar finales o rutas, lee `docs/FINALES.md`.
4. Al programar, lee `docs/SPEC.md`.
5. Al tocar las batallas por turnos (RPG), lee `docs/BIBLIA_RPG.md`: las reglas de todas las peleas y las excepciones de cada una. Para el Rey Malvado y la batalla final, `docs/BATALLA_FINAL.md`.
6. Para saber en qué se está y qué sigue, lee `docs/CRONOGRAMA.md`. Cómo se trabaja (ramas, versiones, publicar): `docs/METODOLOGIA.md`. **Al terminar cada sesión, agrega una entrada en `docs/BITACORA.md`** (qué se hizo, qué decidió el autor, qué quedó pendiente) y marca lo hecho en el cronograma.
7. Al escribir los orígenes de las chicas, la relación con Nikki o los capítulos 4 en adelante, lee `docs/DIRECCION_PSICOLOGICA.md` (si contradice el canon, pregunta). Para Cami, lee también `docs/CAMI.md`; para Rikka, `docs/RIKKA.md`.

## Reglas duras

- **No contradigas el canon.** Si un dato está marcado `[PENDIENTE]`, no lo inventes: deja un comentario `TODO(canon): ...` y pregunta al autor.
- **No toques los 2 finales canon ni el juego base** sin una orden explícita. El juego base sigue en desarrollo.
- **La lógica del Capítulo 1 está cerrada** (2026-11-03, etiqueta `cap01-logica-cerrada`): no cambies sus escenas, decisiones, variables ni finales sin una orden explícita del autor. Sí se permiten las correcciones puntuales de diálogos que pida el autor y la pasada de diálogos y arte del final.
- **Nada de nombres reales** en código, JSON, assets, commits ni interfaz. **Ari** (Arianni, la chica en la que se basa Rikka; antes `CREADORA_A`), **Milka** (la de Cami; antes `CREADORA_B`) e `INFLUENCER_C` son personajes ficticios que solo existen dentro de la historia (confirmado por el autor el 2026-10-31; nombres, 2026-11-05): el arte de Rikka y Cami no se basa en personas reales. Única excepción: «Conoce más del proyecto» (`src/data/conoce_mas.json` y su versión en inglés), donde van el nombre del autor y los autores de las obras y corrientes que lo inspiraron (por orden del autor).
- **Sin contenido sexual explícito.** La sexualidad es sugerida. Las escenas +18 (desbloqueables) van con censura y nunca muestran nada explícito.
- **La historia vive en JSON**, nunca dentro de los componentes de React.
- **Greyboxing:** sin sprites, imágenes ni audio finales hasta la fase de arte. Usa placeholders (`PLACEHOLDER:nombre`).
- **Decisiones: máximo 4 opciones a la vez** en la novela (la prueba de rutas lo revisa; varias opciones con condiciones distintas pueden sumar más en el JSON si nunca se ven más de 4 juntas).
- **No agregues mecánicas** (inventario, minijuegos, combate) sin que el autor lo pida.
- **Commits pequeños.** Antes de cada commit corre la prueba automática de rutas (`npm run test:routes`).
- **Ramas y versiones** (`docs/METODOLOGIA.md`): se trabaja en `desarrollo` (va a GitHub, Vercel no la publica). **Nunca hagas push a `main` sin una orden explícita del autor**: `main` es la demo publicada en Vercel y cada push gasta su límite gratis. La versión en curso lleva `-dev` (`src/data/juego.json` y `package.json`, siempre iguales) y lo nuevo se anota en `docs/VERSIONES.md`.
- Si el autor corrige algo del canon, actualiza `docs/CANON.md` en el mismo cambio.

## Stack

React + Vite, JavaScript/TypeScript a elección del autor, estado global con Zustand o Context, persistencia en `localStorage`, GitHub para control de versiones.

## Estructura del repositorio

```
/
  CLAUDE.md
  docs/            CANON.md, TONO.md, FINALES.md, SPEC.md
  src/
    components/    DialogBox, DecisionMenu, SceneStage
    engine/        useStoryEngine, gestor de estado, guardado
    data/
      chapters/    cap01.json ... cap06.json, cap07a.json, cap07b.json
      expansions/  genesis_pp/, rikkaquest/, genesis_sharp/
      finales/     canon_1.json, canon_2.json, alt_1.json ...
  tests/           prueba automática de rutas
```

## Comandos

```
npm create vite@latest genesis-vn -- --template react
npm run dev
npm run test:routes
```

## Cuando dudes

Pregunta antes de decidir cualquier cosa de historia. Preferir una pregunta corta a una invención.

## Lo que conviene saber (al día con el 7 de noviembre de 2026)

Para trabajar desde cualquier computadora. El detalle de cada sesión está en `docs/BITACORA.md`.

**Las dos computadoras (decisión del autor, 2026-11-05)**
- La **computadora de Jorge** (la principal, en casa): ahí el autor prueba el juego, solo de noche.
- La **computadora del trabajo**: ahí no se le pide al autor que pruebe nada. Lo que haya que probar se anota en
  `docs/PRUEBAS_EN_CASA.md` para la noche. Claude sí corre sus propias pruebas automáticas (`npm test`, rutas, e2e).
- Lo pendiente para el día siguiente está en `docs/CRONOGRAMA.md`, «Para mañana».

**Cómo prefiere trabajar el autor**
- **Arte al final:** hasta cerrar la lógica se trabaja con textos de Claude (borrador) y placeholders; no se bloquea
  nada esperando arte ni corrección de diálogos. Las decisiones de historia igual se preguntan.
- **Retoques mínimos:** en un retoque de arte, tocar solo lo pedido (el dibujo del autor es la base) y mostrar una vista
  previa antes de aplicar. Nada de rellenos con «puntitos» (dithering).
- Escribe rápido y con faltas de ortografía: leer la intención. Si una frase es ambigua (un «no» que falta, por
  ejemplo), preguntar antes de rehacer algo grande.
- Los precios de la tienda que propone Claude quedan como propuesta: el autor los revisa después.

**Publicar (`main`, Vercel)**
- En lo que se compila para publicar se aplica `demo_publica` de `src/data/juego.json`: lo de más adelante queda
  apagado (hoy: Capítulo 2, Torneo Genesis, PayFoe y la tienda nueva; la tienda vende solo lo del Capítulo 1). En
  `npm run dev` y en las pruebas está todo prendido. Para publicar algo nuevo, se cambia ese bloque. Ver
  `docs/METODOLOGIA.md`.

**El PIN de los atajos:** en lo publicado, `/all` y los demás atajos de prueba (`usaAtajo` en `src/engine/modo.ts`: `?batalla`, `?vars`, `?sprites`, `?escena`, `/capN` sin publicar…) piden un PIN que solo sabe el autor. Un atajo nuevo por la dirección se agrega ahí. **Nunca escribas el número en un archivo, commit, documento ni mensaje del repositorio**, que es público: en el código va solo su huella (`src/engine/puerta.ts`). Para cambiarlo, el autor da el nuevo y se recalcula la huella. Disuade, pero no protege de verdad: todo corre en el navegador.

**Pruebas**
- `npm test` (Vitest, unas 200), `npm run test:routes` (antes de cada commit), `npm run lint`, `npx tsc --noEmit -p .`.
- `npm run e2e`: Playwright en un navegador sin ventana (`tests/e2e/`, ayudantes en `tests/e2e/ayudantes.ts`).
- Para probar a mano: `?batalla=<id>&vars={json}` abre una pelea con lo de una partida (niveles, mochila, cassettes);
  `?galeria=todo` abre la galería completa; `?sprites` abre el probador de sprites.

**Herramientas de arte** (`tools/`)
- `npm run sprites` (PSB/PSD → `public/sprites`, y después `igualar_piel.py`).
- Desbloqueables de Rikka: `node --max-old-space-size=14000 tools/desbloqueables_rikka.mjs`, luego
  `python -I -X utf8 tools/igualar_piel.py` y `python -I -X utf8 tools/censura_sprites.py` (el mosaico). Sale del PSD
  «desbloqueables rikka mas grande.psd» (sprites, emblemas, manos de Cami con su máscara de capa, marcas de la
  nalgada). **El PSD sin censura nunca se sube.** En Windows, los scripts de Python van con `-X utf8`.
- `igualar_piel.py` compara el color de relleno de la piel con el del sprite base (los «:luz», como el traje, solo la luz).
- `tools/objetos.py`: los dibujos de los objetos (`docs/sprites de prueba/objetos/` → `public/objetos/`).

**Dónde está cada cosa nueva**
- Reglas de las peleas: `docs/BIBLIA_RPG.md` (estados, turno libre al salir de dormido/congelado/paralizado, veneno y
  quemadura desde el turno siguiente, cebos, Multicebo, objetos). Lógica sin dibujo en `src/engine/turnos.ts`.
- Escena secreta y galería de Rikka: `src/data/emblemas_18.json` (emblemas, manos, caras) y las frases por zona en
  `src/data/galeria.json` (`quejas.rikka`: `zonas`, `zonas_novela`, `al_pasar`).
- Ideas anotadas sin hacer (por ejemplo, los dos Boringram): `docs/CRONOGRAMA.md`, «Ideas anotadas».
- **La demo y `capitulo_maximo`:** en lo publicado, la galería, los finales, el porcentaje, el mapa y Boringram muestran
  solo los capítulos publicados (`capituloPublicado`, `archivosPublicados`, `escenaPublicada`, `endingsPublicados` en
  `src/engine/story.ts`). En desarrollo se ve todo.
- **Escena secreta de las termas (novela):** campos de escena `globo` (la línea en un globo con «Siguiente»; recién ahí
  se toca a Rikka) y `escala` en un personaje; las manos del jugador (también en la galería) salen de
  `python -I -X utf8 tools/manos_jugador.py` (desde `docs/palma.png`, `agarrando.png`, `apuntando.png`, que no se suben).
- **Peleas, lo del 7 de noviembre:** el turno de los héroes también está en `src/engine/turnos.ts` (`resolverObjeto`,
  `puedeActuarHeroe`, `tipoDeAtaque`…). Los sprites de las peleas salen de los HTML del autor con
  `python -I -X utf8 tools/batalla_sprites.py ["docs/sprites de prueba/personajes"] [ids]` (con ids, solo esas hojas;
  quedan en WebP sin pérdida). **El HTML grande se separa** en una carpeta por personaje con
  `python -I -X utf8 tools/sprites_separar.py separar <html>` (`juntar` los vuelve a unir): el autor pasa solo el HTML
  del personaje que cambió. **Especiales+** (`docs/BIBLIA_RPG.md`, secciones 26 y 27): una forma con otra hoja, que al terminar vuelve a la
  base (Cami armored → `prueba_armored`; Rikka princesa de luna → `prueba_luna`). La sombra de roca: sección 25. Para probar a mano
  en el navegador (solo en `npm run dev`): `window.__pelea` tiene el estado y los datos de la pelea (forzar un ataque,
  llenar la barra); los recorridos sin ventana están en `tests/e2e/`.
- **Torneo:** peleadores nuevos (Jordy, Billy, Maggie, el influencer con seguidores, el otaku; Nikki desde el inicio) en
  `heroes` de `src/data/rpg/personajes.json`; golpes que dejan un estado (`deja`); equipos parejos (`jefe_con_horda`).
- **Editor de diálogos en vivo** (solo en `npm run dev`): «✎ Editar» en la caja de diálogo; lo que el autor guarda va a
  `docs/guion/ediciones_en_vivo.json` (original y texto nuevo). Para aplicarlo: leer ese archivo, corregir la redacción,
  pasarlo al JSON de la historia con el inglés y vaciarlo. Ver `docs/SPEC.md`.
- **Entornos de prueba (archivo importante del autor):** `npm run entornos` rehace «PROJECT GENESIS - entornos de
  prueba.html» en la carpeta «Entornos de prueba» del escritorio: **una sola página** con pestañas (herramientas, capítulos
  con «▶ Ir», peleas con variables, diálogos de cada capítulo con su estado, arte y sprites de `public/`, la lista de
  `docs/PRUEBAS_EN_CASA.md` con casillas, notas y comandos). Rehacerla al agregar peleas, escenas, pruebas o arte; las
  casillas y notas del autor quedan en su navegador (no se pierden al rehacerla).
- **Avance de la revisión de diálogos:** `npm run avance` arma `docs/guion/avance_cap01.html` (cada línea con su estado: ✓ tuya,
  ✓ aprobada, por aplicar, borrador de Claude o sin revisar); con `npm run dev`, al día en `/__avance` (`?cap=cap02` para otro). «▶ Ir» abre el juego en esa línea
  (`?escena=<id>&ir`, solo en desarrollo).
  Regenerarlo después de aplicar ediciones.
- **Nombres:** las chicas reales son **Milka** (base de Cami) y **Ari** (Arianni, base de Rikka); Jordan pasó a llamarse
  **Jordy** (gay, discreto). Cami es bisexual (canon). Todo en `docs/CANON.md`.
