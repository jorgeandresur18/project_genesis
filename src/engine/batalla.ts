// Combate por turnos (RPG estilo EarthBound / Final Fantasy): las cuentas, sin interfaz. Los datos de cada batalla
// están en src/data/batallas/<id>.json; la pantalla, en src/components/Batalla.tsx. Ver docs/SPEC.md.
import type { Vars } from './types';

/** Estadísticas en el nivel 1 (`base`) y cuánto suben por nivel (`crece`). */
export interface Stats {
  ps: number;
  atq: number;
  def: number;
  vel: number;
}
export interface Ataque {
  /** No hace daño: paraliza al blanco tantos turnos (la parálisis de pesadilla de la sombra). */
  paraliza?: number;
  /** No hace daño: confunde al blanco tantos turnos (el beso de Nikki; ver CONFUSION). */
  confunde?: number;
  /** La animación de su hoja que usa (si no, «ataque»); si la hoja tiene un proyectil para ella, lo lanza. */
  anim?: string;
  /** Cuánto pesa al elegir un ataque al azar (si no, 1). */
  peso?: number;
  /**
   * Cebo (Jair): no ataca; deja una copia suya en blanco y negro que no hace nada. El rival a veces le pega a ella
   * en vez de a él (CEBO), y muere al primer golpe. No se elige a quién.
   */
  cebo?: boolean;
  /** Se cura a sí mismo esta parte de su vida máxima (la curación de Rikka); no se elige a quién. */
  cura?: number;
  /**
   * Ráfaga (el Capitán): dispara entre `balas[0]` y `balas[1]` balas, una por fogonazo de su ataque (si son más que
   * los fogonazos, repite la animación). Cada bala es un golpe de `poder` que puede fallar o esquivarse.
   */
  balas?: [number, number];
  /**
   * Ráfagas (la sombra): suelta tantas, repartidas: primero una a cada rival en pie y las que sobran al azar (con uno
   * solo en pie, todas para él). Cada una es un golpe de `poder`.
   */
  rafagas?: number;
  /** Cuántas veces se puede usar en una pelea («5/5» en el menú); sin esto, sin límite. Se recuperan al terminar. */
  usos?: number;
  nombre: string;
  poder: number;
  /** "uno" (al azar, o el elegido) o "todos". */
  objetivo?: 'uno' | 'todos';
  texto: string;
}
/**
 * Ataque especial: hace falta la barra de especial llena (ver CARGA). Son `golpes` golpes de `poder` cada uno: si el
 * objetivo es «todos», se reparten entre los enemigos de pie (si queda uno solo, van todos para él).
 */
