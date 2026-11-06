/**
 * La lógica de turnos de la pelea, sin dibujo (etapa 2 de partir `Batalla.tsx`; docs/BIBLIA_RPG.md).
 *
 * Aquí está lo que decide la pelea y no espera animaciones: con qué estado empieza, qué hace cada enemigo en su
 * turno, a quién le pega cuando hay cebos y cómo bajan los estados al final del turno. `Batalla.tsx` llama a estas
 * funciones y se encarga de mostrar lo que pasó (mensajes, sprites, sonidos). Las cuentas de cada golpe siguen en
 * `engine/batalla.ts`.
 */
import {
  CARGA,
  CEBO,
  QUEMADO,
  cargar,
  crearClon,
  crearLuchador,
  dano,
  eligeAtaque,
  eligeEspecial,
  gastarUso,
  quedan,
  repartirRafagas,
  seConfunde,
  seRetira,
  noActua,
  ponerEsencia,
  esenciaDe,
  turnosDormido,
  usarObjeto,
  vanPerdiendo,
  enCampo,
  vivo,
  yaTiene,
  type Ataque,
  type DatosBatalla,
  type Enemigo,
  type Deja,
  type Especial,
  type Luchador,
  type Progreso,
} from './batalla';
import { sortearEsencia } from './esencia';
import { FICHAS } from './batallas';
import { bonos, puestosDe } from './equipo';

/** Un cebo en pie: la copia del héroe `de`, dónde se dibuja y cuántos turnos le quedan. */
export interface CeboEnPie {
  l: Luchador;
  de: string;
  x: number;
  y: number;
  turnos: number;
}

/** El estado de una pelea: lo cambian las acciones, en orden. */
export interface EstadoPelea {
  /** La semilla de las esencias (la partida o el torneo); sin ella, nadie tiene esencia (las pruebas de siempre). */
  semilla?: string;
  /** Cuántos enemigos ya sortearon su esencia en esta pelea. */
  sorteos?: number;
  heroes: Luchador[];
  enemigos: Luchador[];
  /** Las monedas de la partida (lo que traía más lo que se gana en esta pelea). */
  monedas: number;
  mochila: Record<string, number>;
  /** La mochila de combate del rival (el torneo; ver `mochila_rival`). */
  mochilaRival?: Record<string, number>;
  /** Cuántos de la horda ya salieron. */
  salieron: number;
  /** Los héroes que atacaron el turno anterior (los que no pueden repetir, descansan este). */
  actuaron: string[];
  /** Cuántos turnos seguidos se le habló al rival que perdona (Nikki), y si ya perdonó. */
  racha: number;
  perdona: boolean;
  /** Quién le pidió perdón a Nikki y después la atacó (la Mega Bola Tóxica va contra él). */
  traicion: string | null;
  /** A quién remata Nikki después de la Mega Bola (su próxima cachetada no falla, aunque esquive). */
  remate: string | null;
  /** Los que quedaron paralizados (o confundidos) en este turno (empiezan a descontar en el siguiente). */
  paralizadoRecien: string[];
  confundidoRecien: string[];
  /** Los que quedaron congelados o dormidos en este turno (`<id>/<estado>`): empiezan a descontar en el siguiente. */
  estadoRecien: string[];
  /** La bomba en el campo: quién la puso, cuántos turnos le quedan y qué parte de la vida máxima quita. */
  bomba: { de: string; turnos: number; vida: number } | null;
  /** Los cassettes sueltos que cayeron en esta pelea. */
  cassettesGanados: string[];
  /** Los cebos (copias de un héroe que no hacen nada): aparte de los héroes, con dónde se dibujan. */
  cebos: CeboEnPie[];
  /** Los que no pueden actuar en este turno (Cami, un turno sí y uno no). */
  descansan: string[];
  /** Los que se ven descansando (Cami agachada): desde que actúan hasta el final del turno siguiente. */
  cansados: Set<string>;
  avisoRefuerzos: boolean;
  avisoCaida: boolean;
}

/**
 * Con qué empieza la pelea: los héroes con el nivel y la experiencia que traen (o los del .json) y la mochila de la
 * partida; si la pelea da una mochila inicial, se completa hasta esa cantidad (p. ej. un revivir).
 * `progreso` ya llega vacío en la vida real (el bar): ahí no cuentan los niveles ni la mochila del juego.
 */
