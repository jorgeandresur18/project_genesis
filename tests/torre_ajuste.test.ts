// Herramienta para equilibrar la torre del Capítulo 3: juega las dos rutas en cadena (los niveles que se ganan en una
// pelea se llevan a la siguiente). Los niveles de los enemigos suben fijos piso a piso (PLAN); lo que se ajusta es la
// fuerza de cada enemigo nuevo (multiplica vida y ataque de su ficha) o, en las peleas de soldados, el nivel.
// Ver: TORRE=1 npx vitest run tests/torre_ajuste.test.ts --disable-console-intercept
// Ajustar y escribir los JSON: TORRE=1 AJUSTAR=1 (lo mismo). Metas (atento): bajan piso a piso, de ~95 % a ~58 % con el Rey (ver PISO y meta).
import fs from 'node:fs';
import { it } from 'vitest';
import { BATALLAS, FICHAS } from '../src/engine/batallas';
import { sim } from './simulador';

const RUTAS: Record<string, string[]> = {
  A: ['cap03_calabozo', 'cap03_cloacas_1', 'cap03_cloacas_2', 'cap03_cuarteles', 'cap03_cuarteles_2', 'cap03_comedor_1', 'cap03_comedor_2', 'cap03_biblioteca_1', 'cap03_sombras', 'cap03_celdas_1', 'cap03_celdas_2', 'cap03_arsenal', 'cap03_salon_1', 'cap03_salon_2', 'cap03_rey'],
  B: ['cap03_calabozo', 'cap03_bodegas_1', 'cap03_bodegas_2', 'cap03_cuarteles', 'cap03_cuarteles_2', 'cap03_forja_1', 'cap03_forja_2', 'cap03_biblioteca_1', 'cap03_sombras', 'cap03_patio_1', 'cap03_patio_2', 'cap03_arsenal', 'cap03_galeria_1', 'cap03_galeria_2', 'cap03_rey'],
};
// Niveles de la horda y del jefe, piso a piso.
const PLAN: Record<string, [number[], number]> = {
  cap03_calabozo: [[10, 10, 11, 11], 12],
  cap03_cloacas_1: [[11, 11, 11, 12, 12, 12], 13],
  cap03_bodegas_1: [[11, 11, 12, 12], 13],
  cap03_cloacas_2: [[12, 12, 12], 14],
  cap03_bodegas_2: [[12, 12], 14],
  cap03_cuarteles: [[12, 12, 12, 13, 13, 13], 14],
  cap03_cuarteles_2: [[13, 13, 13], 15],
  cap03_comedor_1: [[13, 13, 14, 14], 15],
  cap03_forja_1: [[13, 13, 14, 14], 15],
  cap03_comedor_2: [[14, 14], 16],
  cap03_forja_2: [[14, 14], 16],
  cap03_biblioteca_1: [[14, 14, 15], 16],
  cap03_sombras: [[15, 15, 15], 16],
  cap03_celdas_1: [[15, 15, 16, 16], 17],
  cap03_patio_1: [[15, 15, 16, 16], 17],
  cap03_celdas_2: [[16, 16], 18],
  cap03_patio_2: [[16, 16], 18],
  cap03_arsenal: [[16, 16, 17, 17], 18],
  cap03_salon_1: [[17, 17, 18, 18], 19],
  cap03_galeria_1: [[17, 17, 18, 18], 19],
  cap03_salon_2: [[18, 18], 20],
  cap03_galeria_2: [[18, 18], 20],
  cap03_rey: [[], 28],
};
// Qué se ajusta en cada pelea: la fuerza de esos enemigos (multiplica vida y ataque) o, si es «horda», cuántos salen.
// Los jefes no se inflan (decisión del autor, 2026-11-05): todos parten de la ficha del Capitán y suben un poco por piso;
// en sus peleas se ajusta solo el nivel de la horda. Al final pelean solo contra el Rey: nivel 28 (un salto grande; era 26
// hasta que Cami dejó de descansar fuera del Capítulo 1, 2026-11-05), con la ficha del Capitán, sin ajuste.
const PERILLA: Record<string, string[] | 'nivel' | 'nivel_horda'> = {
  cap03_calabozo: 'nivel_horda',
  cap03_cloacas_1: ['bicho'],
  cap03_cloacas_2: 'nivel_horda',
  cap03_bodegas_1: ['bodeguero'],
  cap03_bodegas_2: 'nivel_horda',
  cap03_cuarteles: 'nivel_horda',
  cap03_cuarteles_2: 'nivel_horda',
  cap03_comedor_1: ['cocinero'],
  cap03_comedor_2: 'nivel_horda',
  cap03_forja_1: ['herrero'],
  cap03_forja_2: 'nivel_horda',
  cap03_biblioteca_1: ['escriba'],
  cap03_sombras: 'nivel_horda',
  cap03_celdas_1: ['celador'],
  cap03_celdas_2: ['guardia_invierno'],
  cap03_patio_1: ['guardia_verano'],
  cap03_patio_2: ['guardia_otono'],
  cap03_arsenal: 'nivel_horda',
  cap03_salon_1: ['caballero'],
  cap03_salon_2: 'nivel_horda',
  cap03_galeria_1: 'nivel_horda',
  cap03_galeria_2: 'nivel_horda',
  cap03_rey: 'nivel_horda',
};
const JEFES = new Set(['cap03_cloacas_2', 'cap03_bodegas_2', 'cap03_cuarteles_2', 'cap03_comedor_2', 'cap03_forja_2', 'cap03_celdas_2', 'cap03_patio_2', 'cap03_arsenal', 'cap03_salon_2', 'cap03_galeria_2']);
// La torre sube de dificultad poco a poco (decisión del autor, 2026-11-05): cuánto gana el jugador atento baja piso a
// piso, de ~95 % en el calabozo a ~58 % contra el Rey; el jefe de cada piso, un poco menos que las peleas de su piso.
const PISO: Record<string, number> = {
  cap03_calabozo: 0, cap03_cloacas_1: 1, cap03_cloacas_2: 1, cap03_bodegas_1: 1, cap03_bodegas_2: 1,
  cap03_cuarteles: 2, cap03_cuarteles_2: 2, cap03_comedor_1: 3, cap03_comedor_2: 3, cap03_forja_1: 3, cap03_forja_2: 3,
  cap03_biblioteca_1: 4, cap03_sombras: 4, cap03_celdas_1: 5, cap03_celdas_2: 5, cap03_patio_1: 5, cap03_patio_2: 5,
  cap03_arsenal: 6, cap03_salon_1: 7, cap03_salon_2: 7, cap03_galeria_1: 7, cap03_galeria_2: 7,
};
const meta = (id: string) => (id === 'cap03_rey' ? 0.58 : 0.95 - 0.035 * PISO[id] - (JEFES.has(id) ? 0.07 : 0));
const N = Number(process.env.SIM_N ?? 300);
const AJUSTAR = !!process.env.AJUSTAR;

