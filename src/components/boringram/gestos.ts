import { useEffect, useRef, useState } from 'react';

// Los gestos de la app: arrastrar para desplazar y deslizar para actualizar (ver ../Boringram.tsx).
/**
 * Se desplaza como un celular: sin barra, arrastrando con el mouse (y soltando con inercia). Con el dedo,
 * el navegador ya desplaza solo. Si se arrastró, el clic al soltar no cuenta.
 */
export function useDragScroll() {
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
export function usePullToRefresh(ref: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
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