export function estadoInicial(d: DatosBatalla, progreso?: Progreso, semilla?: string): EstadoPelea {
  // Dos iguales (el torneo deja repetir personaje): el segundo es «jair#2», el tercero «jair#3»; la clave sigue igual.
  const vistos: Record<string, number> = {};
  return {
    semilla,
    sorteos: 0,
    heroes: d.heroes.map((k) => {
      const n = (vistos[k] = (vistos[k] ?? 0) + 1);
      const h = crearLuchador(n > 1 ? `${k}#${n}` : k, k, 'heroe', d.personajes[k], progreso?.heroes[k]?.nivel || d.personajes[k].nivel, progreso?.heroes[k]?.xp ?? 0);
      // Su esencia (oculta): la misma toda la partida (o el torneo) para este personaje.
      if (semilla) ponerEsencia(h, sortearEsencia(`${semilla}|heroe|${k}|${n}`, true));
      // Lo que subió para siempre (el CeBiDol) y lo que lleva puesto: van en `extra` para que subir de nivel no lo borre.
      const ref = progreso?.refuerzos?.[k];
      if (ref) {
        h.extra += ref.atq;
        h.extraDef += ref.def;
      }
      const ropa = [...puestosDe(progreso, k), ...(d.equipo_fijo?.[k] ?? [])];
      if (ropa.length) {
        const { atq, def, ...resto } = bonos(ropa, FICHAS.objetos);
        h.extra += atq;
        h.extraDef += def;
        h.equipo = resto;
      }
      return h;
    }),
    enemigos: [],
    monedas: progreso?.monedas ?? 0,
    mochilaRival: { ...(d.mochila_rival ?? {}) },
    mochila: Object.fromEntries(
      [...new Set([...Object.keys(progreso?.mochila ?? {}), ...Object.keys(d.mochila_inicial ?? {})])].map((k) => [
        k,
        Math.max(progreso?.mochila[k] ?? 0, d.mochila_inicial?.[k] ?? 0),
      ]),
    ) as Record<string, number>,
    salieron: 0,
    actuaron: [],
    racha: 0,
    perdona: false,
    traicion: null,
    remate: null,
    paralizadoRecien: [],
    confundidoRecien: [],
    estadoRecien: [],
    bomba: null,
    cassettesGanados: [],
    cebos: [],
    descansan: [],
    cansados: new Set<string>(),
    avisoRefuerzos: false,
    avisoCaida: false,
  };
}

const alAzar = <T>(lista: T[], azar: () => number) => lista[Math.floor(azar() * lista.length)];

/**
 * A veces el golpe a uno solo va al cebo (según cuánto cae en él quien ataca: `caeEnCebo`). Un golpe a varios
 * también les pega a todos los cebos en pie.
 */
export function desviarACebo(estado: EstadoPelea, blancos: Luchador[], caeEnCebo = CEBO, azar: () => number = Math.random): Luchador[] {
  const cebos = estado.cebos.map((x) => x.l).filter(vivo);
  if (!cebos.length) return blancos;
  if (blancos.length > 1) return [...blancos, ...cebos];
  return azar() < caeEnCebo ? [alAzar(cebos, azar)] : blancos;
}

/** Lo que decide un enemigo en su turno. `Batalla.tsx` lo muestra. */
export type DecisionEnemigo =
  /** Sigue paralizado: no hace nada. */
  | { tipo: 'paralizado' }
  /** Está congelado o dormido: no hace nada. */
  | { tipo: 'congelado' }
  | { tipo: 'dormido' }
  /** Está confundido y se pega a sí mismo. */
  | { tipo: 'confundido' }
  /** Lo distrajeron con «Hablar»: pierde este ataque. */
  | { tipo: 'distraido' }
  /** Después de la Mega Bola de la traición: la cachetada que remata, que no falla aunque esquive. */
  | { tipo: 'remate'; blanco: Luchador; golpe: Ataque }
  /** La Mega Bola Tóxica (contra el traidor, si lo hay). */
  | { tipo: 'bola'; traidor?: Luchador }
  /** El clon de sombra. */
  | { tipo: 'clon' }
  /** Su especial, contra `blanco` (ya desviado a un cebo si tocaba). */
  | { tipo: 'especial'; especial: Especial; blanco: Luchador }
  /** Un ataque normal (ya gastó el uso), contra `blancos` (ya repartidos o desviados). */
  | { tipo: 'ataque'; ataque: Ataque; blancos: Luchador[] }
  /** Usó un objeto de su mochila de combate en un compañero (o en sí mismo): ya curó `n`. */
  | { tipo: 'objeto'; objeto: string; blanco: Luchador; n: number }
  /** No le queda ningún ataque posible: espera. */
  | { tipo: 'nada' };

/**
 * Qué hace el enemigo `e` en su turno. Cambia el estado igual que antes lo hacía `Batalla.tsx` (carga su barra, gasta
 * la distracción, el remate o la traición y el uso del ataque) y devuelve lo que hay que mostrar.
 * `arena`: en la arena de prueba la Mega Bola sale al azar, aunque sea solo por traición.
 */
/** Por debajo de esta parte de su vida, el rival piensa en curar a uno de los suyos (y lo hace a veces). */
const CURA_RIVAL = { umbral: 0.35, probabilidad: 0.7 };
function curaDelRival(estado: EstadoPelea, d: DatosBatalla, azar: () => number): DecisionEnemigo | null {
  const bolsa = estado.mochilaRival;
  if (!bolsa) return null;
  const objeto = Object.keys(bolsa).find((k) => bolsa[k] > 0 && d.objetos[k] && (d.objetos[k].ps || d.objetos[k].cura_toda) && !d.objetos[k].revive);
  if (!objeto) return null;
  const bajos = estado.enemigos.filter((x) => vivo(x) && x.clon === undefined && !x.desterrado && x.ps < x.psMax * CURA_RIVAL.umbral);
  if (!bajos.length || azar() >= CURA_RIVAL.probabilidad) return null;
  const blanco = bajos.sort((a, b) => a.ps / a.psMax - b.ps / b.psMax)[0];
  bolsa[objeto]--;
  const n = usarObjeto(d.objetos[objeto], blanco);
  return { tipo: 'objeto', objeto, blanco, n };
}