const ORIG = structuredClone(FICHAS.enemigos);
const mult: Record<string, number> = {};
const aplicarMult = (k: string, m: number) => {
  mult[k] = m;
  const o = ORIG[k];
  const e = FICHAS.enemigos[k];
  e.base = { ...o.base, ps: Math.round(o.base.ps * m), atq: Math.max(1, Math.round(o.base.atq * m)) };
  e.crece = { ...o.crece, ps: +(o.crece.ps * m).toFixed(1), atq: +(o.crece.atq * m).toFixed(2) };
};
const datos = (id: string, heroes: Record<string, number>) => {
  const D = structuredClone(BATALLAS[id]);
  for (const k of Object.keys(D.enemigos)) D.enemigos[k] = structuredClone(FICHAS.enemigos[k]);
  for (const k of Object.keys(D.personajes)) D.personajes[k].nivel = heroes[k] ?? D.personajes[k].nivel;
  return D;
};
const nivelesH: Record<string, Record<string, number>> = {};

function cadena(log: boolean) {
  const porPelea: Record<string, Record<string, number>[]> = {};
  for (const [ruta, ids] of Object.entries(RUTAS)) {
    let niv: Record<string, number> = { jair: 10, cami: 17, rikka: 13 };
    if (log) console.log('RUTA', ruta);
    for (const id of ids) {
      const h = Object.fromEntries(Object.entries(niv).map(([k, v]) => [k, Math.floor(v)]));
      (porPelea[id] ??= []).push(h);
      const D = datos(id, h);
      const at = sim(D, true, log ? 1000 : N);
      if (log) {
        const de = sim(D, false, 1000);
        console.log(`${id.padEnd(20)} heroes ${JSON.stringify(h)} horda ${D.horda.enemigo}${JSON.stringify(D.horda.niveles)} jefe ${D.jefe.enemigo}@${D.jefe.nivel} | atento ${(at.gana * 100).toFixed(0)}% vida ${(at.vida * 100).toFixed(0)}% | descuidado ${(de.gana * 100).toFixed(0)}%`);
      }
      niv = { ...niv, ...at.niveles };
    }
  }
  for (const [id, l] of Object.entries(porPelea)) nivelesH[id] = Object.fromEntries(Object.keys(l[0]).map((k) => [k, Math.min(...l.map((x) => x[k]))]));
}

