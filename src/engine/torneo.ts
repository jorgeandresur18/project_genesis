import type { Vars } from './types';
// El Torneo Genesis (docs/BIBLIA_RPG.md, sección 17): copas de dificultad creciente, simple/doble/triple, cuatro
// rondas hasta la final contra Nikki (la campeona), premios en tokens que van a PayFoe. En cada copa todos pelean al
// mismo nivel. Los datos (de relleno por ahora) están en src/data/rpg/torneo.json; aquí se arma cada ronda como una
// pelea más para el componente de batalla.
import type { DatosBatalla, Enemigo, Heroe } from './batalla';
import { BATALLAS, FICHAS } from './batallas';
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
}

export const TORNEO = datos as unknown as DatosTorneo;
export const HEROES_TORNEO = ['jair', 'cami', 'rikka'];

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
export function armarRonda(c: Copa, ronda: number, m: Modalidad, heroes: string[], defensas = 0): DatosBatalla {
  const r = TORNEO.rondas[ronda];
  const final = r.jefe === 'nikki';
  const base = final ? BATALLAS.nikki : BATALLAS.bastion;
  const personajes: Record<string, Heroe> = {};
  for (const k of heroes) personajes[k] = { ...(FICHAS.heroes[k] as Heroe), nivel: c.nivel };
  const enemigos: Record<string, Enemigo> = {
    soldado: FICHAS.enemigos.soldado,
    soldado_veterano: soldadoVeterano(),
    capitan: FICHAS.enemigos.capitan,
    nikki: nikkiCampeona(),
  };
  const n = r.horda ? m.rivales + r.extra : 0;
  const nivelRival = Math.round(c.nivel * (1 + (m.nivel_rivales ?? 0)));
  const nivelJefe = final ? Math.round(nivelRival * (1 + TORNEO.nikki.nivel_extra)) + defensas * TORNEO.nikki.por_defensa : nivelRival;
  const reemplazar = (ls: Linea[]) =>
    ls.map((l) => ({ ...l, texto: l.texto.replace('{ronda}', `${c.nombre}, ${r.nombre}`).replace('{defensa}', String(defensas + 1)) }));
  const dialogos: Record<string, Linea[]> = { ...base.dialogos };
  for (const [k, ls] of Object.entries(TORNEO.dialogos)) if (k !== 'inicio_final') dialogos[k] = reemplazar(ls);
  if (final) dialogos.inicio = reemplazar(TORNEO.dialogos.inicio_final);
  return {
    ...base,
    titulo: `${c.nombre} · ${r.nombre}`,
    heroes,
    personajes,
    enemigos,
    horda: { enemigo: r.horda ?? r.jefe, al_inicio: n, niveles: Array.from({ length: n }, () => nivelRival) },
    jefe: { enemigo: r.jefe, nivel: nivelJefe },
    objetos: FICHAS.objetos,
    retratos: { ...FICHAS.retratos, 'Nikki, la campeona': FICHAS.retratos.Nikki, 'Soldado veterano': FICHAS.retratos.Soldado },
    mochila_inicial: TORNEO.mochila,
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