export function decidirEnemigo(
  estado: EstadoPelea,
  d: DatosBatalla,
  e: Luchador,
  arena = false,
  azar: () => number = Math.random,
): DecisionEnemigo {
  cargar(e, CARGA.turnoEnemigo);
  if (e.paralizado > 0) return { tipo: 'paralizado' };
  if (e.congelado > 0) return { tipo: 'congelado' };
  if (e.dormido > 0) return { tipo: 'dormido' };
  if (seConfunde(e, azar)) return { tipo: 'confundido' };
  if (e.distraido) {
    e.distraido = false;
    return { tipo: 'distraido' };
  }
  const en = d.enemigos[e.clave];
  const hs = estado.heroes.filter(enCampo);
  if (!hs.length) return { tipo: 'nada' };
  // La mochila de combate del rival: si uno de los suyos quedó bajo de vida, a veces lo cura (como haría el jugador).
  const cura = curaDelRival(estado, d, azar);
  if (cura) return cura;
  const esp = en.especial;
  const bola = en.bola_toxica;
  const rematado = bola && estado.remate ? estado.heroes.find((x) => x.id === estado.remate && vivo(x)) : undefined;
  if (rematado) {
    estado.remate = null;
    const golpe = en.ataques.find((x) => !x.confunde && !x.paraliza && !x.cebo)!;
    return { tipo: 'remate', blanco: rematado, golpe };
  }
  const traidor = bola && estado.traicion ? estado.heroes.find((x) => x.id === estado.traicion && vivo(x)) : undefined;
  if (traidor) {
    estado.traicion = null;
    return { tipo: 'bola', traidor };
  }
  const caeEnCebo = en.cae_en_cebo ?? CEBO;
  const elige = eligeEspecial(e, en, estado.heroes, estado.enemigos, azar, !bola?.solo_traicion || arena);
  if (elige?.tipo === 'clon') return { tipo: 'clon' };
  if (elige?.tipo === 'bola') return { tipo: 'bola' };
  const especialElegido = elige?.tipo === 'especial' ? (elige.especial ?? esp) : undefined;
  if (especialElegido) {
    const blanco = desviarACebo(estado, [elige!.blanco ?? alAzar(hs, azar)], caeEnCebo, azar)[0];
    return { tipo: 'especial', especial: especialElegido, blanco };
  }
  // La parálisis solo va contra los que todavía se mueven (si nadie se mueve, ataca de otra forma).
  // Si no le queda ningún ataque posible (solo de efecto y ya todos lo tienen), espera.
  const elegido = eligeAtaque(
    en.ataques.filter((a) => quedan(e, a) > 0 && !(hs.some((x) => x.envenenado && x.ps <= 2) && (a.confunde || a.paraliza))),
    hs,
    azar,
  );
  if (!elegido) return { tipo: 'nada' };
  const { ataque: a } = elegido;
  // Las ráfagas (la sombra) se reparten: una a cada uno y las que sobran al azar.
  const blancos = a.rafagas
    ? repartirRafagas(a.rafagas, estado.heroes.filter(enCampo), azar)
    : a.confunde || a.paraliza
      ? elegido.blancos
      : desviarACebo(estado, elegido.blancos, caeEnCebo, azar);
  gastarUso(e, a);
  return { tipo: 'ataque', ataque: a, blancos };
}

/**
 * Al final del turno: nadie sigue esquivando y bajan los estados. La parálisis se cuenta por turnos en que no pudo
 * actuar (la de este turno, recién desde el siguiente) y, al terminar (como el sueño y el hielo), deja un turno libre; la confusión baja
 * igual (la de este turno, desde el siguiente).
 */
export function finDeTurno(estado: EstadoPelea) {
  estado.heroes.forEach((h) => (h.esquivando = false));
  // Seguidores (el influencer): el que no se lució en este turno pierde uno.
  [...estado.heroes, ...estado.enemigos].forEach((h) => {
    if (h.seguidores && !h.lucio) {
      h.seguidores--;
      h.extra -= h.atqSeguidor ?? 0;
    }
    h.lucio = false;
  });
  [...estado.heroes, ...estado.enemigos].forEach((h) => {
    // Desterrado: solo descuenta el destierro; lo demás queda en pausa hasta que vuelve.
    if (h.desterrado) {
      if (!estado.estadoRecien.includes(`${h.id}/desterrado`)) h.desterrado--;
      return;
    }
    if (h.inmuneParalisis) h.inmuneParalisis--;
    if (h.paralizado && !estado.paralizadoRecien.includes(h.id) && --h.paralizado === 0) h.inmuneParalisis = 1;
    if (h.confundido && !estado.confundidoRecien.includes(h.id)) h.confundido--;
    if (h.congelado && !estado.estadoRecien.includes(`${h.id}/congelado`) && --h.congelado === 0) h.inmuneParalisis = 1;
    if (h.dormido && !estado.estadoRecien.includes(`${h.id}/dormido`) && --h.dormido === 0) h.inmuneParalisis = 1;
  });
  estado.paralizadoRecien = [];
  estado.confundidoRecien = [];
  estado.estadoRecien = [];
}

