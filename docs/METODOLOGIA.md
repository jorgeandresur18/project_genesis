# Metodología del proyecto

Cómo se trabaja en PROJECT GENESIS: qué rama es qué, cómo se numeran las versiones y cómo se publica. Decidido por el
autor el 2026-11-03.

## Las dos ramas

| Rama | Qué es | GitHub | Vercel (la demo) |
|---|---|---|---|
| `main` | Lo publicado: la demo que juega la gente | Sí | **Sí**: cada push a `main` publica |
| `desarrollo` | El trabajo de todos los días | Sí | **No** (`vercel.json`: `git.deploymentEnabled.desarrollo = false`) |

- **Se trabaja siempre en `desarrollo`.** Ahí van todos los commits y se suben a GitHub sin gastar el límite gratis de
  Vercel.
- **`main` solo cambia cuando el autor decide publicar** una versión nueva de la demo (ver «Publicar»). Nunca se hace
  push a `main` sin una orden explícita del autor.
- La CI de GitHub (`.github/workflows/ci.yml`) revisa las dos ramas: tipos, ESLint, todas las pruebas y la compilación.

## Las versiones

Se numeran como `MAYOR.MENOR.ARREGLO` (versionado semántico):

- **MAYOR** (`2.0.0`): un cambio grande del juego (por ejemplo, el juego base completo).
- **MENOR** (`1.1.0`): algo nuevo que se publica (un capítulo cerrado, un sistema nuevo como PayFoe o el torneo).
- **ARREGLO** (`1.0.1`): solo correcciones, sin contenido nuevo.
- Mientras se trabaja, la versión lleva `-dev` (`1.1.0-dev`): es la que viene, todavía sin publicar.

La versión está en dos lugares y siempre tiene que coincidir: `version` de `src/data/juego.json` (la que se ve en una
esquina del menú) y `version` de `package.json`.

Cada versión publicada tiene su **etiqueta** en git (`v1.0.0`, `v1.1.0`…), para poder volver a ella. El registro de
qué trae cada una está en `docs/VERSIONES.md`.

## El día a día

1. Lo que toca hacer sale de `docs/CRONOGRAMA.md`.
2. Commits chicos, cada uno con su prueba de rutas (`npm run test:routes`) y, si toca código, `npm test` y
   `npm run lint`.
3. Al terminar la sesión: la entrada en `docs/BITACORA.md`, lo hecho marcado en el cronograma y lo nuevo anotado en
   `docs/VERSIONES.md`, en la versión en curso.
4. Push de `desarrollo` a GitHub.

## Trabajar desde varias computadoras

El autor trabaja desde más de una computadora. **GitHub es el único punto de encuentro:** lo que no se subió no existe
para las otras.

| Computadora | Dónde está el proyecto | Desde |
|---|---|---|
| **Principal** (la de casa) | La carpeta original del proyecto | 24 de octubre de 2026 |
| **Segunda** (`MARKETING1ICSH`, clon) | `C:\Users\Diseño\Documents\jorge\PROJECT_GENESIS` | 4 de noviembre de 2026 |

- **Al empezar, en cualquier computadora:** `git checkout desarrollo` y `git pull`. Así llega lo que se hizo en la otra.
- **Al terminar:** commit y `git push` de `desarrollo`, siempre, aunque la sesión quede a medias. Lo que no se sube se
  queda atrapado en esa computadora (pasó el 3 de noviembre: se buscaron cambios de las 23:00 que nunca se subieron).
- **Cada entrada de la bitácora dice en qué computadora se hizo** («Computadora: principal» o «Computadora: segunda»).
- Los commits se firman siempre como `jorgeandresur18 <jorgeurgiles18@gmail.com>`. En la segunda computadora está
  configurado solo para este repositorio (`git config` local), porque esa computadora tiene otra cuenta.
- **Subir desde la segunda computadora:** su cuenta de GitHub guardada (`clinicaserhumano`) no tiene permiso en el
  repositorio. Por eso la dirección del repositorio lleva el usuario
  (`git remote set-url origin https://jorgeandresur18@github.com/jorgeandresur18/project_genesis.git`) y la sesión de
  `jorgeandresur18` quedó guardada aparte en el Administrador de credenciales de Windows
  (`git:https://jorgeandresur18@github.com`). Si se deja de usar esa computadora: borrar esa credencial y revocar
  «Git Credential Manager» en GitHub (Settings → Applications).
- La rama local `respaldo-historial-2026-11-02` existe solo en la computadora principal (no está en GitHub).
- Si las dos computadoras tocaron lo mismo sin `pull` de por medio, `git pull` avisa del conflicto: se resuelve a mano
  y nunca con `push --force`.

## Publicar una versión (solo con orden del autor)

1. En `desarrollo`: sacar el `-dev` de la versión (`1.1.0-dev` → `1.1.0`) en `juego.json` y `package.json`, y cerrar
   su entrada en `docs/VERSIONES.md` con la fecha.
   - Revisar `demo_publica` en `juego.json`: es lo que cambia en lo publicado (lo de más adelante, apagado: hasta qué
     capítulo se juega, el torneo, PayFoe, qué vende la tienda). `capitulo_maximo` también limita los desbloqueables: la
     galería, los finales, el porcentaje, el mapa y Boringram solo muestran lo de los capítulos publicados. Se aplica solo en lo que se compila
     (`import.meta.env.PROD`); en `npm run dev` y en las pruebas está todo prendido. Para comprobarlo:
     `npm run build` y `npx vite preview`.
2. Que la CI esté en verde.
3. Pasar `desarrollo` a `main` (merge) y subir `main`: ahí Vercel publica la demo.
4. Etiquetar (`git tag -a v1.1.0`) y subir la etiqueta.
5. De vuelta en `desarrollo`, empezar la siguiente (`1.2.0-dev`).

## Mientras dure la lógica

Hasta cerrar la lógica y la coherencia de todo el juego, se trabaja con textos de Claude (borrador) y placeholders; el
arte queda para el final (decidido por el autor el 2026-11-03).

## Probar sin la computadora de casa (celular o cualquier PC)

`/all` en la dirección publicada (`project-genesis-yeah.vercel.app/all`) funciona siempre, en el celular y en cualquier PC, y prende todo lo que `demo_publica` apaga: el autor lo usa para probar sin computadora a mano (decisión del autor, 2026-11-05). Trae lo que esté en `main`: lo de `desarrollo` no llega hasta publicar. Pide un PIN que solo sabe el autor (la primera vez en cada navegador), igual que los demás atajos de prueba (`?batalla`, `?vars`, `?sprites`, `?escena`, `/capN` de un capítulo sin publicar…). Disuade, pero no es seguridad: el repositorio público y las imágenes se pueden ver igual. Antes del lanzamiento hay que decidir si se cierra.
