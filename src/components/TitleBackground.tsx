import { useMemo } from 'react';
import { useStore } from '../engine/store';
import styles from './TitleBackground.module.css';
import coffeeEs from '../data/codigo_coffee.json';
import coffeeEn from '../data/en/codigo_coffee.json';
import { localized, useLang } from '../engine/i18n';
import { assetUrl } from '../engine/assets';

// Generador pseudoaleatorio con semilla fija: las estrellas quedan siempre en el mismo lugar.
function seeded(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const STARS = 140;
// Partículas que cruzan la pantalla: desde la izquierda o desde arriba.
const COMETS = [
  { axis: 'x', at: 18, color: 'plata', delay: 0 },
  { axis: 'x', at: 62, color: 'acero', delay: 4.5 },
  { axis: 'y', at: 30, color: 'acero', delay: 2 },
  { axis: 'y', at: 78, color: 'plata', delay: 7 },
] as const;

/**
 * Logos que suben despacio en lugar del código (el fondo detrás del televisor del filtro TV CRT): pocos, repartidos a
 * lo ancho y espaciados en el tiempo, para que nunca se amontonen.
 */
const LOGOS = [
  { left: 6, delay: 0 },
  { left: 72, delay: -6 },
  { left: 38, delay: -12 },
  { left: 88, delay: -18 },
  { left: 20, delay: -24 },
  { left: 56, delay: -30 },
];
const LOGOS_SEG = 36;

/**
 * Fondo del título: espacio negro con estrellas, nebulosas, cuadrícula, cometas y código Coffee flotando. Con
 * `logos`, en vez del código suben logos de PROJECT GENESIS.
 */
export function TitleBackground({ logos = false }: { logos?: boolean } = {}) {
  const still = useStore((s) => s.settings.reduceEffects);
  const lang = useLang();
  const { stars, code } = useMemo(() => {
    const coffee = localized(coffeeEs, coffeeEn, lang);
    const rnd = seeded(20261024);
    return {
      stars: Array.from({ length: STARS }, () => ({
        left: rnd() * 100,
        top: rnd() * 100,
        size: rnd() < 0.85 ? 1 + rnd() * 1.2 : 2 + rnd() * 1.5,
        delay: rnd() * 4,
        duration: 2.4 + rnd() * 3,
      })),
      // Fragmentos de código Coffee que suben despacio y se desvanecen.
      code: Array.from({ length: coffee.fragmentos.length }, (_, i) => ({
        lines: coffee.fragmentos[i % coffee.fragmentos.length],
        left: 3 + ((i * 37 + rnd() * 20) % 80),
        delay: -rnd() * 26,
        duration: 22 + rnd() * 12,
        size: 0.68 + rnd() * 0.22,
      })),
    };
  }, [lang]);

  return (
    <div className={`${styles.bg} ${still ? styles.still : ''}`} aria-hidden>
      <div className={styles.grid} />
      <div className={`${styles.nebula} ${styles.nebulaPlata}`} />
      <div className={`${styles.nebula} ${styles.nebulaAcero}`} />
      <div className={styles.vignette} />
      {logos &&
        LOGOS.map((l, i) => (
          <img
            key={`l${i}`}
            className={styles.logo}
            src={assetUrl('marca/logo_blanco.webp')}
            alt=""
            draggable={false}
            style={{ left: `${l.left}%`, animationDelay: `${l.delay}s`, animationDuration: `${LOGOS_SEG}s` }}
          />
        ))}
      {!logos && code.map((c, i) => (
        <pre
          key={`c${i}`}
          className={styles.code}
          style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s`, fontSize: `${c.size}rem` }}
        >
          {c.lines.join('\n')}
        </pre>
      ))}
      {/* Glitch del fondo: una franja que cruza la pantalla de vez en cuando. */}
      <div className={styles.glitchBar} />
      {stars.map((s, i) => (
        <span
          key={i}
          className={styles.star}
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
      {COMETS.map((c, i) => (
        <span
          key={i}
          className={`${styles.comet} ${c.axis === 'x' ? styles.cometX : styles.cometY} ${c.color === 'acero' ? styles.cometAcero : ''}`}
          style={{ [c.axis === 'x' ? 'top' : 'left']: `${c.at}%`, animationDelay: `${c.delay}s` }}
        />
      ))}
    </div>
  );
}