/** Un enemigo entra a la pelea (con algo de barra cargada); los caídos dejan de estar en la lista. */
export function sumarEnemigo(estado: EstadoPelea, d: DatosBatalla, clave: string, nivel: number, azar: () => number = Math.random): Luchador {
  const e = crearLuchador(`${clave}-${estado.enemigos.length}-${Date.now()}`, clave, 'enemigo', d.enemigos[clave], nivel);
  // Su esencia (oculta): los jefes, de verdad; los de la horda, baja (casi no se nota).
  if (estado.semilla) ponerEsencia(e, sortearEsencia(`${estado.semilla}|${d.titulo}|${clave}|${(estado.sorteos = (estado.sorteos ?? 0) + 1)}`, !!d.enemigos[clave].jefe));
  e.carga = Math.floor(azar() * 40);
  estado.enemigos = [...estado.enemigos.filter(vivo), e];
  return e;
}

/** Si al caer `e` llega otro de la horda: solo los de la horda, y mientras queden. */
export const llegaRefuerzo = (estado: EstadoPelea, d: DatosBatalla, e: Luchador) => e.clave === d.horda.enemigo && estado.salieron < d.horda.niveles.length;

/** Se lució (crítico o derribó a alguien): si junta seguidores, gana uno (hasta su máximo). Devuelve si ganó. */
export function lucirse(d: DatosBatalla, x: Luchador): boolean {
  const s = (x.lado === 'heroe' ? d.personajes[x.clave] : d.enemigos[x.clave])?.seguidores;
  if (!s) return false;
  x.lucio = true;
  if ((x.seguidores ?? 0) >= s.max) return false;
  x.seguidores = (x.seguidores ?? 0) + 1;
  x.atqSeguidor = s.atq;
  x.extra += s.atq;
  return true;
}

/**
 * Un golpe, sin dibujo: la protección lo bloquea (y se gasta); si no, resta PS y carga la barra de quien lo recibe.
 * Si los héroes van perdiendo, los suyos son críticos más seguido. El jefe que se retira nunca llega a 0 (su clon, sí).
 * `aMedias`: un especial al que eligió esquivar (no se esquiva, pero le hace la mitad).
 */
export function resolverGolpe(
  estado: EstadoPelea,
  d: DatosBatalla,
  atacante: Luchador,
  defensor: Luchador,
  poder: number,
  aMedias = false,
  azar: () => number = Math.random,
): { n: number; critico: boolean; bloqueado?: boolean; desperto?: boolean } {
  const ayuda = d.ayuda && atacante.lado === 'heroe' && vanPerdiendo(estado.heroes, d.ayuda.umbral) ? d.ayuda.critico : 0;
  // Lo que lleva puesto contra el que duerme o está confundido (los objetos de Maggie).
  const eq = atacante.equipo;
  const dormido = defensor.dormido > 0;
  const confundido = defensor.confundido > 0;
  const extra = ayuda + (eq?.critico ?? 0) + (dormido ? (eq?.criticoDormido ?? 0) : 0) + (confundido ? (eq?.criticoConfundido ?? 0) : 0);
  const masDano = 1 + (dormido ? (eq?.danoDormido ?? 0) : 0) + (confundido ? (eq?.danoConfundido ?? 0) : 0);
  if (defensor.protegido > 0 && atacante !== defensor) {
    defensor.protegido--;
    return { n: 0, critico: false, bloqueado: true };
  }
  const golpe = dano(atacante, defensor, poder, azar, extra);
  const conMas = Math.round(golpe.n * masDano);
  const n = aMedias ? Math.max(1, Math.round(conMas / 2)) : conMas;
  cargar(defensor, CARGA.recibir);
  const jefe = defensor.lado === 'enemigo' ? d.enemigos[defensor.clave] : null;
  defensor.ps = Math.max(jefe?.huye_a && defensor.clon === undefined ? 1 : 0, defensor.ps - n);
  if (defensor.ps === 0) limpiarEstados(defensor);
  if (golpe.critico || (defensor.ps === 0 && !defensor.cebo && atacante !== defensor)) lucirse(d, atacante);
  // Un golpe despierta al dormido (decisión del autor, 2026-11-06), con su turno libre, como cuando se despierta solo.
  if (defensor.dormido > 0 && defensor.ps > 0 && n > 0 && atacante !== defensor) {
    defensor.dormido = 0;
    defensor.inmuneParalisis = 1;
    return { n, critico: golpe.critico, desperto: true };
  }
  return { n, critico: golpe.critico };
}

