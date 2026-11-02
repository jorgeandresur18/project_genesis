import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { anguloDisparo, rectSprite, SpriteHoja, type Hoja } from './Batalla';
import type { DatosBatalla } from '../engine/batalla';
import probador from '../data/probador_sprites.json';

/**
 * Probador de sprites (?sprites en la dirección): cada hoja del combate (y las de «varios» en
 * src/data/probador_sprites.json) con todas sus animaciones, para revisarlas sin jugar. Zoom, velocidad, pausa
 * cuadro a cuadro, voltear, fondo del combate y las marcas de dónde salen las balas. Es una herramienta del autor:
 * no es parte de la historia.
 */
const BATALLAS = import.meta.glob<DatosBatalla>('../data/batallas/*.json', { eager: true, import: 'default' });
const BASE = import.meta.env.BASE_URL;

interface Entrada {
  hoja: string;
  nombre: string;
  /** Qué hace cada acción del combate con esta hoja (para los botones de arriba). */
  descanso?: string;
}

const ENTRADAS: Entrada[] = (() => {
  const vistas = new Map<string, Entrada>();
  for (const d of Object.values(BATALLAS)) {
    for (const p of Object.values(d.personajes)) vistas.set(p.sprite, { hoja: p.sprite, nombre: p.nombre, descanso: p.descanso });
    for (const e of Object.values(d.enemigos)) if (!vistas.has(e.sprite)) vistas.set(e.sprite, { hoja: e.sprite, nombre: e.nombre });
  }
  for (const v of probador.varios as { hoja: string; nombre: string }[]) vistas.set(v.hoja, v);
  return [...vistas.values()];
})();
/** El color del especial de cada hoja: el de sus balas. */
const BATALLA_COLOR = new Map(
  Object.values(BATALLAS).flatMap((d) => Object.values(d.personajes).flatMap((p) => (p.especial ? [[p.sprite, p.especial.color] as const] : []))),
);

/** Las acciones del combate y qué fila de la hoja usan. */
const ACCIONES: [string, (e: Entrada) => string][] = [
  ['Reposo', () => 'idle'],
  ['Ataque', () => 'ataque'],
  ['Esquivar', () => 'salto'],
  ['Especial', () => 'especial'],
  ['Daño', () => 'daño'],
  ['Descanso', (e) => e.descanso ?? 'idle'],
];

