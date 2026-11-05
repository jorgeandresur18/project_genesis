import { Fragment, useEffect, useRef, useState, type CSSProperties, type MouseEvent as RMouseEvent, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { lightOf, type Character, type Scene, type Vapor } from '../engine/types';
import { playChip } from '../engine/sound';
import glitch from '../effects/glitch.module.css';
import { assetUrl, isPlaceholder, screenOf } from '../engine/assets';
import { CodeScreen } from './CodeScreen';
import volteadas from '../data/volteadas.json';
import emblemas from '../data/emblemas_18.json';
import galeriaEs from '../data/galeria.json';
import galeriaEn from '../data/en/galeria.json';
import { localized, useLang } from '../engine/i18n';
import { flippedCharacters } from '../engine/facing';
import { BASE_CANVAS, canvasHeight, statureOf, widthFactor } from '../engine/stature';
import { useReinos } from '../engine/reinos';
import { useStore } from '../engine/store';

interface Props {
  scene: Scene;
  effects: string[];
  /** Hablantes del historial, del más viejo a la línea actual (para que los personajes se miren). */
  speakers: (string | null)[];
  /** Historial de diálogo (para las pantallas en código: consola de GENESIS, mensajes). */
  lines: { speaker: string | null; text: string; choice?: boolean; sid?: string }[];
  children: ReactNode;
}

// Tamaño en pantalla de un sprite de 1,65 m sin enemigos en escena (porcentaje del alto y del ancho del escenario).
const SPRITE_HEIGHT = 92;
const SPRITE_MAX_WIDTH = 45;

/** Si un sprite que hay que voltear tiene su versión dibujada en espejo (`<expresión>_volteada`), se usa esa. */
const MIRRORED = volteadas as Record<string, string>;
function mirroredSprite(sprite: string): string | null {
  const m = sprite.match(/^sprites\/([^/]+\/[^/.]+)\.webp$/);
  const v = m && MIRRORED[m[1]];
  return v ? `sprites/${v}.webp` : null;
}

/** Fondo, video y personajes. En greyboxing todo se dibuja como cajas grises con su marcador. */
export function SceneStage({ scene, effects, speakers, lines, children }: Props) {
  const glitching = effects.includes('glitch');
  const light = lightOf(effects);
  const flipped = flippedCharacters(scene.characters, speakers);
  // Todos a la misma escala; si hay alguien más alto que 1,65 m (un enemigo), la «cámara» se aleja para que entre entero.
  const heights = new Map(scene.characters.map((c) => [c.id, canvasHeight(statureOf(c))]));
  const camera = BASE_CANVAS / Math.max(BASE_CANVAS, ...heights.values());
  const size = (id: string) => (heights.get(id)! / BASE_CANVAS) * camera;
  const screen = scene.background && !scene.video_fondo ? screenOf(scene.background) : null;
  const toques = useToques(scene);

  return (
    <div className={`stage ${glitching ? glitch.glitch : ''} ${toques.grito ? 'stage-grito' : ''}`}>
      <div className="stage-bg">
        {screen !== null ? (
          <CodeScreen id={screen} lines={lines} accion={scene.accion_pantalla} />
        ) : scene.background && !isPlaceholder(scene.background) && !scene.video_fondo ? (
          <>
            <Backdrop src={assetUrl(scene.background)} />
            {capaDeFondo(scene.background.replace(/\.webp$/, '')) && (
              <CapasFondo capa={capaDeFondo(scene.background.replace(/\.webp$/, ''))!} src={assetUrl(scene.background)} />
            )}
          </>
        ) : (
          <span className="placeholder-label">
            {scene.video_fondo
              ? `${scene.video_fondo}${scene.loop_video ? ' (loop)' : ''}`
              : (scene.background ?? 'sin fondo')}
          </span>
        )}
        {/* Solo los audios provisionales muestran su nombre (los reales ya suenan). */}
        {scene.audio && isPlaceholder(scene.audio) && <span className="placeholder-audio">♪ {scene.audio}</span>}
      </div>
      <div className="stage-characters">
        {scene.characters.map((c) => {
          const sprite = toques.spriteDe(c) ?? c.sprite;
          const mirrored = flipped.has(c.id) ? mirroredSprite(sprite) : null;
          return isPlaceholder(sprite) ? (
            <div
              key={c.id}
              className={`sprite sprite-placeholder sprite-${c.pos}`}
              // Misma escala que un sprite real: así el placeholder ya muestra la estatura del personaje.
              style={{
                height: `${SPRITE_HEIGHT * size(c.id)}%`,
                width: 'auto',
                aspectRatio: '3 / 4',
                maxWidth: `${SPRITE_MAX_WIDTH * size(c.id)}%`,
              }}
            >
              <span className="placeholder-label">{sprite}</span>
            </div>
          ) : (
            <Fragment key={c.id}>
              <Sprite
                className={`sprite sprite-${c.pos} ${flipped.has(c.id) && !mirrored ? 'sprite-flip' : ''}`}
                style={{
                  height: `${SPRITE_HEIGHT * size(c.id)}%`,
                  maxWidth: `${SPRITE_MAX_WIDTH * size(c.id) * widthFactor(c)}%`,
                }}
                src={assetUrl(mirrored ?? sprite)}
              />
              <Emblemas
                sprite={sprite}
                reaccion={toques.reaccionDe(c.id)}
                onToque={(zona) => toques.tocar(c, zona)}
                className={`sprite sprite-${c.pos} ${flipped.has(c.id) && !mirrored ? 'sprite-flip' : ''}`}
                style={{
                  height: `${SPRITE_HEIGHT * size(c.id)}%`,
                  maxWidth: `${SPRITE_MAX_WIDTH * size(c.id) * widthFactor(c)}%`,
                }}
              />
            </Fragment>
          );
        })}
      </div>
      {/* El mismo vapor sigue de una escena a otra: al cambiar de nivel se espesa o se abre de a poco. */}
      {scene.vapor && <VaporTermal nivel={scene.vapor} />}
      {light && <div key={`${scene.scene_id}-${light}`} className={`light-fx light-${light}`} aria-hidden />}
      {scene.lugar && <PlaceCard key={scene.scene_id} id={scene.lugar} />}
      {children}
      {/* El grito: la luz blanca tapa todo y no deja avanzar el diálogo hasta que sigue la historia. */}
      {toques.grito && <div className="grito-blanco" onClick={(e) => e.stopPropagation()} aria-hidden />}
    </div>
  );
}

/** Un emblema (centro y ancho en % de la imagen). `pecho`: al tocarlo, el pecho rebota de arriba abajo. */
type Emblema = { x: number; y: number; w: number; zona?: 'pecho' };
/** Una mano de Cami: su imagen y su caja (en % del sprite). */
type Mano = { imagen: string; x: number; y: number; w: number; h: number };
/** Lo que hace cada mano (ver EmblemasTocables). */
type Accion =
  | { tipo: 'nalgada'; lado: 'izq' | 'der'; mano: Mano; marca?: Mano }
  | { tipo: 'pecho'; lado: 'izq' | 'der'; emblema: number; abierta: Mano; cerrada: Mano }
  | { tipo: 'apunta'; emblema: number; mano: Mano };
/** Las manos de un grupo de sprites secretos; `marca`: si la nalgada deja la marca roja (no con el pantalón puesto). */
interface Manos {
  sprites: string[];
  marca: boolean;
  /** Dónde está su cara: el globo de lo que dice sale pegado a ella. */
  cara?: Cara;
  acciones: Accion[];
}
/** El costado de la cara (en % de la imagen) donde se pega el globo: a la izquierda (o a la derecha, `lado: 'der'`). */
type Cara = { x: number; y: number; lado?: 'izq' | 'der' };
/** El globo de lo que dice el personaje, pegado a su cara (sin taparla). */
export function GloboCara({ cara, texto, grito = false }: { cara?: Cara; texto: string; grito?: boolean }) {
  const der = cara?.lado === 'der';
  return (
    <span
      className={`emblema-reaccion ${grito ? 'emblema-grito' : der ? 'globo-der' : ''}`}
      style={
        cara && !grito
          ? {
              left: `${cara.x}%`,
              top: `${cara.y}%`,
              translate: der ? '0 -50%' : '-100% -50%',
              // Que no se salga de la imagen (p. ej. con la ficha de información abierta, la imagen se achica): usa el
              // espacio libre a su lado y, si es poco, ocupa más renglones.
              maxWidth: `min(17em, max(7em, ${der ? 98 - cara.x : cara.x - 2}%))`,
            }
          : undefined
      }
      role="status"
    >
      {texto}
    </span>
  );
}
/** Dónde se tocó (para lo que dice el personaje). */
export type Zona = 'pecho_izq' | 'pecho_der' | 'pechos' | 'nalga_izq' | 'nalga_der' | 'nalgas' | 'abajo' | 'emblema';
/** Lo que va encima de una imagen secreta: sus emblemas, su proporción (ancho / alto) y el vapor de la galería. */
export interface Capa {
  proporcion: number;
  vapor?: Vapor;
  emblemas: Emblema[];
  manos?: Manos;
  cara?: Cara;
}
const EMBLEMAS = emblemas.sprites as Record<string, Emblema[]>;
const MANOS = Object.values(emblemas.manos) as Manos[];
const manosDe = (clave: string): Manos | undefined => MANOS.find((m) => m.sprites.includes(clave));
const FONDOS = emblemas.fondos as Record<string, Capa>;
interface Paso {
  /** Se dispara al llegar a esta cantidad de toques. */
  toques: number;
  sprite?: string;
  reaccion?: string;
  /** Sprite al que pasa solo un momento después (p. ej. se da vuelta). */
  luego?: string;
  /** Lo que grita al pasar a `luego`: tiembla todo, zoom, luz blanca y la historia sigue en `toques_salida`. */
  grito?: string;
  /** Después de decir su línea, la historia sigue en `toques_salida` (sin grito: p. ej. se apura a vestirse). */
  salir?: boolean;
}
interface Secuencia {
  personaje: string;
  /** Sprites de la escena donde cuenta esta secuencia (`personaje/expresión`). */
  sprites: string[];
  pasos: Paso[];
}
const SECUENCIAS = emblemas.secuencias as Secuencia[];
const spriteRef = (s: string) => `sprites/${s}.webp`;
const claveSprite = (ref: string) => ref.match(/^sprites\/([^/]+\/[^/.]+)\.webp$/)?.[1] ?? null;
/** Los emblemas y la proporción de un sprite secreto (para la galería). */
export const capaDeSprite = (clave: string): Capa | null =>
  EMBLEMAS[clave] ? { proporcion: 3 / 4, vapor: 'medio', emblemas: EMBLEMAS[clave], manos: manosDe(clave), cara: manosDe(clave)?.cara } : null;
export const capaDeFondo = (fondo: string): Capa | null => FONDOS[fondo] ?? null;
export const esSpriteSecreto = (clave: string) => clave in EMBLEMAS;
// Cuánto tarda en darse vuelta después del susto, cuánto entre la cara de susto y el grito, y cuánto dura el grito.
const LUEGO_MS = 1300;
const ANTES_DEL_GRITO_MS = 700;
const GRITO_MS = 1900;
const SALIR_MS = 2200;
type Dice = { id: string; texto: string; grito?: boolean; n: number };

/**
 * Hasta dónde llegó el jugador en cada secuencia y el sprite que quedó: se mantienen entre las líneas de la
 * escena secreta (si avanza el diálogo, Rikka sigue dada vuelta) y se borran al salir de ella.
 */
let cuenta = SECUENCIAS.map(() => 0);
let quedo: (string | null)[] = SECUENCIAS.map(() => null);
const reiniciar = () => {
  cuenta = SECUENCIAS.map(() => 0);
  quedo = SECUENCIAS.map(() => null);
};

/**
 * Tocar los emblemas en una escena secreta (src/data/emblemas_18.json, «secuencias»): cada toque suma, y al
 * llegar a la cantidad de un paso cambia el sprite del personaje o lo que dice, hasta el grito, que salta a
 * `toques_salida` con las variables de `toques_set`.
 */
/** Lo que dice cada personaje en la novela según dónde lo tocaron (galeria.json, «quejas» → «zonas_novela»). */
type ZonasNovela = Record<string, Record<string, string[]> | undefined>;
const zonasDe = (g: typeof galeriaEs): ZonasNovela =>
  Object.fromEntries(Object.entries(g.quejas as Record<string, { zonas_novela?: Record<string, string[]> }>).map(([k, v]) => [k, v.zonas_novela]));
/** Una línea distinta cada vez, sin repetir hasta usarlas todas. */
const usadas = new Map<string, number[]>();
function siguienteDe(clave: string, lineas: string[]): string {
  let quedan = usadas.get(clave)?.filter((i) => i < lineas.length) ?? [];
  if (!quedan.length) quedan = lineas.map((_, i) => i).sort(() => Math.random() - 0.5);
  const i = quedan.shift()!;
  usadas.set(clave, quedan);
  return lineas[i];
}

function useToques(scene: Scene) {
  const zonasNovela = zonasDe(useLang() === 'en' ? (localized(galeriaEs, galeriaEn, 'en') as typeof galeriaEs) : galeriaEs);
  const [, refrescar] = useState(0);
  const [reaccion, setReaccion] = useState<Dice | null>(null);
  /** La escena donde terminó la secuencia (ya no se cuentan toques) y si fue con grito (luz blanca). */
  const [grito, setGrito] = useState<string | null>(null);
  const [gritando, setGritando] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    if (!scene.secreto) reiniciar();
  }, [scene.secreto]);
  useEffect(() => {
    const lista = timers.current;
    return () => lista.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (!reaccion) return;
    const timer = setTimeout(() => setReaccion(null), reaccion.grito ? 2400 : 3200);
    return () => clearTimeout(timer);
  }, [reaccion]);
  const escena = scene.scene_id;
  // Ya en la escena siguiente, la luz del grito se apaga.
  useEffect(() => {
    if (grito && grito !== escena) setGritando(false);
  }, [escena, grito]);
  const secuenciaDe = (c: Character) => {
    const clave = claveSprite(c.sprite);
    return scene.secreto && clave ? SECUENCIAS.findIndex((s) => s.personaje === c.id && s.sprites.includes(clave)) : -1;
  };
  const despues = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
  return {
    grito: grito === escena && gritando,
    reaccionDe: (id: string) => (reaccion?.id === id ? reaccion : null),
    spriteDe: (c: Character) => {
      const i = secuenciaDe(c);
      return i >= 0 ? quedo[i] : null;
    },
    tocar: (c: Character, zona?: Zona) => {
      const i = secuenciaDe(c);
      if (i < 0 || grito === escena) return;
      const n = ++cuenta[i];
      const p = SECUENCIAS[i].pasos.find((x) => x.toques === n);
      // Sin un paso de la escena en este toque: lo que dice según dónde la tocaron (pedido del autor, 2026-11-04).
      // Ella no ve a nadie: cree que es un pétalo, el vapor o Cami.
      if (!p) {
        const lineas = zona ? zonasNovela[c.id]?.[zona] : undefined;
        if (lineas?.length) setReaccion({ id: c.id, texto: siguienteDe(`${c.id}:${zona}`, lineas), n });
        return;
      }
      if (p.sprite) quedo[i] = spriteRef(p.sprite);
      if (p.reaccion) setReaccion({ id: c.id, texto: p.reaccion, n });
      refrescar((r) => r + 1);
      if (p.salir && scene.toques_salida) {
        setGrito(escena);
        despues(SALIR_MS, () => {
          reiniciar();
          useStore.getState().salirPorToques();
        });
        return;
      }
      if (!p.luego) return;
      const luego = spriteRef(p.luego);
      const grita = p.grito && scene.toques_salida ? p.grito : null;
      despues(grita ? ANTES_DEL_GRITO_MS : LUEGO_MS, () => {
        quedo[i] = luego;
        refrescar((r) => r + 1);
        if (!grita) return;
        setGrito(escena);
        setGritando(true);
        setReaccion({ id: c.id, texto: grita, grito: true, n: n + 1 });
        playChip('grito');
        despues(GRITO_MS, () => {
          reiniciar();
          // La luz blanca se queda hasta que la escena cambia de verdad: durante el fundido a blanco se sigue
          // mostrando esta escena, y sin la luz se volvía a ver a Rikka un momento.
          useStore.getState().salirPorToques();
        });
      });
    },
  };
}