/** Sin un compañero de pie que lo pueda sacar: el héroe que pelea solo (no los rivales). */
const estaSolo = (estado: EstadoPelea, x: Luchador) => x.lado === 'heroe' && estado.heroes.filter(enCampo).length <= 1;

/** Paraliza: empieza a descontar desde el turno siguiente y reemplaza el descanso (no se suma). */
/** Temple (esencia): a veces, el estado le dura un turno menos (nunca menos de uno). */
const conTemple = (x: Luchador, n: number, azar: () => number = Math.random) => (n > 1 && azar() < esenciaDe(x, 'temple') ? n - 1 : n);
/** Cuánto le dura dormido, congelado o paralizado: al jefe, la mitad (mínimo 1; decisión del autor, 2026-11-06). */
const cuantoNoActua = (estado: EstadoPelea, x: Luchador, azar: () => number) => {
  const n = conTemple(x, turnosDormido(azar, estaSolo(estado, x)), azar);
  return x.jefe ? Math.max(1, Math.ceil(n / 2)) : n;
};

export function paralizarA(estado: EstadoPelea, x: Luchador, azar: () => number = Math.random) {
  x.paralizado = cuantoNoActua(estado, x, azar);
  estado.paralizadoRecien.push(x.id);
  estado.actuaron = estado.actuaron.filter((id) => id !== x.id);
  estado.cansados.delete(x.id);
}

/** Confunde: empieza a descontar desde el turno siguiente. */
export function confundirA(estado: EstadoPelea, x: Luchador, n: number) {
  // La flor de pureza: no se puede confundir.
  if (x.equipo?.sinConfusion) return;
  x.confundido = conTemple(x, n);
  estado.confundidoRecien.push(x.id);
}

/** El clon de sombra: le cuesta vida a quien lo hace y entra a la pelea. Devuelve el clon y lo que costó. */
export function hacerClon(estado: EstadoPelea, c: NonNullable<Enemigo['clon']>, e: Luchador, id: string) {
  const costo = Math.round(e.psMax * c.costo);
  e.ps = Math.max(1, e.ps - costo);
  const clon = crearClon(e, c, id);
  estado.enemigos = [...estado.enemigos.filter(vivo), clon];
  return { clon, costo };
}

/** Al final del turno los clones pierden un turno. Devuelve los que se evaporaron. */
export function evaporarClones(estado: EstadoPelea): Luchador[] {
  const idos: Luchador[] = [];
  for (const k of estado.enemigos.filter((x) => vivo(x) && x.clon !== undefined)) {
    k.clon!--;
    if (k.clon! > 0) continue;
    k.ps = 0;
    idos.push(k);
  }
  return idos;
}

/** El veneno que deja la Mega Bola: al que eligió esquivar le dura un turno menos. No se acumula. */
export function envenenarConBola(x: Luchador, veneno: NonNullable<Enemigo['bola_toxica']>['veneno'], esquivando = false) {
  if (vivo(x) && !x.envenenado) x.envenenado = { ...veneno, turnos: Math.max(1, veneno.turnos - (esquivando ? 1 : 0)) };
}

/**
 * Los golpes del cañón del Capitán, según su hoja: el primer rayo horizontal es el fuerte (a su blanco) y cada barrido
 * nuevo, arriba o abajo u otra vez horizontal, es uno flojo a cualquiera. `ms`: en qué paso de la animación.
 */
export function golpesDelCanon(seq: number[], rayo: Record<string, number[]>, msPaso = 1): { ms: number; fuerte: boolean }[] {
  const grupo = (c: number) => (!rayo[String(c)] ? '' : rayo[String(c)][2] === 0 ? 'h' : rayo[String(c)][2] < 0 ? 'arriba' : 'abajo');
  const golpes: { ms: number; fuerte: boolean }[] = [];
  let horizontales = 0;
  seq.forEach((c, i) => {
    const g = grupo(c);
    if (!g || g === grupo(seq[i - 1] ?? -1)) return;
    golpes.push({ ms: i * msPaso, fuerte: g === 'h' && horizontales++ === 0 });
  });
  return golpes;
}
/** Lo que pega un barrido flojo del cañón. */
export const poderBarrido = (poder: number) => Math.max(3, Math.round(poder / 6));
/** A quién le da cada golpe del cañón: el fuerte, a su blanco; los barridos, a cualquier otro que siga de pie. */
export function blancoDelCanon(heroes: Luchador[], blanco: Luchador, fuerte: boolean, azar: () => number = Math.random): Luchador | null {
  const vivos = heroes.filter(enCampo);
  if (!vivos.length) return null;
  if (fuerte && vivo(blanco)) return blanco;
  const otros = vivos.filter((h) => h !== blanco);
  if (otros.length) return alAzar(otros, azar);
  return vivo(blanco) ? blanco : alAzar(vivos, azar);
}

/** Al caer se le van los estados que se ven. */
function limpiarEstados(x: Luchador) {
  x.confundido = 0;
  x.quemado = 0;
  x.congelado = 0;
  x.dormido = 0;
}

