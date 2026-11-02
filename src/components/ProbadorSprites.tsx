import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { anguloDisparo, Batalla, rectSprite, SpriteHoja, type Hoja } from './Batalla';
import type { DatosBatalla, Enemigo, Heroe } from '../engine/batalla';
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

/**
 * La arena: cualquier héroe contra cualquier rival de las peleas del juego, con el nivel que se quiera. Es una
 * pelea infinita (al final de cada turno los caídos se levantan con la vida llena); se sale huyendo.
 */
const MAX_ARENA = 3;
const ID_BATALLA = (ruta: string) => ruta.split('/').pop()!.replace('.json', '');
const ARENA_HEROES: { clave: string; p: Heroe; de: string }[] = Object.entries(BATALLAS).flatMap(([ruta, d]) =>
  Object.entries(d.personajes).map(([k, p]) => ({ clave: `${ID_BATALLA(ruta)}.${k}`, p, de: d.titulo })),
);
const ARENA_RIVALES: { clave: string; e: Enemigo; de: string; nivel: number }[] = Object.entries(BATALLAS).flatMap(([ruta, d]) =>
  Object.entries(d.enemigos).map(([k, e]) => ({
    clave: `${ID_BATALLA(ruta)}.${k}`,
    e,
    de: d.titulo,
    // El nivel con que sale en su pelea (el del jefe, o el más alto de la horda).
    nivel: d.jefe.enemigo === k ? d.jefe.nivel : Math.max(1, ...d.horda.niveles),
  })),
);
const ARENA_FONDOS = Object.entries(BATALLAS).map(([ruta, d]) => ({ id: ID_BATALLA(ruta), d }));
/** Todos pueden pelear de cualquier lado: un rival como héroe (con su menú) y un héroe como rival (con la IA). */
const ARENA_TODOS = [
  ...ARENA_HEROES.map((h) => ({ clave: h.clave, nombre: h.p.nombre, de: h.de, nivel: h.p.nivel })),
  ...ARENA_RIVALES.map((r) => ({ clave: r.clave, nombre: r.e.nombre, de: r.de, nivel: r.nivel })),
];
const comoHeroe = (clave: string): Heroe => {
  const h = ARENA_HEROES.find((x) => x.clave === clave);
  if (h) return h.p;
  const { e, nivel } = ARENA_RIVALES.find((x) => x.clave === clave)!;
  return { nombre: e.nombre, sprite: e.sprite, nivel, seguido: true, base: e.base, crece: e.crece, ataques: e.ataques, especial: e.especial, escala: e.escala, sonido: e.sonido, hablar: ['¿Y si lo hablamos?', 'Esto no tiene por qué terminar así.'] };
};
const comoRival = (clave: string): Enemigo => {
  const r = ARENA_RIVALES.find((x) => x.clave === clave);
  if (r) return r.e;
  const { p } = ARENA_HEROES.find((x) => x.clave === clave)!;
  return { nombre: p.nombre, sprite: p.sprite, base: p.base, crece: p.crece, ataques: p.ataques, especial: p.especial, escala: p.escala, sonido: p.sonido };
};

