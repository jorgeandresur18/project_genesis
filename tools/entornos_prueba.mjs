// Los entornos de prueba (pedido del autor, 2026-11-07): UNA sola página con todo lo que sirve para probar y editar el
// juego en `npm run dev`, en pestañas: herramientas, capítulos y escenas clave (con «▶ Ir»), las peleas, los diálogos
// de cada capítulo con su estado (el avance), el arte (sprites, hojas de pelea, fondos, objetos), la lista de
// docs/PRUEBAS_EN_CASA.md con casillas, notas y los comandos. Va en una carpeta del escritorio.
//
//   npm run entornos                 → <Escritorio>/Entornos de prueba/PROJECT GENESIS - entornos de prueba.html
//   node tools/entornos_prueba.mjs <carpeta>
//
// Las casillas y las notas se guardan en el navegador (localStorage de ese archivo); los enlaces abren el juego en
// http://localhost:5173 (con `npm run dev` encendido). El arte se ve desde la carpeta del proyecto (sin el juego
// encendido). Rehacer la página después de agregar peleas, escenas, pruebas o arte.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ESTADOS, htmlLineas, lineasDe } from './avance_dialogos.mjs';

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const JUEGO = 'http://localhost:5173';
const leer = (p) => JSON.parse(readFileSync(join(RAIZ, p), 'utf8'));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** Markdown mínimo de una línea: `código`, **negrita**, *cursiva* y [enlaces](url). */
const md = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

function carpetaPorDefecto() {
  for (const d of [join(homedir(), 'Desktop'), join(homedir(), 'Escritorio'), join(homedir(), 'OneDrive', 'Desktop'), join(homedir(), 'OneDrive', 'Escritorio')]) {
    if (existsSync(d)) return join(d, 'Entornos de prueba');
  }
  return join(homedir(), 'Entornos de prueba');
}

// ---------- Los datos ----------
const juego = leer('src/data/juego.json');
const capitulos = readdirSync(join(RAIZ, 'src/data/chapters'))
  .filter((f) => /^cap\d+\.json$/.test(f))
  .sort()
  .map((f) => ({ archivo: f.replace('.json', ''), ...leer(`src/data/chapters/${f}`) }));
const batallas = readdirSync(join(RAIZ, 'src/data/batallas'))
  .filter((f) => f.endsWith('.json'))
  .sort()
  .map((f) => ({ id: f.replace('.json', ''), ...leer(`src/data/batallas/${f}`) }));
const grupoDePelea = (id) => {
  if (id.startsWith('cap02')) return 'Capítulo 2';
  if (id.startsWith('cap03')) return 'Capítulo 3: la torre';
  if (['guia', 'bastion', 'hangar', 'nikki', 'sombra_roca'].includes(id)) return 'Capítulo 1';
  return 'Otras';
};

/** Las escenas clave de un capítulo: la primera, las peleas, los finales y el fin del capítulo. */
function escenasClave(c) {
  const out = [];
  c.scenes.forEach((s, i) => {
    let tipo = null;
    if (i === 0) tipo = 'Inicio';
    else if (s.batalla) tipo = `Pelea: ${s.batalla}`;
    else if (s.ending) tipo = `Final: ${s.ending}`;
    else if (s.fin_capitulo) tipo = 'Fin del capítulo';
    else if (s.secreto) tipo = 'Secreta';
    if (tipo) out.push({ id: s.scene_id, tipo, texto: (s.dialogue?.text ?? '').slice(0, 90) });
  });
  // Las secretas vienen en tandas seguidas: solo la primera de cada tanda.
  return out.filter((x, i) => x.tipo !== 'Secreta' || out[i - 1]?.tipo !== 'Secreta');
}

