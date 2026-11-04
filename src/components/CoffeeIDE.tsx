import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { playCancel, playGlitch, playSelect } from '../engine/sound';
import { useStore } from '../engine/store';
import { speakerColor } from './DialogBox';
import { assetUrl } from '../engine/assets';
import { headTop } from '../engine/stature';

/**
 * Minijuego de código: un proyecto en Coffee dentro de GRAVITY. El archivo principal tiene huecos ([[n]]) que se
 * completan con una paleta de palabras; los demás archivos se abren para deducir las respuestas. «Compilar»
 * revisa los huecos en orden: si uno está mal, no compila (sale su error en la terminal y, a veces, un
 * comentario de Cami o de Rikka). Intentos ilimitados. Datos: src/data/minijuegos/<id>.json.
 */
export interface CoffeeExercise {
  proyecto: string;
  principal: string;
  archivos: { ruta: string; lineas: string[] }[];
  huecos: Record<string, { respuesta: string; error: string }>;
  paleta: string[];
  comando: string;
  vacio: string;
  fallo: string;
  exito: string[];
  /** Frases al azar mientras compila. */
  compilando: string[];
  /** A veces, una línea más cuando no compila (chistes de vibecoders). */
  chistes_fallo: string[];
  probabilidad_chiste: number;
  /** Al fallar, a veces, uno de estos (por turnos); un texto o, con otra expresión, { texto, sprite }. */
  reacciones: Record<string, (string | { texto: string; sprite?: string; respuesta?: Comentario })[]>;
  probabilidad_reaccion: number;
  /** Sprite de cada uno en los comentarios (si no, sprites/<nombre>/base.webp). */
  retratos?: Record<string, string>;
  /** Comentarios al abrir el programa (en orden) y al resolverlo (uno al azar). */
  al_abrir?: Comentario[];
  al_resolver?: Comentario[];
  /**
   * GENESIS, la IA que debería ayudar y nunca puede (gag del Bootcamp): abre su ventana, le preguntas y siempre
   * contesta que se quedó sin tokens.
   */
  asistente?: {
    nombre: string;
    icono: string;
    estado: string;
    preguntas: string[];
    respuestas: string[];
    sin_tokens: string;
    reacciones: Comentario[];
    /** Preguntas por sesión del Bootcamp; después se bloquea (y no crece la memoria aunque alguien insista). */
    limite: number;
    bloqueado: string;
    bloqueado_input: string;
  };
  textos: Record<string, string>;
}

type Data = CoffeeExercise;
interface Comentario {
  quien: string;
  texto: string;
  sprite?: string;
  /** Otro personaje contesta: aparecen los dos juntos y el globo apunta a quien habla. */
  respuesta?: Comentario;
}
/** Un comentario en pantalla; en un diálogo, con los dos que conversan (el primero a la derecha). */
type Turno = { key: number; who: string; text: string; sprite: string; duo?: { key: number; a: Comentario; b: Comentario }; lado?: 'a' | 'b' };
/** Lo que dura un comentario en pantalla, y lo que tarda en irse. */
const SAY_MS = 4500;
const SAY_OUT_MS = 260;
const GAMES = import.meta.glob<Data>('../data/minijuegos/*.json', { eager: true, import: 'default' });

/** Palabras reservadas de Coffee (y lo poco de JavaScript que sobrevivió). */
const KEYWORDS = new Set([
  'blend',
  'extra',
  'cup',
  'sip',
  'pour',
  'brew',
  'refill',
  'decaf',
  'espresso',
  'await',
  'if',
  'else',
  'for',
  'of',
  'in',
  'while',
  'super',
  'true',
  'false',
]);
const HOLE = /\[\[(\d+)\]\]/g;
/** Cuánto se ve el resultado antes de que la pantalla se oscurezca, y lo que tarda en oscurecerse. */
const SOLVED_MS = 2600;
const DIM_MS = 800;
/** Lo que dura el cierre del programa al salir. */
const CLOSE_MS = 450;

type Line = { kind: 'cmd' | 'error' | 'ok' | 'info'; text: string };

/** Preguntas a GENESIS en esta sesión del Bootcamp (cuentan aunque se cierre y se abra el IDE). */
let preguntasSesion = 0;
/** Al cerrar el Bootcamp se puede volver a preguntar (con el mismo límite). */
export const reiniciarPreguntas = () => {
  preguntasSesion = 0;
};

