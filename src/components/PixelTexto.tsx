import { useEffect, useRef } from 'react';

/**
 * Texto en letras de píxel (una fuente propia de 5×7, dibujada en un canvas y agrandada sin suavizar). Solo
 * trae las letras que se usan; una letra que falte sale como un espacio.
 */
const FUENTE: Record<string, string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
};

export function PixelTexto({ texto, escala = 6, color = '#7cf2ff', className }: { texto: string; escala?: number; color?: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const letras = texto.toUpperCase().split('');
  const ancho = letras.length * 6 - 1;
  useEffect(() => {
    const c = ref.current?.getContext('2d');
    if (!c) return;
    c.clearRect(0, 0, ancho, 7);
    c.fillStyle = color;
    letras.forEach((l, i) =>
      (FUENTE[l] ?? []).forEach((fila, y) => [...fila].forEach((p, x) => p === '1' && c.fillRect(i * 6 + x, y, 1, 1))),
    );
  });
  return (
    <canvas
      ref={ref}
      className={className}
      width={ancho}
      height={7}
      style={{ width: ancho * escala, height: 7 * escala }}
      role="img"
      aria-label={texto}
    />
  );
}
