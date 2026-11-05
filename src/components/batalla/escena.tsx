// Lo que se ve de la pelea: cada luchador en escena, su tarjeta, sus estados, el aviso del especial y la cuadrícula
// del fondo. Partido de Batalla.tsx (docs/CRONOGRAMA.md, «Ordenar el RPG»).
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useT } from '../../engine/i18n';
import { CARGA_LLENA, especialListo, xpParaSubir, type Especial, type Luchador } from '../../engine/batalla';
import { BASE, SpriteHoja, cargarHoja, rectSprite, type Hoja } from './sprites';

/**
 * La cuadrícula de cada fondo (src/data/fondos_batalla.json): dónde pisa cada uno, en % de la imagen. Con
 * `?cuadricula` en la dirección se ve la grilla y los puntos sobre la pelea, para ajustar un fondo nuevo.
 */
export type Casillas = { equipo: [number, number][]; rivales: [number, number][]; brillos?: [number, number][]; nebulosas?: [number, number, number][]; luces?: [number, number, number, string?][] };
const VER_CUADRICULA = typeof location !== 'undefined' && new URLSearchParams(location.search).has('cuadricula');

/**
 * Con cuadrícula, la escena es una caja del mismo tamaño y lugar que la imagen del fondo (así el % de la imagen es
 * el % de la caja). Con `?cuadricula`, encima se ve la grilla (cada 5 %, con números cada 10 %) y las casillas.
 */
export function CajaCasillas({ casillas, r, children }: { casillas?: Casillas; r: number; children: React.ReactNode }) {
  if (!casillas) return <>{children}</>;
  return (
    <div className="batalla-casillas" style={{ '--r': r } as CSSProperties}>
      {children}
      {VER_CUADRICULA && (
        <div className="batalla-cuadricula" aria-hidden>
          {Array.from({ length: 19 }, (_, i) => (i + 1) * 5).map((p) => (
            <span key={`x${p}`} className={`linea-x ${p % 10 ? '' : 'fuerte'}`} style={{ left: `${p}%` }}>
              {p % 10 ? '' : p}
            </span>
          ))}
          {Array.from({ length: 19 }, (_, i) => (i + 1) * 5).map((p) => (
            <span key={`y${p}`} className={`linea-y ${p % 10 ? '' : 'fuerte'}`} style={{ top: `${p}%` }}>
              {p % 10 ? '' : p}
            </span>
          ))}
          {(['equipo', 'rivales'] as const).flatMap((lado) =>
            casillas[lado].map(([x, y], i) => (
              <b key={`${lado}${i}`} className={`casilla ${lado}`} style={{ left: `${x}%`, top: `${y}%` }}>
                {lado === 'equipo' ? 'E' : 'R'}
                {i + 1}
              </b>
            )),
          )}
        </div>
      )}
    </div>
  );
}

/** Las etiquetas de los estados de un luchador (veneno, confusión, parálisis, protegido). */
export function EstadosDe({ l }: { l: Luchador }) {
  const t = useT();
  if (l.ps <= 0) return null;
  return (
    <>
      {l.envenenado && <span className="batalla-descansa veneno">{t('batalla.tag_veneno')}</span>}
      {l.confundido > 0 && <span className="batalla-descansa confundido">{t('batalla.confundido_tag')}</span>}
      {l.paralizado > 0 && <span className="batalla-descansa paralizado">{t('batalla.tag_paralizado')}</span>}
      {l.quemado > 0 && <span className="batalla-descansa quemado">{t('batalla.tag_quemado')}</span>}
      {l.congelado > 0 && <span className="batalla-descansa congelado">{t('batalla.tag_congelado')}</span>}
      {l.dormido > 0 && <span className="batalla-descansa dormido">{t('batalla.tag_dormido')}</span>}
      {l.desterrado > 0 && <span className="batalla-descansa desterrado">{t('batalla.tag_desterrado')}</span>}
      {l.protegido > 0 && <span className="batalla-descansa protegido">{t('batalla.tag_protegido')}</span>}
    </>
  );
}

/** Los números de un texto con la letra de 8 bits (en la otra, el 9 y el 4 o el 8 y la S se confunden). */
export function conNumeros(texto: string) {
  return texto.split(/(\d+)/).map((parte, i) => (i % 2 ? <span key={i} className="batalla-num">{parte}</span> : parte));
}

