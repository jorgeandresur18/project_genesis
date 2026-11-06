// Batallas por turnos (src/data/batallas/*.json): que los datos estén completos y que las cuentas sean razonables.
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { crearClon, crearLuchador, eligeEspecial, dano, disponibles, ganarXp, progresoDeVars, seRetira, statsEn, usarObjeto, varsDeProgreso, xpParaSubir, type Especial } from '../src/engine/batalla';
import variables from '../src/data/variables.json';
import { BATALLAS } from '../src/engine/batallas';

const CLAVES_DIALOGO = ['inicio', 'refuerzos', 'jefe', 'jefe_huye', 'victoria', 'derrota', 'huir_no', 'huir', 'descanso', 'cae_jair', 'hablar_ok', 'hablar_no', 'esquiva_ok', 'botin'];

/** La hoja tiene su .png y su .json, y el .json no pide filas ni cuadros que la imagen no tiene (`extra`: especial o dolor, sin reposo). */
function hojaValida(sprite: string, extra = false) {
  expect(existsSync(`public/${sprite}.png`), sprite).toBe(true);
  const j = JSON.parse(readFileSync(`public/${sprite}.json`, 'utf8'));
  if (j.cuadro) return;
  // Las hojas extra (especial, dolor) no tienen reposo: solo su animación.
  if (!extra) expect(j.animations.idle, `${sprite}: idle`).toBeTruthy();
  const png = readFileSync(`public/${sprite}.png`);
  const ancho = png.readUInt32BE(16);
  const alto = png.readUInt32BE(20);
  // Una hoja partida en renglones (`columnas`): cada animación ocupa sus renglones de a tantos cuadros.
  const col: number = j.columnas ?? Infinity;
  for (const [k, a] of Object.entries<{ row: number; frames: number }>(j.animations)) {
    expect((a.row + Math.ceil(a.frames / col)) * j.frameHeight, `${sprite}/${k}: fila`).toBeLessThanOrEqual(alto);
    expect(Math.min(a.frames, col) * j.frameWidth, `${sprite}/${k}: cuadros`).toBeLessThanOrEqual(ancho);
  }
}

