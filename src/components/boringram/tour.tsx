import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { assetUrl } from '../../engine/assets';
import { playCancel, playSelect } from '../../engine/sound';
import s from '../Boringram.module.css';
import { type B } from './comun';

// El tour de la primera vez (ver ../Boringram.tsx).
export type TourView =
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
export function Tour({ b, onView, onClose }: { b: B; onView: (v: TourView) => void; onClose: () => void }) {
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