export interface Especial {
  nombre: string;
  poder: number;
  golpes: number;
  objetivo: 'uno' | 'todos';
  /**
   * Dónde se pone mientras dura (siempre 5 segundos, ESPECIAL_MS): junto a su objetivo (Jair, Rikka, el soldado) o
   * en el medio de la pantalla (Cami, que dispara de lejos). Si su hoja tiene la fila «especial», la usa; si no,
   * repite su ataque.
   */
  posicion: 'objetivo' | 'centro';
  texto: string;
  /** Color del personaje: el fondo de velocidad del aviso y las luces. */
  color: string;
  /** Los ojos en el primer cuadro de su hoja ([x, y, ancho, alto]) para el aviso del especial. */
  ojos: [number, number, number, number];
  /** «oscura»: mientras dura, la pantalla se oscurece (el vórtice de la sombra). */
  pantalla?: 'oscura';
  /**
   * Cañón (el Capitán de la Federación): en vez de 5 segundos de golpes, carga el blaster (brilla cada vez más) y suelta
   * un solo rayo grueso de su `color` contra su objetivo: un golpe de `poder`. Se puede esquivar.
   */
  canon?: boolean;
  /**
   * Levanta en el aire a quien recibe sus golpes y lo mantiene ahí hasta que termina; después cae (con su sprite de
   * derrotado) y, si sigue vivo, se levanta (el especial de la sombra: un ataque sorpresa desde el piso).
   */
  levanta?: boolean;
}
export interface Heroe {
  nombre: string;
  /** Hoja de animaciones (public/<sprite>.png y .json). */
  sprite: string;
  nivel: number;
  /** Si puede actuar todos los turnos (Jair sí; Cami pega fuerte y actúa un turno sí y uno no). */
  seguido: boolean;
  base: Stats;
  crece: Stats;
  ataques: Ataque[];
  especial?: Especial;
  /** Animación (de su hoja) cuando no puede actuar ese turno: Cami, agachada por el tobillo. */
  descanso?: string;
  /** Lo que se dice cuando se queda descansando (apenas actúa) y cuando ya puede volver ({quien}: su nombre). */
  descanso_textos?: { empieza: string; termina: string };
  /** Ataca de lejos: no se acerca, y sale una bala de su pistola que impacta en el objetivo (Cami). */
  distancia?: boolean;
  /** Tamaño en pantalla respecto de los demás (1: normal). */
  escala?: number;
  /** Lo que le dice a un enemigo con «Hablar» ({objetivo}: su nombre). */
  hablar: string[];
  /** Ataques que aprende al llegar a un nivel (Jair: el Cebo, en el 6). */
  aprende?: { nivel: number; ataque: Ataque }[];
  /** El sonido de sus golpes (ataque y especial). */
  sonido?: string;
}
export interface Enemigo {
  nombre: string;
  sprite: string;
  base: Stats;
  crece: Stats;
  ataques: Ataque[];
  especial?: Especial;
  escala?: number;
  jefe?: boolean;
  /** El jefe se retira (y la pelea se gana) cuando le queda esta parte de sus PS. */
  huye_a?: number;
  /** Cómo contesta cuando le hablan: si se distrae (ok) o no (no). Dice `quien`. */
  responde?: { quien: string; ok: string[]; no: string[] };
  /**
   * Se lo puede convencer de terminar la pelea hablándole `veces` turnos seguidos (Nikki: pedirle perdón tres
   * veces). Cada vez el héroe dice `pide[i]` y él contesta `responde[i]`; si en el medio el héroe hace otra cosa,
   * se vuelve a empezar (y dice `corta`, si está).
   */
  perdon?: { veces: number; quien: string; pide: string[]; responde: string[]; corta?: string };
  /** Animación (de su hoja) cuando se retira (Nikki, llorando) y cuando gana la pelea. */
  al_retirarse?: string;
  al_ganar?: string;
  /** Al retirarse, se va hacia atrás hasta salir de la pantalla (la sombra, hecha vórtice). */
  sale_atras?: boolean;
  /**
   * Cuánto cae en el cebo: probabilidad de que un golpe suyo a uno solo vaya al cebo (si hay uno). Los tontos o
   * débiles, mucho (los soldados); los listos, poco (Nikki conoce a Jair). Si no está, CEBO.
   */
  cae_en_cebo?: number;
  /**
   * Remata: si a un héroe le queda menos de `vida` (parte de sus PS), usa su especial apenas tiene `carga` en la
   * barra (aunque no esté llena), contra ese héroe (Nikki).
   */
  remata?: { vida: number; carga: number };
  /**
   * Segundo especial: Clon de sombra (con `carga` en la barra; si no, llena; y con `probabilidad` cada vez que
   * puede). Le cuesta `costo` de su vida máxima y crea un clon (`nombre_clon`) con
   * `fuerza` de su ataque, defensa y velocidad, y esa vida. El clon no usa especiales, no escucha y se evapora a
   * los `turnos` turnos. Al aparecer, un héroe dice una de las `reacciones` (al azar).
   */
  clon?: { nombre: string; nombre_clon: string; costo: number; fuerza: number; turnos: number; color: string; texto: string; reacciones?: Linea[]; carga?: number; probabilidad?: number };
  /** El sonido de sus golpes (ataque y especial). */
  sonido?: string;
  /**
   * Mega Bola Tóxica (Nikki): con la barra llena, a veces (`peso`) en vez de su especial. Levanta la mano, la bola
   * crece y explota sobre los rivales: golpe de `poder` a todos y los envenena a todos (también a sus aliados, por las
   * salpicaduras; a ella no). Con `solo_traicion`, en su pelea solo la usa si le pidieron perdón y después la atacaron:
   * ahí deja al que la atacó con `traicion.ps` PS y un veneno de `traicion.veneno` por turno.
   */
  bola_toxica?: {
    nombre: string;
    poder: number;
    color: string;
    ojos: [number, number, number, number];
    texto: string;
    veneno: { danio: number; turnos: number };
    peso?: number;
    solo_traicion?: boolean;
    traicion?: { ps: number; veneno: number; texto: string };
  };
  /** Ataca de lejos (el Capitán): no se acerca; de su blaster sale un rayo de `color_disparo` hacia cada blanco. */
  distancia?: boolean;
  color_disparo?: string;
  /** Un filtro sobre su sprite (un placeholder hecho con la hoja de otro, mientras no tenga la suya). */
  filtro?: string;
}
/** De qué tipo es un objeto (decide dónde aparece y cómo se usa; ver docs/BIBLIA_RPG.md, sección 14). */
export type TipoObjeto = 'curacion' | 'mejora' | 'permanente' | 'tactico' | 'equipo' | 'coleccion';
/** A quién se aplica: a quien lo usa, a un compañero, a todo el equipo, a un rival o a todos los rivales. */
export type ObjetivoObjeto = 'yo' | 'aliado' | 'equipo' | 'rival' | 'rivales';
/** Un objeto de la mochila: cura, mejora, cambia al personaje para siempre o tiene un efecto (táctico). */
export interface Objeto {
  nombre: string;
  /** Su dibujo (public/<icono>.webp): en el menú, lo que cae del cielo, la mochila y la tienda. */
  icono?: string;
  /** Si no está, se deduce de lo que hace (ver tipoDe). */
  tipo?: TipoObjeto;
  /** Si no está: a un compañero (o a un caído, si revive). */
  objetivo?: ObjetivoObjeto;
  /** Envenena: pierde `danio` PS al final de cada turno durante `turnos` turnos. */
  veneno?: { danio: number; turnos: number };
  /** Protege: los próximos `protege` golpes no le hacen daño. */
  protege?: number;
  /** Confunde o paraliza tantos turnos (para usar sobre un rival). */
  confunde?: number;
  paraliza?: number;
  /** Saca los estados: veneno, confusión y parálisis. */
  cura_estados?: boolean;
  atq?: number;
  def?: number;
  ps?: number;
  carga?: number;
  /** Sube tantos niveles (el caramelo rancio). */
  niveles?: number;
  /** Revive a un caído con esta parte de su vida (0 a 1). Solo se puede usar en un caído. */
  revive?: number;
  /** Al usarlo ({quien}: en quién; {n}: cuánto). */
  texto: string;
}
export interface Linea {
  quien: string;
  texto: string;
}
export interface DatosBatalla {
  titulo: string;
  /** Fondo: public/<fondo>.webp (pixel art del autor) o un PLACEHOLDER. */
  fondo: string;
  /** Proporción (ancho / alto) del fondo y sus luces de alarma (centro en % de la imagen), que laten. */
  fondo_proporcion?: number;
  fondo_luces?: [number, number][];
  heroes: string[];
  personajes: Record<string, Heroe>;
  enemigos: Record<string, Enemigo>;
  /** Horda: empiezan `al_inicio` y, cada vez que cae uno, llega el siguiente hasta completar `niveles`. */
  horda: { enemigo: string; al_inicio: number; niveles: number[] };
  /** Después de la horda, el jefe (con su nivel). */
  jefe: { enemigo: string; nivel: number };
  objetos: Record<string, Objeto>;
  /** Lo que suelta un enemigo al caer, con esta probabilidad (un objeto al azar de la lista; repetir pesa más). */
  botin: { probabilidad: number; objetos: string[] };
  /** Probabilidades de que funcionen «Esquivar» y «Hablar» (distraer al enemigo un turno). */
  esquivar: number;
  hablar: number;
  /** Si se puede huir (en la primera pelea, no: Cami no deja). */
  huir: boolean;
  /** Retrato de cada uno que habla (por su nombre en los diálogos): public/<retrato>.png. */
  retratos: Record<string, string>;
  /**
   * Líneas en momentos fijos: inicio, refuerzos, jefe, jefe_huye, victoria, derrota, huir_no (no se puede huir),
   * huir (se huye), descanso (nadie puede actuar este turno), cae_jair, hablar_ok, hablar_no, esquiva_ok, botin.
   */
  dialogos: Record<string, Linea[]>;
  /**
   * Cuánto más atrás (más arriba en la pantalla) se paran los enemigos que los héroes: 1 en un pasillo con
   * profundidad (el Bastión), 0 en el mismo piso que los héroes (el bar).
   */
  enemigos_atras?: number;
  /** Música de la pelea (ruta en public/) y la que suena cuando sale el jefe (si no, sigue la misma). */
  musica?: string;
  musica_jefe?: string;
  /** Objetos con que empieza la mochila si tiene menos (p. ej. un revivir). */
  mochila_inicial?: Record<string, number>;
  /**
   * Pelea de la vida real (el bar, antes de entrar a GENESIS): no cuentan los niveles ni la mochila del juego. Los
   * héroes pelean con el nivel del .json y la mochila vacía, y al terminar no se guarda nada de eso (solo el premio).
   */
  vida_real?: boolean;
  /** «versus»: antes de empezar, la presentación del enfrentamiento (los dos sprites, velocidad, zoom). */
  intro?: 'versus';
  /**
   * Al ganar haciendo retirar al jefe: objetos que se suman a la mochila (se dice la línea «premio» con
   * {objeto}) y variables que se guardan en la partida (Nikki: la noche anormal).
   */
  premio?: { objetos: Record<string, number>; vars?: Record<string, string | number | boolean> };
  /** Lo que dice el menú de un comando en esta pelea, en lugar del de siempre (p. ej. «hablar» con Nikki). */
  descripciones?: Record<string, string>;
  /** Probabilidad de que un ataque normal falle (el rival lo esquiva); si no está, FALLO. */
  fallo?: number;
  /**
   * El juego ayuda cuando los héroes van perdiendo (la vida de todos, en promedio, por debajo de `umbral`): al
   * final de cada turno, con probabilidad `cae`, aparece un objeto (`objeto`; se dice la línea «ayuda») y sus
   * golpes tienen `critico` más de probabilidad de ser críticos.
   */
  ayuda?: { umbral: number; cae: number; objeto: string; critico: number };
}