function especialValido(e: Especial, sprite: string, heroe: boolean) {
  const hoja = JSON.parse(readFileSync(`public/${sprite}.json`, 'utf8'));
  // Los héroes tienen la fila «especial» (con su secuencia de unos 5 segundos); el soldado repite su ataque.
  if (heroe) expect(hoja.animations.especial, `${sprite}: especial`).toBeTruthy();
  // Un sprite de un solo cuadro (placeholder, p. ej. Nikki): los ojos tienen que caer dentro de la imagen.
  if (hoja.cuadro) {
    const [x, y, w, h] = e.ojos;
    expect(x + w, `${sprite}: ojos`).toBeLessThanOrEqual(hoja.cuadro[0]);
    expect(y + h, `${sprite}: ojos`).toBeLessThanOrEqual(hoja.cuadro[1]);
    return;
  }
  for (const [k, a] of Object.entries<{ frames: number; seq?: number[] }>(hoja.animations)) {
    for (const c of a.seq ?? []) expect(c, `${sprite}/${k}: seq`).toBeLessThan(a.frames);
  }
  expect(['objetivo', 'centro']).toContain(e.posicion);
  expect(e.golpes).toBeGreaterThan(0);
  expect(e.color).toMatch(/^#[0-9a-f]{6}$/i);
  const j = JSON.parse(readFileSync(`public/${sprite}.json`, 'utf8'));
  const [x, y, w, h] = e.ojos;
  expect(x + w, `${sprite}: ojos`).toBeLessThanOrEqual(j.frameWidth);
  expect(y + h, `${sprite}: ojos`).toBeLessThanOrEqual(j.frameHeight);
}

describe('batallas por turnos', () => {
  for (const [path, d] of Object.entries(BATALLAS)) {
    it(`${path.split('/').pop()}: héroes, enemigos, horda, jefe, botín, diálogos y sprites`, () => {
      expect(d.heroes.length).toBeGreaterThan(0);
      for (const h of d.heroes) {
        const p = d.personajes[h];
        expect(p, h).toBeTruthy();
        hojaValida(p.sprite);
        expect(p.ataques.length).toBeGreaterThan(0);
        expect(p.hablar.length).toBeGreaterThan(0);
        expect(p.nivel).toBeGreaterThan(0);
        // El especial (si tiene): su hoja, golpes, color y los ojos para el aviso, dentro de la hoja principal.
        if (p.especial) especialValido(p.especial, p.sprite, true);
        // El descanso (Cami agachada) es una fila de su hoja.
        if (p.descanso) expect(JSON.parse(readFileSync(`public/${p.sprite}.json`, 'utf8')).animations[p.descanso], `${h}: ${p.descanso}`).toBeTruthy();
        // Los que disparan de lejos tienen de dónde salen las balas en su ataque.
        if (p.distancia) expect(Object.keys(JSON.parse(readFileSync(`public/${p.sprite}.json`, 'utf8')).disparos?.ataque ?? {}).length, `${h}: disparos`).toBeGreaterThan(0);
      }
      // Al menos uno puede actuar seguido: si no, habría turnos en que nadie actúa aunque estén todos de pie.
      expect(d.heroes.some((h) => d.personajes[h].seguido)).toBe(true);
      for (const e of [d.horda.enemigo, d.jefe.enemigo]) {
        expect(d.enemigos[e], e).toBeTruthy();
        hojaValida(d.enemigos[e].sprite);
        expect(d.enemigos[e].ataques.length).toBeGreaterThan(0);
        if (d.enemigos[e].especial) especialValido(d.enemigos[e].especial!, d.enemigos[e].sprite, false);
      }
      // Hay recargadores en el botín (la otra forma de llenar el especial).
      expect(d.botin.objetos.some((k) => d.objetos[k].carga)).toBe(true);
      expect(d.enemigos[d.jefe.enemigo].jefe).toBe(true);
      expect(d.enemigos[d.jefe.enemigo].huye_a).toBeGreaterThan(0);
      expect(d.horda.al_inicio).toBeLessThanOrEqual(d.horda.niveles.length);
      for (const k of d.botin.objetos) expect(d.objetos[k], `botín ${k}`).toBeTruthy();
      for (const [k, o] of Object.entries(d.objetos)) {
        expect(o.atq || o.def || o.ps || o.cura_toda || o.carga || o.niveles || o.revive || o.veneno || o.protege || o.confunde || o.paraliza || o.cura_estados || o.quita_veneno, k).toBeTruthy();
        // Cada objeto se guarda en la partida: su variable tiene que estar declarada.
        expect(variables, `mochila_${k}`).toHaveProperty(`mochila_${k}`);
      }
      for (const k of CLAVES_DIALOGO) expect(d.dialogos[k]?.length, `diálogo ${k}`).toBeGreaterThan(0);
      // Cada uno que habla tiene su retrato (héroes, el que contesta y los de los diálogos fijos).
      const hablan = new Set([...d.heroes.map((h) => d.personajes[h].nombre), ...Object.values(d.enemigos).flatMap((e) => (e.responde ? [e.responde.quien] : []))]);
      for (const ls of Object.values(d.dialogos)) for (const l of ls) if (l.quien !== 'Voz') hablan.add(l.quien);
      for (const q of hablan) {
        expect(d.retratos[q], `retrato de ${q}`).toBeTruthy();
        expect(existsSync(`public/${d.retratos[q]}.png`), d.retratos[q]).toBe(true);
      }
    });
  }

  it('el Bastión: Jair nivel 5, Cami 15 (no repite), 6 soldados y no se puede huir', () => {
    const d = BATALLAS.bastion;
    expect(d.personajes.jair).toMatchObject({ nivel: 5, seguido: true });
    expect(d.personajes.cami).toMatchObject({ nivel: 15, seguido: false });
    expect(d.horda.niveles).toHaveLength(6);
    expect(d.huir).toBe(false);
    expect(d.enemigos[d.jefe.enemigo].huye_a).toBe(0.3);
  });

  it('actúan los dos por turno, pero Cami descansa el turno siguiente al que actuó (si queda sola, uno sí y uno no)', () => {
    const d = BATALLAS.bastion;
    const jair = crearLuchador('jair', 'jair', 'heroe', d.personajes.jair, 5);
    const cami = crearLuchador('cami', 'cami', 'heroe', d.personajes.cami, 15);
    expect(disponibles([jair, cami], d.personajes, []).map((h) => h.id)).toEqual(['jair', 'cami']);
    expect(disponibles([jair, cami], d.personajes, ['jair', 'cami']).map((h) => h.id)).toEqual(['jair']);
    expect(disponibles([jair, cami], d.personajes, ['jair']).map((h) => h.id)).toEqual(['jair', 'cami']);
    jair.ps = 0;
    expect(disponibles([jair, cami], d.personajes, ['cami'])).toEqual([]);
    expect(disponibles([jair, cami], d.personajes, []).map((h) => h.id)).toEqual(['cami']);
  });

  it('los objetos: potenciadores de ataque y defensa hasta el final de la pelea, y la vida no pasa del máximo', () => {
    const d = BATALLAS.bastion;
    const jair = crearLuchador('jair', 'jair', 'heroe', d.personajes.jair, 5);
    expect(usarObjeto(d.objetos.atq, jair)).toBe(d.objetos.atq.atq);
    expect(jair.extra).toBe(d.objetos.atq.atq);
    usarObjeto(d.objetos.def, jair);
    expect(jair.extraDef).toBe(d.objetos.def.def);
    jair.ps = jair.psMax - 5;
    expect(usarObjeto(d.objetos.vida, jair)).toBe(5);
    expect(jair.ps).toBe(jair.psMax);
  });

  it('la experiencia sube de nivel: más PS y ataque, y sobra lo que pasa', () => {
    const d = BATALLAS.bastion;
    const jair = crearLuchador('jair', 'jair', 'heroe', d.personajes.jair, 5);
    const antes = { ...jair };
    expect(ganarXp(jair, d.personajes.jair, xpParaSubir(5) + 3)).toEqual([6]);
    expect(jair.xp).toBe(3);
    expect(jair.psMax).toBeGreaterThan(antes.psMax);
    expect(jair.ps - antes.ps).toBe(jair.psMax - antes.psMax);
    expect(jair.atq).toBe(statsEn(d.personajes.jair.base, d.personajes.jair.crece, 6).atq);
  });

  it('el nivel, la experiencia, la mochila y las monedas se guardan en variables declaradas y vuelven igual', () => {
    const p = { heroes: { jair: { nivel: 7, xp: 12 }, cami: { nivel: 15, xp: 40 } }, mochila: { vida: 2, atq: 1 }, monedas: 38 };
    const vars = varsDeProgreso(p, ['atq', 'def', 'vida']);
    for (const k of Object.keys(vars)) expect(variables, k).toHaveProperty(k);
    // Lo que se gastó queda en 0.
    expect(vars.mochila_def).toBe(0);
    // Rikka empieza con su flor puesta (decisión del autor, 2026-11-05).
    const flor = { puestos: { rikka: { amuleto: 'flor_pureza', traje: 'prendas_sacerdotisa' }, cami: { traje: 'traje_azul' } } };
    expect(progresoDeVars({ ...variables, ...vars })).toEqual({ ...p, ...flor });
    // Sin pelear todavía (nivel 0), se usan los niveles del .json y la mochila está vacía.
    expect(progresoDeVars(variables)).toEqual({ heroes: {}, mochila: {}, ...flor });
  });

  it('el daño nunca es menor que 1 y los potenciadores lo suben', () => {
    const fuerte = crearLuchador('a', 'a', 'heroe', { nombre: 'A', base: { ps: 50, atq: 12, def: 5, vel: 9 }, crece: { ps: 0, atq: 0, def: 0, vel: 0 } }, 1);
    const duro = crearLuchador('b', 'b', 'enemigo', { nombre: 'B', base: { ps: 30, atq: 1, def: 99, vel: 5 }, crece: { ps: 0, atq: 0, def: 0, vel: 0 } }, 1);
    expect(dano(fuerte, duro, 10, () => 0.5).n).toBe(1);
    const otro = crearLuchador('c', 'c', 'enemigo', { nombre: 'C', base: { ps: 30, atq: 5, def: 4, vel: 5 }, crece: { ps: 0, atq: 0, def: 0, vel: 0 } }, 1);
    const normal = dano(fuerte, otro, 10, () => 0.5).n;
    fuerte.extra = 6;
    expect(dano(fuerte, otro, 10, () => 0.5).n).toBeGreaterThan(normal);
  });

  it('el jefe se retira al 30 % de sus PS', () => {
    const d = BATALLAS.bastion;
    const e = d.enemigos[d.jefe.enemigo];
    const jefe = crearLuchador('s', d.jefe.enemigo, 'enemigo', e, d.jefe.nivel);
    expect(seRetira(jefe, e)).toBe(false);
    jefe.ps = Math.floor(jefe.psMax * 0.3);
    expect(seRetira(jefe, e)).toBe(true);
  });

  it('Nikki remata con su especial al que está por caer y a veces hace un clon de sombra (más débil, sin especiales, se evapora)', () => {
    const d = BATALLAS.nikki;
    const en = d.enemigos.nikki;
    const nikki = crearLuchador('n', 'nikki', 'enemigo', en, d.jefe.nivel);
    const jair = crearLuchador('j', 'jair', 'heroe', d.personajes.jair, d.personajes.jair.nivel);
    // Con poca barra y Jair entero: nada.
    nikki.carga = 40;
    expect(eligeEspecial(nikki, en, [jair], [nikki])).toBeNull();
    // Desde media barra, a veces el clon.
    nikki.carga = en.clon!.carga!;
    expect(eligeEspecial(nikki, en, [jair], [nikki], () => 0)?.tipo).toBe('clon');
    // Jair por caer: el especial, contra él.
    nikki.carga = en.remata!.carga;
    jair.ps = Math.floor(jair.psMax * en.remata!.vida);
    expect(eligeEspecial(nikki, en, [jair], [nikki])).toEqual({ tipo: 'especial', blanco: jair });
    // Barra llena, Jair entero: el clon (con azar bajo) o el especial (con azar alto).
    jair.ps = jair.psMax;
    nikki.carga = 100;
    expect(eligeEspecial(nikki, en, [jair], [nikki], () => 0)?.tipo).toBe('clon');
    expect(eligeEspecial(nikki, en, [jair], [nikki], () => 0.9)?.tipo).toBe('especial');
    const clon = crearClon(nikki, en.clon!, 'c');
    expect(clon.atq).toBeLessThan(nikki.atq);
    expect(clon.psMax).toBe(Math.round(nikki.psMax * en.clon!.costo));
    expect(clon.clon).toBe(en.clon!.turnos + 1);
    // Con un clon ya en pie no hace otro, y el clon no usa especiales.
    expect(eligeEspecial(nikki, en, [jair], [nikki, clon], () => 0)?.tipo).toBe('especial');
    clon.carga = 100;
    expect(eligeEspecial(clon, en, [jair], [nikki, clon])).toBeNull();
    // Si gastar la vida la deja al borde de retirarse, no lo hace.
    nikki.ps = Math.ceil(nikki.psMax * ((en.huye_a ?? 0) + 0.2));
    expect(eligeEspecial(nikki, en, [jair], [nikki], () => 0)?.tipo).toBe('especial');
  });
});
