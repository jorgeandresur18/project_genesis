# Fondos e imágenes del Capítulo 1 y cómo pedírselos a Gemini

**Capítulo 1: todos los fondos y CG están listos** (28 imágenes, con el beso de Nikki en dos planos y la carga de Cami en el bosque). Este documento queda como guía para los capítulos siguientes.

Pendientes y alternativas:
- `dulce_frio_fachada`: por ahora se usa la imagen con el letrero «SWEET CHILL» (la versión en inglés). Falta la versión en español: pídela igual, pero con el letrero «DULCE FRÍO» (o sin texto); renombra la actual `dulcefrio_fachada_en.png`, guarda la nueva como `docs/fondos/dulcefrio_fachada.png` y corre `npm run fondos`.
- `hangar_destruido`: se usa en el camino alternativo del hangar del Capítulo 1 (decisión «Probar la nave grande»), después de la pelea, de `cap01_hg_013` a `cap01_hg_021`.
- «Caída amorosa entre mundos flotantes» y «Abrazo en la Grieta Cósmica»: variantes de `cg_caida_multiverso`, guardadas sin publicar.
- `calle_noche_taxi`: variante de `calle_noche` con el taxi; se usa mientras Nikki pide el taxi y se sube (escenas 108 a 114).
- Los CG (`cg_*`) miden menos de 1920 px de ancho y la caída no es 16:9: se ven bien, pero en pantallas grandes un poco más suaves.

## Cómo entregarlos

1. Guarda cada imagen en `docs/fondos/` **con el nombre exacto de la tabla** (por ejemplo `pasillo_castillo.png`). Si el archivo ya se llama así, no hace falta tocar `tools/fondos.config.json`.
2. Corre `npm run fondos`: la convierte, la achica a 1920 px y la pone en todas las escenas que usan ese fondo.
3. Tamaño: 16:9, ideal 2752×1536 (como los que ya hiciste). Mínimo 1920×1080.

## Bloque de estilo (pégalo al final de cada prompt)

> Fondo para novela visual estilo anime, ilustración digital con línea limpia y sombreado suave, iluminación cinematográfica, mucho detalle ambiental, formato horizontal 16:9. Sin personajes ni personas, sin texto legible, sin logotipos, sin firma, sin marca de agua. Encuadre a la altura de los ojos, con espacio libre en el centro y abajo para que se paren los personajes.

Consejos:
- Pídele siempre **«sin firma ni marca de agua»** y revisa las esquinas antes de entregarla.
- No pidas «al estilo de» un artista o un anime concreto.
- Para que todos los fondos combinen, adjunta `docs/fondos/bar.png` como referencia de estilo y dile: «mismo estilo de dibujo y acabado que esta imagen, pero de este lugar: …».
- Las imágenes con personajes (CG) llevan como referencia los sprites base (`public/sprites/jair/base.webp`, `cami/base.webp`) y le dices «mismos personajes, misma ropa».

## Hechos en código (listos)

No hace falta generarlos: se dibujan en `src/components/CodeScreen.tsx` y su texto vive en `src/data/pantallas.json`. En el guion se usan como `PANTALLA:<nombre>`.

- `gravity_ide` (39 escenas): el IDE GRAVITY. La consola de GENESIS va mostrando las líneas de GRAVITY y los prompts de Jair a medida que aparecen.
- `pc_correo` (21): la bandeja de entrada con el correo de GRAVITY y los botones «Descargar» y «Eliminar».
- `celular_mensaje` (8): el chat con Nikki; los mensajes aparecen uno por uno.
- `negro` (8): pantalla negra.
- `nebulosa_magenta`: ahora es una imagen (`docs/fondos/nebulosa.jpeg`); la versión en código queda de respaldo.
