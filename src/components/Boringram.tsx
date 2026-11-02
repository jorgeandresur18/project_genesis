import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ArticuloVista, Boringplace } from './Boringplace';
import { createPortal } from 'react-dom';
import { useStore } from '../engine/store';
import { assetUrl, isPlaceholder } from '../engine/assets';
import {
  AHORRA_DATOS_KEY,
  AVION_KEY,
  chatKey,
  LINTERNA_KEY,
  LINTERNA_OLVIDADA_KEY,
  NO_MOLESTAR_KEY,
  SIEMPRE_ACTIVOS_KEY,
  postKey,
  storyKey,
  TUTORIAL_KEY,
  useBoringram,
  type Perfil,
  type Publicacion,
} from '../engine/boringram';
import { playCancel, playSelect } from '../engine/sound';
import { enterPlayMode, enterPortraitMode, isTouch, releaseOrientation } from '../engine/mobile';
import pantallas from '../data/pantallas.json';
import { NewDot } from './CgGallery';
import { KeyboardField, KeyboardProvider } from './PhoneKeyboard';
import s from './Boringram.module.css';

type View =
  | { kind: 'feed' }
  | { kind: 'mensajes' }
  | { kind: 'perfil'; id: string }
  | { kind: 'post'; id: string; back: View }
  | { kind: 'story'; id: string; back: View }
  | { kind: 'chat'; id: string }
  | { kind: 'tienda' }
  | { kind: 'articulo'; id: string };

type B = ReturnType<typeof useBoringram>;

/** Al abrir: el logo sobre negro y, un instante, el esqueleto de la app cargando. */
// El celular sube con la pantalla apagada (RISE_MS); después se prende con el logo.
const RISE_MS = 600;
const BOOT_LOGO_MS = 900 + RISE_MS;
const BOOT_SKELETON_MS = 650;
const CLOSE_MS = 700;

/**
 * Extras › Boringram: el celular de Jair, a pantalla completa y en vertical. Se llena con lo que pasa
 * en la historia. Se cierra con «Cerrar» (o Escape).
 */
export function BoringramScreen({ onClose }: { onClose: () => void }) {
  const b = useBoringram();
  const reduce = useStore((st) => st.settings.reduceEffects);
  const [boot, setBoot] = useState<'logo' | 'skeleton' | 'app'>(reduce ? 'app' : 'logo');
  const [closing, setClosing] = useState(false);
  const [shade, setShade] = useState(false);
  const torch = useTorch(b.ahora);
  const aj = useStore((st) => st.boringramAjustes);
  const setAj = useStore((st) => st.setBoringramAjustes);
  const evento = useStore((st) => st.markBoringramEvento);
  // El wifi y los datos siempre vuelven prendidos. Al salir en modo avión, o con el wifi o los datos
  // apagados, la primera vez llega su notificación (con aviso en el menú o en el juego).
  const ahoraRef = useRef(b.ahora);
  ahoraRef.current = b.ahora;
  useEffect(() => {
    const reset = () => {
      const prev = useStore.getState().boringramAjustes;
      if (prev.avion || !prev.wifi || !prev.datos) setAj({ avion: false, wifi: true, datos: true });
      return prev;
    };
    reset();
    return () => {
      const prev = reset();
      if (prev.avion) evento(AVION_KEY, ahoraRef.current);
      else if (!prev.wifi || !prev.datos) evento(SIEMPRE_ACTIVOS_KEY, ahoraRef.current);
    };
    // Solo al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggleAjuste = (icon: string) => {
    if (icon === 'linterna') return void torch.toggle();
    const on = !aj[icon];
    if (icon === 'avion') {
      if (on && torch.on) void torch.toggle();
      return setAj(
        on ? { avion: true, wifi: false, datos: false, bluetooth: false } : { avion: false, wifi: true, datos: true },
      );
    }
    // Los datos no funcionan en modo avión: prenderlos lo quita (el wifi y el bluetooth sí se pueden).
    if (icon === 'datos' && on && aj.avion) return setAj({ datos: true, avion: false });
    if (icon === 'no_molestar' && on) evento(NO_MOLESTAR_KEY, b.ahora);
    setAj({ [icon]: on });
  };
  const net = {
    online: !!(aj.wifi || aj.datos),
    msg: aj.avion ? b.data.textos.sin_red_avion : b.data.textos.sin_red,
    // Solo con datos (sin wifi): la primera vez que da me gusta, comenta o comparte, llega el aviso de ahorrar datos.
    usar: () => {
      if (!aj.wifi && aj.datos) evento(AHORRA_DATOS_KEY, b.ahora);
    },
  };
  // «Cómo usar» desde fuera del celular: cada toque pide el recorrido otra vez.
  const [tourRequest, setTourRequest] = useState(0);
  // Lupa (solo en computadora): la app en vertical a toda la altura, sin el marco del celular. Se recuerda.
  const [big, setBig] = useState(() => {
    try {
      return localStorage.getItem(BIG_KEY) === '1';
    } catch {
      return false;
    }
  });
  const toggleBig = () => {
    playSelect();
    setBig((v) => {
      try {
        localStorage.setItem(BIG_KEY, v ? '0' : '1');
      } catch {
        // Sin almacenamiento: solo dura esta vez.
      }
      return !v;
    });
  };

  // En celular, Boringram va en vertical; al cerrarlo se suelta la orientación.
  useEffect(() => {
    void enterPortraitMode();
    return () => {
      if (useStore.getState().game) void enterPlayMode();
      else releaseOrientation();
    };
  }, []);

  useEffect(() => {
    if (boot === 'app') return;
    const timer = setTimeout(
      () => setBoot(boot === 'logo' ? 'skeleton' : 'app'),
      boot === 'logo' ? BOOT_LOGO_MS : BOOT_SKELETON_MS,
    );
    return () => clearTimeout(timer);
  }, [boot]);

  const close = () => {
    if (closing) return;
    playCancel();
    if (reduce) return onClose();
    setClosing(true);
    setTimeout(onClose, CLOSE_MS);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (shade) setShade(false);
      else close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div
      className={`${s.screen} ${closing ? s.closing : ''} ${big ? s.big : ''} ${torch.on && !torch.touch ? s.torchOn : ''}`}
    >
      {/* Easter egg: con la linterna prendida, detrás del celular se enciende una luz (en computadora). */}
      {torch.on && !torch.touch && <div className={s.torchGlow} aria-hidden />}
      <div className={s.phone}>
        {/* Pantalla apagada: se va al terminar de subir y vuelve al bloquear el celular. */}
        <div className={s.screenOff} aria-hidden>
          <svg viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" />
          </svg>
        </div>
        <StatusBar b={b} aj={aj} torch={torch.on} onPull={() => boot === 'app' && setShade(true)} />
        {shade && <Shade b={b} aj={aj} torch={torch.on} onTile={toggleAjuste} onClose={() => setShade(false)} />}
        {!shade && <HeadsUp b={b} onOpen={() => setShade(true)} />}
        {/* Celular sin linterna real (o sin permiso): la pantalla se ilumina. */}
        {torch.on && torch.touch && !torch.real && <div className={s.torchScreen} aria-hidden />}
        {boot === 'logo' ? (
          <div className={s.splash}>
            <img src={assetUrl(pantallas.boringram.logo)} alt="Boringram" draggable={false} />
          </div>
        ) : boot === 'skeleton' ? (
          <Skeleton label={b.data.textos.cargando} />
        ) : (
          <NetContext.Provider value={net}>
            <App b={b} tourRequest={tourRequest} onClose={close} />
          </NetContext.Provider>
        )}
      </div>
      {/* Celular en horizontal: se pide girarlo (solo se ve con CSS en esa situación). */}
      <div className={s.rotateHint} role="alert">
        <div className={s.rotatePhone} aria-hidden />
        <p>{b.data.textos.girar}</p>
        <p className={s.rotateNote}>{b.data.textos.girar_nota}</p>
      </div>
      {/* En computadora, fuera del celular; en el celular van en el menú ⋮ de la app. */}
      <div className={s.sideBtns}>
        <button className={s.closeBtn} onClick={close}>
          {b.data.textos.cerrar}
        </button>
        <button
          className={s.helpOut}
          data-tour="ayuda"
          onClick={() => {
            playSelect();
            setTourRequest((n) => n + 1);
          }}
        >
          <span aria-hidden>?</span> {b.data.textos.como_usar}
        </button>
        <button className={s.helpOut} onClick={toggleBig} aria-pressed={big}>
          <span aria-hidden>
            <svg viewBox="0 0 24 24">
              <circle cx="10.5" cy="10.5" r="6" />
              <path d={big ? 'M8 10.5h5M20 20l-5-5' : 'M8 10.5h5M10.5 8v5M20 20l-5-5'} />
            </svg>
          </span>{' '}
          {big ? b.data.textos.modo_celular : b.data.textos.ampliar}
        </button>
      </div>
    </div>
  );
}

const BIG_KEY = 'genesis-boringram-grande';

/**
 * Con Boringram abierto, una notificación nueva (de las que se ganan haciendo algo: me gusta solo con datos,
 * no molestar, la linterna…) baja desde arriba del celular un momento. Tocarla abre el panel.
 */
function HeadsUp({ b, onOpen }: { b: B; onOpen: () => void }) {
  const seen = useRef<Set<string> | null>(null);
  const [n, setN] = useState<B['notificaciones'][number] | null>(null);
  const ids = b.notificaciones.map((x) => x.id).join('|');
  useEffect(() => {
    const now = new Set(ids.split('|'));
    const fresh = seen.current ? b.notificaciones.filter((x) => x.clave && !seen.current!.has(x.id)) : [];
    seen.current = now;
    if (!fresh.length) return;
    setN(fresh[0]);
    const timer = setTimeout(() => setN(null), 3800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  if (!n) return null;
  return (
    <button
      key={n.id}
      className={s.headsUp}
      onClick={() => {
        setN(null);
        onOpen();
      }}
    >
      <span className={s.notifIcon}>{n.icono}</span>
      <span className={s.notifBody}>
        <small>
          {n.app} · {n.hace}
        </small>
        <b>{n.titulo}</b>
      </span>
    </button>
  );
}

/** Cada notificación que se va con «Borrar todo» sale un poco después que la anterior. */
const SWEEP_STEP_MS = 45;

/** Sin conexión (wifi y datos apagados, o modo avión): lo que necesita internet avisa y no se hace. */
const NetContext = createContext({ online: true, msg: '', usar: () => {} });
function useOffline() {
  const net = useContext(NetContext);
  const toast = useToast();
  return () => {
    if (net.online) {
      net.usar();
      return false;
    }
    playCancel();
    toast(net.msg);
    return true;
  };
}

/** Iconos de los ajustes rápidos (en el panel y, prendidos, en la barra de estado). */
function TileIcon({ kind, className = s.tileIcon }: { kind: string; className?: string }) {
  const paths: Record<string, ReactNode> = {
    wifi: <path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01" />,
    datos: <path d="M8 20V8M4 12l4-4 4 4M16 4v12M12 12l4 4 4-4" />,
    bluetooth: <path d="m7 7 10 10-5 5V2l5 5L7 17" />,
    linterna: <path d="M8 2h8v4l-2 4v11a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V10L8 6zM12 13v2M8 6h8" />,
    no_molestar: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M7.5 12h9" />
      </>
    ),
    avion: <path d="M10.5 21v-6L3 17v-2l7.5-5V4.5a1.5 1.5 0 0 1 3 0V10L21 15v2l-7.5-2v6l-1.5-1z" />,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {paths[kind]}
    </svg>
  );
}

/**
 * La linterna del panel. En computadora es un easter egg: una luz detrás del celular. En el celular intenta
 * prender la linterna de verdad (Chrome en Android, con permiso de cámara: es la única forma de llegar al flash);
 * si no se puede, la pantalla se ilumina.
 */
function useTorch(ahora: number) {
  const [on, setOn] = useState(false);
  const now = useRef(ahora);
  now.current = ahora;
  const [real, setReal] = useState(false);
  const stream = useRef<MediaStream | null>(null);
  const wanted = useRef(false);
  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setReal(false);
  };
  const onRef = useRef(false);
  onRef.current = on;
  // Al cerrar Boringram, la linterna se apaga (si quedó prendida, llega su notificación).
  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      if (onRef.current) useStore.getState().markBoringramEvento(LINTERNA_OLVIDADA_KEY, now.current);
    },
    [],
  );
  const toggle = async () => {
    const next = !on;
    wanted.current = next;
    setOn(next);
    if (!next) return stop();
    // La primera vez llega la notificación de la linterna (un desbloqueable más).
    useStore.getState().markBoringramEvento(LINTERNA_KEY, now.current);
    if (!window.matchMedia('(pointer: coarse)').matches || !navigator.mediaDevices?.getUserMedia) return;
    try {
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      const track = media.getVideoTracks()[0];
      const caps = track.getCapabilities?.() as (MediaTrackCapabilities & { torch?: boolean }) | undefined;
      if (!caps?.torch || !wanted.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] });
      stream.current = media;
      setReal(true);
    } catch {
      // Sin permiso o sin linterna: queda el efecto en la pantalla.
    }
  };
  // En pantallas táctiles (el celular), la luz va sobre la pantalla; en computadora, detrás del celular.
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  return { on, real, touch, toggle };
}

