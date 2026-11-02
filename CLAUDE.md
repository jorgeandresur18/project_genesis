# PROJECT GENESIS — Instrucciones para Claude Code

Novela visual indie en código (React + Vite). Género: ciencia ficción psicológica, comedia negra, meta-horror. Obra para adultos (M / PEGI 18). Ambientada en una ciudad sin nombre; español neutro.

## Antes de escribir cualquier cosa

1. Lee `docs/CANON.md`. Es la fuente de verdad de la historia.
2. Al escribir diálogos o textos, lee `docs/TONO.md`.
3. Al tocar finales o rutas, lee `docs/FINALES.md`.
4. Al programar, lee `docs/SPEC.md`.
5. Al tocar las batallas por turnos (RPG), lee `docs/BIBLIA_RPG.md`: las reglas de todas las peleas y las excepciones de cada una.
6. Al escribir los orígenes de las chicas, la relación con Nikki o los capítulos 4 en adelante, lee `docs/DIRECCION_PSICOLOGICA.md` (si contradice el canon, pregunta). Para Cami, lee también `docs/CAMI.md`.

## Reglas duras

- **No contradigas el canon.** Si un dato está marcado `[PENDIENTE]`, no lo inventes: deja un comentario `TODO(canon): ...` y pregunta al autor.
- **No toques los 2 finales canon ni el juego base** sin una orden explícita. El juego base sigue en desarrollo.
- **Nada de nombres reales** en código, JSON, assets, commits ni interfaz. `CREADORA_A`, `CREADORA_B` e `INFLUENCER_C` son personajes ficticios que solo existen dentro de la historia (confirmado por el autor el 2026-10-31): el arte de Rikka y Cami no se basa en personas reales. Única excepción: «Conoce más del proyecto» (`src/data/conoce_mas.json` y su versión en inglés), donde van el nombre del autor y los autores de las obras y corrientes que lo inspiraron (por orden del autor).
- **Sin contenido sexual explícito.** La sexualidad es sugerida. Las escenas +18 (desbloqueables) van con censura y nunca muestran nada explícito.
- **La historia vive en JSON**, nunca dentro de los componentes de React.
- **Greyboxing:** sin sprites, imágenes ni audio finales hasta la fase de arte. Usa placeholders (`PLACEHOLDER:nombre`).
- **No agregues mecánicas** (inventario, minijuegos, combate) sin que el autor lo pida.
- **Commits pequeños.** Antes de cada commit corre la prueba automática de rutas (`npm run test:routes`).
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