/**
 * Emblemas +18 encima de un sprite desbloqueable (src/data/emblemas_18.json): fijos, con un brillo metálico.
 * La censura ya va pegada en la imagen; esto es la animación. Si el jugador toca uno, rebota él y la parte de la
 * imagen que tapa (ver useToques para lo que pasa con el personaje). Ocupan la misma caja que el sprite.
 */
function Emblemas({
  sprite,
  reaccion,
  onToque,
  className,
  style,
}: {
  sprite: string;
  reaccion: Dice | null;
  onToque: (zona: Zona) => void;
  className: string;
  style: CSSProperties;
}) {
  const clave = claveSprite(sprite);
  const lista = clave ? EMBLEMAS[clave] : undefined;
  const marcar = useStore((s) => s.marcarSecreto);
  // Verlo en el juego lo desbloquea en la galería.
  useEffect(() => {
    if (clave && lista) marcar(clave);
  }, [clave, lista, marcar]);
  if (!clave || !lista) return null;
  return (
    <div className={`${className} sprite-emblemas`} style={style}>
      <div className="sprite-emblemas-caja">
        <EmblemasTocables lista={lista} clave={clave} src={assetUrl(sprite)} proporcion={3 / 4} onToque={onToque} manos={manosDe(clave)} />
        {reaccion && <GloboCara key={reaccion.n} cara={manosDe(clave)?.cara} texto={reaccion.texto} grito={reaccion.grito} />}
      </div>
    </div>
  );
}

