// Los sprites desbloqueables de Rikka (escena secreta +18), desde «docs/sprites/desbloqueables rikka mas grande.psd»:
// más alejados (cuerpo entero), en el lienzo de su estatura (1200x1600), con la cabeza en su línea y los pies abajo.
//   node --max-old-space-size=14000 tools/desbloqueables_rikka.mjs
//   python -I tools/igualar_piel.py        (la piel, como los demás sprites)
//   python -I tools/censura_sprites.py     (el mosaico donde van los emblemas)
//
// Todas las capas usan la misma escala y el mismo lugar (así no saltan al cambiar de expresión) y se recorta lo que
// queda fuera del lienzo del PSD (fuera hay restos, como una marca de agua). Los emblemas salen de las capas
// «Badge» de cada grupo (centro y ancho en % del sprite) y se escriben en src/data/emblemas_18.json. La mano de la
// nalgada y las demás manos de Cami (pecho, trasero, la que apunta) salen aparte, recortadas, con su lugar en el sprite.
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import agPsd from 'ag-psd';

sharp.cache(false);
agPsd.initializeCanvas(
  () => { throw new Error('canvas no disponible'); },
  () => { throw new Error('canvas no disponible'); },
  (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
);

const PSD = 'docs/sprites/desbloqueables rikka mas grande.psd';
const W = 1200;
const H = 1600;
// La línea de la cabeza de Rikka (1,60 m) en el lienzo de 1,65 m: como en tools/sprites.mjs.
const LINEA = 64 + (165 - 160) * 15;
// Arriba de la cabeza en el PSD (la de frente, sin el rodete): ahí va su línea.
const CABEZA_PSD = 165;

const NOMBRES = {
  rikka_desbloqueable_vistiendose: 'desbloqueable_vistiendose',
  'rikka_desbloqueable vistiendose_muy avergonzada': 'desbloqueable_vistiendose_muy_avergonzada',
  nikki_frente: 'desbloqueable_frente',
  nikki_frente_asustada: 'desbloqueable_frente_asustada',
  rikka_desbloqueable_despalda: 'desbloqueable_espalda',
  rilkka_desbloqueable_espalda_asustada: 'desbloqueable_espalda_asustada',
  rikka_desbloqueable_espalda_asustada2: 'desbloqueable_espalda_asustada2',
  rika_desbloqueable_espalda_asustada_ulltima_grito: 'desbloqueable_espalda_asustada_ultima_grito',
};

const psd = agPsd.readPsd(readFileSync(PSD), { useImageData: true, skipCompositeImageData: true, skipThumbnail: true });
const f = (H - LINEA) / (psd.height - CABEZA_PSD); // px del PSD -> px del sprite
const dx = (W - psd.width * f) / 2;
const aSprite = (x, y) => [dx + x * f, H - (psd.height - y) * f];
console.log(`PSD ${psd.width}x${psd.height}, escala ${f.toFixed(4)}`);

/** La capa recortada al lienzo del PSD y puesta en el sprite. */
async function exportar(capa, destino) {
  const img = capa.imageData;
  const x0 = Math.max(0, -capa.left), y0 = Math.max(0, -capa.top);
  const x1 = Math.min(img.width, psd.width - capa.left), y1 = Math.min(img.height, psd.height - capa.top);
  const [l, t] = aSprite(capa.left + x0, capa.top + y0);
  const parte = await sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength), { raw: { width: img.width, height: img.height, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 })
    .resize(Math.round((x1 - x0) * f), Math.round((y1 - y0) * f))
    .png()
    .toBuffer();
  const meta = await sharp(parte).metadata();
  const left = Math.round(l), top = Math.round(t);
  // Lo que se salga del sprite (nada, salvo redondeos) se corta.
  const ancho = Math.min(meta.width, W - left), alto = Math.min(meta.height, H - top);
  const pieza = await sharp(parte).extract({ left: 0, top: 0, width: ancho, height: alto }).toBuffer();
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: pieza, left, top }])
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(destino);
  console.log(`✓ ${capa.name} → ${destino}`);
}

