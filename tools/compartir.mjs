// Páginas para compartir las fotos de Boringram: public/compartir/<id>.html y <id>.jpg (1200×630).
//   npm run compartir
// Cada página tiene la miniatura de esa foto (Open Graph / Twitter) y lleva al juego. Así, al compartir
// una foto en Facebook, WhatsApp o X se ve la foto con el enlace del juego. Se vuelve a correr cuando se
// agregan fotos a src/data/boringram.json.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const W = 1200;
const H = 630;
const OUT = 'public/compartir';
const data = JSON.parse(readFileSync('src/data/boringram.json', 'utf8'));
const SITIO = data.sitio;
// La versión va en los enlaces y en la imagen: al cambiarla, las redes vuelven a leer la vista previa.
const V = data.compartir_version ?? 1;

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Parte el texto en líneas de unos `max` caracteres. */
function wrap(text, max) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    if ((line + ' ' + word).trim().length > max) {
      lines.push(line);
      line = word;
    } else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  // Hasta 8 líneas; si no entra, termina en «…».
  return lines.length > 8 ? [...lines.slice(0, 7), `${lines[7]}…`] : lines;
}

mkdirSync(OUT, { recursive: true });
const fotos = [
  ...data.publicaciones.filter((p) => p.tipo === 'foto'),
  // Cada foto de un carrusel después de la primera: <id>-2, <id>-3… (se comparte la que se está viendo).
  ...data.publicaciones.flatMap((p) =>
    (p.carrusel ?? []).slice(1).map((c, i) => ({ id: `${p.id}-${i + 2}`, autor: p.autor, imagen: c.imagen, texto: c.texto ?? p.texto })),
  ),
  // Historias destacadas (las que ya tienen imagen).
  ...data.destacadas.filter((h) => !h.imagen.startsWith('PLACEHOLDER:')),
];
for (const p of fotos) {
  const user = data.perfiles[p.autor]?.usuario ?? p.autor;
  const src = `public/${p.imagen}`;
  // Fondo: la misma foto, desenfocada y oscura. Encima, la foto entera en el centro: cuando una red muestra la
  // vista chica (WhatsApp recorta un cuadrado del medio), se ve la foto y no el logo. A la izquierda, Boringram,
  // quién publica y el texto; a la derecha, el +18 y el enlace del juego.
  const bg = await sharp(src).resize(W, H, { fit: 'cover' }).blur(28).modulate({ brightness: 0.45 }).toBuffer();
  const photoH = 560;
  const photo = await sharp(src).resize({ height: photoH, width: 520, fit: 'inside' }).toBuffer();
  const { width: pw, height: ph } = await sharp(photo).metadata();
  const px = Math.round((W - pw) / 2);
  const py = Math.round((H - ph) / 2);
  const logo = await sharp('public/marca/boringram.webp').resize({ width: 262 }).toBuffer();
  // Foto de perfil de quien publica, en círculo.
  const circle = Buffer.from('<svg width="56" height="56"><circle cx="28" cy="28" r="28"/></svg>');
  const icon = await sharp(`public/${data.perfiles[p.autor].foto}`)
    .resize(56, 56, { fit: 'cover', position: 'top' })
    .composite([{ input: circle, blend: 'dest-in' }])
    .png()
    .toBuffer();
  const leftX = 38;
  const rightX = px + pw + 30;
  const caption = wrap(p.texto, 17)
    .map((l, i) => `<text x="${leftX}" y="${250 + i * 36}" font-family="Segoe UI, Arial, sans-serif" font-size="27" fill="#f1f1f4">${esc(l)}</text>`)
    .join('');
  const overlay = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#ff8a3d"/><stop offset="0.55" stop-color="#ff3d7f"/><stop offset="1" stop-color="#a64dff"/></linearGradient></defs>
  <rect x="${px - 4}" y="${py - 4}" width="${pw + 8}" height="${ph + 8}" rx="18" fill="none" stroke="url(#g)" stroke-width="4"/>
  <text x="${leftX + 70}" y="${174}" font-family="Segoe UI, Arial, sans-serif" font-size="30" font-weight="700" fill="#fff">${esc(user)}</text>
  ${caption}
  <rect x="${W - 92}" y="28" width="64" height="34" rx="8" fill="#000" fill-opacity="0.6" stroke="#ff4f8b"/>
  <text x="${W - 60}" y="52" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="#ff4f8b">+18</text>
  <text x="${rightX}" y="512" font-family="Segoe UI, Arial, sans-serif" font-size="25" font-weight="700" fill="#fff">PROJECT GENESIS</text>
  <text x="${rightX}" y="546" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#c9c9d2">Juega gratis en el navegador</text>
  <text x="${rightX}" y="584" font-family="Consolas, monospace" font-size="17" fill="#ff8ab5">proyect-genesis.vercel.app</text>
</svg>`;
  await sharp(bg)
    .composite([
      { input: photo, left: px, top: py },
      { input: logo, left: leftX, top: 52 },
      { input: icon, left: leftX, top: 134 },
      { input: Buffer.from(overlay), left: 0, top: 0 },
    ])
    .jpeg({ quality: 86 })
    .toFile(`${OUT}/${p.id}.jpg`);

  const title = `${user} en Boringram · PROJECT GENESIS`;
  const desc = `«${p.texto}» Novela visual para adultos (18+). Juega gratis en el navegador.`;
  const url = `${SITIO}compartir/${p.id}.html?v=${V}`;
  const img = `${SITIO}compartir/${p.id}.jpg?v=${V}`;
  writeFileSync(
    `${OUT}/${p.id}.html`,
    `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta property="og:type" content="website" />
<meta property="og:site_name" content="PROJECT GENESIS" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${img}" />
<meta property="og:image:width" content="${W}" />
<meta property="og:image:height" content="${H}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${img}" />
<meta http-equiv="refresh" content="0; url=../" />
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#000;color:#ccc;font-family:system-ui,sans-serif}</style>
</head>
<body><a href="../" style="color:#ff8ab5">PROJECT GENESIS</a><script>location.replace('../');</script></body>
</html>
`,
  );
  console.log(`✓ ${p.id}`);
}
console.log(`${fotos.length} páginas para compartir en ${OUT}/`);