/** Círculo un poco más grande que el emblema, con el borde difuminado (en % de una caja de esa proporción). */
const mascara = (e: Emblema, proporcion: number) =>
  `radial-gradient(ellipse ${e.w * 1.5}% ${e.w * 1.5 * proporcion}% at ${e.x}% ${e.y}%, #000 45%, transparent 100%)`;

/** Un pecho (su emblema): una elipse alrededor, con el borde difuminado (en % de la caja). */
const mascaraPecho = (e: Emblema, proporcion: number) =>
  `radial-gradient(ellipse ${e.w * 2.1}% ${e.w * 1.9 * proporcion}% at ${e.x}% ${e.y + e.w * 0.2 * proporcion}%, #000 55%, transparent 100%)`;
/** Cuánto hay que mantener apretado para que sea de los dos lados a la vez. */
const MANTENER_MS = 450;
/** Cuánto dura la marca roja de la nalgada (igual que su animación en styles.css). */
const MARCA_MS = 3400;
/** La marca roja sale recién después de tantas nalgadas seguidas en ese lado (pedido del autor), sin dejar pasar más que esto entre una y otra. */
const NALGADAS_PARA_MARCA = 7;
const RACHA_MS = 2500;
/** Cuánto dura cada acción de las manos (y hasta cuándo no se puede repetir). */
const DURA: Record<Accion['tipo'], number> = { pecho: 1100, nalgada: 950, apunta: 900 };
const ladoDe = (a: Accion) => ('lado' in a ? a.lado : 'izq');
const caja = (m: Mano): CSSProperties => ({ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` });

/**
 * Los emblemas de una imagen, dentro de una caja del mismo tamaño que la imagen. Al tocar uno rebota él y la parte de
 * la imagen que tapa (una copia recortada que rebota encima). Con las manos de Cami (`manos`, pedido del autor,
 * 2026-11-04), cada zona tiene su acción, solo en su lugar:
 * - Un pecho: entra la mano abierta, se cierra un poco y ese pecho sube y baja unas veces, cada vez menos.
 * - Un glúteo: la mano entra rápido y pega (destello, onda en ese lado y, si `marca`, la marca roja de una mano).
 * - El emblema de abajo: la mano que apunta hace «clic» (se agranda un poquito) y el emblema rebota.
 * Mantener apretado un pecho o un glúteo hace los dos lados a la vez. Cada toque avisa su zona (`onToque`).
 */
function EmblemasTocables({
  lista,
  clave,
  src,
  proporcion,
  onToque,
  fijos = false,
  manos,
}: {
  lista: Emblema[];
  clave: string;
  src: string;
  proporcion: number;
  onToque?: (zona: Zona) => void;
  /** Solo la censura, sin tocarse (las miniaturas de la galería). */
  fijos?: boolean;
  manos?: Manos;
}) {
  const [rebota, setRebota] = useState<{ i: number; n: number } | null>(null);
  /** Las acciones de las manos que se están viendo (índice en `manos.acciones` -> vez). */
  const [vivas, setVivas] = useState<Record<number, number>>({});
  const [marcas, setMarcas] = useState<Record<string, number>>({});
  const vez = useRef(0);
  /** Nalgadas seguidas en cada lado (cuántas y cuándo fue la última). */
  const rachas = useRef<Record<string, { n: number; t: number }>>({});
  const apretado = useRef<{ timer: ReturnType<typeof setTimeout>; hecho: boolean } | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const lista = timers.current;
    return () => lista.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    if (!rebota) return;
    const timer = setTimeout(() => setRebota(null), 650);
    return () => clearTimeout(timer);
  }, [rebota]);
  if (fijos)
    return lista.map((e, i) => (
      <span key={`${clave}-${i}`} className="emblema-18 fijo" style={{ left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%` }} aria-hidden>
        <img src={assetUrl(emblemas.emblema)} alt="" draggable={false} />
      </span>
    ));
  const acciones = manos?.acciones ?? [];
  const accionDe = (i: number) => acciones.findIndex((a) => a.tipo !== 'nalgada' && a.emblema === i);

  /** Hace las acciones `is` (una o las dos de un tipo) y avisa la zona. */
  const hacer = (is: number[]) => {
    const libres = is.filter((i) => vivas[i] === undefined);
    if (!libres.length) return;
    const n = ++vez.current;
    setVivas((v) => ({ ...v, ...Object.fromEntries(libres.map((i) => [i, n])) }));
    const a = acciones[libres[0]];
    if (a.tipo === 'nalgada') {
      timers.current.push(
        setTimeout(() => {
          playChip('cachetada');
          if (!manos?.marca) return;
          // Cada lado cuenta sus nalgadas seguidas (las de las dos manos cuentan en los dos); la marca sale recién
          // a la séptima seguida y aparece lento, queda un momento y se va rápido (pedido del autor).
          const ahora = Date.now();
          const lados = libres
            .map((i) => ladoDe(acciones[i]))
            .filter((l) => {
              const r = rachas.current[l];
              const n = r && ahora - r.t < RACHA_MS ? r.n + 1 : 1;
              rachas.current[l] = { n, t: ahora };
              return n >= NALGADAS_PARA_MARCA;
            });
          if (!lados.length) return;
          setMarcas((m) => ({ ...m, ...Object.fromEntries(lados.map((l) => [l, n])) }));
          timers.current.push(
            setTimeout(
              () =>
                setMarcas((m) => {
                  const sigue = { ...m };
                  for (const l of lados) if (sigue[l] === n) delete sigue[l];
                  return sigue;
                }),
              MARCA_MS,
            ),
          );
        }, 110),
      );
    } else if (a.tipo === 'pecho') timers.current.push(setTimeout(() => playChip('boing'), 280));
    else {
      playChip('boing');
      setRebota((r) => ({ i: a.emblema, n: (r?.n ?? 0) + 1 }));
    }
    timers.current.push(
      setTimeout(
        () =>
          setVivas((v) => {
            const sigue = { ...v };
            for (const i of libres) if (sigue[i] === n) delete sigue[i];
            return sigue;
          }),
        DURA[a.tipo],
      ),
    );
    const zona: Zona =
      a.tipo === 'apunta' ? 'abajo' : libres.length > 1 ? (a.tipo === 'pecho' ? 'pechos' : 'nalgas') : `${a.tipo === 'pecho' ? 'pecho' : 'nalga'}_${a.lado}`;
    onToque?.(zona);
  };
  /** Los del mismo tipo (los dos pechos o los dos glúteos). */
  const pares = (i: number) => acciones.map((x, j) => (x.tipo === acciones[i].tipo ? j : -1)).filter((j) => j >= 0);
  /** Tocar (una) o mantener apretado (las dos del mismo tipo). La que apunta no tiene par. */
  const pulsar = (i: number) => ({
    onPointerDown: (ev: RPointerEvent) => {
      ev.stopPropagation();
      if (acciones[i].tipo === 'apunta') return hacer([i]);
      const p = {
        hecho: false,
        timer: setTimeout(() => {
          p.hecho = true;
          hacer(pares(i));
        }, MANTENER_MS),
      };
      apretado.current = p;
    },
    onPointerUp: (ev: RPointerEvent) => {
      ev.stopPropagation();
      const p = apretado.current;
      apretado.current = null;
      if (!p) return;
      clearTimeout(p.timer);
      if (!p.hecho) hacer([i]);
    },
    onPointerLeave: () => {
      const p = apretado.current;
      if (p && !p.hecho) clearTimeout(p.timer);
      apretado.current = null;
    },
    onClick: (ev: RMouseEvent) => {
      ev.stopPropagation();
      // Con el teclado (Enter): una sola.
      if (ev.detail === 0) hacer([i]);
    },
  });

  const boton = (e: Emblema, i: number) => {
    const a = accionDe(i);
    return (
      <button
        key={`${clave}-${i}`}
        type="button"
        className={`emblema-18 ${rebota?.i === i && acciones[a]?.tipo !== 'pecho' ? 'rebota' : ''}`}
        style={{ left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%` }}
        {...(a >= 0
          ? pulsar(a)
          : {
              onClick: (ev: RMouseEvent) => {
                ev.stopPropagation();
                // Hasta que no termina el rebote, no se puede volver a tocar.
                if (rebota) return;
                playChip('boing');
                setRebota((r) => ({ i, n: (r?.n ?? 0) + 1 }));
                onToque?.('emblema');
              },
            })}
        aria-label="+18"
      >
        <img src={assetUrl(emblemas.emblema)} alt="" draggable={false} />
        {/* El brillo metálico: una franja de luz que cruza el emblema, recortada con su misma forma. */}
        <span
          className="emblema-brillo"
          style={{
            maskImage: `url(${assetUrl(emblemas.emblema)})`,
            WebkitMaskImage: `url(${assetUrl(emblemas.emblema)})`,
            animationDelay: `${i * 0.45}s`,
          }}
          aria-hidden
        />
      </button>
    );
  };
  const zonaRebota = rebota ? lista[rebota.i] : undefined;
  const conPecho = new Set(acciones.flatMap((a) => (a.tipo === 'pecho' ? [a.emblema] : [])));
  // Con la mano que apunta, rebota solo el emblema: la copia agrandada dejaba asomar el mosaico alrededor.
  const conApunta = new Set(acciones.flatMap((a) => (a.tipo === 'apunta' ? [a.emblema] : [])));
  return (
    <>
      {rebota && zonaRebota && !conPecho.has(rebota.i) && !conApunta.has(rebota.i) && (
        <img
          key={`zona-${rebota.n}`}
          className="emblema-zona"
          src={src}
          alt=""
          draggable={false}
          aria-hidden
          style={{
            maskImage: mascara(zonaRebota, proporcion),
            WebkitMaskImage: mascara(zonaRebota, proporcion),
            transformOrigin: `${zonaRebota.x}% ${zonaRebota.y}%`,
          }}
        />
      )}
      {acciones.map((a, i) => {
        if (a.tipo !== 'nalgada') return null;
        const m = a.mano;
        const palma = { x: m.x + m.w / 2, y: m.y + m.h * 0.42 };
        const mascaraOnda = `radial-gradient(ellipse ${m.w * 0.75}% ${m.h * 0.72}% at ${palma.x}% ${palma.y}%, #000 50%, transparent 100%)`;
        const n = vivas[i];
        return (
          <Fragment key={`nalgada-${i}`}>
            {/* La marca: ya viene difuminada, solo la palma y dentro del cuerpo (tools/desbloqueables_rikka.mjs). */}
            {marcas[a.lado] && a.marca && (
              <img key={`marca-${marcas[a.lado]}`} className="nalgada-marca" src={assetUrl(`${a.marca.imagen}.webp`)} alt="" draggable={false} aria-hidden style={caja(a.marca)} />
            )}
            {n !== undefined && (
              <>
                <img
                  key={`onda-${n}`}
                  className="nalgada-onda"
                  src={src}
                  alt=""
                  draggable={false}
                  aria-hidden
                  style={{ maskImage: mascaraOnda, WebkitMaskImage: mascaraOnda, transformOrigin: `${palma.x}% ${palma.y}%` }}
                />
                <span key={`zas-${n}`} className="nalgada-zas" style={{ left: `${palma.x}%`, top: `${palma.y}%`, width: `${m.w * 0.8}%` }} aria-hidden />
                <img
                  key={`mano-${n}`}
                  className="nalgada-mano"
                  src={assetUrl(`${m.imagen}.webp`)}
                  alt=""
                  draggable={false}
                  aria-hidden
                  style={{ ...caja(m), '--dir': a.lado === 'izq' ? -1 : 1 } as CSSProperties}
                />
              </>
            )}
            <button type="button" className="nalgada-toque" style={caja(m)} {...pulsar(i)} aria-label={a.lado === 'izq' ? '←' : '→'} />
          </Fragment>
        );
      })}
      {/* Cada pecho que rebota: la copia del sprite (debajo de la mano). */}
      {acciones.map((a, i) => {
        if (a.tipo !== 'pecho' || vivas[i] === undefined || !lista[a.emblema]) return null;
        const e = lista[a.emblema];
        return (
          <div key={`copia-${i}-${vivas[i]}`} className="pecho-grupo rebota">
            <img className="pecho-zona" src={src} alt="" draggable={false} aria-hidden style={{ maskImage: mascaraPecho(e, proporcion), WebkitMaskImage: mascaraPecho(e, proporcion) }} />
          </div>
        );
      })}
      {/* Lo que se toca de cada pecho y su emblema, debajo de las manos; rebotan igual que la copia. */}
      {acciones.map((a, i) => {
        if (a.tipo !== 'pecho') return null;
        const e = lista[a.emblema];
        if (!e) return null;
        const n = vivas[i];
        return (
          <div key={n !== undefined ? `grupo-${i}-${n}` : `grupo-${i}`} className={`pecho-grupo ${n !== undefined ? 'rebota' : ''}`}>
            <button
              type="button"
              className="pecho-toque"
              style={{ left: `${e.x}%`, top: `${e.y}%`, width: `${e.w * 3.4}%` }}
              {...pulsar(i)}
              aria-label={a.lado === 'izq' ? '←' : '→'}
            />
            {boton(e, a.emblema)}
          </div>
        );
      })}
      {lista.map((e, i) => (conPecho.has(i) ? null : boton(e, i)))}
      {/* Las manos de los pechos y la que apunta: encima de todo, también de los emblemas (pedido del autor: no los atraviesan). */}
      {acciones.map((a, i) =>
        a.tipo === 'pecho' && vivas[i] !== undefined ? (
          <Fragment key={`manos-pecho-${i}`}>
            <img key={`abierta-${vivas[i]}`} className="mano-pecho abierta" src={assetUrl(`${a.abierta.imagen}.webp`)} alt="" draggable={false} aria-hidden style={caja(a.abierta)} />
            <img key={`cerrada-${vivas[i]}`} className="mano-pecho cerrada" src={assetUrl(`${a.cerrada.imagen}.webp`)} alt="" draggable={false} aria-hidden style={caja(a.cerrada)} />
          </Fragment>
        ) : null,
      )}
      {acciones.map((a, i) =>
        a.tipo === 'apunta' && vivas[i] !== undefined ? (
          <img key={`apunta-${vivas[i]}`} className="mano-apunta" src={assetUrl(`${a.mano.imagen}.webp`)} alt="" draggable={false} aria-hidden style={caja(a.mano)} />
        ) : null,
      )}
    </>
  );
}

