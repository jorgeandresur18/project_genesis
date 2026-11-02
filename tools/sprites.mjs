// Prepara los sprites del juego: public/sprites/<personaje>/<expresion>.webp.
//   npm run sprites           (solo vuelve a leer los PSD/PSB que cambiaron)
//   npm run sprites -- --todo (los lee todos)
//
// Escala común: 15 px por cm y el mismo corte inferior para todos. Cada personaje sale en su propio lienzo
// según su estatura (src/data/estaturas.json): 1200x1600 hasta 1,65 m; los más altos (enemigos), más alto.
//
// Dos fuentes, en este orden:
// 1) PSD y PSB (docs/sprites/*.psd, *.psb; un PSB por personaje y la plantilla de enemigos):
//    un grupo por personaje con una capa por expresión, acomodadas a mano sobre la plantilla. Un PSD con «enemigo» en el nombre usa la plantilla alta de los enemigos. Cada capa se
//    exporta tal cual está, recortando el lienzo de su estatura desde el borde de abajo.
// 2) PNG sueltos (docs/sprites/<PERSONAJE>/*.png) de las expresiones que no estén en un PSD: se recortan y se
//    escalan automáticamente para que la cabeza quede en su línea de estatura y el cuerpo toque abajo.
import { createHash } from 'node:crypto';
import { closeSync, copyFileSync, existsSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import agPsd from 'ag-psd';

sharp.cache(false); // Windows: que no quede abierto un archivo que después se reemplaza.

const SOURCE = 'docs/sprites';
const TARGET = 'public/sprites';
const config = JSON.parse(readFileSync('tools/sprites.config.json', 'utf8'));
const estaturas = JSON.parse(readFileSync('src/data/estaturas.json', 'utf8'));
const BASE_CM = 165;
const PX_PER_CM = 15;
const HEAD_MARGIN = 64;
const canvasH = (cm) => 1600 + Math.max(0, cm - BASE_CM) * PX_PER_CM;
const canvasW = (cm) => Math.round(canvasH(cm) * 0.75);
const headLine = (cm) => HEAD_MARGIN + Math.max(0, BASE_CM - cm) * PX_PER_CM;
const statureOf = (character, expr) =>
  estaturas.expresiones[`${character}/${expr}`] ?? estaturas.personajes[character] ?? BASE_CM;
// Alto lógico de cada plantilla: la de personajes y la de enemigos (lienzo del más alto).
const TEMPLATE_PERSONAJES = 1600;
const TEMPLATE_ENEMIGOS = canvasH(Math.max(...Object.values(estaturas.personajes), ...Object.values(estaturas.expresiones)));
const ALPHA = 24; // Píxeles con menos opacidad que esto cuentan como fondo.
const TOLERANCE = 15; // 1 cm: más que esto respecto a la línea de estatura se avisa.

// ag-psd necesita crear imágenes; en Node basta con un búfer RGBA.
agPsd.initializeCanvas(
  () => { throw new Error('canvas no disponible'); },
  () => { throw new Error('canvas no disponible'); },
  (width, height) => ({ width, height, data: new Uint8ClampedArray(width * height * 4) }),
);

/** "nikki_ebria1", "niki_celosa1", "nicole_x", "nikki-base" -> "ebria1", "celosa1", "x", "base". */
function expressionName(name, character) {
  const clean = name.replace(/\.png$/i, '').replace(/\s+copia(\s+\d+)?$/i, '').trim().toLowerCase();
  const m = clean.match(/^([a-z]+)[_-](.+)$/);
  const prefixes = config.personajes[character]?.prefijos ?? [];
  if (clean === character || prefixes.includes(clean)) return 'base'; // «nail» -> nail/base
  const expr = m && (m[1].slice(0, 3) === character.slice(0, 3) || prefixes.includes(m[1])) ? m[2] : clean;
  return config.personajes[character]?.renombrar?.[expr] ?? expr;
}

/** Lee un archivo entero, también los de más de 2 GB (readFileSync no puede con los PSB grandes). */
function readLarge(path) {
  const fd = openSync(path, 'r');
  const size = fstatSync(fd).size;
  const buf = Buffer.allocUnsafe(size);
  for (let off = 0; off < size; ) off += readSync(fd, buf, off, Math.min(1 << 30, size - off), off);
  closeSync(fd);
  return buf;
}

/** Nombre de grupo o carpeta -> personaje (acepta nombres anteriores, p. ej. «jorge» -> jair). */
function resolveCharacter(name) {
  const lower = name.trim().toLowerCase();
  if (config.personajes[lower] || estaturas.personajes[lower]) return lower;
  return Object.keys(config.personajes).find((k) => config.personajes[k].prefijos?.includes(lower)) ?? lower;
}

/** Capa suelta (sin grupo) -> personaje y expresión: «soldado» -> soldado_enmascarado/base, «sombra_armored» -> monstruo_sombras/armored. */
function looseLayer(name) {
  const clean = name.replace(/\s+copia(\s+\d+)?$/i, '').trim().toLowerCase();
  const whole = resolveCharacter(clean);
  if (estaturas.personajes[whole]) return { character: whole, expr: 'base' };
  const m = clean.match(/^([a-z]+)[_-](.+)$/);
  const character = m && resolveCharacter(m[1]);
  return character && estaturas.personajes[character] ? { character, expr: m[2] } : null;
}

/** Capas sin nombre propio («Capa 2 copia 12», «Rectángulo 1»): guías o restos, no son sprites. */
const isGenericLayer = (name) => /^(capa|layer|rect[aá]ngulo|fondo|background)\b/i.test(name.trim());

/** Caja de lo visible en un búfer RGBA. */
function visibleBox(data, width, height) {
  let top = height, bottom = -1, left = width, right = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > ALPHA) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  return bottom < 0 ? null : { top, bottom, left, right };
}