/**
 * Barra de estado: a la izquierda la hora y las notificaciones (Boringram si hay publicaciones o historias
 * nuevas, mensajes si hay chats nuevos y el correo lleno de spam); a la derecha la alarma, la señal, el wifi
 * y la batería con su porcentaje (la de la historia: 12 %, en rojo).
 */
function StatusBar({
  b,
  aj,
  torch,
  onPull,
}: {
  b: B;
  aj: Record<string, boolean>;
  torch: boolean;
  onPull: () => void;
}) {
  const c = b.estado;
  const low = c.bateria <= 15;
  // Se baja el panel de notificaciones arrastrando la barra hacia abajo (o tocándola).
  const start = useRef<number | null>(null);
  return (
    <div
      className={s.status}
      data-tour="barra"
      onPointerDown={(e) => {
        start.current = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (start.current !== null && e.clientY - start.current > 24) {
          start.current = null;
          onPull();
        }
      }}
      onPointerUp={() => {
        if (start.current !== null) onPull();
        start.current = null;
      }}
    >
      <span className={s.statusSide}>
        <span>{c.reloj}</span>
        {(b.newPosts.size > 0 || b.newStories.size > 0) && (
          <img className={s.statusApp} src={assetUrl('marca/boringram_icono.webp')} alt="" draggable={false} />
        )}
        {b.newChats.size > 0 && (
          <svg viewBox="0 0 24 24" className={s.statusIcon} aria-hidden>
            <path d="M4 5h16v11H9l-5 4z" fill="currentColor" />
          </svg>
        )}
        <svg viewBox="0 0 24 24" className={s.statusIcon} aria-hidden>
          <path d="M3 6h18v12H3z" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="m3 7 9 6 9-6" fill="none" stroke="currentColor" strokeWidth="2.2" />
        </svg>
        {/* La linterna va a la izquierda, con las notificaciones: a la derecha ya no cabe. */}
        {torch && <TileIcon kind="linterna" className={s.statusTile} />}
      </span>
      <span className={s.notch} />
      <span className={`${s.statusSide} ${s.statusRight}`}>
        {aj.no_molestar && <TileIcon kind="no_molestar" className={s.statusTile} />}
        {aj.bluetooth && <TileIcon kind="bluetooth" className={s.statusTile} />}
        <svg viewBox="0 0 24 24" className={s.statusIcon} aria-hidden>
          <circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path
            d="M12 9v4l2.5 2M5 4 2 7M19 4l3 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
        {aj.avion ? (
          <TileIcon kind="avion" className={s.statusTile} />
        ) : (
          <svg viewBox="0 0 24 24" className={s.statusIcon} aria-hidden>
            <rect x="2" y="15" width="3.6" height="5" rx="0.8" fill="currentColor" />
          <rect x="7.4" y="11" width="3.6" height="9" rx="0.8" fill="currentColor" />
          <rect x="12.8" y="7" width="3.6" height="13" rx="0.8" fill="currentColor" />
            <rect x="18.2" y="3" width="3.6" height="17" rx="0.8" fill="currentColor" opacity="0.35" />
          </svg>
        )}
        {aj.datos && !aj.wifi && <span className={s.statusData}>4G</span>}
        {aj.wifi && (
          <svg viewBox="0 0 24 24" className={s.statusIcon} aria-hidden>
            <path d="M2 9.5a15 15 0 0 1 20 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path
              d="M5.5 13a10 10 0 0 1 13 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path d="M9 16.5a5 5 0 0 1 6 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <circle cx="12" cy="19.6" r="1.6" fill="currentColor" />
          </svg>
        )}
        <span className={`${s.batteryText} ${low ? s.batteryLow : ''} ${c.ahorro ? s.batterySaver : ''}`}>
          {c.bateria}%
        </span>
        <span
          className={`${s.battery} ${low ? s.batteryLow : ''} ${c.ahorro ? s.batterySaver : ''}`}
          title={c.ahorro ? b.data.textos.ahorro : undefined}
        >
          <i style={{ width: `${c.bateria}%` }} />
        </span>
      </span>
    </div>
  );
}

/**
 * Panel de notificaciones: baja desde la barra de estado, con la hora grande, ajustes rápidos que se prenden
 * y apagan y las notificaciones (apps parodia; se desbloquean con la historia). Se cierra arrastrando hacia
 * arriba, con la manija o tocando fuera de la lista.
 */