export function ProbadorSprites({ onCerrar }: { onCerrar: () => void }) {
  const [sel, setSel] = useState(ENTRADAS[0]?.hoja ?? '');
  const [hoja, setHoja] = useState<Hoja | null>(null);
  const [anim, setAnim] = useState('idle');
  const [zoom, setZoom] = useState(4);
  const [velocidad, setVelocidad] = useState(1);
  const [pausa, setPausa] = useState(false);
  const [cuadro, setCuadro] = useState(0);
  const [volteado, setVolteado] = useState(false);
  const [fondo, setFondo] = useState<'combate' | 'cuadros' | 'oscuro'>('combate');
  const [marcas, setMarcas] = useState(false);
  const [vez, setVez] = useState(0);
  const entrada = ENTRADAS.find((e) => e.hoja === sel);

  useEffect(() => {
    setHoja(null);
    void fetch(`${BASE}${sel}.json`)
      .then((r) => r.json())
      .then((j: Hoja | { cuadro: [number, number] }) => setHoja('animations' in j ? j : null));
  }, [sel]);
  const a = hoja?.animations[anim];
  const largo = a ? (a.seq?.length ?? a.frames) : 1;
  const col = a ? (a.seq ? a.seq[((cuadro % largo) + largo) % largo] : ((cuadro % largo) + largo) % largo) : 0;
  const puntos = marcas ? hoja?.disparos?.[anim]?.[String(col)] ?? [] : [];
  const tocar = (nombre: string) => {
    setAnim(nombre);
    setCuadro(0);
    setVez((v) => v + 1);
  };

  // Con «Disparos», salen las balas como en la pelea: una por destello en el ataque y, en el especial, ráfagas
  // continuas desde cada pistola hacia donde apunta en ese cuadro.
  const escena = useRef<HTMLDivElement>(null);
  const [balas, setBalas] = useState<{ key: number; x: number; y: number; dx: number; dy: number; ms: number; rafaga: boolean }[]>([]);
  const puntas = useRef<number[][]>([]);
  const disparar = (p: number[], rafaga: boolean) => {
    const s = rectSprite(escena.current?.querySelector('.probador-sprite .batalla-sprite'));
    const base = escena.current?.getBoundingClientRect();
    if (!hoja || !s || !base) return;
    const k = s.width / hoja.frameWidth;
    const x = (volteado ? s.right - p[0] * k : s.left + p[0] * k) - base.left;
    const y = s.top + p[1] * k - base.top;
    // El ataque normal sale derecho hacia adelante (en la pelea va hacia su objetivo).
    const a = rafaga ? anguloDisparo(hoja, p) + (Math.random() - 0.5) * 0.08 : 0;
    const ang = volteado ? Math.PI - a : a;
    // Alcance limitado, como en la pelea (hasta los rivales).
    const largo = base.width * 0.45;
    const ms = (largo / (rafaga ? 2600 : 1500)) * 1000;
    const key = Math.random();
    setBalas((b) => [...b, { key, x, y, dx: Math.cos(ang) * largo, dy: Math.sin(ang) * largo, ms, rafaga }]);
    setTimeout(() => setBalas((b) => b.filter((z) => z.key !== key)), ms + 40);
  };
  const alCuadro = (fila: string, columna: number, h: Hoja) => {
    const pts = marcas ? h.disparos?.[fila]?.[String(columna)] ?? [] : [];
    if (fila === 'especial') puntas.current = pts;
    else for (const p of pts) disparar(p, false);
  };
  const disparo = useRef(disparar);
  disparo.current = disparar;
  useEffect(() => {
    puntas.current = [];
    if (!marcas || anim !== 'especial' || pausa) return;
    const t = setInterval(() => puntas.current.forEach((p) => disparo.current(p, true)), 55);
    return () => clearInterval(t);
  }, [marcas, anim, pausa, sel]);
  const color = BATALLA_COLOR.get(sel) ?? '#7fe6ff';

  // En un portal: la pantalla de título tiene transformaciones que mueven lo «fixed».
  return createPortal(
    <div className="probador" role="dialog" aria-label="Probador de sprites">
      <aside className="probador-lista">
        <h2>Sprites</h2>
        {ENTRADAS.map((e) => (
          <button
            key={e.hoja}
            className={e.hoja === sel ? 'activo' : ''}
            onClick={() => {
              setSel(e.hoja);
              tocar('idle');
            }}
          >
            <b>{e.nombre}</b>
            <small>{e.hoja}</small>
          </button>
        ))}
        <button className="probador-cerrar" onClick={onCerrar}>
          Cerrar
        </button>
      </aside>
      <main className="probador-main">
        <div className="probador-acciones">
          {ACCIONES.map(([texto, fila]) => {
            const f = entrada ? fila(entrada) : 'idle';
            const hay = !!hoja?.animations[f];
            return (
              <button key={texto} disabled={!hay} className={anim === f ? 'activo' : ''} onClick={() => tocar(f)}>
                {texto}
              </button>
            );
          })}
        </div>
        <div className="probador-filas">
          {Object.entries(hoja?.animations ?? {}).map(([k, v]) => (
            <button key={k} className={anim === k ? 'activo' : ''} onClick={() => tocar(k)}>
              {k} <small>{v.seq ? `${v.seq.length} pasos` : `${v.frames} cuadros`} · {v.fps} fps{v.loop ? ' · bucle' : ''}</small>
            </button>
          ))}
        </div>
        <div ref={escena} className={`probador-escena fondo-${fondo}`} style={fondo === 'combate' ? { backgroundImage: `url(${BASE}batalla/fondos/bastion.webp)` } : undefined}>
          <div className="probador-sprite" style={{ '--z': zoom, transform: volteado ? 'scaleX(-1)' : undefined } as CSSProperties}>
            {hoja && (
              <SpriteHoja key={`${sel}-${vez}`} src={sel} anim={anim} bucle velocidad={velocidad} cuadroFijo={pausa ? cuadro : undefined} alCuadro={alCuadro} />
            )}
            {puntos.map(([x, y], i) => (
              <span key={i} className="probador-marca" style={{ left: x * zoom, top: y * zoom }} />
            ))}
          </div>
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
          <span className="probador-info">
            {anim} · paso {pausa ? ((cuadro % largo) + largo) % largo : '—'}/{largo} · columna {pausa ? col : '—'}
            {hoja ? ` · cuadro ${hoja.frameWidth}×${hoja.frameHeight}` : ' · (sin hoja animada)'}
          </span>
        </div>
        <div className="probador-controles">
          <button onClick={() => setPausa(!pausa)}>{pausa ? '▶ Seguir' : '⏸ Pausa'}</button>
          <button disabled={!pausa} onClick={() => setCuadro((c) => c - 1)}>
            ◀ Cuadro
          </button>
          <button disabled={!pausa} onClick={() => setCuadro((c) => c + 1)}>
            Cuadro ▶
          </button>
          <button className={volteado ? 'activo' : ''} onClick={() => setVolteado(!volteado)}>
            Voltear
          </button>
          <button className={marcas ? 'activo' : ''} onClick={() => setMarcas(!marcas)}>
            Disparos
          </button>
          <select value={fondo} onChange={(e) => setFondo(e.target.value as typeof fondo)} aria-label="Fondo">
            <option value="combate">Fondo del combate</option>
            <option value="cuadros">A cuadros</option>
            <option value="oscuro">Oscuro</option>
          </select>
          <label>
            Zoom {zoom}×
            <input type="range" min={1} max={8} value={zoom} onChange={(e) => setZoom(+e.target.value)} />
          </label>
          <label>
            Velocidad {Math.round(velocidad * 100)} %
            <input type="range" min={0.25} max={2} step={0.25} value={velocidad} onChange={(e) => setVelocidad(+e.target.value)} />
          </label>
        </div>
      </main>
    </div>,
    document.body,
  );
}
