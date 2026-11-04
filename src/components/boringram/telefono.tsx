import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useStore } from '../../engine/store';
import { assetUrl } from '../../engine/assets';
import { LINTERNA_KEY, LINTERNA_OLVIDADA_KEY } from '../../engine/boringram';
import { playCancel, playSelect } from '../../engine/sound';
import s from '../Boringram.module.css';
import { type B } from './comun';

// El celular alrededor de la app: barra de estado, panel de notificaciones y avisos (ver ../Boringram.tsx).
/**
 * Con Boringram abierto, una notificación nueva (de las que se ganan haciendo algo: me gusta solo con datos,
 * no molestar, la linterna…) baja desde arriba del celular un momento. Tocarla abre el panel.
 */
export function HeadsUp({ b, onOpen }: { b: B; onOpen: () => void }) {
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
export const SWEEP_STEP_MS = 45;

/** Iconos de los ajustes rápidos (en el panel y, prendidos, en la barra de estado). */
export function TileIcon({ kind, className = s.tileIcon }: { kind: string; className?: string }) {
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
export function useTorch(ahora: number) {
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
export function StatusBar({
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
export function Shade({
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
export function NotifCard({
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

/** Esqueleto mientras «carga»: bloques grises en lugar de la cabecera, la foto y el texto. */
export function Skeleton({ label }: { label: string }) {
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
