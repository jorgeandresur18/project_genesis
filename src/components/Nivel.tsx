import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import '@fontsource/press-start-2p/400.css';
import '@fontsource/pixelify-sans/400.css';
import '@fontsource/pixelify-sans/600.css';
import { useStore } from '../engine/store';
import { useT } from '../engine/i18n';
import { playGlitch, playSelect, startTyping, stopTyping } from '../engine/sound';
import type { DatosNivel, DialogoNivel, EstadoNivel, Mando } from '../game/bastion';
import { PixelTexto } from './PixelTexto';

/**
 * Nivel de acción dentro de la historia (ver `nivel` en la escena; docs/SPEC.md). Antes de jugar: los controles,
 * una transición glitch de 8 bits y la tarjeta del nivel («NIVEL 1-1», como en los juegos de plataformas: es para
 * el jugador; ellos no saben que están en un juego). Durante el juego: la vida, la batería y el jefe arriba, los
 * diálogos abajo (con el sonido de escritura de la novela), la pausa y los botones táctiles. El juego en sí
 * (Phaser) se descarga durante la transición.
 */
const NIVELES = import.meta.glob<DatosNivel>('../data/niveles/*.json', { eager: true, import: 'default' });
const BASE = import.meta.env.BASE_URL;
const GLITCH_MS = 900;
const TARJETA_MS = 2600;

type Fase = 'inicio' | 'glitch' | 'tarjeta' | 'jugando' | 'pausa';