/**
 * Emblemas (y, si se pide, vapor) encima de una imagen secreta o de un sprite secreto en la galería. La caja
 * sigue a la imagen: recortada como el fondo del escenario (cover) o entera como en el visor (`contener`).
 */
export function CapasFondo({
  capa,
  src,
  contener = false,
  vapor = false,
  fijos = false,
  onToque,
  dice,
}: {
  capa: Capa;
  src: string;
  contener?: boolean;
  vapor?: boolean;
  /** Solo la censura, sin tocarse (las miniaturas). */
  fijos?: boolean;
  /** Al tocar un emblema o una zona (en la galería, el personaje se queja según dónde). */
  onToque?: (zona: Zona) => void;
  /** Lo que dice (la queja de la galería), pegado a su cara. */
  dice?: { texto: string; n: number } | null;
}) {
  return (
    <div className={`fondo-capas ${contener ? 'fondo-capas-contener' : ''}`}>
      <div className="fondo-capas-caja" style={{ '--r': capa.proporcion } as CSSProperties}>
        <EmblemasTocables lista={capa.emblemas} clave={src} src={src} proporcion={capa.proporcion} onToque={onToque} fijos={fijos} manos={capa.manos} />
      </div>
      {/* El globo, en una caja igual pero sin recortar (la de las manos recorta lo que se sale de la imagen). */}
      {dice && (
        <div className="fondo-capas-caja fondo-capas-globo" style={{ '--r': capa.proporcion } as CSSProperties}>
          <GloboCara key={dice.n} cara={capa.cara} texto={dice.texto} />
        </div>
      )}
      {/* El vapor va encima de todo (también de la zona que rebota, si no quedaba un círculo sin niebla) y ocupa
          todo el ancho; no bloquea los toques. */}
      {vapor && capa.vapor && <VaporTermal nivel={capa.vapor} />}
    </div>
  );
}

