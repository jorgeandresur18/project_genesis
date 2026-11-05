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
  ESPECIAL_MS,
  monedasJefe,
  monedasDe,
  enCampo,
  noActua,
  tickQuemado,
  tickVeneno,
  usableEnPelea,
  objetivoDe,
  CEBO_TURNOS,
  crearCebo,
  aprendeEn,
  CONFUSION,
  seConfunde,
  quedan,
  gastarUso,
  yaTiene,
  vanPerdiendo,
  falla,
  conQuejidos,
  estadoHabla,
  revolver,
  type EstadoHabla,
  esquiva,
  probEsquiva,
  cargar,
  disponibles,
  especialListo,
  equipados,
  golpesEspecial,
  ganarXp,
  seRetira,
  usarObjeto,
  varsDeProgreso,
  vivo,
  xpDe,
  type Ataque,
  type DatosBatalla,
  type Especial,
  type Luchador,
  type Objeto,
  type Progreso,
} from '../engine/batalla';
import charlasJson from '../data/charlas_batalla.json';
import fondosJson from '../data/fondos_batalla.json';
import { EnergiasHacia } from './EfectosSprite';
import { EquipoPanel } from './Equipo';
import { OptionsPanel } from './Panels';
import { BATALLAS, sueltosQueTengo } from '../engine/batallas';
import {
  BOMBA_BOTIN,
  autodestruir,
  blancoDelCanon,
  aplicarEstacion,
  confundirA,
  desterrar,
  estacionAlAzar,
  decidirEnemigo,
  envenenarConBola,
  estadoInicial,
  evaporarClones,
  finDeTurno,
  fotoEstados,
  sufreAlFinal,
  quemarConEspecial,
  type EstadoQueTermina,
  estadosTerminados,
  golpesDelCanon,
  hacerClon,
  llegaRefuerzo,
  paralizarA,
  poderBarrido,
  ponerBomba,
  reaccionCebo,
  resolverGolpe,
  resultado,
  tickBomba,
  sumarEnemigo,
  type EstadoPelea,
} from '../engine/turnos';
import { BASE, PausaContexto, SpriteHoja, anguloDisparo, cargarHoja, rectSprite, type Anim, type Hoja } from './batalla/sprites';
import { AvisoEspecial, CajaCasillas, Figura, Tarjeta, conNumeros, type Casillas } from './batalla/escena';
import { Pixelado, Versus } from './batalla/presentacion';

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
/** Lo que se dicen con «Hablar», según quién le habla a quién (src/data/charlas_batalla.json). */
type Charla = { dice: string[]; ok?: string[]; no?: string[]; narra?: boolean };
const CHARLAS = charlasJson as unknown as Record<string, Record<string, Charla>>;
/**
 * La cuadrícula de cada fondo (src/data/fondos_batalla.json): dónde pisa cada uno, en % de la imagen. Con
 * `?cuadricula` en la dirección se ve la grilla y los puntos sobre la pelea, para ajustar un fondo nuevo.
 */
const FONDOS = fondosJson as unknown as Record<string, Casillas>;
/** Quién es alguien en las charlas: el nombre de su hoja (batalla/jair → jair). */
const quienEs = (sprite: string) => sprite.split('/').pop()!;
const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
/** Lo que tarda en deslizarse hasta el objetivo (igual que en styles.css, .batalla-figura). */
const DESLIZ_MS = 380;

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
/** El clon de sombra: dónde va respecto de quien lo hizo (% de la cuadrícula: a un costado y un poco atrás) y su tamaño. */
const CLON_CORRIDO: [number, number] = [8, -3];
const CLON_ESCALA = 0.9;
/** El clon de sombra: cuánto carga energía antes del destello. */
const CARGA_CLON_MS = 1500;
type Bala = { key: number; x: number; y: number; dx: number; dy: number; ms: number; color: string; rafaga: boolean };

type Comando =
  | { tipo: 'atacar'; ataque: number; objetivo: string }
  | { tipo: 'hablar'; objetivo: string }
  | { tipo: 'esquivar' }
  | { tipo: 'objeto'; clave: string; objetivo: string }
  | { tipo: 'especial'; objetivo: string; cual: number }
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
  datos,
  arena,
  onSalir,
}: {
  id: string;
  /** Salir de la pelea desde la pausa (al título, en la historia). Sin esto, la pausa no ofrece salir. */
  onSalir?: () => void;
  /** Los datos de la pelea armados a mano (la arena del probador); si no, los de src/data/batallas/<id>.json. */
  datos?: DatosBatalla;
  /** Arena de prueba: los enemigos que salen (clave y nivel). Nadie gana: los caídos se levantan al final del turno. */
  arena?: [string, number][];
  /** Nivel, experiencia y mochila con que llegan los héroes (si no, los del .json y la mochila vacía). */
  progreso?: Progreso;
  /** Al ganar (o huir): las variables que hay que guardar en la partida (niveles, experiencia, mochila). */
  onGanar: (vars: Vars) => void;
  onPerder: () => void;
  /** Si el rival perdona y la pelea termina hablando (Nikki). Si no está, cuenta como ganar. */
  onPerdonar?: (vars: Vars) => void;
}) {
  const d = datos ?? BATALLAS[id];
  return d ? <Pelea d={d} progreso={progreso} onGanar={onGanar} onPerder={onPerder} onPerdonar={onPerdonar} arena={arena} onSalir={onSalir} /> : null;
}