function Shade({
  b,
  aj,
  torch,
  onTile,
  onClose,
}: {
  b: B;
  aj: Record<string, boolean>;
  torch: boolean;
  onTile: (icon: string) => void;
  onClose: () => void;
}) {
  const tx = b.data.textos;
  const c = b.estado;
  const [cleared, setCleared] = useState<string[]>([]);
  // «Borrar todo»: se van hacia un costado, una tras otra (al volver a abrir el panel, vuelven).
  const [sweeping, setSweeping] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const start = useRef<number | null>(null);
  const close = () => {
    if (leaving) return;
    playCancel();
    setLeaving(true);
    setTimeout(onClose, 220);
  };
  const list = b.notificaciones.filter((n) => !cleared.includes(n.id));
  return (
    <div
      className={`${s.shade} ${leaving ? s.shadeOut : ''}`}
      onPointerDown={(e) => (start.current = e.clientY)}
      onPointerMove={(e) => {
        if (start.current !== null && start.current - e.clientY > 40) {
          start.current = null;
          close();
        }
      }}
      onPointerUp={() => (start.current = null)}
    >
      <div className={s.shadeHead}>
        <span className={s.shadeClock}>{c.reloj}</span>
        <span className={s.shadeDay}>{c.dia}</span>
      </div>
      <div className={s.tiles}>
        {b.data.ajustes_rapidos.map((name, i) => {
          const icon = b.data.ajustes_iconos[i];
          const on = icon === 'linterna' ? torch : aj[icon];
          return (
            <button
              key={name}
              className={on ? s.tileOn : ''}
              aria-pressed={!!on}
              onClick={() => {
                playSelect();
                onTile(icon);
              }}
            >
              <TileIcon kind={icon} />
              {name}
            </button>
          );
        })}
      </div>
      <div className={s.notifHead}>
        <b>{tx.notificaciones}</b>
        {list.length > 0 && (
          <button
            disabled={sweeping}
            onClick={() => {
              playCancel();
              setSweeping(true);
              setTimeout(
                () => {
                  setCleared(list.map((n) => n.id));
                  setSweeping(false);
                },
                list.length * SWEEP_STEP_MS + 320,
              );
            }}
          >
            {tx.borrar_todo}
          </button>
        )}
      </div>
      <div className={s.notifList}>
        {list.length === 0 && <p className={s.empty}>{tx.sin_notificaciones}</p>}
        {list.map((n, i) => (
          <NotifCard
            key={n.id}
            n={n}
            sweeping={sweeping}
            delay={i * SWEEP_STEP_MS}
            onDismiss={() => setCleared((ids) => [...ids, n.id])}
          />
        ))}
      </div>
      <button className={s.shadeHandle} onClick={close} aria-label={tx.cerrar}>
        <i />
      </button>
    </div>
  );
}

/**
 * Una notificación del panel. Se borra deslizándola hacia un costado, como en el celular (si no pasa del
 * 30 % de su ancho, vuelve a su lugar). Igual que con «Borrar todo», al volver a abrir el panel regresa.
 */
function NotifCard({
  n,
  sweeping,
  delay,
  onDismiss,
}: {
  n: B['notificaciones'][number];
  sweeping: boolean;
  delay: number;
  onDismiss: () => void;
}) {
  const [dx, setDx] = useState(0);
  const [touched, setTouched] = useState(false);
  const [gone, setGone] = useState(0);
  const start = useRef<{ x: number; y: number; drag: boolean } | null>(null);
  const style: CSSProperties = sweeping
    ? { animationDelay: `${delay}ms` }
    : gone
      ? { transform: `translateX(${gone * 115}%)`, opacity: 0 }
      : { transform: dx ? `translateX(${dx}px)` : undefined, opacity: 1 - Math.min(Math.abs(dx) / 300, 0.6) };
  return (
    <div
      className={`${s.notif} ${sweeping ? s.notifOut : touched ? s.notifDrag : ''} ${start.current?.drag ? s.notifHeld : ''}`}
      style={style}
      onPointerDown={(e) => {
        if (!sweeping && !gone) start.current = { x: e.clientX, y: e.clientY, drag: false };
      }}
      onPointerMove={(e) => {
        const st = start.current;
        if (!st) return;
        const mx = e.clientX - st.x;
        if (!st.drag) {
          // Solo cuenta como deslizar si va más de lado que hacia arriba (eso cierra el panel).
          if (Math.abs(mx) < 8 || Math.abs(mx) < Math.abs(e.clientY - st.y)) return;
          st.drag = true;
          setTouched(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        e.stopPropagation();
        setDx(mx);
      }}
      onPointerUp={(e) => {
        const st = start.current;
        start.current = null;
        if (!st?.drag) return;
        e.stopPropagation();
        if (Math.abs(dx) > e.currentTarget.offsetWidth * 0.3) {
          playCancel();
          setGone(dx > 0 ? 1 : -1);
          setTimeout(onDismiss, 220);
        } else setDx(0);
      }}
      onPointerCancel={() => {
        start.current = null;
        setDx(0);
      }}
    >
      <span className={s.notifIcon}>
        {n.icono === 'bori' ? <img src={assetUrl('marca/boringram_icono.webp')} alt="" draggable={false} /> : n.icono}
      </span>
      <span className={s.notifBody}>
        <small>
          {n.app} · {n.hace}
        </small>
        <b>{n.titulo}</b>
        <span>{n.texto}</span>
      </span>
    </div>
  );
}

/** Imagen de Boringram; mientras falte el arte (PLACEHOLDER:<nombre>), un cuadro gris con su nombre. */
function Pic({ src, className = '' }: { src: string; className?: string }) {
  if (isPlaceholder(src))
    return <span className={`${s.picPlaceholder} ${className}`}>{src.replace('PLACEHOLDER:', '')}</span>;
  return <img className={className} src={assetUrl(src)} alt="" loading="lazy" draggable={false} />;
}

/** Varias fotos en una publicación: se pasan deslizando o con las flechas; abajo, un puntito por foto. */
function Carousel({
  b,
  slides,
  index,
  onIndex,
}: {
  b: B;
  slides: { imagen: string }[];
  index: number;
  onIndex: (i: number) => void;
}) {
  const tx = b.data.textos;
  const start = useRef<{ x: number; y: number } | null>(null);
  const go = (i: number) => {
    if (i < 0 || i >= slides.length) return;
    playSelect();
    onIndex(i);
  };
  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      className={`${s.carouselArrow} ${dir < 0 ? s.carouselPrev : s.carouselNext}`}
      aria-label={tx.carrusel.replace('{n}', String(index + dir + 1)).replace('{total}', String(slides.length))}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        go(index + dir);
      }}
    >
      {dir < 0 ? '‹' : '›'}
    </button>
  );
  return (
    <div
      className={s.carousel}
      onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const st = start.current;
        start.current = null;
        if (!st) return;
        const dx = e.clientX - st.x;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - st.y)) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className={s.carouselTrack} style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((x, i) => (
          <div key={i} className={s.carouselSlide} aria-hidden={i !== index}>
            <Pic src={x.imagen} />
          </div>
        ))}
      </div>
      <span className={s.carouselCount}>
        {index + 1}/{slides.length}
      </span>
      {index > 0 && arrow(-1)}
      {index < slides.length - 1 && arrow(1)}
      <div className={s.carouselDots} aria-hidden>
        {slides.map((_, i) => (
          <i key={i} className={i === index ? s.carouselDotOn : ''} />
        ))}
      </div>
    </div>
  );
}

/**
 * Lo que se comparte: la publicación (<id>) o, en un carrusel, la foto que se está viendo (<id>-2, <id>-3…;
 * cada una tiene su tarjeta en public/compartir, ver tools/compartir.mjs).
 */
const shareId = (id: string, slide: number) => (slide > 0 ? `${id}-${slide + 1}` : id);

/** Abre la ventana de compartir de una foto (ver ShareSheet). */
const ShareContext = createContext<(id: string) => void>(() => {});
/** Aviso de la app arriba del celular (p. ej. «no seas acosador»). */
const ToastContext = createContext<(text: string) => void>(() => {});
const useToast = () => useContext(ToastContext);
const useShare = () => useContext(ShareContext);

/**
 * Compartir una foto de verdad: muestra la miniatura que se verá en las redes (public/compartir/<id>.jpg,
 * con su página <id>.html, ver tools/compartir.mjs) y abre Facebook, Instagram, WhatsApp o X con el enlace y un
 * texto, o copia el enlace.
 */