function armarArena(heroes: [string, number][], rivales: [string, number][], fondo: string): DatosBatalla {
  const todas = Object.values(BATALLAS);
  const f = ARENA_FONDOS.find((x) => x.id === fondo)?.d ?? todas[0];
  const objetos = Object.assign({}, ...todas.map((d) => d.objetos)) as DatosBatalla['objetos'];
  return {
    titulo: 'Arena',
    fondo: f.fondo,
    fondo_proporcion: f.fondo_proporcion,
    fondo_luces: f.fondo_luces,
    enemigos_atras: f.enemigos_atras,
    musica: f.musica,
    heroes: heroes.map(([k]) => k),
    personajes: Object.fromEntries(heroes.map(([k]) => [k, comoHeroe(k)])),
    enemigos: Object.fromEntries(rivales.map(([k]) => [k, comoRival(k)])),
    horda: { enemigo: '', al_inicio: 0, niveles: [] },
    jefe: { enemigo: '', nivel: 1 },
    objetos,
    // Una mochila llena para probar los objetos.
    mochila_inicial: Object.fromEntries(Object.keys(objetos).map((k) => [k, 5])),
    botin: { probabilidad: 0, objetos: [] },
    esquivar: Math.max(...todas.map((d) => d.esquivar)),
    hablar: Math.max(...todas.map((d) => d.hablar)),
    huir: true,
    retratos: Object.assign({}, ...todas.map((d) => d.retratos)),
    // Solo lo que dice la Voz al hablar (si se distrae o no); el resto, sin diálogos de la historia.
    dialogos: { hablar_ok: todas[0].dialogos.hablar_ok ?? [], hablar_no: todas[0].dialogos.hablar_no ?? [] },
  };
}

type Eleccion = Record<string, number>;

