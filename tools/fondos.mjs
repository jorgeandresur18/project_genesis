// Prepara los fondos del juego: docs/fondos/<archivo>.{jpg,jpeg,png,webp} -> public/fondos/<fondo>.webp.
//   npm run fondos
//
// Se reducen a 1920 px de ancho como máximo (nunca se agrandan) y se convierten a webp. En pantalla se
// recortan para cubrir el escenario, así que conviene que sean 16:9. Después, en el capítulo, cada
// PLACEHOLDER:<fondo> que ya tenga imagen pasa a fondos/<fondo>.webp.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const SOURCE = 'docs/fondos';
const TARGET = 'public/fondos';
const CHAPTERS = 'src/data/chapters';
const MAX_WIDTH = 1920;
const config = JSON.parse(readFileSync('tools/fondos.config.json', 'utf8'));

mkdirSync(TARGET, { recursive: true });
const ready = new Set();
for (const file of readdirSync(SOURCE).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()) {
  const base = parse(file).name.toLowerCase();
  if (config.omitir?.includes(base)) {
    console.log(`· ${file}: en «omitir», se deja como marcador`);
    continue;
  }
  const id = config.fondos[base] ?? base;
  const dest = join(TARGET, `${id}.webp`);
  const img = sharp(join(SOURCE, file));
  const { width, height } = await img.metadata();
  const info = await img.resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 85 }).toFile(dest);
  ready.add(id);
  console.log(`✓ ${file} → ${dest} (${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB)`);
  if (Math.abs(width / height - 16 / 9) > 0.05) console.log(`    ! no es 16:9 (${width}x${height}); se verá recortado`);
  if (width < MAX_WIDTH) console.log(`    ! mide ${width} px de ancho; en pantallas grandes se verá algo borroso`);
}

// Los que genera otro paso (la imagen secreta, con su censura) cuentan como listos.
for (const id of config.externos ?? []) ready.add(id);

// Cambia los marcadores del capítulo por la imagen.
for (const file of readdirSync(CHAPTERS).filter((f) => f.endsWith('.json'))) {
  const path = join(CHAPTERS, file);
  const text = readFileSync(path, 'utf8');
  let count = 0;
  // También al revés: un fondo que se quitó o se omitió vuelve a ser marcador.
  const out = text
    .replace(/"PLACEHOLDER:([a-z0-9_]+)"/g, (all, id) => {
      if (!ready.has(id)) return all;
      count++;
      return `"fondos/${id}.webp"`;
    })
    .replace(/"fondos\/([a-z0-9_]+)\.webp"/g, (all, id) => (ready.has(id) ? all : (count++, `"PLACEHOLDER:${id}"`)));
  if (count) {
    writeFileSync(path, out);
    console.log(`· ${file}: ${count} fondo(s) actualizado(s)`);
  }
}
console.log(`${ready.size} fondos listos.`);