export function Nivel({ id, onGanar, onPerder }: { id: string; onGanar: () => void; onPerder: () => void }) {
  const t = useT();
  const datos = NIVELES[`../data/niveles/${id}.json`];
  const reducirEfectos = useStore((s) => s.settings.reduceEffects);
  const velocidad = useStore((s) => s.settings.textSpeed);
  const [fase, setFase] = useState<Fase>('inicio');
  const faseRef = useRef<Fase>(fase);
  faseRef.current = fase;
  const [estado, setEstado] = useState<EstadoNivel | null>(null);
  const [linea, setLinea] = useState<DialogoNivel | null>(null);
  const [caraJair, setCaraJair] = useState('');
  const lienzo = useRef<HTMLDivElement>(null);
  const control = useRef<{ pausar: (p: boolean) => void; destruir: () => void } | null>(null);
  const listo = useRef(false);
  const mando = useRef<Mando>({ izq: false, der: false, saltar: false, atacar: false, cambiar: false, abajo: false });
  // Los callbacks pueden cambiar entre renders; el juego llama siempre al último.
  const fin = useRef({ onGanar, onPerder });
  fin.current = { onGanar, onPerder };

  const empezar = () => {
    playSelect();
    setFase('glitch');
    if (!reducirEfectos) playGlitch();
    // Mientras duran la transición y la tarjeta, se descarga y se arma el juego (en pausa).
    void import('../game/bastion').then(({ crearNivel }) => {
      if (!lienzo.current) return;
      control.current = crearNivel(lienzo.current, {
        datos,
        mando: mando.current,
        reducirEfectos,
        onEstado: setEstado,
        onDialogo: (l) => setLinea(l),
        onListo: ({ jair }) => {
          setCaraJair(jair);
          listo.current = true;
          // Si la tarjeta todavía está, el juego espera.
          if (faseRef.current !== 'jugando') control.current?.pausar(true);
        },
        onGanar: () => fin.current.onGanar(),
        onPerder: () => fin.current.onPerder(),
      });
    });
    setTimeout(() => setFase('tarjeta'), reducirEfectos ? 0 : GLITCH_MS);
  };
  // La tarjeta se va sola y empieza el juego.
  useEffect(() => {
    if (fase !== 'tarjeta') return;
    const timer = setTimeout(() => {
      setFase('jugando');
      if (listo.current) control.current?.pausar(false);
    }, TARJETA_MS);
    return () => clearTimeout(timer);
  }, [fase]);

  /** Pausa o sigue. */
  const pausar = (p: boolean) => {
    if (!control.current) return;
    setFase((f) => {
      if (f !== 'jugando' && f !== 'pausa') return f;
      control.current?.pausar(p);
      return p ? 'pausa' : 'jugando';
    });
  };
  // Escape o P: pausa (y no llegan al resto del juego). Al cambiar de pestaña, se pausa solo.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'Escape' && e.key.toLowerCase() !== 'p') || !control.current) return;
      e.stopPropagation();
      pausar(faseRef.current === 'jugando');
    };
    const onOculta = () => document.hidden && pausar(true);
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('visibilitychange', onOculta);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.removeEventListener('visibilitychange', onOculta);
    };
  }, []);
  useEffect(() => () => control.current?.destruir(), []);

  /** Un botón táctil: aprieta mientras el dedo está encima. */
  const boton = (k: keyof Mando, label: string, simbolo: string, clase = '') => {
    const set = (v: boolean) => (e: ReactPointerEvent) => {
      e.preventDefault();
      mando.current[k] = v;
    };
    return (
      <button
        type="button"
        className={`nivel-tecla ${clase}`}
        aria-label={label}
        onPointerDown={set(true)}
        onPointerUp={set(false)}
        onPointerCancel={set(false)}
        onPointerLeave={set(false)}
        onContextMenu={(e) => e.preventDefault()}
      >
        {simbolo}
      </button>
    );
  };

  const controles = (
    <dl className="nivel-controles">
      <dt>← → · A D</dt>
      <dd>{t('nivel.c_mover')}</dd>
      <dt>↑ · W · {t('nivel.espacio')}</dt>
      <dd>{t('nivel.c_saltar')}</dd>
      <dt>J · X · Z</dt>
      <dd>{t('nivel.c_atacar')}</dd>
      <dt>Q · K · Shift · Tab</dt>
      <dd>{t('nivel.c_cambiar')}</dd>
      <dt>↓ · S</dt>
      <dd>{t('nivel.c_pisoton')}</dd>
      <dt>Esc · P</dt>
      <dd>{t('nivel.c_pausa')}</dd>
    </dl>
  );

  const jugando = fase === 'jugando' || fase === 'pausa';
  return (
    <div className="nivel" role="dialog" aria-label={datos.titulo}>
      <div className={`nivel-lienzo ${jugando ? '' : 'oculto'}`} ref={lienzo} />
      {jugando && estado && (
        <Hud estado={estado} caraJair={caraJair} textos={{ blaster: t('nivel.blaster'), descargado: t('nivel.descargado'), jefe: t('nivel.jefe') }} />
      )}
      {jugando && linea && <CajaDialogo key={`${linea.evento}-${linea.texto}`} linea={linea} velocidad={velocidad} pausado={fase === 'pausa'} />}
      {fase === 'jugando' && (
        <button type="button" className="nivel-pausa-boton" aria-label={t('nivel.pausa')} onClick={() => pausar(true)}>
          ❚❚
        </button>
      )}
      {fase === 'jugando' && (
        <div className="nivel-tactil" aria-hidden>
          <span className="nivel-cruz">
            {boton('izq', t('nivel.t_izq'), '◀')}
            {boton('abajo', t('nivel.t_abajo'), '▼')}
            {boton('der', t('nivel.t_der'), '▶')}
          </span>
          <span className="nivel-acciones">
            {boton('cambiar', t('nivel.t_cambiar'), '⇄', 'nivel-cambiar')}
            {boton('atacar', t('nivel.t_atacar'), '✊', 'nivel-atacar')}
            {boton('saltar', t('nivel.t_saltar'), '▲', 'nivel-saltar')}
          </span>
        </div>
      )}
      {fase === 'inicio' && (
        <div className="nivel-panel">
          <p className="nivel-titulo">{datos.titulo}</p>
          <p className="nivel-sub">{datos.subtitulo}</p>
          <p>{t('nivel.jair')}</p>
          <p>{t('nivel.cami')}</p>
          <p className="nivel-seccion">{t('nivel.controles')}</p>
          {controles}
          <p className="nivel-aviso">{t('nivel.aviso')}</p>
          <button type="button" className="nivel-boton" onClick={empezar} autoFocus>
            {t('nivel.empezar')}
          </button>
        </div>
      )}
      {fase === 'glitch' && <div className="nivel-glitch" aria-hidden />}
      {fase === 'tarjeta' && (
        <div className="nivel-tarjeta">
          <p className="nivel-tarjeta-numero">{t('nivel.tarjeta', { n: datos.tarjeta.numero })}</p>
          <p className="nivel-tarjeta-nombre">{datos.tarjeta.nombre}</p>
          <span className="nivel-tarjeta-caras">
            <span className="nivel-cara nivel-cara-jair" style={caraJair ? { backgroundImage: `url(${caraJair})` } : undefined} />
            <span className="nivel-cara nivel-cara-cami" style={{ backgroundImage: `url(${BASE}nivel/cami.png)` }} />
          </span>
        </div>
      )}
      {fase === 'pausa' && <div className="nivel-velo" />}
      {fase === 'pausa' && (
        <div className="nivel-panel">
          <PixelTexto className="nivel-pausa-titulo" texto={t('nivel.pausa_pixel')} color="#e8e2d4" />
          {controles}
          <button
            type="button"
            className="nivel-boton"
            autoFocus
            onClick={() => {
              playSelect();
              pausar(false);
            }}
          >
            {t('nivel.continuar')}
          </button>
        </div>
      )}
    </div>
  );
}