/** Probabilidad base de que un ataque normal falle, de los dos lados (el especial no falla). */
export const FALLO = 0.06;
/**
 * Fallar y esquivar según el nivel y el estado. La diferencia de nivel cuenta hasta un tope (así un rival muy alto
 * no se vuelve imposible) y los estados suman o restan puntos.
 */
export const PUNTERIA = {
  /** Fallar: +1 punto por nivel que el defensor le lleva al atacante (hasta 10), −1 por nivel de menos (hasta 5). */
  falloPorNivel: 0.01, falloNivelMax: 10, falloNivelMin: 5,
  /** El atacante confundido o envenenado falla más; contra un paralizado (no se mueve) nunca se falla. */
  falloConfundido: 0.1, falloEnvenenado: 0.05,
  falloMin: 0.02, falloMax: 0.3,
  /** Esquivar: ±2 puntos por nivel de diferencia con el que ataca (hasta 10 niveles). */
  esquivaPorNivel: 0.02, esquivaNivelMax: 10,
  /** Confundido o envenenado, esquiva peor. TODO: quemado y congelado (cuando existan) también restan. */
  esquivaConfundido: 0.2, esquivaEnvenenado: 0.1,
  esquivaMin: 0.05, esquivaMax: 0.8,
} as const;
const entre = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
/** Probabilidad de que el golpe de `at` a `de` falle solo (sin que `de` haya elegido esquivar). */
export function probFallo(d: { fallo?: number }, at: Luchador, de: Luchador) {
  if (de.paralizado > 0) return 0;
  const P = PUNTERIA;
  const dif = entre(de.nivel - at.nivel, -P.falloNivelMin, P.falloNivelMax);
  const estado = (at.confundido > 0 ? P.falloConfundido : 0) + (at.envenenado ? P.falloEnvenenado : 0);
  return entre((d.fallo ?? FALLO) + dif * P.falloPorNivel + estado, P.falloMin, P.falloMax);
}
/** Probabilidad de que `de`, que eligió esquivar, esquive el golpe de `at`. */
export function probEsquiva(d: { esquivar: number }, de: Luchador, at: Luchador) {
  const P = PUNTERIA;
  const dif = entre(de.nivel - at.nivel, -P.esquivaNivelMax, P.esquivaNivelMax);
  const estado = (de.confundido > 0 ? P.esquivaConfundido : 0) + (de.envenenado ? P.esquivaEnvenenado : 0);
  return entre(d.esquivar + dif * P.esquivaPorNivel - estado, P.esquivaMin, P.esquivaMax);
}
export const falla = (d: { fallo?: number }, at: Luchador, de: Luchador, azar: () => number = Math.random) => azar() < probFallo(d, at, de);
/** Si `de` esquiva el golpe de `at` (solo si eligió esquivar este turno). */
export const esquiva = (d: { esquivar: number }, de: Luchador, at: Luchador, azar: () => number = Math.random) =>
  de.esquivando && azar() < probEsquiva(d, de, at);
