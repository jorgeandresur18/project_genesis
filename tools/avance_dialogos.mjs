// El avance de la revisión de diálogos (pedido del autor, 2026-11-07): una página con cada línea de un capítulo, en el
// orden del JSON, y su estado:
//   ✓ tuya: la escribió o corrigió el autor y la pulió Claude (`docs/guion/revisadas.json`, origen «autor»).
//   ✓ aprobada: el autor la dejó tal cual («✓ Listo» en el editor en vivo; origen «aprobada»).
//   borrador: un borrador de Claude en el editor en vivo, sin aprobar (`docs/guion/ediciones_en_vivo.json`).
//   por aplicar: una edición del autor en el editor en vivo que Claude todavía no pasó a la historia.
//   sin revisar: el resto.
//
//   node tools/avance_dialogos.mjs [cap01]   → docs/guion/avance_cap01.html
// Con `npm run dev`, la misma página se ve al día en http://localhost:5173/__avance (se arma en cada visita).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const leer = (p, si) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return si;
  }
};
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ESTADOS = {
  tuya: { t: '✓ Tuya, corregida', c: 'var(--verde)' },
  aprobada: { t: '✓ Aprobada tal cual', c: 'var(--menta)' },
  aplicar: { t: 'Tu edición, por aplicar', c: 'var(--oro)' },
  borrador: { t: 'Borrador de Claude', c: 'var(--azul)' },
  pendiente: { t: 'Sin revisar', c: 'var(--gris)' },
};