/** docs/PRUEBAS_EN_CASA.md en secciones, con sus casillas («- [ ]» y «- [x]») y el resto del texto. */
function pruebas() {
  const lineas = readFileSync(join(RAIZ, 'docs/PRUEBAS_EN_CASA.md'), 'utf8').split(/\r?\n/);
  const secciones = [];
  let s = null;
  for (const l of lineas) {
    const h = l.match(/^## (.+)/);
    if (h) {
      s = { titulo: h[1], items: [] };
      secciones.push(s);
      continue;
    }
    if (!s || !l.trim()) continue;
    const c = l.match(/^(\s*)- \[( |x)\] (.*)/i);
    if (c) s.items.push({ tipo: 'casilla', hecho: c[2].toLowerCase() === 'x', texto: c[3], sangria: c[1].length > 0 });
    else if (/^\s+\S/.test(l) && s.items.length) s.items[s.items.length - 1].texto += ' ' + l.trim();
    else s.items.push({ tipo: 'texto', texto: l.replace(/^- /, '• ') });
  }
  return secciones;
}

/** Las imágenes de una carpeta de public/ (sin subcarpetas, salvo que se pida), con su ruta de archivo. */
function imagenes(carpeta, { sub = false } = {}) {
  const dir = join(RAIZ, 'public', carpeta);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir).sort()) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      if (sub) out.push(...imagenes(join(carpeta, f), { sub }));
    } else if (/\.(webp|png|jpe?g|gif)$/i.test(f)) out.push({ nombre: relative(join(RAIZ, 'public'), p).replace(/\\/g, '/'), url: pathToFileURL(p).href });
  }
  return out;
}

// ---------- Las pestañas ----------
const ir = (id) => `${JUEGO}/?escena=${encodeURIComponent(id)}&amp;ir`;

function tabHerramientas() {
  const h = [
    ['El juego', `${JUEGO}/`, 'El menú de inicio, como lo ve el jugador (con todo prendido en desarrollo).'],
    ['Avance de diálogos en el juego', `${JUEGO}/__avance`, 'El mismo de la pestaña «Diálogos», leído en vivo del juego.'],
    ['Galería completa', `${JUEGO}/?galeria=todo`, 'Todas las imágenes y finales, sin desbloquear nada de verdad.'],
    ['Juego completo (100 %)', `${JUEGO}/?juego=completo`, 'Como si ya se hubiera terminado al 100 %: abre las escenas secretas.'],
    ['Probador de sprites', `${JUEGO}/?sprites`, 'Los sprites de la novela con sus expresiones, ropa y efectos.'],
    ['Bootcamp con todo abierto', `${JUEGO}/?bootcamp=todo`, 'Los cinco niveles del Bootcamp Genesis.'],
    ['Bastión: directo al jefe', `${JUEGO}/?nivel=jefe`, 'El nivel del Bastión empezando en el jefe.'],
    ['Demo de batalla', `${JUEGO}/?batalla=demo`, 'La pelea de prueba.'],
  ];
  return `<div class="tarjetas">${h.map(([t, u, d]) => `<a class="tarjeta" href="${u}" target="juego"><b>${esc(t)}</b><small>${esc(d)}</small></a>`).join('')}</div>`;
}

function tabCapitulos() {
  const caps = capitulos
    .map((c) => {
      const filas = escenasClave(c)
        .map((x) => `<li><a class="ir" href="${ir(x.id)}" target="juego">▶ Ir</a><span class="tipo">${esc(x.tipo)}</span><code>${esc(x.id)}</code><small>${esc(x.texto)}</small></li>`)
        .join('');
      const publicado = c.chapter <= (juego.demo_publica?.capitulo_maximo ?? 0);
      return `<details class="cap" open><summary><b>Capítulo ${c.chapter}: ${esc(c.title)}</b> <span class="etq ${publicado ? 'pub' : ''}">${publicado ? 'en la demo' : 'solo en desarrollo'}</span> <small>${c.scenes.length} escenas</small> <a href="${JUEGO}/cap${c.chapter}" target="juego">«Nueva partida» desde aquí</a></summary><ul class="escenas">${filas}</ul></details>`;
    })
    .join('');
  return `<p class="sub">«▶ Ir» abre el juego justo en esa escena, como una partida nueva desde ahí (las variables de antes no están).</p>
<form class="saltar" id="saltar"><input type="text" id="escena" placeholder="Cualquier escena: cap01_047, cap02_p2_020…" aria-label="Escena"><button type="submit">▶ Ir a la escena</button></form>${caps}`;
}

function tabPeleas() {
  const grupos = {};
  for (const b of batallas) (grupos[grupoDePelea(b.id)] ??= []).push(b);
  return `<div class="ajustes">
  <label><input type="checkbox" id="cuadricula"> Con la cuadrícula</label>
  <textarea id="vars" spellcheck="false" placeholder='Variables de una partida (opcional), en JSON: {"nivel_jair":6,"nivel_cami":15}' aria-label="Variables"></textarea>
</div>${Object.entries(grupos)
    .map(
      ([g, bs]) =>
        `<h3>${esc(g)}</h3><div class="peleas">${bs
          .map((b) => `<a class="pelea" data-id="${esc(b.id)}" href="${JUEGO}/?batalla=${encodeURIComponent(b.id)}" target="juego"><b>${esc(b.titulo ?? b.id)}</b><code>${esc(b.id)}</code><small>${esc((b.heroes ?? []).join(' + '))}${b.enemigos ? ` contra ${esc([...new Set(b.enemigos)].join(', '))}` : ''}</small></a>`)
          .join('')}</div>`,
    )
    .join('')}`;
}

