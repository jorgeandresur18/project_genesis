import type { Vars } from './types';
// El Torneo Genesis (docs/BIBLIA_RPG.md, sección 17): copas de dificultad creciente, simple/doble/triple, cuatro
// rondas hasta la final contra Nikki (la campeona), premios en tokens que van a PayFoe. En cada copa todos pelean al
// mismo nivel. Los datos (de relleno por ahora) están en src/data/rpg/torneo.json; aquí se arma cada ronda como una
// pelea más para el componente de batalla.
import type { DatosBatalla, Enemigo, Heroe, Stats } from './batalla';
import { BATALLAS, FICHAS } from './batallas';
import { scenes } from './story';
import datos from '../data/rpg/torneo.json';

export interface Copa {
  id: string;
  nombre: string;
  nivel: number;
  /** Se abre al visitar esta escena (la primera copa: el final del Capítulo 1). */
  desbloqueo?: string;
  /** O al ganar esta otra copa. */
  requiere?: string;
  /** Lo que paga cada ronda (la última es la final). */
  premios: number[];
}
export interface Modalidad {
  id: string;
  nombre: string;
  peleadores: number;
  rivales: number;
  /** Cuánto más nivel tienen los rivales, como parte del nivel de la copa (0,3 = 30 % más): con tres peleadores, más fuertes. */
  nivel_rivales?: number;
  multiplicador: number;
  /** Cuántos objetos entran en la mochila de combate (decisión del autor, 2026-11-06: varía con la modalidad). */
  mochila_combate?: number;
}
export interface Ronda {
  nombre: string;
  /** El enemigo de la horda (null: solo el jefe, como la final). */
  horda: string | null;
  /** Rivales de más, además de los de la modalidad. */
  extra: number;
  jefe: string;
}
type Linea = { quien: string; texto: string };
export interface DatosTorneo {
  copas: Copa[];
  modalidades: Modalidad[];
  rondas: Ronda[];
  /** `nivel_extra`: cuánto más nivel tiene la campeona, como parte del nivel de la copa (sobre el de los rivales). */
  nikki: { nivel_extra: number; por_defensa: number; huye_a: number };
  mochila: Record<string, number>;
  dialogos: Record<string, Linea[]>;
  /** Lo que dicen los jefes de la torre al «Hablar» cuando los usa el jugador. */
  hablar_jefes: Record<string, string[] | string>;
  /** Con qué números pelea cada jefe de la torre en manos del jugador: los del héroe de su estilo, por `factor`. */
  estilo_jefes: Record<string, { heroe: string; factor: number } | string>;
  /** Lo que lleva puesto cada peleador (sus prendas y su amuleto). */
  equipo_peleadores: Record<string, string[] | string>;
  /** Qué pelea de la historia abre a cada peleador («libre»: desde el inicio; null: todavía no). */
  desbloqueo_peleadores: Record<string, string[] | string | null>;
  /** Los rivales que se sortean en cada ronda (salvo la gran final) y lo bajos que salen los personajes. */
  rivales: { jefes: string[]; companeros: string[]; nivel_por_ronda: number[]; /** Los compañeros personajes, un poco más bajos (pegan más que un soldado). */ nivel_companeros?: number };
}

export const TORNEO = datos as unknown as DatosTorneo;
export const HEROES_TORNEO = ['jair', 'cami', 'rikka', 'jordy', 'billy', 'maggie', 'influencer', 'otaku'];
/** Ya no se usa para desbloquear (ver `peleadorAbierto`): los peleadores que todavía no salen en la historia. */
export const LIBRES_TORNEO = ['jordy', 'billy', 'maggie', 'influencer', 'otaku'];
/** Nikki también pelea en el torneo, desde el inicio (pedido del autor, 2026-11-05). */
export const NIKKI_PELEADORA = 'nikki';
/** El Rey Malvado como peleador: al terminar el Capítulo 6, solo THE KING (decisión del autor, 2026-11-06). */
export const REY_PELEADOR = 'rey';