function ShareSheet({ b, id, onClose }: { b: B; id: string; onClose: () => void }) {
  const tx = b.data.textos;
  const story = b.destacadas.find((x) => x.id === id);
  // Una foto de un carrusel (<id>-<n>): su publicación, con el texto de esa foto.
  const [, base, n] = /^(.*)-(\d+)$/.exec(id) ?? [];
  const slide = b.publicaciones.find((p) => p.id === base)?.carrusel?.[Number(n) - 1];
  const post =
    b.publicaciones.find((p) => p.id === id) ??
    (slide && { autor: b.publicaciones.find((p) => p.id === base)!.autor, texto: slide.texto ?? '' }) ??
    (story && { autor: story.autor, texto: story.texto });
  const [note, setNote] = useState('');
  if (!post) return null;
  const user = b.perfiles[post.autor]?.usuario ?? post.autor;
  const url = `${b.data.sitio}compartir/${id}.html?v=${b.data.compartir_version ?? 1}`;
  const text = `${tx.compartir_texto} · ${user}: «${post.texto}»`;
  const card = assetUrl(`compartir/${id}.jpg`);
  const open = (href: string) => {
    playSelect();
    window.open(href, '_blank', 'noopener,noreferrer');
  };
  const copy = async () => {
    playSelect();
    try {
      await navigator.clipboard.writeText(url);
      setNote(tx.copiado);
    } catch {
      setNote(url);
    }
  };
  // Instagram y Facebook no dejan que una web les escriba el texto: se copia el texto con el enlace en el mismo
  // toque, para pegarlo, y el enlace se ve con su miniatura (la tarjeta de public/compartir).
  const copiar = (t: string) => navigator.clipboard?.writeText(t).catch(() => {});
  // Instagram: en el celular, el menú de compartir del teléfono con el texto y el enlace (se elige Instagram y
  // llega como mensaje con la miniatura); en la computadora, se copian y se abren los mensajes de Instagram.
  const instagram = () => {
    playSelect();
    copiar(`${text} ${url}`);
    if (isTouch() && typeof navigator.share === 'function') {
      setNote(tx.instagram_nota_celular);
      navigator.share({ title: 'PROJECT GENESIS', text, url }).catch(() => {});
      return;
    }
    window.open('https://www.instagram.com/direct/inbox/', '_blank', 'noopener,noreferrer');
    setNote(tx.instagram_nota);
  };
  const facebook = () => {
    copiar(text);
    open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`);
    setNote(tx.facebook_nota);
  };
  const native = async () => {
    playSelect();
    await navigator.share?.({ title: 'PROJECT GENESIS', text, url }).catch(() => {});
  };
  return (
    <div className={s.sheetBackdrop} onClick={onClose}>
      <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
        <i className={s.sheetHandle} />
        <b className={s.sheetTitle}>{tx.compartir}</b>
        <a className={s.preview} href={url} target="_blank" rel="noreferrer">
          <img src={card} alt="" draggable={false} />
          <span>
            <b>{user} en Boringram · PROJECT GENESIS</b>
            <small>{new URL(b.data.sitio).host}</small>
          </span>
        </a>
        <div className={s.shareRow}>
          <button onClick={facebook}>
            <span className={s.shareFb}>f</span>Facebook
          </button>
          <button onClick={instagram}>
            <img className={s.shareImg} src={assetUrl('marca/redes/instagram.webp')} alt="" draggable={false} />
            Instagram
          </button>
          <button onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`)}>
            <img className={s.shareImg} src={assetUrl('marca/redes/whatsapp.webp')} alt="" draggable={false} />
            WhatsApp
          </button>
          <button
            onClick={() =>
              open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
            }
          >
            <img className={s.shareImg} src={assetUrl('marca/redes/x.webp')} alt="" draggable={false} />X
          </button>
          <button onClick={copy}>
            <span className={s.shareLink}>🔗</span>
            {tx.copiar_enlace}
          </button>
          {typeof navigator.share === 'function' && (
            <button onClick={native}>
              <span className={s.shareLink}>⋯</span>
              {tx.mas}
            </button>
          )}
        </div>
        {note && <p className={s.shareNote}>{note}</p>}
      </div>
    </div>
  );
}

/** Esqueleto mientras «carga»: bloques grises en lugar de la cabecera, la foto y el texto. */
function Skeleton({ label }: { label: string }) {
  return (
    <div className={s.skeleton} aria-label={label}>
      <div className={s.skBar} />
      {[0, 1].map((i) => (
        <div key={i} className={s.skPost}>
          <div className={s.skHead}>
            <i className={s.skAvatar} />
            <i className={s.skLine} style={{ width: '38%' }} />
          </div>
          <i className={s.skImage} />
          <i className={s.skLine} style={{ width: '70%' }} />
          <i className={s.skLine} style={{ width: '45%' }} />
        </div>
      ))}
      <div className={s.skNav}>
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}

/**
 * Se desplaza como un celular: sin barra, arrastrando con el mouse (y soltando con inercia). Con el dedo,
 * el navegador ya desplaza solo. Si se arrastró, el clic al soltar no cuenta.
 */
function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startY = 0;
    let startTop = 0;
    let lastY = 0;
    let lastT = 0;
    let speed = 0;
    let dragging = false;
    let moved = false;
    let frame = 0;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      cancelAnimationFrame(frame);
      dragging = true;
      moved = false;
      startY = lastY = e.clientY;
      startTop = el.scrollTop;
      lastT = performance.now();
      speed = 0;
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      if (Math.abs(e.clientY - startY) > 4) moved = true;
      el.scrollTop = startTop - (e.clientY - startY);
      const now = performance.now();
      speed = (lastY - e.clientY) / Math.max(1, now - lastT);
      lastY = e.clientY;
      lastT = now;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      let v = speed * 16;
      const glide = () => {
        if (Math.abs(v) < 0.4) return;
        el.scrollTop += v;
        v *= 0.94;
        frame = requestAnimationFrame(glide);
      };
      frame = requestAnimationFrame(glide);
    };
    const click = (e: MouseEvent) => {
      if (!moved) return;
      e.stopPropagation();
      e.preventDefault();
      moved = false;
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    el.addEventListener('click', click, true);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      el.removeEventListener('click', click, true);
    };
  }, []);
  return ref;
}

/**
 * Jalar para recargar: en el inicio, arrastrando hacia abajo desde arriba del todo (mouse o dedo) aparece
 * el icono girando; al soltar lo bastante abajo, «recarga» un momento y avisa que ya estás al día.
 */
function usePullToRefresh(ref: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
  const [pull, setPull] = useState(0);
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let startY: number | null = null;
    let current = 0;
    const begin = (y: number) => {
      if (el.scrollTop <= 0 && state === 'idle') startY = y;
    };
    const drag = (y: number, e?: Event) => {
      if (startY === null) return;
      const dy = y - startY;
      if (dy <= 0) {
        current = 0;
        setPull(0);
        return;
      }
      if (e && e.cancelable) e.preventDefault();
      current = Math.min(110, dy * 0.5);
      setPull(current);
    };
    const end = () => {
      if (startY === null) return;
      startY = null;
      if (current > 60) {
        setState('loading');
        setPull(56);
        setTimeout(() => {
          setState('done');
          setTimeout(() => {
            setState('idle');
            setPull(0);
          }, 900);
        }, 1000);
      } else setPull(0);
      current = 0;
    };
    const md = (e: PointerEvent) => e.pointerType === 'mouse' && begin(e.clientY);
    const mm = (e: PointerEvent) => e.pointerType === 'mouse' && drag(e.clientY);
    const ts = (e: TouchEvent) => begin(e.touches[0].clientY);
    const tm = (e: TouchEvent) => drag(e.touches[0].clientY, e);
    el.addEventListener('pointerdown', md);
    window.addEventListener('pointermove', mm);
    window.addEventListener('pointerup', end);
    el.addEventListener('touchstart', ts, { passive: true });
    el.addEventListener('touchmove', tm, { passive: false });
    el.addEventListener('touchend', end);
    return () => {
      el.removeEventListener('pointerdown', md);
      window.removeEventListener('pointermove', mm);
      window.removeEventListener('pointerup', end);
      el.removeEventListener('touchstart', ts);
      el.removeEventListener('touchmove', tm);
      el.removeEventListener('touchend', end);
    };
  }, [ref, enabled, state]);
  return { pull, state };
}

