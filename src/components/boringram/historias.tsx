import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../engine/store';
import { isPlaceholder } from '../../engine/assets';
import { storyKey } from '../../engine/boringram';
import { playCancel, playSelect } from '../../engine/sound';
import { KeyboardField } from '../PhoneKeyboard';
import s from '../Boringram.module.css';
import { type B, useOffline, useToast, useShare } from './comun';
import { Pic, Avatar } from './publicaciones';

// Las historias de Boringram (ver ../Boringram.tsx).
/** Cuánto hay que mantener presionado el centro de una historia para la lluvia de corazones. */
export const HOLD_MS = 550;

/**
 * Historia destacada: ocupa todo el celular, con la barra de progreso arriba. Tocar el centro le da me
 * gusta; mantenerlo presionado, además, suelta una lluvia de corazones. Abajo: responder, me gusta y
 * compartir. Se cierra con la ×.
 */
export function StoryView({ b, id, onClose }: { b: B; id: string; onClose: () => void }) {
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