/** Arriba: quién va adelante, la vida, la batería del blaster y, en la arena, la vida del jefe. */
function Hud({
  estado,
  caraJair,
  textos,
}: {
  estado: EstadoNivel;
  caraJair: string;
  textos: { blaster: string; descargado: string; jefe: string };
}) {
  return (
    <>
      <div className="nivel-hud">
        <span className="nivel-hud-caras">
          <span
            className={`nivel-cara nivel-cara-jair ${estado.activo === 'jair' ? 'activa' : ''}`}
            style={caraJair ? { backgroundImage: `url(${caraJair})` } : undefined}
          />
          <span
            className={`nivel-cara nivel-cara-cami ${estado.activo === 'cami' ? 'activa' : ''}`}
            style={{ backgroundImage: `url(${BASE}nivel/cami.png)` }}
          />
        </span>
        <span className="nivel-hud-datos">
          <span className="nivel-vida" aria-label={`${estado.vida}/${estado.vidaMax}`}>
            {Array.from({ length: estado.vidaMax }, (_, i) => (
              <i key={i} className={i < estado.vida ? 'llena' : ''} />
            ))}
          </span>
          <span className={`nivel-bateria ${estado.descargado ? 'descargada' : ''}`}>
            <small>{estado.descargado ? textos.descargado : textos.blaster}</small>
            <b style={{ '--carga': `${estado.bateria}%` } as CSSProperties} />
          </span>
        </span>
      </div>
      {estado.jefe && (
        <div className="nivel-jefe">
          <small>{textos.jefe}</small>
          <b style={{ '--vida': `${(estado.jefe.vida / estado.jefe.max) * 100}%` } as CSSProperties} />
        </div>
      )}
    </>
  );
}

/** La caja de diálogo de abajo: el nombre y el texto que se escribe, con el sonido de la novela. */
function CajaDialogo({ linea, velocidad, pausado }: { linea: DialogoNivel; velocidad: number; pausado: boolean }) {
  const [n, setN] = useState(0);
  const total = linea.texto.length;
  const escribiendo = !pausado && n < total;
  useEffect(() => {
    if (!escribiendo) return;
    startTyping();
    const paso = Math.max(12, Math.round(1000 / Math.max(10, velocidad)));
    const timer = setInterval(() => setN((k) => Math.min(total, k + 1)), paso);
    return () => {
      clearInterval(timer);
      stopTyping();
    };
  }, [escribiendo, total, velocidad]);
  const voz = linea.quien === 'Voz';
  return (
    <div className={`nivel-dialogo ${voz ? 'voz' : ''}`} data-quien={linea.quien}>
      {!voz && <b>{linea.quien}</b>}
      <p>
        {voz && '> '}
        {linea.texto.slice(0, n)}
        <span className="nivel-dialogo-resto">{linea.texto.slice(n)}</span>
      </p>
    </div>
  );
}