/**
 * Si un peleador ya se puede elegir: después de su pelea RPG en la historia (decisión del autor, 2026-11-06), es decir,
 * si alguna escena con esa pelea se visitó en alguna partida. Ver `desbloqueo_peleadores` en torneo.json.
 */
export function peleadorAbierto(k: string, visitadas: Record<string, unknown>): boolean {
  const d = TORNEO.desbloqueo_peleadores[k];
  if (d === 'libre') return true;
  if (!Array.isArray(d)) return false;
  for (const sc of scenes.values()) if (sc.batalla && d.includes(sc.batalla) && visitadas[sc.scene_id]) return true;
  return false;
}
/**
 * Los jefes de los pisos de la torre del Capítulo 3: se pueden elegir en el torneo al vencerlos en la torre (decisión
 * del autor, 2026-11-05; los enemigos comunes, no).
 */
export const JEFES_TORRE = ['reina_bichos', 'jefe_bodega', 'sargento', 'chef', 'maestro_herrero', 'alcaide', 'intendente', 'comandante'];

/** Un jefe de la torre (o Nikki) como peleador del jugador: sus números, sus ataques (sin lo que solo sabe hacer la máquina) y su especial. */
function jefeComoPeleador(k: string): Omit<Heroe, 'nivel'> {
  const e = FICHAS.enemigos[k];
  // Del ataque se quedan el golpe, a quién va y su efecto (confundir, paralizar); las ráfagas de balas son del dibujo de la máquina.
  const ataques = e.ataques.map((a) => {
    const { balas: _b, rafagas: _r, peso: _p, ...resto } = a as typeof a & { balas?: unknown; rafagas?: unknown };
    return resto;
  });
  const esp = e.especial ? { ...e.especial } : undefined;
  const hablar = TORNEO.hablar_jefes[k];
  // Números de héroe (decisión del autor, 2026-11-06): la vida, el ataque, la defensa y la velocidad del héroe de su
  // estilo, no los de jefe (hechos para pelear contra tres). Los ataques y el especial siguen siendo los suyos.
  const estilo = TORNEO.estilo_jefes[k];
  const comoHeroe = typeof estilo === 'object' ? FICHAS.heroes[estilo.heroe] : undefined;
  const por = (x: Stats, n: number): Stats => ({ ps: x.ps * n, atq: x.atq * n, def: x.def * n, vel: x.vel });
  const base = comoHeroe && typeof estilo === 'object' ? por(comoHeroe.base, estilo.factor) : e.base;
  const crece = comoHeroe && typeof estilo === 'object' ? por(comoHeroe.crece, estilo.factor) : e.crece;
  return {
    nombre: e.nombre,
    sprite: e.sprite,
    seguido: true,
    base,
    crece,
    ataques,
    especial: esp,
    distancia: !!(e as Enemigo & { distancia?: unknown }).distancia,
    escala: e.escala,
    sonido: e.sonido,
    hablar: Array.isArray(hablar) ? hablar : ['…'],
  };
}

/** La ficha de cualquier peleador del torneo: un héroe o un jefe de la torre. */
export const fichaPeleador = (k: string): Omit<Heroe, 'nivel'> => (FICHAS.heroes[k] ?? jefeComoPeleador(k)) as Omit<Heroe, 'nivel'>;

/** Si una copa está abierta: por su escena de desbloqueo (visitada en alguna partida) o por haber ganado la anterior. */
export function copaAbierta(c: Copa, visitadas: Record<string, unknown>, ganadas: Record<string, number>): boolean {
  if (c.desbloqueo) return !!visitadas[c.desbloqueo];
  if (c.requiere) return (ganadas[c.requiere] ?? 0) > 0;
  return true;
}

/** Lo que paga una ronda: el premio de la copa por el multiplicador de la modalidad (más peleadores, menos premio). */
export const premioDe = (c: Copa, ronda: number, m: Modalidad) => Math.round((c.premios[ronda] ?? 0) * m.multiplicador);

