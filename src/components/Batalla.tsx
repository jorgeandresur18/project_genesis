import { useEffect, useRef, useState, type CSSProperties } from 'react';
import '@fontsource/press-start-2p/400.css';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import { useT } from '../engine/i18n';
import { playChip, playSelect, precargarMenus, startTyping, stopTyping, type Chip } from '../engine/sound';
import { TEXT_SPEED_INSTANT, useStore } from '../engine/store';
import type { Vars } from '../engine/types';
import {
  CARGA,
  CARGA_LLENA,
  ESPECIAL_MS,
  CEBO_TURNOS,
  CEBO,
  crearCebo,
  aprendeEn,
  ataquesDe,
  CONFUSION,
  seConfunde,
  eligeAtaque,
  crearClon,
  eligeEspecial,
  vanPerdiendo,
  falla,
  cargar,
  crearLuchador,
  dano,
  disponibles,
  especialListo,
  golpesEspecial,
  ganarXp,
  seRetira,
  usarObjeto,
  varsDeProgreso,
  vivo,
  xpDe,
  xpParaSubir,
  type Ataque,
  type DatosBatalla,
  type Especial,
  type Luchador,
  type Objeto,
  type Progreso,
} from '../engine/batalla';

/**
 * Batalla por turnos (RPG estilo EarthBound / Final Fantasy) dentro de la historia (ver `batalla` en la escena;
 * docs/SPEC.md). Cada turno, cada héroe que puede actuar elige qué hace (Cami pega fuerte y actúa un turno sí y
 * uno no): Atacar (quien ataca se desliza hasta su objetivo), Hablar (el enemigo contesta y a veces se distrae),
 * Esquivar (a veces funciona), Objetos (la mochila: potenciadores, curaciones y recargadores que sueltan los
 * enemigos) o Huir. Con la barra de especial llena (se llena peleando, o con un recargador), en Atacar aparece el
 * especial: un aviso en el medio con los ojos del personaje sobre un fondo de velocidad de su color y una ráfaga de
 * golpes. Los soldados también tienen uno.
 * Después actúan los héroes, en el orden en que eligieron, y luego los enemigos. La horda llega de a poco y al
 * final sale el jefe, que se retira cuando está débil: ahí se gana. Los que hablan salen abajo, con su retrato, y
 * el texto se escribe con su sonido. Datos: src/data/batallas/<id>.json; cuentas: engine/batalla.ts.
 */
const BATALLAS = import.meta.glob<DatosBatalla>('../data/batallas/*.json', { eager: true, import: 'default' });
const BASE = import.meta.env.BASE_URL;
const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** Lo que tarda en deslizarse hasta el objetivo (igual que en styles.css, .batalla-figura). */
const DESLIZ_MS = 380;

type Anim = 'idle' | 'mover' | 'salto' | 'ataque' | 'daño' | 'ko' | 'victoria' | 'especial' | 'agachada' | 'llorando' | 'paralizado' | 'golpeado';
/** Lo que dura la salida de la pelea (un destello y a negro) antes de volver a la novela. */
const SALIDA_MS = 1000;
/** Lo que dura la caída lenta del último héroe (y lo que espera a que el rival termine su ataque). */
const CAIDA_MS = 1500;
const FIN_ATAQUE_MS = 450;
/** Lo que dura la presentación del enfrentamiento (`intro: "versus"`). */
const VERSUS_MS = 2700;
/** Velocidad del proyectil de un enemigo (la media luna de la sombra), en px por segundo. */
const PROYECTIL_VEL = 950;
/** Cuánto dura el aviso del especial en el medio de la pantalla. */
const AVISO_MS = 1900;
/** El clon de sombra: cuánto carga energía antes del destello. */
const CARGA_CLON_MS = 1500;
export interface Hoja {
  frameWidth: number;
  frameHeight: number;
  /** `seq`: orden de los cuadros (los especiales repiten cuadros durante unos 5 segundos). */
  animations: Record<string, { row: number; frames: number; fps: number; loop: boolean; seq?: number[] }>;
  /**
   * Por animación y cuadro, de dónde salen las balas ([x, y] en el cuadro): los destellos de las pistolas de Cami.
   * Un tercer número, si está, es hacia dónde apunta esa pistola (grados en el cuadro; 0: derecho hacia adelante).
   */
  disparos?: Record<string, Record<string, number[][]>>;
  /** El pecho: sin dirección anotada, la bala sale en la dirección pecho → punta de la pistola. */
  ancla_disparo?: [number, number];
  /** Si sus filas largas están partidas en renglones de tantos cuadros (las hojas muy anchas no cargan en celulares). */
  columnas?: number;
  /**
   * El especial que viaja (la sombra): pasos de su secuencia en que, hecha vórtice, va hasta su objetivo (ida),
   * golpea (golpe) y vuelve a su lugar (vuelta). El especial dura lo que dura su animación.
   */
  viaje?: { ida: [number, number]; golpe: [number, number]; vuelta: [number, number] };
  /**
   * Su ataque normal se lanza de lejos (la media luna de la sombra): desde el cuadro `cuadro` de «ataque» sale la
   * imagen `imagen` (que estaba en x, y del cuadro) y cruza la pantalla.
   */
  proyectil?: { imagen: string; cuadro: number; x: number; y: number; ancho: number; alto: number };
  /** Proyectiles de otras animaciones (el corazón del beso de Nikki), con el mismo formato. */
  proyectiles?: Record<string, { imagen: string; cuadro: number; x: number; y: number; ancho: number; alto: number }>;
}

/**
 * Dónde está un sprite en la pantalla. Los sprites se agrandan con `zoom`, y algunos navegadores devuelven su
 * rectángulo sin el zoom (todo dividido por él): ahí se corrige, comparando con su ancho natural (el del cuadro).
 */
export function rectSprite(el: Element | null | undefined) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const z = parseFloat(getComputedStyle(el).zoom) || 1;
  const natural = parseFloat((el as HTMLElement).style.width);
  if (z === 1 || !natural || Math.abs(r.width - natural) >= Math.abs(r.width - natural * z)) return r;
  return { left: r.left * z, top: r.top * z, right: r.right * z, bottom: r.bottom * z, width: r.width * z, height: r.height * z };
}

/** Hacia dónde apunta una pistola en el cuadro (radianes; 0: hacia adelante, a la derecha del cuadro). */
export const anguloDisparo = (hoja: Hoja, p: number[]) => {
  if (p[2] !== undefined) return (p[2] * Math.PI) / 180;
  const [ax, ay] = hoja.ancla_disparo ?? [hoja.frameWidth * 0.45, hoja.frameHeight * 0.5];
  return Math.atan2(p[1] - ay, p[0] - ax);
};
type Bala = { key: number; x: number; y: number; dx: number; dy: number; ms: number; color: string; rafaga: boolean };
/** Un sprite de un solo cuadro (el monstruo, por ahora). */
interface Quieto {
  cuadro: [number, number];
}
const hojas = new Map<string, Promise<Hoja | Quieto>>();
const cargarHoja = (src: string) => {
  if (!hojas.has(src)) hojas.set(src, fetch(`${BASE}${src}.json`).then((r) => r.json()));
  return hojas.get(src)!;
};

type Comando =
  | { tipo: 'atacar'; ataque: number; objetivo: string }
  | { tipo: 'hablar'; objetivo: string }
  | { tipo: 'esquivar' }
  | { tipo: 'objeto'; clave: string; objetivo: string }
  | { tipo: 'especial'; objetivo: string }
  | { tipo: 'huir' };
type Menu =
  | { paso: 'comando'; i: number }
  | { paso: 'ataque'; i: number }
  | { paso: 'objeto'; i: number }
  | { paso: 'objetivo'; i: number; lado: 'enemigo' | 'heroe'; luego: (id: string) => Comando; caidos?: boolean };

export function Batalla({
  id,
  progreso,
  onGanar,
  onPerder,
  onPerdonar,
}: {
  id: string;
  /** Nivel, experiencia y mochila con que llegan los héroes (si no, los del .json y la mochila vacía). */
  progreso?: Progreso;
  /** Al ganar (o huir): las variables que hay que guardar en la partida (niveles, experiencia, mochila). */
  onGanar: (vars: Vars) => void;
  onPerder: () => void;
  /** Si el rival perdona y la pelea termina hablando (Nikki). Si no está, cuenta como ganar. */
  onPerdonar?: (vars: Vars) => void;
}) {
  const d = BATALLAS[`../data/batallas/${id}.json`];
  return d ? <Pelea d={d} progreso={progreso} onGanar={onGanar} onPerder={onPerder} onPerdonar={onPerdonar} /> : null;
}