/** Si los héroes van perdiendo (para la ayuda del juego). */
export const vanPerdiendo = (heroes: Luchador[], umbral: number) =>
  heroes.reduce((s, h) => s + Math.max(0, h.ps) / h.psMax, 0) / heroes.length < umbral;

/** Un luchador en la pelea (héroe o enemigo), con lo que tiene ahora. */
export interface Luchador {
  id: string;
  clave: string;
  lado: 'heroe' | 'enemigo';
  nombre: string;
  nivel: number;
  xp: number;
  ps: number;
  psMax: number;
  atq: number;
  def: number;
  vel: number;
  /** Ataque y defensa extra de los potenciadores (duran hasta el final de la pelea). */
  extra: number;
  extraDef: number;
  /** Intentó esquivar este turno: los golpes pueden fallarle. */
  esquivando: boolean;
  /** Lo distrajeron con «Hablar»: pierde su próximo ataque. */
  distraido: boolean;
  /** Barra del especial (0 a 100): con 100 puede usarlo. */
  carga: number;
  /** Turnos que le quedan paralizado (no puede actuar). */
  paralizado: number;
  /** Turnos que le quedan confundido (al atacar, a veces se pega a sí mismo). */
  confundido: number;
  /** Es un cebo (una copia de un héroe que no hace nada): no cuenta como héroe. */
  cebo?: boolean;
  /** Si es un clon de sombra: los turnos que le quedan antes de evaporarse. */
  clon?: number;
  /** Envenenado: pierde `danio` PS al final de cada turno, `turnos` turnos más. */
  envenenado: { danio: number; turnos: number; noMata?: boolean } | null;
  /** Protegido: tantos golpes que no le hacen daño. */
  protegido: number;
  /** Cuántas veces usó cada ataque con usos limitados en esta pelea (por nombre). */
  usados?: Record<string, number>;
  /** Acaba de salir de una parálisis: este turno no se lo puede volver a paralizar. */
  inmuneParalisis?: number;
}