/** El soldado que cierra las primeras rondas: un soldado que se rinde cuando está débil (así termina la ronda). */
const soldadoVeterano = (): Enemigo => ({ ...FICHAS.enemigos.soldado, nombre: 'Soldado veterano', jefe: true, huye_a: 0.3 });

/** Nikki campeona: sin el perdón del bar (en el torneo se pelea hasta el final). */
const nikkiCampeona = (): Enemigo => {
  const { perdon: _perdon, ...resto } = FICHAS.enemigos.nikki;
  // Aguanta casi hasta el final (en el bar se va a la mitad): es la campeona.
  // Si gana, festeja (en el bar, si gana, llora: eso es de la historia).
  return { ...resto, nombre: 'Nikki, la campeona', huye_a: TORNEO.nikki.huye_a, al_ganar: 'victoria' };
};

/**
 * Una ronda del torneo como una pelea más: los héroes elegidos y los rivales, todos al nivel de la copa (Nikki, más:
 * es la campeona y sube con cada defensa del título).
 */
/** Un azar con semilla (el mismo torneo, los mismos cruces). */
function azarDe(semilla: string) {
  let a = [...semilla].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
/** Las fichas de enemigo que ya existen (los demás rivales son personajes). */
const ENEMIGOS_TORNEO = ['soldado', 'soldado_veterano', 'capitan'];

/**
 * Un personaje como rival: su ficha de peleador (números, ataques y especial), sin lo que solo sabe usar el jugador
 * (cebos, curarse, la bomba). El jefe de la ronda se rinde al final, como todos los jefes.
 */
function rivalComoEnemigo(k: string, jefe: boolean): Enemigo {
  const f = fichaPeleador(k);
  const ataques = f.ataques.filter((a) => !a.cebo && !a.cura && !a.alMismo && !a.aplica && !a.autodestruccion);
  const especial = f.especial && !f.especial.bomba ? f.especial : undefined;
  return {
    nombre: f.nombre,
    sprite: f.sprite,
    base: f.base,
    crece: f.crece,
    ataques: ataques.length ? ataques : [{ nombre: 'Golpe', poder: 5, texto: '{quien} le pega a {objetivo}.' }],
    especial,
    escala: f.escala,
    sonido: f.sonido,
    distancia: f.distancia,
    filtro: f.filtro,
    cae_en_cebo: 0.5,
    ...(jefe ? { jefe: true, huye_a: 0.3 } : {}),
  } as Enemigo;
}

export function armarRonda(
  c: Copa,
  ronda: number,
  m: Modalidad,
  heroes: string[],
  defensas = 0,
  semilla?: string,
  /** Lo del jugador (engine/mochilaTorneo.ts): lo que lleva puesto cada peleador y la mochila con que entra. */
  bolsa?: { equipo?: Record<string, string[]>; mochila?: Record<string, number> },
): DatosBatalla {
  const r = TORNEO.rondas[ronda];
  const final = r.jefe === 'nikki';
  const base = final ? BATALLAS.nikki : BATALLAS.bastion;
  const personajes: Record<string, Heroe> = {};
  // Se puede repetir personaje (decisión del autor): la ficha es una sola por clave.
  for (const k of heroes) personajes[k] = { ...(fichaPeleador(k) as Heroe), nivel: c.nivel };
  const enemigos: Record<string, Enemigo> = {
    soldado: FICHAS.enemigos.soldado,
    soldado_veterano: soldadoVeterano(),
    capitan: FICHAS.enemigos.capitan,
    nikki: nikkiCampeona(),
  };
  // Equipos parejos (pedido del autor, 2026-11-05): el jefe de la ronda sale de entrada con `m.rivales` de su horda, así
  // hay tantos rivales como peleadores (3 contra 3 en Triple). Los de más (`extra`) llegan de refuerzo cuando cae uno;
  // en Simple, el jefe pelea solo.
  const alInicio = r.horda ? m.rivales : 0;
  const n = alInicio ? alInicio + r.extra : 0;
  const nivelRival = Math.round(c.nivel * (1 + (m.nivel_rivales ?? 0)));
  const nivelJefe = final ? Math.round(nivelRival * (1 + TORNEO.nikki.nivel_extra)) + defensas * TORNEO.nikki.por_defensa : nivelRival;
  // Rivales variados (pedido del autor, 2026-11-06): con la semilla del torneo, cada ronda menos la gran final sortea su
  // rival y sus compañeros. Sin semilla (las pruebas), las rondas de siempre.
  let jefeK = r.jefe;
  let hordaK = r.horda ?? r.jefe;
  let nivelJ = nivelJefe;
  let nivelH = nivelRival;
  if (semilla && !final) {
    const azar = azarDe(`${semilla}|${c.id}|${m.id}|${ronda}`);
    const elegir = (l: string[]) => l[Math.floor(azar() * l.length)];
    const factor = TORNEO.rivales.nivel_por_ronda[ronda] ?? 1;
    const j = elegir(TORNEO.rivales.jefes);
    const h = elegir(TORNEO.rivales.companeros);
    if (!ENEMIGOS_TORNEO.includes(j)) {
      jefeK = `rival_${j}`;
      enemigos[jefeK] = rivalComoEnemigo(j, true);
      nivelJ = Math.max(1, Math.round(nivelRival * factor));
    } else jefeK = j;
    if (!ENEMIGOS_TORNEO.includes(h)) {
      hordaK = `rival_${h}_c`;
      enemigos[hordaK] = rivalComoEnemigo(h, false);
      nivelH = Math.max(1, Math.round(nivelRival * factor * (TORNEO.rivales.nivel_companeros ?? 1)));
    } else hordaK = h;
  }
  const reemplazar = (ls: Linea[]) =>
    ls.map((l) => ({ ...l, texto: l.texto.replace('{ronda}', `${c.nombre}, ${r.nombre}`).replace('{defensa}', String(defensas + 1)) }));
  const dialogos: Record<string, Linea[]> = { ...base.dialogos };
  for (const [k, ls] of Object.entries(TORNEO.dialogos)) if (k !== 'inicio_final') dialogos[k] = reemplazar(ls);
  if (final) dialogos.inicio = reemplazar(TORNEO.dialogos.inicio_final);
  return {
    ...base,
    titulo: `${c.nombre} · ${r.nombre}`,
    // Las esencias: las de este torneo (otro torneo, otras).
    semilla_esencia: semilla,
    heroes,
    personajes,
    enemigos,
    horda: { enemigo: hordaK, al_inicio: alInicio, niveles: Array.from({ length: n }, () => nivelH) },
    jefe: { enemigo: jefeK, nivel: nivelJ },
    jefe_con_horda: true,
    objetos: FICHAS.objetos,
    retratos: { ...FICHAS.retratos, 'Nikki, la campeona': FICHAS.retratos.Nikki, 'Soldado veterano': FICHAS.retratos.Soldado },
    mochila_inicial: bolsa?.mochila ?? TORNEO.mochila,
    // Lo que lleva puesto cada peleador (decisión del autor, 2026-11-06: en el torneo sí hay objetos y amuletos).
    equipo_fijo: Object.fromEntries(heroes.map((k) => [k, bolsa?.equipo?.[k] ?? TORNEO.equipo_peleadores[k]]).filter((x): x is [string, string[]] => Array.isArray(x[1]))),
    huir: false,
    ayuda: undefined,
    premio: undefined,
    vida_real: undefined,
    dialogos,
  } as DatosBatalla;
}

/** La primera vez que se gana cada copa se gana también la bomba del día del juicio (docs/BIBLIA_RPG.md, sección 19). */
export const ganaBomba = (ganadas: Record<string, number>, copa: string) => !ganadas[copa];
/** El torneo está fuera de las partidas: el jugador elige en cuál guardada queda el cassette. */
export function conBomba<T extends { vars: Vars }>(partida: T): T {
  const n = typeof partida.vars.cassette_bomba_juicio === 'number' ? partida.vars.cassette_bomba_juicio : 0;
  return { ...partida, vars: { ...partida.vars, cassette_bomba_juicio: n + 1 } };
}
