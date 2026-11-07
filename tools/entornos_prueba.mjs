// Los entornos de prueba (pedido del autor, 2026-11-07): una página madre con todo lo que sirve para probar y editar el
// juego en `npm run dev`: herramientas, capítulos y escenas clave (con «▶ Ir»), todas las peleas, la lista de
// docs/PRUEBAS_EN_CASA.md con casillas, notas y los comandos. Va en una carpeta del escritorio, junto con los avances de
// diálogos de cada capítulo.
//
//   npm run entornos                 → <Escritorio>/Entornos de prueba/
//   node tools/entornos_prueba.mjs <carpeta>
//
// Las casillas y las notas se guardan en el navegador (localStorage de ese archivo); los enlaces abren el juego en
// http://localhost:5173 (con `npm run dev` encendido). Rehacer la página después de agregar peleas, escenas o pruebas.
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generarAvance } from './avance_dialogos.mjs';

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
  const texto = (s) => (s.dialogue?.text ?? '').slice(0, 90);
  c.scenes.forEach((s, i) => {
    let tipo = null;
    if (i === 0) tipo = 'Inicio';
    else if (s.batalla) tipo = `Pelea: ${s.batalla}`;
    else if (s.ending) tipo = `Final: ${s.ending}`;
    else if (s.fin_capitulo) tipo = 'Fin del capítulo';
    else if (s.secreto) tipo = 'Secreta';
    if (tipo) out.push({ id: s.scene_id, tipo, texto: texto(s) });
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

// ---------- La página ----------
function pagina() {
  const fecha = new Date().toLocaleString('es-EC', { dateStyle: 'long', timeStyle: 'short' });
  const ir = (id) => `${JUEGO}/?escena=${encodeURIComponent(id)}&amp;ir`;

  const herramientas = [
    ['Avance de diálogos, al día', `${JUEGO}/__avance`, 'Cada línea con su estado; «▶ Ir» abre el juego en esa línea.'],
    ...capitulos.map((c) => [`Avance de diálogos del Capítulo ${c.chapter} (copia)`, `avance_${c.archivo}.html`, 'La foto de cuando se generó esta carpeta.']),
    ['El juego', `${JUEGO}/`, 'El menú de inicio, como lo ve el jugador (con todo prendido en desarrollo).'],
    ['Galería completa', `${JUEGO}/?galeria=todo`, 'Todas las imágenes y finales, sin desbloquear nada de verdad.'],
    ['Juego completo (100 %)', `${JUEGO}/?juego=completo`, 'Como si ya se hubiera terminado al 100 %: abre las escenas secretas.'],
    ['Probador de sprites', `${JUEGO}/?sprites`, 'Los sprites de la novela con sus expresiones y ropa.'],
    ['Bootcamp con todo abierto', `${JUEGO}/?bootcamp=todo`, 'Los cinco niveles del Bootcamp Genesis.'],
    ['Bastión: directo al jefe', `${JUEGO}/?nivel=jefe`, 'El nivel del Bastión empezando en el jefe.'],
    ['Demo de batalla', `${JUEGO}/?batalla=demo`, 'La pelea de prueba.'],
  ];

  const caps = capitulos
    .map((c) => {
      const filas = escenasClave(c)
        .map((x) => `<li><a class="ir" href="${ir(x.id)}" target="juego">▶ Ir</a><span class="tipo">${esc(x.tipo)}</span><code>${esc(x.id)}</code><small>${esc(x.texto)}</small></li>`)
        .join('');
      const publicado = c.chapter <= (juego.demo_publica?.capitulo_maximo ?? 0);
      return `<details class="cap" open><summary><b>Capítulo ${c.chapter}: ${esc(c.title)}</b> <span class="etq ${publicado ? 'pub' : ''}">${publicado ? 'en la demo' : 'solo en desarrollo'}</span> <small>${c.scenes.length} escenas</small> <a href="${JUEGO}/cap${c.chapter}" target="juego">«Nueva partida» desde aquí</a></summary><ul class="escenas">${filas}</ul></details>`;
    })
    .join('');

  const grupos = {};
  for (const b of batallas) (grupos[grupoDePelea(b.id)] ??= []).push(b);
  const peleas = Object.entries(grupos)
    .map(
      ([g, bs]) =>
        `<h3>${esc(g)}</h3><div class="peleas">${bs
          .map((b) => `<a class="pelea" data-id="${esc(b.id)}" href="${JUEGO}/?batalla=${encodeURIComponent(b.id)}" target="juego"><b>${esc(b.titulo ?? b.id)}</b><code>${esc(b.id)}</code><small>${esc((b.heroes ?? []).join(' + '))}${b.enemigos ? ` contra ${esc([...new Set(b.enemigos)].join(', '))}` : ''}</small></a>`)
          .join('')}</div>`,
    )
    .join('');

  const lista = pruebas()
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
    .join('');

  const pkg = leer('package.json');
  const comandos = Object.entries(pkg.scripts)
    .map(([k, v]) => `<li><button class="copiar" data-c="npm run ${esc(k)}">Copiar</button><code>npm run ${esc(k)}</code><small>${esc(v)}</small></li>`)
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PROJECT GENESIS · Entornos de prueba</title>
<style>
:root { --fondo: #07070a; --caja: #101016; --caja2: #15151d; --borde: #262630; --texto: #e7e7ee; --tenue: #9a9aa8;
  --verde: #3ddc84; --rosa: #ff6fa5; --azul: #5ea8ff; --oro: #f0b54a; --rojo: #ff4d5e; color-scheme: dark; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--fondo); color: var(--texto); font: 15px/1.55 Inter, system-ui, sans-serif; }
a { color: var(--azul); }
code { font: 0.8rem Consolas, monospace; color: #c9cbe0; }
header { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem 1.4rem; padding: 0.8rem max(16px, 3vw); background: rgba(7, 7, 10, 0.94); backdrop-filter: blur(8px); border-bottom: 1px solid var(--borde); }
header h1 { margin: 0; font-size: 1.05rem; letter-spacing: 0.12em; }
header nav { display: flex; flex-wrap: wrap; gap: 0.3rem 0.9rem; font-size: 0.85rem; }
header nav a { color: var(--tenue); text-decoration: none; }
header nav a:hover { color: var(--texto); }
#servidor { margin-left: auto; padding: 0.15rem 0.7rem; border-radius: 999px; background: var(--caja2); font-size: 0.8rem; }
#servidor.si { color: #08140c; background: var(--verde); }
#servidor.no { color: #fff; background: var(--rojo); }
main { max-width: 72rem; margin: 0 auto; padding: 1rem max(16px, 3vw) 5rem; }
section { margin-top: 2.2rem; }
h2 { margin: 0 0 0.4rem; font-size: 1.3rem; }
h3 { margin: 1.2rem 0 0.5rem; color: var(--tenue); font-size: 0.78rem; letter-spacing: 0.16em; text-transform: uppercase; }
.sub { margin: 0 0 0.8rem; color: var(--tenue); font-size: 0.88rem; }
.tarjetas { display: grid; grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr)); gap: 0.6rem; }
.tarjeta, .pelea { display: grid; gap: 0.15rem; padding: 0.7rem 0.85rem; border: 1px solid var(--borde); border-radius: 0.6rem; background: var(--caja); color: var(--texto); text-decoration: none; }
.tarjeta:hover, .pelea:hover { border-color: var(--azul); background: var(--caja2); }
.tarjeta small, .pelea small { color: var(--tenue); font-size: 0.8rem; }
.peleas { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 0.5rem; }
.opciones { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem 1rem; padding: 0.7rem 0.85rem; border: 1px solid var(--borde); border-radius: 0.6rem; background: var(--caja); }
.opciones textarea { flex: 1 1 22rem; min-height: 2.4rem; }
textarea, input[type=text] { width: 100%; padding: 0.45rem 0.6rem; border: 1px solid var(--borde); border-radius: 0.45rem; background: #0b0b10; color: var(--texto); font: 0.85rem Consolas, monospace; }
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
.ir:hover { border-color: var(--texto); }
.saltar { display: flex; gap: 0.5rem; margin-bottom: 0.8rem; }
.saltar input { max-width: 22rem; }
.saltar button, .copiar, .boton { padding: 0.3rem 0.8rem; border: 1px solid var(--borde); border-radius: 999px; background: var(--caja2); color: var(--texto); font: inherit; font-size: 0.8rem; cursor: pointer; }
.prueba > *:not(summary) { margin-left: 0.85rem; margin-right: 0.85rem; }
.prueba p { margin: 0.2rem 0.85rem; color: var(--tenue); font-size: 0.88rem; }
.casilla { display: flex; gap: 0.55rem; padding: 0.25rem 0; font-size: 0.9rem; }
.casilla.sub { padding-left: 1.4rem; }
.casilla input { margin-top: 0.3rem; accent-color: var(--verde); }
.casilla input:checked + span { color: var(--tenue); text-decoration: line-through; text-decoration-color: rgba(255,255,255,0.3); }
.prueba textarea { display: block; width: calc(100% - 1.7rem); margin-top: 0.4rem; margin-bottom: 0.8rem; min-height: 3rem; font-family: Inter, system-ui, sans-serif; }
#notas { min-height: 14rem; font-family: Inter, system-ui, sans-serif; font-size: 0.9rem; }
.comandos { margin: 0; padding: 0; list-style: none; }
.comandos li { display: grid; grid-template-columns: auto 14rem minmax(0, 1fr); align-items: baseline; gap: 0.7rem; padding: 0.3rem 0; border-top: 1px solid #1a1a22; }
.comandos small { overflow: hidden; color: var(--tenue); font: 0.75rem Consolas, monospace; text-overflow: ellipsis; white-space: nowrap; }
@media (max-width: 760px) { .escenas li, .comandos li { grid-template-columns: auto minmax(0, 1fr); } .escenas code, .comandos small { display: none; } }
</style>
</head>
<body>
<header>
  <h1>PROJECT GENESIS · ENTORNOS DE PRUEBA</h1>
  <nav><a href="#herramientas">Herramientas</a><a href="#capitulos">Capítulos</a><a href="#peleas">Peleas</a><a href="#pruebas">Pruebas en casa</a><a href="#notas-sec">Notas</a><a href="#comandos">Comandos</a></nav>
  <span id="servidor">Buscando el juego…</span>
</header>
<main>
  <p class="sub">Versión ${esc(juego.version)} · generado el ${esc(fecha)} con <code>npm run entornos</code>. Los enlaces abren el juego en <code>${JUEGO}</code>: antes, <code>npm run dev</code> en la carpeta del proyecto. Las casillas y las notas se guardan en este navegador.</p>

  <section id="herramientas"><h2>Herramientas</h2>
    <div class="tarjetas">${herramientas.map(([t, u, d]) => `<a class="tarjeta" href="${u}" target="${u.startsWith('http') ? 'juego' : '_blank'}"><b>${esc(t)}</b><small>${esc(d)}</small></a>`).join('')}</div>
  </section>

  <section id="capitulos"><h2>Capítulos y escenas clave</h2>
    <p class="sub">«▶ Ir» abre el juego justo en esa escena, como una partida nueva desde ahí (las variables de antes no están).</p>
    <form class="saltar" id="saltar"><input type="text" id="escena" placeholder="Cualquier escena: cap01_047, cap02_p2_020…" aria-label="Escena"><button type="submit">▶ Ir a la escena</button></form>
    ${caps}
  </section>

  <section id="peleas"><h2>Peleas</h2>
    <div class="opciones">
      <label><input type="checkbox" id="cuadricula"> Con la cuadrícula</label>
      <textarea id="vars" spellcheck="false" placeholder='Variables de una partida (opcional), en JSON: {"nivel_jair":6,"nivel_cami":15}' aria-label="Variables"></textarea>
    </div>
    ${peleas}
  </section>

  <section id="pruebas"><h2>Pruebas en casa</h2>
    <p class="sub">De <code>docs/PRUEBAS_EN_CASA.md</code>. Las ya confirmadas vienen tachadas; lo que marques aquí queda en este navegador (pásaselo a Claude para que lo tache en el archivo).</p>
    ${lista}
  </section>

  <section id="notas-sec"><h2>Notas</h2>
    <p class="sub">Lo que encuentres mientras pruebas o editas. Se guarda solo. <button class="boton" id="copiar-notas">Copiar todo (notas y casillas marcadas)</button></p>
    <textarea id="notas" data-k="notas" placeholder="Por ejemplo: en la pelea del hangar, el capitán…"></textarea>
  </section>

  <section id="comandos"><h2>Comandos</h2>
    <p class="sub">En la carpeta del proyecto (<code>E:\\PROJECT_GENESIS</code>).</p>
    <ul class="comandos">${comandos}</ul>
  </section>
</main>
<script>
const CLAVE = 'pg-entornos:';
const guardar = (k, v) => { try { localStorage.setItem(CLAVE + k, v); } catch {} };
const cargar = (k) => { try { return localStorage.getItem(CLAVE + k); } catch { return null; } };
for (const c of document.querySelectorAll('input[type=checkbox][data-k]:not([disabled])')) {
  c.checked = cargar(c.dataset.k) === '1';
  c.onchange = () => guardar(c.dataset.k, c.checked ? '1' : '0');
}
for (const t of document.querySelectorAll('textarea[data-k]')) {
  t.value = cargar(t.dataset.k) ?? '';
  t.oninput = () => guardar(t.dataset.k, t.value);
}
// Las peleas, con las variables y la cuadrícula.
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
for (const c of capitulos) writeFileSync(join(destino, `avance_${c.archivo}.html`), generarAvance(RAIZ, c.archivo, JUEGO));
console.log(`✓ ${madre}`);
console.log(`✓ ${capitulos.length} avances de diálogos en la misma carpeta`);