/** Vapor de las termas: nubes que suben y se mecen; el nivel cambia lo espeso (ver `vapor` en la escena). */
function VaporTermal({ nivel }: { nivel: Vapor }) {
  return (
    <div className={`vapor vapor-${nivel}`} aria-hidden>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} style={{ '--i': i } as CSSProperties} />
      ))}
    </div>
  );
}

/** Cartel al llegar a un lugar: el emblema del reino, el nombre del lugar y el del reino. Se va solo. */
function PlaceCard({ id }: { id: string }) {
  const lugar = useReinos().lugar(id);
  if (!lugar) return null;
  return (
    <div className="place-card" style={{ '--reino': lugar.reino.color } as CSSProperties} aria-live="polite">
      <img src={assetUrl(lugar.reino.emblema)} alt="" draggable={false} />
      <span className="place-name">{lugar.nombre}</span>
      {lugar.nombre !== lugar.reino.nombre && <span className="place-reino">{lugar.reino.nombre}</span>}
    </div>
  );
}

// Duración del cambio de expresión: 180 ms de la nueva + la anterior que se va desde los 150 ms (ver styles.css).
const SWAP_MS = 320;

interface Shown {
  src: string;
  className: string;
}

/**
 * Sprite de un personaje. Cuando cambia de expresión, la nueva se funde encima de la anterior, que se queda
 * opaca debajo hasta que la nueva termina de aparecer: así no se transparenta el fondo (no hay parpadeo).
 * La anterior también espera a que la nueva cargue, así nunca queda un hueco.
 */