/**
 * El emblema de una capa «Badge»: centro y ancho en % del sprite. Los de arriba de la cintura son del pecho
 * (`zona: 'pecho'`: al tocarlos, el pecho rebota de arriba abajo).
 */
function emblema(capa) {
  const [l, t] = aSprite(capa.left, capa.top);
  const [r, b] = aSprite(capa.right, capa.bottom);
  const red = (n) => Math.round(n * 100) / 100;
  const e = { x: red((((l + r) / 2) / W) * 100), y: red((((t + b) / 2) / H) * 100), w: red(((r - l) / W) * 100) };
  return e.y < 60 ? { ...e, zona: 'pecho' } : e;
}

/**
 * Una mano de Cami (capa con fondo blanco): se le quita el blanco que toca el borde (el contorno negro lo frena), se
 * recorta a lo visible, se escala como los sprites y se guarda aparte, con su caja en % del sprite.
 */
async function exportarMano(capa, nombre) {
  const img = capa.imageData;
  const { width: w, height: h } = img;
  const d = new Uint8ClampedArray(img.data);
  // La máscara de capa de Photoshop (solo la mano, sin el brazo): multiplica la opacidad. Fuera de la máscara vale
  // su color por defecto.
  const mk = capa.mask;
  if (mk?.imageData && !mk.disabled) {
    const mw = mk.imageData.width, md = mk.imageData.data;
    const def = mk.defaultColor ?? 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const mx = capa.left + x - mk.left, my = capa.top + y - mk.top;
        const v = mx >= 0 && my >= 0 && mx < mw && my < mk.imageData.height ? md[(my * mw + mx) * 4] : def;
        d[(y * w + x) * 4 + 3] = (d[(y * w + x) * 4 + 3] * v) / 255;
      }
  }
  const fondo = (k) => d[k + 3] < 24 || (d[k] > 225 && d[k + 1] > 225 && d[k + 2] > 225);
  const visto = new Uint8Array(w * h);
  const pila = [];
  for (let x = 0; x < w; x++) pila.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) pila.push(y * w, y * w + w - 1);
  while (pila.length) {
    const i = pila.pop();
    if (visto[i] || !fondo(i * 4)) continue;
    visto[i] = 1;
    d[i * 4 + 3] = 0;
    const x = i % w;
    if (x > 0) pila.push(i - 1);
    if (x < w - 1) pila.push(i + 1);
    if (i >= w) pila.push(i - w);
    if (i < w * (h - 1)) pila.push(i + w);
  }
  // Lo visible que quedó.
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  await sharp(Buffer.from(d.buffer), { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: x0, top: y0, width: cw, height: ch })
    .resize(Math.round(cw * f), Math.round(ch * f))
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(`public/sprites/rikka/manos/${nombre}.webp`);
  const [l, t] = aSprite(capa.left + x0, capa.top + y0);
  const red = (n) => Math.round(n * 100) / 100;
  console.log(`✓ mano ${capa.name} → manos/${nombre}.webp`);
  return { imagen: `sprites/rikka/manos/${nombre}`, x: red((l / W) * 100), y: red((t / H) * 100), w: red(((cw * f) / W) * 100), h: red(((ch * f) / H) * 100) };
}

/** Las hojas (capas sin hijos) de un grupo, con el camino de nombres. */
const hojas = (n, camino = []) => (n.children ?? []).flatMap((c) => (c.children ? hojas(c, [...camino, c.name]) : [{ capa: c, camino }]));