function Pelea({
  d,
  progreso,
  onGanar,
  onPerder,
  onPerdonar,
}: {
  d: DatosBatalla;
  progreso?: Progreso;
  onGanar: (vars: Vars) => void;
  onPerder: () => void;
  onPerdonar?: (vars: Vars) => void;
}) {
  const t = useT();
  // El estado de la pelea vive en un ref (lo cambian las acciones, en orden) y se redibuja con `forzar`.
  const b = useRef({
    heroes: d.heroes.map((k) =>
      crearLuchador(k, k, 'heroe', d.personajes[k], progreso?.heroes[k]?.nivel || d.personajes[k].nivel, progreso?.heroes[k]?.xp ?? 0),
    ),
    enemigos: [] as Luchador[],
    // Con lo que empieza la mochila si tiene menos (p. ej. un revivir).
    mochila: Object.fromEntries(
      [...new Set([...Object.keys(progreso?.mochila ?? {}), ...Object.keys(d.mochila_inicial ?? {})])].map((k) => [
        k,
        Math.max(progreso?.mochila[k] ?? 0, d.mochila_inicial?.[k] ?? 0),
      ]),
    ) as Record<string, number>,
    /** Cuántos de la horda ya salieron. */
    salieron: 0,
    /** Los héroes que atacaron el turno anterior (los que no pueden repetir, descansan este). */
    actuaron: [] as string[],
    /** Cuántos turnos seguidos se le habló al rival que perdona (Nikki), y si ya perdonó. */
    racha: 0,
    perdona: false,
    /** Los que quedaron paralizados (o confundidos) en este turno (empiezan a descontar en el siguiente). */
    paralizadoRecien: [] as string[],
    confundidoRecien: [] as string[],
    /** Los cebos (copias de un héroe que no hacen nada): aparte de los héroes, con dónde se dibujan. */
    cebos: [] as { l: Luchador; de: string; x: number; y: number; turnos: number }[],
    /** Los que no pueden actuar en este turno (Cami, un turno sí y uno no). */
    descansan: [] as string[],
    /** Los que se ven descansando (Cami agachada): desde que actúan hasta el final del turno siguiente. */
    cansados: new Set<string>(),
    avisoRefuerzos: false,
    avisoCaida: false,
  });
  const [, setVersion] = useState(0);
  const forzar = () => setVersion((v) => v + 1);
  const [anims, setAnims] = useState<Record<string, Anim>>({});
  /** Cuántas veces empezó una animación (para repetir la misma: cada golpe de una ráfaga). */
  const [veces, setVeces] = useState<Record<string, number>>({});
  /** Luces: el destello de cada golpe sobre quien lo recibe, y el fogonazo de pantalla de un especial. */
  /** Efectos de un momento en una figura: un enemigo que aparece, alguien que se agacha o se para. */
  const [efectos, setEfectos] = useState<Record<string, string>>({});
  const efecto = (lid: string, clase: string, ms: number) => {
    setEfectos((x) => ({ ...x, [lid]: clase }));
    setTimeout(() => setEfectos((x) => (x[lid] === clase ? { ...x, [lid]: '' } : x)), ms);
  };
  /** Un objeto que cae del cielo (la ayuda del juego). */
  const [cae, setCae] = useState<{ key: number; objeto: string } | null>(null);
  const [luces, setLuces] = useState<{ key: number; id: string; color: string; fuerte: boolean }[]>([]);
  const [fogonazo, setFogonazo] = useState<{ key: number; color: string } | null>(null);
  const [aviso, setAviso] = useState<{ key: number; e: Especial; sprite: string; heroe: boolean } | null>(null);
  const [balas, setBalas] = useState<Bala[]>([]);
  const raiz = useRef<HTMLDivElement>(null);
  /**
   * Quién está disparando: con «una», sale una sola bala al primer destello de su ataque y avisa al llegar; con
   * «rafaga» (el especial), en cada destello salen balas hacia los enemigos (y alguna perdida).
   */
  const disparando = useRef(
    new Map<string, { tipo: 'una'; hacia: Luchador; llego: () => void } | { tipo: 'rafaga'; puntos: number[][]; color: string }>(),
  );
  /**
   * Regla: los que caen por un especial (héroes o enemigos) se siguen viendo golpeados hasta que termina la animación
   * del especial del rival; recién ahí pasan a derrotados (y los enemigos se van).
   */
  const retenidos = useRef(new Set<string>());
  const enEspecial = useRef(false);
  /** Cuánto se corre cada uno de su lugar (y en cuántos ms, si no es el deslizamiento de siempre). */
  const [desliz, setDesliz] = useState<Record<string, { x: number; y: number; ms?: number }>>({});
  /** La pantalla oscura de un especial (el vórtice de la sombra). */
  const [oscuro, setOscuro] = useState(false);
  const figuras = useRef(new Map<string, HTMLDivElement>());
  const [numeros, setNumeros] = useState<{ key: number; id: string; texto: string; tipo: 'dano' | 'cura' | 'critico' | 'falla' }[]>([]);
  /** El mensaje: la narración arriba; lo que dice alguien, abajo con su retrato. Se escribe letra por letra. */
  const [mensaje, setMensaje] = useState<{ texto: string; quien?: string; turno?: string; n: number } | null>(null);
  const [letras, setLetras] = useState(0);
  const saltar = useRef<(() => void) | null>(null);
  /** El héroe que está eligiendo. */
  const [eligiendo, setEligiendo] = useState<string | null>(null);
  const [menu, setMenu] = useState<Menu>({ paso: 'comando', i: 0 });
  /** Si en el menú de comandos se puede volver al héroe anterior (no es el primero en elegir). */
  const [puedeVolver, setPuedeVolver] = useState(false);
  const elegido = useRef<((c: Comando | null) => void) | null>(null);
  const fin = useRef({ onGanar, onPerder, onPerdonar });
  fin.current = { onGanar, onPerder, onPerdonar };
  /** La presentación del enfrentamiento, antes de empezar. */
  const [versus, setVersus] = useState(d.intro === 'versus');
  /**
   * El golpe que derrota al último héroe: se queda golpeado hasta que el rival casi termina su ataque y cae lento;
   * recién ahí queda con su sprite de derrotado.
   */
  const caeElUltimo = async (h: Luchador) => {
    void animar(h.id, 'golpeado');
    await espera(FIN_ATAQUE_MS);
    playChip('herido');
    efecto(h.id, 'cae-lento', CAIDA_MS + 100);
    await espera(CAIDA_MS);
    void animar(h.id, 'ko');
    playChip('muerte');
    await espera(600);
  };
  /** Saliendo de la pelea: un destello y la pantalla se va a negro; después vuelve la novela. */
  const [saliendo, setSaliendo] = useState(false);
  const salir = async (fn: () => void) => {
    setSaliendo(true);
    playChip('cambio');
    await espera(SALIDA_MS);
    fn();
  };
  /** Los proyectiles en el aire (la media luna de la sombra). */
  const [proyectiles, setProyectiles] = useState<
    { key: number; src: string; x: number; y: number; w: number; h: number; dx: number; dy: number; ms: number; demora: number; ang: number }[]
  >([]);

  const animar = async (lid: string, a: Anim, ms = 0) => {
    setAnims((x) => ({ ...x, [lid]: a }));
    setVeces((v) => ({ ...v, [lid]: (v[lid] ?? 0) + 1 }));
    if (ms) {
      await espera(ms);
      setAnims((x) => ({ ...x, [lid]: x[lid] === 'ko' ? 'ko' : 'idle' }));
    }
  };
  /** Centro del cuerpo de un luchador en la pantalla (relativo a la batalla). */
  const centroDe = (l: Luchador) => {
    const r = rectSprite(figuras.current.get(l.id)?.querySelector('.batalla-sprite'));
    const base = raiz.current?.getBoundingClientRect();
    if (!r || !base) return null;
    return { x: r.left + r.width / 2 - base.left, y: r.top + r.height * 0.5 - base.top };
  };
  /** Dónde está en la pantalla un punto del cuadro del que dispara (los héroes están dados vuelta: se refleja). */
  const enPantalla = (quien: Luchador, hoja: Hoja, p: number[]) => {
    const r = rectSprite(figuras.current.get(quien.id)?.querySelector('.batalla-sprite'));
    const base = raiz.current?.getBoundingClientRect();
    if (!r || !base) return null;
    const escala = r.width / hoja.frameWidth;
    return {
      x: (quien.lado === 'heroe' ? r.right - p[0] * escala : r.left + p[0] * escala) - base.left,
      y: r.top + p[1] * escala - base.top,
      ancho: base.width,
    };
  };
  const nuevaBala = (x: number, y: number, x1: number, y1: number, velocidad: number, color: string, rafaga: boolean) => {
    const ms = Math.max(90, (Math.hypot(x1 - x, y1 - y) / velocidad) * 1000);
    const key = Math.random();
    setBalas((b) => [...b, { key, x, y, dx: x1 - x, dy: y1 - y, ms, color, rafaga }]);
    setTimeout(() => setBalas((b) => b.filter((z) => z.key !== key)), ms + 40);
    return ms;
  };
  /** El disparo normal: sale de la punta de la pistola y va derecho al cuerpo del que eligió. Devuelve cuánto tarda. */
  const dispararA = (quien: Luchador, hoja: Hoja, punta: number[], hacia: Luchador) => {
    const o = enPantalla(quien, hoja, punta);
    const c = centroDe(hacia);
    if (!o || !c) return 0;
    return nuevaBala(o.x, o.y, c.x, c.y, 1500, '#7fe6ff', false);
  };
  /**
   * Una bala de la ráfaga del especial: sale de la punta de la pistola en la dirección en que apunta esa pistola en
   * ese cuadro (arriba, al medio, abajo: sigue al brazo) y cruza la pantalla.
   */
  const dispararRafaga = (quien: Luchador, hoja: Hoja, punta: number[], color: string) => {
    const o = enPantalla(quien, hoja, punta);
    if (!o) return;
    // Los héroes están dados vuelta: la dirección también.
    const a = anguloDisparo(hoja, punta);
    let ang = quien.lado === 'heroe' ? Math.PI - a : a;
    ang += (Math.random() - 0.5) * 0.08;
    // Alcance: hasta un poco más allá del rival más lejano (ahí se apaga), no toda la pantalla.
    // Sin fin: sigue hasta salir de la vista del juego.
    const largo = o.ancho * 1.3;
    nuevaBala(o.x, o.y, o.x + Math.cos(ang) * largo, o.y + Math.sin(ang) * largo, 2600, color, true);
  };
  /** Cada cuadro nuevo de un luchador: si está disparando y ese cuadro tiene destellos, salen balas. */
  const alCuadro = (l: Luchador, anim: string, col: number, hoja: Hoja) => {
    const modo = disparando.current.get(l.id);
    if (!modo) return;
    const puntos = hoja.disparos?.[anim]?.[String(col)];
    if (modo.tipo === 'rafaga') {
      // Las puntas de las pistolas en este cuadro: de ahí salen las ráfagas (si no hay destello, no dispara).
      modo.puntos = puntos ?? [];
      return;
    }
    if (!puntos) return;
    disparando.current.delete(l.id);
    const ms = dispararA(l, hoja, puntos[0], modo.hacia);
    setTimeout(modo.llego, ms);
  };
  /**
   * Lanza el proyectil de un enemigo (la media luna de la sombra): sale de donde estaba en su cuadro, pasa por el
   * blanco y sigue hasta salir de la pantalla. Devuelve en cuántos ms llega al blanco (contando la demora).
   */
  const lanzar = (quien: Luchador, hoja: Hoja, p: NonNullable<Hoja['proyectil']>, hacia: Luchador, demora: number) => {
    const s = rectSprite(figuras.current.get(quien.id)?.querySelector('.batalla-sprite'));
    const base = raiz.current?.getBoundingClientRect();
    const c = centroDe(hacia);
    if (!s || !base || !c) return demora;
    const k = s.width / hoja.frameWidth;
    const cx = p.x + p.ancho / 2;
    const x = (quien.lado === 'heroe' ? s.right - cx * k : s.left + cx * k) - base.left;
    const y = s.top + (p.y + p.alto / 2) * k - base.top;
    const ang = Math.atan2(c.y - y, c.x - x);
    const cos = Math.cos(ang);
    const largo = ((cos > 0 ? base.width - x : x) + p.ancho * k) / Math.max(0.3, Math.abs(cos));
    const key = Math.random();
    const ms = (largo / PROYECTIL_VEL) * 1000;
    setProyectiles((l) => [
      ...l,
      { key, src: `${BASE}${p.imagen}.png`, x, y, w: p.ancho * k, h: p.alto * k, dx: cos * largo, dy: Math.sin(ang) * largo, ms, demora, ang },
    ]);
    setTimeout(() => setProyectiles((l) => l.filter((z) => z.key !== key)), demora + ms + 60);
    setTimeout(() => playChip(sonidoDe(quien)), demora);
    return demora + (Math.hypot(c.x - x, c.y - y) / PROYECTIL_VEL) * 1000;
  };
  /** El sonido de los golpes de cada uno (puño, cachetada, espada…). */
  const sonidoDe = (l: Luchador) => ((l.lado === 'heroe' ? d.personajes[l.clave]?.sonido : d.enemigos[l.clave]?.sonido) ?? 'golpe') as Chip;
  /** Los que están en el aire (levantados por el especial de la sombra): sus golpes no los bajan. */
  const enElAire = useRef(new Set<string>());
  /** Cuánto está levantado cada uno (px): sube solo el sprite; su sombra se queda en el piso. */
  const [aire, setAire] = useState<Record<string, number>>({});
  /**
   * Regla de todo el combate: quien recibe un ataque (normal o especial) se queda con el sprite de golpeado mientras
   * dura el ataque, hasta que el rival vuelve a su lugar (no vuelve al base con el rival al lado).
   */
  const bajoEspecial = useRef(new Set<string>());
  /**
   * Paraliza a un héroe unos turnos. No se suma al descanso de Cami: si iba a descansar por el tobillo, la
   * parálisis lo reemplaza y al liberarse ya puede atacar.
   */
  /** El clon de sombra: le cuesta vida, aparece a su lado hecho de sombra y un héroe reacciona. */
  const clonar = async (e: Luchador) => {
    const c = d.enemigos[e.clave].clon!;
    const esp = d.enemigos[e.clave].especial;
    e.carga = 0;
    forzar();
    await avisar({ nombre: c.nombre, color: c.color, ojos: esp?.ojos ?? [0, 0, 1, 1], texto: c.texto, poder: 0, golpes: 0, objetivo: 'uno', posicion: 'objetivo' }, d.enemigos[e.clave].sprite, false);
    await decir(fmt(c.texto, { quien: e.nombre }));
    // Carga energía (un aura que crece y late), un destello corto y sale el clon.
    efecto(e.id, 'carga-energia', CARGA_CLON_MS + 100);
    playChip('carga');
    await espera(CARGA_CLON_MS);
    luz(e.id, '#ffffff', true);
    setFogonazo({ key: Math.random(), color: c.color });
    playChip('destello');
    await espera(180);
    const costo = Math.round(e.psMax * c.costo);
    e.ps = Math.max(1, e.ps - costo);
    numero(e.id, `-${costo}`, 'dano');
    const k = crearClon(e, c, `${e.clave}-clon-${Date.now()}`);
    b.current.enemigos = [...b.current.enemigos.filter(vivo), k];
    efecto(k.id, 'aparece', 900);
    playChip('vortice');
    forzar();
    await decir(fmt(t('batalla.clon_aparece'), { quien: e.nombre, n: c.turnos }));
    const r = c.reacciones?.length ? azar(c.reacciones) : null;
    if (r) await decir(r.texto, r.quien === 'Voz' ? undefined : r.quien);
  };
  /** Al final de cada turno, los clones pierden un turno; el que llega a cero se evapora. */
  const evaporar = async () => {
    for (const k of b.current.enemigos.filter((x) => vivo(x) && x.clon !== undefined)) {
      k.clon!--;
      if (k.clon! > 0) continue;
      k.ps = 0;
      void animar(k.id, 'ko');
      playChip('vortice');
      forzar();
      await decir(fmt(t('batalla.clon_se_va'), { quien: k.nombre }));
    }
  };
  /**
   * El beso de Nikki (un ataque de efecto): su animación y, cuando lo suelta, el corazón vuela hacia cada blanco y
   * sigue hasta salir de la pantalla. Al que alcanza (si no lo esquiva) lo deja confundido.
   */
  const besar = async (e: Luchador, a: Ataque, blancos: Luchador[]) => {
    const hoja = (await cargarHoja(d.enemigos[e.clave].sprite)) as Hoja;
    const fila = a.anim && 'animations' in hoja ? hoja.animations[a.anim] : undefined;
    const proy = a.anim ? hoja.proyectiles?.[a.anim] : undefined;
    const dura = fila ? ((fila.seq?.length ?? fila.frames) * 1000) / fila.fps : 1200;
    if (fila) void animar(e.id, a.anim as Anim, dura);
    let llegadas = blancos.map(() => 600);
    if (proy && fila) {
      // Hasta el cuadro en que suelta el corazón (con `seq`, su lugar en la secuencia); ahí suena el beso.
      const paso = fila.seq ? Math.max(0, fila.seq.indexOf(proy.cuadro)) : proy.cuadro;
      await espera((paso * 1000) / fila.fps);
      playChip('beso');
      const desde = Date.now();
      llegadas = blancos.map((h, i) => lanzar(e, hoja, proy, h, i * 160));
      await espera(Math.max(...llegadas) - (Date.now() - desde));
    } else {
      playChip('beso');
      await espera(600);
    }
    for (const h of blancos) {
      if (h.esquivando && Math.random() < d.esquivar) {
        numero(h.id, 'MISS', 'falla');
        void animar(h.id, 'salto', 600);
        await lineas('esquiva_ok', { quien: h.nombre });
        continue;
      }
      await confundir(h, a.confunde!);
    }
  };
  const confundir = async (x: Luchador, n: number) => {
    x.confundido = n;
    b.current.confundidoRecien.push(x.id);
    luz(x.id, '#ff6fae', true);
    playChip('boing');
    forzar();
    await decir(fmt(t('batalla.confundido'), { quien: x.nombre, n }));
  };
  /** El Cebo: una copia del héroe en blanco y negro, delante de él. No hace nada. */
  const dejarCebo = async (h: Luchador, a: Ataque) => {
    await decir(fmt(a.texto, { quien: h.nombre }));
    const f = figuras.current.get(h.id);
    const lado = f?.parentElement?.getBoundingClientRect();
    const r = f?.getBoundingClientRect();
    // Uno solo por héroe: el viejo se va.
    b.current.cebos = b.current.cebos.filter((x) => x.de !== h.id && vivo(x.l));
    const k = crearCebo(h, `${h.id}-cebo-${Date.now()}`);
    // El turno en que aparece cuenta (los enemigos ya pueden pegarle).
    b.current.cebos.push({ l: k, de: h.id, x: r && lado ? r.left - lado.left - r.width * 0.45 : 0, y: r && lado ? r.top - lado.top : 0, turnos: CEBO_TURNOS });
    efecto(k.id, 'aparece-cebo', 700);
    playChip('cambio');
    forzar();
    await decir(fmt(t('batalla.cebo_aparece'), { quien: h.nombre }));
  };
  /** A veces el golpe a uno solo va al cebo (según cuánto cae en él quien ataca). */
  const desviar = (blancos: Luchador[], quien: Luchador) => {
    const cebos = b.current.cebos.map((x) => x.l).filter(vivo);
    if (!cebos.length) return blancos;
    if (blancos.length > 1) return [...blancos, ...cebos];
    return Math.random() < (d.enemigos[quien.clave]?.cae_en_cebo ?? CEBO) ? [azar(cebos)] : blancos;
  };
  /** Al final de cada turno, el cebo al que nadie le pegó se acerca a evaporarse. */
  const evaporarCebos = async () => {
    let alguno = false;
    for (const c of b.current.cebos.filter((x) => vivo(x.l))) {
      if (--c.turnos > 0) continue;
      alguno = true;
      c.l.ps = 0;
      void animar(c.l.id, 'ko');
      playChip('vortice');
      forzar();
      await decir(fmt(t('batalla.cebo_se_va'), { quien: c.l.nombre }));
    }
    if (!alguno) return;
    setTimeout(() => {
      b.current.cebos = b.current.cebos.filter((x) => vivo(x.l));
      forzar();
    }, 900);
  };
  /** Los cebos que recibieron un golpe se deshacen (y se van). */
  const limpiarCebos = async () => {
    const caidos = b.current.cebos.filter((x) => !vivo(x.l));
    if (!caidos.length) return;
    for (const x of caidos) await decir(fmt(t('batalla.cebo_cae'), { quien: x.l.nombre }));
    setTimeout(() => {
      b.current.cebos = b.current.cebos.filter((x) => vivo(x.l));
      forzar();
    }, 900);
  };
  /** Termina un ataque: los golpeados que siguen de pie vuelven a su pose. */
  const soltar = (golpeados: Luchador[]) => {
    for (const x of golpeados) {
      if (!bajoEspecial.current.delete(x.id)) continue;
      if (vivo(x) && !enElAire.current.has(x.id)) setAnims((m) => ({ ...m, [x.id]: 'idle' }));
    }
  };
  const paralizar = async (x: Luchador, n: number) => {
    x.paralizado = n;
    b.current.paralizadoRecien.push(x.id);
    b.current.actuaron = b.current.actuaron.filter((id) => id !== x.id);
    b.current.cansados.delete(x.id);
    luz(x.id, '#a64dff', true);
    forzar();
    await decir(fmt(t('batalla.paralizado'), { quien: x.nombre, n }));
  };
  const luz = (lid: string, color: string, fuerte = false) => {
    const key = Math.random();
    setLuces((l) => [...l, { key, id: lid, color, fuerte }]);
    setTimeout(() => setLuces((l) => l.filter((x) => x.key !== key)), 450);
  };
  /** El aviso del especial: los ojos del personaje sobre un fondo de velocidad de su color, y un fogonazo. */
  const avisar = async (e: Especial, sprite: string, heroe: boolean) => {
    playChip('cambio');
    setAviso({ key: Math.random(), e, sprite, heroe });
    await espera(AVISO_MS);
    setAviso(null);
    setFogonazo({ key: Math.random(), color: e.color });
  };
  const numero = (lid: string, texto: string, tipo: 'dano' | 'cura' | 'critico' | 'falla') => {
    const key = Math.random();
    setNumeros((n) => [...n, { key, id: lid, texto, tipo }]);
    setTimeout(() => setNumeros((n) => n.filter((x) => x.key !== key)), 1000);
  };
  /**
   * Muestra un mensaje: se escribe letra por letra (a la velocidad de texto de Opciones; si habla alguien, con el
   * sonido de escritura) y queda el tiempo justo para leerlo. Un clic o Enter completa el texto y otro sigue.
   */
  const decir = (texto: string, quien?: string) =>
    new Promise<void>((resolve) => {
      const cps = useStore.getState().settings.textSpeed;
      const instante = cps >= TEXT_SPEED_INSTANT;
      setMensaje({ texto, quien, n: Math.random() });
      let n = instante ? texto.length : 0;
      setLetras(n);
      let leyendo: ReturnType<typeof setTimeout> | undefined;
      let intervalo: ReturnType<typeof setInterval> | undefined;
      const listo = () => {
        clearInterval(intervalo);
        clearTimeout(leyendo);
        stopTyping();
        saltar.current = null;
        resolve();
      };
      const escrito = () => {
        clearInterval(intervalo);
        stopTyping();
        setLetras(texto.length);
        leyendo = setTimeout(listo, Math.min(3200, 700 + texto.length * (quien ? 22 : 14)));
        saltar.current = listo;
      };
      if (instante) return escrito();
      // El sonido de escritura, como en la novela (también en la narración).
      startTyping();
      intervalo = setInterval(() => {
        n += 1;
        setLetras(n);
        if (n >= texto.length) escrito();
      }, 1000 / cps);
      saltar.current = escrito;
    });
  const fmt = (s: string, v: Record<string, string | number>) => Object.entries(v).reduce((o, [k, x]) => o.replaceAll(`{${k}}`, String(x)), s);
  /** Las líneas fijas de un momento (dialogos.<clave>); las de «Voz» son narración, sin nombre. */
  const lineas = async (clave: string, v: Record<string, string | number> = {}) => {
    for (const l of d.dialogos[clave] ?? []) await decir(fmt(l.texto, v), l.quien === 'Voz' ? undefined : l.quien);
  };
  const azar = <T,>(lista: T[]) => lista[Math.floor(Math.random() * lista.length)];
  const varsFinales = () =>
    varsDeProgreso(
      { heroes: Object.fromEntries(b.current.heroes.map((h) => [h.clave, { nivel: h.nivel, xp: h.xp }])), mochila: b.current.mochila },
      Object.keys(d.objetos),
    );

  /** Pide el comando de un héroe (el menú de abajo). `null`: volver al héroe anterior. */
  const pedirComando = (h: Luchador, primero: boolean) =>
    new Promise<Comando | null>((resolve) => {
      setPuedeVolver(!primero);
      setEligiendo(h.id);
      setMenu({ paso: 'comando', i: 0 });
      setMensaje({ texto: fmt(t('batalla.que_hace'), { quien: h.nombre }), turno: h.clave, n: Math.random() });
      setLetras(Infinity);
      elegido.current = (c) => {
        elegido.current = null;
        setEligiendo(null);
        resolve(c);
      };
    });

  useEffect(() => precargarMenus(), []);
  // La música de la pelea manda mientras dura; al terminar vuelve la de la escena.
  useEffect(() => {
    useStore.getState().setMusicaBatalla(d.musica ?? null);
    return () => useStore.getState().setMusicaBatalla(null);
  }, [d]);
  // Los sprites del combate que aparecen se desbloquean en la galería.
  useEffect(() => useStore.getState().marcarRpg(d.heroes.map((k) => d.personajes[k].sprite)), [d]);
  const sacar = (clave: string, nivel: number) => {
    useStore.getState().marcarRpg([d.enemigos[clave].sprite]);
    if (clave === d.jefe.enemigo && d.musica_jefe) useStore.getState().setMusicaBatalla(d.musica_jefe);
    const e = crearLuchador(`${clave}-${b.current.enemigos.length}-${Date.now()}`, clave, 'enemigo', d.enemigos[clave], nivel);
    e.carga = Math.floor(Math.random() * 40);
    efecto(e.id, 'aparece', 900);
    playChip('enemigo');
    b.current.enemigos = [...b.current.enemigos.filter(vivo), e];
    forzar();
    return e;
  };
  const jefeSeRetira = () => {
    const jefe = b.current.enemigos.find((e) => d.enemigos[e.clave].jefe && e.clon === undefined);
    return jefe && seRetira(jefe, d.enemigos[jefe.clave]) ? jefe : null;
  };

  /** Un turno: eligen los héroes que pueden actuar, actúan en ese orden y después atacan los enemigos. */
  const turno = async (): Promise<'sigue' | 'gana' | 'huye' | 'pierde' | 'perdona'> => {
    const opciones = disponibles(b.current.heroes, d.personajes, b.current.actuaron);
    b.current.descansan = b.current.heroes.filter((h) => vivo(h) && !opciones.includes(h)).map((h) => h.id);
    forzar();
    for (const h of b.current.heroes.filter((x) => vivo(x) && x.paralizado)) await decir(fmt(t('batalla.sigue_paralizado'), { quien: h.nombre, n: h.paralizado }));
    if (!opciones.length) {
      await lineas('descanso');
      b.current.actuaron = [];
    } else {
      const elecciones: [Luchador, Comando][] = [];
      for (let k = 0; k < opciones.length; k++) {
        const c = await pedirComando(opciones[k], k === 0);
        if (!c) {
          // Volver al héroe anterior (deshace su elección; si era un objeto, vuelve a la mochila).
          const [, antes] = elecciones.pop() ?? [];
          if (antes?.tipo === 'objeto') b.current.mochila[antes.clave]++;
          k = Math.max(-1, k - 2);
          continue;
        }
        if (c.tipo === 'huir') {
          if (d.huir) {
            await lineas('huir');
            return 'huye';
          }
          await lineas('huir_no');
          k--;
          continue;
        }
        if (c.tipo === 'objeto') b.current.mochila[c.clave]--;
        elecciones.push([opciones[k], c]);
      }
      setMensaje(null);
      // Solo atacar (o el especial) la cansa: hablar, esquivar o usar un objeto no le hacen doler el tobillo.
      const ataca = (c: Comando) => c.tipo === 'atacar' || c.tipo === 'especial';
      b.current.actuaron = elecciones.filter(([, c]) => ataca(c)).map(([h]) => h.id);
      for (const [h, c] of elecciones) {
        if (!vivo(h)) {
          if (c.tipo === 'objeto') b.current.mochila[c.clave]++;
          continue;
        }
        // Si ya no queda ningún enemigo (antes del jefe), los ataques de este turno se pierden.
        if (c.tipo !== 'objeto' && c.tipo !== 'esquivar' && !b.current.enemigos.some(vivo)) continue;
        await actuarHeroe(h, c);
        if (b.current.perdona) return 'perdona';
        if (jefeSeRetira()) return 'gana';
        if (ataca(c)) await cansarse(h);
      }
    }
    if (jefeSeRetira()) return 'gana';
    // Se acabó la horda: sale el jefe (actúa desde el turno siguiente).
    if (!b.current.enemigos.some(vivo)) {
      playChip('modem');
      await lineas('jefe');
      const e = sacar(d.jefe.enemigo, d.jefe.nivel);
      await decir(fmt(t('batalla.aparece_jefe'), { nombre: e.nombre }));
      await levantarse();
      return 'sigue';
    }
    for (const e of b.current.enemigos.filter(vivo)) {
      if (!b.current.heroes.some(vivo)) break;
      await actuarEnemigo(e);
    }
    b.current.heroes.forEach((h) => {
      h.esquivando = false;
      // La parálisis se cuenta por turnos en que no pudo actuar (la de este turno, recién desde el siguiente).
      if (h.paralizado && !b.current.paralizadoRecien.includes(h.id)) h.paralizado--;
      if (h.confundido && !b.current.confundidoRecien.includes(h.id)) h.confundido--;
    });
    b.current.paralizadoRecien = [];
    b.current.confundidoRecien = [];
    forzar();
    if (!b.current.heroes.some(vivo)) return 'pierde';
    await evaporar();
    await evaporarCebos();
    await ayudar();
    await levantarse();
    return 'sigue';
  };

  /** El juego ayuda si van perdiendo: a veces cae un objeto (del cielo o de algún lado) a la mochila. */
  const ayudar = async () => {
    const a = d.ayuda;
    if (!a || !vanPerdiendo(b.current.heroes, a.umbral) || Math.random() >= a.cae) return;
    b.current.mochila[a.objeto] = (b.current.mochila[a.objeto] ?? 0) + 1;
    playChip('vida');
    setCae({ key: Math.random(), objeto: a.objeto });
    forzar();
    await lineas('ayuda', { objeto: d.objetos[a.objeto].nombre });
  };

  /** Apenas actúa, el que no puede repetir (Cami) se agacha: necesita recuperarse. */
  const cansarse = async (h: Luchador) => {
    const p = d.personajes[h.clave];
    if (p.seguido || !p.descanso || !vivo(h) || b.current.cansados.has(h.id)) return;
    b.current.cansados.add(h.id);
    efecto(h.id, 'se-agacha', 600);
    forzar();
    await decir(fmt(p.descanso_textos?.empieza ?? t('batalla.recuperarse'), { quien: h.nombre }));
  };
  /** Al terminar el turno en que descansó, se para. */
  const levantarse = async () => {
    for (const h of b.current.heroes) {
      if (!b.current.cansados.has(h.id) || !b.current.descansan.includes(h.id)) continue;
      b.current.cansados.delete(h.id);
      if (!vivo(h)) continue;
      efecto(h.id, 'se-levanta', 800);
      forzar();
      playChip('salto');
      await decir(fmt(d.personajes[h.clave].descanso_textos?.termina ?? t('batalla.se_para'), { quien: h.nombre }));
    }
  };

  // La pelea entera: la horda, el jefe, la victoria o la derrota.
  useEffect(() => {
    let sigue = true;
    const correr = async () => {
      if (d.intro === 'versus') {
        playChip('modem');
        await espera(VERSUS_MS);
        setVersus(false);
      }
      await lineas('inicio');
      const { horda } = d;
      if (!horda.niveles.length) {
        // Sin horda (p. ej. Nikki en el bar): el jefe sale de entrada.
        await lineas('jefe');
        const e = sacar(d.jefe.enemigo, d.jefe.nivel);
        await decir(fmt(t('batalla.aparece_jefe'), { nombre: e.nombre }));
      } else {
        for (; b.current.salieron < Math.min(horda.al_inicio, horda.niveles.length); b.current.salieron++) sacar(horda.enemigo, horda.niveles[b.current.salieron]);
        await decir(fmt(t('batalla.aparecen'), { n: b.current.enemigos.length }));
      }
      for (;;) {
        const r = await turno();
        if (!sigue) return;
        if (r === 'sigue') continue;
        if (r === 'huye') return salir(() => fin.current.onGanar(varsFinales()));
        if (r === 'perdona') {
          await lineas('perdon');
          return salir(() => (fin.current.onPerdonar ?? fin.current.onGanar)(varsFinales()));
        }
        if (r === 'pierde') {
          // El jefe que gana puede quedarse con otra cara (Nikki, llorando).
          const j = b.current.enemigos.find((e) => vivo(e) && e.clon === undefined && d.enemigos[e.clave].al_ganar);
          if (j) void animar(j.id, d.enemigos[j.clave].al_ganar as Anim);
          await lineas('derrota');
          return salir(() => fin.current.onPerder());
        }
        break;
      }
      const jefe = jefeSeRetira();
      // Los clones que quedan se evaporan.
      for (const k of b.current.enemigos.filter((x) => vivo(x) && x.clon !== undefined)) {
        k.ps = 0;
        void animar(k.id, 'ko');
      }
      forzar();
      const llora = jefe && d.enemigos[jefe.clave].al_retirarse;
      if (jefe && llora) void animar(jefe.id, llora as Anim);
      if (jefe && d.enemigos[jefe.clave].sale_atras) {
        playChip('vortice');
        const h = (await cargarHoja(d.enemigos[jefe.clave].sprite)) as Hoja;
        const a = llora ? h.animations?.[llora] : undefined;
        await espera(a ? ((a.seq?.length ?? a.frames) * 1000) / a.fps : 600);
        const r = figuras.current.get(jefe.id)?.getBoundingClientRect();
        const base = raiz.current?.getBoundingClientRect();
        if (r && base) setDesliz((m) => ({ ...m, [jefe.id]: { x: -(r.right - base.left + 60), y: 0, ms: 1600 } }));
        await espera(1700);
      }
      await lineas('jefe_huye');
      if (jefe) {
        setAnims((x) => ({ ...x, [jefe.id]: 'ko' }));
        jefe.ps = 0;
        forzar();
      }
      b.current.heroes.filter(vivo).forEach((h) => animar(h.id, 'victoria'));
      await lineas('victoria');
      // El premio por hacerlo retirar (Nikki: el caramelo rancio).
      for (const [k, n] of Object.entries(d.premio?.objetos ?? {})) {
        b.current.mochila[k] = (b.current.mochila[k] ?? 0) + n;
        playChip('vida');
        forzar();
        await lineas('premio', { objeto: d.objetos[k].nombre });
      }
      await salir(() => fin.current.onGanar({ ...varsFinales(), ...(d.premio?.vars ?? {}) }));
    };
    // Arranca en el siguiente ciclo: en desarrollo, React monta, desmonta y vuelve a montar (StrictMode), y sin
    // esto corrían dos peleas a la vez sobre el mismo estado.
    const arranque = setTimeout(() => void correr(), 0);
    return () => {
      sigue = false;
      clearTimeout(arranque);
      stopTyping();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Quien ataca se desliza hasta su objetivo (y después vuelve a su lugar, con `hacia` en null). */
  /** Se mueve hasta el medio de la pantalla (el especial de Cami). */
  const alCentro = async (quien: string) => {
    const a = figuras.current.get(quien)?.getBoundingClientRect();
    const base = raiz.current?.getBoundingClientRect();
    if (!a || !base) return;
    setDesliz((m) => ({ ...m, [quien]: { x: base.left + base.width / 2 - (a.left + a.width / 2), y: 0 } }));
    await animar(quien, 'mover', DESLIZ_MS);
  };
  /** Cuánto tiene que correrse (desde su lugar) para quedar a un costado de su objetivo, del lado de donde viene. */
  const junto = (quien: string, hacia: string) => {
    const a = figuras.current.get(quien)?.getBoundingClientRect();
    const o = figuras.current.get(hacia)?.getBoundingClientRect();
    if (!a || !o) return null;
    const lado = a.left > o.left ? 1 : -1;
    return { x: o.left + o.width / 2 + lado * o.width * 0.55 - (a.left + a.width / 2), y: o.bottom - a.bottom };
  };
  const deslizar = async (quien: string, hacia: string | null, anim: Anim = 'mover') => {
    if (!hacia) {
      setDesliz((x) => ({ ...x, [quien]: { x: 0, y: 0 } }));
      await animar(quien, 'mover', DESLIZ_MS);
      return;
    }
    const p = junto(quien, hacia);
    if (!p) return;
    setDesliz((m) => ({ ...m, [quien]: p }));
    if (anim !== 'mover') {
      // Llega con otra animación (el especial): se queda en ella.
      void animar(quien, anim);
      return espera(DESLIZ_MS);
    }
    await animar(quien, 'mover', DESLIZ_MS);
  };

  /** Un golpe: resta PS (el jefe que se retira nunca llega a 0), números, animación y, si cae, lo que pasa. */
  const golpear = async (atacante: Luchador, defensor: Luchador, poder: number, color = '#fff6d0') => {
    // Si van perdiendo, el juego ayuda: los golpes de los héroes son críticos más seguido.
    const extra = d.ayuda && atacante.lado === 'heroe' && vanPerdiendo(b.current.heroes, d.ayuda.umbral) ? d.ayuda.critico : 0;
    const { n, critico } = dano(atacante, defensor, poder, Math.random, extra);
    luz(defensor.id, color, critico);
    cargar(defensor, CARGA.recibir);
    const jefe = defensor.lado === 'enemigo' ? d.enemigos[defensor.clave] : null;
    defensor.ps = Math.max(jefe?.huye_a ? 1 : 0, defensor.ps - n);
    if (defensor.ps === 0) defensor.confundido = 0;
    playChip(critico ? 'golpe' : 'impacto');
    numero(defensor.id, critico ? `${n}!` : String(n), critico ? 'critico' : 'dano');
    forzar();
    if (defensor.ps === 0 && enEspecial.current) {
      // Cae al terminar el especial: mientras tanto se lo sigue viendo golpeado.
      retenidos.current.add(defensor.id);
      void animar(defensor.id, 'golpeado');
    } else if (defensor.ps === 0 && defensor.lado === 'heroe' && !b.current.heroes.some(vivo)) {
      await caeElUltimo(defensor);
    } else if (defensor.ps === 0) {
      void animar(defensor.id, 'ko');
      if (defensor.lado === 'enemigo') playChip('muerte');
    } else if (enElAire.current.has(defensor.id) || bajoEspecial.current.has(defensor.id)) void animar(defensor.id, 'golpeado');
    else void animar(defensor.id, 'daño', 500);
    return { n, critico };
  };

  /** Un enemigo cae: experiencia para todos, a veces un objeto para la mochila y, si queda horda, otro llega. */
  const alCaer = async (e: Luchador) => {
    if (e.clon !== undefined) return decir(fmt(t('batalla.clon_cae'), { quien: e.nombre }));
    await decir(fmt(t('batalla.cae'), { quien: e.nombre }));
    const xp = xpDe(e.nivel);
    await decir(fmt(t('batalla.xp'), { n: xp }));
    for (const h of b.current.heroes.filter(vivo)) {
      for (const nivel of ganarXp(h, d.personajes[h.clave], xp)) {
        playChip('vida');
        forzar();
        void animar(h.id, 'victoria', 1200);
        await decir(fmt(t('batalla.sube'), { quien: h.nombre, nivel }));
        for (const a of aprendeEn(d.personajes[h.clave], nivel)) {
          playChip('revivir');
          await decir(fmt(t('batalla.aprende'), { quien: h.nombre, ataque: a.nombre }));
        }
      }
    }
    forzar();
    if (Math.random() < d.botin.probabilidad) {
      const k = azar(d.botin.objetos);
      b.current.mochila[k] = (b.current.mochila[k] ?? 0) + 1;
      playChip('vida');
      forzar();
      await lineas('botin', { objetivo: e.nombre, objeto: d.objetos[k].nombre });
    }
    // Refuerzos: cada vez que cae uno de la horda, llega el siguiente.
    const { horda } = d;
    if (e.clave === horda.enemigo && b.current.salieron < horda.niveles.length) {
      await espera(450);
      if (!b.current.avisoRefuerzos) {
        b.current.avisoRefuerzos = true;
        await lineas('refuerzos');
      }
      const nuevo = sacar(horda.enemigo, horda.niveles[b.current.salieron++]);
      await decir(fmt(t('batalla.llega_otro'), { nombre: nuevo.nombre, nivel: nuevo.nivel }));
    }
  };

  const actuarHeroe = async (h: Luchador, c: Comando) => {
    const enemigos = b.current.enemigos.filter(vivo);
    // Pedir perdón tiene que ser seguido: si hace otra cosa, se vuelve a empezar.
    if (c.tipo !== 'hablar' && b.current.racha) {
      b.current.racha = 0;
      const p = enemigos.map((e) => d.enemigos[e.clave].perdon).find(Boolean);
      if (p?.corta) await decir(p.corta, p.quien);
    }
    // Si su objetivo ya cayó, va contra el primero que quede.
    const objetivo = (oid: string) => enemigos.find((e) => e.id === oid) ?? enemigos[0];
    if (c.tipo === 'esquivar') {
      h.esquivando = true;
      cargar(h, CARGA.esquivar);
      void animar(h.id, 'salto', 700);
      return decir(fmt(t('batalla.esquiva'), { quien: h.nombre }));
    }
    if (c.tipo === 'objeto') {
      const o = d.objetos[c.clave];
      const a = o.revive ? b.current.heroes.find((x) => x.id === c.objetivo && !vivo(x)) : (b.current.heroes.find((x) => x.id === c.objetivo && vivo(x)) ?? h);
      // Revivir a alguien que ya se levantó: el objeto vuelve a la mochila.
      if (!a) {
        b.current.mochila[c.clave]++;
        return decir(t('batalla.nadie_caido'));
      }
      const n = usarObjeto(o, a, d.personajes[a.clave]);
      if (o.revive) {
        setAnims((x) => ({ ...x, [a.id]: 'idle' }));
        efecto(a.id, 'se-levanta', 800);
        playChip('revivir');
      }
      numero(a.id, o.niveles ? `NV +${n}` : o.ps || o.revive ? `+${n}` : o.atq ? `ATQ +${n}` : o.def ? `DEF +${n}` : `+${n}`, 'cura');
      playChip('vida');
      forzar();
      return decir(fmt(o.texto, { quien: a.nombre, n }));
    }
    if ((c.tipo === 'atacar' || c.tipo === 'especial') && seConfunde(h)) {
      cargar(h, CARGA.atacar);
      await decir(fmt(t('batalla.se_golpea'), { quien: h.nombre }));
      void animar(h.id, 'ataque', 600);
      playChip(sonidoDe(h));
      await espera(300);
      const { n } = await golpear(h, h, CONFUSION.poder);
      return decir(fmt(t('batalla.recibe'), { quien: h.nombre, n }));
    }
    if (c.tipo === 'especial') return usarEspecial(h, d.personajes[h.clave].especial!, d.personajes[h.clave].sprite, enemigos, objetivo(c.objetivo));
    if (c.tipo === 'hablar') {
      cargar(h, CARGA.hablar);
      const e = objetivo(c.objetivo);
      const en = d.enemigos[e.clave];
      if (e.clon !== undefined) {
        b.current.racha = 0;
        return decir(fmt(t('batalla.clon_no_escucha'), { quien: e.nombre }));
      }
      // Pedirle perdón (Nikki): tantos turnos seguidos y termina la pelea.
      const p = en.perdon;
      if (p) {
        const i = Math.min(b.current.racha, p.veces - 1);
        b.current.racha++;
        await decir(fmt(p.pide[i] ?? azar(d.personajes[h.clave].hablar), { objetivo: e.nombre }), h.nombre);
        await decir(p.responde[i], p.quien);
        if (b.current.racha >= p.veces) b.current.perdona = true;
        return;
      }
      await decir(fmt(azar(d.personajes[h.clave].hablar), { objetivo: e.nombre }), h.nombre);
      // Al jefe no se lo distrae.
      const funciona = !en.jefe && Math.random() < d.hablar;
      if (en.responde) await decir(azar(funciona ? en.responde.ok : en.responde.no), en.responde.quien);
      if (funciona) e.distraido = true;
      return lineas(funciona ? 'hablar_ok' : 'hablar_no', { objetivo: e.nombre });
    }
    if (c.tipo !== 'atacar') return;
    const ataque = ataquesDe(h, d.personajes[h.clave])[c.ataque];
    if (ataque.cebo) return dejarCebo(h, ataque);
    const e = objetivo(c.objetivo);
    await decir(fmt(ataque.texto, { quien: h.nombre, objetivo: e.nombre }));
    const deLejos = !!d.personajes[h.clave].distancia;
    if (deLejos) {
      // Dispara desde su lugar: una sola bala sale de la pistola y pega en el que eligió.
      const llego = new Promise<void>((ok) => {
        disparando.current.set(h.id, { tipo: 'una', hacia: e, llego: ok });
        setTimeout(ok, 1200);
      });
      void animar(h.id, 'ataque', 900);
      playChip('disparo');
      await llego;
      disparando.current.delete(h.id);
    } else {
      await deslizar(h.id, e.id);
      void animar(h.id, 'ataque', 750);
      playChip(sonidoDe(h));
      await espera(320);
    }
    cargar(h, CARGA.atacar);
    if (falla(d)) {
      numero(e.id, 'MISS', 'falla');
      void animar(e.id, 'salto', 600);
      playChip('cambio');
      await espera(450);
      if (!deLejos) await deslizar(h.id, null);
      return decir(fmt(t('batalla.esquiva_rival'), { quien: e.nombre }));
    }
    bajoEspecial.current.add(e.id);
    const { n, critico } = await golpear(h, e, ataque.poder);
    await espera(450);
    if (!deLejos) await deslizar(h.id, null);
    soltar([e]);
    await decir(fmt(t(critico ? 'batalla.critico' : 'batalla.ataca'), { objetivo: e.nombre, n }));
    if (!vivo(e)) await alCaer(e);
  };

  /**
   * Un especial: el aviso y, durante 5 segundos (ESPECIAL_MS), su animación (la fila «especial» de su hoja, o su
   * ataque una y otra vez) junto a su objetivo o en el medio de la pantalla. Los golpes se reparten a lo largo de
   * esos 5 segundos entre los objetivos; los de un enemigo se pueden esquivar golpe a golpe. Cami dispara balas
   * desde sus pistolas en cada destello.
   */
  const usarEspecial = async (l: Luchador, e: Especial, sprite: string, rivales: Luchador[], elegido: Luchador) => {
    l.carga = 0;
    forzar();
    await avisar(e, sprite, l.lado === 'heroe');
    await decir(fmt(e.texto, { quien: l.nombre, objetivo: elegido.nombre }));
    const blancos = e.objetivo === 'todos' ? rivales : [elegido];
    const hoja = (await cargarHoja(sprite)) as Hoja;
    const conFila = 'animations' in hoja && !!hoja.animations.especial;
    // Con viaje (la sombra): dura lo que su animación y se mueve solo mientras es un vórtice.
    const fila = conFila ? hoja.animations.especial : undefined;
    const viaje = fila?.seq ? hoja.viaje : undefined;
    const msPaso = fila ? 1000 / fila.fps : 0;
    const dura = viaje ? fila!.seq!.length * msPaso : ESPECIAL_MS;
    if (e.pantalla === 'oscura') setOscuro(true);
    if (viaje) {
      playChip('vortice');
      setTimeout(() => playChip('vortice'), viaje.vuelta[0] * msPaso);
      const ir = junto(l.id, elegido.id);
      setTimeout(() => ir && setDesliz((m) => ({ ...m, [l.id]: { ...ir, ms: (viaje.ida[1] - viaje.ida[0]) * msPaso } })), viaje.ida[0] * msPaso);
      setTimeout(() => setDesliz((m) => ({ ...m, [l.id]: { x: 0, y: 0, ms: (viaje.vuelta[1] - viaje.vuelta[0]) * msPaso } })), viaje.vuelta[0] * msPaso);
    } else if (e.posicion === 'centro') await alCentro(l.id);
    else await deslizar(l.id, elegido.id);
    // Levanta en el aire a sus blancos (cuando sale del vórtice, o enseguida) y los deja ahí hasta el final.
    const levantados = e.levanta ? [...new Set(blancos)] : [];
    if (levantados.length)
      setTimeout(
        () => {
          const alto = (raiz.current?.getBoundingClientRect().height ?? 600) * 0.3;
          for (const x of levantados) {
            if (!vivo(x)) continue;
            enElAire.current.add(x.id);
            setAire((m) => ({ ...m, [x.id]: alto }));
            void animar(x.id, 'golpeado');
          }
          playChip('levanta');
        },
        viaje ? viaje.ida[1] * msPaso : 300,
      );
    // Sus balas (si su hoja tiene destellos): ráfagas continuas desde la punta de cada pistola, estilo shoot 'em up.
    let flujo: ReturnType<typeof setInterval> | undefined;
    if (hoja.disparos?.especial) {
      disparando.current.set(l.id, { tipo: 'rafaga', puntos: [], color: e.color });
      flujo = setInterval(() => {
        const m = disparando.current.get(l.id);
        if (m?.tipo === 'rafaga') for (const p of m.puntos) dispararRafaga(l, hoja, p, e.color);
      }, 55);
    }
    enEspecial.current = true;
    // Desde que empieza, los blancos se ven golpeados (no vuelven al base hasta el final). Si el especial los
    // levanta (la sombra, que sale del piso), recién cuando los levanta.
    blancos.forEach((x) => {
      bajoEspecial.current.add(x.id);
      if (vivo(x) && !e.levanta) void animar(x.id, 'golpeado');
    });
    let repite: ReturnType<typeof setInterval> | undefined;
    if (conFila) void animar(l.id, 'especial');
    else {
      // Sin fila de especial (el soldado): su ataque, una y otra vez, rapidísimo.
      void animar(l.id, 'ataque');
      repite = setInterval(() => void animar(l.id, 'ataque'), 420);
    }
    const inicio = Date.now();
    const golpes = golpesEspecial(e, blancos);
    // Los golpes se reparten en los 5 segundos o, con viaje, mientras aterriza junto a su objetivo.
    const ventana = viaje ? (viaje.golpe[1] - viaje.golpe[0]) * msPaso : ESPECIAL_MS;
    const paso = ventana / (golpes.length + (viaje ? 0 : 1));
    if (viaje) await espera(viaje.golpe[0] * msPaso - paso);
    let total = 0;
    for (const b of golpes) {
      await espera(paso);
      if (!vivo(b)) continue;
      playChip(hoja.disparos?.especial ? 'disparo' : sonidoDe(l));
      if (b.lado === 'heroe' && b.esquivando && Math.random() < d.esquivar) {
        numero(b.id, 'MISS', 'falla');
        // Esquiva de un salto y vuelve a la pose de golpeado.
        void animar(b.id, 'salto');
        setTimeout(() => bajoEspecial.current.has(b.id) && vivo(b) && void animar(b.id, 'golpeado'), 500);
        continue;
      }
      const { n } = await golpear(l, b, e.poder, e.color);
      total += n;
    }
    await espera(Math.max(0, dura - (Date.now() - inicio)));
    setOscuro(false);
    clearInterval(repite);
    clearInterval(flujo);
    disparando.current.delete(l.id);
    setAnims((x) => ({ ...x, [l.id]: 'idle' }));
    // Los golpeados que siguen de pie vuelven a su pose (los que están en el aire caen más abajo).
    for (const x of blancos) {
      bajoEspecial.current.delete(x.id);
      if (vivo(x) && !enElAire.current.has(x.id)) setAnims((m) => ({ ...m, [x.id]: 'idle' }));
    }
    // Recién ahora caen los que derrotó.
    enEspecial.current = false;
    const ultimo = !b.current.heroes.some(vivo) ? b.current.heroes.find((x) => retenidos.current.has(x.id)) : undefined;
    for (const id of retenidos.current) {
      if (id === ultimo?.id) continue;
      void animar(id, 'ko');
      if (b.current.enemigos.some((x) => x.id === id)) playChip('muerte');
    }
    if (ultimo) await caeElUltimo(ultimo);
    retenidos.current.clear();
    forzar();
    if (viaje) setDesliz((m) => ({ ...m, [l.id]: { x: 0, y: 0 } }));
    else await deslizar(l.id, null);
    // Los que estaban en el aire caen (con su sprite de derrotado) y, si siguen vivos, se levantan.
    if (levantados.length) {
      for (const x of levantados) {
        enElAire.current.delete(x.id);
        setAire((m) => ({ ...m, [x.id]: 0 }));
        void animar(x.id, 'ko');
      }
      playChip('golpe');
      await espera(1100);
      for (const x of levantados.filter(vivo)) {
        efecto(x.id, 'se-levanta', 800);
        void animar(x.id, 'idle');
      }
      playChip('salto');
      await espera(500);
    }
    await decir(fmt(t('batalla.especial_total'), { quien: l.nombre, n: total }));
    for (const b of blancos) {
      if (vivo(b) || b.cebo) continue;
      if (b.lado === 'enemigo') await alCaer(b);
      else await decir(fmt(t('batalla.cae'), { quien: b.nombre }));
    }
  };

  const actuarEnemigo = async (e: Luchador) => {
    cargar(e, CARGA.turnoEnemigo);
    if (e.distraido) {
      e.distraido = false;
      return decir(fmt(t('batalla.distraido'), { quien: e.nombre }));
    }
    const hs = b.current.heroes.filter(vivo);
    const esp = d.enemigos[e.clave].especial;
    const elige = eligeEspecial(e, d.enemigos[e.clave], b.current.heroes, b.current.enemigos);
    if (elige?.tipo === 'clon') return clonar(e);
    if (elige && esp) {
      await usarEspecial(e, esp, d.enemigos[e.clave].sprite, hs, desviar([elige.blanco ?? azar(hs)], e)[0]);
      return limpiarCebos();
    }
    // La parálisis solo va contra los que todavía se mueven (si nadie se mueve, ataca de otra forma).
    // Si no le queda ningún ataque posible (solo de efecto y ya todos lo tienen), espera.
    const elegido = eligeAtaque(d.enemigos[e.clave].ataques, hs);
    if (!elegido) return;
    const { ataque: a } = elegido;
    const blancos = a.confunde || a.paraliza ? elegido.blancos : desviar(elegido.blancos, e);
    await decir(a.texto);
    if (a.confunde) return besar(e, a, blancos);
    if (a.paraliza) {
      setOscuro(true);
      playChip('paralisis');
      blancos.forEach((h) => luz(h.id, '#a64dff', true));
      await espera(1000);
      setOscuro(false);
      for (const h of blancos) {
        if (h.esquivando && Math.random() < d.esquivar) {
          numero(h.id, 'MISS', 'falla');
          void animar(h.id, 'salto', 600);
          await lineas('esquiva_ok', { quien: h.nombre });
          continue;
        }
        await paralizar(h, a.paraliza);
      }
      return;
    }
    const hoja = (await cargarHoja(d.enemigos[e.clave].sprite)) as Hoja;
    const proy = 'animations' in hoja ? hoja.proyectil : undefined;
    // De lejos (la sombra): se queda en su lugar y la media luna sale volando, pasa por cada blanco y se va.
    let llegadas: number[] | null = null;
    const desde = Date.now();
    if (proy) {
      const fila = hoja.animations.ataque;
      void animar(e.id, 'ataque', (fila.frames * 1000) / fila.fps);
      await espera((proy.cuadro * 1000) / fila.fps);
      llegadas = blancos.map((h, i) => lanzar(e, hoja, proy, h, i * 160));
    } else {
      if (blancos.length === 1) await deslizar(e.id, blancos[0].id);
      void animar(e.id, 'ataque', 800);
      await espera(380);
    }
    for (const [i, h] of blancos.entries()) {
      if (llegadas) await espera(Math.max(0, llegadas[i] - (Date.now() - desde) + (proy ? ((proy.cuadro * 1000) / hoja.animations.ataque.fps) : 0)));
      // A veces el golpe falla solo.
      if (falla(d)) {
        numero(h.id, 'MISS', 'falla');
        playChip('cambio');
        await decir(fmt(t('batalla.falla'), { quien: e.nombre }));
        continue;
      }
      // Esquivar: a veces funciona.
      if (h.esquivando && Math.random() < d.esquivar) {
        numero(h.id, 'MISS', 'falla');
        void animar(h.id, 'salto', 600);
        playChip('cambio');
        await lineas('esquiva_ok', { quien: h.nombre });
        continue;
      }
      if (!proy) playChip(sonidoDe(e));
      bajoEspecial.current.add(h.id);
      const { n } = await golpear(e, h, a.poder);
      if (blancos.length === 1) await decir(fmt(t('batalla.recibe'), { quien: h.nombre, n }));
    }
    if (blancos.length === 1 && !proy) await deslizar(e.id, null);
    else await espera(500);
    soltar(blancos);
    await limpiarCebos();
    for (const h of blancos) {
      if (vivo(h) || h.cebo) continue;
      await decir(fmt(t('batalla.cae'), { quien: h.nombre }));
      if (h.clave === 'jair' && !b.current.avisoCaida && b.current.heroes.some(vivo)) {
        b.current.avisoCaida = true;
        await lineas('cae_jair');
      }
    }
  };

  // El menú: qué hace, qué ataque, qué objeto y a quién.
  const heroe = b.current.heroes.find((h) => h.id === eligiendo);
  const ataques = heroe ? ataquesDe(heroe, d.personajes[heroe.clave]) : [];
  const especial = heroe ? d.personajes[heroe.clave].especial : undefined;
  const comandos = [t('batalla.atacar'), t('batalla.hablar'), t('batalla.esquivar'), t('batalla.objetos'), t('batalla.huir')];
  const enMochila = Object.keys(d.objetos).filter((k) => (b.current.mochila[k] ?? 0) > 0);
  const vivosDe = (lado: 'enemigo' | 'heroe') => (lado === 'enemigo' ? b.current.enemigos : b.current.heroes).filter(vivo);
  /** A quiénes se puede elegir: los de pie o, para revivir, los caídos. */
  const candidatos = () =>
    menu.paso === 'objetivo' ? (menu.caidos ? b.current.heroes.filter((x) => !vivo(x)) : vivosDe(menu.lado)) : [];
  const base = (): number =>
    menu.paso === 'comando' ? comandos.length : menu.paso === 'ataque' ? ataques.length + (especial ? 1 : 0) : menu.paso === 'objeto' ? enMochila.length : candidatos().length;
  // «Volver» va al final de cada lista: desde un submenú, a los comandos; desde los comandos, al héroe anterior.
  const conVolver = menu.paso !== 'comando' || puedeVolver;
  const opciones = (): number => base() + (conVolver ? 1 : 0);
  const elegir = (i: number) => {
    if (!heroe || !elegido.current) return;
    if (conVolver && i === base()) return volver();
    const listo = elegido.current;
    if (menu.paso === 'comando') {
      if (i === 3 && !enMochila.length) {
        playChip('vacio');
        return setMensaje({ texto: t('batalla.mochila_vacia'), n: Math.random() });
      }
      playSelect();
      if (i === 0) return setMenu({ paso: 'ataque', i: 0 });
      if (i === 1) return setMenu({ paso: 'objetivo', i: 0, lado: 'enemigo', luego: (o) => ({ tipo: 'hablar', objetivo: o }) });
      if (i === 2) return listo({ tipo: 'esquivar' });
      if (i === 3) return setMenu({ paso: 'objeto', i: 0 });
      return listo({ tipo: 'huir' });
    }
    playSelect();
    if (menu.paso === 'ataque') {
      if (i === ataques.length && especial) {
        if (!especialListo(heroe)) {
          playChip('vacio');
          return setMensaje({ texto: fmt(t('batalla.especial_no'), { n: Math.floor(heroe.carga) }), n: Math.random() });
        }
        // A todos: no hace falta elegir.
        if (especial.objetivo === 'todos') return listo({ tipo: 'especial', objetivo: vivosDe('enemigo')[0]?.id ?? '' });
        return setMenu({ paso: 'objetivo', i: 0, lado: 'enemigo', luego: (o) => ({ tipo: 'especial', objetivo: o }) });
      }
      if (ataques[i]?.cebo) return listo({ tipo: 'atacar', ataque: i, objetivo: '' });
      return setMenu({ paso: 'objetivo', i: 0, lado: 'enemigo', luego: (o) => ({ tipo: 'atacar', ataque: i, objetivo: o }) });
    }
    if (menu.paso === 'objeto') {
      const k = enMochila[i];
      if (k && d.objetos[k].revive) {
        if (!b.current.heroes.some((x) => !vivo(x))) {
          playChip('vacio');
          return setMensaje({ texto: t('batalla.nadie_caido'), n: Math.random() });
        }
        return setMenu({ paso: 'objetivo', i: 0, lado: 'heroe', caidos: true, luego: (o) => ({ tipo: 'objeto', clave: k, objetivo: o }) });
      }
      if (k) setMenu({ paso: 'objetivo', i: Math.max(0, vivosDe('heroe').indexOf(heroe)), lado: 'heroe', luego: (o) => ({ tipo: 'objeto', clave: k, objetivo: o }) });
      return;
    }
    const o = candidatos()[i];
    if (o) listo(menu.luego(o.id));
  };
  const volver = () => {
    if (!elegido.current) return;
    playChip('cambio');
    if (menu.paso === 'comando') return elegido.current(null);
    setMenu({ paso: 'comando', i: 0 });
  };
  // Teclado: flechas para moverse, Enter / Z / Espacio para elegir, Escape / X / Retroceso para volver.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if ((e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'z') && saltar.current) return saltar.current();
      if (!elegido.current) return;
      const n = opciones();
      if (['ArrowDown', 'ArrowRight', 's', 'd'].includes(e.key)) setMenu((m) => ({ ...m, i: (m.i + 1) % Math.max(1, n) }));
      else if (['ArrowUp', 'ArrowLeft', 'w', 'a'].includes(e.key)) setMenu((m) => ({ ...m, i: (m.i - 1 + n) % Math.max(1, n) }));
      else if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'z') elegir(menu.i);
      else if (e.key === 'Escape' || e.key === 'Backspace' || e.key.toLowerCase() === 'x') volver();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  const enMenu = !!heroe && !!elegido.current;
  const marcado = (l: Luchador) => enMenu && menu.paso === 'objetivo' && candidatos()[menu.i]?.id === l.id;
  // Lo que dice el cuadro de al lado del menú sobre cada opción: qué hace, cuánto pega, cuánto da.
  const COMANDOS_DESC = ['atacar', 'hablar', 'esquivar', 'objetos', 'huir'];
  const descComando = (k: string) =>
    d.descripciones?.[k] ?? fmt(t(k === 'huir' && !d.huir ? 'batalla.desc.huir_no' : `batalla.desc.${k}`), { p: Math.round(d.esquivar * 100) });
  /** Daño aproximado de un golpe contra el primer rival de pie (sin el azar). */
  const aprox = (poder: number) => {
    const r = vivosDe('enemigo')[0];
    return heroe && r ? Math.max(1, Math.round(((heroe.atq + heroe.extra) * poder) / 10 - (r.def + r.extraDef) / 2)) : poder;
  };
  const descObjeto = (o: Objeto) =>
    [
      o.niveles && fmt(t('batalla.desc.obj_niveles'), { n: o.niveles }),
      o.revive && fmt(t('batalla.desc.obj_revive'), { n: Math.round(o.revive * 100) }),
      o.ps && fmt(t('batalla.desc.obj_ps'), { n: o.ps }),
      o.atq && fmt(t('batalla.desc.obj_atq'), { n: o.atq }),
      o.def && fmt(t('batalla.desc.obj_def'), { n: o.def }),
      o.carga && t('batalla.desc.obj_carga'),
    ]
      .filter(Boolean)
      .join(' · ');
  const lista: { texto: string; extra: string; clase?: string; desc?: string }[] =
    menu.paso === 'comando'
      ? comandos.map((c, i) => ({ texto: c, extra: i === 3 ? `${enMochila.reduce((s, k) => s + b.current.mochila[k], 0)}` : '', desc: descComando(COMANDOS_DESC[i]) }))
      : menu.paso === 'ataque'
        ? [
            ...ataques.map((a) => ({
              texto: a.nombre,
              extra: `${a.poder}`,
              clase: '',
              desc: a.cebo
                ? t('batalla.desc.cebo')
                : fmt(t('batalla.desc.ataque'), { poder: a.poder, n: aprox(a.poder), a: t(a.objetivo === 'todos' ? 'batalla.desc.a_todos' : 'batalla.desc.a_uno') }),
            })),
            ...(especial && heroe
              ? [
                  {
                    texto: `★ ${especial.nombre}`,
                    extra: especialListo(heroe) ? t('batalla.especial_listo') : `${Math.floor(heroe.carga)}%`,
                    clase: especialListo(heroe) ? 'especial listo' : 'especial',
                    desc: fmt(t('batalla.desc.especial'), {
                      poder: especial.poder,
                      golpes: especial.golpes,
                      n: aprox(especial.poder) * especial.golpes,
                      a: t(especial.objetivo === 'todos' ? 'batalla.desc.a_todos' : 'batalla.desc.a_uno'),
                      estado: especialListo(heroe) ? t('batalla.desc.especial_listo') : fmt(t('batalla.desc.especial_carga'), { n: Math.floor(heroe.carga) }),
                    }),
                  },
                ]
              : []),
          ]
        : menu.paso === 'objeto'
          ? enMochila.map((k) => ({ texto: d.objetos[k].nombre, extra: `×${b.current.mochila[k]}`, desc: descObjeto(d.objetos[k]) }))
          : candidatos().map((l) => ({
              texto: l.nombre,
              extra: menu.lado === 'enemigo' ? `${t('batalla.nivel')} ${l.nivel}` : `${l.ps} HP`,
              desc: fmt(t('batalla.desc.objetivo'), { nivel: l.nivel, ps: l.ps, max: l.psMax, atq: l.atq + l.extra, def: l.def + l.extraDef, vel: l.vel }),
            }));
  if (conVolver) lista.push({ texto: `◀ ${t('batalla.volver')}`, extra: '', clase: 'volver', desc: t('batalla.desc.volver') });
  /** Cami (o quien no puede repetir) descansa el turno siguiente al que actuó. */
  const descansa = (h: Luchador) => vivo(h) && !d.personajes[h.clave].seguido && b.current.actuaron.includes(h.id);
  const habla = mensaje?.quien;
  const colorDe = (clave: string) => d.personajes[clave]?.especial?.color ?? '#e8e2d4';
  const texto = mensaje ? mensaje.texto.slice(0, letras) : '';

  return (
    <div
      className={`batalla n${b.current.heroes.length} ${oscuro ? 'oscuro' : ''} ${saliendo ? 'saliendo' : ''}`}
      ref={raiz}
      role="dialog"
      aria-label={d.titulo}
      style={
        {
          ...(d.enemigos_atras !== undefined ? { '--enemigos-atras': d.enemigos_atras } : {}),
        } as CSSProperties
      }
    >
      <div className={`batalla-fondo ${d.fondo.startsWith('PLACEHOLDER') ? '' : 'con-imagen'}`} aria-hidden>
        {d.fondo.startsWith('PLACEHOLDER') ? (
          <small>{d.fondo}</small>
        ) : (
          <div className="batalla-fondo-caja" style={{ '--r': d.fondo_proporcion ?? 16 / 9, backgroundImage: `url(${BASE}${d.fondo}.webp)` } as CSSProperties}>
            {(d.fondo_luces ?? []).map(([x, y], i) => (
              <span key={i} className="batalla-alarma" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * -0.55}s` }} />
            ))}
          </div>
        )}
      </div>
      <div
        className={`batalla-mensaje ${mensaje?.turno ? 'turno' : ''}`}
        style={mensaje?.turno ? ({ '--c': colorDe(mensaje.turno) } as CSSProperties) : undefined}
        onClick={() => saltar.current?.()}
        aria-live="polite"
      >
        {/* Cuando elige un héroe: «Turno de» y su nombre en grande, con su color. */}
        {mensaje?.turno && (
          <span className="batalla-turno">
            <small>{t('batalla.turno_de')}</small>
            {d.personajes[mensaje.turno].nombre}
          </span>
        )}
        {mensaje && !habla && <p>{conNumeros(texto)}</p>}
      </div>
      <div className="batalla-escena">
        <div className="batalla-lado enemigos">
          {b.current.enemigos.map((e) => (
            <Figura
              key={e.id}
              l={e}
              caido={e.ps === 0 && !retenidos.current.has(e.id)}
              refFigura={(el) => (el ? figuras.current.set(e.id, el) : figuras.current.delete(e.id))}
              sprite={d.enemigos[e.clave].sprite}
              escala={d.enemigos[e.clave].escala}
              jefe={!!d.enemigos[e.clave].jefe}
              anim={anims[e.id] ?? 'idle'}
              vez={veces[e.id] ?? 0}
              especial={d.enemigos[e.clave].especial}
              alCuadro={(anim, col, hoja) => alCuadro(e, anim, col, hoja)}
              efecto={efectos[e.id]}
              luces={luces.filter((x) => x.id === e.id)}
              desliz={desliz[e.id]}
              marcado={marcado(e)}
              numeros={numeros.filter((n) => n.id === e.id)}
              etiqueta={e.clon !== undefined ? t('batalla.clon') : `${t('batalla.nivel')} ${e.nivel}`}
            />
          ))}
        </div>
        <div className={`batalla-lado heroes n${b.current.heroes.length}`}>
          {b.current.heroes.map((h) => (
            <Figura
              key={h.id}
              l={h}
              caido={h.ps === 0 && !retenidos.current.has(h.id)}
              refFigura={(el) => (el ? figuras.current.set(h.id, el) : figuras.current.delete(h.id))}
              sprite={d.personajes[h.clave].sprite}
              escala={d.personajes[h.clave].escala}
              heroe
              anim={
                (anims[h.id] ?? 'idle') === 'idle' && vivo(h) && h.paralizado
                  ? 'paralizado'
                  : (anims[h.id] ?? 'idle') === 'idle' && vivo(h) && b.current.cansados.has(h.id) && d.personajes[h.clave].descanso
                    ? d.personajes[h.clave].descanso!
                    : (anims[h.id] ?? 'idle')
              }
              alCuadro={(anim, col, hoja) => alCuadro(h, anim, col, hoja)}
              efecto={efectos[h.id]}
              alto={aire[h.id] ?? 0}
              vez={veces[h.id] ?? 0}
              especial={d.personajes[h.clave].especial}
              luces={luces.filter((x) => x.id === h.id)}
              desliz={desliz[h.id]}
              marcado={marcado(h)}
              activo={eligiendo === h.id}
              numeros={numeros.filter((n) => n.id === h.id)}
            />
          ))}
          {/* Los cebos: copias en blanco y negro, delante de su héroe (no mueven a nadie). */}
          {b.current.cebos.map((c) => (
            <div key={c.l.id} className="batalla-cebo" style={{ left: c.x, top: c.y }}>
              <Figura
                l={c.l}
                caido={c.l.ps === 0}
                refFigura={(el) => (el ? figuras.current.set(c.l.id, el) : figuras.current.delete(c.l.id))}
                sprite={d.personajes[c.l.clave].sprite}
                escala={d.personajes[c.l.clave].escala}
                heroe
                anim="idle"
                quieto
                efecto={efectos[c.l.id]}
                vez={veces[c.l.id] ?? 0}
                luces={luces.filter((x) => x.id === c.l.id)}
                marcado={false}
                numeros={numeros.filter((n) => n.id === c.l.id)}
              />
            </div>
          ))}
        </div>
      </div>
      {versus && <Versus d={d} />}
      {/* Las balas de energía (Cami): salen de las pistolas y vuelan hasta su objetivo. */}
      <div className="batalla-balas" aria-hidden>
        {proyectiles.map((x) => (
          <img
            key={x.key}
            className="batalla-proyectil"
            src={x.src}
            alt=""
            draggable={false}
            style={
              {
                left: x.x - x.w / 2,
                top: x.y - x.h / 2,
                width: x.w,
                height: x.h,
                '--dx': `${x.dx}px`,
                '--dy': `${x.dy}px`,
                rotate: `${x.ang}rad`,
                animationDuration: `${x.ms}ms`,
                animationDelay: `${x.demora}ms`,
              } as CSSProperties
            }
          />
        ))}
        {/* PLACEHOLDER:objeto_cae (hasta que haya íconos de los objetos). */}
        {cae && (
          <span key={cae.key} className="batalla-cae">
            ✚
          </span>
        )}
        {balas.map((x) => (
          <span
            key={x.key}
            className={`batalla-bala ${x.rafaga ? 'rafaga' : ''}`}
            style={
              {
                left: x.x,
                top: x.y,
                '--dx': `${x.dx}px`,
                '--dy': `${x.dy}px`,
                '--ang': `${Math.atan2(x.dy, x.dx)}rad`,
                '--c': x.color,
                animationDuration: `${x.ms}ms`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      {fogonazo && <div key={fogonazo.key} className="batalla-fogonazo" style={{ '--c': fogonazo.color } as CSSProperties} aria-hidden />}
      {aviso && <AvisoEspecial key={aviso.key} e={aviso.e} sprite={aviso.sprite} heroe={aviso.heroe} />}
      <div className="batalla-abajo">
        <div className={`batalla-menu ${enMenu ? '' : 'apagado'}`} aria-label={t('batalla.comandos')}>
          {/* Al lado (encima) del menú: qué hace la opción elegida. */}
          {enMenu && lista[menu.i]?.desc && (
            <p className="batalla-desc" role="status">
              {conNumeros(lista[menu.i].desc!)}
            </p>
          )}
          {enMenu &&
            lista.map((o, i) => (
              <button key={i} type="button" className={`${menu.i === i ? 'sel' : ''} ${o.clase ?? ''}`} onMouseEnter={() => setMenu((m) => ({ ...m, i }))} onClick={() => elegir(i)}>
                {o.texto}
                {o.extra && <small>{o.extra}</small>}
              </button>
            ))}
        </div>
        <div className="batalla-grupo">
          {b.current.heroes.map((h) => (
            <Tarjeta key={h.id} h={h} color={colorDe(h.clave)} activo={eligiendo === h.id} descansa={descansa(h)} especial={d.personajes[h.clave].especial} />
          ))}
        </div>
        {/* Lo que dice alguien: abajo, con su retrato en pixel art. */}
        {habla && (
          <div className="batalla-dialogo" data-quien={habla} onClick={() => saltar.current?.()}>
            {d.retratos[habla] && <img src={`${BASE}${d.retratos[habla]}.png`} alt="" draggable={false} />}
            <div>
              <b>{habla}</b>
              <p>{conNumeros(texto)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Los números de un texto con la letra de 8 bits (en la otra, el 9 y el 4 o el 8 y la S se confunden). */
function conNumeros(texto: string) {
  return texto.split(/(\d+)/).map((parte, i) => (i % 2 ? <span key={i} className="batalla-num">{parte}</span> : parte));
}

/** Un luchador en escena: su sprite animado, los números que saltan, su flecha si se lo está eligiendo. */
function Figura({
  l,
  caido,
  refFigura,
  sprite,
  escala = 1,
  heroe,
  jefe,
  anim,
  vez,
  especial,
  alCuadro,
  efecto,
  alto = 0,
  quieto = false,
  luces,
  desliz,
  marcado,
  activo,
  numeros,
  etiqueta,
}: {
  l: Luchador;
  /** Ya cayó (los derrotados durante un especial caen recién al terminar). */
  caido: boolean;
  refFigura: (el: HTMLDivElement | null) => void;
  sprite: string;
  /** Tamaño del sprite respecto de los demás (1: normal). */
  escala?: number;
  heroe?: boolean;
  jefe?: boolean;
  anim: string;
  vez: number;
  especial?: Especial;
  alCuadro?: (anim: string, col: number, hoja: Hoja) => void;
  /** Un efecto de un momento: «aparece», «se-agacha» o «se-levanta». */
  efecto?: string;
  /** Levantado en el aire (px): sube el sprite, no su sombra. */
  alto?: number;
  /** Un objeto inerte (el cebo): un solo cuadro, sin animación. */
  quieto?: boolean;
  luces: { key: number; color: string; fuerte: boolean }[];
  desliz?: { x: number; y: number; ms?: number };
  marcado: boolean;
  activo?: boolean;
  numeros: { key: number; texto: string; tipo: string }[];
  etiqueta?: string;
}) {
  return (
    <div
      ref={refFigura}
      className={`batalla-figura ${heroe ? 'heroe' : 'enemigo'} ${jefe ? 'jefe' : ''} ${l.clon !== undefined ? 'clon' : ''} ${marcado ? 'marcado' : ''} ${alto ? 'en-aire' : ''} anim-${anim} ${luces.length ? 'golpeado' : ''} ${activo ? 'activo' : ''} ${caido ? 'ko' : ''} ${efecto ?? ''} ${desliz && (desliz.x || desliz.y) ? 'deslizando' : ''}`}
      style={
        {
          ...(desliz ? { '--dx': `${desliz.x}px`, '--dy': `${desliz.y}px` } : {}),
          ...(desliz?.ms ? { '--dt': `${desliz.ms}ms` } : {}),
          '--alto': `${-alto}px`,
          ...(especial ? { '--c': especial.color } : {}),
          '--e': escala,
        } as CSSProperties
      }
    >
      {marcado && <span className="batalla-flecha" aria-hidden>▼</span>}
      {l.confundido > 0 && l.ps > 0 && !caido && (
        <span className="batalla-confusion" aria-hidden>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
        </span>
      )}
      {/* Sombra en el piso: lo despega del fondo. */}
      <span className="batalla-sombra" aria-hidden />
      <SpriteHoja src={sprite} anim={quieto ? 'idle' : anim} vez={vez} alCuadro={alCuadro} cuadroFijo={quieto ? 0 : undefined} />
      {luces.map((x) => (
        <span key={x.key} className={`batalla-luz ${x.fuerte ? 'fuerte' : ''}`} style={{ '--c': x.color } as CSSProperties} aria-hidden />
      ))}
      {!heroe && !caido && (
        <span className="batalla-vida" aria-hidden>
          <small>{etiqueta}</small>
          <span className="batalla-barra ps" style={{ '--v': `${(l.ps / l.psMax) * 100}%` } as CSSProperties} />
        </span>
      )}
      {numeros.map((n) => (
        <span key={n.key} className={`batalla-numero ${n.tipo}`}>
          {n.texto}
        </span>
      ))}
    </div>
  );
}

/**
 * Una hoja de animaciones (filas: idle, mover, ataque, daño…), cuadro a cuadro según su .json. En reposo, cada
 * tanto pestañea (la fila «pestaneo», si la hoja la tiene).
 */
export function SpriteHoja({
  src,
  anim,
  vez = 0,
  bucle = false,
  alCuadro,
  velocidad = 1,
  cuadroFijo,
}: {
  src: string;
  /** Una de las de la pelea o, en la galería, cualquier fila de la hoja. */
  anim: Anim | string;
  vez?: number;
  /** Repite también las animaciones que no son en bucle (la galería). */
  bucle?: boolean;
  /** Cada cuadro que se muestra (la animación y la columna de la hoja): de ahí salen las balas. */
  alCuadro?: (anim: string, col: number, hoja: Hoja) => void;
  /** Multiplica los cuadros por segundo (el probador de sprites). */
  velocidad?: number;
  /** Muestra siempre este paso de la animación (pausado, cuadro a cuadro). */
  cuadroFijo?: number;
}) {
  const [hoja, setHoja] = useState<Hoja | Quieto | null>(null);
  const [cuadro, setCuadro] = useState(0);
  const [pestanea, setPestanea] = useState(false);
  useEffect(() => {
    void cargarHoja(src).then(setHoja);
  }, [src]);
  const anims = hoja && 'animations' in hoja ? hoja.animations : null;
  // Quieto en un cuadro (pausa del probador o el cebo): tampoco pestañea.
  const reposo = anim === 'idle' && !!anims?.pestaneo && cuadroFijo === undefined;
  // Pestañeo: cada 2,2 a 6 segundos, una vez.
  useEffect(() => {
    if (!reposo) return setPestanea(false);
    let timer: ReturnType<typeof setTimeout>;
    const otra = () => {
      timer = setTimeout(() => {
        setPestanea(true);
        const p = anims!.pestaneo;
        timer = setTimeout(() => {
          setPestanea(false);
          otra();
        }, (p.frames * 1000) / p.fps);
      }, 2200 + Math.random() * 3800);
    };
    otra();
    return () => clearTimeout(timer);
  }, [reposo, anims]);
  const nombre =
    anim === 'victoria'
      ? anims?.sonrojada
        ? 'sonrojada'
        : 'salto'
      : anim === 'ko'
        ? anims?.derrotado
          ? 'derrotado'
          : 'daño'
        : anim === 'paralizado' || anim === 'golpeado'
          ? 'daño'
          : reposo && pestanea
          ? 'pestaneo'
          : anim;
  const a = anims?.[nombre] ?? anims?.idle;
  // Cuántos cuadros tiene: con `seq`, el largo de la secuencia.
  const largo = a ? (a.seq?.length ?? a.frames) : 1;
  useEffect(() => {
    setCuadro(0);
    if (!a || cuadroFijo !== undefined) return;
    const n = a.seq?.length ?? a.frames;
    const timer = setInterval(
      () => setCuadro((c) => (a.loop || bucle || anim === 'victoria' ? (c + 1) % n : Math.min(n - 1, c + 1))),
      1000 / (a.fps * velocidad),
    );
    return () => clearInterval(timer);
  }, [a, anim, vez, bucle, velocidad, cuadroFijo]);
  // Paralizado: quieto en el golpe (el segundo cuadro de «daño»).
  // Golpeado (durante un especial): el golpe corre hasta la mitad de «daño» y se queda ahí, sin volver al base.
  const paso = anim === 'paralizado' ? Math.floor(largo / 2) : anim === 'golpeado' ? Math.min(cuadro + 1, Math.floor(largo / 2)) : anim === 'ko' && nombre === 'daño' ? Math.floor(largo / 2) : Math.min(cuadroFijo !== undefined ? ((cuadroFijo % largo) + largo) % largo : cuadro, largo - 1);
  const col = a?.seq ? a.seq[paso] : paso;
  // En una hoja partida en renglones, la columna y el renglón donde está ese cuadro.
  const porRenglon = hoja && 'animations' in hoja ? hoja.columnas : undefined;
  const x = porRenglon ? col % porRenglon : col;
  const y = (a?.row ?? 0) + (porRenglon ? Math.floor(col / porRenglon) : 0);
  const avisar = useRef(alCuadro);
  avisar.current = alCuadro;
  useEffect(() => {
    if (hoja && 'animations' in hoja && a) avisar.current?.(nombre, col, hoja);
  }, [col, nombre, hoja, a, vez]);
  if (!hoja) return <span className="batalla-sprite" />;
  if (!('animations' in hoja)) {
    const [w, h] = hoja.cuadro;
    return <span className="batalla-sprite" style={{ width: w, height: h, backgroundImage: `url(${BASE}${src}.png)` }} />;
  }
  if (!a) return <span className="batalla-sprite" />;
  return (
    <span
      className="batalla-sprite"
      style={
        {
          width: hoja.frameWidth,
          height: hoja.frameHeight,
          backgroundImage: `url(${BASE}${src}.png)`,
          backgroundPosition: `-${x * hoja.frameWidth}px -${y * hoja.frameHeight}px`,
        } as CSSProperties
      }
    />
  );
}

/**
 * El aviso del especial: una franja en el medio con un fondo de velocidad del color del personaje y sus ojos (el
 * pedazo de su hoja donde están, en grande).
 */
function AvisoEspecial({ e, sprite, heroe }: { e: Especial; sprite: string; heroe: boolean }) {
  const t = useT();
  const [x, y, w, h] = e.ojos;
  return (
    <div className={`batalla-aviso ${heroe ? 'heroe' : 'enemigo'}`} style={{ '--c': e.color } as CSSProperties} role="status">
      <div className="batalla-aviso-franja">
        {/* El pedazo de la hoja donde están los ojos, a tamaño natural y agrandado con zoom (ver styles.css). */}
        <span className="batalla-aviso-marco">
          <span
            className="batalla-aviso-ojos"
            style={{ width: w, height: h, backgroundImage: `url(${BASE}${sprite}.png)`, backgroundPosition: `-${x}px -${y}px` }}
          />
        </span>
        <b>
          <small>{t('batalla.especial')}</small>
          {e.nombre}
        </b>
      </div>
    </div>
  );
}

/** La tarjeta de un héroe: nivel, los PS que bajan rodando (como en EarthBound) y la experiencia. */
function Tarjeta({
  h,
  color,
  activo,
  descansa,
  especial,
}: {
  h: Luchador;
  color: string;
  activo: boolean;
  descansa: boolean;
  especial?: Especial;
}) {
  const t = useT();
  const [ps, setPs] = useState(h.ps);
  useEffect(() => {
    if (ps === h.ps) return;
    const timer = setInterval(() => setPs((v) => (v === h.ps ? v : v + Math.sign(h.ps - v))), 45);
    return () => clearInterval(timer);
  }, [h.ps, ps]);
  return (
    <div
      style={{ '--c': color } as CSSProperties}
      className={`batalla-tarjeta ${activo ? 'activa' : ''} ${h.ps === 0 ? 'ko' : ''} ${h.ps <= h.psMax / 4 && h.ps > 0 ? 'baja' : ''}`}>
      <b>
        {h.nombre} <span className="batalla-nv">{t('batalla.nivel')} {h.nivel}</span>
        {h.extra > 0 && <span className="batalla-extra">ATQ +{h.extra}</span>}
        {h.extraDef > 0 && <span className="batalla-extra def">DEF +{h.extraDef}</span>}
        {descansa && <span className="batalla-descansa">{t('batalla.descansa')}</span>}
        {h.confundido > 0 && <span className="batalla-descansa confundido">{t('batalla.confundido_tag')}</span>}
      </b>
      <span className="batalla-cuenta">
        <small>HP</small>
        <span className="rodillo">{String(ps).padStart(3, ' ')}</span>
        <small>/{h.psMax}</small>
      </span>
      <span className="batalla-barra ps" style={{ '--v': `${(ps / h.psMax) * 100}%` } as CSSProperties} />
      <span className="batalla-cuenta">
        <small>XP</small>
        <span>{h.xp}</span>
        <small>/{xpParaSubir(h.nivel)}</small>
      </span>
      <span className="batalla-barra en" style={{ '--v': `${(h.xp / xpParaSubir(h.nivel)) * 100}%` } as CSSProperties} />
      {especial && (
        <span className={`batalla-cuenta batalla-esp ${especialListo(h) ? 'listo' : ''}`} style={{ '--c': especial.color } as CSSProperties}>
          <small>{t('batalla.esp')}</small>
          <span className="batalla-barra esp" style={{ '--v': `${(h.carga / CARGA_LLENA) * 100}%` } as CSSProperties} />
          {especialListo(h) && <small className="batalla-esp-listo">{t('batalla.especial_listo')}</small>}
        </span>
      )}
    </div>
  );
}

/**
 * La presentación del enfrentamiento (como al empezar un combate de un juego de bolsillo, solo en las peleas que la
 * piden): dos destellos, la pantalla partida en diagonal con líneas de velocidad del color de cada uno, sus sprites
 * que entran de los costados, el «VS» que cae de golpe y un zoom que da paso a la pelea.
 */
function Versus({ d }: { d: DatosBatalla }) {
  const h = d.personajes[d.heroes[0]];
  const r = d.enemigos[d.jefe.enemigo];
  return (
    <div className="batalla-versus" aria-hidden>
      <div className="versus-lado rival" style={{ '--c': r.especial?.color ?? '#c46a6a' } as CSSProperties}>
        <span className="versus-sprite">
          <SpriteHoja src={r.sprite} anim="idle" />
        </span>
        <b>{r.nombre}</b>
      </div>
      <div className="versus-lado heroe" style={{ '--c': h.especial?.color ?? '#e8e2d4' } as CSSProperties}>
        <span className="versus-sprite">
          <SpriteHoja src={h.sprite} anim="idle" />
        </span>
        <b>{h.nombre}</b>
      </div>
      <span className="versus-vs">VS</span>
      <span className="versus-destello" />
    </div>
  );
}