function headWarning(headY, cm) {
  const want = headLine(cm);
  if (Math.abs(headY - want) <= TOLERANCE) return null;
  const diff = ((want - headY) / PX_PER_CM).toFixed(1);
  return `la cabeza quedó en y=${headY} y su línea es y=${want} (se ve ${diff > 0 ? `${diff} cm más alto` : `${-diff} cm más bajo`}); si es pelo o un adorno que sobresale, ignóralo`;
}

const results = { ok: 0, failed: 0, aliases: [], aligned: [] };
const generated = new Set(); // Rutas escritas desde una imagen real en esta corrida.
// Sprites con otro encuadre («recortado» en la config): no se alinean con su base.
const noAlign = new Set(
  Object.entries(config.personajes).flatMap(([c, v]) => Object.values(v.recortado ?? {}).map((e) => join(TARGET, c, `${e}.webp`))),
);

// Leer un PSB de 1 GB tarda: si un archivo no cambió (misma fecha y tamaño) y esta herramienta, su
// configuración y las estaturas tampoco, se reutilizan los sprites que ya sacó la vez anterior.
const CACHE = 'node_modules/.cache/genesis-sprites.json';
const cacheKey = createHash('sha1')
  .update(readFileSync('tools/sprites.mjs'))
  .update(readFileSync('tools/sprites.config.json'))
  .update(readFileSync('src/data/estaturas.json'))
  .digest('hex');
let cache = { key: cacheKey, files: {} };
try {
  const old = JSON.parse(readFileSync(CACHE, 'utf8'));
  if (old.key === cacheKey && !process.argv.includes('--todo')) cache = old;
} catch {
  // Sin caché: se lee todo.
}