/** Lo que el jugador ya puso en los huecos (si sale del programa y vuelve, sigue ahí). */
const progress = new Map<string, Record<string, string>>();

export function CoffeeIDE({
  id,
  data: given,
  onSolved,
  onExit,
}: {
  id: string;
  /** El ejercicio (la Academia); sin él, se busca src/data/minijuegos/<id>.json. */
  data?: Data;
  /** Se resolvió; con cuántas compilaciones fallidas (el Bootcamp da estrellas con eso). */
  onSolved: (fallos: number) => void;
  /** Botón «Salir»: cierra el programa sin resolverlo (ver `minijuego_salida` en la escena). */
  onExit?: () => void;
}) {
  const data = given ?? GAMES[`../data/minijuegos/${id}.json`];
  const tx = data.textos;
  const [file, setFile] = useState(data.principal);
  const [fills, setFillsState] = useState<Record<string, string>>(() => progress.get(id) ?? {});
  const setFills = (next: Record<string, string>) => {
    progress.set(id, next);
    setFillsState(next);
  };
  const [closing, setClosing] = useState(false);
  const exit = () => {
    if (!onExit || closing || solved) return;
    playCancel();
    setClosing(true);
    setTimeout(onExit, CLOSE_MS);
  };
  const holes = useMemo(() => Object.keys(data.huecos).sort((a, b) => +a - +b), [data]);
  const [selected, setSelected] = useState<string | null>(holes[0] ?? null);
  const [term, setTerm] = useState<Line[]>([{ kind: 'info', text: tx.ayuda }]);
  const [busy, setBusy] = useState(false);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<string | null>(null);
  const [reaction, setReaction] = useState<Turno | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const [dimming, setDimming] = useState(false);
  const still = useStore((s) => s.settings.reduceEffects);
  const ideRef = useRef<HTMLDivElement>(null);
  const reactRef = useRef<HTMLDivElement>(null);
  // Dónde está el comentario (o el diálogo) en pantalla: se elige al aparecer y se mantiene mientras conversan.
  const lugar = useRef<{ grupo: number; left: number; width: number; bottom: number } | null>(null);
  // Los comentarios esperan su turno: uno a la vez, cada uno con su sprite y su globo.
  const queue = useRef<Turno[]>([]);
  const portrait = (c: Comentario) =>
    c.sprite ?? data.retratos?.[c.quien] ?? `sprites/${c.quien.toLowerCase()}/base.webp`;
  const turnos = (c: Comentario): Turno[] => {
    const uno = (x: Comentario) => ({ key: 0, who: x.quien, text: x.texto, sprite: portrait(x) });
    if (!c.respuesta) return [uno(c)];
    // La respuesta puede tener su propia respuesta (A, B, A…): siguen los mismos dos en pantalla.
    const duo = { key: Math.random(), a: c, b: c.respuesta };
    const out: Turno[] = [];
    for (let x: Comentario | undefined = c; x; x = x.respuesta)
      out.push({ ...uno(x), duo, lado: x.quien === c.quien ? 'a' : 'b' });
    return out;
  };
  const show = (t?: Turno) => {
    setSaliendo(false);
    setReaction(t ? { ...t, key: Date.now() } : null);
  };
  const say = (list: Comentario[], now = false) => {
    const nuevos = list.flatMap(turnos);
    queue.current = now ? nuevos : [...queue.current, ...nuevos];
    if (now || !reaction) {
      const next = queue.current.shift();
      if (next) show(next);
    }
  };
  const termRef = useRef<HTMLDivElement>(null);
  const fallos = useRef(0);
  const pedidos = useRef(0);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLog, setAiLog] = useState<{ de: 'yo' | 'ia'; texto: string }[]>([]);
  const [agotado, setAgotado] = useState(() => !!data.asistente && preguntasSesion >= data.asistente.limite);
  const aiRef = useRef<HTMLDivElement>(null);
  /** Le pregunta algo a GENESIS (otra pregunta y otra excusa cada vez); a veces alguien lo comenta. */
  const preguntar = () => {
    const a = data.asistente!;
    playCancel();
    // Pasado el límite, se bloquea hasta cerrar el Bootcamp.
    if (preguntasSesion >= a.limite) {
      if (!agotado) setAiLog((log) => [...log, { de: 'ia', texto: a.bloqueado }]);
      setAgotado(true);
      return;
    }
    preguntasSesion++;
    const n = pedidos.current++;
    setAiLog((log) => [
      ...log.slice(-40),
      { de: 'yo', texto: a.preguntas[n % a.preguntas.length] },
      { de: 'ia', texto: a.respuestas[n % a.respuestas.length] },
    ]);
    if (n % 2 === 0) say([a.reacciones[(n >> 1) % a.reacciones.length]], true);
  };
  useEffect(() => {
    aiRef.current?.scrollTo(0, aiRef.current.scrollHeight);
  }, [aiLog]);
  const turn = useRef(0);

  useEffect(() => {
    termRef.current?.scrollTo(0, termRef.current.scrollHeight);
  }, [term]);
  useEffect(() => {
    if (!reaction) return;
    let out: ReturnType<typeof setTimeout>;
    const timer = setTimeout(() => {
      const next = queue.current.shift();
      // En un diálogo solo cambia el globo; si no, el comentario se va (con su animación) antes del siguiente.
      if (next && reaction.duo && next.duo === reaction.duo) return show(next);
      setSaliendo(true);
      out = setTimeout(() => show(next), SAY_OUT_MS);
    }, SAY_MS);
    return () => {
      clearTimeout(timer);
      clearTimeout(out);
    };
  }, [reaction]);
  // Cada comentario busca un lugar libre dentro del IDE (el explorador, la paleta o la terminal), sin tapar el
  // código. Se mide antes de pintarse, así que no salta.
  useLayoutEffect(() => {
    const el = reactRef.current;
    const ide = ideRef.current;
    if (!reaction || !el || !ide) return;
    const grupo = reaction.duo?.key ?? reaction.key;
    const base = ide.getBoundingClientRect();
    if (lugar.current?.grupo !== grupo) {
      const q = (s: string) => ide.querySelector(s)?.getBoundingClientRect();
      const files = q('.ide-files');
      const lastFile = [...ide.querySelectorAll('.ide-files button')].at(-1)?.getBoundingClientRect();
      const words = q('.ide-words');
      const compileBtn = q('.ide-compile');
      const palette = q('.ide-palette');
      const term = q('.ide-terminal');
      const editor = q('.ide-code');
      // Hasta dónde llega el código escrito: a la derecha de la línea más larga, el editor está vacío.
      const codeRight = Math.max(
        0,
        ...[...ide.querySelectorAll('.ide-code .ide-line > span:last-child')].map((e) => e.getBoundingClientRect().right),
      );
      const M = 8;
      type Zona = { left: number; right: number; top: number; bottom: number };
      const zonas = [
        files && lastFile && { left: files.left + M, right: files.right - M, top: lastFile.bottom + M, bottom: files.bottom - M },
        palette && words && compileBtn && { left: palette.left + M, right: palette.right - M, top: words.bottom + M, bottom: compileBtn.top - M },
        editor && { left: codeRight + M * 3, right: editor.right - M * 2, top: editor.top + M, bottom: editor.bottom - M },
        term && { left: term.left + term.width * 0.45, right: term.right - M * 2, top: term.top + M, bottom: term.bottom - M },
      ].filter((z): z is Zona => !!z);
      // Último recurso (pantallas chicas): el hueco vacío del editor junto con la paleta, arriba de «Compilar».
      const respaldo = editor && palette && compileBtn ? { left: codeRight + M * 2, right: palette.right - M, top: editor.top, bottom: compileBtn.top - M } : null;
      const fila = el.querySelector<HTMLElement>('.ide-portraits');
      const medir = (z: Zona) => {
        el.style.width = `${Math.min(z.right - z.left, 19 * 16)}px`;
        return { z, w: el.offsetWidth, h: el.offsetHeight, fila: fila?.scrollWidth ?? 0 };
      };
      const entra = (c: ReturnType<typeof medir>) => c.fila <= c.z.right - c.z.left && c.h <= c.z.bottom - c.z.top;
      const cabe = zonas.map(medir).filter(entra);
      const c = cabe[Math.floor(Math.random() * cabe.length)] ?? (respaldo ? [medir(respaldo)].find(entra) : undefined);
      if (c) {
        const left = c.z.left + (c.z.right - c.z.left - c.w) / 2 + (Math.random() - 0.5) * Math.max(0, c.z.right - c.z.left - c.w);
        lugar.current = { grupo, left: left - base.left, width: c.w, bottom: c.z.bottom - base.top };
      } else {
        const z = palette ?? base;
        const width = Math.min(base.width - 16, Math.max(z.width - 8, 15 * 16));
        lugar.current = { grupo, left: base.width - width - 8, width, bottom: (compileBtn?.top ?? base.bottom) - base.top - 8 };
      }
    }
    const l = lugar.current!;
    el.style.width = `${l.width}px`;
    el.style.left = `${l.left}px`;
    el.style.top = `${Math.max(4, l.bottom - el.offsetHeight)}px`;
    // El pico del globo apunta a quien habla.
    const quien = el.querySelector<HTMLElement>('.ide-portrait:not(.ide-portrait-quieto)');
    if (quien) el.style.setProperty('--pico', `${quien.offsetLeft + quien.offsetWidth / 2}px`);
  }, [reaction]);
  // Al abrir: los comentarios de entrada (después de que la ventana termina de aparecer).
  useEffect(() => {
    if (!data.al_abrir?.length) return;
    const timer = setTimeout(() => say(data.al_abrir!), 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Línea de cada hueco en el archivo principal (para los errores).
  const holeLine = useMemo(() => {
    const map: Record<string, number> = {};
    data.archivos
      .find((f) => f.ruta === data.principal)!
      .lineas.forEach((l, i) => {
        for (const m of l.matchAll(HOLE)) map[m[1]] = i + 1;
      });
    return map;
  }, [data]);

  const put = (word: string) => {
    if (!selected || busy || solved) return;
    playSelect();
    const next = { ...fills, [selected]: word };
    setFills(next);
    setWrong(null);
    setSelected(holes.find((h) => !next[h] && h !== selected) ?? selected);
  };
  const clear = () => {
    if (!selected || !fills[selected]) return;
    playCancel();
    const next = { ...fills };
    delete next[selected];
    setFills(next);
  };

  const compile = () => {
    if (busy || solved) return;
    playSelect();
    setBusy(true);
    const cmd: Line = { kind: 'cmd', text: `> ${data.comando}` };
    setTerm((t) => [...t, cmd, { kind: 'info', text: pick(data.compilando) }]);
    setTimeout(() => {
      setBusy(false);
      const empty = holes.find((h) => !fills[h]);
      const bad = holes.find((h) => fills[h] && fills[h] !== data.huecos[h].respuesta);
      if (!empty && !bad) {
        setSolved(true);
        progress.delete(id);
        if (data.al_resolver?.length) say([pick(data.al_resolver)], true);
        setTerm((t) => [...t.slice(0, -1), ...data.exito.map((text) => ({ kind: 'ok' as const, text }))]);
        // Se queda un rato con el resultado; después la pantalla se oscurece y sigue la historia.
        setTimeout(() => setDimming(true), SOLVED_MS);
        setTimeout(() => onSolved(fallos.current), SOLVED_MS + DIM_MS);
        return;
      }
      // No compila: el IDE se sacude con el glitch.
      playGlitch();
      if (!still)
        ideRef.current?.animate(
          [
            { transform: 'none' },
            { transform: 'translate(-9px, 1px) rotate(-0.3deg)' },
            { transform: 'translate(8px, -1px) rotate(0.3deg)' },
            { transform: 'translate(-6px, 0)' },
            { transform: 'translate(4px, 1px)' },
            { transform: 'translate(-2px, 0)' },
            { transform: 'none' },
          ],
          { duration: 420, easing: 'ease-out' },
        );
      fallos.current++;
      const h = bad ?? empty!;
      setWrong(h);
      setSelected(h);
      const msg = bad
        ? `CoffeeError: ${data.principal}:${holeLine[h]} — ${data.huecos[h].error.replace('{valor}', fills[h])}`
        : `CoffeeError: ${data.principal}:${holeLine[h]} — ${data.vacio}`;
      const joke: Line[] =
        Math.random() < data.probabilidad_chiste ? [{ kind: 'info', text: pick(data.chistes_fallo) }] : [];
      setTerm((t) => [...t.slice(0, -1), { kind: 'error', text: msg }, { kind: 'error', text: data.fallo }, ...joke]);
      // A veces, un comentario de alguno de ellos (por turnos), con su sprite.
      if (Math.random() < data.probabilidad_reaccion) {
        const who = Object.keys(data.reacciones);
        const name = who[turn.current++ % who.length];
        const r = pick(data.reacciones[name]);
        // Algunas traen respuesta (p. ej. Cami habla del cuerpo de Rikka y Rikka contesta, enojada o sonrojada).
        say([typeof r === 'string' ? { quien: name, texto: r } : { quien: name, ...r }], true);
      }
    }, 700);
  };

  const current = data.archivos.find((f) => f.ruta === file)!;
  const main = file === data.principal;

  /** Una línea con colores: comentarios, textos, palabras reservadas y huecos. */
  const renderLine = (line: string): ReactNode[] => {
    // Los .txt (notas, historial de prompts) no son código: van sin colores.
    if (!file.endsWith('.coffee')) return [line];
    return colorear(line, (h, i) =>
      main ? (
        <button
          key={i}
          type="button"
          className={`ide-hole ${selected === h ? 'selected' : ''} ${fills[h] ? 'filled' : ''} ${wrong === h ? 'wrong' : ''}`}
          onClick={() => {
            playSelect();
            setSelected(h);
          }}
        >
          {fills[h] ?? '____'}
        </button>
      ) : null,
    );
  };

  // La pantalla se pone negra y el programa se abre encima, como una ventana que se lanza.
  return (
    <div className={`ide-screen ${closing ? 'closing' : ''} ${dimming ? 'dimming' : ''}`}>
      <div
        ref={ideRef}
        className={`coffee-ide ${solved ? 'solved' : ''}`}
        role="dialog"
        aria-label={`GRAVITY — ${data.proyecto}`}
      >
        <div className="ide-titlebar">
          <span className="ide-dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <b>GRAVITY</b>
          <span className="ide-path">
            {data.proyecto}/{file}
          </span>
          {data.asistente && (
            <button
              type="button"
              className="ide-ai"
              aria-pressed={aiOpen}
              onClick={() => {
                if (aiOpen) return setAiOpen(false);
                setAiOpen(true);
                if (aiLog.length === 0) preguntar();
                else playSelect();
              }}
            >
              <img src={assetUrl(data.asistente.icono)} alt="" draggable={false} />
              {data.asistente.nombre}
            </button>
          )}
          {onExit && (
            <button type="button" className="ide-exit" onClick={exit} disabled={solved || closing}>
              {tx.salir} ✕
            </button>
          )}
        </div>
        {aiOpen && data.asistente && (
          <div className="ide-ai-panel" role="dialog" aria-label={data.asistente.nombre}>
            <header>
              <img src={assetUrl(data.asistente.icono)} alt="" draggable={false} />
              <span>
                <b>{data.asistente.nombre}</b>
                <small>
                  <i aria-hidden /> {data.asistente.estado}
                </small>
              </span>
              <button type="button" onClick={() => setAiOpen(false)} aria-label={tx.salir}>
                ✕
              </button>
            </header>
            <div className="ide-ai-log" ref={aiRef}>
              {aiLog.map((m, i) => (
                <p key={i} className={`ide-ai-msg ${m.de}`}>
                  {m.texto}
                </p>
              ))}
            </div>
            <div className={`ide-ai-input ${agotado ? 'agotado' : ''}`}>
              <span>{agotado ? data.asistente.bloqueado_input : data.asistente.sin_tokens}</span>
              <button type="button" onClick={preguntar} aria-label="↻" disabled={agotado}>
                ↻
              </button>
            </div>
          </div>
        )}
        <div className="ide-main">
          <nav className="ide-files" aria-label={tx.explorador}>
            <h4>{tx.explorador}</h4>
            {data.archivos.map((f) => (
              <button
                key={f.ruta}
                type="button"
                className={f.ruta === file ? 'active' : ''}
                onClick={() => {
                  if (f.ruta === file) return;
                  playSelect();
                  setFile(f.ruta);
                }}
              >
                <span aria-hidden>{f.ruta.endsWith('.txt') ? '≡' : '☕'}</span>
                {f.ruta}
              </button>
            ))}
          </nav>
          <div className="ide-editor">
            <div className="ide-tab">
              ☕ {file.split('/').pop()}
              {!main && <small>{tx.solo_lectura}</small>}
            </div>
            <pre className="ide-code">
              {current.lineas.map((l, i) => (
                <div key={`${file}-${i}`} className="ide-line">
                  <span className="ide-num">{i + 1}</span>
                  <span>{renderLine(l)}</span>
                </div>
              ))}
            </pre>
          </div>
          <aside className="ide-palette" aria-label={tx.paleta}>
            <h4>
              {tx.paleta}
              <button type="button" onClick={clear} disabled={!selected || !fills[selected]}>
                {tx.quitar}
              </button>
            </h4>
            <div className="ide-words">
              {data.paleta.map((w) => (
                <button key={w} type="button" onClick={() => put(w)} disabled={!selected || busy || solved}>
                  {w}
                </button>
              ))}
            </div>
            <button type="button" className="ide-compile" onClick={compile} disabled={busy || solved}>
              ▶ {tx.compilar}
            </button>
          </aside>
        </div>
        <div className="ide-terminal" ref={termRef} aria-live="polite">
          {term.map((l, i) => (
            <div key={i} className={`ide-out ide-${l.kind}`}>
              {l.text}
            </div>
          ))}
        </div>
        {reaction && (
          // El globo arriba y, abajo, quien habla; en un diálogo, los dos uno al lado del otro (quien empieza a la
          // izquierda) y quien escucha más oscuro.
          <div
            key={reaction.duo?.key ?? reaction.key}
            ref={reactRef}
            className={`ide-reaction ${reaction.duo ? 'ide-duo' : ''} ${saliendo ? 'ide-reaction-out' : ''}`}
          >
            <Globo key={reaction.key} who={reaction.who} text={reaction.text} />
            <div className="ide-portraits">
              {reaction.duo ? (
                <>
                  <Retrato
                    sprite={reaction.lado === 'a' ? reaction.sprite : portrait(reaction.duo.a)}
                    who={reaction.duo.a.quien}
                    quieto={reaction.lado !== 'a'}
                  />
                  <Retrato
                    sprite={reaction.lado === 'b' ? reaction.sprite : portrait(reaction.duo.b)}
                    who={reaction.duo.b.quien}
                    quieto={reaction.lado !== 'b'}
                  />
                </>
              ) : (
                <Retrato sprite={reaction.sprite} who={reaction.who} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** El globo de un comentario; el pico (abajo) apunta a quien habla. */
function Globo({ who, text }: { who: string; text: string }) {
  return (
    <span className="ide-bubble" style={{ ['--who' as string]: speakerColor(who) }}>
      <b>{who}</b>
      <span>{text}</span>
    </span>
  );
}

/** El busto de quien comenta; en un diálogo, quien escucha queda más oscuro. */
function Retrato({ sprite, who, quieto }: { sprite: string; who: string; quieto?: boolean }) {
  return (
    <span
      className={`ide-portrait ${quieto ? 'ide-portrait-quieto' : ''}`}
      style={{ ['--who' as string]: speakerColor(who), ['--head' as string]: headTop(sprite) }}
    >
      <img src={assetUrl(sprite)} alt="" draggable={false} />
    </span>
  );
}

/**
 * Colorea una línea de Coffee: comentarios, textos, palabras reservadas y tipos. Los huecos ([[n]]) los dibuja
 * `hueco` (si no hay, o devuelve null, quedan como texto). También la usa la pizarra de las charlas del Bootcamp.
 */
export function colorear(line: string, hueco?: (h: string, key: number) => ReactNode): ReactNode[] {
  const out: ReactNode[] = [];
  const comment = findComment(line);
  const code = comment < 0 ? line : line.slice(0, comment);
  code.split(/(\[\[\d+\]\]|'[^']*'|[A-Za-zÀ-ÿñÑ_]+)/).forEach((p, i) => {
    if (!p) return;
    const hole = p.match(/^\[\[(\d+)\]\]$/);
    const node = hole && hueco ? hueco(hole[1], i) : null;
    if (node) out.push(node);
    else if (p.startsWith("'"))
      out.push(
        <span key={i} className="ide-str">
          {p}
        </span>,
      );
    else if (KEYWORDS.has(p))
      out.push(
        <span key={i} className="ide-kw">
          {p}
        </span>,
      );
    else if (/^[A-Z]/.test(p))
      out.push(
        <span key={i} className="ide-type">
          {p}
        </span>,
      );
    else out.push(p);
  });
  if (comment >= 0)
    out.push(
      <span key="c" className="ide-comment">
        {line.slice(comment)}
      </span>,
    );
  return out;
}

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/** Dónde empieza el comentario (// fuera de un texto entre comillas), o -1. */
function findComment(line: string): number {
  let inStr = false;
  for (let i = 0; i < line.length - 1; i++) {
    if (line[i] === "'") inStr = !inStr;
    if (!inStr && line[i] === '/' && line[i + 1] === '/') return i;
  }
  return -1;
}