/** Quema, congela o duerme (no se acumula: al que ya lo está no le hace nada). Devuelve si se aplicó. */
export function aplicarEstado(estado: EstadoPelea, x: Luchador, cual: 'quemado' | 'congelado' | 'dormido', azar: () => number = Math.random): boolean {
  if (x[cual] > 0) return false;
  // Dormir o congelar: no al que ya no puede actuar (no se pasa de uno a otro) ni en su turno libre.
  if (cual !== 'quemado' && (noActua(x) || x.inmuneParalisis)) return false;
  if (cual === 'quemado') x.quemado = conTemple(x, QUEMADO.turnos, azar);
  if (cual !== 'quemado') x[cual] = cuantoNoActua(estado, x, azar);
  if (cual !== 'quemado') estado.estadoRecien.push(`${x.id}/${cual}`);
  return true;
}

/**
 * Lo que quita una explosión: una parte de la vida máxima (no depende del nivel). Al jefe no lo hace retirarse: queda
 * justo por encima de su límite y hay que darle el último golpe (decisión de Claude, por encargo del autor: si no, la
 * bomba y la autodestrucción ganaban la pelea solas).
 */
function explosionA(d: DatosBatalla, x: Luchador, vida: number): number {
  const jefe = x.lado === 'enemigo' && x.clon === undefined ? d.enemigos[x.clave] : null;
  const piso = jefe?.huye_a ? Math.min(x.ps, Math.floor(x.psMax * jefe.huye_a) + 1) : 0;
  const antes = x.ps;
  x.ps = Math.max(piso, x.ps - Math.max(1, Math.round(x.psMax * vida)));
  if (x.ps === 0) limpiarEstados(x);
  return antes - x.ps;
}
/** Si la explosión se llevó a todos los héroes, el jefe también queda: «mueren todos», es empate (ver `resultado`). */
function siCayeronTodos(estado: EstadoPelea, d: DatosBatalla) {
  if (estado.heroes.some(vivo)) return;
  for (const e of estado.enemigos) if (vivo(e) && e.clon === undefined && d.enemigos[e.clave].huye_a) e.ps = 1;
}

/** El cebo explosivo: parte de la vida máxima que le quita a quien lo atacó y a su dueño. */
export const EXPLOSION_CEBO = { atacante: 0.25, dueno: 0.1 } as const;
/** Lo que le pasa a quien golpeó un cebo con efecto. */
export type ReaccionCebo =
  | { tipo: 'estado'; estado: 'paralizado' | 'envenenado' | 'confundido' | 'quemado' | 'congelado' | 'dormido' }
  | { tipo: 'explota'; aAtacante: number; aDueno: number; dueno?: Luchador };
/** Un cebo con efecto recibió un golpe de `atacante`. Devuelve qué le pasó (null si nada: sin efecto, o ya lo tenía). */
export function reaccionCebo(estado: EstadoPelea, d: DatosBatalla, cebo: Luchador, atacante: Luchador, azar: () => number = Math.random): ReaccionCebo | null {
  const efecto = cebo.ceboEfecto;
  if (!efecto || !vivo(atacante)) return null;
  if (efecto === 'explota') {
    // El cebo es una copia de su dueño: tiene su misma clave.
    const dueno = estado.heroes.find((h) => h.clave === cebo.clave && vivo(h));
    return { tipo: 'explota', aAtacante: explosionA(d, atacante, EXPLOSION_CEBO.atacante), aDueno: dueno ? explosionA(d, dueno, EXPLOSION_CEBO.dueno) : 0, dueno };
  }
  if (efecto === 'paraliza') {
    if (yaTiene(atacante, { paraliza: 1 })) return null;
    paralizarA(estado, atacante, azar);
    return { tipo: 'estado', estado: 'paralizado' };
  }
  if (efecto === 'veneno') {
    if (atacante.envenenado) return null;
    atacante.envenenado = { danio: 6, turnos: 3 };
    return { tipo: 'estado', estado: 'envenenado' };
  }
  if (efecto === 'confunde') {
    if (atacante.confundido) return null;
    confundirA(estado, atacante, 3);
    return { tipo: 'estado', estado: 'confundido' };
  }
  const cual = efecto === 'quema' ? 'quemado' : efecto === 'congela' ? 'congelado' : 'dormido';
  return aplicarEstado(estado, atacante, cual, azar) ? { tipo: 'estado', estado: cual } : null;
}

/** Todos los que están de pie en el campo. */
const enElCampo = (estado: EstadoPelea) => [...estado.heroes, ...estado.enemigos, ...estado.cebos.map((c) => c.l)].filter(enCampo);

/** Autodestrucción: quien la usa cae y todos los demás del campo (compañeros, rivales y cebos) reciben la explosión. */
export function autodestruir(estado: EstadoPelea, d: DatosBatalla, h: Luchador, vida: number): { l: Luchador; n: number }[] {
  const otros = enElCampo(estado).filter((x) => x !== h);
  h.ps = 0;
  limpiarEstados(h);
  const golpes = otros.map((l) => ({ l, n: explosionA(d, l, vida) }));
  siCayeronTodos(estado, d);
  return golpes;
}