const emblemas = {};
const manos = {};
for (const nodo of psd.children ?? []) {
  if (!nodo.children) continue;
  const badges = nodo.children.filter((c) => /badge/i.test(c.name)).map(emblema);
  const sprites = [];
  for (const capa of nodo.children) {
    const destino = NOMBRES[capa.name];
    if (!destino) continue;
    await exportar(capa, `public/sprites/rikka/${destino}.webp`);
    emblemas[`rikka/${destino}`] = badges;
    sprites.push(`rikka/${destino}`);
  }
  // Las manos del grupo (las ocultas no se usan): pecho (abierta y cerrada, una por pecho), trasero (izquierdo y
  // derecho) y la que apunta (abajo).
  const grupo = nodo.name.replace('rikka_desbloqueable_', '');
  const acciones = [];
  const pechos = new Map();
  for (const { capa, camino } of hojas(nodo)) {
    const ruta = [...camino, capa.name].join('/').toLowerCase();
    // Las sueltas del grupo son el sprite y los emblemas; de ellas solo cuenta la mano que apunta («abajo»).
    if (capa.hidden || (!camino.length && !ruta.includes('abajo'))) continue;
    if (ruta.includes('trasero') || ruta.includes('traserp')) {
      const lado = /izquierd/.test(capa.name) ? 'izq' : 'der';
      acciones.push({ tipo: 'nalgada', lado, mano: await exportarMano(capa, `${grupo}_nalgada_${lado}`) });
    } else if (ruta.includes('pecho')) {
      // Cada pecho es un subgrupo (o el grupo «pecho»): se junta la abierta con la cerrada.
      const clave = camino.join('/');
      const estado = /cerrad/.test(capa.name) ? 'cerrada' : 'abierta';
      const p = pechos.get(clave) ?? {};
      p[estado] = capa;
      pechos.set(clave, p);
    } else if (ruta.includes('abajo')) {
      // Apunta al emblema de abajo (el más cercano a la mano).
      const m = await exportarMano(capa, `${grupo}_apunta`);
      const i = badges.findIndex((b) => !b.zona);
      acciones.push({ tipo: 'apunta', emblema: i, mano: m });
    }
  }
  for (const [clave, p] of pechos) {
    const n = acciones.filter((a) => a.tipo === 'pecho').length;
    const abierta = await exportarMano(p.abierta, `${grupo}_pecho${n}_abierta`);
    const cerrada = await exportarMano(p.cerrada, `${grupo}_pecho${n}_cerrada`);
    // Su pecho: el emblema «pecho» más cerca del centro de la mano.
    const cx = abierta.x + abierta.w / 2, cy = abierta.y + abierta.h / 2;
    let emb = -1, mejor = Infinity;
    badges.forEach((b, i) => { if (b.zona === 'pecho') { const dd = (b.x - cx) ** 2 + (b.y - cy) ** 2; if (dd < mejor) { mejor = dd; emb = i; } } });
    acciones.push({ tipo: 'pecho', emblema: emb, abierta, cerrada, clave });
  }
  // Izquierda y derecha de los pechos, según dónde está su emblema.
  const ps = acciones.filter((a) => a.tipo === 'pecho').sort((a, b) => badges[a.emblema].x - badges[b.emblema].x);
  ps.forEach((a, i) => { a.lado = ps.length === 1 ? 'izq' : i === 0 ? 'izq' : 'der'; delete a.clave; });
  // En los de termas con el pantalón del traje, la nalgada no deja marca (pedido del autor).
  // Dónde está su cara (en % del sprite): el globo de lo que dice sale pegado a la izquierda de su cabeza.
  const CARAS = { vistiendose: { x: 36, y: 26 }, frente: { x: 33, y: 26 }, espalda: { x: 35, y: 26 } };
  manos[grupo] = { sprites, marca: grupo !== 'vistiendose', cara: CARAS[grupo], acciones };
}

const archivo = 'src/data/emblemas_18.json';
const datos = JSON.parse(readFileSync(archivo, 'utf8'));
for (const [k, v] of Object.entries(emblemas)) datos.sprites[k] = v;
delete datos.mano_nalgada;
delete datos.nalgada;
datos.manos = manos;
writeFileSync(archivo, JSON.stringify(datos, null, 2) + '\n');
console.log('emblemas:', JSON.stringify(emblemas));
console.log('manos:', JSON.stringify(manos, null, 1));
