import { scenes } from '../engine/story';
import { useEffect, useRef, useState } from 'react';
import { useStore } from '../engine/store';
import { useBoringram } from '../engine/boringram';
import { useBoringplace } from '../engine/boringplace';
import { NIVELES, PRUEBA, cursoDe, useBootcamp } from '../engine/bootcamp';
import { useCompletion } from '../engine/completion';
import { useLang, useT } from '../engine/i18n';
import { playNotify } from '../engine/sound';
import { assetUrl } from '../engine/assets';

// Los avisos que aparecen sobre el juego (ver ../App.tsx).
/**
 * Aviso de Boringram durante la historia: cuando una escena desbloquea una publicación, una historia o un
 * mensaje, baja una notificación como en el celular. Tocarla abre Boringram.
 */
export function BoringramToast({ onOpen }: { onOpen: () => void }) {
  const b = useBoringram();
  const tx = b.data.textos;
  const bp = useBoringplace();
  const seen = useRef<Set<string> | null>(null);
  const [toast, setToast] = useState<{ key: number; text: string; user: string } | null>(null);
  const items = [
    // No avisa de lo que publica el propio Jair ni de los chats que deja en visto.
    ...b.publicaciones.filter((p) => p.autor !== b.data.yo).map((p) => ({ id: `p:${p.id}`, user: p.autor, text: tx.notif_post })),
    ...b.destacadas.filter((d) => d.autor !== b.data.yo).map((d) => ({ id: `s:${d.id}`, user: d.autor, text: tx.notif_historia })),
    ...b.chats.filter((c) => !c.visto).map((c) => ({ id: `c:${c.id}:${c.mensajes.length}`, user: c.perfil ?? c.nombre ?? '', text: tx.notif_mensaje })),
    // Se abrió Boringplace (al ganar la pelea del Bastión).
    ...(bp.abierto ? [{ id: 'bp:abierto', user: 'Boringplace', text: bp.data.textos.aviso }] : []),
  ];
  const ids = items.map((x) => x.id).join('|');
  useEffect(() => {
    const now = new Set(ids.split('|'));
    if (seen.current === null) {
      seen.current = now; // Lo que ya estaba desbloqueado al empezar no avisa.
      return;
    }
    const fresh = items.filter((x) => !seen.current!.has(x.id));
    seen.current = now;
    if (fresh.length === 0) return;
    const f = fresh[fresh.length - 1];
    const user = b.perfiles[f.user]?.usuario ?? f.user;
    setToast({ key: Date.now(), user, text: f.text.replace('{usuario}', user) });
    playNotify();
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  if (!toast) return null;
  return (
    <button key={toast.key} className="bori-toast" onClick={onOpen}>
      <img src={assetUrl('marca/boringram_icono.webp')} alt="" draggable={false} />
      <span>
        <small>Boringram · {tx.abrir}</small>
        <b>{toast.text}</b>
      </span>
    </button>
  );
}

/**
 * Aviso de las notificaciones del celular que no vienen de la historia sino de algo que hizo el jugador en
 * Boringram (la linterna, el modo avión, el wifi apagado…): baja en el menú o en el juego al conseguirlas.
 */
export function EventToast({ hidden, onOpen }: { hidden: boolean; onOpen: () => void }) {
  const b = useBoringram();
  const seen = useRef<Set<string> | null>(null);
  const [toast, setToast] = useState<{ key: number; icono: string; app: string; titulo: string } | null>(null);
  const events = b.notificaciones.filter((n) => n.clave);
  const ids = events.map((n) => n.id).join('|');
  useEffect(() => {
    const now = new Set(ids.split('|'));
    const fresh = seen.current === null ? [] : events.filter((n) => !seen.current!.has(n.id));
    seen.current = now; // Lo que ya estaba al abrir el juego no avisa.
    if (hidden || fresh.length === 0) return;
    const n = fresh[0];
    setToast({ key: Date.now(), icono: n.icono, app: n.app, titulo: n.titulo });
    playNotify();
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  if (!toast || hidden) return null;
  return (
    <button key={toast.key} className="bori-toast" onClick={onOpen}>
      <span className="bori-toast-icon" aria-hidden>
        {toast.icono}
      </span>
      <span>
        <small>
          {toast.app} · {b.data.textos.abrir}
        </small>
        <b>{toast.titulo}</b>
      </span>
    </button>
  );
}

/**
 * En el menú: al terminar un capítulo por primera vez, avisa que se desbloqueó su nivel del Bootcamp (uno a la vez).
 * Tocarlo abre el Bootcamp.
 */
export function BootcampAviso({ onOpen }: { onOpen: () => void }) {
  const b = useBootcamp();
  const avisados = useStore((s) => s.bootcampAvisos);
  const avisar = useStore((s) => s.avisarBootcamp);
  const curso = cursoDe(useLang());
  const nivel = PRUEBA ? undefined : NIVELES.find((n) => b.nivelAbierto(n) && !avisados[n.id]);
  const [toast, setToast] = useState<{ key: number; n: number; nombre: string; color: string } | null>(null);
  useEffect(() => {
    if (!nivel) return;
    const timer = setTimeout(() => {
      setToast({ key: Date.now(), n: NIVELES.indexOf(nivel) + 1, nombre: curso.niveles[NIVELES.indexOf(nivel)].nombre, color: nivel.color });
      avisar(nivel.id);
      playNotify();
    }, 1200);
    return () => clearTimeout(timer);
  }, [nivel, avisar]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  if (!toast) return null;
  return (
    <button key={toast.key} className="bori-toast bc-toast" style={{ ['--lvl' as string]: toast.color }} onClick={onOpen}>
      <img src={assetUrl('marca/bootcamp_emblema.webp')} alt="" draggable={false} />
      <span>
        <small>{curso.textos.aviso_app}</small>
        <b>{curso.textos.aviso.replace('{n}', String(toast.n)).replace('{nombre}', toast.nombre)}</b>
      </span>
    </button>
  );
}

/** Primera escena secreta del Capítulo 2: mientras no se lea, el menú sigue recordando que hay algo nuevo ahí. */
export const PRIMERA_SECRETA = [...scenes.values()].find((s) => s.secreto && s.chapter === 2)?.scene_id;

export const SECRETO_MS = 8000;

/**
 * En el menú: al llegar al 100 % se abren las escenas secretas (ver `juegoCompleto` en engine/store.ts) y, hasta
 * que el jugador las vea, un aviso le pide volver a jugar el Capítulo 2. Sale después del aviso del Bootcamp.
 */
export function SecretoAviso() {
  const t = useT();
  const { percent } = useCompletion();
  const completo = useStore((s) => s.juegoCompleto);
  const marcar = useStore((s) => s.marcarJuegoCompleto);
  const visto = useStore((s) => (PRIMERA_SECRETA ? !!s.readScenes[PRIMERA_SECRETA] : true));
  const [toast, setToast] = useState<'cap02' | null>(null);
  useEffect(() => {
    if (percent === 100) marcar();
  }, [percent, marcar]);
  const pendiente = (completo || percent === 100) && !visto ? 'cap02' : null;
  useEffect(() => {
    if (!pendiente) return;
    const timer = setTimeout(() => {
      setToast(pendiente);
      playNotify();
    }, 6000);
    return () => clearTimeout(timer);
  }, [pendiente]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), SECRETO_MS);
    return () => clearTimeout(timer);
  }, [toast]);
  if (!toast) return null;
  return (
    <button className="bori-toast secreto-toast" onClick={() => setToast(null)}>
      <img src={assetUrl('marca/emblema_18.webp')} alt="" draggable={false} />
      <span>
        <small>{t('secreto.aviso_app')}</small>
        <b>{t('secreto.aviso')}</b>
      </span>
    </button>
  );
}

/** Botón redondo de Boringram en la esquina, con la cantidad de cosas nuevas. */
export function BoringramBall({ onOpen, label }: { onOpen: () => void; label: string }) {
  const b = useBoringram();
  if (!b.unlocked) return null;
  const n = b.newPosts.size + b.newStories.size + b.newChats.size;
  return (
    <button className="bori-ball" onClick={onOpen} aria-label={n ? `${label} (${n})` : label} title={label}>
      <img src={assetUrl('marca/boringram_icono.webp')} alt="" draggable={false} />
      {n > 0 && <span className="bori-badge">{n > 9 ? '9+' : n}</span>}
    </button>
  );
}

/** Celular en vertical durante el juego: se pide girarlo (solo se ve con CSS en esa situación). */
export function RotateHint() {
  const t = useT();
  return (
    <div className="rotate-hint" role="alert">
      <div className="rotate-hint-phone" aria-hidden />
      <p>{t('juego.girar')}</p>
      <p className="muted">{t('juego.girar_nota')}</p>
    </div>
  );
}