function Sprite({ src, className, style }: { src: string; className: string; style: CSSProperties }) {
  const [current, setCurrent] = useState<Shown>({ src, className });
  const [previous, setPrevious] = useState<Shown | null>(null);
  const [loaded, setLoaded] = useState(false);
  // Hasta el primer cambio de expresión, el sprite tiene la animación de entrada a escena.
  const [entered, setEntered] = useState(false);
  if (src !== current.src) {
    // Cambio de expresión: la que estaba pasa abajo y la nueva espera a cargar.
    setPrevious(current);
    setCurrent({ src, className });
    setLoaded(false);
    setEntered(true);
  } else if (className !== current.className) {
    setCurrent({ src, className });
  }
  const swapping = previous !== null;
  // Cuando la nueva ya cargó y terminó su fundido, la anterior se quita.
  useEffect(() => {
    if (!loaded || !previous) return;
    const t = setTimeout(() => setPrevious(null), SWAP_MS);
    return () => clearTimeout(t);
  }, [loaded, previous]);
  return (
    <>
      {previous && (
        <img
          className={`${previous.className} sprite-hold ${loaded ? 'sprite-leave' : ''}`}
          style={style}
          src={previous.src}
          alt=""
          draggable={false}
          aria-hidden
        />
      )}
      <img
        key={current.src}
        className={`${current.className} ${swapping ? (loaded ? 'sprite-swap' : 'sprite-loading') : entered ? '' : 'sprite-enter'}`}
        style={style}
        src={current.src}
        alt=""
        draggable={false}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}

// Duración del fundido entre fondos (igual que en styles.css).
const BG_SWAP_MS = 700;

/**
 * Fondo de imagen. Al cambiar de lugar, el nuevo se funde encima del anterior, y solo cuando terminó de
 * cargar: así nunca se ve el fondo viejo con los personajes de la escena nueva por una descarga lenta.
 */
function Backdrop({ src }: { src: string }) {
  const [current, setCurrent] = useState(src);
  const [previous, setPrevious] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  if (src !== current) {
    setPrevious(current);
    setCurrent(src);
    setLoaded(false);
  }
  useEffect(() => {
    if (!loaded || !previous) return;
    const t = setTimeout(() => setPrevious(null), BG_SWAP_MS);
    return () => clearTimeout(t);
  }, [loaded, previous]);
  return (
    <>
      {previous && <img className="stage-bg-img" src={previous} alt="" draggable={false} aria-hidden />}
      <img
        key={current}
        className={`stage-bg-img ${previous ? (loaded ? 'stage-bg-in' : 'stage-bg-loading') : ''}`}
        src={current}
        alt=""
        draggable={false}
        onLoad={() => setLoaded(true)}
      />
    </>
  );
}