/**
 * Cuánto se llena la barra del especial: al atacar, al recibir un golpe, al hablar, al esquivar y, los enemigos,
 * en cada turno suyo. Con estos números un héroe lo tiene más o menos cada cuatro o cinco turnos.
 */
export const CARGA = { atacar: 22, recibir: 12, hablar: 12, esquivar: 10, turnoEnemigo: 18 } as const;
export const CARGA_LLENA = 100;
/** Lo que dura un especial (de todos). */
export const ESPECIAL_MS = 5000;
export const cargar = (l: Luchador, n: number) => {
  l.carga = Math.min(CARGA_LLENA, l.carga + n);
};
export const especialListo = (l: Luchador) => l.carga >= CARGA_LLENA;

/** A quién va cada golpe del especial: uno solo, o repartidos en ronda entre todos los objetivos. */
export function golpesEspecial<T>(e: Especial, objetivos: T[], equipo = objetivos.length): T[] {
  if (!objetivos.length) return [];
  // A todos: los golpes se reparten entre el equipo entero (`equipo`, contando a los caídos). Si quedan menos de pie,
  // cada uno recibe su parte y nada más: con uno solo en pie, no le caen todos los golpes encima.
  const n = e.objetivo === 'todos' ? Math.max(objetivos.length, Math.round((e.golpes * objetivos.length) / Math.max(equipo, objetivos.length))) : e.golpes;
  return Array.from({ length: n }, (_, i) => (e.objetivo === 'todos' ? objetivos[i % objetivos.length] : objetivos[0]));
}

/** Estadísticas en un nivel. */
export function statsEn(base: Stats, crece: Stats, nivel: number): Stats {
  const n = Math.max(1, nivel) - 1;
  return {
    ps: Math.round(base.ps + crece.ps * n),
    atq: Math.round(base.atq + crece.atq * n),
    def: Math.round(base.def + crece.def * n),
    vel: Math.round(base.vel + crece.vel * n),
  };
}

/** Experiencia para pasar del nivel `nivel` al siguiente. */
export const xpParaSubir = (nivel: number) => nivel * 10;

/** Experiencia que da un enemigo de ese nivel al caer (la reciben todos los héroes de pie). */
export const xpDe = (nivel: number) => nivel * 3;

export function crearLuchador(
  id: string,
  clave: string,
  lado: Luchador['lado'],
  d: { nombre: string; base: Stats; crece: Stats },
  nivel: number,
  xp = 0,
): Luchador {
  const s = statsEn(d.base, d.crece, nivel);
  return { id, clave, lado, nombre: d.nombre, nivel, xp, ps: s.ps, psMax: s.ps, atq: s.atq, def: s.def, vel: s.vel, extra: 0, extraDef: 0, esquivando: false, distraido: false, carga: 0, paralizado: 0, confundido: 0, envenenado: null, protegido: 0 };
}

/**
 * Suma experiencia y sube los niveles que correspondan: las estadísticas pasan a las del nivel nuevo y los PS
 * suben lo mismo que el máximo. Devuelve los niveles nuevos (vacío si no subió).
 */
export function ganarXp(l: Luchador, d: { base: Stats; crece: Stats }, xp: number): number[] {
  const subidas: number[] = [];
  l.xp += xp;
  while (l.xp >= xpParaSubir(l.nivel)) {
    l.xp -= xpParaSubir(l.nivel);
    l.nivel++;
    const s = statsEn(d.base, d.crece, l.nivel);
    if (l.ps > 0) l.ps += s.ps - l.psMax;
    l.psMax = s.ps;
    l.atq = s.atq;
    l.def = s.def;
    l.vel = s.vel;
    subidas.push(l.nivel);
  }
  return subidas;
}