function tabDialogos() {
  const bloques = capitulos.map((c) => ({ c, ...lineasDe(RAIZ, c.archivo) }));
  const pct = (n, t) => ((n / Math.max(1, t)) * 100).toFixed(1);
  const selector = bloques
    .map(({ c, cuenta, total }, i) => `<button class="${i === 0 ? 'activo' : ''}" data-cap="${c.archivo}">Capítulo ${c.chapter} <small>${pct(cuenta.tuya + cuenta.aprobada, total)} %</small></button>`)
    .join('');
  const caps = bloques
    .map(({ c, lineas, cuenta, total }, i) => {
      const listas = cuenta.tuya + cuenta.aprobada;
      const barras = Object.keys(ESTADOS).map((x) => `<i style="width:${pct(cuenta[x], total)}%;background:${ESTADOS[x].c}" title="${ESTADOS[x].t}: ${cuenta[x]}"></i>`).join('');
      const filtros = [`<button class="activo" data-f="todos">Todas <small>${total}</small></button>`]
        .concat(Object.keys(ESTADOS).map((x) => `<button data-f="${x}"><i style="background:${ESTADOS[x].c}"></i>${ESTADOS[x].t} <small>${cuenta[x]}</small></button>`))
        .join('');
      return `<div class="dialogos" data-cap="${c.archivo}" ${i === 0 ? '' : 'hidden'}>
  <div class="resumen"><b>${listas}</b> de ${total} líneas con ✓ (${pct(listas, total)} %) · ${cuenta.tuya} tuyas · ${cuenta.aprobada} aprobadas · ${cuenta.aplicar} por aplicar · ${cuenta.borrador} borradores · ${cuenta.pendiente} sin revisar</div>
  <div class="barra">${barras}</div>
  <div class="filtros">${filtros}</div>
  <input type="search" class="buscar" placeholder="Buscar texto, personaje o escena…" aria-label="Buscar en el Capítulo ${c.chapter}">
  <div class="lineas">${htmlLineas(lineas, c.archivo, JUEGO)}</div>
</div>`;
    })
    .join('');
  return `<p class="sub">El avance de la revisión: cada línea con su estado. «▶ Ir» abre el juego en esa línea para editarla con el editor en vivo. Es la foto de cuando se generó la página: después de editar, <code>npm run entornos</code> (o mira el avance en vivo en Herramientas).</p>
<div class="selector">${selector}</div>${caps}`;
}

