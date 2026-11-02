// Estaturas y tamaño de los sprites. Datos en src/data/estaturas.json (los usa también tools/sprites.mjs).
// Todos los sprites comparten la escala de 15 px por cm y el mismo corte inferior (medio muslo de Jair).
// Los más altos que 1,65 m tienen un lienzo más alto; en escena, la «cámara» se aleja para que el más alto
// quepa entero (ver SceneStage).
import type { Character } from './types';
import estaturas from '../data/estaturas.json';
import anchos from '../data/anchos.json';

export const BASE_CM = 165;
export const BASE_CANVAS = 1600;
export const PX_PER_CM = 15;
export const HEAD_MARGIN = 64;

const byCharacter = estaturas.personajes as Record<string, number>;
const byExpression = estaturas.expresiones as Record<string, number>;

/** Estatura de un personaje en escena (por expresión, por personaje o 1,65 m por defecto). */
export function statureOf(c: Character): number {
  const m = c.sprite.match(/sprites\/([^/]+)\/([^/.]+)\./);
  if (m) return byExpression[`${m[1]}/${m[2]}`] ?? byCharacter[m[1]] ?? BASE_CM;
  const placeholder = c.sprite.replace(/^PLACEHOLDER:/, '');
  return byCharacter[placeholder] ?? byCharacter[c.id] ?? BASE_CM;
}

/** Cuántas veces más ancho que lo normal (3:4) es el lienzo de un sprite (los «recortado»; ver tools/sprites.mjs). */
export function widthFactor(c: Character): number {
  const m = c.sprite.match(/sprites\/([^/]+)\/([^/.]+)\./);
  return (m && (anchos as Record<string, number>)[`${m[1]}/${m[2]}`]) || 1;
}

/** Alto del lienzo (px) de un sprite de esa estatura. */
export function canvasHeight(cm: number): number {
  return BASE_CANVAS + Math.max(0, cm - BASE_CM) * PX_PER_CM;
}

/** Dónde empieza la cabeza en un sprite, como fracción del alto del lienzo (para encuadrar retratos). */
export function headTop(sprite: string): number {
  const cm = statureOf({ id: '', sprite, pos: 'centro' });
  const canvas = BASE_CANVAS + Math.max(0, cm - BASE_CM) * PX_PER_CM;
  return (HEAD_MARGIN + Math.max(0, BASE_CM - cm) * PX_PER_CM) / canvas;
}
