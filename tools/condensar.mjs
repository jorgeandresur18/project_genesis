// Condensar diálogos (pedido del autor, 2026-11-06): junta líneas seguidas del mismo personaje (o de narración) en una
// sola caja, para que la historia avance con menos clics, sin tocar decisiones, peleas, finales ni el árbol.
//
//   node tools/condensar.mjs proponer cap01 <desde> <hasta>   → docs/guion/<cap>_condensado.md (no cambia el juego)
//   node tools/condensar.mjs aplicar cap01                     → aplica las fusiones marcadas [x] del documento
//
// Reglas para juntar la línea B con la anterior A (B desaparece y su texto pasa a A):
// - A lleva directo a B (sin decisiones) y nadie más llega a B; B no la usa ninguna otra parte del juego (desbloqueos
//   de Boringram, galería, finales, pruebas…).
// - Mismo hablante, mismo fondo, las mismas caras; B sin efectos, música, transición, pelea, minijuego ni final.
// - Como mucho 3 líneas por caja y unas 190 letras; los golpes cortos («Silencio.») quedan solos.
// - Con CARAS=no se juntan aunque cambie la expresión (se queda la de la primera línea).
import fs from 'node:fs';
import path from 'node:path';

const [modo, cap, desde, hasta] = process.argv.slice(2);
if (!modo || !cap) {
  console.log('Uso: node tools/condensar.mjs proponer cap01 <desde> <hasta>  |  aplicar cap01');
  process.exit(1);
}
const MAX_LETRAS = 190;
const MAX_LINEAS = 3;
const MIN_SOLO = 15;
const fCap = `src/data/chapters/${cap}.json`;
const fEn = `src/data/en/chapters/${cap}.json`;
const fDoc = `docs/guion/${cap}_condensado.md`;
const capitulo = JSON.parse(fs.readFileSync(fCap, 'utf8'));
const M = new Map(capitulo.scenes.map((s) => [s.scene_id, s]));

/** Los ids que se usan desde fuera de este capítulo (otros JSON, el código y las pruebas): nunca se borran. */
function protegidos() {
  const out = new Set();
  const re = new RegExp(`${cap}_[a-z0-9_]+`, 'g');
  const recorrer = (dir) => {
    for (const x of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, x.name);
      if (x.isDirectory()) recorrer(p);
      else if (/\.(json|ts|tsx|mjs)$/.test(x.name) && path.resolve(p) !== path.resolve(fCap) && path.resolve(p) !== path.resolve(fEn)) for (const m of fs.readFileSync(p, 'utf8').match(re) ?? []) out.add(m);
    }
  };
  for (const d of ['src', 'tests']) recorrer(d);
  return out;
}
/** Cuántas veces se llega a cada escena desde dentro del capítulo (next, ramas, opciones, derrotas…). */
function entradas() {
  const n = new Map();
  const sumar = (id) => typeof id === 'string' && n.set(id, (n.get(id) ?? 0) + 1);
  for (const s of capitulo.scenes) {
    if (typeof s.next === 'string') sumar(s.next);
    else if (Array.isArray(s.next)) for (const r of s.next) sumar(r.next);
    for (const c of s.choices ?? []) sumar(c.next);
    for (const k of ['batalla_derrota', 'nivel_derrota', 'minijuego_salida', 'batalla_perdon']) sumar(s[k]);
  }
  return n;
}
const CLAVES_SIMPLES = new Set(['scene_id', 'chapter', 'background', 'video_fondo', 'loop_video', 'characters', 'dialogue', 'choices', 'conditions', 'audio', 'ui_effect', 'next']);
const simple = (s) => Object.keys(s).every((k) => CLAVES_SIMPLES.has(k)) && !s.choices.length && !(s.conditions ?? []).length && typeof s.next === 'string';
const caras = (s) => JSON.stringify(s.characters);
/** Junta dos textos: dos pensamientos entre paréntesis quedan en uno solo. */
function juntar(a, b) {
  const pa = /^\(.*\)$/s.test(a);
  const pb = /^\(.*\)$/s.test(b);
  if (pa && pb) return `${a.slice(0, -1)} ${b.slice(1)}`;
  return `${a} ${b}`;
}