// ---------- 1) PSD ----------
// Si hay dos versiones del mismo archivo («rikka_1200x1600.psb» y «rikka_1200x1600-Recuperado.psb»), manda la
// más reciente; la otra se ignora.
const versionKey = (f) => f.toLowerCase().replace(/[-_ ]*recuperado|\s+copia(\s+\d+)?(?=\.ps[db]$)/g, '');
const newest = new Map();
for (const f of readdirSync(SOURCE).filter((f) => /\.ps[db]$/i.test(f))) {
  const prev = newest.get(versionKey(f));
  if (!prev || statSync(join(SOURCE, f)).mtimeMs > statSync(join(SOURCE, prev)).mtimeMs) newest.set(versionKey(f), f);
}
for (const f of readdirSync(SOURCE).filter((f) => /\.ps[db]$/i.test(f) && newest.get(versionKey(f)) !== f)) {
  console.log(`· ${f}: hay una versión más reciente (${newest.get(versionKey(f))}); se ignora`);
}
const layered = [...newest.values()].sort().map((f) => join(SOURCE, f));
for (const file of layered) {
  const { mtimeMs, size } = statSync(file);
  const prev = cache.files[file];
  if (prev && prev.mtimeMs === mtimeMs && prev.size === size && prev.outputs.every((f) => existsSync(f))) {
    for (const f of prev.outputs) generated.add(f);
    results.ok += prev.outputs.length;
    console.log(`Sin cambios: ${file} (${prev.outputs.length} sprites)`);
    continue;
  }
  console.log(`Leyendo ${file}...`);
  const before = new Set(generated);
  const failedBefore = results.failed;
  const psd = agPsd.readPsd(readLarge(file), { useImageData: true, skipCompositeImageData: true, skipThumbnail: true });
  const template = /enemigo/i.test(file) ? TEMPLATE_ENEMIGOS : TEMPLATE_PERSONAJES;
  const k = psd.height / template; // px del PSD por px del sprite
  if (Math.abs(psd.width / psd.height - 0.75) > 0.01) console.log(`  ! el lienzo del PSD (${psd.width}x${psd.height}) no es 3:4`);
  // Un grupo por personaje con una capa por expresión, o capas sueltas con el nombre del personaje (p. ej. los enemigos).
  const entries = [];
  for (const node of psd.children ?? []) {
    if (node.children) {
      const character = resolveCharacter(node.name);
      for (const layer of node.children) {
        // Grupo dentro del grupo: otros personajes guardados en el mismo PSB. Si el grupo se llama como un
        // personaje («mike»), sus capas son expresiones de ese personaje; si no («varios»), cada capa es un
        // personaje suelto («vendedor» -> vendedor/base).
        if (layer.children) {
          // Los grupos «desbloqueable» (escena secreta +18) nunca salen por aquí: tienen las capas sin censura y se
          // exportan aparte, con la censura aplicada sobre la imagen.
          if (/desbloqueable/i.test(layer.name)) {
            console.log(`  · ${node.name}/${layer.name}: grupo desbloqueable, se omite`);
            continue;
          }
          const inner = resolveCharacter(layer.name);
          for (const sub of layer.children) {
            if (sub.children || isGenericLayer(sub.name)) continue;
            const label = `${node.name}/${layer.name}/${sub.name}`;
            if (estaturas.personajes[inner]) entries.push({ character: inner, label, layer: sub, expr: expressionName(sub.name, inner) });
            else {
              const loose = looseLayer(sub.name);
              if (loose) entries.push({ ...loose, label, layer: sub });
              else console.log(`  · ${label}: no corresponde a ningún personaje de src/data/estaturas.json, se omite`);
            }
          }
          continue;
        }
        if (isGenericLayer(layer.name)) console.log(`  · ${node.name}/${layer.name}: capa sin nombre de expresión, se omite`);
        else entries.push({ character, label: `${node.name}/${layer.name}`, layer, expr: expressionName(layer.name, character) });
      }
    } else if (!isGenericLayer(node.name)) {
      const loose = looseLayer(node.name);
      if (loose) entries.push({ ...loose, label: node.name, layer: node });
      else console.log(`  · ${node.name}: no corresponde a ningún personaje de src/data/estaturas.json, se omite`);
    }
  }
  for (const { character, label, layer, expr } of entries) {
    mkdirSync(join(TARGET, character), { recursive: true });
    {
      const img = layer.imageData;
      if (!img) continue;
      // «completo» en la config: la capa entera, aunque se salga del lienzo (p. ej. un cuerpo entero), escalada
      // como un PNG suelto para que la cabeza quede en su línea y los pies abajo.
      if (config.personajes[character]?.completo?.includes(expr)) {
        const whole = await sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength), {
          raw: { width: img.width, height: img.height, channels: 4 },
        }).png().toBuffer();
        const dest = join(TARGET, character, `${expr}.webp`);
        const r = await normalizePng(whole, statureOf(character, expr));
        if (r.error) {
          console.log(`✗ ${label}: ${r.error}`);
          results.failed++;
          continue;
        }
        const info = await r.out.toFile(dest);
        generated.add(dest);
        console.log(`✓ ${label} → ${dest} (completo, ${Math.round(info.size / 1024)} KB)`);
        results.ok++;
        // «recortado»: además, la misma capa cortada abajo por el lienzo, como se ve en el PSD (p. ej. hasta
        // la cintura), pero sin cortar los costados: el lienzo se ensancha lo que haga falta, igual a cada lado
        // para que el personaje siga centrado. En escena se dibuja a la misma altura que los demás, más ancho.
        const cropped = config.personajes[character]?.recortado?.[expr];
        if (cropped) {
          const k = psd.height / template;
          const pad = Math.max(0, -layer.left, layer.left + img.width - psd.width);
          const W = Math.round((psd.width + 2 * pad) / k);
          const H = canvasH(statureOf(character, cropped));
          const rows = Math.min(img.height, psd.height - layer.top);
          const part = await sharp(whole)
            .extract({ left: 0, top: 0, width: img.width, height: rows })
            .resize(Math.round(img.width / k), Math.round(rows / k))
            .toBuffer();
          const cdest = join(TARGET, character, `${cropped}.webp`);
          await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
            .composite([{ input: part, left: Math.round((layer.left + pad) / k), top: Math.round(layer.top / k) }])
            .webp({ quality: 90, alphaQuality: 100 })
            .toFile(cdest);
          generated.add(cdest);
          noAlign.add(cdest);
          console.log(`✓ ${label} → ${cdest} (recortado, ${W}x${H})`);
          results.ok++;
        }
        layer.imageData = null;
        continue;
      }
      // «ajustar» en la config: el personaje se dibujó de otro tamaño (p. ej. más alto que el lienzo). La capa
      // se escala desde el borde de abajo hasta que la cabeza llegue a su línea de estatura; el corte de abajo
      // queda donde estaba en el PSD. Así un personaje más alto que 1,65 m no se corta arriba.
      if (config.personajes[character]?.ajustar) {
        const vb = visibleBox(img.data, img.width, img.height);
        const cm = statureOf(character, expr);
        const W = canvasW(cm);
        const H = canvasH(cm);
        const s = ((H - headLine(cm)) * k) / (psd.height - (layer.top + vb.top)); // escala en el PSD
        const f = s / k; // px de la capa -> px del sprite
        const sw = Math.round(img.width * f);
        const sh = Math.round(img.height * f);
        const lx = Math.round((psd.width / 2 + (layer.left - psd.width / 2) * s) / k + (W - psd.width / k) / 2);
        const ly = Math.round(H - ((psd.height - layer.top) * s) / k);
        const x0 = Math.max(0, -lx), y0 = Math.max(0, -ly);
        const part = await sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength), {
          raw: { width: img.width, height: img.height, channels: 4 },
        })
          .resize(sw, sh)
          .extract({ left: x0, top: y0, width: Math.min(sw, W - lx) - x0, height: Math.min(sh, H - ly) - y0 })
          .png()
          .toBuffer();
        layer.imageData = null;
        const dest = join(TARGET, character, `${expr}.webp`);
        const info = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
          .composite([{ input: part, left: lx + x0, top: ly + y0 }])
          .webp({ quality: 90, alphaQuality: 100 })
          .toFile(dest);
        generated.add(dest);
        console.log(`✓ ${label} → ${dest} (ajustado a ${cm} cm, ${W}x${H}, ${Math.round(info.size / 1024)} KB)`);
        results.ok++;
        continue;
      }
      // Copia la capa a un lienzo del tamaño del PSD, recortando lo que se sale.
      const canvas = new Uint8ClampedArray(psd.width * psd.height * 4);
      for (let y = 0; y < img.height; y++) {
        const cy = layer.top + y;
        if (cy < 0 || cy >= psd.height) continue;
        const x0 = Math.max(0, -layer.left);
        const x1 = Math.min(img.width, psd.width - layer.left);
        if (x1 <= x0) continue;
        canvas.set(img.data.subarray((y * img.width + x0) * 4, (y * img.width + x1) * 4), (cy * psd.width + layer.left + x0) * 4);
      }
      layer.imageData = null;
      const box = visibleBox(canvas, psd.width, psd.height);
      if (!box) {
        console.log(`✗ ${label}: la capa está vacía`);
        results.failed++;
        continue;
      }
      // Lienzo de su estatura, recortado desde el borde de abajo y centrado.
      const cm = statureOf(character, expr);
      const W = canvasW(cm);
      const H = canvasH(cm);
      if (H > template) console.log(`    ! mide ${cm} cm y no entra en esta plantilla: va en el PSD de enemigos`);
      const regionH = Math.min(psd.height, Math.round(H * k));
      const regionW = Math.min(psd.width, Math.round(W * k));
      const region = { left: Math.round((psd.width - regionW) / 2), top: psd.height - regionH, width: regionW, height: regionH };
      const dest = join(TARGET, character, `${expr}.webp`);
      const info = await sharp(Buffer.from(canvas.buffer), { raw: { width: psd.width, height: psd.height, channels: 4 } })
        .extract(region)
        .resize(W, H)
        .webp({ quality: 90, alphaQuality: 100 })
        .toFile(dest);
      generated.add(dest);
      console.log(`✓ ${label} → ${dest} (${W}x${H}, ${Math.round(info.size / 1024)} KB)`);
      if (box.left < region.left || box.right >= region.left + region.width) console.log('    ! se sale por los costados de su lienzo; se recortó');
      const warn = headWarning(Math.round((box.top - region.top) / k), cm);
      if (warn) console.log(`    ! ${warn}`);
      if (box.bottom < psd.height - 3) console.log('    ! el cuerpo no llega al borde de abajo');
      results.ok++;
    }
  }
  if (results.failed === failedBefore) cache.files[file] = { mtimeMs, size, outputs: [...generated].filter((f) => !before.has(f)) };
  else delete cache.files[file];
}
mkdirSync('node_modules/.cache', { recursive: true });
writeFileSync(CACHE, JSON.stringify(cache, null, 2));