/** Pone la bomba (una a la vez). Devuelve si se pudo. */
export function ponerBomba(estado: EstadoPelea, de: Luchador, bomba: { turnos: number; vida: number }): boolean {
  if (estado.bomba) return false;
  de.carga = 0;
  estado.bomba = { de: de.id, ...bomba };
  return true;
}
/** Al final del turno la bomba descuenta; al llegar a 0 explota contra todos. Devuelve a quién le pegó (null si no explotó). */
export function tickBomba(estado: EstadoPelea, d: DatosBatalla): { l: Luchador; n: number }[] | null {
  if (!estado.bomba || --estado.bomba.turnos > 0) return null;
  const { vida } = estado.bomba;
  estado.bomba = null;
  const golpes = enElCampo(estado).map((l) => ({ l, n: explosionA(d, l, vida) }));
  siCayeronTodos(estado, d);
  return golpes;
}

/** Probabilidad de que un enemigo que cae suelte la bomba del día del juicio. */
export const BOMBA_BOTIN = 0.02;

/**
 * Cómo está la pelea: `empate` si no queda ningún héroe y tampoco queda rival en pie (o el jefe, que nunca cae, quedó
 * por retirarse: «mueren todos»); `pierde` si no queda ningún héroe; `gana` si el jefe se retira; si no, null.
 */
export function resultado(estado: EstadoPelea, d: DatosBatalla): 'empate' | 'pierde' | 'gana' | null {
  const jefe = estado.enemigos.find((e) => d.enemigos[e.clave].jefe && e.clon === undefined);
  const retira = !!jefe && seRetira(jefe, d.enemigos[jefe.clave]);
  if (!estado.heroes.some(vivo)) return retira || !estado.enemigos.some(vivo) ? 'empate' : 'pierde';
  // Cayeron todos los demás y los que quedan están desaparecidos: se pierde, y quedan encerrados en el abismo para
  // siempre (decisión del autor, 2026-11-05). Si no queda ningún rival, la pelea sigue hasta que vuelvan.
  if (!estado.heroes.some(enCampo) && estado.enemigos.some(vivo) && !retira) return 'pierde';
  return retira ? 'gana' : null;
}

/** Los estados que se anuncian cuando terminan (arriba, con su mensaje: «… se despierta»). */
export type EstadoQueTermina = 'paralizado' | 'dormido' | 'congelado' | 'confundido' | 'envenenado' | 'quemado' | 'desterrado';

/** Los estados que tiene ahora un luchador. */
export const estadosActivos = (l: Luchador): EstadoQueTermina[] =>
  [
    l.paralizado > 0 && 'paralizado',
    l.dormido > 0 && 'dormido',
    l.congelado > 0 && 'congelado',
    l.confundido > 0 && 'confundido',
    !!l.envenenado && 'envenenado',
    l.quemado > 0 && 'quemado',
    l.desterrado > 0 && 'desterrado',
  ].filter((x): x is EstadoQueTermina => !!x);

/** Qué estados tiene cada uno en este momento (para comparar después). */
export const fotoEstados = (ls: Luchador[]) => new Map(ls.map((l) => [l.id, estadosActivos(l)]));

/**
 * Los estados que se terminaron desde la foto: por los turnos (la parálisis, el sueño) o por un objeto. Solo de los que
 * siguen en pie (si alguien cayó, no hace falta decir que se le pasó el veneno).
 */
export function estadosTerminados(antes: Map<string, EstadoQueTermina[]>, ls: Luchador[]): { l: Luchador; estado: EstadoQueTermina }[] {
  const out: { l: Luchador; estado: EstadoQueTermina }[] = [];
  for (const l of ls) {
    if (!vivo(l)) continue;
    const ahora = estadosActivos(l);
    for (const estado of antes.get(l.id) ?? []) if (!ahora.includes(estado)) out.push({ l, estado });
  }
  return out;
}

/**
 * Veneno y quemadura: el daño de fin de turno solo le toca al que ya lo tenía cuando empezó el turno (decisión del
 * autor, 2026-11-04). Al que lo envenenan o queman durante el turno, el primer daño le llega al final del siguiente;
 * cuántas veces pierde vida no cambia. `antes` es la foto (`fotoEstados`) del comienzo del turno.
 */
export const sufreAlFinal = (antes: Map<string, EstadoQueTermina[]>, l: Luchador, estado: 'envenenado' | 'quemado') =>
  !!antes.get(l.id)?.includes(estado);

/**
 * El estado que deja un golpe (`deja` de un ataque o de un especial): con su probabilidad, si el blanco sigue de pie,
 * no es un cebo y no lo tiene ya. Paralizar y dormir respetan el turno libre. Devuelve el estado que quedó, o null.
 */
