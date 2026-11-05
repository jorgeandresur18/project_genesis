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
  turnosDormido,
  vanPerdiendo,
  vivo,
  yaTiene,
  type Ataque,
  type DatosBatalla,
  type Enemigo,
  type Especial,
  type Luchador,
  type Progreso,
} from './batalla';
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
export function estadoInicial(d: DatosBatalla, progreso?: Progreso): EstadoPelea {
  return {
    heroes: d.heroes.map((k) => {
      const h = crearLuchador(k, k, 'heroe', d.personajes[k], progreso?.heroes[k]?.nivel || d.personajes[k].nivel, progreso?.heroes[k]?.xp ?? 0);
      // Lo que subió para siempre (el CeBiDol) y lo que lleva puesto: van en `extra` para que subir de nivel no lo borre.
      const ref = progreso?.refuerzos?.[k];
      if (ref) {
        h.extra += ref.atq;
        h.extraDef += ref.def;
      }
      const ropa = puestosDe(progreso, k);
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
  if (e.congelado > 0) return { tipo: 'congelado' };
  if (e.dormido > 0) return { tipo: 'dormido' };
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
 * actuar (la de este turno, recién desde el siguiente) y, al terminar (como el sueño y el hielo), deja un turno libre; la confusión baja
 * igual (la de este turno, desde el siguiente).
 */
export function finDeTurno(estado: EstadoPelea) {
  estado.heroes.forEach((h) => (h.esquivando = false));
  [...estado.heroes, ...estado.enemigos].forEach((h) => {
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
  const ayuda = d.ayuda && atacante.lado === 'heroe' && vanPerdiendo(estado.heroes, d.ayuda.umbral) ? d.ayuda.critico : 0;
  const extra = ayuda + (atacante.equipo?.critico ?? 0);
  if (defensor.protegido > 0 && atacante !== defensor) {
    defensor.protegido--;
    return { n: 0, critico: false, bloqueado: true };
  }
  const golpe = dano(atacante, defensor, poder, azar, extra);
  const n = aMedias ? Math.max(1, Math.round(golpe.n / 2)) : golpe.n;
  cargar(defensor, CARGA.recibir);
  const jefe = defensor.lado === 'enemigo' ? d.enemigos[defensor.clave] : null;
  defensor.ps = Math.max(jefe?.huye_a && defensor.clon === undefined ? 1 : 0, defensor.ps - n);
  if (defensor.ps === 0) limpiarEstados(defensor);
  return { n, critico: golpe.critico };
}

/** Sin un compañero de pie que lo pueda sacar: el héroe que pelea solo (no los rivales). */
const estaSolo = (estado: EstadoPelea, x: Luchador) => x.lado === 'heroe' && estado.heroes.filter(vivo).length <= 1;

/** Paraliza: empieza a descontar desde el turno siguiente y reemplaza el descanso (no se suma). */
export function paralizarA(estado: EstadoPelea, x: Luchador, azar: () => number = Math.random) {
  x.paralizado = turnosDormido(azar, estaSolo(estado, x));
  estado.paralizadoRecien.push(x.id);
  estado.actuaron = estado.actuaron.filter((id) => id !== x.id);
  estado.cansados.delete(x.id);
}

/** Confunde: empieza a descontar desde el turno siguiente. */
export function confundirA(estado: EstadoPelea, x: Luchador, n: number) {
  // La flor de pureza: no se puede confundir.
  if (x.equipo?.sinConfusion) return;
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
  if (cual === 'quemado') x.quemado = QUEMADO.turnos;
  if (cual !== 'quemado') x[cual] = turnosDormido(azar, estaSolo(estado, x));
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
const enElCampo = (estado: EstadoPelea) => [...estado.heroes, ...estado.enemigos, ...estado.cebos.map((c) => c.l)].filter(vivo);

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
  return retira ? 'gana' : null;
}

/** Los estados que se anuncian cuando terminan (arriba, con su mensaje: «… se despierta»). */
export type EstadoQueTermina = 'paralizado' | 'dormido' | 'congelado' | 'confundido' | 'envenenado' | 'quemado';

/** Los estados que tiene ahora un luchador. */
export const estadosActivos = (l: Luchador): EstadoQueTermina[] =>
  [
    l.paralizado > 0 && 'paralizado',
    l.dormido > 0 && 'dormido',
    l.congelado > 0 && 'congelado',
    l.confundido > 0 && 'confundido',
    !!l.envenenado && 'envenenado',
    l.quemado > 0 && 'quemado',
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
 * Un especial que a veces quema (`quema`): una sola tirada por uso. Si sale, quema a los blancos que siguen de pie
 * (no a los cebos ni a los que ya están quemados). Devuelve a quiénes quemó.
 */
export function quemarConEspecial(estado: EstadoPelea, e: Especial, blancos: Luchador[], azar: () => number = Math.random): Luchador[] {
  if (!e.quema || azar() >= e.quema) return [];
  return [...new Set(blancos)].filter((x) => vivo(x) && !x.cebo && aplicarEstado(estado, x, 'quemado', azar));
}