/** Daño: el ataque contra la defensa (con los potenciadores), con un poco de azar y a veces un crítico. */
export function dano(atacante: Luchador, defensor: Luchador, poder: number, azar: () => number = Math.random, criticoExtra = 0) {
  const base = ((atacante.atq + atacante.extra) * poder) / 10 - (defensor.def + defensor.extraDef) / 2;
  const critico = azar() < 0.08 + criticoExtra;
  const n = Math.max(1, Math.round(base * (0.9 + azar() * 0.2) * (critico ? 1.5 : 1)));
  return { n, critico };
}

/**
 * Quiénes actúan este turno: los héroes de pie, menos los que actuaron el turno anterior y no pueden repetir
 * (`seguido: false`). Así Cami actúa un turno sí y uno no; Jair, siempre.
 */
export function disponibles(heroes: Luchador[], datos: Record<string, Heroe>, actuaron: string[]): Luchador[] {
  return heroes.filter((h) => h.ps > 0 && !h.paralizado && (datos[h.clave].seguido || !actuaron.includes(h.id)));
}

/** Sube `n` niveles de golpe (el caramelo rancio): las estadísticas pasan a las del nivel nuevo. */
export function subirNiveles(l: Luchador, d: { base: Stats; crece: Stats }, n: number) {
  l.nivel += n;
  l.xp = 0;
  const s = statsEn(d.base, d.crece, l.nivel);
  if (l.ps > 0) l.ps += s.ps - l.psMax;
  l.psMax = s.ps;
  l.atq = s.atq;
  l.def = s.def;
  l.vel = s.vel;
}

/** Usa un objeto en un héroe: devuelve cuánto hizo (lo que subió o curó). `d`: sus datos (para subir niveles). */
export function usarObjeto(o: Objeto, h: Luchador, d?: { base: Stats; crece: Stats }): number {
  // Los tácticos: estados (sobre un rival o un compañero).
  if (o.cura_estados) {
    h.envenenado = null;
    h.confundido = 0;
    h.paralizado = 0;
  }
  if (o.veneno) h.envenenado = { ...o.veneno };
  if (o.protege) h.protegido += o.protege;
  if (o.confunde) h.confundido = Math.max(h.confundido, o.confunde);
  if (o.paraliza) h.paralizado = Math.max(h.paralizado, o.paraliza);
  if (o.veneno || o.protege || o.confunde || o.paraliza) return o.veneno?.turnos ?? o.protege ?? o.confunde ?? o.paraliza ?? 0;
  if (o.niveles && d) {
    subirNiveles(h, d, o.niveles);
    return o.niveles;
  }
  if (o.revive) {
    if (h.ps > 0) return 0;
    h.ps = Math.max(1, Math.round(h.psMax * o.revive));
    h.paralizado = 0;
    return h.ps;
  }
  if (o.atq) h.extra += o.atq;
  if (o.def) h.extraDef += o.def;
  if (o.carga) {
    const antes = h.carga;
    cargar(h, o.carga);
    return h.carga - antes;
  }
  if (o.ps) {
    const antes = h.ps;
    h.ps = Math.min(h.psMax, h.ps + o.ps);
    return h.ps - antes;
  }
  return o.atq ?? o.def ?? 0;
}

/** El tipo de un objeto: el que dice o, si no dice, el que corresponde a lo que hace. */
export const tipoDe = (o: Objeto): TipoObjeto =>
  o.tipo ?? (o.niveles ? 'permanente' : o.ps || o.revive || o.cura_estados ? 'curacion' : o.veneno || o.protege || o.confunde || o.paraliza ? 'tactico' : 'mejora');
/** Lo que se puede usar en una pelea (el equipo y la colección, no). */
export const usableEnPelea = (o: Objeto) => !['equipo', 'coleccion'].includes(tipoDe(o));
/** A quién se aplica un objeto. */
export const objetivoDe = (o: Objeto): ObjetivoObjeto => o.objetivo ?? 'aliado';

/** El veneno al final del turno: cuánto pierde (un jefe nunca baja de 1: se retira). Descuenta un turno. */
export function tickVeneno(l: Luchador, jefe: boolean): number {
  if (!l.envenenado || l.ps <= 0) return 0;
  // El jefe (y el veneno que no mata: la traición en el bar) nunca bajan de 1.
  const n = Math.min(l.envenenado.danio, jefe || l.envenenado.noMata ? l.ps - 1 : l.ps);
  l.ps -= Math.max(0, n);
  if (--l.envenenado.turnos <= 0) l.envenenado = null;
  return Math.max(0, n);
}

