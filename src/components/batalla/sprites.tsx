// Los sprites del combate: las hojas (sus animaciones), cómo se cargan y cómo se dibuja una animando sus cuadros.
// Partido de Batalla.tsx (docs/CRONOGRAMA.md, «Ordenar el RPG»).
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties } from 'react';

export const BASE = import.meta.env.BASE_URL;

/** Las animaciones de un luchador en escena (las filas de su hoja que usa el combate). */
export type Anim = 'idle' | 'mover' | 'salto' | 'ataque' | 'daño' | 'ko' | 'victoria' | 'especial' | 'agachada' | 'llorando' | 'paralizado' | 'golpeado' | 'aura';

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
  /**
   * El especial del Capitán: en los cuadros en que el rayo sale del cuadro, dónde corta el borde ([x, y]), hacia dónde
   * sigue (radianes) y su grosor. El juego lo continúa, ondulado, hasta el borde de la pantalla.
   */
  rayo?: Record<string, [number, number, number, number]>;
  /** El pecho: sin dirección anotada, la bala sale en la dirección pecho → punta de la pistola. */
  ancla_disparo?: [number, number];
  /** De dónde nace el corazoncito de la victoria ([x, y] en el cuadro: Nikki, entre los labios y la palma). */
  corazon_victoria?: [number, number];
  /** Dónde está el cuerpo en reposo, en el cuadro ([x0, y0, x1, y1]): para centrar la luz de los golpes y la galería. */
  cuerpo?: [number, number, number, number];
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
  proyectiles?: Record<
    string,
    {
      imagen: string;
      cuadro: number;
      x: number;
      y: number;
      ancho: number;
      alto: number;
      /** Antes de soltarlo, por cuadro: dónde está en la mano ([x, y] del centro) y a qué escala. */
      pista?: Record<string, [number, number, number]>;
    }
  >;
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

/** Un sprite de un solo cuadro (el monstruo, por ahora). */
export interface Quieto {
  cuadro: [number, number];
}
export const hojas = new Map<string, Promise<Hoja | Quieto>>();
export const cargarHoja = (src: string) => {
  if (!hojas.has(src)) hojas.set(src, fetch(`${BASE}${src}.json`).then((r) => r.json()));
  return hojas.get(src)!;
};

/**
 * Una hoja de animaciones (filas: idle, mover, ataque, daño…), cuadro a cuadro según su .json. En reposo, cada
 * tanto pestañea (la fila «pestaneo», si la hoja la tiene).
 */
/** La pelea en pausa: los sprites se quedan quietos en su cuadro. */
export const PausaContexto = createContext(false);

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
  const pausada = useContext(PausaContexto);
  useEffect(() => {
    void cargarHoja(src).then(setHoja);
  }, [src]);
  const anims = hoja && 'animations' in hoja ? hoja.animations : null;
  // Quieto en un cuadro (pausa del probador o el cebo): tampoco pestañea.
  const reposo = anim === 'idle' && !!anims?.pestaneo && cuadroFijo === undefined;
  // Pestañeo: cada 2,2 a 6 segundos, una vez.
  useEffect(() => {
    if (!reposo || pausada) return setPestanea(false);
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
  }, [reposo, anims, pausada]);
  const nombre =
    // Al ganar: su fila «victoria» (Cami se sonroja de fastidio; Nikki, un beso corto con un corazoncito) o, si no la
    // tiene (Jair, Rikka), el salto en bucle.
    anim === 'victoria'
      ? anims?.victoria
        ? 'victoria'
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
    if (pausada) return;
    setCuadro(0);
    if (!a || cuadroFijo !== undefined) return;
    const n = a.seq?.length ?? a.frames;
    const timer = setInterval(
      () => setCuadro((c) => (a.loop || bucle || anim === 'victoria' ? (c + 1) % n : Math.min(n - 1, c + 1))),
      1000 / (a.fps * velocidad),
    );
    return () => clearInterval(timer);
  }, [a, anim, vez, bucle, velocidad, cuadroFijo, pausada]);
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
  // La victoria de Nikki: al empezar cada beso sale, desde la boca y la palma (el primer punto de la pista del corazón
  // del ataque), un corazoncito rojo con brillos que avanza unos pasos y se disuelve (no cruza la pantalla). La fila
  // de la victoria no tiene los cuadros con el corazón grande dibujado.
  const corazonVictoria = nombre === 'victoria' && hoja && 'animations' in hoja ? hoja.proyectiles?.beso : undefined;
  const [corazon, setCorazon] = useState(0);
  useEffect(() => {
    if (corazonVictoria && paso === 0) setCorazon((n) => n + 1);
  }, [paso, corazonVictoria]);
  const origenCorazon =
    (hoja && 'animations' in hoja ? hoja.corazon_victoria : undefined) ?? (corazonVictoria?.pista ? Object.values(corazonVictoria.pista)[0] : undefined);
  // Saltar (al esquivar, o al ganar sin fila de victoria) con una hoja que no tiene la fila «salto» (la sombra, el
  // Capitán, Nikki, las imágenes quietas): el salto lo hace el código, el sprite sube y baja, y la sombra se achica.
  const saltaCodigo = (anim === 'salto' || (anim === 'victoria' && !anims?.victoria)) && !anims?.salto;
  const claseSalto = saltaCodigo ? ` salto-codigo${anim === 'victoria' ? ' en-bucle' : ''}` : '';
  if (!hoja) return <span className="batalla-sprite" />;
  if (!('animations' in hoja)) {
    const [w, h] = hoja.cuadro;
    return <span key={vez} className={`batalla-sprite${claseSalto}`} style={{ width: w, height: h, backgroundImage: `url(${BASE}${src}.png)` }} />;
  }
  if (!a) return <span className="batalla-sprite" />;
  return (
    <span
      key={saltaCodigo ? vez : undefined}
      className={`batalla-sprite${claseSalto}`}
      style={
        {
          width: hoja.frameWidth,
          height: hoja.frameHeight,
          backgroundImage: `url(${BASE}${src}.png)`,
          backgroundPosition: `-${x * hoja.frameWidth}px -${y * hoja.frameHeight}px`,
          ...(corazonVictoria ? { position: 'relative' } : {}),
        } as CSSProperties
      }
    >
      {corazonVictoria && corazon > 0 && (
        <span
          key={corazon}
          className="corazon-victoria"
          style={
            {
              // Centrado en la boca y la palma.
              left: (origenCorazon?.[0] ?? corazonVictoria.x + corazonVictoria.ancho / 2) - corazonVictoria.ancho / 2,
              top: (origenCorazon?.[1] ?? corazonVictoria.y + corazonVictoria.alto / 2) - corazonVictoria.alto / 2,
              width: corazonVictoria.ancho,
              height: corazonVictoria.alto,
              backgroundImage: `url(${BASE}${corazonVictoria.imagen}.png)`,
            } as CSSProperties
          }
          aria-hidden
        />
      )}
    </span>
  );
}