// ---------- 2) PNG sueltos ----------
async function normalizePng(input, cm) {
  const W = canvasW(cm);
  const H = canvasH(cm);
  const headY = headLine(cm);
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const a = (x, y) => data[(y * width + x) * 4 + 3];
  if ([a(0, 0), a(width - 1, 0), a(0, height - 1), a(width - 1, height - 1)].some((v) => v > ALPHA)) {
    return { error: 'no tiene fondo transparente' };
  }
  const box = visibleBox(data, width, height);
  if (!box) return { error: 'la imagen está vacía' };
  const warnings = [];
  if (box.bottom < height - 3) warnings.push('el cuerpo no llega al borde de abajo: revisa que el encuadre sea el mismo (cabeza a medio muslo)');
  const boxW = box.right - box.left + 1;
  const boxH = box.bottom - box.top + 1;
  const scale = (H - headY) / boxH;
  let w = Math.round(boxW * scale);
  let crop = { left: box.left, top: box.top, width: boxW, height: boxH };
  if (w > W) {
    warnings.push('es más ancho que el lienzo; se recortaron los costados');
    const keep = Math.floor(W / scale);
    crop = { left: box.left + Math.floor((boxW - keep) / 2), top: box.top, width: keep, height: boxH };
    w = W;
  }
  const body = await sharp(input).extract(crop).resize(w, H - headY, { fit: 'fill' }).toBuffer();
  const out = sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: body, left: Math.round((W - w) / 2), top: headY }])
    .webp({ quality: 90, alphaQuality: 100 });
  return { out, warnings };
}