/** Crea el clon de sombra de un enemigo: más débil (`fuerza`), con la vida que le costó, sin especiales. */
export function crearClon(o: Luchador, c: NonNullable<Enemigo['clon']>, id: string): Luchador {
  const ps = Math.max(1, Math.round(o.psMax * c.costo));
  return {
    ...o,
    id,
    nombre: c.nombre_clon,
    ps,
    psMax: ps,
    atq: Math.max(1, Math.round(o.atq * c.fuerza)),
    def: Math.round(o.def * c.fuerza),
    vel: Math.round(o.vel * c.fuerza),
    extra: 0,
    extraDef: 0,
    carga: 0,
    distraido: false,
    esquivando: false,
    paralizado: 0,
    envenenado: null,
    protegido: 0,
    // Uno más: el turno en que aparece no cuenta.
    clon: c.turnos + 1,
  };
}

/**
 * Qué especial usa un enemigo este turno (o ninguno). Los clones no usan especiales. Si un héroe está por caer y
 * tiene `remata`, su especial contra ese héroe. Con la barra llena: el clon de sombra (si no hay otro y gastar esa
 * vida no lo deja al borde de retirarse) la mitad de las veces; si no, su especial.
 */
export function eligeEspecial(
  e: Luchador,
  en: Enemigo,
  heroes: Luchador[],
  enemigos: Luchador[],
  azar: () => number = Math.random,
  conBola = !en.bola_toxica?.solo_traicion,
): { tipo: 'especial' | 'clon' | 'bola'; blanco?: Luchador } | null {
  if (e.clon !== undefined) return null;
  const bajo = en.remata ? heroes.find((h) => h.ps > 0 && h.ps <= h.psMax * en.remata!.vida) : undefined;
  if (en.especial && bajo && e.carga >= en.remata!.carga) return { tipo: 'especial', blanco: bajo };
  const puedeClonar =
    !!en.clon &&
    e.carga >= (en.clon.carga ?? CARGA_LLENA) &&
    !enemigos.some((x) => x.clon !== undefined && x.ps > 0) &&
    e.ps - e.psMax * en.clon.costo > e.psMax * ((en.huye_a ?? 0) + 0.1);
  if (puedeClonar && (!en.especial || azar() < (en.clon!.probabilidad ?? 0.5))) return { tipo: 'clon' };
  if (!especialListo(e)) return null;
  // Con la barra llena, al azar: la Mega Bola Tóxica (si la tiene) o su especial.
  if (en.bola_toxica && conBola && (!en.especial || azar() < (en.bola_toxica.peso ?? 0.35))) return { tipo: 'bola' };
  return en.especial ? { tipo: 'especial' } : null;
}

/**
 * Confusión: al atacar (ataque o especial), el confundido se pega a sí mismo con esta probabilidad según los turnos
 * que le quedan (más al principio: 40 %, 30 %, 20 %). El golpe a sí mismo es su ataque con este poder.
 */
export const CONFUSION = { base: 0.1, porTurno: 0.1, poder: 6 } as const;
export const seConfunde = (l: Luchador, azar: () => number = Math.random) =>
  l.confundido > 0 && azar() < CONFUSION.base + CONFUSION.porTurno * l.confundido;

/**
 * El ataque normal de un enemigo: uno al azar, según su `peso`. Los que paralizan o confunden solo van contra quien
 * todavía no lo está (si nadie, no se eligen). Devuelve el ataque y sus blancos (null si no hay ninguno posible).
 */
export function eligeAtaque(ataques: Ataque[], heroes: Luchador[], azar: () => number = Math.random): { ataque: Ataque; blancos: Luchador[] } | null {
  const vivos = heroes.filter((h) => h.ps > 0);
  const libres = (a: Ataque) =>
    a.paraliza ? vivos.filter((h) => !h.paralizado && !h.inmuneParalisis) : a.confunde ? vivos.filter((h) => !h.confundido) : vivos;
  const posibles = ataques.filter((a) => libres(a).length > 0);
  if (!posibles.length) return null;
  const total = posibles.reduce((n, a) => n + (a.peso ?? 1), 0);
  let r = azar() * total;
  const ataque = posibles.find((a) => (r -= a.peso ?? 1) < 0) ?? posibles[posibles.length - 1];
  const pool = libres(ataque);
  return { ataque, blancos: ataque.objetivo === 'todos' ? pool : [pool[Math.floor(azar() * pool.length)]] };
}

/**
 * Los estados no se acumulan: el que ya está paralizado, confundido o envenenado no puede volver a caer en eso
 * (tampoco el que acaba de salir de una parálisis: un turno de respiro). Devuelve el estado que ya tiene, si lo tiene.
 */
export function yaTiene(l: Luchador, efecto: { paraliza?: number; confunde?: number; veneno?: unknown }): 'paralizado' | 'confundido' | 'envenenado' | null {
  if (efecto.paraliza && (l.paralizado > 0 || l.inmuneParalisis)) return 'paralizado';
  if (efecto.confunde && l.confundido > 0) return 'confundido';
  if (efecto.veneno && l.envenenado) return 'envenenado';
  return null;
}