function ArenaConfig({ onPelear }: { onPelear: (h: [string, number][], r: [string, number][], fondo: string) => void }) {
  const [heroes, setHeroes] = useState<Eleccion>({});
  const [rivales, setRivales] = useState<Eleccion>({});
  const [fondo, setFondo] = useState(ARENA_FONDOS[0]?.id ?? '');
  const lista = (
    titulo: string,
    items: { clave: string; nombre: string; de: string; nivel: number }[],
    sel: Eleccion,
    set: (f: (s: Eleccion) => Eleccion) => void,
  ) => (
    <section className="arena-lado">
      <h3>
        {titulo} <small>(hasta {MAX_ARENA})</small>
      </h3>
      {items.map((x) => {
        const on = x.clave in sel;
        const lleno = !on && Object.keys(sel).length >= MAX_ARENA;
        const cambiar = () =>
          set((s) => {
            const n = { ...s };
            if (on) delete n[x.clave];
            else n[x.clave] = x.nivel;
            return n;
          });
        return (
          <div key={x.clave} className={`arena-item ${on ? 'activo' : ''}`}>
            <label>
              <input type="checkbox" checked={on} disabled={lleno} onChange={cambiar} />
              <b>{x.nombre}</b> <small>{x.de}</small>
            </label>
            <label className="arena-nivel">
              Nv
              <input
                type="number"
                min={1}
                max={99}
                value={sel[x.clave] ?? x.nivel}
                disabled={!on}
                onChange={(e) => set((s) => ({ ...s, [x.clave]: Math.max(1, Math.min(99, +e.target.value || 1)) }))}
              />
            </label>
          </div>
        );
      })}
    </section>
  );
  const listo = Object.keys(heroes).length > 0 && Object.keys(rivales).length > 0;
  return (
    <div className="arena-config">
      <p className="arena-ayuda">
        Elige tu equipo y los rivales (con su nivel): cualquiera puede ir de cualquier lado, incluso el mismo personaje en
        los dos. Pelean con las reglas de siempre. Es infinita: al final de cada turno los
        caídos se levantan con la vida llena. Para salir, «Huir».
      </p>
      <div className="arena-lados">
        {lista('Tu equipo', ARENA_TODOS, heroes, setHeroes)}
        {lista('Rivales', ARENA_TODOS, rivales, setRivales)}
      </div>
      <div className="arena-pie">
        <label>
          Fondo
          <select value={fondo} onChange={(e) => setFondo(e.target.value)}>
            {ARENA_FONDOS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.d.titulo}
              </option>
            ))}
          </select>
        </label>
        <button className="arena-pelear" disabled={!listo} onClick={() => onPelear(Object.entries(heroes), Object.entries(rivales), fondo)}>
          ⚔ ¡Pelear!
        </button>
      </div>
    </div>
  );
}

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
  /** La arena: armándola (sin pelea todavía) o peleando. */
  const [arena, setArena] = useState<null | 'armar' | { h: [string, number][]; r: [string, number][]; fondo: string; n: number }>(null);
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
  // Lo que se suelta y sale volando como imagen aparte (el corazón del beso de Nikki, la media luna de la sombra):
  // en la hoja ya no está desde ese cuadro, así que aparece encima, en el mismo lugar, y cruza la pantalla.
  const [vuelan, setVuelan] = useState<{ key: number; src: string; x: number; y: number; w: number; h: number; dx: number; ms: number }[]>([]);
  const soltar = (p: NonNullable<Hoja['proyectil']>, h: Hoja) => {
    const s = rectSprite(escena.current?.querySelector('.probador-sprite .batalla-sprite'));
    const base = escena.current?.getBoundingClientRect();
    if (!s || !base) return;
    const k = s.width / h.frameWidth;
    const cx = p.x + p.ancho / 2;
    const x = (volteado ? s.right - cx * k : s.left + cx * k) - base.left;
    const y = s.top + (p.y + p.alto / 2) * k - base.top;
    const dx = volteado ? -(x + p.ancho * k) : base.width - x + p.ancho * k;
    const ms = (Math.abs(dx) / 700) * 1000;
    const key = Math.random();
    setVuelan((l) => [...l, { key, src: `${BASE}${p.imagen}.png`, x, y, w: p.ancho * k, h: p.alto * k, dx, ms }]);
    setTimeout(() => setVuelan((l) => l.filter((z) => z.key !== key)), ms + 60);
  };
  const alCuadro = (fila: string, columna: number, h: Hoja) => {
    // Un cuadro antes del que ya no lo tiene dibujado: así nunca hay un instante sin él.
    const p = h.proyectiles?.[fila] ?? (fila === 'ataque' ? h.proyectil : undefined);
    const seq = h.animations[fila]?.seq;
    const antes = p && (seq ? seq[Math.max(0, seq.indexOf(p.cuadro) - 1)] : p.cuadro - 1);
    if (p && columna === antes) soltar(p, h);
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
        <button className={`probador-arena ${arena ? 'activo' : ''}`} onClick={() => setArena(arena ? null : 'armar')}>
          {arena ? '← Volver a los sprites' : '⚔ Arena'}
        </button>
        <button className="probador-cerrar" onClick={onCerrar}>
          Cerrar
        </button>
      </aside>
      {arena === 'armar' && (
        <main className="probador-main">
          <ArenaConfig onPelear={(h, r, fondo) => setArena({ h, r, fondo, n: Date.now() })} />
        </main>
      )}
      {arena && arena !== 'armar' && (
        <Batalla
          key={arena.n}
          id="arena"
          datos={armarArena(arena.h, arena.r, arena.fondo)}
          arena={arena.r}
          progreso={{ heroes: Object.fromEntries(arena.h.map(([k, nivel]) => [k, { nivel, xp: 0 }])), mochila: {} }}
          onGanar={() => setArena('armar')}
          onPerder={() => setArena('armar')}
        />
      )}
      {!arena && (
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
        <div ref={escena} className={`probador-escena fondo-${fondo}`} style={fondo === 'combate' ? { backgroundImage: `url(${BASE}batalla/fondos/bastion_ruinas.webp)` } : undefined}>
          <div className="probador-sprite" style={{ '--z': zoom, transform: volteado ? 'scaleX(-1)' : undefined } as CSSProperties}>
            {hoja && (
              <SpriteHoja key={`${sel}-${vez}`} src={sel} anim={anim} bucle velocidad={velocidad} cuadroFijo={pausa ? cuadro : undefined} alCuadro={alCuadro} />
            )}
            {puntos.map(([x, y], i) => (
              <span key={i} className="probador-marca" style={{ left: x * zoom, top: y * zoom }} />
            ))}
          </div>
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
      )}
    </div>,
    document.body,
  );
}