/** El nombre de un tramo a partir de su fondo («fondos/bar_noche.webp» → «bar noche»). */
const tramo = (fondo) =>
  !fondo ? 'Sin fondo' : String(fondo).replace(/^PLACEHOLDER:/, '').replace(/^.*\//, '').replace(/\.\w+$/, '').replace(/[_-]+/g, ' ');

export function generarAvance(raiz, cap = 'cap01') {
  const capitulo = leer(join(raiz, `src/data/chapters/${cap}.json`), { scenes: [] });
  const revisadas = leer(join(raiz, 'docs/guion/revisadas.json'), {});
  const ediciones = leer(join(raiz, 'docs/guion/ediciones_en_vivo.json'), {});
  const lineas = [];
  for (const s of capitulo.scenes) {
    const texto = s.dialogue?.text;
    if (!texto) continue;
    const k = s.scene_id;
    const r = revisadas[k];
    const e = ediciones[k];
    const estado = e ? (e.autor === 'claude' ? 'borrador' : 'aplicar') : r ? (r.origen === 'autor' ? 'tuya' : 'aprobada') : 'pendiente';
    lineas.push({ k, quien: s.dialogue.speaker, texto, nuevo: e?.texto, estado, tramo: tramo(s.background), opciones: s.choices.map((c) => c.text), final: s.ending });
  }
  const cuenta = Object.fromEntries(Object.keys(ESTADOS).map((x) => [x, lineas.filter((l) => l.estado === x).length]));
  const total = lineas.length;
  const listas = cuenta.tuya + cuenta.aprobada;
  const pct = (n) => ((n / Math.max(1, total)) * 100).toFixed(1);

  // Las líneas, en bloques por tramo (cada vez que cambia el fondo).
  let html = '';
  let actual = null;
  for (const l of lineas) {
    if (l.tramo !== actual) {
      if (actual !== null) html += '</section>';
      actual = l.tramo;
      html += `<section class="tramo"><h2>${esc(actual)}</h2>`;
    }
    html += `<article class="linea" data-estado="${l.estado}" data-buscar="${esc(`${l.k} ${l.quien ?? ''} ${l.texto} ${l.nuevo ?? ''}`.toLowerCase())}">
  <header><code>${esc(l.k.replace(`${cap}_`, ''))}</code><b>${esc(l.quien ?? 'Narración')}</b><span class="pill">${ESTADOS[l.estado].t}</span>${l.final ? `<span class="pill final">Final: ${esc(l.final)}</span>` : ''}</header>
  ${l.nuevo !== undefined ? `<p class="viejo">${esc(l.texto)}</p><p class="nuevo">${esc(l.nuevo)}</p>` : `<p>${esc(l.texto)}</p>`}
  ${l.opciones.length ? `<ul class="opciones">${l.opciones.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>` : ''}
</article>`;
  }
  if (actual !== null) html += '</section>';

  const fecha = new Date().toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' });
  const barras = Object.keys(ESTADOS)
    .map((x) => `<i style="width:${pct(cuenta[x])}%;background:${ESTADOS[x].c}" title="${ESTADOS[x].t}: ${cuenta[x]}"></i>`)
    .join('');
  const filtros = [`<button class="activo" data-f="todos">Todas <small>${total}</small></button>`]
    .concat(Object.keys(ESTADOS).map((x) => `<button data-f="${x}"><i style="background:${ESTADOS[x].c}"></i>${ESTADOS[x].t} <small>${cuenta[x]}</small></button>`))
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Avance de diálogos · ${esc(capitulo.title ?? cap)}</title>
<style>
:root { --fondo: #08080b; --caja: #111117; --borde: #26262f; --texto: #e6e6ec; --tenue: #9a9aa6;
  --verde: #3ddc84; --menta: #7fd6b0; --oro: #f0b54a; --azul: #5ea8ff; --gris: #4a4a56; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--fondo); color: var(--texto); font: 15px/1.55 Inter, system-ui, sans-serif; }
.cabeza { position: sticky; top: 0; z-index: 5; padding: 1rem max(16px, 4vw) 0.8rem; background: rgba(8, 8, 11, 0.94); backdrop-filter: blur(8px); border-bottom: 1px solid var(--borde); }
h1 { margin: 0; font-size: 1.25rem; }
.sub { margin: 0.15rem 0 0.7rem; color: var(--tenue); font-size: 0.85rem; }
.numeros { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.4rem 1.2rem; margin-bottom: 0.5rem; }
.numeros b { font-size: 1.6rem; font-variant-numeric: tabular-nums; }
.barra { display: flex; height: 0.7rem; overflow: hidden; border-radius: 999px; background: var(--gris); }
.barra i { display: block; height: 100%; }
.filtros { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.7rem; }
.filtros button { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.7rem; border: 1px solid var(--borde); border-radius: 999px; background: var(--caja); color: var(--texto); font: inherit; font-size: 0.8rem; cursor: pointer; }
.filtros button.activo { border-color: var(--texto); }
.filtros button i { width: 0.6rem; height: 0.6rem; border-radius: 50%; }
.filtros small { color: var(--tenue); font-variant-numeric: tabular-nums; }
#buscar { width: min(100%, 22rem); margin-top: 0.6rem; padding: 0.4rem 0.7rem; border: 1px solid var(--borde); border-radius: 0.5rem; background: var(--caja); color: var(--texto); font: inherit; }
main { max-width: 56rem; margin: 0 auto; padding: 1rem max(16px, 4vw) 4rem; }
.tramo h2 { margin: 1.6rem 0 0.5rem; color: var(--tenue); font-size: 0.75rem; letter-spacing: 0.16em; text-transform: uppercase; }
.linea { margin: 0 0 0.5rem; padding: 0.55rem 0.8rem 0.6rem; border: 1px solid var(--borde); border-left: 3px solid var(--c, var(--gris)); border-radius: 0.5rem; background: var(--caja); }
.linea[data-estado="tuya"] { --c: var(--verde); }
.linea[data-estado="aprobada"] { --c: var(--menta); }
.linea[data-estado="aplicar"] { --c: var(--oro); }
.linea[data-estado="borrador"] { --c: var(--azul); }
.linea[data-estado="pendiente"] { opacity: 0.8; }
.linea header { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem 0.6rem; font-size: 0.8rem; }
.linea code { color: var(--tenue); font: 0.75rem Consolas, monospace; }
.pill { padding: 0 0.5rem; border-radius: 999px; color: #0b0b0e; background: var(--c, var(--gris)); font-size: 0.72rem; font-weight: 600; }
.linea[data-estado="pendiente"] .pill { color: var(--texto); }
.pill.final { background: #ff4d5e; color: #fff; }
.linea p { margin: 0.25rem 0 0; }
.viejo { color: var(--tenue); text-decoration: line-through; text-decoration-color: rgba(255, 255, 255, 0.25); font-size: 0.9rem; }
.nuevo::before { content: '→ '; color: var(--c); }
.opciones { margin: 0.35rem 0 0; padding-left: 1.1rem; color: #ff9cc3; font-size: 0.85rem; }
.oculta { display: none; }
</style>
</head>
<body>
<div class="cabeza">
  <h1>Avance de diálogos · Capítulo ${esc(String(capitulo.chapter ?? ''))}: ${esc(capitulo.title ?? '')}</h1>
  <p class="sub">Generado el ${esc(fecha)} · en <code>npm run dev</code>, al día en <code>/__avance</code></p>
  <div class="numeros"><span><b>${listas}</b> de ${total} líneas con ✓ (${pct(listas)} %)</span><span>${cuenta.tuya} tuyas · ${cuenta.aprobada} aprobadas · ${cuenta.aplicar} por aplicar · ${cuenta.borrador} borradores · ${cuenta.pendiente} sin revisar</span></div>
  <div class="barra">${barras}</div>
  <div class="filtros">${filtros}</div>
  <input id="buscar" type="search" placeholder="Buscar texto, personaje o escena…" aria-label="Buscar">
</div>
<main>${html}</main>
<script>
const lineas = [...document.querySelectorAll('.linea')];
let filtro = 'todos';
const aplicar = () => {
  const q = document.getElementById('buscar').value.trim().toLowerCase();
  for (const l of lineas) l.classList.toggle('oculta', (filtro !== 'todos' && l.dataset.estado !== filtro) || (q && !l.dataset.buscar.includes(q)));
  for (const s of document.querySelectorAll('.tramo')) s.classList.toggle('oculta', !s.querySelector('.linea:not(.oculta)'));
};
for (const b of document.querySelectorAll('.filtros button')) b.onclick = () => {
  filtro = b.dataset.f;
  document.querySelectorAll('.filtros button').forEach((x) => x.classList.toggle('activo', x === b));
  aplicar();
};
document.getElementById('buscar').oninput = aplicar;
</script>
</body>
</html>
`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const raiz = join(fileURLToPath(new URL('.', import.meta.url)), '..');
  const cap = process.argv[2] ?? 'cap01';
  const salida = join(raiz, `docs/guion/avance_${cap}.html`);
  writeFileSync(salida, generarAvance(raiz, cap));
  console.log(`✓ ${salida}`);
}