if (modo === 'proponer') {
  if (!desde || !hasta) throw new Error('Falta <desde> y <hasta>');
  const i0 = capitulo.scenes.findIndex((s) => s.scene_id === desde);
  const i1 = capitulo.scenes.findIndex((s) => s.scene_id === hasta);
  if (i0 < 0 || i1 < 0) throw new Error('No encuentro desde o hasta');
  const rango = new Set(capitulo.scenes.slice(i0, i1 + 1).map((s) => s.scene_id));
  const prot = protegidos();
  const ent = entradas();
  const usadas = new Set();
  const grupos = [];
  for (const s of capitulo.scenes.slice(i0, i1 + 1)) {
    if (usadas.has(s.scene_id) || !simple(s) || !s.dialogue) continue;
    const g = [s];
    let texto = s.dialogue.text;
    let actual = s;
    while (g.length < MAX_LINEAS) {
      const b = M.get(actual.next);
      if (!b || !rango.has(b.scene_id) || usadas.has(b.scene_id) || !b.dialogue) break;
      const bLibre = Object.keys(b).every((k) => CLAVES_SIMPLES.has(k)) && !b.choices.length && !(b.conditions ?? []).length && !b.ui_effect && !b.audio;
      if (!bLibre || prot.has(b.scene_id) || (ent.get(b.scene_id) ?? 0) !== 1) break;
      if ((b.dialogue.speaker ?? null) !== (s.dialogue.speaker ?? null) || b.background !== s.background || (process.env.CARAS !== 'no' && caras(b) !== caras(s))) break;
      if (b.dialogue.text.length < MIN_SOLO || texto.length < MIN_SOLO) break;
      const junto = juntar(texto, b.dialogue.text);
      if (junto.length > MAX_LETRAS) break;
      g.push(b);
      texto = junto;
      actual = b;
      // Si la que se suma termina en otra decisión o pelea, el grupo termina ahí (se junta igual: B es simple).
      if (typeof b.next !== 'string') break;
    }
    if (g.length > 1) {
      for (const x of g) usadas.add(x.scene_id);
      grupos.push({ ids: g.map((x) => x.scene_id), hablante: s.dialogue.speaker, lineas: g.map((x) => x.dialogue.text), texto });
    }
  }
  const antes = rango.size;
  const quitadas = grupos.reduce((n, g) => n + g.ids.length - 1, 0);
  const L = [
    `# ${cap}: propuesta para condensar diálogos (${desde} a ${hasta})`,
    '',
    `Generado por \`node tools/condensar.mjs proponer ${cap} ${desde} ${hasta}\` (Claude, ${new Date().toISOString().slice(0, 10)}). **No cambia el juego todavía.**`,
    '',
    `- Escenas en el tramo: **${antes}**. Fusiones propuestas: **${grupos.length}**. Clics que se ahorran: **${quitadas}** (${Math.round((quitadas / antes) * 100)} %).`,
    '- Cómo revisarlo: cada fusión está marcada **[x]**. Si una no te gusta, cámbiala a **[ ]**. También puedes corregir el texto propuesto (la línea que empieza con «→»).',
    '- Para aplicarlo: `node tools/condensar.mjs aplicar ' + cap + '`. Solo junta las marcadas; no toca decisiones, peleas, finales, variables ni el árbol. El inglés se junta igual.',
    '',
  ];
  for (const g of grupos) {
    L.push(`- [x] \`${g.ids.join(' + ')}\` — ${g.hablante ?? 'narración'}`);
    for (const t of g.lineas) L.push(`  - ${t}`);
    L.push(`  - → ${g.texto}`);
    L.push('');
  }
  fs.writeFileSync(fDoc, L.join('\n'));
  console.log(`${fDoc}: ${grupos.length} fusiones, ${quitadas} clics menos de ${antes} (${Math.round((quitadas / antes) * 100)} %)`);
} else if (modo === 'aplicar') {
  const doc = fs.readFileSync(fDoc, 'utf8').replace(/\r\n/g, '\n');
  const en = fs.existsSync(fEn) ? JSON.parse(fs.readFileSync(fEn, 'utf8')) : null;
  const prot = protegidos();
  let n = 0;
  const bloques = doc.split('\n- [').slice(1);
  for (const b of bloques) {
    if (!b.startsWith('x]')) continue;
    const ids = (b.match(/`([^`]+)`/) ?? [])[1]?.split(' + ');
    const texto = (b.match(/\n {2}- → (.*)/) ?? [])[1];
    if (!ids || !texto) continue;
    const [cabeza, ...resto] = ids.map((id) => M.get(id));
    if (!cabeza || resto.some((x) => !x || prot.has(x.scene_id))) throw new Error('Fusión inválida: ' + ids.join(' + '));
    // Sigue siendo una cadena: cada una lleva a la siguiente.
    ids.slice(0, -1).forEach((id, i) => {
      if (M.get(id).next !== ids[i + 1]) throw new Error('Ya no es una cadena: ' + ids.join(' + '));
    });
    cabeza.dialogue.text = texto;
    cabeza.next = resto.at(-1).next;
    if (en) {
      const textos = ids.map((id) => en[id]?.t).filter((t) => typeof t === 'string');
      if (textos.length) en[cabeza.scene_id] = { ...(en[cabeza.scene_id] ?? {}), t: textos.reduce((a, t) => juntar(a, t)) };
      for (const x of resto) delete en[x.scene_id];
    }
    const fuera = new Set(resto.map((x) => x.scene_id));
    capitulo.scenes = capitulo.scenes.filter((s) => !fuera.has(s.scene_id));
    n++;
  }
  fs.writeFileSync(fCap, JSON.stringify(capitulo, null, 2) + '\n');
  if (en) fs.writeFileSync(fEn, '{\n' + Object.entries(en).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(',\n') + '\n}\n');
  console.log(`${n} fusiones aplicadas en ${fCap}${en ? ' (y en inglés)' : ''}`);
} else throw new Error('Modo desconocido: ' + modo);