function App({ b, tourRequest, onClose }: { b: B; tourRequest: number; onClose: () => void }) {
  const tx = b.data.textos;
  const [view, setView] = useState<View>({ kind: 'feed' });
  const scroller = useDragScroll();
  const refresh = usePullToRefresh(scroller, view.kind === 'feed');
  const [sharing, setSharing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  const showToast = (text: string) => setToast({ key: Date.now(), text });
  const net = useContext(NetContext);
  // Cada vista empieza arriba, como al cambiar de pantalla en el celular.
  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [view, scroller]);
  const markOpened = useStore((st) => st.markGalleryOpened);
  const [tutorial, setTutorial] = useState(() => !useStore.getState().galleryOpened[TUTORIAL_KEY]);
  useEffect(() => {
    if (tourRequest > 0) setTutorial(true);
  }, [tourRequest]);
  const closeTutorial = () => {
    playCancel();
    markOpened(TUTORIAL_KEY);
    setTutorial(false);
    setView({ kind: 'feed' });
  };
  const go = (next: View) => {
    playSelect();
    setView(next);
  };
  const back = (to: View) => {
    playCancel();
    setView(to);
  };

  // Lo que se ve en el inicio deja de ser nuevo después de un momento (para que se alcance a ver la marca).
  useEffect(() => {
    if (view.kind !== 'feed') return;
    const timer = setTimeout(() => b.publicaciones.forEach((p) => markOpened(postKey(p.id))), 1500);
    return () => clearTimeout(timer);
  }, [view.kind, b.publicaciones, markOpened]);

  if (!b.unlocked) {
    return (
      <>
        <AppBar b={b} onClose={onClose} />
        <div className={s.noSignal}>
          <span className={s.noSignalIcon} aria-hidden>
            ✕
          </span>
          <b>{b.data.sin_senal.titulo}</b>
          <p>{b.data.sin_senal.texto}</p>
        </div>
      </>
    );
  }

  const onPerfil = (id: string) => {
    if (b.perfiles[id]) go({ kind: 'perfil', id });
  };
  const tab =
    view.kind === 'mensajes' || view.kind === 'chat'
      ? 'mensajes'
      : view.kind === 'tienda' || view.kind === 'articulo'
        ? 'tienda'
        : view.kind === 'perfil' && view.id === b.data.yo
        ? 'perfil'
        : 'inicio';
  return (
    <ShareContext.Provider
      value={(id) => {
        if (!net.online) {
          playCancel();
          return showToast(net.msg);
        }
        net.usar();
        playSelect();
        setSharing(id);
      }}
    >
      <ToastContext.Provider value={showToast}>
        <KeyboardProvider>
          <AppBar b={b} onClose={onClose} onHelp={() => setTutorial(true)} />
          <div className={s.content} ref={scroller} data-tour="inicio">
            {view.kind === 'feed' && (refresh.pull > 0 || refresh.state !== 'idle') && (
              <div className={s.pull} style={{ height: refresh.state === 'idle' ? refresh.pull : 56 }}>
                {refresh.state === 'done' ? (
                  <span className={s.pullDone}>✓ {tx.al_dia}</span>
                ) : (
                  <img
                    className={refresh.state === 'loading' ? s.pullSpin : ''}
                    style={
                      refresh.state === 'idle'
                        ? { transform: `rotate(${refresh.pull * 4}deg)`, opacity: refresh.pull / 60 }
                        : undefined
                    }
                    src={assetUrl('marca/boringram_icono.webp')}
                    alt=""
                    draggable={false}
                  />
                )}
              </div>
            )}
            {view.kind === 'feed' && (
              <Feed
                b={b}
                onPerfil={onPerfil}
                onPost={(id) => go({ kind: 'post', id, back: view })}
                onStory={(id) => go({ kind: 'story', id, back: view })}
              />
            )}
            {view.kind === 'perfil' && (
              <Profile
                b={b}
                id={view.id}
                onPost={(id) => go({ kind: 'post', id, back: view })}
                onStory={(id) => go({ kind: 'story', id, back: view })}
                onBack={view.id === b.data.yo ? undefined : () => back({ kind: 'feed' })}
              />
            )}
            {view.kind === 'post' && <PostView b={b} id={view.id} onBack={() => back(view.back)} onPerfil={onPerfil} />}
            {view.kind === 'mensajes' && <Inbox b={b} onChat={(id) => go({ kind: 'chat', id })} />}
            {view.kind === 'chat' && (
              <ChatView b={b} id={view.id} onBack={() => back({ kind: 'mensajes' })} onPerfil={onPerfil} />
            )}
            {view.kind === 'tienda' && <Boringplace onArticulo={(id) => go({ kind: 'articulo', id })} />}
            {view.kind === 'articulo' && <ArticuloVista id={view.id} onBack={() => back({ kind: 'tienda' })} onToast={showToast} />}
          </div>
          {sharing && <ShareSheet b={b} id={sharing} onClose={() => setSharing(null)} />}
          {view.kind === 'story' && <StoryView b={b} id={view.id} onClose={() => back(view.back)} />}
          {/* Con una historia abierta no hay barra de abajo (como en las redes): así nunca tapa su pie. */}
          {view.kind !== 'story' && (
            <nav className={s.nav}>
              <button
                className={tab === 'inicio' ? s.navOn : ''}
                onClick={() => go({ kind: 'feed' })}
                aria-label={tx.inicio}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />
                </svg>
                {b.newPosts.size > 0 && <NewDot className={s.navDot} />}
              </button>
              <button
                className={tab === 'mensajes' ? s.navOn : ''}
                onClick={() => go({ kind: 'mensajes' })}
                aria-label={tx.mensajes}
                data-tour="nav-mensajes"
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M21 3 3 10.5l7 2.5 2.5 7z" />
                </svg>
                {b.newChats.size > 0 && <NewDot className={s.navDot} />}
              </button>
              <button
                className={tab === 'tienda' ? s.navOn : ''}
                onClick={() => go({ kind: 'tienda' })}
                aria-label={tx.boringplace}
                data-tour="nav-tienda"
              >
                {/* La casita del logo de Boringplace. */}
                <img
                  src={assetUrl('marca/boringplace_icono.webp')}
                  alt=""
                  draggable={false}
                  style={{ width: '1.55rem', height: '1.55rem', opacity: tab === 'tienda' ? 1 : 0.55 }}
                />
              </button>
              <button
                className={tab === 'perfil' ? s.navOn : ''}
                onClick={() => go({ kind: 'perfil', id: b.data.yo })}
                aria-label={tx.perfil}
                data-tour="nav-perfil"
              >
                <Avatar perfil={b.perfiles[b.data.yo]} small />
              </button>
            </nav>
          )}
          {toast && (
            <div key={toast.key} className={s.appToast} role="status">
              <img src={assetUrl('marca/boringram_icono.webp')} alt="" draggable={false} />
              <span>{toast.text}</span>
            </div>
          )}
          {tutorial && b.data.tutorial.length > 0 && <Tour b={b} onView={setView} onClose={closeTutorial} />}
        </KeyboardProvider>
      </ToastContext.Provider>
    </ShareContext.Provider>
  );
}