function tabArte() {
  const grupos = [];
  for (const d of readdirSync(join(RAIZ, 'public/sprites')).sort()) {
    const imgs = imagenes(join('sprites', d), { sub: true });
    if (imgs.length) grupos.push({ t: `Sprites de la novela: ${d.replace(/_/g, ' ')}`, imgs, clase: 'alto' });
  }
  grupos.push({ t: 'Hojas de pelea', imgs: imagenes('batalla'), clase: 'hoja' });
  grupos.push({ t: 'Retratos de pelea', imgs: imagenes('batalla/retratos') });
  grupos.push({ t: 'Fondos de pelea', imgs: imagenes('batalla/fondos'), clase: 'ancho' });
  grupos.push({ t: 'Fondos de la novela', imgs: imagenes('fondos', { sub: true }), clase: 'ancho' });
  grupos.push({ t: 'Objetos', imgs: imagenes('objetos', { sub: true }) });
  grupos.push({ t: 'Emblemas', imgs: imagenes('emblemas') });
  grupos.push({ t: 'Fotos (Boringram)', imgs: imagenes('fotos', { sub: true }) });
  grupos.push({ t: 'Marca', imgs: imagenes('marca', { sub: true }) });
  const total = grupos.reduce((n, g) => n + g.imgs.length, 0);
  const comandos = [
    ['npm run sprites', 'PSB/PSD → public/sprites (después, igualar_piel.py)'],
    ['python -I -X utf8 tools/igualar_piel.py', 'iguala el color de la piel con el sprite base'],
    ['node --max-old-space-size=14000 tools/desbloqueables_rikka.mjs', 'los desbloqueables de Rikka desde su PSD'],
    ['python -I -X utf8 tools/censura_sprites.py', 'el mosaico de los desbloqueables'],
    ['python -I -X utf8 tools/manos_jugador.py', 'las manos del jugador'],
    ['python -I -X utf8 tools/objetos.py', 'los dibujos de los objetos'],
  ];
  return `<p class="sub">${total} imágenes de <code>public/</code>, leídas desde la carpeta del proyecto (no hace falta el juego encendido). Clic para verla en grande. Para ver los sprites con sus expresiones y ropa dentro del juego: <a href="${JUEGO}/?sprites" target="juego">el probador de sprites</a>.</p>
<input type="search" id="buscar-arte" placeholder="Buscar por nombre: rikka, bar, cassette…" aria-label="Buscar arte">
${grupos
  .filter((g) => g.imgs.length)
  .map(
    (g) =>
      `<details class="arte" open><summary><b>${esc(g.t)}</b> <small>${g.imgs.length}</small></summary><div class="galeria ${g.clase ?? ''}">${g.imgs
        .map((x) => `<a href="${x.url}" target="_blank" data-nombre="${esc(x.nombre.toLowerCase())}" title="${esc(x.nombre)}"><img src="${x.url}" alt="${esc(x.nombre)}" loading="lazy"><span>${esc(x.nombre.replace(/^.*\//, ''))}</span></a>`)
        .join('')}</div></details>`,
  )
  .join('')}
<h3>Herramientas de arte (en la carpeta del proyecto)</h3>
<ul class="comandos">${comandos.map(([c, d]) => `<li><button class="copiar" data-c="${esc(c)}">Copiar</button><code>${esc(c)}</code><small>${esc(d)}</small></li>`).join('')}</ul>`;
}

function tabPruebas() {
  return `<p class="sub">De <code>docs/PRUEBAS_EN_CASA.md</code>. Las ya confirmadas vienen tachadas; lo que marques aquí queda en este navegador (con «Copiar todo», en Notas, se lo pasas a Claude para que lo tache en el archivo).</p>
${pruebas()
  .map((s, i) => {
    const pend = s.items.filter((x) => x.tipo === 'casilla' && !x.hecho).length;
    const items = s.items
      .map((x, j) =>
        x.tipo === 'casilla'
          ? `<label class="casilla ${x.sangria ? 'sub' : ''}"><input type="checkbox" data-k="p${i}-${j}" ${x.hecho ? 'checked disabled' : ''}><span>${md(x.texto)}</span></label>`
          : `<p>${md(x.texto)}</p>`,
      )
      .join('');
    return `<details class="prueba" ${pend ? 'open' : ''}><summary><b>${md(s.titulo)}</b> <span class="etq ${pend ? '' : 'pub'}">${pend ? `${pend} por probar` : 'probado'}</span></summary>${items}<textarea data-k="nota-p${i}" placeholder="Notas de esta sección…" aria-label="Notas de ${esc(s.titulo)}"></textarea></details>`;
  })
  .join('')}`;
}

function tabComandos() {
  const pkg = leer('package.json');
  return `<p class="sub">En la carpeta del proyecto (<code>E:\\PROJECT_GENESIS</code>).</p>
<ul class="comandos">${Object.entries(pkg.scripts)
    .map(([k, v]) => `<li><button class="copiar" data-c="npm run ${esc(k)}">Copiar</button><code>npm run ${esc(k)}</code><small>${esc(v)}</small></li>`)
    .join('')}</ul>`;
}

