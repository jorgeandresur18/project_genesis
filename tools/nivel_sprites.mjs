// Sprites de los niveles (acción y batallas) desde las referencias del autor: una tira de cuadros por personaje
// (uno por pose, en el orden de tools/nivel_sprites.config.json) y su .json, en la carpeta `salida`.
//   npm run nivel:sprites
// Cada referencia es pixel art agrandado (sobre fondo blanco o transparente): se toma la mediana del centro de cada
// celda (así el contorno negro queda nítido) y el fondo pasa a transparente. Una referencia sin cuadrícula (con
// `alto` en vez de `celda`) se reduce a ese alto. Los cuadros se alinean por los pies (abajo) y por el centro del
// cuerpo (las piernas), para que el sprite no salte al cambiar de pose. Una entrada con `copiar` solo copia una hoja
// que ya viene hecha (con su .json; sin `json`, el .json de las animaciones ya está en la salida y no se toca).
// `archivo`: nombre del archivo de salida (si no, el de la entrada).
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const config = JSON.parse(readFileSync('tools/nivel_sprites.config.json', 'utf8'));

/** Una pose: la imagen agrandada → el sprite a su tamaño real (RGBA). */
async function pixelar(archivo, celda, alto) {
  const { data, info } = await sharp(archivo).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = (x, y) => data.subarray((y * W + x) * 4, (y * W + x) * 4 + 4);
  const fondo = (p) => p[3] < 128 || Math.min(p[0], p[1], p[2]) > 225;
  // Recorte al dibujo.
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x += 2)
      if (!fondo(px(x, y))) {
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
  // Sin cuadrícula: se reduce al alto pedido.
  if (!celda) celda = (y1 - y0) / alto;
  const w = Math.round((x1 - x0) / celda);
  const h = Math.round((y1 - y0) / celda);
  const gx = (x1 - x0) / w;
  const gy = (y1 - y0) / h;
  const out = Buffer.alloc(w * h * 4);
  const mediana = (v) => v.sort((a, b) => a - b)[v.length >> 1];
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const rs = [], gs = [], bs = [], as = [];
      for (let y = Math.floor(y0 + (j + 0.3) * gy); y < y0 + (j + 0.7) * gy; y++)
        for (let x = Math.floor(x0 + (i + 0.3) * gx); x < x0 + (i + 0.7) * gx; x++) {
          const p = px(x, y);
          rs.push(p[0]); gs.push(p[1]); bs.push(p[2]); as.push(fondo(p) ? 0 : 255);
        }
      if (mediana(as) === 0) continue;
      out.set([mediana(rs), mediana(gs), mediana(bs), 255], (j * w + i) * 4);
    }
  return { w, h, rgba: out };
}

/** Centro del cuerpo: el medio de las columnas pintadas en las filas de las piernas (abajo). */
function centro({ w, h, rgba }) {
  let suma = 0, n = 0;
  for (let y = Math.floor(h * 0.75); y < h; y++)
    for (let x = 0; x < w; x++) if (rgba[(y * w + x) * 4 + 3]) { suma += x; n++; }
  return n ? suma / n : w / 2;
}

for (const [nombre, def] of Object.entries(config)) {
  if (nombre.startsWith('_')) continue;
  const salida = def.salida ?? 'public/nivel';
  mkdirSync(salida, { recursive: true });
  if (def.copiar) {
    const archivo = def.archivo ?? nombre;
    copyFileSync(def.copiar.png, `${salida}/${archivo}.png`);
    if (def.copiar.json) copyFileSync(def.copiar.json, `${salida}/${archivo}.json`);
    console.log(`✓ ${salida}/${archivo}.png (copiada)`);
    continue;
  }
  const [fw, fh] = def.cuadro;
  const pie = def.pie ?? 1;
  const poses = Object.entries(def.poses);
  const tira = Buffer.alloc(fw * poses.length * fh * 4);
  for (const [k, [, pose]] of poses.entries()) {
    const s = await pixelar(pose.archivo, pose.celda, pose.alto);
    const dx = Math.round(fw / 2 - centro(s));
    const dy = fh - pie - s.h;
    for (let y = 0; y < s.h; y++)
      for (let x = 0; x < s.w; x++) {
        const tx = x + dx, ty = y + dy;
        if (tx < 0 || tx >= fw || ty < 0) continue;
        const o = (y * s.w + x) * 4;
        if (!s.rgba[o + 3]) continue;
        s.rgba.copy(tira, (ty * fw * poses.length + k * fw + tx) * 4, o, o + 4);
      }
    console.log(`  ${nombre}/${poses[k][0]}: ${s.w}×${s.h}`);
  }
  await sharp(tira, { raw: { width: fw * poses.length, height: fh, channels: 4 } })
    .png({ palette: true, colors: def.colores ?? 32, dither: 0 })
    .toFile(`${salida}/${def.archivo ?? nombre}.png`);
  writeFileSync(`${salida}/${def.archivo ?? nombre}.json`, JSON.stringify({ cuadro: [fw, fh], poses: poses.map(([p]) => p) }, null, 2) + '\n');
  console.log(`✓ ${salida}/${def.archivo ?? nombre}.png (${poses.length} cuadros de ${fw}×${fh})`);
}