/** A quién va cada ráfaga: una a cada uno (en orden al azar) y las que sobran, al azar. */
export function repartirRafagas<T>(n: number, vivos: T[], azar: () => number = Math.random): T[] {
  if (!vivos.length) return [];
  const orden = [...vivos].sort(() => azar() - 0.5);
  return Array.from({ length: n }, (_, i) => (i < orden.length ? orden[i] : orden[Math.floor(azar() * orden.length)]));
}

/** Cuántos usos le quedan de un ataque en esta pelea (Infinity si no tiene límite). */
export const quedan = (l: Luchador, a: Ataque) => (a.usos === undefined ? Infinity : Math.max(0, a.usos - (l.usados?.[a.nombre] ?? 0)));
/** Gasta un uso de un ataque. */
export const gastarUso = (l: Luchador, a: Ataque) => {
  if (a.usos === undefined) return;
  l.usados = { ...l.usados, [a.nombre]: (l.usados?.[a.nombre] ?? 0) + 1 };
};

/** Los ataques que tiene un héroe en su nivel: los de siempre y los que ya aprendió. */
export const ataquesDe = (h: { nivel: number }, d: Heroe): Ataque[] => [
  ...d.ataques,
  ...(d.aprende ?? []).filter((x) => x.nivel <= h.nivel).map((x) => x.ataque),
];
/** Lo que aprende justo al llegar a ese nivel. */
export const aprendeEn = (d: Heroe, nivel: number): Ataque[] => (d.aprende ?? []).filter((x) => x.nivel === nivel).map((x) => x.ataque);

/** Probabilidad de que un golpe a uno solo vaya al cebo (si hay uno en pie), si el enemigo no dice otra. */
export const CEBO = 0.55;
/** Turnos que dura un cebo si nadie le pega: después se evapora. */
export const CEBO_TURNOS = 3;
/** Crea el cebo de un héroe: su copia en blanco y negro, con 1 PS y sin poder hacer nada. */
export function crearCebo(h: Luchador, id: string): Luchador {
  return { ...h, id, ps: 1, psMax: 1, extra: 0, extraDef: 0, carga: 0, esquivando: false, distraido: false, paralizado: 0, confundido: 0, envenenado: null, protegido: 0, cebo: true };
}

/** El jefe se retira cuando le queda esta parte de sus PS (o menos). */
export const seRetira = (l: Luchador, e: Enemigo) => !!e.huye_a && l.ps > 0 && l.ps <= l.psMax * e.huye_a;

export const vivo = (l: Luchador) => l.ps > 0;

/** Lo que se guarda en la partida: nivel y experiencia de cada héroe y la mochila. */
export interface Progreso {
  heroes: Record<string, { nivel: number; xp: number }>;
  mochila: Record<string, number>;
  /** Las monedas de la partida (para Boringplace); sin ninguna, no está. */
  monedas?: number;
}

/** Monedas que da un enemigo al caer (según su nivel) y el jefe al retirarse (por nivel). */
export const monedasDe = (nivel: number) => nivel * 2;
export const monedasJefe = (nivel: number) => nivel * 5;

/**
 * El progreso guardado en las variables: `nivel_<héroe>`, `xp_<héroe>` (nivel 0: todavía no peleó; se usa el del
 * .json) y `mochila_<objeto>` (cuántos hay).
 */
export function progresoDeVars(vars: Vars): Progreso {
  const p: Progreso = { heroes: {}, mochila: {} };
  for (const [k, v] of Object.entries(vars)) {
    if (typeof v !== 'number') continue;
    const nivel = k.match(/^nivel_(.+)$/);
    if (nivel && v > 0) p.heroes[nivel[1]] = { nivel: v, xp: typeof vars[`xp_${nivel[1]}`] === 'number' ? (vars[`xp_${nivel[1]}`] as number) : 0 };
    const obj = k.match(/^mochila_(.+)$/);
    if (obj && v > 0) p.mochila[obj[1]] = v;
    if (k === 'monedas' && v > 0) p.monedas = v;
  }
  return p;
}

export function varsDeProgreso(p: Progreso, objetos: string[]): Vars {
  return {
    ...Object.fromEntries(Object.entries(p.heroes).flatMap(([k, { nivel, xp }]) => [[`nivel_${k}`, nivel], [`xp_${k}`, xp]])),
    // También los que se gastaron (quedan en 0).
    ...Object.fromEntries(objetos.map((k) => [`mochila_${k}`, p.mochila[k] ?? 0])),
    ...(p.monedas !== undefined ? { monedas: p.monedas } : {}),
  };
}