for (const folder of readdirSync(SOURCE)) {
  const dir = join(SOURCE, folder);
  if (!statSync(dir).isDirectory()) continue;
  const character = resolveCharacter(folder);
  if (!estaturas.personajes[character]) {
    console.log(`! ${folder}: personaje sin estatura en src/data/estaturas.json; se omite`);
    continue;
  }
  mkdirSync(join(TARGET, character), { recursive: true });
  for (const file of readdirSync(dir).filter((f) => /\.png$/i.test(f)).sort()) {
    const expr = expressionName(file, character);
    const dest = join(TARGET, character, `${expr}.webp`);
    if (generated.has(dest)) continue; // Si la expresión está en el PSD, manda el PSD.
    const r = await normalizePng(join(dir, file), statureOf(character, expr));
    if (r.error) {
      console.log(`✗ ${folder}/${file}: ${r.error}`);
      results.failed++;
      continue;
    }
    const info = await r.out.toFile(dest);
    generated.add(dest);
    console.log(`✓ ${folder}/${file} → ${dest} (${Math.round(info.size / 1024)} KB)`);
    for (const w of r.warnings) console.log(`    ! ${w}`);
    results.ok++;
  }
}

// ---------- 2b) Alinear expresiones ----------
// Si una expresión quedó corrida respecto de la base de su ropa, al cambiar de pose se ve un «fantasma»
// (la anterior asoma detrás de la nueva). Se alinean por la cabeza: centro horizontal y tope de la franja
// de la cabeza. Referencia: `<ropa>_volteada` para las volteadas, `<ropa>_base` para el resto de esa ropa
// y `base` para lo demás. Se saltan las poses distintas (cabeza más ancha, p. ej. inclinada) y los
// corrimientos grandes, que suelen ser a propósito. Solo se baja la imagen, nunca se sube: subirla dejaría
// un hueco abajo, donde el cuerpo toca el borde.
const ALIGN_MAX = 40; // px de corrimiento máximo que se corrige
const ALIGN_SAME_POSE = 0.08; // diferencia máxima de ancho de cabeza para considerar la misma pose

