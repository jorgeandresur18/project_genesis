// Los cassettes: cada ataque de la mochila es un cassette (docs/BIBLIA_RPG.md, sección 18). Solo los de los
// protagonistas tienen color (el de su caja de diálogo); los genéricos (los sueltos) son grises. Cada uno tiene un aura
// suave de su color; los de especiales brillan más y un reflejo los cruza, para que se vean de lujo.
import type { CSSProperties } from 'react';
import { assetUrl } from '../engine/assets';

/** El color de cada protagonista (su caja de diálogo); los demás, gris. */
const COLORES: Record<string, string> = { jair: '#f0b54a', cami: '#5ea8ff', rikka: '#ef4f5c', nikki: '#ff6fa5' };
const GRIS = '#c9ced6';

export function Cassette({
  de,
  nombre,
  especial = false,
  apagado = false,
  onClick,
  titulo,
}: {
  /** De qué personaje es (`jair`, `cami`…); sin esto, o si no es protagonista, es genérico. */
  de?: string;
  nombre: string;
  especial?: boolean;
  /** En la mochila (no equipado): un poco más apagado. */
  apagado?: boolean;
  onClick?: () => void;
  titulo?: string;
}) {
  const color = (de && COLORES[de]) || GRIS;
  const imagen = assetUrl(`objetos/cassette_${de && COLORES[de] ? de : 'generico'}.webp`);
  const clase = `cassette ${especial ? 'cassette-especial' : ''} ${apagado ? 'cassette-apagado' : ''}`;
  const contenido = (
    <>
      <span className="cassette-imagen" style={{ '--mascara': `url(${imagen})` } as CSSProperties}>
        <img src={imagen} alt="" draggable={false} />
      </span>
      <span className="cassette-nombre">
        {especial && '★ '}
        {nombre}
      </span>
    </>
  );
  const estilo = { '--c': color } as CSSProperties;
  return onClick ? (
    <button type="button" className={clase} style={estilo} onClick={onClick} title={titulo}>
      {contenido}
    </button>
  ) : (
    <span className={clase} style={estilo} title={titulo}>
      {contenido}
    </span>
  );
}
