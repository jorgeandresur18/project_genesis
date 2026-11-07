import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { anguloDisparo, rectSprite, SpriteHoja, type Hoja } from './batalla/sprites';

/**
 * Los efectos de un sprite del combate fuera de la pelea (el probador y la galería), igual que en la pelea: las balas
 * de cada destello (una por destello en el ataque; ráfagas continuas en el especial), lo que se suelta y sale volando
 * (el corazón del beso, la media luna de la sombra) y el rayo del Capitán que sigue hasta el borde.
 *
 * `escena`: el contenedor (los efectos se dibujan dentro, con `capa`); `selector`: dónde está el sprite adentro.
 */
const BASE = import.meta.env.BASE_URL;

export function useEfectosSprite({
  escena,
  selector,
  hoja,
  anim,
  volteado = false,
  balasActivas = true,
  pausa = false,
  color = '#7fe6ff',
}: {
  escena: RefObject<HTMLElement | null>;
  selector: string;
  hoja: Hoja | null;
  anim: string;
  volteado?: boolean;
  balasActivas?: boolean;
  pausa?: boolean;
  color?: string;
}) {
  const donde = () => {
    const s = rectSprite(escena.current?.querySelector(selector));
    const base = escena.current?.getBoundingClientRect();
    return s && base ? { s, base } : null;
  };
  const [balas, setBalas] = useState<{ key: number; x: number; y: number; dx: number; dy: number; ms: number; rafaga: boolean }[]>([]);
  const puntas = useRef<number[][]>([]);
  const disparar = (p: number[], rafaga: boolean) => {
    const d = donde();
    if (!hoja || !d) return;
    const k = d.s.width / hoja.frameWidth;
    const x = (volteado ? d.s.right - p[0] * k : d.s.left + p[0] * k) - d.base.left;
    const y = d.s.top + p[1] * k - d.base.top;
    // El ataque normal sale derecho hacia adelante; el especial, hacia donde apunta la pistola.
    const a = rafaga ? anguloDisparo(hoja, p) + (Math.random() - 0.5) * 0.08 : 0;
    const ang = volteado ? Math.PI - a : a;
    // Hasta el borde, como en la pelea.
    const largo = (volteado ? x : d.base.width - x) + 40;
    const ms = (largo / (rafaga ? 2600 : 1500)) * 1000;
    const key = Math.random();
    setBalas((b) => [...b, { key, x, y, dx: Math.cos(ang) * largo, dy: Math.sin(ang) * largo, ms, rafaga }]);
    setTimeout(() => setBalas((b) => b.filter((z) => z.key !== key)), ms + 40);
  };
  const [vuelan, setVuelan] = useState<{ key: number; src: string; x: number; y: number; w: number; h: number; dx: number; ms: number }[]>([]);
  const soltar = (p: NonNullable<Hoja['proyectil']>, h: Hoja) => {
    const d = donde();
    if (!d) return;
    const k = d.s.width / h.frameWidth;
    const cx = p.x + p.ancho / 2;
    const x = (volteado ? d.s.right - cx * k : d.s.left + cx * k) - d.base.left;
    const y = d.s.top + (p.y + p.alto / 2) * k - d.base.top;
    const dx = volteado ? -(x + p.ancho * k) : d.base.width - x + p.ancho * k;
    const ms = (Math.abs(dx) / 700) * 1000;
    const key = Math.random();
    setVuelan((l) => [...l, { key, src: `${BASE}${p.imagen}.webp`, x, y, w: p.ancho * k, h: p.alto * k, dx, ms }]);
    setTimeout(() => setVuelan((l) => l.filter((z) => z.key !== key)), ms + 60);
  };
  const [rayo, setRayo] = useState<{ x: number; y: number; largo: number; ang: number; grosor: number } | null>(null);
  const [enMano, setEnMano] = useState<{ src: string; x: number; y: number; w: number; h: number } | null>(null);
  /** La Mega Bola Tóxica (el aura de Nikki): crece en la palma y sale hacia adelante a explotar. */
  const [bola, setBola] = useState<{ x: number; y: number; s: number; anim: string; ms: number } | null>(null);
  const [energias, setEnergias] = useState<{ x: number; y: number; lejos: number } | null>(null);
  /** Para `alCuadro` del SpriteHoja. */
  const alCuadro = (fila: string, columna: number, h: Hoja) => {
    const hb = (h as Hoja & { bola?: { aparece: number; suelta: number; x: number; y: number } }).bola;
    if (hb && fila === 'aura') {
      const d = donde();
      if (d && columna < hb.suelta) setEnergias((v) => v ?? { x: (d.s.left + d.s.right) / 2 - d.base.left, y: (d.s.top + d.s.bottom) / 2 - d.base.top, lejos: Math.hypot(d.base.width, d.base.height) * 0.7 });
      else setEnergias(null);
      if (d && columna >= hb.aparece && columna < hb.suelta) {
        const k = d.s.width / h.frameWidth;
        const x = (volteado ? d.s.right - hb.x * k : d.s.left + hb.x * k) - d.base.left;
        const t = (columna - hb.aparece) / (hb.suelta - 6 - hb.aparece);
        const s = Math.min(1, t) * (d.base.height * 0.5) / 112 + 0.12;
        setBola({ x, y: d.s.top + hb.y * k - d.base.top - s * 50, s, anim: columna < hb.aparece + 8 ? 'aparecer' : 'idle', ms: 90 });
      } else if (d && columna === hb.suelta) {
        setBola((b) => b && { ...b, x: volteado ? d.base.width * 0.15 : d.base.width * 0.85, y: d.base.height * 0.55, ms: 320 });
        setTimeout(() => setBola((b) => b && { ...b, anim: 'explotar', s: b.s * 1.5, ms: 200 }), 330);
        setTimeout(() => setBola(null), 1100);
      }
    }
    // Lo que sostiene en la mano antes de lanzarlo (el corazón): la imagen, siguiendo a la mano.
    const pm = h.proyectiles?.[fila];
    if (pm?.pista) {
      const p = pm.pista[String(columna)];
      const d = p && donde();
      if (p && d) {
        const k = d.s.width / h.frameWidth;
        setEnMano({ src: `${BASE}${pm.imagen}.webp`, x: (volteado ? d.s.right - p[0] * k : d.s.left + p[0] * k) - d.base.left, y: d.s.top + p[1] * k - d.base.top, w: pm.ancho * k * p[2], h: pm.alto * k * p[2] });
      } else setEnMano(null);
    }
    if (h.rayo) {
      const r = fila === 'especial' ? h.rayo[String(columna)] : undefined;
      const d = donde();
      if (r && d) {
        const k = d.s.width / h.frameWidth;
        setRayo({
          x: (volteado ? d.s.right - r[0] * k : d.s.left + r[0] * k) - d.base.left,
          y: d.s.top + r[1] * k - d.base.top,
          largo: d.base.width * 1.6,
          ang: volteado ? Math.PI - r[2] : r[2],
          grosor: r[3] * k,
        });
      } else setRayo(null);
    }
    // Un cuadro antes del que ya no lo tiene dibujado: así nunca hay un instante sin él.
    const p = h.proyectiles?.[fila] ?? (fila === 'ataque' ? h.proyectil : undefined);
    const seq = h.animations[fila]?.seq;
    const antes = p && (seq ? seq[Math.max(0, seq.indexOf(p.cuadro) - 1)] : p.cuadro - 1);
    if (p && columna === antes) soltar(p, h);
    const pts = balasActivas ? (h.disparos?.[fila]?.[String(columna)] ?? []) : [];
    if (fila === 'especial') puntas.current = pts;
    else for (const q of pts) disparar(q, false);
  };
  const disparo = useRef(disparar);
  disparo.current = disparar;
  useEffect(() => {
    puntas.current = [];
    setRayo(null);
    setEnMano(null);
    setBola(null);
    setEnergias(null);
    if (!balasActivas || anim !== 'especial' || pausa) return;
    const t = setInterval(() => puntas.current.forEach((p) => disparo.current(p, true)), 55);
    return () => clearInterval(t);
  }, [balasActivas, anim, pausa, hoja]);

  const capa = (
    <>
      {rayo && (
        <span
          className="batalla-rayo sigue"
          aria-hidden
          style={{ left: rayo.x, top: rayo.y, width: rayo.largo, height: Math.max(6, rayo.grosor), rotate: `${rayo.ang}rad`, '--c': '#ff2a2a' } as CSSProperties}
        />
      )}
      {energias && <EnergiasHacia x={energias.x} y={energias.y} lejos={energias.lejos} />}
      {bola && (
        <span className="batalla-bola-toxica" style={{ left: bola.x, top: bola.y, scale: String(bola.s), transitionDuration: `${bola.ms}ms` } as CSSProperties} aria-hidden>
          <SpriteHoja key={bola.anim} src="batalla/bola_toxica" anim={bola.anim} bucle={bola.anim === 'idle'} />
        </span>
      )}
      {enMano && (
        <img
          className="batalla-proyectil en-mano"
          src={enMano.src}
          alt=""
          draggable={false}
          style={{ left: enMano.x - enMano.w / 2, top: enMano.y - enMano.h / 2, width: enMano.w, height: enMano.h, scale: volteado ? '-1 1' : undefined } as CSSProperties}
        />
      )}
      {vuelan.map((x) => (
        <img
          key={x.key}
          className="batalla-proyectil"
          src={x.src}
          alt=""
          draggable={false}
          style={
            {
              left: x.x - x.w / 2,
              top: x.y - x.h / 2,
              width: x.w,
              height: x.h,
              '--dx': `${x.dx}px`,
              '--dy': '0px',
              scale: volteado ? '-1 1' : undefined,
              animationDuration: `${x.ms}ms`,
            } as CSSProperties
          }
        />
      ))}
      <div className="batalla-balas" aria-hidden>
        {balas.map((x) => (
          <span
            key={x.key}
            className={`batalla-bala ${x.rafaga ? 'rafaga' : ''}`}
            style={
              {
                left: x.x,
                top: x.y,
                '--dx': `${x.dx}px`,
                '--dy': `${x.dy}px`,
                '--ang': `${Math.atan2(x.dy, x.dx)}rad`,
                '--c': color,
                animationDuration: `${x.ms}ms`,
              } as CSSProperties
            }
          />
        ))}
      </div>
    </>
  );
  return { alCuadro, capa, limpiar: () => setRayo(null) };
}

