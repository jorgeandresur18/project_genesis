// La entrada de la pelea: el pixelado y la presentación «VS» (la pelea con Nikki).
// Partido de Batalla.tsx (docs/CRONOGRAMA.md, «Ordenar el RPG»).
import { useState, type CSSProperties } from 'react';
import { SpriteHoja } from './sprites';
import type { DatosBatalla } from '../../engine/batalla';

/**
 * La entrada de una pelea (16 bits): la pantalla negra se deshace en bloques de píxel que se encogen, con una forma
 * al azar cada vez (de a pedazos, en diagonal, desde el centro, en persianas o en espiral).
 */
export const PIXEL_COLS = 32;
export const PIXEL_FILAS = 18;
export const PIXEL_FORMAS: ((c: number, f: number, r: number) => number)[] = [
  // De a pedazos.
  (_c, _f, r) => r,
  // En diagonal, desde arriba a la izquierda.
  (c, f, r) => (c / PIXEL_COLS + f / PIXEL_FILAS) / 2 + r * 0.12,
  // Desde el centro hacia afuera.
  (c, f, r) => Math.hypot((c + 0.5) / PIXEL_COLS - 0.5, ((f + 0.5) / PIXEL_FILAS - 0.5) * 0.56) / 0.58 + r * 0.08,
  // Persianas: una fila hacia un lado y la siguiente hacia el otro.
  (c, f, r) => (f % 2 ? c : PIXEL_COLS - 1 - c) / PIXEL_COLS * 0.75 + (f / PIXEL_FILAS) * 0.2 + r * 0.05,
  // Espiral: el ángulo alrededor del centro.
  (c, f, r) => ((Math.atan2(f + 0.5 - PIXEL_FILAS / 2, c + 0.5 - PIXEL_COLS / 2) + Math.PI) / (2 * Math.PI)) * 0.85 + r * 0.1,
];
export function Pixelado() {
  const [bloques] = useState(() => {
    const forma = PIXEL_FORMAS[Math.floor(Math.random() * PIXEL_FORMAS.length)];
    return Array.from({ length: PIXEL_COLS * PIXEL_FILAS }, (_, i) => Math.min(1, forma(i % PIXEL_COLS, Math.floor(i / PIXEL_COLS), Math.random())));
  });
  return (
    <div className="batalla-pixelado" aria-hidden style={{ '--cols': PIXEL_COLS } as CSSProperties}>
      {bloques.map((d, i) => (
        <i key={i} style={{ animationDelay: `${Math.round(120 + d * 950)}ms` }} />
      ))}
    </div>
  );
}

/**
 * La presentación del enfrentamiento (como al empezar un combate de un juego de bolsillo, solo en las peleas que la
 * piden): dos destellos, la pantalla partida en diagonal con líneas de velocidad del color de cada uno, sus sprites
 * que entran de los costados, el «VS» que cae de golpe y un zoom que da paso a la pelea.
 */
export function Versus({ d }: { d: DatosBatalla }) {
  const h = d.personajes[d.heroes[0]];
  const r = d.enemigos[d.jefe.enemigo];
  return (
    <div className="batalla-versus" aria-hidden>
      {/* Los fondos van recortados en diagonal; las figuras, encima y enteras (en una pantalla angosta el pie de
          quien está a la izquierda cruzaba la diagonal y se cortaba). */}
      <div className="versus-lado rival" style={{ '--c': r.especial?.color ?? '#c46a6a' } as CSSProperties} />
      <div className="versus-lado heroe" style={{ '--c': h.especial?.color ?? '#e8e2d4' } as CSSProperties} />
      <div className="versus-figura rival">
        <span className="versus-sprite">
          <SpriteHoja src={r.sprite} anim="idle" />
        </span>
        <b>{r.nombre}</b>
      </div>
      <div className="versus-figura heroe">
        <span className="versus-sprite">
          <SpriteHoja src={h.sprite} anim="idle" />
        </span>
        <b>{h.nombre}</b>
      </div>
      <span className="versus-vs">VS</span>
      <span className="versus-destello" />
    </div>
  );
}