function ajustar(id: string) {
  const B = BATALLAS[id];
  const [hn, jn] = PLAN[id];
  B.horda.niveles = [...hn];
  B.jefe.nivel = jn;
  const m = meta(id);
  const gana = () => sim(datos(id, nivelesH[id]), true, N).gana;
  const p = PERILLA[id];
  if (p === 'nivel' || p === 'nivel_horda') {
    // «nivel_horda»: el jefe queda en su nivel del plan (suben de a poco, piso a piso); se mueve solo la horda.
    let mejor = 0;
    let err = Infinity;
    for (let d = -4; d <= 10; d++) {
      B.horda.niveles = hn.map((n) => n + d);
      B.jefe.nivel = p === 'nivel' ? jn + d : jn;
      const r = gana();
      if (Math.abs(r - m) < err) [err, mejor] = [Math.abs(r - m), d];
      if (r < m - 0.05) break;
    }
    B.horda.niveles = hn.map((n) => n + mejor);
    B.jefe.nivel = p === 'nivel' ? jn + mejor : jn;
    return;
  }
  let lo = 0.3;
  let hi = 3;
  for (let i = 0; i < 8; i++) {
    const x = (lo + hi) / 2;
    for (const k of p) aplicarMult(k, x);
    if (gana() > m) lo = x;
    else hi = x;
  }
  for (const k of p) aplicarMult(k, +((lo + hi) / 2).toFixed(2));
}

it.skipIf(!process.env.TORRE)('torre', () => {
  for (const id of Object.keys(PLAN)) {
    BATALLAS[id].horda.niveles = [...PLAN[id][0]];
    BATALLAS[id].jefe.nivel = PLAN[id][1];
  }
  if (AJUSTAR) {
    for (let pasada = 0; pasada < 3; pasada++) {
      cadena(false);
      const orden = [...new Set([...RUTAS.A, ...RUTAS.B])].sort((a, b) => PLAN[a][1] - PLAN[b][1]);
      for (const id of orden) ajustar(id);
    }
  }
  cadena(true);
  console.log('MULT', JSON.stringify(mult));
  if (!AJUSTAR) return;
  for (const id of Object.keys(PLAN)) {
    const f = `src/data/batallas/${id}.json`;
    const j = JSON.parse(fs.readFileSync(f, 'utf8'));
    j.horda.niveles = BATALLAS[id].horda.niveles;
    j.horda.al_inicio = BATALLAS[id].horda.al_inicio;
    j.jefe.nivel = BATALLAS[id].jefe.nivel;
    for (const k of Object.keys(j.personajes)) j.personajes[k].nivel = nivelesH[id][k];
    fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n');
  }
  const fp = 'src/data/rpg/personajes.json';
  const fichas = JSON.parse(fs.readFileSync(fp, 'utf8'));
  for (const k of Object.keys(mult)) {
    fichas.enemigos[k].base = FICHAS.enemigos[k].base;
    fichas.enemigos[k].crece = FICHAS.enemigos[k].crece;
  }
  fs.writeFileSync(fp, JSON.stringify(fichas, null, 2) + '\n');
}, 3600000);