/** El color de las balas de cada hoja: el del especial de un héroe, o el de los disparos de un rival (el Capitán). */
export function colorBalas(batallas: { personajes: Record<string, { sprite: string; especial?: { color: string } }>; enemigos: Record<string, { sprite: string; color_disparo?: string }> }[]) {
  return new Map([
    ...batallas.flatMap((d) => Object.values(d.personajes).flatMap((p) => (p.especial ? [[p.sprite, p.especial.color] as const] : []))),
    ...batallas.flatMap((d) => Object.values(d.enemigos).flatMap((e) => (e.color_disparo ? [[e.sprite, e.color_disparo] as const] : []))),
  ]);
}

/**
 * Energías que llegan desde afuera de la pantalla hasta un punto (Nikki cargando la Mega Bola): chispas moradas que
 * salen de los bordes y se juntan en ella, una y otra vez, mientras está activa.
 */
const ENERGIAS = Array.from({ length: 40 }, (_, i) => {
  const a = (i / 40) * Math.PI * 2 + Math.sin(i * 7.3) * 0.35;
  return { a, d: 0.7 + ((i * 37) % 10) / 20, retraso: ((i * 53) % 40) / 40, tam: 0.6 + ((i * 17) % 7) / 8 };
});
export function EnergiasHacia({ x, y, lejos }: { x: number; y: number; lejos: number }) {
  return (
    <span className="batalla-energias" style={{ left: x, top: y } as CSSProperties} aria-hidden>
      {ENERGIAS.map((e, i) => (
        <i
          key={i}
          style={
            {
              '--ex': `${Math.cos(e.a) * lejos * e.d}px`,
              '--ey': `${Math.sin(e.a) * lejos * e.d * 0.7}px`,
              '--tam': e.tam,
              '--rot': `${e.a}rad`,
              animationDelay: `${(e.retraso * 1.4).toFixed(2)}s`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