function Pelea({
  d,
  progreso,
  onGanar,
  onPerder,
  onPerdonar,
  arena,
  onSalir,
}: {
  onSalir?: () => void;
  d: DatosBatalla;
  progreso?: Progreso;
  onGanar: (vars: Vars) => void;
  onPerder: () => void;
  onPerdonar?: (vars: Vars) => void;
  arena?: [string, number][];
}) {
  const t = useT();
  // En la vida real (el bar) no cuentan los niveles ni la mochila del juego: Jair todavía no entró a GENESIS.
  const guardado = progreso;
  progreso = d.vida_real ? undefined : progreso;
  // El estado de la pelea vive en un ref (lo cambian las acciones, en orden) y se redibuja con `forzar`.
  // Qué contiene y con qué empieza: engine/turnos.ts (`EstadoPelea`, `estadoInicial`).
  const b = useRef<EstadoPelea>(null as unknown as EstadoPelea);
  if (!b.current) b.current = estadoInicial(d, progreso);
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
  /** Los cebos con efecto que recibieron un golpe en este ataque, y de quién. */
  const cebosGolpeados = useRef<[Luchador, Luchador][]>([]);
  /** Cuánto se corre cada uno de su lugar (y en cuántos ms, si no es el deslizamiento de siempre). */
  const [desliz, setDesliz] = useState<Record<string, { x: number; y: number; ms?: number }>>({});
  /** La pantalla oscura de un especial (el vórtice de la sombra). */
  const [oscuro, setOscuro] = useState(false);
  const figuras = useRef(new Map<string, HTMLDivElement>());
  const [numeros, setNumeros] = useState<{ key: number; id: string; texto: string; tipo: 'dano' | 'cura' | 'critico' | 'falla' }[]>([]);
  /** El mensaje: la narración arriba; lo que dice alguien, abajo con su retrato. Se escribe letra por letra. */
  const [mensaje, setMensaje] = useState<{ texto: string; quien?: string; turno?: string; n: number; estado?: EstadoHabla } | null>(null);
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
  const casillas: Casillas | undefined = FONDOS[d.fondo];
  /** Quién está junto a quién (el que ataca de cerca): para dibujarlo delante de su blanco. */
  const junto_de = useRef(new Map<string, string>());
  /** El orden de dibujo de cada casilla (más abajo en el piso, más adelante). */
  const zCasilla = useRef(new Map<string, number>());
  const casillaDe = useRef(new Map<string, number>());
  const casillaRival = (e: Luchador) => {
    if (!casillaDe.current.has(e.id)) {
      const usadas = new Set(b.current.enemigos.map((x) => casillaDe.current.get(x.id)).filter((x) => x !== undefined));
      let i = 0;
      while (usadas.has(i)) i++;
      casillaDe.current.set(e.id, i);
    }
    return casillaDe.current.get(e.id)!;
  };
  /** Pone a alguien en su casilla (los pies en el punto); si faltan casillas, se corre al costado de la última. */
  const enCasilla = (lado: 'equipo' | 'rivales', i: number, key: string, nodo: React.ReactNode, corrido?: [number, number]) => {
    if (!casillas) return nodo;
    const lista = casillas[lado];
    const [x0, y0] = lista[Math.min(i, lista.length - 1)];
    // El clon no toma una casilla libre: va pegado detrás de quien lo hizo (un poco más arriba en el piso).
    const [x, y] = corrido ? [x0 + corrido[0], y0 + corrido[1]] : [x0, y0];
    const extra = Math.max(0, i - lista.length + 1) * (lado === 'rivales' ? 8 : -8);
    zCasilla.current.set(key, Math.round(y) * 2);
    const blanco = junto_de.current.get(key);
    const z = blanco ? (zCasilla.current.get(blanco) ?? Math.round(y) * 2) + 1 : Math.round(y) * 2;
    return (
      <div key={key} className="batalla-casilla" style={{ left: `${x + extra}%`, top: `${y}%`, zIndex: z }}>
        {nodo}
      </div>
    );
  };
  /** Los proyectiles en el aire (la media luna de la sombra). */
  const [proyectiles, setProyectiles] = useState<
    { key: number; src: string; x: number; y: number; w: number; h: number; dx: number; dy: number; ms: number; demora: number; ang: number; espejo: boolean }[]
  >([]);

  const animar = async (lid: string, a: Anim, ms = 0) => {
    // Lo que se ve en una pelea se desbloquea en la galería (Pixel art): la acción de esa hoja.
    const l = [...b.current.heroes, ...b.current.enemigos].find((x) => x.id === lid);
    const hoja = l && (l.lado === 'heroe' ? d.personajes[l.clave]?.sprite : d.enemigos[l.clave]?.sprite);
    const accion = a === 'ko' ? 'derrotado' : a === 'golpeado' ? 'daño' : a;
    if (hoja && !l?.cebo) useStore.getState().marcarRpg([`${hoja}#${accion}`]);
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
  /** Quien espera un cuadro de su animación para soltar algo (el corazón del beso). */
  const esperandoCuadro = useRef(new Map<string, { anim: string; col: number; ok: () => void }>());
  /** Cada cuadro nuevo de un luchador: si está disparando y ese cuadro tiene destellos, salen balas. */
  /** Lo que sostiene en la mano antes de lanzarlo (el corazón del beso), dibujado como imagen: sigue a la mano. */
  const [enMano, setEnMano] = useState<Record<string, { src: string; x: number; y: number; w: number; h: number; espejo: boolean }>>({});
  const alCuadro = (l: Luchador, anim: string, col: number, hoja: Hoja) => {
    const pm = hoja.proyectiles?.[anim];
    if (pm?.pista) {
      const p = pm.pista[String(col)];
      const s = p && rectSprite(figuras.current.get(l.id)?.querySelector('.batalla-sprite'));
      const base = raiz.current?.getBoundingClientRect();
      if (p && s && base) {
        const k = s.width / hoja.frameWidth;
        const espejo = l.lado === 'heroe';
        setEnMano((m) => ({
          ...m,
          [l.id]: { src: `${BASE}${pm.imagen}.png`, x: (espejo ? s.right - p[0] * k : s.left + p[0] * k) - base.left, y: s.top + p[1] * k - base.top, w: pm.ancho * k * p[2], h: pm.alto * k * p[2], espejo },
        }));
      } else setEnMano((m) => (m[l.id] ? Object.fromEntries(Object.entries(m).filter(([id]) => id !== l.id)) : m));
    }
    if (hoja.rayo && anim === 'especial') {
      const r = hoja.rayo[String(col)];
      const p = r && enPantalla(l, hoja, [r[0], r[1]]);
      if (p) {
        const ang = l.lado === 'heroe' ? Math.PI - r[2] : r[2];
        const escala = (rectSprite(figuras.current.get(l.id)?.querySelector('.batalla-sprite'))?.width ?? hoja.frameWidth) / hoja.frameWidth;
        setRayoSigue({ id: l.id, x: p.x, y: p.y, largo: p.ancho * 1.6, ang, grosor: r[3] * escala });
      } else setRayoSigue((x) => (x?.id === l.id ? null : x));
    }
    const aviso = esperandoCuadro.current.get(l.id);
    if (aviso && aviso.anim === anim && aviso.col === col) {
      esperandoCuadro.current.delete(l.id);
      aviso.ok();
    }
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
      // Hacia la izquierda va en espejo (girarlo 180° lo dejaba cabeza abajo).
      { key, src: `${BASE}${p.imagen}.png`, x, y, w: p.ancho * k, h: p.alto * k, dx: cos * largo, dy: Math.sin(ang) * largo, ms, demora, ang: cos < 0 ? ang - Math.PI : ang, espejo: cos < 0 },
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
    // Se desbloquea en la galería (Pixel art).
    useStore.getState().marcarRpg([`${d.enemigos[e.clave].sprite}#clon`]);
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
    const { clon: k, costo } = hacerClon(b.current, c, e, `${e.clave}-clon-${Date.now()}`);
    numero(e.id, `-${costo}`, 'dano');
    efecto(k.id, 'aparece', 900);
    playChip('vortice');
    forzar();
    await decir(fmt(t('batalla.clon_aparece'), { quien: e.nombre, n: c.turnos }));
    const r = c.reacciones?.length ? azar(c.reacciones) : null;
    if (r) await decir(r.texto, r.quien === 'Voz' ? undefined : r.quien);
  };
  /** Al final de cada turno, los clones pierden un turno; el que llega a cero se evapora. */
  const evaporar = async () => {
    for (const k of evaporarClones(b.current)) {
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
    const hoja = (await cargarHoja(e.lado === 'heroe' ? d.personajes[e.clave].sprite : d.enemigos[e.clave].sprite)) as Hoja;
    const fila = a.anim && 'animations' in hoja ? hoja.animations[a.anim] : undefined;
    const proy = a.anim ? hoja.proyectiles?.[a.anim] : undefined;
    const dura = fila ? ((fila.seq?.length ?? fila.frames) * 1000) / fila.fps : 1200;
    if (fila) void animar(e.id, a.anim as Anim, dura);
    let llegadas = blancos.map(() => 600);
    if (proy && fila) {
      // Hasta el cuadro en que suelta el corazón; ahí suena el beso. Lo avisa la animación (un cuadro antes del que
      // ya no lo tiene dibujado, así nunca hay un instante sin corazón); el reloj queda de respaldo.
      const paso = fila.seq ? Math.max(0, fila.seq.indexOf(proy.cuadro)) : proy.cuadro;
      const antes = fila.seq ? fila.seq[Math.max(0, paso - 1)] : Math.max(0, proy.cuadro - 1);
      await Promise.race([
        new Promise<void>((ok) => esperandoCuadro.current.set(e.id, { anim: a.anim!, col: antes, ok })),
        espera((paso * 1000) / fila.fps + 500),
      ]);
      esperandoCuadro.current.delete(e.id);
      playChip('beso');
      const desde = Date.now();
      llegadas = blancos.map((h, i) => lanzar(e, hoja, proy, h, i * 160));
      await espera(Math.max(...llegadas) - (Date.now() - desde));
    } else {
      playChip('beso');
      await espera(600);
    }
    for (const h of blancos) {
      if (esquiva(d, h, e)) {
        numero(h.id, 'MISS', 'falla');
        void animar(h.id, 'salto', 600);
        await lineas('esquiva_ok', { quien: h.nombre });
        continue;
      }
      await confundir(h, a.confunde!);
    }
  };
  const confundir = async (x: Luchador, n: number) => {
    confundirA(b.current, x, n);
    luz(x.id, '#ff6fae', true);
    playChip('boing');
    forzar();
    await decir(fmt(t('batalla.confundido'), { quien: x.nombre, n }));
  };
  /** El Cebo: una copia del héroe en blanco y negro, delante de él. No hace nada. */
  const dejarCebo = async (h: Luchador, a: Ataque) => {
    await decir(fmt(a.texto, { quien: h.nombre }));
    ponerCebo(h, a.cebo_efecto);
    await decir(fmt(t('batalla.cebo_aparece'), { quien: h.nombre }));
  };
  /** Pone el cebo de `h` delante de él (el que tenía, se va). */
  const ponerCebo = (h: Luchador, efectoCebo?: Ataque['cebo_efecto']) => {
    const f = figuras.current.get(h.id);
    // Relativo a la fila de los héroes (con la cuadrícula, el padre de la figura es su casilla).
    const lado = f?.closest('.batalla-lado')?.getBoundingClientRect();
    const r = f?.getBoundingClientRect();
    // Uno solo por héroe: el viejo se va.
    b.current.cebos = b.current.cebos.filter((x) => x.de !== h.id && vivo(x.l));
    const k = crearCebo(h, `${h.id}-cebo-${Date.now()}`, efectoCebo);
    // El turno en que aparece cuenta (los enemigos ya pueden pegarle).
    b.current.cebos.push({ l: k, de: h.id, x: r && lado ? r.left - lado.left - r.width * 0.45 : 0, y: r && lado ? r.top - lado.top : 0, turnos: CEBO_TURNOS });
    efecto(k.id, 'aparece-cebo', 700);
    playChip('cambio');
    forzar();
  };
  /** Si el héroe ya tiene un cebo en pie (no puede poner otro). */
  const tieneCebo = (h: Luchador) => b.current.cebos.some((x) => x.de === h.id && vivo(x.l));
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
    for (const [cebo, atacante] of cebosGolpeados.current.splice(0)) await reaccionarCebo(cebo, atacante);
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
  const paralizar = async (x: Luchador) => {
    paralizarA(b.current, x);
    const n = x.paralizado;
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
  const decir = (texto: string, quien?: string, estado?: EstadoHabla) =>
    new Promise<void>((resolve) => {
      const cps = useStore.getState().settings.textSpeed;
      const instante = cps >= TEXT_SPEED_INSTANT;
      setMensaje({ texto, quien, n: Math.random(), estado });
      let n = instante ? texto.length : 0;
      setLetras(n);
      let leyendo: ReturnType<typeof setTimeout> | undefined;
      // Se asigna más abajo, después de `listo`, que lo necesita para cortarlo.
      // eslint-disable-next-line prefer-const
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
    // En la vida real no se guarda nada de la pelea (ni niveles ni mochila), salvo el premio (más abajo).
    d.vida_real
      ? Object.fromEntries(Object.entries(d.premio?.objetos ?? {}).filter(([k]) => (b.current.mochila[k] ?? 0) > 0).map(([k]) => [`mochila_${k}`, (guardado?.mochila[k] ?? 0) + b.current.mochila[k]]))
      : {
          ...varsDeProgreso(
            { heroes: Object.fromEntries(b.current.heroes.map((h) => [h.clave, { nivel: h.nivel, xp: h.xp }])), mochila: b.current.mochila, monedas: b.current.monedas },
            Object.keys(d.objetos),
          ),
          ...Object.fromEntries(b.current.cassettesGanados.map((id) => [`cassette_${id}`, (guardado?.cassettes?.[id] ?? 0) + b.current.cassettesGanados.filter((x) => x === id).length])),
        };

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
    const e = sumarEnemigo(b.current, d, clave, nivel);
    efecto(e.id, 'aparece', 900);
    playChip('enemigo');
    forzar();
    return e;
  };
  const jefeSeRetira = () => {
    // En la arena nadie se retira.
    if (arena) return null;
    const jefe = b.current.enemigos.find((e) => d.enemigos[e.clave].jefe && e.clon === undefined);
    return jefe && seRetira(jefe, d.enemigos[jefe.clave]) ? jefe : null;
  };

  /** Un turno: eligen los héroes que pueden actuar, actúan en ese orden y después atacan los enemigos. */
  const turno = async (): Promise<'sigue' | 'gana' | 'huye' | 'pierde' | 'perdona' | 'empate'> => {
    // Quién ya estaba envenenado o quemado al empezar: solo a esos les baja la vida al final de este turno.
    const alEmpezar = fotoEstados([...b.current.heroes, ...b.current.enemigos]);
    const opciones = disponibles(b.current.heroes, d.personajes, b.current.actuaron);
    b.current.descansan = b.current.heroes.filter((h) => vivo(h) && !opciones.includes(h)).map((h) => h.id);
    forzar();
    // Dormido, congelado o paralizado: pierde su turno.
    for (const h of b.current.heroes.filter((x) => vivo(x) && x.desterrado)) await decir(fmt(t('batalla.sigue_desterrado'), { quien: h.nombre, n: h.desterrado }));
    for (const h of b.current.heroes.filter((x) => vivo(x) && !x.desterrado && noActua(x))) await decir(fmt(t(h.paralizado ? 'batalla.sigue_paralizado' : h.congelado ? 'batalla.sigue_congelado' : 'batalla.sigue_dormido'), { quien: h.nombre, n: h.paralizado }));
    if (!opciones.length) {
      await lineas('descanso');
      b.current.actuaron = [];
    } else {
      const elecciones: [Luchador, Comando][] = [];
      for (let k = 0; k < opciones.length; k++) {
        const c = await pedirComando(opciones[k], k === 0);
        if (!c) {
          // Volver al héroe anterior (deshace su elección; si era un objeto, vuelve a la mochila).
          const [quien, antes] = elecciones.pop() ?? [];
          if (antes?.tipo === 'objeto') b.current.mochila[antes.clave]++;
          k = quien ? opciones.indexOf(quien) - 1 : -1;
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
        // La autodestrucción o un cebo explosivo pueden terminarla de golpe.
        const r = resultado(b.current, d);
        if (r === 'empate' || r === 'pierde') return r;
        if (jefeSeRetira()) return 'gana';
        if (ataca(c)) await cansarse(h);
      }
    }
    if (jefeSeRetira()) return 'gana';
    // En la arena, si cayeron todos los rivales, se levantan.
    if (arena && !b.current.enemigos.some(vivo)) {
      await revivirArena();
      return 'sigue';
    }
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
    // Lo que tenía cada uno antes de que bajen los turnos (para anunciar arriba lo que se terminó).
    const antesDelFin = fotoEstados([...b.current.heroes, ...b.current.enemigos]);
    finDeTurno(b.current);
    forzar();
    // Sin héroes: pierden, o empatan si tampoco quedó nadie del otro lado.
    const terminada = () => {
      const r = resultado(b.current, d);
      return r === 'empate' || r === 'pierde' ? r : null;
    };
    let fin = terminada();
    if (fin) return fin;
    await venenos(alEmpezar);
    fin = terminada();
    if (fin) return fin;
    await avisarFinEstados(antesDelFin);
    await explotarBomba();
    fin = terminada();
    if (fin) return fin;
    if (jefeSeRetira()) return 'gana';
    await evaporar();
    await evaporarCebos();
    await ayudar();
    await levantarse();
    if (arena) await revivirArena();
    return 'sigue';
  };
  /** La arena de prueba: los que cayeron (héroes y rivales) se levantan con la vida llena. Los clones no vuelven. */
  const revivirArena = async () => {
    const heroes = b.current.heroes.filter((h) => !vivo(h));
    const rivales = b.current.enemigos.filter((e) => !vivo(e) && e.clon === undefined);
    if (!heroes.length && !rivales.length) return;
    for (const h of heroes) {
      Object.assign(h, { ps: h.psMax, paralizado: 0, confundido: 0, envenenado: null, protegido: 0, quemado: 0, congelado: 0, dormido: 0, carga: 0, usados: {} });
      b.current.cansados.delete(h.id);
      void animar(h.id, 'idle');
      luz(h.id, '#7dffb0', true);
    }
    for (const e of rivales) sacar(e.clave, e.nivel);
    playChip('revivir');
    forzar();
    await decir(fmt(t('batalla.arena_revive'), { quien: [...heroes, ...rivales].map((x) => x.nombre).join(', ') }));
  };

  /**
   * Avisa arriba los estados que se terminaron desde `antes` (por los turnos o por un objeto): «Jair se despierta»,
   * «A Cami se le pasó el veneno»… (pedido del autor).
   */
  const avisarFinEstados = async (antes: ReturnType<typeof fotoEstados>) => {
    for (const { l, estado } of estadosTerminados(antes, [...b.current.heroes, ...b.current.enemigos])) {
      luz(l.id, '#e8f4ff');
      forzar();
      await decir(fmt(t(`batalla.fin_${estado}`), { quien: l.nombre }));
    }
  };
  /** El veneno al final del turno: cada envenenado pierde PS (los enemigos que caen, caen). */
  const venenos = async (alEmpezar: Map<string, EstadoQueTermina[]>) => {
    for (const l of [...b.current.heroes, ...b.current.enemigos].filter((x) => vivo(x) && !x.desterrado && x.envenenado && sufreAlFinal(alEmpezar, x, 'envenenado'))) {
      const n = tickVeneno(l, l.lado === 'enemigo' && !!d.enemigos[l.clave]?.jefe && l.clon === undefined);
      if (!n) continue;
      numero(l.id, String(n), 'dano');
      luz(l.id, '#7dff6a');
      playChip('impacto');
      forzar();
      await decir(fmt(t('batalla.veneno'), { quien: l.nombre, n }));
      if (vivo(l)) continue;
      void animar(l.id, 'ko');
      if (l.lado === 'enemigo') await alCaer(l);
      else await decir(fmt(t('batalla.cae'), { quien: l.nombre }));
    }
    for (const l of [...b.current.heroes, ...b.current.enemigos].filter((x) => vivo(x) && !x.desterrado && x.quemado && sufreAlFinal(alEmpezar, x, 'quemado'))) {
      const n = tickQuemado(l, l.lado === 'enemigo' && !!d.enemigos[l.clave]?.jefe && l.clon === undefined);
      if (!n) continue;
      numero(l.id, String(n), 'dano');
      luz(l.id, '#ff8a3c');
      playChip('impacto');
      forzar();
      await decir(fmt(t('batalla.quemadura'), { quien: l.nombre, n }));
      if (vivo(l)) continue;
      void animar(l.id, 'ko');
      if (l.lado === 'enemigo') await alCaer(l);
      else await decir(fmt(t('batalla.cae'), { quien: l.nombre }));
    }
  };
  /**
   * Una explosión (la bomba o la autodestrucción): cada uno recibe lo suyo. Los enemigos que caen, caen después de ver
   * cómo terminó: si no quedó nadie, es empate y no llegan refuerzos.
   */
  const mostrarExplosion = async (golpes: { l: Luchador; n: number }[]) => {
    playChip('impacto');
    setFogonazo({ key: Math.random(), color: '#ff5a36' });
    setTiembla(Math.random());
    for (const { l, n } of golpes) {
      numero(l.id, String(n), 'critico');
      luz(l.id, '#ff5a36', true);
      void animar(l.id, vivo(l) ? 'daño' : 'ko', 500);
    }
    forzar();
    await espera(700);
    await limpiarCebos();
    const r = resultado(b.current, d);
    if (r === 'empate' || r === 'pierde') return;
    for (const { l } of golpes) {
      if (vivo(l) || l.cebo) continue;
      if (l.lado === 'enemigo') await alCaer(l);
      else await decir(fmt(t('batalla.cae'), { quien: l.nombre }));
    }
  };
  /** Al final del turno la bomba descuenta y, al llegar a 0, explota contra todos. */
  const explotarBomba = async () => {
    const hadBomba = !!b.current.bomba;
    const golpes = tickBomba(b.current, d);
    if (hadBomba) forzar();
    if (!golpes) return;
    await decir(t('batalla.bomba_explota'));
    await mostrarExplosion(golpes);
  };
  /** Lo que le pasa al que golpeó un cebo con efecto. */
  const reaccionarCebo = async (cebo: Luchador, atacante: Luchador) => {
    const r = reaccionCebo(b.current, d, cebo, atacante);
    if (!r) return;
    forzar();
    if (r.tipo === 'estado') {
      luz(atacante.id, '#ffffff', true);
      playChip('boing');
      return decir(fmt(t('batalla.cebo_causa'), { quien: atacante.nombre, estado: t(r.estado === 'paralizado' ? 'batalla.cebo_paralizado' : `batalla.estado_${r.estado}`) }));
    }
    playChip('impacto');
    setFogonazo({ key: Math.random(), color: '#ff5a36' });
    numero(atacante.id, String(r.aAtacante), 'critico');
    if (r.dueno) numero(r.dueno.id, String(r.aDueno), 'dano');
    await decir(fmt(t('batalla.cebo_explota'), { quien: atacante.nombre, n: r.aAtacante }));
    if (!vivo(atacante)) {
      void animar(atacante.id, 'ko');
      if (atacante.lado === 'enemigo') await alCaer(atacante);
    }
    if (r.dueno && !vivo(r.dueno)) {
      void animar(r.dueno.id, 'ko');
      await decir(fmt(t('batalla.cae'), { quien: r.dueno.nombre }));
    }
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
      if (arena) {
        // La arena: salen los rivales elegidos, todos juntos.
        for (const [clave, nivel] of arena) sacar(clave, nivel);
        await decir(fmt(t('batalla.aparecen'), { n: b.current.enemigos.length }));
      } else if (!horda.niveles.length) {
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
        // En la arena no se gana ni se pierde: los caídos se levantan y sigue.
        if (arena && r !== 'huye') {
          b.current.perdona = false;
          b.current.racha = 0;
          await revivirArena();
          continue;
        }
        if (r === 'huye') return salir(() => fin.current.onGanar(varsFinales()));
        // Empate: mueren todos. En la historia cuenta como perder (lleva a su bad end).
        if (r === 'empate') {
          await decir(t('batalla.empate'));
          return salir(() => fin.current.onPerder());
        }
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
      // Hacer retirar al jefe deja monedas.
      if (jefe) {
        const m = monedasJefe(jefe.nivel);
        b.current.monedas += m;
        playChip('vida');
        await decir(fmt(t('batalla.monedas_jefe'), { quien: jefe.nombre, m }));
      }
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
      junto_de.current.delete(quien);
      forzar();
      return;
    }
    const p = junto(quien, hacia);
    if (!p) return;
    // Mientras está junto a su blanco, se dibuja justo delante de él (no delante de los que están más adelante).
    junto_de.current.set(quien, hacia);
    setDesliz((m) => ({ ...m, [quien]: p }));
    if (anim !== 'mover') {
      // Llega con otra animación (el especial): se queda en ella.
      void animar(quien, anim);
      return espera(DESLIZ_MS);
    }
    await animar(quien, 'mover', DESLIZ_MS);
  };

  /**
   * Un golpe: resta PS (el jefe que se retira nunca llega a 0), números, animación y, si cae, lo que pasa.
   * `aMedias`: un especial al que eligió esquivar (no se esquiva, pero le hace la mitad).
   */
  const golpear = async (atacante: Luchador, defensor: Luchador, poder: number, color = '#fff6d0', aMedias = false) => {
    // Las cuentas: engine/turnos.ts (`resolverGolpe`). Aquí, cómo se ve.
    const golpe = resolverGolpe(b.current, d, atacante, defensor, poder, aMedias);
    // Protegido: este golpe no le hace nada (y se gasta la protección).
    if (golpe.bloqueado) {
      numero(defensor.id, t('batalla.bloquea'), 'falla');
      luz(defensor.id, '#8fd3ff', true);
      playChip('cambio');
      forzar();
      return golpe;
    }
    const { n, critico } = golpe;
    if (aMedias) {
      numero(defensor.id, t('batalla.a_medias'), 'falla');
      void animar(defensor.id, 'salto', 600);
    }
    luz(defensor.id, color, critico);
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
    // El cebo reacciona al terminar el ataque (ver limpiarCebos).
    if (defensor.cebo && defensor !== atacante) cebosGolpeados.current.push([defensor, atacante]);
    return { n, critico };
  };

  /** Un enemigo cae: experiencia para todos, a veces un objeto para la mochila y, si queda horda, otro llega. */
  const alCaer = async (e: Luchador) => {
    if (e.clon !== undefined) return decir(fmt(t('batalla.clon_cae'), { quien: e.nombre }));
    await decir(fmt(t('batalla.cae'), { quien: e.nombre }));
    const xp = xpDe(e.nivel);
    // Experiencia para todos y monedas para la partida.
    const m = monedasDe(e.nivel);
    b.current.monedas += m;
    await decir(fmt(t('batalla.xp_monedas'), { n: xp, m }));
    for (const h of b.current.heroes.filter(vivo)) {
      for (const nivel of ganarXp(h, d.personajes[h.clave], xp)) {
        playChip('vida');
        forzar();
        void animar(h.id, 'victoria', 1200);
        efecto(h.id, 'sube-stat', 1300);
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
    // Muy de vez en cuando suelta la bomba del día del juicio (solo en una partida: la vida real y las pruebas, no).
    if (guardado && !d.vida_real && !arena && Math.random() < BOMBA_BOTIN) {
      b.current.cassettesGanados.push('bomba_juicio');
      playChip('vida');
      await decir(fmt(t('batalla.bomba_botin'), { quien: e.nombre }));
    }
    // Refuerzos: cada vez que cae uno de la horda, llega el siguiente.
    const { horda } = d;
    if (llegaRefuerzo(b.current, d, e)) {
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
      // Le pidieron perdón y ahora la atacan: no se lo perdona (la Mega Bola Tóxica, en su próximo turno).
      if ((c.tipo === 'atacar' || c.tipo === 'especial') && !arena) b.current.traicion = h.id;
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
      const destino = objetivoDe(o);
      const rivales = b.current.enemigos.filter(vivo);
      const blancos: Luchador[] = o.revive
        ? b.current.heroes.filter((x) => x.id === c.objetivo && !vivo(x))
        : destino === 'yo'
          ? [h]
          : destino === 'equipo'
            ? b.current.heroes.filter(vivo)
            : destino === 'rivales'
              ? rivales
              : destino === 'rival'
                ? [rivales.find((x) => x.id === c.objetivo) ?? rivales[0]].filter(Boolean)
                : [b.current.heroes.find((x) => x.id === c.objetivo && vivo(x)) ?? h];
      // Si ya no hay a quién (revivir a alguien que se levantó, o el rival cayó): el objeto vuelve a la mochila.
      if (!blancos.length) {
        b.current.mochila[c.clave]++;
        return decir(t(o.revive ? 'batalla.nadie_caido' : 'batalla.sin_blanco'));
      }
      const yaEstan = blancos.map((x) => yaTiene(x, o));
      if (yaEstan.every(Boolean)) {
        b.current.mochila[c.clave]++;
        playChip('vacio');
        return decir(fmt(t('batalla.ya_tiene_objeto'), { quien: blancos.map((x) => x.nombre).join(' y '), estado: t(`batalla.estado_${yaEstan[0]}`) }));
      }
      // A los que ya lo tienen no les hace nada.
      blancos.splice(0, blancos.length, ...blancos.filter((_, i) => !yaEstan[i]));
      const contra = destino === 'rival' || destino === 'rivales';
      // Para avisar después si el objeto le sacó un estado a alguien.
      const antesDelObjeto = fotoEstados(blancos);
      let n = 0;
      for (const a of blancos) {
        n = usarObjeto(o, a, a.lado === 'heroe' ? d.personajes[a.clave] : undefined);
        if (o.revive) {
          setAnims((x) => ({ ...x, [a.id]: 'idle' }));
          efecto(a.id, 'se-levanta', 800);
          playChip('revivir');
        }
        const marca = o.niveles
          ? `NV +${n}`
          : o.ps || o.cura_toda || o.revive
            ? `+${n}`
            : o.atq
              ? `ATQ +${n}`
              : o.def
                ? `DEF +${n}`
                : o.veneno
                  ? t('batalla.tag_veneno')
                  : o.protege
                    ? t('batalla.tag_protegido')
                    : o.confunde
                      ? t('batalla.confundido_tag')
                      : o.paraliza
                        ? '✕'
                        : `+${n}`;
        numero(a.id, marca, contra ? 'falla' : 'cura');
        const cambio = (o.atq ?? 0) + (o.def ?? 0) + (o.niveles ?? 0);
        if (cambio) efecto(a.id, cambio > 0 ? 'sube-stat' : 'baja-stat', 1300);
        else if (o.ps || o.cura_toda || o.revive) efecto(a.id, 'cura', 1300);
        luz(a.id, o.veneno ? '#7dff6a' : o.protege ? '#8fd3ff' : contra ? '#ff6fae' : '#9dffb0');
      }
      playChip(contra ? 'cambio' : 'vida');
      forzar();
      await decir(fmt(o.texto, { quien: blancos.map((x) => x.nombre).join(' y '), n }));
      return avisarFinEstados(antesDelObjeto);
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
    if (c.tipo === 'especial') {
      const esp = equipados(d.personajes[h.clave], h.nivel, progreso?.equipo?.[h.clave], sueltosQueTengo(progreso?.cassettes), progreso?.especialesGanados).especiales[c.cual] ?? d.personajes[h.clave].especial!;
      // El Multicebo: no golpea; un cebo normal delante de cada héroe en pie.
      if (esp.multicebo) {
        h.carga = 0;
        await avisar(esp, d.personajes[h.clave].sprite, true);
        await decir(fmt(esp.texto, { quien: h.nombre }));
        for (const x of b.current.heroes.filter(vivo)) ponerCebo(x);
        return decir(t('batalla.multicebo_aparece'));
      }
      // La bomba: no golpea, queda en el campo.
      if (esp.bomba) {
        if (!ponerBomba(b.current, h, esp.bomba)) return decir(t('batalla.bomba_ya'));
        await avisar(esp, d.personajes[h.clave].sprite, true);
        playChip('carga');
        forzar();
        return decir(fmt(esp.texto, { quien: h.nombre }));
      }
      return usarEspecial(h, esp, d.personajes[h.clave].sprite, enemigos, objetivo(c.objetivo));
    }
    if (c.tipo === 'hablar') {
      cargar(h, CARGA.hablar);
      const e = objetivo(c.objetivo);
      const en = d.enemigos[e.clave];
      if (e.clon !== undefined) {
        b.current.racha = 0;
        return decir(fmt(t('batalla.clon_no_escucha'), { quien: e.nombre }));
      }
      const yo = quienEs(d.personajes[h.clave].sprite);
      const charla = CHARLAS[yo]?.[quienEs(en.sprite)];
      // Según su estado, la frase sale distinta (congelado, confundido, con dolor); «Hablar» funciona igual.
      const estado = estadoHabla(h);
      const dicho = (normal: string, confusas?: string[]) => {
        if (estado === 'congelado') return '…';
        if (estado === 'confundido') return confusas?.length ? azar(confusas) : revolver(normal);
        if (estado === 'envenenado' || estado === 'quemado') return conQuejidos(normal, t(`batalla.quejidos_${estado}`).split('|'));
        return normal;
      };
      // Pedirle perdón (Nikki): tantos turnos seguidos y termina la pelea. Es cosa de Jair: los demás le hablan a su
      // manera (las charlas).
      const p = yo === 'jair' ? en.perdon : undefined;
      if (p) {
        const i = Math.min(b.current.racha, p.veces - 1);
        b.current.racha++;
        const confusa = p.pide_confundido?.[i];
        await decir(fmt(dicho(p.pide[i] ?? azar(d.personajes[h.clave].hablar), confusa ? [confusa] : undefined), { objetivo: e.nombre }), h.nombre, estado);
        await decir(p.responde[i], p.quien);
        if (b.current.racha >= p.veces) b.current.perdona = true;
        return;
      }
      await decir(fmt(dicho(azar(charla?.dice ?? d.personajes[h.clave].hablar), d.personajes[h.clave].hablar_confundido), { objetivo: e.nombre }), h.nombre, estado);
      // Al jefe no se lo distrae.
      const funciona = !en.jefe && Math.random() < d.hablar;
      const contesta = charla?.[funciona ? 'ok' : 'no'];
      if (contesta?.length) await decir(fmt(azar(contesta), { objetivo: h.nombre }), charla?.narra ? undefined : e.nombre);
      else if (en.responde) await decir(azar(funciona ? en.responde.ok : en.responde.no), en.responde.quien);
      if (funciona) e.distraido = true;
      return lineas(funciona ? 'hablar_ok' : 'hablar_no', { objetivo: e.nombre });
    }
    if (c.tipo !== 'atacar') return;
    const ataque = equipados(d.personajes[h.clave], h.nivel, progreso?.equipo?.[h.clave], sueltosQueTengo(progreso?.cassettes), progreso?.especialesGanados).ataques[c.ataque];
    gastarUso(h, ataque);
    if (ataque.cebo) return dejarCebo(h, ataque);
    if (ataque.autodestruccion) {
      await decir(fmt(ataque.texto, { quien: h.nombre }));
      void animar(h.id, 'ko');
      return mostrarExplosion(autodestruir(b.current, d, h, ataque.autodestruccion));
    }
    if (ataque.cura) {
      // Se cura (Rikka, Ctrl+Z de Jair): carga y lo rodea el aura verde de la curación.
      cargar(h, CARGA.atacar);
      await decir(fmt(ataque.texto, { quien: h.nombre }));
      playChip('vida');
      efecto(h.id, 'cura', 1400);
      luz(h.id, '#7dffb0', true);
      await espera(700);
      const antes = h.ps;
      h.ps = Math.min(h.psMax, h.ps + Math.round(h.psMax * ataque.cura));
      numero(h.id, `+${h.ps - antes}`, 'cura');
      forzar();
      return decir(fmt(t('batalla.se_cura'), { quien: h.nombre, n: h.ps - antes }));
    }
    // Sobre sí mismo (potenciarse, protegerse): no se elige a quién; brilla dorado y aplica el efecto como un objeto.
    if (ataque.alMismo && ataque.aplica) {
      cargar(h, CARGA.atacar);
      await decir(fmt(ataque.texto, { quien: h.nombre }));
      void animar(h.id, 'ataque', 750);
      playChip('vida');
      luz(h.id, ataque.aplica.protege ? '#dfe7f2' : '#ffd76a', true);
      await espera(600);
      usarObjeto(ataque.aplica as unknown as Objeto, h);
      forzar();
      const n = ataque.aplica.atq ?? ataque.aplica.def ?? 0;
      return decir(fmt(t(ataque.aplica.protege ? 'batalla.se_protege' : 'batalla.se_potencia'), { quien: h.nombre, n }));
    }
    // A todos los rivales: ataca desde su lugar y cada golpe puede fallar.
    if (ataque.objetivo === 'todos') {
      const blancos = b.current.enemigos.filter(vivo);
      await decir(fmt(ataque.texto, { quien: h.nombre, objetivo: blancos.map((x) => x.nombre).join(', ') }));
      cargar(h, CARGA.atacar);
      void animar(h.id, 'ataque', 750);
      playChip(sonidoDe(h));
      await espera(320);
      for (const x of blancos) {
        if (!vivo(x)) continue;
        if (falla(d, h, x)) {
          numero(x.id, 'MISS', 'falla');
          continue;
        }
        bajoEspecial.current.add(x.id);
        await golpear(h, x, ataque.poder);
      }
      await espera(450);
      soltar(blancos);
      for (const x of blancos) if (!vivo(x)) await alCaer(x);
      return;
    }
    const e = objetivo(c.objetivo);
    await decir(fmt(ataque.texto, { quien: h.nombre, objetivo: e.nombre }));
    // Los ataques de efecto (el beso, la parálisis) no pegan: dejan al blanco confundido o paralizado. Si ya lo
    // está, no se acumula: se pierde el turno, pero no el uso.
    const ya = (ataque.confunde || ataque.paraliza) && yaTiene(e, ataque);
    if (ya) {
      if (h.usados?.[ataque.nombre]) h.usados[ataque.nombre]--;
      playChip('vacio');
      return decir(fmt(t('batalla.ya_tiene_ataque'), { quien: e.nombre, estado: t(`batalla.estado_${ya}`) }));
    }
    if (ataque.confunde) {
      cargar(h, CARGA.atacar);
      return besar(h, ataque, [e]);
    }
    if (ataque.paraliza) {
      cargar(h, CARGA.atacar);
      void animar(h.id, 'ataque', 750);
      playChip('paralisis');
      luz(e.id, '#a64dff', true);
      await espera(800);
      return paralizar(e);
    }
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
    if (falla(d, h, e)) {
      numero(e.id, 'MISS', 'falla');
      void animar(e.id, 'salto', 600);
      playChip('cambio');
      await espera(450);
      if (!deLejos) await deslizar(h.id, null);
      return decir(fmt(t('batalla.esquiva_rival'), { quien: e.nombre }));
    }
    bajoEspecial.current.add(e.id);
    const { n, critico, bloqueado } = await golpear(h, e, ataque.poder);
    await espera(450);
    if (!deLejos) await deslizar(h.id, null);
    soltar([e]);
    await decir(fmt(t(bloqueado ? 'batalla.protegido_bloquea' : critico ? 'batalla.critico' : 'batalla.ataca'), { objetivo: e.nombre, quien: e.nombre, n }));
    // El efecto extra sobre el blanco (la botella rota envenena).
    if (ataque.aplica?.veneno && vivo(e) && !bloqueado) {
      usarObjeto(ataque.aplica as unknown as Objeto, e);
      luz(e.id, '#a07bff', true);
      forzar();
      await decir(fmt(t('batalla.envenena'), { quien: e.nombre }));
    }
    if (!vivo(e)) await alCaer(e);
  };

  /**
   * Un especial: el aviso y, durante 5 segundos (ESPECIAL_MS), su animación (la fila «especial» de su hoja, o su
   * ataque una y otra vez) junto a su objetivo o en el medio de la pantalla. Los golpes se reparten a lo largo de
   * esos 5 segundos entre los objetivos; los de un enemigo se pueden esquivar golpe a golpe. Cami dispara balas
   * desde sus pistolas en cada destello.
   */
  /** La Mega Bola Tóxica en la pantalla: dónde está, qué tan grande y qué hace (crece, vuela o explota). */
  const [bolaT, setBolaT] = useState<{ key: number; x: number; y: number; lado: number; anim: 'aparecer' | 'idle' | 'explotar'; ms: number } | null>(null);
  const [tiembla, setTiembla] = useState(0);
  /** La pausa (el menú de ☰ y lo que se abre desde ahí). */
  const [pausa, setPausa] = useState<null | 'menu' | 'equipo' | 'opciones' | 'salir'>(null);
  /** El escenario morado mientras Nikki carga la bola, y la onda de luz del impacto. */
  const [tinte, setTinte] = useState(false);
  const [onda, setOnda] = useState<{ key: number; x: number; y: number } | null>(null);
  const [energias, setEnergias] = useState<{ x: number; y: number; lejos: number } | null>(null);
  /**
   * La Mega Bola Tóxica (Nikki): el aviso, el aura (levanta la mano), la bola aparece en la palma y crece de más; al
   * bajar la mano sale disparada, explota sobre los rivales con un fogonazo y un temblor, les pega a todos y los
   * envenena a todos (también a sus aliados, salpicados; a ella no). Con `traidor` (le pidieron perdón y la atacaron):
   * a ese lo deja con pocos PS y un veneno leve.
   */
  const megaBola = async (e: Luchador, traidor?: Luchador) => {
    const bt = d.enemigos[e.clave].bola_toxica!;
    e.carga = 0;
    forzar();
    await avisar({ nombre: bt.nombre, color: bt.color, ojos: bt.ojos, texto: bt.texto, poder: bt.poder, golpes: 1, objetivo: 'todos', posicion: 'objetivo' }, d.enemigos[e.clave].sprite, e.lado === 'heroe');
    await decir(fmt(traidor ? bt.traicion!.texto : bt.texto, { quien: e.nombre, objetivo: traidor?.nombre ?? '' }));
    const hoja = (await cargarHoja(d.enemigos[e.clave].sprite)) as Hoja & { bola?: { aparece: number; suelta: number; x: number; y: number } };
    const fila = hoja.animations.aura;
    const info = hoja.bola;
    if (!fila || !info) return;
    const msPaso = 1000 / fila.fps;
    playChip('carga');
    // Mientras carga, el escenario se va poniendo morado y le llegan energías desde afuera.
    setTinte(true);
    {
      const c = centroDe(e);
      const r = raiz.current?.getBoundingClientRect();
      if (c && r) setEnergias({ x: c.x, y: c.y, lejos: Math.hypot(r.width, r.height) * 0.7 });
    }
    void animar(e.id, 'aura' as Anim, fila.frames * msPaso);
    // En la palma: aparece chica y crece de más hasta poco antes de bajar la mano.
    await espera(info.aparece * msPaso);
    const s = rectSprite(figuras.current.get(e.id)?.querySelector('.batalla-sprite'));
    const base = raiz.current?.getBoundingClientRect();
    if (!s || !base) return;
    const k = s.width / hoja.frameWidth;
    const espejo = e.lado === 'heroe';
    const mano = { x: (espejo ? s.right - info.x * k : s.left + info.x * k) - base.left, y: s.top + info.y * k - base.top };
    const crece = (info.suelta - info.aparece - 6) * msPaso;
    const grande = base.height * 0.85;
    setBolaT({ key: Math.random(), x: mano.x, y: mano.y - 20 * k, lado: 14 * k, anim: 'aparecer', ms: 0 });
    await espera(80);
    setBolaT((x) => x && { ...x, lado: grande, y: mano.y - grande * 0.5, anim: 'idle', ms: crece });
    playChip('vortice');
    await espera(info.suelta * msPaso - info.aparece * msPaso - 80);
    // Baja la mano: sale disparada al centro de los rivales y explota.
    const rivales = e.lado === 'enemigo' ? b.current.heroes.filter(enCampo) : b.current.enemigos.filter(vivo);
    const centros = rivales.map(centroDe).filter(Boolean) as { x: number; y: number }[];
    const destino = centros.length
      ? { x: centros.reduce((n, c) => n + c.x, 0) / centros.length, y: centros.reduce((n, c) => n + c.y, 0) / centros.length }
      : { x: base.width * (espejo ? 0.25 : 0.75), y: base.height * 0.55 };
    setBolaT((x) => x && { ...x, x: destino.x, y: destino.y, ms: 320 });
    await espera(320);
    playChip('impacto');
    setBolaT((x) => x && { ...x, anim: 'explotar', lado: grande * 1.7, ms: 200 });
    // El impacto: un destello blanco, una onda de luz morada que se abre desde la explosión y el temblor.
    setFogonazo({ key: Math.random(), color: '#ffffff' });
    setOnda({ key: Math.random(), x: destino.x, y: destino.y });
    setTiembla(Math.random());
    setEnergias(null);
    // A todos sus rivales: el golpe y el veneno.
    for (const x of rivales) {
      bajoEspecial.current.add(x.id);
      if (traidor && x === traidor) {
        const antes = x.ps;
        x.ps = Math.min(x.ps, bt.traicion!.ps);
        numero(x.id, `-${antes - x.ps}`, 'critico');
        void animar(x.id, 'golpeado');
        luz(x.id, bt.color, true);
        // En esta pelea el veneno no lo mata: lo deja en 1 y el remate es de Nikki.
        x.envenenado = { danio: bt.traicion!.veneno, turnos: 9, noMata: true };
        b.current.remate = x.id;
      } else {
        await golpear(e, x, bt.poder, bt.color, x.esquivando);
        // Al que eligió esquivar, el veneno le dura un turno menos.
        envenenarConBola(x, bt.veneno, x.esquivando);
      }
    }
    // Salpica a los suyos (no a ella).
    for (const x of (e.lado === 'enemigo' ? b.current.enemigos : b.current.heroes).filter((y) => vivo(y) && y !== e && !y.cebo)) {
      if (!x.envenenado) x.envenenado = { ...bt.veneno };
      luz(x.id, bt.color);
    }
    // Los golpeados quedan tirados y después se levantan.
    for (const x of rivales) if (vivo(x)) void animar(x.id, 'ko');
    forzar();
    await espera(900);
    setBolaT(null);
    setTinte(false);
    await espera(700);
    for (const x of rivales) {
      if (!vivo(x)) continue;
      bajoEspecial.current.delete(x.id);
      setAnims((m) => ({ ...m, [x.id]: 'idle' }));
      efecto(x.id, 'se-levanta', 800);
    }
    playChip('salto');
    await espera(500);
    setOnda(null);
    await decir(fmt(t('batalla.bola_envenena'), { quien: e.nombre }));
    await limpiarCebos();
    for (const x of rivales) if (!vivo(x) && !x.cebo) await decir(fmt(t('batalla.cae'), { quien: x.nombre }));
  };
  /** El rayo del especial del Capitán que sigue más allá de su cuadro, hasta el borde de la pantalla. */
  const [rayoSigue, setRayoSigue] = useState<{ id: string; x: number; y: number; largo: number; ang: number; grosor: number } | null>(null);
  /** El rayo grueso del cañón (de dónde a dónde, y de qué color). */
  const [rayo, setRayo] = useState<{ key: number; x: number; y: number; largo: number; ang: number; color: string } | null>(null);
  /**
   * El cañón del Capitán: el aviso, el blaster que carga (brilla cada vez más) y un solo rayo grueso contra su
   * objetivo, que se puede esquivar.
   */
  const canonazo = async (l: Luchador, e: Especial, blanco: Luchador) => {
    l.carga = 0;
    forzar();
    await avisar(e, d.enemigos[l.clave].sprite, false);
    await decir(fmt(e.texto, { quien: l.nombre, objetivo: blanco.nombre }));
    const hoja = (await cargarHoja(d.enemigos[l.clave].sprite)) as Hoja;
    const fila = 'animations' in hoja ? hoja.animations.especial : undefined;
    if (fila?.seq && hoja.rayo) return canonConHoja(l, e, blanco, hoja, fila as Required<typeof fila>);
    playChip('carga');
    efecto(l.id, 'carga-canon', 1500);
    for (let i = 0; i < 4; i++) {
      luz(l.id, e.color, i === 3);
      await espera(340);
    }
    const o = centroDe(l);
    const c = centroDe(blanco);
    if (o && c) {
      const x = o.x + Math.sign(c.x - o.x) * 40;
      const y = o.y - 12;
      setRayo({ key: Math.random(), x, y, largo: Math.hypot(c.x - x, c.y - y) + 80, ang: Math.atan2(c.y - y, c.x - x), color: e.color });
    }
    playChip('impacto');
    setFogonazo({ key: Math.random(), color: e.color });
    await espera(250);
    // Los especiales no se esquivan: al que eligió esquivar le hacen la mitad.
    bajoEspecial.current.add(blanco.id);
    const { n, bloqueado } = await golpear(l, blanco, e.poder, e.color, blanco.esquivando);
    await espera(450);
    setRayo(null);
    soltar([blanco]);
    await decir(fmt(t(bloqueado ? 'batalla.protegido_bloquea' : 'batalla.recibe'), { quien: blanco.nombre, n }));
    await limpiarCebos();
    if (!vivo(blanco) && !blanco.cebo) await decir(fmt(t('batalla.cae'), { quien: blanco.nombre }));
  };
  /**
   * El especial del Capitán con su hoja: carga, el rayo horizontal sale hasta el infinito (golpea a su blanco) y
   * después se vuelve loco y lo agita arriba y abajo (cada vez que el rayo barre, le puede dar a cualquiera).
   */
  const canonConHoja = async (l: Luchador, e: Especial, blanco: Luchador, hoja: Hoja, fila: Required<Hoja['animations'][string]>) => {
    const msPaso = 1000 / fila.fps;
    const total = fila.seq.length * msPaso;
    // Cuándo golpea: el primer rayo horizontal (fuerte, a su blanco) y cada barrido arriba o abajo (a cualquiera).
    const golpes = golpesDelCanon(fila.seq, hoja.rayo ?? {}, msPaso);
    playChip('carga');
    void animar(l.id, 'especial', total);
    const desde = Date.now();
    for (const g of golpes) {
      await espera(Math.max(0, g.ms - (Date.now() - desde)));
      const x = blancoDelCanon(b.current.heroes, blanco, g.fuerte);
      if (!x) break;
      playChip(g.fuerte ? 'impacto' : 'disparo');
      if (g.fuerte) setFogonazo({ key: Math.random(), color: e.color });
      bajoEspecial.current.add(x.id);
      await golpear(l, x, g.fuerte ? e.poder : poderBarrido(e.poder), e.color, x.esquivando);
    }
    await espera(Math.max(0, total - (Date.now() - desde)));
    setRayoSigue(null);
    soltar(b.current.heroes);
    await limpiarCebos();
    for (const h of b.current.heroes) if (!vivo(h) && retenidos.current.has(h.id)) await decir(fmt(t('batalla.cae'), { quien: h.nombre }));
  };
  /**
   * La ráfaga del Capitán: entre `balas[0]` y `balas[1]` balas rojas, una por fogonazo de su ataque (repite la
   * animación si son más), cada una hacia uno de sus blancos. Cada bala puede fallar o esquivarse.
   */
  const rafaga = async (e: Luchador, a: Ataque, blancos: Luchador[], hoja: Hoja) => {
    const fila = hoja.animations.ataque;
    const fogonazos = Object.keys(hoja.disparos!.ataque).map(Number).sort((x, y) => x - y);
    const [min, max] = a.balas!;
    const n = min + Math.floor(Math.random() * (max - min + 1));
    const color = d.enemigos[e.clave].color_disparo ?? '#ff3b3b';
    const dura = (fila.frames * 1000) / fila.fps;
    for (let k = 0; k < n; k++) {
      const f = fogonazos[k % fogonazos.length];
      if (k % fogonazos.length === 0) {
        void animar(e.id, 'ataque', dura);
        await espera((f * 1000) / fila.fps);
      } else await espera(((f - fogonazos[(k % fogonazos.length) - 1]) * 1000) / fila.fps);
      const h = blancos[k % blancos.length];
      if (!vivo(h)) continue;
      const o = enPantalla(e, hoja, hoja.disparos!.ataque[String(f)][0]);
      const c = centroDe(h);
      playChip('disparo');
      const ms = o && c ? nuevaBala(o.x, o.y, c.x, c.y, 1800, color, false) : 0;
      setTimeout(async () => {
        if (!vivo(h)) return;
        if (falla(d, e, h) || esquiva(d, h, e)) {
          numero(h.id, 'MISS', 'falla');
          return;
        }
        luz(h.id, color);
        bajoEspecial.current.add(h.id);
        await golpear(e, h, a.poder, color);
      }, ms);
    }
    await espera(700);
    soltar(blancos);
    await limpiarCebos();
    for (const h of blancos) {
      if (vivo(h) || h.cebo) continue;
      await decir(fmt(t('batalla.cae'), { quien: h.nombre }));
    }
  };
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
          const base = raiz.current?.getBoundingClientRect();
          const alto = (base?.height ?? 600) * 0.3;
          for (const x of levantados) {
            if (!vivo(x)) continue;
            enElAire.current.add(x.id);
            // No más alto que el borde de arriba de la pantalla (el de atrás ya está más arriba en el piso).
            const r = rectSprite(figuras.current.get(x.id)?.querySelector('.batalla-sprite'));
            const cabe = r && base ? Math.max(0, r.top - base.top - 12) : alto;
            setAire((m) => ({ ...m, [x.id]: Math.min(alto, cabe) }));
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
    const golpes = golpesEspecial(e, blancos, l.lado === 'enemigo' ? b.current.heroes.length : blancos.length);
    // Los golpes se reparten en los 5 segundos o, con viaje, mientras aterriza junto a su objetivo.
    const ventana = viaje ? (viaje.golpe[1] - viaje.golpe[0]) * msPaso : ESPECIAL_MS;
    const paso = ventana / (golpes.length + (viaje ? 0 : 1));
    if (viaje) await espera(viaje.golpe[0] * msPaso - paso);
    let total = 0;
    for (const b of golpes) {
      await espera(paso);
      if (!vivo(b)) continue;
      playChip(hoja.disparos?.especial ? 'disparo' : sonidoDe(l));
      // No se esquiva: al que eligió esquivar le hace la mitad (salta y vuelve a la pose de golpeado).
      const aMedias = b.esquivando;
      if (aMedias) setTimeout(() => bajoEspecial.current.has(b.id) && vivo(b) && void animar(b.id, 'golpeado'), 500);
      const { n } = await golpear(l, b, e.poder, e.color, aMedias);
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
    // La Espada de las estaciones: a cada uno que sigue en pie le cae una estación al azar.
    if (e.estaciones) {
      for (const x of [...new Set(blancos)].filter(enCampo)) {
        const estacion = estacionAlAzar();
        const ok = aplicarEstacion(b.current, x, estacion);
        luz(x.id, ok ? '#c8f7c5' : '#ffffff', ok);
        forzar();
        await decir(fmt(t(ok ? `batalla.estacion_${estacion}` : 'batalla.estacion_nada'), { quien: x.nombre }));
      }
    }
    // La Tajada del abismo: la grieta se traga a un rival al azar (nunca al último en pie).
    if (e.destierro) {
      const candidatos = (l.lado === 'enemigo' ? b.current.heroes : b.current.enemigos).filter(enCampo);
      const x = candidatos[Math.floor(Math.random() * candidatos.length)];
      const n = x ? desterrar(b.current, x, e.destierro) : 0;
      playChip('vortice');
      forzar();
      await decir(n ? fmt(t('batalla.destierro'), { quien: x!.nombre, n }) : t('batalla.destierro_no'));
    }
    // Algunos especiales a veces queman (Jair: puños de fuego sin querer).
    for (const x of quemarConEspecial(b.current, e, blancos)) {
      luz(x.id, '#ff8a3c');
      forzar();
      await decir(fmt(t('batalla.especial_quema'), { quien: x.nombre }));
    }
    for (const b of blancos) {
      if (vivo(b) || b.cebo) continue;
      if (b.lado === 'enemigo') await alCaer(b);
      else await decir(fmt(t('batalla.cae'), { quien: b.nombre }));
    }
  };

  /** El turno de un enemigo: lo que decide (engine/turnos.ts, `decidirEnemigo`) y cómo se ve. */
  const actuarEnemigo = async (e: Luchador) => {
    const decision = decidirEnemigo(b.current, d, e, !!arena);
    if (decision.tipo === 'paralizado') return decir(fmt(t('batalla.sigue_paralizado'), { quien: e.nombre }));
    if (decision.tipo === 'congelado') return decir(fmt(t('batalla.sigue_congelado'), { quien: e.nombre }));
    if (decision.tipo === 'dormido') return decir(fmt(t('batalla.sigue_dormido'), { quien: e.nombre }));
    if (decision.tipo === 'confundido') {
      await decir(fmt(t('batalla.se_golpea'), { quien: e.nombre }));
      void animar(e.id, 'ataque', 600);
      playChip(sonidoDe(e));
      await espera(300);
      const { n } = await golpear(e, e, CONFUSION.poder);
      await decir(fmt(t('batalla.recibe'), { quien: e.nombre, n }));
      if (!vivo(e)) await alCaer(e);
      return;
    }
    if (decision.tipo === 'distraido') return decir(fmt(t('batalla.distraido'), { quien: e.nombre }));
    const hs = b.current.heroes.filter(enCampo);
    // Después de la Mega Bola de la traición: la cachetada que remata, que no falla aunque esquive.
    if (decision.tipo === 'remate') {
      const { blanco: rematado, golpe } = decision;
      await decir(fmt(golpe.texto, { quien: e.nombre, objetivo: rematado.nombre }));
      await deslizar(e.id, rematado.id);
      void animar(e.id, 'ataque', 800);
      playChip(sonidoDe(e));
      await espera(380);
      bajoEspecial.current.add(rematado.id);
      const { n } = await golpear(e, rematado, Math.max(golpe.poder, rematado.ps * 50));
      await deslizar(e.id, null);
      soltar([rematado]);
      await decir(fmt(t('batalla.recibe'), { quien: rematado.nombre, n }));
      if (!vivo(rematado)) await decir(fmt(t('batalla.cae'), { quien: rematado.nombre }));
      return;
    }
    // La Mega Bola (contra el traidor, si lo hay; en la arena sale al azar).
    if (decision.tipo === 'bola') return megaBola(e, decision.traidor);
    if (decision.tipo === 'clon') return clonar(e);
    if (decision.tipo === 'especial') {
      const { especial: esp, blanco } = decision;
      if (esp.canon) await canonazo(e, esp, blanco);
      else await usarEspecial(e, esp, d.enemigos[e.clave].sprite, hs, blanco);
      return limpiarCebos();
    }
    if (decision.tipo === 'nada') return;
    const { ataque: a, blancos } = decision;
    await decir(fmt(a.texto, { quien: e.nombre, objetivo: blancos.map((x) => x.nombre).join(' y ') }));
    if (a.confunde) return besar(e, a, blancos);
    if (a.paraliza) {
      setOscuro(true);
      playChip('paralisis');
      blancos.forEach((h) => luz(h.id, '#a64dff', true));
      await espera(1000);
      setOscuro(false);
      for (const h of blancos) {
        if (esquiva(d, h, e)) {
          numero(h.id, 'MISS', 'falla');
          void animar(h.id, 'salto', 600);
          await lineas('esquiva_ok', { quien: h.nombre });
          continue;
        }
        await paralizar(h);
      }
      return;
    }
    const hoja = (await cargarHoja(d.enemigos[e.clave].sprite)) as Hoja;
    if (a.balas && 'animations' in hoja && hoja.disparos?.ataque) return rafaga(e, a, blancos, hoja);
    const proy = 'animations' in hoja ? hoja.proyectil : undefined;
    // De lejos (la sombra): se queda en su lugar y la media luna sale volando, pasa por cada blanco y se va.
    let llegadas: number[] | null = null;
    const desde = Date.now();
    const deLejos = !!d.enemigos[e.clave].distancia;
    if (proy) {
      const fila = hoja.animations.ataque;
      void animar(e.id, 'ataque', (fila.frames * 1000) / fila.fps);
      await espera((proy.cuadro * 1000) / fila.fps);
      llegadas = blancos.map((h, i) => lanzar(e, hoja, proy, h, i * (a.rafagas ? 260 : 160)));
    } else if (deLejos) {
      void animar(e.id, 'ataque', 800);
      llegadas = blancos.map((h, i) => {
        const o = centroDe(e);
        const c = centroDe(h);
        if (!o || !c) return i * 160;
        const x = o.x + Math.sign(c.x - o.x) * 40;
        const y = o.y - 12;
        setTimeout(() => {
          playChip('disparo');
          nuevaBala(x, y, c.x, c.y, 1600, d.enemigos[e.clave].color_disparo ?? '#ff3b3b', false);
        }, i * 160);
        return i * 160 + (Math.hypot(c.x - x, c.y - y) / 1600) * 1000;
      });
    } else {
      if (blancos.length === 1) await deslizar(e.id, blancos[0].id);
      void animar(e.id, 'ataque', 800);
      await espera(380);
    }
    for (const [i, h] of blancos.entries()) {
      if (llegadas) await espera(Math.max(0, llegadas[i] - (Date.now() - desde) + (proy ? ((proy.cuadro * 1000) / hoja.animations.ataque.fps) : 0)));
      if (deLejos) luz(h.id, d.enemigos[e.clave].color_disparo ?? '#ff3b3b');
      // A veces el golpe falla solo.
      if (falla(d, e, h)) {
        numero(h.id, 'MISS', 'falla');
        playChip('cambio');
        await decir(fmt(t('batalla.falla'), { quien: e.nombre }));
        continue;
      }
      // Esquivar: a veces funciona.
      if (esquiva(d, h, e)) {
        numero(h.id, 'MISS', 'falla');
        void animar(h.id, 'salto', 600);
        playChip('cambio');
        await lineas('esquiva_ok', { quien: h.nombre });
        continue;
      }
      if (!proy && !deLejos) playChip(sonidoDe(e));
      bajoEspecial.current.add(h.id);
      const { n, bloqueado } = await golpear(e, h, a.poder);
      if (blancos.length === 1) await decir(fmt(t(bloqueado ? 'batalla.protegido_bloquea' : 'batalla.recibe'), { quien: h.nombre, n }));
    }
    if (blancos.length === 1 && !proy && !deLejos) await deslizar(e.id, null);
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
  // Lo equipado (docs/BIBLIA_RPG.md, sección 18): hasta 3 ataques y 2 especiales; los especiales comparten la barra y,
  // cuando está llena, se elige cuál.
  const equipo = heroe ? equipados(d.personajes[heroe.clave], heroe.nivel, progreso?.equipo?.[heroe.clave], sueltosQueTengo(progreso?.cassettes), progreso?.especialesGanados) : undefined;
  const ataques = equipo?.ataques ?? [];
  const especiales = equipo?.especiales ?? [];
  const comandos = [t('batalla.atacar'), t('batalla.hablar'), t('batalla.esquivar'), t('batalla.objetos'), t('batalla.huir')];
  const enMochila = Object.keys(d.objetos).filter((k) => (b.current.mochila[k] ?? 0) > 0 && usableEnPelea(d.objetos[k]));
  // A los desterrados no se los puede elegir (tampoco para darles un objeto).
  const vivosDe = (lado: 'enemigo' | 'heroe') => (lado === 'enemigo' ? b.current.enemigos.filter(vivo) : b.current.heroes.filter(enCampo));
  /** A quiénes se puede elegir: los de pie o, para revivir, los caídos. */
  const candidatos = () =>
    menu.paso === 'objetivo' ? (menu.caidos ? b.current.heroes.filter((x) => !vivo(x)) : vivosDe(menu.lado)) : [];
  const base = (): number =>
    menu.paso === 'comando' ? comandos.length : menu.paso === 'ataque' ? ataques.length + especiales.length : menu.paso === 'objeto' ? enMochila.length : candidatos().length;
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
        return setMensaje({ texto: t(d.vida_real ? 'batalla.mochila_vida_real' : 'batalla.mochila_vacia'), n: Math.random() });
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
      const especial = especiales[i - ataques.length];
      if (i >= ataques.length && especial) {
        const cual = i - ataques.length;
        if (!especialListo(heroe)) {
          playChip('vacio');
          return setMensaje({ texto: fmt(t('batalla.especial_no'), { n: Math.floor(heroe.carga) }), n: Math.random() });
        }
        if (especial.bomba && b.current.bomba) {
          playChip('vacio');
          return setMensaje({ texto: t('batalla.bomba_ya'), n: Math.random() });
        }
        // A todos: no hace falta elegir.
        if (especial.objetivo === 'todos') return listo({ tipo: 'especial', objetivo: vivosDe('enemigo')[0]?.id ?? '', cual });
        return setMenu({ paso: 'objetivo', i: 0, lado: 'enemigo', luego: (o) => ({ tipo: 'especial', objetivo: o, cual }) });
      }
      if (ataques[i] && quedan(heroe, ataques[i]) <= 0) {
        playChip('vacio');
        return setMensaje({ texto: fmt(t('batalla.sin_usos'), { quien: heroe.nombre, ataque: ataques[i].nombre }), n: Math.random() });
      }
      if (ataques[i]?.cura || ataques[i]?.alMismo) return listo({ tipo: 'atacar', ataque: i, objetivo: heroe.id });
      // A todos: no hace falta elegir.
      if (ataques[i]?.objetivo === 'todos') return listo({ tipo: 'atacar', ataque: i, objetivo: vivosDe('enemigo')[0]?.id ?? '' });
      if (ataques[i]?.cebo) {
        // Uno a la vez: con un cebo en pie, no se puede poner otro.
        if (tieneCebo(heroe)) {
          playChip('vacio');
          return setMensaje({ texto: t('batalla.cebo_ya'), n: Math.random() });
        }
        return listo({ tipo: 'atacar', ataque: i, objetivo: '' });
      }
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
      if (!k) return;
      const destino = objetivoDe(d.objetos[k]);
      if (destino === 'yo' || destino === 'equipo' || destino === 'rivales') return listo({ tipo: 'objeto', clave: k, objetivo: heroe.id });
      if (destino === 'rival') return setMenu({ paso: 'objetivo', i: 0, lado: 'enemigo', luego: (o) => ({ tipo: 'objeto', clave: k, objetivo: o }) });
      setMenu({ paso: 'objetivo', i: Math.max(0, vivosDe('heroe').indexOf(heroe)), lado: 'heroe', luego: (o) => ({ tipo: 'objeto', clave: k, objetivo: o }) });
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
      // En pausa, las teclas son de lo que está abierto (el menú, el equipo, las opciones y lo que se escribe ahí).
      if (pausa) return;
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
  /** Lo que se ve en «Esquivar»: la probabilidad del héroe de turno contra el rival de más nivel. */
  const pEsquiva = () => {
    const rival = b.current.enemigos.filter(vivo).sort((x, y) => y.nivel - x.nivel)[0];
    return heroe && rival ? probEsquiva(d, heroe, rival) : d.esquivar;
  };
  const COMANDOS_DESC = ['atacar', 'hablar', 'esquivar', 'objetos', 'huir'];
  const descComando = (k: string) =>
    d.descripciones?.[k] ?? fmt(t(k === 'huir' && !d.huir ? 'batalla.desc.huir_no' : `batalla.desc.${k}`), { p: Math.round(pEsquiva() * 100) });
  /** Daño aproximado de un golpe contra el primer rival de pie (sin el azar). */
  const aprox = (poder: number) => {
    const r = vivosDe('enemigo')[0];
    return heroe && r ? Math.max(1, Math.round(((heroe.atq + heroe.extra) * poder) / 10 - (r.def + r.extraDef) / 2)) : poder;
  };
  const descObjeto = (o: Objeto) =>
    [
      o.niveles && fmt(t('batalla.desc.obj_niveles'), { n: o.niveles }),
      o.revive && fmt(t('batalla.desc.obj_revive'), { n: Math.round(o.revive * 100) }),
      o.veneno && fmt(t('batalla.desc.obj_veneno'), { n: o.veneno.danio, t: o.veneno.turnos }),
      o.protege && fmt(t('batalla.desc.obj_protege'), { n: o.protege }),
      o.confunde && fmt(t('batalla.desc.obj_confunde'), { n: o.confunde }),
      o.paraliza && fmt(t('batalla.desc.obj_paraliza'), { n: o.paraliza }),
      o.cura_estados && t('batalla.desc.obj_cura_estados'),
      t(`batalla.desc.a_${objetivoDe(o)}`),
      o.ps && fmt(t('batalla.desc.obj_ps'), { n: o.ps }),
      o.cura_toda && t('batalla.desc.obj_cura_toda'),
      o.confunde_al_comer && fmt(t('batalla.desc.obj_confunde_al_comer'), { n: o.confunde_al_comer }),
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
              // Los usos que le quedan (5/5); sin límite, su poder.
              extra: a.usos !== undefined ? `${quedan(heroe!, a)}/${a.usos}` : `${a.poder}`,
              clase: (a.cebo && tieneCebo(heroe!)) || quedan(heroe!, a) <= 0 ? 'especial' : '',
              desc:
                (a.cebo
                  ? t('batalla.desc.cebo')
                  : a.cura
                    ? fmt(t('batalla.desc.cura'), { n: Math.round(a.cura * 100) })
                    : a.alMismo && a.aplica
                      ? a.aplica.protege
                        ? t('batalla.desc.se_protege')
                        : fmt(t('batalla.desc.se_potencia'), { n: a.aplica.atq ?? a.aplica.def ?? 0 })
                      : a.paraliza
                        ? fmt(t('batalla.desc.paraliza'), { n: a.paraliza })
                        : a.confunde
                          ? fmt(t('batalla.desc.confunde'), { n: a.confunde })
                          : fmt(t('batalla.desc.ataque'), { poder: a.poder, n: aprox(a.poder), a: t(a.objetivo === 'todos' ? 'batalla.desc.a_todos' : 'batalla.desc.a_uno') }) +
                            (a.aplica?.veneno ? ' ' + fmt(t('batalla.desc.envenena'), { n: a.aplica.veneno.turnos }) : '')) +
                (a.usos !== undefined ? ' ' + fmt(t('batalla.desc.usos'), { q: quedan(heroe!, a), u: a.usos }) : ''),
            })),
            ...(heroe
              ? especiales.map((especial) => ({
                    texto: `★ ${especial.nombre}`,
                    extra: especialListo(heroe) ? t('batalla.especial_listo') : `${Math.floor(heroe.carga)}%`,
                    clase: especialListo(heroe) ? 'especial listo' : 'especial',
                    desc: fmt(t(especial.multicebo ? 'batalla.desc.multicebo' : 'batalla.desc.especial'), {
                      poder: especial.poder,
                      golpes: especial.golpes,
                      n: aprox(especial.poder) * especial.golpes,
                      a: t(especial.objetivo === 'todos' ? 'batalla.desc.a_todos' : 'batalla.desc.a_uno'),
                      estado: especialListo(heroe) ? t('batalla.desc.especial_listo') : fmt(t('batalla.desc.especial_carga'), { n: Math.floor(heroe.carga) }),
                    }),
                  }))
              : []),
          ]
        : menu.paso === 'objeto'
          ? enMochila.map((k) => ({ texto: d.objetos[k].nombre, extra: `×${b.current.mochila[k]}`, desc: descObjeto(d.objetos[k]), icono: d.objetos[k].icono }))
          : candidatos().map((l) => ({
              texto: l.nombre,
              extra: menu.lado === 'enemigo' ? `${t('batalla.nivel')} ${l.nivel}` : `${l.ps} HP`,
              desc: fmt(t('batalla.desc.objetivo'), { nivel: l.nivel, ps: l.ps, max: l.psMax, atq: l.atq + l.extra, def: l.def + l.extraDef, vel: l.vel }),
            }));
  if (conVolver) lista.push({ texto: `◀ ${t('batalla.volver')}`, extra: '', clase: 'volver', desc: t('batalla.desc.volver') });
  /**
   * «Descansa» en la tarjeta: solo mientras se la ve agachada (el sprite de descanso), igual que la figura (si está
   * paralizada, se la ve paralizada).
   */
  const descansa = (h: Luchador) => vivo(h) && !h.paralizado && b.current.cansados.has(h.id) && !!d.personajes[h.clave].descanso;
  const habla = mensaje?.quien;
  const colorDe = (clave: string) => d.personajes[clave]?.especial?.color ?? '#e8e2d4';
  const texto = mensaje ? mensaje.texto.slice(0, letras) : '';

  return (
    <PausaContexto.Provider value={!!pausa}>
    <div
      data-tiembla={tiembla || undefined}
      className={`batalla ${pausa ? 'pausada' : ''} n${b.current.heroes.length} e${Math.min(3, b.current.enemigos.length)} ${oscuro ? 'oscuro' : ''} ${saliendo ? 'saliendo' : ''}`}
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
            {/* El cielo, más vivo: la nebulosa respira y las estrellas titilan (solo donde se ve el cielo). */}
            {(FONDOS[d.fondo]?.nebulosas ?? []).map(([x, y, r], i) => (
              <span key={`n${i}`} className="batalla-nebulosa" style={{ left: `${x}%`, top: `${y}%`, width: `${r * 2}%`, animationDelay: `${i * -2.3}s` } as CSSProperties} />
            ))}
            {/* Las luces del lugar (focos, velas, reflectores): un resplandor que late suave, cada una a su ritmo. */}
            {(FONDOS[d.fondo]?.luces ?? []).map(([x, y, r, tono], i) => (
              <span
                key={`l${i}`}
                className={`batalla-luz ${tono ?? 'calida'}`}
                style={{ left: `${x}%`, top: `${y}%`, width: `${r * 2}%`, animationDelay: `${((i * 41) % 29) / -7}s`, animationDuration: `${2.6 + ((i * 17) % 11) / 5}s` } as CSSProperties}
              />
            ))}
            {(FONDOS[d.fondo]?.brillos ?? []).map(([x, y], i) => (
              <span
                key={`b${i}`}
                className={`batalla-brillo ${i % 4 === 0 ? 'grande' : ''}`}
                style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${((i * 37) % 23) / -5}s`, animationDuration: `${2.2 + ((i * 13) % 9) / 4}s` } as CSSProperties}
              />
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
      <div className={`batalla-escena ${casillas ? 'con-casillas' : ''}`}>
        <CajaCasillas casillas={casillas} r={d.fondo_proporcion ?? 16 / 9}>
        <div className="batalla-lado enemigos">
          {b.current.enemigos.map((e) => {
            const origen = e.clon !== undefined ? b.current.enemigos.find((x) => x.clave === e.clave && x.clon === undefined) : undefined;
            return enCasilla('rivales', origen ? casillaRival(origen) : casillaRival(e), e.id,
            <Figura
              key={e.id}
              l={e}
              caido={e.ps === 0 && !retenidos.current.has(e.id)}
              refFigura={(el) => (el ? figuras.current.set(e.id, el) : figuras.current.delete(e.id))}
              sprite={d.enemigos[e.clave].sprite}
              filtro={d.enemigos[e.clave].filtro}
              escala={(d.enemigos[e.clave].escala ?? 1) * (e.clon !== undefined ? CLON_ESCALA : 1)}
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
            />,
            origen ? CLON_CORRIDO : undefined);
          })}
        </div>
        <div className={`batalla-lado heroes n${b.current.heroes.length}`}>
          {b.current.heroes.map((h, i) => enCasilla('equipo', i, h.id,
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
            />,
          ))}
          {/* La bomba del día del juicio: la cuenta regresiva en medio del campo (provisional, sin arte). */}
          {b.current.bomba && <div className="batalla-bomba">💣 {b.current.bomba.turnos}</div>}
          {/* Los cebos: copias en blanco y negro, delante de su héroe (no mueven a nadie). */}
          {b.current.cebos.map((c) => (
            <div key={c.l.id} className={`batalla-cebo ${c.l.ceboEfecto ? `efecto-${c.l.ceboEfecto}` : ''}`} style={{ left: c.x, top: c.y }}>
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
        </CajaCasillas>
      </div>
      {versus && <Versus d={d} />}
      {/* La pausa: seguir, mirar el equipo (sin cambiarlo), las opciones o salir al título. */}
      <button type="button" className="batalla-pausa-btn" disabled={!enMenu} title={enMenu ? undefined : t('batalla.pausa_espera')} onClick={() => setPausa('menu')} aria-label={t('batalla.pausa')}>
        ☰
      </button>
      {pausa === 'menu' && (
        <div className="batalla-pausa" role="dialog" aria-label={t('batalla.pausa')}>
          <div className="batalla-pausa-caja">
            <b>{t('batalla.pausa')}</b>
            <button type="button" onClick={() => setPausa(null)}>{t('batalla.pausa_seguir')}</button>
            <button type="button" onClick={() => setPausa('equipo')}>{t('equipo.titulo')}</button>
            <button type="button" onClick={() => setPausa('opciones')}>{t('titulo.opciones')}</button>
            {onSalir && (
              <button type="button" className="peligro" onClick={() => setPausa('salir')}>
                {t('batalla.pausa_salir')}
              </button>
            )}
          </div>
        </div>
      )}
      {pausa === 'salir' && (
        <div className="batalla-pausa" role="dialog">
          <div className="batalla-pausa-caja">
            <p>{t('batalla.pausa_aviso')}</p>
            <button type="button" className="peligro" onClick={() => onSalir?.()}>{t('batalla.pausa_salir')}</button>
            <button type="button" onClick={() => setPausa('menu')}>{t('batalla.pausa_volver')}</button>
          </div>
        </div>
      )}
      {(pausa === 'equipo' || pausa === 'opciones') && (
        <div className="batalla-pausa-capa">
          {pausa === 'equipo' ? <EquipoPanel soloVer grupo={d.heroes} onClose={() => setPausa('menu')} /> : <OptionsPanel onClose={() => setPausa('menu')} enJuego />}
        </div>
      )}
      {/* La entrada (si no hay presentación): la pantalla se arma desde negro en bloques de píxel. */}
      {!d.intro && <Pixelado />}
      {/* Las balas de energía (Cami): salen de las pistolas y vuelan hasta su objetivo. */}
      {bolaT && (
        <span
          key={bolaT.key}
          className="batalla-bola-toxica"
          style={{ left: bolaT.x, top: bolaT.y, scale: String(bolaT.lado / 112), transitionDuration: `${bolaT.ms}ms` } as CSSProperties}
          aria-hidden
        >
          <SpriteHoja key={bolaT.anim} src="batalla/bola_toxica" anim={bolaT.anim} bucle={bolaT.anim === 'idle'} />
        </span>
      )}
      {tiembla > 0 && <span key={tiembla} className="batalla-temblor" aria-hidden />}
      <span className={`batalla-tinte-toxico ${tinte ? 'activo' : ''}`} aria-hidden />
      {energias && <EnergiasHacia x={energias.x} y={energias.y} lejos={energias.lejos} />}
      {onda && <span key={onda.key} className="batalla-onda-toxica" style={{ left: onda.x, top: onda.y }} aria-hidden />}
      {rayoSigue && (
        <span
          className="batalla-rayo sigue"
          aria-hidden
          style={{ left: rayoSigue.x, top: rayoSigue.y, width: rayoSigue.largo, height: Math.max(6, rayoSigue.grosor), rotate: `${rayoSigue.ang}rad`, '--c': '#ff2a2a' } as CSSProperties}
        />
      )}
      {rayo && (
        <span
          key={rayo.key}
          className="batalla-rayo"
          aria-hidden
          style={{ left: rayo.x, top: rayo.y, width: rayo.largo, rotate: `${rayo.ang}rad`, '--c': rayo.color } as CSSProperties}
        />
      )}
      <div className="batalla-balas" aria-hidden>
        {Object.entries(enMano).map(([id, x]) => (
          <img
            key={`mano-${id}`}
            className="batalla-proyectil en-mano"
            src={x.src}
            alt=""
            draggable={false}
            style={{ left: x.x - x.w / 2, top: x.y - x.h / 2, width: x.w, height: x.h, scale: x.espejo ? '-1 1' : undefined } as CSSProperties}
          />
        ))}
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
                scale: x.espejo ? '-1 1' : undefined,
                animationDuration: `${x.ms}ms`,
                animationDelay: `${x.demora}ms`,
              } as CSSProperties
            }
          />
        ))}
        {/* Lo que cae del cielo: su dibujo, con un brillo. */}
        {cae && (
          <span key={cae.key} className={`batalla-cae ${d.objetos[cae.objeto]?.icono ? 'con-icono' : ''}`}>
            {d.objetos[cae.objeto]?.icono ? <img src={`${BASE}${d.objetos[cae.objeto].icono}.webp`} alt="" draggable={false} /> : '✚'}
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
      <div className={`batalla-abajo ${habla ? 'hablando' : ''}`}>
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
                {'icono' in o && typeof o.icono === 'string' && <img className="batalla-menu-icono" src={`${BASE}${o.icono}.webp`} alt="" draggable={false} />}
                {o.texto}
                {o.extra && <small>{o.extra}</small>}
              </button>
            ))}
          {/* Mientras no es el turno de elegir: los comandos a la vista, más transparentes y sin poder usarlos
              (el cuadro no se queda vacío; pedido del autor). */}
          {!enMenu &&
            comandos.map((c) => (
              <button key={c} type="button" disabled tabIndex={-1} aria-hidden>
                {c}
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
              {/* Confundido: las letras chuecas, cada una por su lado, pero legibles. */}
              {mensaje?.estado === 'confundido' ? (
                <p className="habla-confuso">
                  {[...texto].map((c, i) => (
                    <span key={i} style={{ '--r': `${((i * 37) % 11) - 5}deg`, '--y': `${((i * 53) % 7) - 3}px` } as CSSProperties}>
                      {c}
                    </span>
                  ))}
                </p>
              ) : (
                <p className={mensaje?.estado ? `habla-${mensaje.estado}` : undefined}>{conNumeros(texto)}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </PausaContexto.Provider>
  );
}
