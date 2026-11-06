// La tabla base de todos los personajes de las peleas (pedido del autor, 2026-11-05), para medirlos entre sí:
// sus estadísticas en el nivel 5 (el piso real del juego: nadie sale en el nivel 1), en los niveles 10, 15 y 20, y en
// el nivel en que aparecen de verdad. Sale de la ficha única (src/data/rpg/personajes.json) y de las peleas
// (src/data/batallas/); los personajes propuestos que todavía no están en el juego van aparte (PROPUESTAS).
//   node tools/tabla_personajes.mjs        → escribe docs/TABLA_PERSONAJES.md
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const fichas = JSON.parse(readFileSync('src/data/rpg/personajes.json', 'utf8'));
const NIVELES = [5, 10, 15, 20];

/** Propuestos (docs/BIBLIA_RPG.md, sección 20): por aprobar, todavía no están en la ficha. */
const PROPUESTAS = {
  jordan: { nombre: 'Jordan', base: { ps: 28, atq: 7, def: 2, vel: 11 }, crece: { ps: 5.5, atq: 1.2, def: 0.4, vel: 0.6 } },
  billy: { nombre: 'Billy', base: { ps: 46, atq: 8, def: 6, vel: 4 }, crece: { ps: 8, atq: 1.25, def: 0.9, vel: 0.2 } },
  maggi: { nombre: 'Maggi', base: { ps: 26, atq: 7, def: 2, vel: 12 }, crece: { ps: 4.5, atq: 1.15, def: 0.4, vel: 0.6 } },
};

const en = (f, n) => Object.fromEntries(['ps', 'atq', 'def', 'vel'].map((k) => [k, Math.round(f.base[k] + f.crece[k] * (n - 1))]));
const celda = (s) => `${s.ps} / ${s.atq} / ${s.def} / ${s.vel}`;

// En qué nivel y en qué pelea aparece cada uno por primera vez (el más bajo).
const aparece = {};
const anotar = (k, n, id, cambios) => {
  if (n && (!aparece[k] || n < aparece[k].n)) aparece[k] = { n, id, cambios };
};
for (const file of readdirSync('src/data/batallas').sort()) {
  const id = file.replace('.json', '');
  const p = JSON.parse(readFileSync(`src/data/batallas/${file}`, 'utf8'));
  for (const k of p.heroes ?? []) anotar(k, p.personajes?.[k]?.nivel, id);
  for (const n of p.horda?.niveles ?? []) anotar(p.horda.enemigo, n, id, p.enemigos_cambios?.[p.horda.enemigo]);
  if (p.jefe) anotar(p.jefe.enemigo, p.jefe.nivel, id, p.enemigos_cambios?.[p.jefe.enemigo]);
}

const fila = (k, f, propuesto = false) => {
  const a = aparece[k];
  // Con lo que cambia en esa pelea (p. ej. Nikki ebria en el bar).
  const g = a?.cambios ? { ...f, base: { ...f.base, ...a.cambios.base }, crece: { ...f.crece, ...a.cambios.crece } } : f;
  const real = a ? `${a.n} (\`${a.id}\`${a.cambios ? ', con cambios de esa pelea' : ''}): ${celda(en(g, a.n))}` : propuesto ? 'Capítulo 4 (por decidir)' : '—';
  return `| **${f.nombre ?? k}**${propuesto ? ' *(propuesta)*' : ''} | ${NIVELES.map((n) => celda(en(f, n))).join(' | ')} | ${f.crece.ps} / ${f.crece.atq} / ${f.crece.def} / ${f.crece.vel} | ${real} |`;
};
const cabeza = `| Personaje | Nv 5 | Nv 10 | Nv 15 | Nv 20 | Sube por nivel | Donde aparece (nivel, pelea): sus números |
|---|---|---|---|---|---|---|`;

const heroes = Object.entries(fichas.heroes).map(([k, f]) => fila(k, f));
const propuestos = Object.entries(PROPUESTAS).map(([k, f]) => fila(k, f, true));
const enemigos = Object.entries(fichas.enemigos)
  .sort(([a], [b]) => (aparece[a]?.n ?? 99) - (aparece[b]?.n ?? 99))
  .map(([k, f]) => fila(k, f));

const md = `# Tabla base de los personajes

Para medirlos entre sí (pedido del autor, 2026-11-05). Cada celda es **PS / ATQ / DEF / VEL**. El nivel 5 es la base: es
el piso real del juego (nadie sale en el nivel 1; lo más bajo es Jair en el 5 y un soldado en el 4). La última columna
dice dónde aparece cada uno por primera vez y con qué números.

Se genera sola: \`node tools/tabla_personajes.mjs\` (lee \`src/data/rpg/personajes.json\` y \`src/data/batallas/\`). No se
edita a mano. Las fórmulas de la pelea están en \`docs/BIBLIA_RPG.md\` (sección 3): el daño es más o menos
ATQ × poder ÷ 10 − DEF ÷ 2, y la velocidad decide el orden del turno.

## Héroes

${cabeza}
${heroes.join('\n')}

## Amigos de Jair del Capítulo 4 (propuesta, por aprobar)

${cabeza}
${propuestos.join('\n')}

## Enemigos (en el orden en que aparecen)

${cabeza}
${enemigos.join('\n')}
`;
writeFileSync('docs/TABLA_PERSONAJES.md', md);
console.log(`docs/TABLA_PERSONAJES.md: ${heroes.length} héroes, ${propuestos.length} propuestos, ${enemigos.length} enemigos`);