export function dejarEstado(estado: EstadoPelea, x: Luchador, deja: Deja | undefined, azar: () => number = Math.random): EstadoQueTermina | null {
  if (!deja || !vivo(x) || x.cebo || azar() >= deja.prob) return null;
  const lista = Array.isArray(deja.estado) ? deja.estado : [deja.estado];
  const cual = lista[Math.min(lista.length - 1, Math.floor(azar() * lista.length))];
  if (cual === 'paralizado') {
    if (noActua(x) || x.inmuneParalisis) return null;
    paralizarA(estado, x, azar);
    return 'paralizado';
  }
  if (cual === 'confundido') {
    if (x.confundido > 0 || x.equipo?.sinConfusion) return null;
    confundirA(estado, x, 2);
    return 'confundido';
  }
  return aplicarEstado(estado, x, cual, azar) ? cual : null;
}

/**
 * Un especial que a veces quema (`quema`): una sola tirada por uso. Si sale, quema a los blancos que siguen de pie
 * (no a los cebos ni a los que ya están quemados). Devuelve a quiénes quemó.
 */
export function quemarConEspecial(estado: EstadoPelea, e: Especial, blancos: Luchador[], azar: () => number = Math.random): Luchador[] {
  if (!e.quema || azar() >= e.quema) return [];
  return [...new Set(blancos)].filter((x) => vivo(x) && !x.cebo && aplicarEstado(estado, x, 'quemado', azar));
}

/** Las estaciones de la Espada de las estaciones (el Rey; decisión del autor, 2026-11-05) y lo que causa cada una. */
export const ESTACIONES = { primavera: 'envenenado', verano: 'quemado', otono: 'paralizado', invierno: 'congelado' } as const;
export type Estacion = keyof typeof ESTACIONES;
export const estacionAlAzar = (azar: () => number = Math.random): Estacion =>
  (['primavera', 'verano', 'otono', 'invierno'] as const)[Math.min(3, Math.floor(azar() * 4))];

/** Le cae una estación: el estado que causa (no se acumula; respeta el turno libre). Devuelve si se aplicó. */
export function aplicarEstacion(estado: EstadoPelea, x: Luchador, estacion: Estacion, azar: () => number = Math.random): boolean {
  if (!enCampo(x)) return false;
  if (estacion === 'primavera') {
    if (x.envenenado) return false;
    x.envenenado = { danio: 6, turnos: 3 };
    return true;
  }
  if (estacion === 'otono') {
    if (yaTiene(x, { paraliza: 1 })) return false;
    paralizarA(estado, x, azar);
    return true;
  }
  return aplicarEstado(estado, x, estacion === 'verano' ? 'quemado' : 'congelado', azar);
}

/**
 * La Tajada del abismo: la grieta se traga a `x` entre [min, max] turnos, como si lo banearan del juego: no actúa,
 * nadie lo puede elegir, golpear ni curar, y sus estados quedan en pausa. Nunca al último héroe en pie (decisión del
 * autor). Empieza a descontar desde el turno siguiente. Devuelve los turnos (0 si no se pudo).
 */
export function desterrar(estado: EstadoPelea, x: Luchador, [min, max]: [number, number], azar: () => number = Math.random): number {
  if (!enCampo(x)) return 0;
  if (x.lado === 'heroe' && estado.heroes.filter(enCampo).length <= 1) return 0;
  const n = min + Math.min(max - min, Math.floor(azar() * (max - min + 1)));
  x.desterrado = n;
  x.esquivando = false;
  estado.estadoRecien.push(`${x.id}/desterrado`);
  estado.actuaron = estado.actuaron.filter((id) => id !== x.id);
  estado.cansados.delete(x.id);
  return n;
}

/** Los que se pierden en el abismo: desaparecidos cuando la pelea se pierde porque no quedó nadie más en el campo. */
export const encerradosEnElAbismo = (estado: EstadoPelea) => estado.heroes.filter((h) => vivo(h) && h.desterrado > 0);

/** La velocidad con la que actúa (la de su nivel más la de la ropa). */
export const velocidadDe = (l: Luchador) => l.vel + (l.equipo?.vel ?? 0);

/**
 * El orden del turno (decisión del autor, 2026-11-05: el más rápido actúa primero). Primero van las acciones con
 * prioridad de los héroes (esquivar, protegerse o potenciarse, un objeto, poner un cebo), en el orden en que se
 * eligieron; después todos los demás, héroes y enemigos mezclados, de más rápido a más lento. En un empate va
 * primero el héroe; entre dos del mismo lado, el que venía antes.
 */
export function ordenDelTurno<T>(acciones: { l: Luchador; prioridad?: boolean; dato: T }[]): { l: Luchador; dato: T }[] {
  return acciones
    .map((a, i) => ({ ...a, i }))
    .sort((a, b) => {
      if (!!a.prioridad !== !!b.prioridad) return a.prioridad ? -1 : 1;
      if (a.prioridad) return a.i - b.i;
      const v = velocidadDe(b.l) - velocidadDe(a.l);
      if (v) return v;
      if (a.l.lado !== b.l.lado) return a.l.lado === 'heroe' ? -1 : 1;
      return a.i - b.i;
    })
    .map(({ l, dato }) => ({ l, dato }));
}