function AppBar({ b, onClose, onHelp }: { b: B; onClose: () => void; onHelp?: () => void }) {
  const tx = b.data.textos;
  const [menu, setMenu] = useState(false);
  const pick = (action: () => void) => {
    setMenu(false);
    action();
  };
  return (
    <div className={s.appBar}>
      <img src={assetUrl(pantallas.boringram.logo)} alt="Boringram" draggable={false} />
      {/* Solo en el celular (en computadora, «Cómo usar» y «Cerrar» van fuera de la pantalla). */}
      <button
        type="button"
        className={s.menuBtn}
        aria-label={tx.menu}
        aria-expanded={menu}
        data-tour="ayuda"
        onClick={() => {
          playSelect();
          setMenu(!menu);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {menu && (
        <>
          <div className={s.menuShield} onClick={() => setMenu(false)} />
          <div className={s.menu} role="menu">
            {onHelp && (
              <button
                role="menuitem"
                onClick={() =>
                  pick(() => {
                    playSelect();
                    onHelp();
                  })
                }
              >
                <span aria-hidden>?</span> {tx.como_usar}
              </button>
            )}
            <button role="menuitem" onClick={() => pick(onClose)}>
              <span aria-hidden>✕</span> {tx.cerrar_app}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type TourView =
  | { kind: 'feed' }
  | { kind: 'perfil'; id: string }
  | { kind: 'post'; id: string; back: { kind: 'feed' } }
  | { kind: 'tienda' };

/**
 * «Cómo usar»: recorrido guiado. Cada paso lleva a su pantalla, ilumina lo que explica (un elemento con
 * `data-tour`) y muestra el gesto (tocar, doble toque o arrastrar hacia abajo) junto a un globo con el texto.
 * Si lo que señala no existe (p. ej. un perfil todavía bloqueado), el paso se salta. Se dibuja sobre toda la
 * pantalla para poder señalar también lo que está fuera del celular.
 */
function Tour({ b, onView, onClose }: { b: B; onView: (v: TourView) => void; onClose: () => void }) {
  const tx = b.data.textos;
  const steps = b.data.tutorial;
  const [i, setI] = useState(0);
  const dir = useRef<1 | -1>(1);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [bubbleH, setBubbleH] = useState(200);
  const bubble = useRef<HTMLDivElement>(null);
  const step = steps[i];
  const last = i === steps.length - 1;
  const move = (d: 1 | -1) => {
    dir.current = d;
    setI((x) => Math.min(steps.length - 1, Math.max(0, x + d)));
  };

  // La pantalla del paso.
  useEffect(() => {
    if (!step.vista) return;
    const [kind, id] = step.vista.split(':');
    // Lo que se explica está en lugares que no cambian con la historia (el perfil de Jair y su publicación de
    // graduación): el inicio se llena de publicaciones nuevas y lo señalado quedaría fuera de la pantalla.
    if (kind === 'perfil') {
      if (b.perfiles[id]) onView({ kind: 'perfil', id });
      else move(dir.current);
    } else if (kind === 'post') {
      if (b.publicaciones.some((p) => p.id === id)) onView({ kind: 'post', id, back: { kind: 'feed' } });
      else move(dir.current);
    } else if (kind === 'tienda') onView({ kind: 'tienda' });
    else onView({ kind: 'feed' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  // Sigue a lo señalado cuadro a cuadro (se mueve si la pantalla se desplaza o cambia de tamaño).
  useEffect(() => {
    setRect(null);
    if (!step.objetivo) return;
    let frame = 0;
    let tries = 0;
    const tick = () => {
      const el = [...document.querySelectorAll<HTMLElement>(`[data-tour="${step.objetivo}"]`)].find(
        (e) => e.getClientRects().length > 0,
      );
      if (!el) {
        if (++tries > 40) return move(dir.current);
        frame = requestAnimationFrame(tick);
        return;
      }
      // Si lo señalado quedó fuera de la pantalla (p. ej. la lista volvió arriba al cambiar de vista), se centra.
      const r0 = el.getBoundingClientRect();
      const box = el.closest<HTMLElement>(`.${s.content}`)?.getBoundingClientRect();
      if (step.objetivo !== 'inicio' && box && (r0.top < box.top || r0.bottom > box.bottom)) {
        el.scrollIntoView({ block: 'center' });
      }
      const r = el.getBoundingClientRect();
      setRect((old) =>
        old && old.top === r.top && old.left === r.left && old.width === r.width && old.height === r.height ? old : r,
      );
      if (bubble.current) setBubbleH(bubble.current.offsetHeight);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  // Teclado: flechas para avanzar y volver; Escape cierra el recorrido (no Boringram).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') return last ? onClose() : move(1);
      else if (e.key === 'ArrowLeft') return move(-1);
      else return;
      e.stopImmediatePropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  // Dónde va el globo: debajo de lo señalado, o arriba si no cabe, o adentro si es muy grande.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const W = Math.min(300, vw - 24);
  const PAD = 6;
  let pos: CSSProperties = {};
  let arrow: 'arriba' | 'abajo' | null = null;
  let arrowX = W / 2;
  if (rect) {
    const cx = rect.left + rect.width / 2;
    const left = Math.min(vw - W - 12, Math.max(12, cx - W / 2));
    arrowX = Math.min(W - 18, Math.max(18, cx - left));
    if (rect.bottom + PAD + 16 + bubbleH < vh) {
      pos = { left, top: rect.bottom + PAD + 14 };
      arrow = 'arriba';
    } else if (rect.top - PAD - 16 - bubbleH > 0) {
      pos = { left, top: rect.top - PAD - 14 - bubbleH };
      arrow = 'abajo';
    } else pos = { left, top: Math.max(12, rect.bottom - bubbleH - 24) };
  }
  const swipe = step.gesto === 'abajo';
  const hand: CSSProperties | null = rect
    ? {
        left: rect.left + rect.width / 2,
        // En lo muy alto (una foto), el gesto va arriba para que no lo tape el globo.
        top: swipe
          ? rect.top + Math.min(rect.height / 2, 28)
          : rect.top + rect.height * (rect.height > 220 ? 0.28 : 0.5),
      }
    : null;

  return createPortal(
    <div className={s.tour} role="dialog" aria-modal="true" aria-label={tx.como_usar}>
      {rect ? (
        <div
          className={s.tourSpot}
          style={{
            // El marco no se sale del borde de la pantalla (p. ej. la barra de estado en el celular).
            left: Math.max(1, rect.left - PAD),
            top: Math.max(1, rect.top - PAD),
            width: rect.width + PAD * 2 - Math.max(0, 1 - (rect.left - PAD)),
            height: rect.height + PAD * 2 - Math.max(0, 1 - (rect.top - PAD)),
          }}
        />
      ) : (
        <div className={s.tourDim} />
      )}
      {hand && step.gesto && (
        <span
          key={`${i}-${step.gesto}`}
          className={`${s.tourHand} ${swipe ? s.tourSwipe : step.gesto === 'doble' ? s.tourDouble : ''}`}
          style={hand}
          aria-hidden
        />
      )}
      <div
        key={i}
        ref={bubble}
        className={`${s.tourBubble} ${rect ? '' : s.tourCenter} ${arrow ? s[`tourArrow_${arrow}`] : ''}`}
        style={rect ? { ...pos, width: W, ['--arrow-x' as string]: `${arrowX}px` } : { width: W }}
      >
        {!rect && <img className={s.tourLogo} src={assetUrl('marca/boringram_icono.webp')} alt="" draggable={false} />}
        <small className={s.tourStep}>
          {tx.paso.replace('{n}', String(i + 1)).replace('{total}', String(steps.length))}
        </small>
        <b className={s.tutTitle}>{step.titulo}</b>
        <p className={s.tutText}>{step.texto}</p>
        <div className={s.tutBtns}>
          {!last && (
            <button type="button" className={s.tutSkip} onClick={onClose}>
              {tx.saltar}
            </button>
          )}
          {i > 0 && (
            <button
              type="button"
              className={s.tourBack}
              onClick={() => {
                playCancel();
                move(-1);
              }}
            >
              {tx.atras}
            </button>
          )}
          <button
            type="button"
            className={s.tutNext}
            onClick={() => {
              if (last) return onClose();
              playSelect();
              move(1);
            }}
          >
            {last ? tx.entendido : tx.siguiente}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function Avatar({
  perfil,
  small,
  ring,
  inicial,
}: {
  perfil?: Perfil;
  small?: boolean;
  ring?: boolean;
  inicial?: string;
}) {
  return (
    <span className={`${s.avatarRing} ${ring ? s.avatarStory : ''} ${small ? s.small : ''}`}>
      {perfil && !isPlaceholder(perfil.foto) ? (
        <img className={s.avatar} src={assetUrl(perfil.foto)} alt="" draggable={false} />
      ) : (
        // Sin foto todavía (PLACEHOLDER): la inicial del usuario.
        <span className={`${s.avatar} ${s.initial}`}>{(perfil?.usuario ?? inicial)?.[0]?.toUpperCase()}</span>
      )}
    </span>
  );
}

function PostHead({
  b,
  post,
  onPerfil,
  tour,
}: {
  b: B;
  post: Publicacion;
  onPerfil: (id: string) => void;
  tour?: boolean;
}) {
  const p = b.perfiles[post.autor];
  return (
    <button className={s.postHead} onClick={() => onPerfil(post.autor)} data-tour={tour ? 'autor' : undefined}>
      <Avatar perfil={p} small ring={b.destacadas.some((d) => d.autor === post.autor && b.newStories.has(d.id))} />
      <b>{p?.usuario ?? post.autor}</b>
      <small>{post.hace}</small>
    </button>
  );
}

/** Corazón (rojo si Jair le dio me gusta), comentar y enviar; luego los me gusta. */
function PostActions({
  b,
  post,
  onComment,
  tour,
  slide = 0,
}: {
  b: B;
  post: Publicacion;
  onComment: () => void;
  tour?: boolean;
  /** En un carrusel, la foto que se está viendo (se comparte esa). */
  slide?: number;
}) {
  const mark = (id: string) => (tour ? id : undefined);
  const onShare = useShare();
  const tx = b.data.textos;
  const setLike = useStore((st) => st.setBoringramLike);
  const offline = useOffline();
  const liked = b.liked(post);
  const [pop, setPop] = useState(0);
  const n = b.likeCount(post);
  return (
    <>
      <div className={s.postActions}>
        <button
          className={s.likeBtn}
          data-tour={mark('like')}
          aria-pressed={liked}
          aria-label={tx.me_gusta.replace('{n}', String(n))}
          onClick={() => {
            if (offline()) return;
            if (!liked) playSelect();
            setLike(post.id, !liked);
            setPop((p) => p + 1);
          }}
        >
          <svg key={pop} viewBox="0 0 24 24" className={`${liked ? s.liked : ''} ${pop ? s.likePop : ''}`}>
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
          </svg>
        </button>
        <button
          className={s.likeBtn}
          onClick={onComment}
          aria-label={tx.agregar_comentario}
          data-tour={mark('comentar')}
        >
          <svg viewBox="0 0 24 24" className={s.shareIcon}>
            <path d="M4 5h16v11H8l-4 4z" />
          </svg>
        </button>
        {post.tipo === 'foto' ? (
          <button
            className={s.likeBtn}
            onClick={() => onShare(shareId(post.id, slide))}
            aria-label={tx.compartir}
            data-tour={mark('compartir')}
          >
            <svg viewBox="0 0 24 24" className={s.shareIcon}>
              <path d="M21 3 3 10.5l7 2.5 2.5 7z" />
            </svg>
          </button>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M21 3 3 10.5l7 2.5 2.5 7z" />
          </svg>
        )}
      </div>
      <p className={s.likes}>
        {liked ? tx.te_gusta.replace('{n}', String(n - 1)) : tx.me_gusta.replace('{n}', String(n))}
      </p>
    </>
  );
}

/**
 * Escribir un comentario: queda guardado debajo de la publicación. Máximo 2 por publicación («no seas
 * acosador»); comentarse a uno mismo se puede, pero la app te dice que das pena.
 */
function Composer({
  b,
  post,
  openRef,
}: {
  b: B;
  post: Publicacion;
  openRef: React.MutableRefObject<(() => void) | null>;
}) {
  const tx = b.data.textos;
  const toast = useToast();
  const add = useStore((st) => st.addBoringramComment);
  const offline = useOffline();
  const send = (t: string) => {
    if (offline()) return false;
    if ((useStore.getState().boringramComments[post.id]?.length ?? 0) >= 2) {
      playCancel();
      toast(tx.acosador);
      return true;
    }
    playSelect();
    add(post.id, t);
    if (post.autor === b.data.yo) toast(tx.propio_post);
    return true;
  };
  return (
    <div className={s.composer}>
      <Avatar perfil={b.perfiles[b.data.yo]} small />
      <KeyboardField
        id={`post:${post.id}`}
        placeholder={tx.agregar_comentario}
        submitLabel={tx.publicar}
        onSubmit={send}
        openRef={openRef}
      />
    </div>
  );
}

/** En el inicio, los dos primeros comentarios (y «Ver los N comentarios» si hay más); abierta, todos. */
function Comments({ b, post, all, onMore }: { b: B; post: Publicacion; all?: boolean; onMore?: () => void }) {
  const tx = b.data.textos;
  const comments = b.commentsOf(post);
  const remove = useStore((st) => st.removeBoringramComment);
  if (comments.length === 0) return null;
  const list = all ? comments : comments.slice(0, 2);
  return (
    <div className={s.comments}>
      {!all && comments.length > 2 && (
        <button className={s.moreComments} onClick={onMore}>
          {tx.ver_comentarios.replace('{n}', String(comments.length))}
        </button>
      )}
      {list.map((c, i) => {
        // Los comentarios del jugador van después de los de la historia: esos se pueden borrar.
        const mine = i - post.comentarios.length;
        return (
          <p key={i} className={c.usuario === b.data.yo ? s.myComment : ''}>
            <b>{c.usuario}</b> {c.texto}
            {mine >= 0 && (
              <button
                className={s.deleteComment}
                onClick={() => {
                  playCancel();
                  remove(post.id, mine);
                }}
              >
                {tx.borrar}
              </button>
            )}
          </p>
        );
      })}
    </div>
  );
}

function Post({
  b,
  post,
  onPerfil,
  onPost,
  full,
  tour,
}: {
  b: B;
  post: Publicacion;
  onPerfil: (id: string) => void;
  onPost?: (id: string) => void;
  full?: boolean;
  /** La publicación que señala el tutorial. */
  tour?: boolean;
}) {
  const tx = b.data.textos;
  const [slide, setSlide] = useState(0);
  const caption = post.carrusel?.[slide]?.texto ?? post.texto;
  const user = b.perfiles[post.autor]?.usuario ?? post.autor;
  const isNew = b.newPosts.has(post.id);
  const setLike = useStore((st) => st.setBoringramLike);
  const [burst, setBurst] = useState(0);
  const composer = useRef<(() => void) | null>(null);
  const offline = useOffline();
  // Doble toque en la foto: me gusta (nunca lo quita), con el corazón grande.
  const doubleTap = () => {
    if (offline()) return;
    if (!b.liked(post)) playSelect();
    setLike(post.id, true);
    setBurst((x) => x + 1);
  };
  return (
    <article className={`${s.post} ${post.tipo !== 'foto' ? s.textPost : ''}`}>
      {post.tipo === 'repost' && <p className={s.repostTag}>⟳ {tx.reposteo.replace('{usuario}', user)}</p>}
      <PostHead b={b} post={post} onPerfil={onPerfil} tour={tour} />
      {post.tipo === 'foto' && (
        <div className={s.postImage} onDoubleClick={doubleTap} data-tour={tour ? 'foto' : undefined}>
          {post.carrusel ? (
            <Carousel b={b} slides={post.carrusel} index={slide} onIndex={setSlide} />
          ) : (
            <Pic src={post.imagen!} />
          )}
          {burst > 0 && (
            <svg key={burst} viewBox="0 0 24 24" className={s.burst} aria-hidden>
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
          )}
          {isNew && <NewDot className={s.itemDot} />}
        </div>
      )}
      {post.tipo === 'texto' && (
        <p className={s.thought}>
          {post.texto}
          {isNew && <NewDot className={s.inlineDot} />}
        </p>
      )}
      {post.tipo === 'repost' && (
        <blockquote className={s.quoted}>
          <b>@{post.repost!.usuario}</b>
          <span>{post.repost!.texto}</span>
          {isNew && <NewDot className={s.inlineDot} />}
        </blockquote>
      )}
      <PostActions
        b={b}
        post={post}
        tour={tour}
        slide={slide}
        onComment={() => (full ? composer.current?.() : onPost?.(post.id))}
      />
      {post.tipo === 'foto' && (
        <p className={s.caption}>
          <b>{user}</b> {caption}
        </p>
      )}
      <Comments b={b} post={post} all={full} onMore={() => onPost?.(post.id)} />
      {full && <Composer b={b} post={post} openRef={composer} />}
    </article>
  );
}

/** Insignia de carrusel (varias fotos) en las cuadrículas, como en las redes. */
function MultiIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.multiIcon} aria-hidden>
      <rect x="7" y="3" width="14" height="14" rx="2" />
      <path d="M17 21H5a2 2 0 0 1-2-2V7" />
    </svg>
  );
}

/**
 * Historias arriba del inicio: un círculo por cuenta con historias desbloqueadas (la tuya primero; después
 * las que tienen algo sin ver). Abre la más nueva sin ver o, si ya se vio todo, la más nueva.
 */
function StoryRail({ b, onStory }: { b: B; onStory: (id: string) => void }) {
  const authors = [...new Set(b.destacadas.map((d) => d.autor))].filter((a) => b.perfiles[a]);
  if (authors.length === 0) return null;
  const unseen = (a: string) => b.destacadas.some((d) => d.autor === a && b.newStories.has(d.id));
  const order = authors.sort(
    (x, y) => Number(y === b.data.yo) - Number(x === b.data.yo) || Number(unseen(y)) - Number(unseen(x)),
  );
  const open = (a: string) => {
    const mine = b.destacadas.filter((d) => d.autor === a);
    const pick = mine.find((d) => b.newStories.has(d.id)) ?? mine.find((d) => !d.fijada) ?? mine[0];
    onStory(pick.id);
  };
  return (
    <div className={s.storyRail}>
      {order.map((a) => (
        <button key={a} type="button" className={s.storyRailItem} onClick={() => open(a)}>
          <Avatar perfil={b.perfiles[a]} ring={unseen(a)} />
          <small>{a === b.data.yo ? b.data.textos.tu_historia : b.perfiles[a].usuario}</small>
          {unseen(a) && <NewDot className={s.railDot} />}
        </button>
      ))}
    </div>
  );
}

function Feed({
  b,
  onPerfil,
  onPost,
  onStory,
}: {
  b: B;
  onPerfil: (id: string) => void;
  onPost: (id: string) => void;
  onStory: (id: string) => void;
}) {
  if (b.publicaciones.length === 0) return <p className={s.empty}>{b.data.textos.sin_publicaciones}</p>;
  return (
    <div className={s.feed}>
      <StoryRail b={b} onStory={onStory} />
      {b.publicaciones.map((p) => (
        <Post key={p.id} b={b} post={p} onPerfil={onPerfil} onPost={onPost} />
      ))}
    </div>
  );
}

function Profile({
  b,
  id,
  onPost,
  onStory,
  onBack,
}: {
  b: B;
  id: string;
  onPost: (id: string) => void;
  onStory: (id: string) => void;
  onBack?: () => void;
}) {
  const tx = b.data.textos;
  const [tab, setTab] = useState<'fotos' | 'pensamientos' | 'me_gusta'>('fotos');
  const mine = id === b.data.yo;
  const likedPosts = b.publicaciones.filter((x) => b.liked(x));
  const likedStories = b.destacadas.filter((x) => b.storyLiked(x.id));
  const p = b.perfiles[id];
  const photos = b.publicaciones.filter((x) => x.autor === id && x.tipo === 'foto');
  const thoughts = b.publicaciones.filter((x) => x.autor === id && x.tipo !== 'foto');
  // Las fijadas (p. ej. la favorita de Jair) van siempre primero.
  const stories = b.destacadas.filter((x) => x.autor === id).sort((a, c) => Number(!!c.fijada) - Number(!!a.fijada));
  if (!p) return null;
  return (
    <div className={s.profile}>
      <div className={s.topBar}>
        {onBack && (
          <button className={s.backBtn} onClick={onBack} aria-label={tx.atras}>
            ‹
          </button>
        )}
        <b>{p.usuario}</b>
      </div>
      <div className={s.profileHead}>
        <Avatar perfil={p} ring={stories.some((x) => b.newStories.has(x.id))} />
        <div className={s.counts}>
          <span>
            <b>{p.publicaciones}</b>
            {tx.publicaciones}
          </span>
          <span>
            <b>{p.seguidores.toLocaleString()}</b>
            {tx.seguidores}
          </span>
          <span>
            <b>{p.seguidos}</b>
            {tx.seguidos}
          </span>
        </div>
      </div>
      <div className={s.bio}>
        <b>{p.nombre}</b>
        <p>{p.bio}</p>
      </div>
      {id !== b.data.yo && (
        <div className={s.followRow}>
          <span className={s.following}>{tx.siguiendo}</span>
          {p.te_sigue && <span className={s.followsYou}>{tx.te_sigue}</span>}
        </div>
      )}
      {stories.length > 0 && (
        <div className={s.highlights} data-tour="destacadas">
          {stories.map((h) => (
            <button key={h.id} className={s.highlight} onClick={() => onStory(h.id)}>
              <span className={`${s.highlightRing} ${b.newStories.has(h.id) ? s.avatarStory : ''}`}>
                <Pic src={h.imagen} />
              </span>
              <small>{h.titulo}</small>
              {b.newStories.has(h.id) && <NewDot className={s.highlightDot} />}
            </button>
          ))}
        </div>
      )}
      <div className={s.profileTabs} role="tablist" data-tour="pestanas">
        {(['fotos', 'pensamientos', 'me_gusta'] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className={tab === k ? s.profileTabOn : ''}
            onClick={() => {
              if (tab === k) return;
              playSelect();
              setTab(k);
            }}
          >
            {k === 'me_gusta' ? tx.me_gusta_tab : tx[k]}
            {k !== 'me_gusta' && (k === 'fotos' ? photos : thoughts).some((x) => b.newPosts.has(x.id)) && (
              <NewDot className={s.inlineDot} />
            )}
          </button>
        ))}
      </div>
      {tab === 'me_gusta' ? (
        !mine ? (
          <p className={s.privateLikes}>
            <span aria-hidden>🔒</span>
            {tx.likes_privados.replace('{usuario}', p.usuario)}
          </p>
        ) : likedPosts.length + likedStories.length === 0 ? (
          <p className={s.empty}>{tx.likes_vacios}</p>
        ) : (
          <div className={s.grid}>
            {likedStories.map((x) => (
              <button key={`story-${x.id}`} className={`${s.gridItem} ${s.gridStory}`} onClick={() => onStory(x.id)}>
                <Pic src={x.imagen} />
                <span className={s.gridStoryTag}>{tx.historias_gustadas}</span>
              </button>
            ))}
            {likedPosts.map((x) =>
              x.tipo === 'foto' ? (
                <button key={x.id} className={s.gridItem} onClick={() => onPost(x.id)}>
                  <Pic src={x.imagen!} />
                  {x.carrusel && <MultiIcon />}
                </button>
              ) : (
                <button key={x.id} className={`${s.gridItem} ${s.gridText}`} onClick={() => onPost(x.id)}>
                  <span>{x.tipo === 'repost' ? x.repost!.texto : x.texto}</span>
                </button>
              ),
            )}
          </div>
        )
      ) : tab === 'fotos' ? (
        <div className={s.grid}>
          {photos.map((x) => (
            <button key={x.id} className={s.gridItem} onClick={() => onPost(x.id)}>
              <Pic src={x.imagen!} />
              {x.carrusel && <MultiIcon />}
              {b.newPosts.has(x.id) && <NewDot className={s.itemDot} />}
            </button>
          ))}
        </div>
      ) : (
        <div className={s.feed}>
          {thoughts.map((x) => (
            <Post key={x.id} b={b} post={x} onPerfil={() => undefined} onPost={onPost} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostView({
  b,
  id,
  onBack,
  onPerfil,
}: {
  b: B;
  id: string;
  onBack: () => void;
  onPerfil: (id: string) => void;
}) {
  const markOpened = useStore((st) => st.markGalleryOpened);
  useEffect(() => markOpened(postKey(id)), [id, markOpened]);
  const post = b.publicaciones.find((p) => p.id === id);
  if (!post) return null;
  return (
    <div className={s.feed}>
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={onBack} aria-label={b.data.textos.atras}>
          ‹
        </button>
        <b>{b.perfiles[post.autor]?.usuario}</b>
      </div>
      <Post b={b} post={post} onPerfil={onPerfil} full tour />
    </div>
  );
}

/** Cuánto hay que mantener presionado el centro de una historia para la lluvia de corazones. */
const HOLD_MS = 550;

/**
 * Historia destacada: ocupa todo el celular, con la barra de progreso arriba. Tocar el centro le da me
 * gusta; mantenerlo presionado, además, suelta una lluvia de corazones. Abajo: responder, me gusta y
 * compartir. Se cierra con la ×.
 */
function StoryView({ b, id, onClose }: { b: B; id: string; onClose: () => void }) {
  const tx = b.data.textos;
  const toast = useToast();
  const onShare = useShare();
  const markOpened = useStore((st) => st.markGalleryOpened);
  const setLike = useStore((st) => st.setBoringramLike);
  const offline = useOffline();
  useEffect(() => markOpened(storyKey(id)), [id, markOpened]);
  const [pop, setPop] = useState(0);
  const [rain, setRain] = useState(0);
  const hold = useRef<{ timer: number; long: boolean } | null>(null);
  const h = b.destacadas.find((x) => x.id === id);
  if (!h) return null;
  const p = b.perfiles[h.autor];
  const liked = b.storyLiked(id);
  const like = () => {
    if (offline()) return;
    if (!liked) playSelect();
    setLike(`story:${id}`, true);
    setPop((x) => x + 1);
  };
  const send = () => {
    if (offline()) return false;
    if (h.autor === b.data.yo) {
      playCancel();
      toast(tx.propio_historia);
    } else if (p?.historias_sin_comentarios) {
      playCancel();
      toast(tx.historia_sin_comentarios.replace('{usuario}', p.usuario));
    } else {
      playSelect();
      toast(tx.enviado);
    }
    return true;
  };
  return (
    <div className={s.story}>
      <Pic className={s.storyImage} src={h.imagen} />
      <div className={s.storyProgress}>
        <i />
      </div>
      <div className={s.storyHead}>
        <Avatar perfil={p} small />
        <b>{p?.usuario}</b>
        <small>{h.hace}</small>
        <button className={s.storyClose} onClick={onClose} aria-label={tx.atras}>
          ×
        </button>
      </div>
      <div
        className={s.storyTouch}
        onPointerDown={() => {
          hold.current = {
            long: false,
            timer: window.setTimeout(() => {
              if (!hold.current || offline()) return;
              hold.current.long = true;
              if (!liked) playSelect();
              setLike(`story:${id}`, true);
              setRain((x) => x + 1);
            }, HOLD_MS),
          };
        }}
        onPointerUp={() => {
          if (!hold.current) return;
          clearTimeout(hold.current.timer);
          if (!hold.current.long) like();
          hold.current = null;
        }}
        onPointerLeave={() => {
          if (hold.current) clearTimeout(hold.current.timer);
          hold.current = null;
        }}
      />
      {pop > 0 && (
        <svg key={`pop-${pop}`} viewBox="0 0 24 24" className={s.burst} aria-hidden>
          <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
        </svg>
      )}
      {rain > 0 && (
        <div key={`rain-${rain}`} className={s.heartBlast} aria-hidden>
          {Array.from({ length: 22 }, (_, i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              style={
                {
                  '--a': `${(i * 360) / 22 + ((i * 47) % 14) - 7}deg`,
                  '--dist': `${5 + ((i * 31) % 6)}rem`,
                  '--s': `${0.5 + ((i * 13) % 8) / 10}`,
                  '--d': `${((i * 7) % 5) * 0.03}s`,
                } as React.CSSProperties
              }
            >
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
          ))}
          <svg viewBox="0 0 24 24" className={s.bigHeart}>
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
          </svg>
        </div>
      )}
      <span className={s.storyText}>{h.texto}</span>
      <div className={s.storyFoot}>
        <KeyboardField
          id={`story:${id}`}
          className={s.storyField}
          placeholder={tx.responder_a.replace('{usuario}', p?.usuario ?? '')}
          submitLabel={tx.enviar}
          onSubmit={send}
        />
        <button
          type="button"
          className={s.storyBtn}
          aria-pressed={liked}
          aria-label={tx.me_gusta_tab}
          onClick={() => {
            if (liked) {
              if (offline()) return;
              setLike(`story:${id}`, false);
              return;
            }
            like();
          }}
        >
          <svg key={pop} viewBox="0 0 24 24" className={`${liked ? s.liked : ''} ${pop ? s.likePop : ''}`}>
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
          </svg>
        </button>
        {!isPlaceholder(h.imagen) && (
          <button type="button" className={s.storyBtn} aria-label={tx.compartir} onClick={() => onShare(id)}>
            <svg viewBox="0 0 24 24">
              <path d="M21 3 3 10.5l7 2.5 2.5 7z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function Inbox({ b, onChat }: { b: B; onChat: (id: string) => void }) {
  const tx = b.data.textos;
  return (
    <div className={s.inbox}>
      <div className={s.topBar}>
        <b>{tx.mensajes}</b>
      </div>
      {b.chats.map((c) => {
        const perfil = c.perfil ? b.perfiles[c.perfil] : undefined;
        const last = c.mensajes[c.mensajes.length - 1];
        const isNew = b.newChats.has(c.id);
        return (
          <button key={c.id} className={`${s.chatRow} ${isNew ? s.unread : ''}`} onClick={() => onChat(c.id)}>
            <Avatar perfil={perfil} inicial={c.nombre} />
            <span className={s.chatInfo}>
              <b>{perfil?.usuario ?? c.nombre}</b>
              <small>
                {last.de === 'yo' ? `${tx.tu} ` : ''}
                {last.texto}
              </small>
            </span>
            {c.visto ? <span className={s.seen}>{tx.visto}</span> : isNew && <NewDot />}
          </button>
        );
      })}
    </div>
  );
}

function ChatView({
  b,
  id,
  onBack,
  onPerfil,
}: {
  b: B;
  id: string;
  onBack: () => void;
  onPerfil: (id: string) => void;
}) {
  const tx = b.data.textos;
  const markOpened = useStore((st) => st.markGalleryOpened);
  const chat = b.chats.find((c) => c.id === id);
  useEffect(() => {
    if (chat) markOpened(chatKey(chat.id, chat.mensajes.length));
  }, [chat, markOpened]);
  if (!chat) return null;
  const perfil = chat.perfil ? b.perfiles[chat.perfil] : undefined;
  return (
    <div className={s.chatView}>
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={onBack} aria-label={tx.atras}>
          ‹
        </button>
        <button className={s.chatTitle} onClick={() => chat.perfil && onPerfil(chat.perfil)} disabled={!perfil}>
          <Avatar perfil={perfil} small inicial={chat.nombre} />
          <span>
            <b>{perfil?.usuario ?? chat.nombre}</b>
            <small>{chat.estado}</small>
          </span>
        </button>
      </div>
      <div className={s.messages}>
        {chat.mensajes.map((m, i) => (
          <div key={i} className={s.messageBlock}>
            {m.dia && <span className={s.day}>{m.dia}</span>}
            <div className={`${s.bubble} ${m.de === 'yo' ? s.mine : ''} ${m.destacado ? s.starred : ''}`}>
              {m.destacado && <span className={s.star}>{tx.destacado}</span>}
              {m.texto}
              <small>{m.pendiente ? '🕓' : m.hora}</small>
            </div>
          </div>
        ))}
        {chat.visto && <span className={s.seenLine}>{tx.visto_chat}</span>}
      </div>
      <div className={s.compose}>{tx.escribir}</div>
    </div>
  );
}
