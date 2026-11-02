import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { lightOf, type Character, type Scene, type Vapor } from '../engine/types';
import { playChip } from '../engine/sound';
import glitch from '../effects/glitch.module.css';
import { assetUrl, isPlaceholder, screenOf } from '../engine/assets';
import { CodeScreen } from './CodeScreen';
import volteadas from '../data/volteadas.json';
import emblemas from '../data/emblemas_18.json';
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
                onToque={() => toques.tocar(c)}
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

type Emblema = { x: number; y: number; w: number };
/** Lo que va encima de una imagen secreta: sus emblemas, su proporción (ancho / alto) y el vapor de la galería. */
export interface Capa {
  proporcion: number;
  vapor?: Vapor;
  emblemas: Emblema[];
}
const EMBLEMAS = emblemas.sprites as Record<string, Emblema[]>;
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
  EMBLEMAS[clave] ? { proporcion: 3 / 4, vapor: 'medio', emblemas: EMBLEMAS[clave] } : null;
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
function useToques(scene: Scene) {
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
    const timer = setTimeout(() => setReaccion(null), 2400);
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
    tocar: (c: Character) => {
      const i = secuenciaDe(c);
      if (i < 0 || grito === escena) return;
      const n = ++cuenta[i];
      const p = SECUENCIAS[i].pasos.find((x) => x.toques === n);
      if (!p) return;
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
  onToque: () => void;
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
        <EmblemasTocables lista={lista} clave={clave} src={assetUrl(sprite)} proporcion={3 / 4} onToque={onToque} />
        {reaccion && (
          <span key={reaccion.n} className={`emblema-reaccion ${reaccion.grito ? 'emblema-grito' : ''}`} role="status">
            {reaccion.texto}
          </span>
        )}
      </div>
    </div>
  );
}

/** Círculo un poco más grande que el emblema, con el borde difuminado (en % de una caja de esa proporción). */
const mascara = (e: Emblema, proporcion: number) =>
  `radial-gradient(ellipse ${e.w * 1.5}% ${e.w * 1.5 * proporcion}% at ${e.x}% ${e.y}%, #000 45%, transparent 100%)`;

/**
 * Los emblemas de una imagen, dentro de una caja del mismo tamaño que la imagen. Al tocar uno rebota él y la
 * parte de la imagen que tapa: una copia de la imagen recortada en círculo que rebota encima.
 */
function EmblemasTocables({
  lista,
  clave,
  src,
  proporcion,
  onToque,
  fijos = false,
}: {
  lista: Emblema[];
  clave: string;
  src: string;
  proporcion: number;
  onToque?: () => void;
  /** Solo la censura, sin tocarse (las miniaturas de la galería). */
  fijos?: boolean;
}) {
  const [rebota, setRebota] = useState<{ i: number; n: number } | null>(null);
  useEffect(() => {
    if (!rebota) return;
    const timer = setTimeout(() => setRebota(null), 650);
    return () => clearTimeout(timer);
  }, [rebota]);
  const zona = rebota && lista[rebota.i];
  if (fijos)
    return lista.map((e, i) => (
      <span key={`${clave}-${i}`} className="emblema-18 fijo" style={{ left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%` }} aria-hidden>
        <img src={assetUrl(emblemas.emblema)} alt="" draggable={false} />
      </span>
    ));
  return (
    <>
      {rebota && zona && (
        <img
          key={`zona-${rebota.n}`}
          className="emblema-zona"
          src={src}
          alt=""
          draggable={false}
          aria-hidden
          style={{
            maskImage: mascara(zona, proporcion),
            WebkitMaskImage: mascara(zona, proporcion),
            transformOrigin: `${zona.x}% ${zona.y}%`,
          }}
        />
      )}
      {lista.map((e, i) => (
        <button
          key={`${clave}-${i}`}
          type="button"
          className={`emblema-18 ${rebota?.i === i ? 'rebota' : ''}`}
          style={{ left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%` }}
          onClick={(ev) => {
            ev.stopPropagation();
            // Hasta que no termina el rebote, no se puede volver a tocar.
            if (rebota) return;
            playChip('boing');
            setRebota((r) => ({ i, n: (r?.n ?? 0) + 1 }));
            onToque?.();
          }}
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
      ))}
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
}: {
  capa: Capa;
  src: string;
  contener?: boolean;
  vapor?: boolean;
  /** Solo la censura, sin tocarse (las miniaturas). */
  fijos?: boolean;
  /** Al tocar un emblema (en la galería, el personaje se queja). */
  onToque?: () => void;
}) {
  return (
    <div className={`fondo-capas ${contener ? 'fondo-capas-contener' : ''}`}>
      <div className="fondo-capas-caja" style={{ '--r': capa.proporcion } as CSSProperties}>
        <EmblemasTocables lista={capa.emblemas} clave={src} src={src} proporcion={capa.proporcion} onToque={onToque} fijos={fijos} />
      </div>
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