async function headOf(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const solid = (x, y) => data[(y * w + x) * 4 + 3] > 40;
  let top = -1;
  for (let y = 0; y < h && top < 0; y++) for (let x = 0; x < w; x++) if (solid(x, y)) { top = y; break; }
  if (top < 0) return null;
  let sum = 0, n = 0, minX = w, maxX = 0;
  for (let y = top; y < Math.min(h, top + 220); y++) {
    for (let x = 0; x < w; x++) {
      if (!solid(x, y)) continue;
      sum += x;
      n++;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
    }
  }
  return { top, cx: sum / n, width: maxX - minX, w, h };
}

const byFolder = new Map();
for (const dest of generated) {
  const folder = dest.replace(/\\/g, '/').split('/').slice(-2, -1)[0];
  byFolder.set(folder, [...(byFolder.get(folder) ?? []), dest]);
}
for (const [folder, files] of byFolder) {
  const exprOf = (f) => f.replace(/\\/g, '/').split('/').pop().replace(/\.webp$/, '');
  const names = new Set(files.map(exprOf));
  const pathOf = (expr) => files.find((f) => exprOf(f) === expr);
  const heads = new Map();
  const head = async (expr) => {
    if (!heads.has(expr)) heads.set(expr, await headOf(pathOf(expr)));
    return heads.get(expr);
  };
  for (const file of files) {
    if (noAlign.has(file)) continue;
    const expr = exprOf(file);
    const outfit = expr.includes('_') ? expr.split('_')[0] : '';
    const ref = expr.endsWith('_volteada')
      ? names.has(`${outfit}_volteada`) ? `${outfit}_volteada` : null
      : outfit && names.has(`${outfit}_base`) ? `${outfit}_base` : names.has('base') ? 'base' : null;
    if (!ref || ref === expr) continue;
    const [a, r] = [await head(expr), await head(ref)];
    if (!a || !r || Math.abs(a.width - r.width) / r.width > ALIGN_SAME_POSE) continue;
    const dx = Math.round(r.cx - a.cx);
    const dy = Math.max(0, r.top - a.top); // solo hacia abajo
    if ((dx === 0 && dy === 0) || Math.abs(dx) > ALIGN_MAX || dy > ALIGN_MAX) continue;
    const moved = await sharp(file)
      .extend({ top: dy, left: Math.max(0, dx), right: Math.max(0, -dx), bottom: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer();
    await sharp(moved)
      .extract({ left: Math.max(0, -dx), top: 0, width: a.w, height: a.h })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(file + '.tmp');
    renameSync(file + '.tmp', file);
    results.aligned.push(`${folder}/${expr} (${dx > 0 ? '+' : ''}${dx}, +${dy})`);
  }
}
if (results.aligned.length) console.log(`Alineadas con su base: ${results.aligned.join(', ')}`);

// ---------- 3) Sustitutos temporales ----------
// Si el juego pide una expresión que todavía no existe, se copia la más parecida (ver "alias" en la config).
for (const [character, settings] of Object.entries(config.personajes)) {
  for (const [expr, stand] of Object.entries(settings.alias ?? {})) {
    const dest = join(TARGET, character, `${expr}.webp`);
    if (generated.has(dest)) continue; // Ya existe de verdad: el alias deja de usarse.
    const source = join(TARGET, character, `${stand}.webp`);
    if (!generated.has(source)) {
      console.log(`✗ alias ${character}/${expr} → ${stand}: no existe ${stand}`);
      results.failed++;
      continue;
    }
    copyFileSync(source, dest);
    results.aliases.push(`${character}/${expr}→${stand}`);
  }
}
// ---------- 4) Versiones volteadas a mano ----------
// Una capa `<expresión>_volteada` es el sprite ya dibujado en espejo (p. ej. para que el texto del gafete se lea bien).
// El motor la usa en vez de voltear la imagen original.
const volteadas = {};
for (const dest of [...generated].sort()) {
  const m = dest.replace(/\\/g, '/').match(/sprites\/([^/]+)\/(.+)_volteada\.webp$/);
  if (!m) continue;
  // `nikki_trabajo_volteada` vale como la volteada de `trabajo_base` si no existe una expresión `trabajo`.
  const own = join(TARGET, m[1], `${m[2]}.webp`);
  const base = join(TARGET, m[1], `${m[2]}_base.webp`);
  const expr = !generated.has(own) && generated.has(base) ? `${m[2]}_base` : m[2];
  volteadas[`${m[1]}/${expr}`] = `${m[1]}/${m[2]}_volteada`;
}
writeFileSync('src/data/volteadas.json', JSON.stringify(volteadas, null, 2) + '\n');
if (Object.keys(volteadas).length) console.log(`Volteadas a mano: ${Object.keys(volteadas).join(', ')}`);

// ---------- 5) Sprites más anchos que el lienzo normal ----------
// Los «recortado» tienen el lienzo más ancho (para no cortar los costados): el juego los deja ocupar más ancho.
const anchos = {};
for (const dest of [...noAlign].sort()) {
  if (!existsSync(dest)) continue;
  const { width, height } = await sharp(dest).metadata();
  const m = dest.replace(/\\/g, '/').match(/sprites\/([^/]+)\/(.+)\.webp$/);
  if (m && width && height) anchos[`${m[1]}/${m[2]}`] = Math.round((width / height / 0.75) * 100) / 100;
}
writeFileSync('src/data/anchos.json', JSON.stringify(anchos, null, 2) + '\n');

if (results.aliases.length) console.log(`Sustitutos temporales (${results.aliases.length}): ${results.aliases.join(', ')}`);

console.log(`${results.ok} sprites listos${results.failed ? `, ${results.failed} con problemas` : ''}.`);
if (results.failed) process.exitCode = 1;