/** Un luchador en escena: su sprite animado, los números que saltan, su flecha si se lo está eligiendo. */
export function Figura({
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
  filtro,
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
  /** Un filtro sobre el sprite (placeholder con la hoja de otro). */
  filtro?: string;
}) {
  // Dónde está la cabeza (un poco arriba de los ojos, medido sobre el sprite en pantalla): ahí van los corazones
  // de la confusión. Los cuadros grandes (la sombra) tienen mucho aire arriba.
  const caja = useRef<HTMLDivElement | null>(null);
  const confundido = l.confundido > 0 && l.ps > 0 && !caido;
  const [cabeza, setCabeza] = useState<CSSProperties | undefined>(undefined);
  // La luz de los golpes, centrada en el cuerpo (no en el cuadro): los cuadros grandes, como el de la sombra, tienen
  // mucho aire arriba y la luz quedaba flotando encima. Los héroes se dibujan espejados.
  const [centro, setCentro] = useState<CSSProperties | undefined>(undefined);
  useEffect(() => {
    let vivo = true;
    void cargarHoja(sprite).then((h: Hoja | { cuadro: [number, number] }) => {
      if (!vivo || !('frameHeight' in h) || !h.cuerpo) return;
      const [x0, y0, x1, y1] = h.cuerpo;
      const cx = (((x0 + x1) / 2) / h.frameWidth) * 100;
      setCentro({
        '--lx': `${heroe ? 100 - cx : cx}%`,
        '--ly': `${(((y0 + y1) / 2) / h.frameHeight) * 100}%`,
        '--lw': `${Math.min(110, (((x1 - x0) / h.frameWidth) * 100) * 1.1)}%`,
      } as CSSProperties);
    });
    return () => {
      vivo = false;
    };
  }, [sprite, heroe]);
  useEffect(() => {
    if (!confundido || !especial?.ojos) return;
    let vivo = true;
    void cargarHoja(sprite).then((h: Hoja | { cuadro: [number, number] }) => {
      const f = caja.current;
      const r = rectSprite(f?.querySelector('.batalla-sprite'));
      if (!vivo || !f || !r || !('frameHeight' in h)) return;
      const base = f.getBoundingClientRect();
      setCabeza({ top: r.top - base.top + ((especial.ojos![1] - 16) / h.frameHeight) * r.height });
    });
    return () => {
      vivo = false;
    };
  }, [confundido, sprite, especial]);
  return (
    <div
      ref={(el) => {
        caja.current = el;
        refFigura(el);
      }}
      className={`batalla-figura ${heroe ? 'heroe' : 'enemigo'} ${l.desterrado ? 'desterrado' : ''} ${jefe ? 'jefe' : ''} ${l.clon !== undefined ? 'clon' : ''} ${marcado ? 'marcado' : ''} ${alto ? 'en-aire' : ''} ${l.envenenado && l.ps > 0 ? 'envenenado' : ''} ${l.protegido > 0 && l.ps > 0 ? 'protegido' : ''} anim-${anim} ${luces.length ? 'golpeado' : ''} ${activo ? 'activo' : ''} ${caido ? 'ko' : ''} ${efecto ?? ''} ${desliz && (desliz.x || desliz.y) ? 'deslizando' : ''}`}
      style={
        {
          ...(desliz ? { '--dx': `${desliz.x}px`, '--dy': `${desliz.y}px` } : {}),
          ...(desliz?.ms ? { '--dt': `${desliz.ms}ms` } : {}),
          '--alto': `${-alto}px`,
          ...(especial ? { '--c': especial.color } : {}),
          ...centro,
          '--e': escala,
        } as CSSProperties
      }
    >
      {marcado && <span className="batalla-flecha" aria-hidden>▼</span>}
      {l.envenenado && l.ps > 0 && (
        <span className="batalla-humo" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} style={{ '--i': i } as CSSProperties} />
          ))}
        </span>
      )}
      {(efecto === 'sube-stat' || efecto === 'baja-stat' || efecto === 'cura') && (
        <span className={`batalla-aura-stat ${efecto}`} aria-hidden>
          {Array.from({ length: 9 }, (_, i) => (
            <i key={i} style={{ '--i': i, '--x': `${8 + ((i * 37) % 84)}%` } as CSSProperties} />
          ))}
        </span>
      )}
      {l.confundido > 0 && l.ps > 0 && !caido && (
        <span className="batalla-confusion" style={cabeza} aria-hidden>
          <span>♥</span>
          <span>♥</span>
          <span>♥</span>
        </span>
      )}
      {/* Sombra en el piso: lo despega del fondo. */}
      <span className="batalla-sombra" aria-hidden />
      {filtro ? (
        <div className="batalla-filtro" style={{ filter: filtro }}>
          <SpriteHoja src={sprite} anim={quieto ? 'idle' : anim} vez={vez} alCuadro={alCuadro} cuadroFijo={quieto ? 0 : undefined} />
        </div>
      ) : (
        <SpriteHoja src={sprite} anim={quieto ? 'idle' : anim} vez={vez} alCuadro={alCuadro} cuadroFijo={quieto ? 0 : undefined} />
      )}
      {luces.map((x) => (
        <span key={x.key} className={`batalla-golpe-luz ${x.fuerte ? 'fuerte' : ''}`} style={{ '--c': x.color } as CSSProperties} aria-hidden />
      ))}
      {!heroe && !caido && (
        <span className="batalla-vida" aria-hidden>
          <small>{etiqueta}</small>
          <span className="batalla-barra ps" style={{ '--v': `${(l.ps / l.psMax) * 100}%` } as CSSProperties} />
          {/* Los estados del rival, debajo de su vida. */}
          <span className="batalla-estados-rival">
            <EstadosDe l={l} />
          </span>
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
 * El aviso del especial: una franja en el medio con un fondo de velocidad del color del personaje y sus ojos (el
 * pedazo de su hoja donde están, en grande).
 */
export function AvisoEspecial({ e, sprite, heroe }: { e: Especial; sprite: string; heroe: boolean }) {
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
export function Tarjeta({
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
      </b>
      {/* Los estados flotan encima de la tarjeta: así la tarjeta no cambia de tamaño. */}
      <span className="batalla-estados">
        {h.extra > 0 && <span className="batalla-extra">ATQ +{h.extra}</span>}
        {h.extraDef > 0 && <span className="batalla-extra def">DEF +{h.extraDef}</span>}
        {descansa && <span className="batalla-descansa">{t('batalla.descansa')}</span>}
        <EstadosDe l={h} />
      </span>
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
