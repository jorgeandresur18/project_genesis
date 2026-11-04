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
  vanPerdiendo,
  vivo,
  type Ataque,
  type DatosBatalla,
  type Enemigo,
  type Especial,
  type Luchador,
  type Progreso,
} from './batalla';

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
  heroes: Luchador[];
  enemigos: Luchador[];
  /** Las monedas de la partida (lo que traía más lo que se gana en esta pelea). */
  monedas: number;
  mochila: Record<string, number>;
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
export function estadoInicial(d: DatosBatalla, progreso?: Progreso): EstadoPelea {
  return {
    heroes: d.heroes.map((k) =>
      crearLuchador(k, k, 'heroe', d.personajes[k], progreso?.heroes[k]?.nivel || d.personajes[k].nivel, progreso?.heroes[k]?.xp ?? 0),
    ),
    enemigos: [],
    monedas: progreso?.monedas ?? 0,
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
  /** No le queda ningún ataque posible: espera. */
  | { tipo: 'nada' };

/**
 * Qué hace el enemigo `e` en su turno. Cambia el estado igual que antes lo hacía `Batalla.tsx` (carga su barra, gasta
 * la distracción, el remate o la traición y el uso del ataque) y devuelve lo que hay que mostrar.
 * `arena`: en la arena de prueba la Mega Bola sale al azar, aunque sea solo por traición.
 */
export function decidirEnemigo(
  estado: EstadoPelea,
  d: DatosBatalla,
  e: Luchador,
  arena = false,
  azar: () => number = Math.random,
): DecisionEnemigo {
  cargar(e, CARGA.turnoEnemigo);
  if (e.paralizado > 0) return { tipo: 'paralizado' };
  if (seConfunde(e, azar)) return { tipo: 'confundido' };
  if (e.distraido) {
    e.distraido = false;
    return { tipo: 'distraido' };
  }
  const en = d.enemigos[e.clave];
  const hs = estado.heroes.filter(vivo);
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
  if (elige && esp) {
    const blanco = desviarACebo(estado, [elige.blanco ?? alAzar(hs, azar)], caeEnCebo, azar)[0];
    return { tipo: 'especial', especial: esp, blanco };
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
    ? repartirRafagas(a.rafagas, estado.heroes.filter(vivo), azar)
    : a.confunde || a.paraliza
      ? elegido.blancos
      : desviarACebo(estado, elegido.blancos, caeEnCebo, azar);
  gastarUso(e, a);
  return { tipo: 'ataque', ataque: a, blancos };
}

/**
 * Al final del turno: nadie sigue esquivando y bajan los estados. La parálisis se cuenta por turnos en que no pudo
 * actuar (la de este turno, recién desde el siguiente) y, al terminar, deja un turno de respiro; la confusión baja
 * igual (la de este turno, desde el siguiente).
 */
export function finDeTurno(estado: EstadoPelea) {
  estado.heroes.forEach((h) => (h.esquivando = false));
  [...estado.heroes, ...estado.enemigos].forEach((h) => {
    if (h.inmuneParalisis) h.inmuneParalisis--;
    if (h.paralizado && !estado.paralizadoRecien.includes(h.id) && --h.paralizado === 0) h.inmuneParalisis = 1;
    if (h.confundido && !estado.confundidoRecien.includes(h.id)) h.confundido--;
  });
  estado.paralizadoRecien = [];
  estado.confundidoRecien = [];
}

/** Un enemigo entra a la pelea (con algo de barra cargada); los caídos dejan de estar en la lista. */
export function sumarEnemigo(estado: EstadoPelea, d: DatosBatalla, clave: string, nivel: number, azar: () => number = Math.random): Luchador {
  const e = crearLuchador(`${clave}-${estado.enemigos.length}-${Date.now()}`, clave, 'enemigo', d.enemigos[clave], nivel);
  e.carga = Math.floor(azar() * 40);
  estado.enemigos = [...estado.enemigos.filter(vivo), e];
  return e;
}

/** Si al caer `e` llega otro de la horda: solo los de la horda, y mientras queden. */
export const llegaRefuerzo = (estado: EstadoPelea, d: DatosBatalla, e: Luchador) => e.clave === d.horda.enemigo && estado.salieron < d.horda.niveles.length;

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
): { n: number; critico: boolean; bloqueado?: boolean } {
  const extra = d.ayuda && atacante.lado === 'heroe' && vanPerdiendo(estado.heroes, d.ayuda.umbral) ? d.ayuda.critico : 0;
  if (defensor.protegido > 0 && atacante !== defensor) {
    defensor.protegido--;
    return { n: 0, critico: false, bloqueado: true };
  }
  const golpe = dano(atacante, defensor, poder, azar, extra);
  const n = aMedias ? Math.max(1, Math.round(golpe.n / 2)) : golpe.n;
  cargar(defensor, CARGA.recibir);
  const jefe = defensor.lado === 'enemigo' ? d.enemigos[defensor.clave] : null;
  defensor.ps = Math.max(jefe?.huye_a && defensor.clon === undefined ? 1 : 0, defensor.ps - n);
  if (defensor.ps === 0) defensor.confundido = 0;
  return { n, critico: golpe.critico };
}

/** Paraliza: empieza a descontar desde el turno siguiente y reemplaza el descanso (no se suma). */
export function paralizarA(estado: EstadoPelea, x: Luchador, n: number) {
  x.paralizado = n;
  estado.paralizadoRecien.push(x.id);
  estado.actuaron = estado.actuaron.filter((id) => id !== x.id);
  estado.cansados.delete(x.id);
}

/** Confunde: empieza a descontar desde el turno siguiente. */
export function confundirA(estado: EstadoPelea, x: Luchador, n: number) {
  x.confundido = n;
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
  const vivos = heroes.filter(vivo);
  if (!vivos.length) return null;
  if (fuerte && vivo(blanco)) return blanco;
  const otros = vivos.filter((h) => h !== blanco);
  if (otros.length) return alAzar(otros, azar);
  return vivo(blanco) ? blanco : alAzar(vivos, azar);
}