// ---------- La página ----------
function pagina() {
  const fecha = new Date().toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' });
  const tabs = [
    ['herramientas', 'Herramientas', tabHerramientas()],
    ['capitulos', 'Capítulos', tabCapitulos()],
    ['peleas', 'Peleas', tabPeleas()],
    ['dialogos', 'Diálogos', tabDialogos()],
    ['arte', 'Arte y sprites', tabArte()],
    ['pruebas', 'Pruebas en casa', tabPruebas()],
    [
      'notas',
      'Notas',
      `<p class="sub">Lo que encuentres mientras pruebas o editas. Se guarda solo. <button class="boton" id="copiar-notas">Copiar todo (notas y casillas marcadas)</button></p><textarea id="notas" data-k="notas" placeholder="Por ejemplo: en la pelea del hangar, el capitán…"></textarea>`,
    ],
    ['comandos', 'Comandos', tabComandos()],
  ];

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PROJECT GENESIS · Entornos de prueba</title>
<style>
:root { --fondo: #07070a; --caja: #101016; --caja2: #15151d; --borde: #262630; --texto: #e7e7ee; --tenue: #9a9aa8;
  --verde: #3ddc84; --menta: #7fd6b0; --rosa: #ff6fa5; --azul: #5ea8ff; --oro: #f0b54a; --rojo: #ff4d5e; --gris: #4a4a56; color-scheme: dark; }
* { box-sizing: border-box; }
[hidden] { display: none !important; }
body { margin: 0; background: var(--fondo); color: var(--texto); font: 15px/1.55 Inter, system-ui, sans-serif; }
a { color: var(--azul); }
code { font: 0.8rem Consolas, monospace; color: #c9cbe0; }
header { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem 1.2rem; padding: 0.7rem max(16px, 3vw); background: rgba(7, 7, 10, 0.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--borde); }
header h1 { margin: 0; font-size: 1rem; letter-spacing: 0.12em; }
.pestanas { display: flex; flex-wrap: wrap; gap: 0.3rem; }
.pestanas button, .selector button, .filtros button { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.75rem; border: 1px solid var(--borde); border-radius: 999px; background: var(--caja); color: var(--tenue); font: inherit; font-size: 0.85rem; cursor: pointer; }
.pestanas button:hover { color: var(--texto); }
.pestanas button.activo, .selector button.activo, .filtros button.activo { border-color: var(--texto); color: var(--texto); background: var(--caja2); }
#servidor { margin-left: auto; padding: 0.15rem 0.7rem; border-radius: 999px; background: var(--caja2); font-size: 0.8rem; }
#servidor.si { color: #08140c; background: var(--verde); }
#servidor.no { color: #fff; background: var(--rojo); }
main { max-width: 74rem; margin: 0 auto; padding: 1rem max(16px, 3vw) 5rem; }
.pie { margin: 0 0 1rem; color: var(--tenue); font-size: 0.8rem; }
h2 { margin: 0.4rem 0 0.4rem; font-size: 1.3rem; }
h3 { margin: 1.2rem 0 0.5rem; color: var(--tenue); font-size: 0.78rem; letter-spacing: 0.16em; text-transform: uppercase; }
.sub { margin: 0 0 0.8rem; color: var(--tenue); font-size: 0.88rem; }
.tarjetas { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.6rem; }
.tarjeta, .pelea { display: grid; gap: 0.15rem; padding: 0.7rem 0.85rem; border: 1px solid var(--borde); border-radius: 0.6rem; background: var(--caja); color: var(--texto); text-decoration: none; }
.tarjeta:hover, .pelea:hover { border-color: var(--azul); background: var(--caja2); }
.tarjeta small, .pelea small { color: var(--tenue); font-size: 0.8rem; }
.peleas { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 0.5rem; }
.ajustes { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem 1rem; padding: 0.7rem 0.85rem; border: 1px solid var(--borde); border-radius: 0.6rem; background: var(--caja); }
.ajustes textarea { flex: 1 1 22rem; min-height: 2.4rem; }
textarea, input[type=text], input[type=search] { width: 100%; padding: 0.45rem 0.6rem; border: 1px solid var(--borde); border-radius: 0.45rem; background: #0b0b10; color: var(--texto); font: 0.85rem Consolas, monospace; }
input[type=search] { max-width: 24rem; margin: 0.6rem 0; font-family: Inter, system-ui, sans-serif; }
details { margin-bottom: 0.5rem; border: 1px solid var(--borde); border-radius: 0.6rem; background: var(--caja); }
summary { display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem 0.7rem; padding: 0.6rem 0.85rem; cursor: pointer; }
summary small { color: var(--tenue); }
.etq { padding: 0 0.55rem; border-radius: 999px; background: var(--oro); color: #1a1200; font-size: 0.72rem; font-weight: 600; }
.etq.pub { background: var(--verde); color: #07150d; }
.escenas { margin: 0; padding: 0 0.85rem 0.7rem; list-style: none; }
.escenas li { display: grid; grid-template-columns: auto 9.5rem 12rem minmax(0, 1fr); align-items: baseline; gap: 0.6rem; padding: 0.2rem 0; border-top: 1px solid #1a1a22; font-size: 0.85rem; }
.escenas small { overflow: hidden; color: var(--tenue); text-overflow: ellipsis; white-space: nowrap; }
.tipo { color: var(--rosa); }
.ir { padding: 0 0.55rem; border: 1px solid var(--borde); border-radius: 999px; color: var(--texto); font-size: 0.75rem; text-decoration: none; white-space: nowrap; }
.ir:hover { border-color: var(--texto); background: #1b1b23; }
.saltar { display: flex; gap: 0.5rem; margin-bottom: 0.8rem; }
.saltar input { max-width: 22rem; }
.saltar button, .copiar, .boton { padding: 0.3rem 0.8rem; border: 1px solid var(--borde); border-radius: 999px; background: var(--caja2); color: var(--texto); font: inherit; font-size: 0.8rem; cursor: pointer; }
/* Diálogos (el avance). */
.selector, .filtros { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.4rem 0; }
.selector small, .filtros small { color: var(--tenue); font-variant-numeric: tabular-nums; }
.filtros button i { width: 0.6rem; height: 0.6rem; border-radius: 50%; }
.resumen { margin: 0.6rem 0 0.4rem; font-size: 0.9rem; }
.resumen b { font-size: 1.4rem; font-variant-numeric: tabular-nums; }
.barra { display: flex; height: 0.7rem; overflow: hidden; border-radius: 999px; background: var(--gris); }
.barra i { display: block; height: 100%; }
.lineas { max-width: 56rem; }
.tramo h2 { margin: 1.4rem 0 0.5rem; color: var(--tenue); font-size: 0.75rem; letter-spacing: 0.16em; text-transform: uppercase; }
.linea { margin: 0 0 0.5rem; padding: 0.55rem 0.8rem 0.6rem; border: 1px solid var(--borde); border-left: 3px solid var(--c, var(--gris)); border-radius: 0.5rem; background: var(--caja); }
.linea[data-estado="tuya"] { --c: var(--verde); }
.linea[data-estado="aprobada"] { --c: var(--menta); }
.linea[data-estado="aplicar"] { --c: var(--oro); }
.linea[data-estado="borrador"] { --c: var(--azul); }
.linea[data-estado="pendiente"] { opacity: 0.8; }
.linea header { position: static; display: flex; flex-wrap: wrap; align-items: center; gap: 0.3rem 0.6rem; padding: 0; background: none; backdrop-filter: none; border: 0; font-size: 0.8rem; }
.linea code { color: var(--tenue); font: 0.75rem Consolas, monospace; }
.linea .ir { margin-left: auto; }
.pill { padding: 0 0.5rem; border-radius: 999px; color: #0b0b0e; background: var(--c, var(--gris)); font-size: 0.72rem; font-weight: 600; }
.linea[data-estado="pendiente"] .pill { color: var(--texto); }
.pill.final { background: var(--rojo); color: #fff; }
.linea p { margin: 0.25rem 0 0; }
.viejo { color: var(--tenue); text-decoration: line-through; text-decoration-color: rgba(255, 255, 255, 0.25); font-size: 0.9rem; }
.nuevo::before { content: '→ '; color: var(--c); }
.linea .opciones { margin: 0.35rem 0 0; padding-left: 1.1rem; color: #ff9cc3; font-size: 0.85rem; }
.oculta { display: none !important; }
/* Arte. */
.galeria { display: grid; grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr)); gap: 0.5rem; padding: 0 0.85rem 0.85rem; }
.galeria.alto { grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr)); }
.galeria.ancho { grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); }
.galeria.hoja { grid-template-columns: repeat(auto-fill, minmax(22rem, 1fr)); }
.galeria a { display: grid; gap: 0.25rem; padding: 0.4rem; border: 1px solid var(--borde); border-radius: 0.5rem; background: repeating-conic-gradient(#14141b 0 25%, #0e0e13 0 50%) 0 0 / 16px 16px; color: var(--tenue); text-decoration: none; font-size: 0.72rem; }
.galeria a:hover { border-color: var(--azul); color: var(--texto); }
.galeria img { width: 100%; height: 8rem; object-fit: contain; image-rendering: auto; }
.galeria.alto img { height: 11rem; }
.galeria.ancho img { height: 8.5rem; object-fit: cover; }
.galeria.hoja img { height: 6rem; image-rendering: pixelated; }
.galeria span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Pruebas, notas, comandos. */
.prueba > *:not(summary) { margin-left: 0.85rem; margin-right: 0.85rem; }
.prueba p { margin: 0.2rem 0.85rem; color: var(--tenue); font-size: 0.88rem; }
.casilla { display: flex; gap: 0.55rem; padding: 0.25rem 0; font-size: 0.9rem; }
.casilla.sub { padding-left: 1.4rem; }
.casilla input { margin-top: 0.3rem; accent-color: var(--verde); }
.casilla input:checked + span { color: var(--tenue); text-decoration: line-through; text-decoration-color: rgba(255,255,255,0.3); }
.prueba textarea { display: block; width: calc(100% - 1.7rem); margin-top: 0.4rem; margin-bottom: 0.8rem; min-height: 3rem; font-family: Inter, system-ui, sans-serif; }
#notas { min-height: 20rem; font-family: Inter, system-ui, sans-serif; font-size: 0.9rem; }
.comandos { margin: 0; padding: 0; list-style: none; }
.comandos li { display: grid; grid-template-columns: auto minmax(12rem, auto) minmax(0, 1fr); align-items: baseline; gap: 0.7rem; padding: 0.3rem 0; border-top: 1px solid #1a1a22; }
.comandos small { overflow: hidden; color: var(--tenue); font: 0.75rem Consolas, monospace; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 760px) { .escenas li, .comandos li { grid-template-columns: auto minmax(0, 1fr); } .escenas code, .comandos small { display: none; } }
</style>
</head>
<body>
<header>
  <h1>PROJECT GENESIS · ENTORNOS DE PRUEBA</h1>
  <nav class="pestanas">${tabs.map(([id, t]) => `<button data-tab="${id}">${esc(t)}</button>`).join('')}</nav>
  <span id="servidor">Buscando el juego…</span>
</header>
<main>
  <p class="pie">Versión ${esc(juego.version)} · generado el ${esc(fecha)} con <code>npm run entornos</code>. Los enlaces abren el juego en <code>${JUEGO}</code> (antes: <code>npm run dev</code>). Las casillas y las notas se guardan en este navegador.</p>
  ${tabs.map(([id, t, html]) => `<section id="${id}" data-tab="${id}" hidden><h2>${esc(t)}</h2>${html}</section>`).join('\n')}
</main>
<script>
const CLAVE = 'pg-entornos:';
const guardar = (k, v) => { try { localStorage.setItem(CLAVE + k, v); } catch {} };
const cargar = (k) => { try { return localStorage.getItem(CLAVE + k); } catch { return null; } };
// Las pestañas (la última abierta, o la del #).
const abrir = (id) => {
  if (!document.querySelector('section[data-tab="' + id + '"]')) id = 'herramientas';
  for (const s of document.querySelectorAll('main > section')) s.hidden = s.dataset.tab !== id;
  for (const b of document.querySelectorAll('.pestanas button')) b.classList.toggle('activo', b.dataset.tab === id);
  guardar('pestana', id);
  history.replaceState(null, '', '#' + id);
};
for (const b of document.querySelectorAll('.pestanas button')) b.onclick = () => { abrir(b.dataset.tab); scrollTo(0, 0); };
abrir(location.hash.slice(1) || cargar('pestana') || 'herramientas');
window.onhashchange = () => abrir(location.hash.slice(1));
// Casillas y notas.
for (const c of document.querySelectorAll('input[type=checkbox][data-k]:not([disabled])')) {
  c.checked = cargar(c.dataset.k) === '1';
  c.onchange = () => guardar(c.dataset.k, c.checked ? '1' : '0');
}
for (const t of document.querySelectorAll('textarea[data-k]')) {
  t.value = cargar(t.dataset.k) ?? '';
  t.oninput = () => guardar(t.dataset.k, t.value);
}
// Peleas: las variables y la cuadrícula.
const vars = document.getElementById('vars');
const cuad = document.getElementById('cuadricula');
vars.value = cargar('vars') ?? '';
cuad.checked = cargar('cuadricula') === '1';
const armar = () => {
  let v = vars.value.trim();
  try { if (v) JSON.parse(v); vars.style.borderColor = ''; } catch { vars.style.borderColor = 'var(--rojo)'; v = ''; }
  for (const a of document.querySelectorAll('.pelea')) {
    const q = new URLSearchParams({ batalla: a.dataset.id });
    if (v) q.set('vars', v);
    if (cuad.checked) q.set('cuadricula', '');
    a.href = '${JUEGO}/?' + q;
  }
};
vars.oninput = () => { guardar('vars', vars.value); armar(); };
cuad.onchange = () => { guardar('cuadricula', cuad.checked ? '1' : '0'); armar(); };
armar();
// Ir a cualquier escena.
document.getElementById('saltar').onsubmit = (e) => {
  e.preventDefault();
  const id = document.getElementById('escena').value.trim();
  if (id) window.open('${JUEGO}/?escena=' + encodeURIComponent(id) + '&ir', 'juego');
};
// Diálogos: el capítulo, el filtro y la búsqueda.
const verCap = (cap) => {
  for (const d of document.querySelectorAll('.dialogos')) d.hidden = d.dataset.cap !== cap;
  for (const b of document.querySelectorAll('.selector button')) b.classList.toggle('activo', b.dataset.cap === cap);
  guardar('cap', cap);
};
for (const b of document.querySelectorAll('.selector button')) b.onclick = () => verCap(b.dataset.cap);
if (cargar('cap') && document.querySelector('.dialogos[data-cap="' + cargar('cap') + '"]')) verCap(cargar('cap'));
for (const d of document.querySelectorAll('.dialogos')) {
  let filtro = 'todos';
  const lineas = [...d.querySelectorAll('.linea')];
  const buscar = d.querySelector('.buscar');
  const aplicar = () => {
    const q = buscar.value.trim().toLowerCase();
    for (const l of lineas) l.classList.toggle('oculta', (filtro !== 'todos' && l.dataset.estado !== filtro) || (q && !l.dataset.buscar.includes(q)));
    for (const s of d.querySelectorAll('.tramo')) s.classList.toggle('oculta', !s.querySelector('.linea:not(.oculta)'));
  };
  for (const b of d.querySelectorAll('.filtros button')) b.onclick = () => {
    filtro = b.dataset.f;
    d.querySelectorAll('.filtros button').forEach((x) => x.classList.toggle('activo', x === b));
    aplicar();
  };
  buscar.oninput = aplicar;
}
// Arte: buscar por nombre.
document.getElementById('buscar-arte').oninput = (e) => {
  const q = e.target.value.trim().toLowerCase();
  for (const a of document.querySelectorAll('.galeria a')) a.classList.toggle('oculta', !!q && !a.dataset.nombre.includes(q));
  for (const g of document.querySelectorAll('details.arte')) g.classList.toggle('oculta', !!q && !g.querySelector('.galeria a:not(.oculta)'));
};
// ¿Está prendido el juego?
const estado = document.getElementById('servidor');
const ping = () => fetch('${JUEGO}/', { mode: 'no-cors', cache: 'no-store' })
  .then(() => { estado.textContent = 'Juego encendido'; estado.className = 'si'; })
  .catch(() => { estado.textContent = 'Juego apagado: npm run dev'; estado.className = 'no'; });
ping(); setInterval(ping, 5000);
// Copiar.
const copiar = async (texto, b) => {
  try { await navigator.clipboard.writeText(texto); b.textContent = 'Copiado'; } catch { b.textContent = 'No se pudo copiar'; }
  setTimeout(() => (b.textContent = b.dataset.t), 1500);
};
for (const b of document.querySelectorAll('.copiar')) { b.dataset.t = b.textContent; b.onclick = () => copiar(b.dataset.c, b); }
const bn = document.getElementById('copiar-notas');
bn.dataset.t = bn.textContent;
bn.onclick = () => {
  const partes = ['NOTAS', document.getElementById('notas').value];
  for (const d of document.querySelectorAll('.prueba')) {
    const t = d.querySelector('summary b').textContent;
    const marcadas = [...d.querySelectorAll('input[type=checkbox]:not([disabled]):checked')].map((c) => '  [x] ' + c.nextElementSibling.textContent);
    const nota = d.querySelector('textarea').value.trim();
    if (marcadas.length || nota) partes.push('', '## ' + t, ...marcadas, ...(nota ? ['  Nota: ' + nota] : []));
  }
  copiar(partes.join('\\n'), bn);
};
</script>
</body>
</html>
`;
}

const destino = process.argv[2] ?? carpetaPorDefecto();
mkdirSync(destino, { recursive: true });
const madre = join(destino, 'PROJECT GENESIS - entornos de prueba.html');
writeFileSync(madre, pagina());
// Los avances sueltos de antes ya están dentro de la página: se borran para que no queden copias viejas.
for (const f of readdirSync(destino)) if (/^avance_cap\d+\.html$/.test(f)) rmSync(join(destino, f));
console.log(`✓ ${madre}`);
