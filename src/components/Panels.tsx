import { leerPartida, nombreArchivo, textoExportado } from '../engine/partidaArchivo';
import { assetUrl } from '../engine/assets';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CHAPTER_END, SAVE_SLOTS, TEXT_SPEED_INSTANT, canSaveGame, useStore, type SaveSlot } from '../engine/store';
import { choiceText, lineText, speakerName } from '../engine/storyText';
import { BAD_END, config, endingName, endings, scenes } from '../engine/story';
import { detectLanguage, localized, useLang, useT } from '../engine/i18n';
import conoceMasEs from '../data/conoce_mas.json';
import borradoEs from '../data/borrado.json';
import borradoEn from '../data/en/borrado.json';
import conoceMasEn from '../data/en/conoce_mas.json';
import { enterPlayMode } from '../engine/mobile';
import { playCancel, playSelect } from '../engine/sound';
import { SaveThumb } from './SaveThumb';
import { NoData } from './NoData';
import { NewDot } from './CgGallery';
import { useGalleryState } from '../engine/gallery';
import { useCompletion } from '../engine/completion';

/** Duración de la animación de cierre (ver .panel-closing en styles.css). */
const PANEL_CLOSE_MS = 280;

export function Panel({
  title,
  onClose,
  wide,
  children,
}: {
  title: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  const t = useT();
  const [closing, setClosing] = useState(false);
  // Solo se cierra con «Cerrar» (un clic afuera no hace nada), con la animación de apagado antes de desaparecer.
  const close = () => {
    if (closing) return;
    playCancel();
    if (useStore.getState().settings.reduceEffects || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    setClosing(true);
    setTimeout(onClose, PANEL_CLOSE_MS);
  };
  // Cada panel se abre como una terminal: la ventana se enciende, se «escribe» el comando y aparece el contenido.
  const slug = title
    .toLowerCase()
    .replace(/\s*\(.*\)$/, '')
    .replace(/\s+/g, '_');
  return (
    <div className={`panel-backdrop ${closing ? 'panel-closing' : ''}`}>
      <div className={`panel panel-terminal ${wide ? 'panel-wide' : ''}`}>
        <div className="panel-head">
          <span className="term-dots" aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <h2>{title}</h2>
          <span className="term-path" aria-hidden>
            genesis@nexus:~/{slug}
          </span>
          <button onClick={close}>{t('panel.cerrar')}</button>
        </div>
        <div className="term-boot" aria-hidden>
          <span className="term-prompt">$</span>{' '}
          <span className="term-cmd">{t('terminal.abrir', { nombre: slug })}</span>
          <span className="term-ok"> {t('terminal.listo')}</span>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}

export function HistoryPanel({ onClose }: { onClose: () => void }) {
  const history = useStore((s) => s.game?.history ?? []);
  const t = useT();
  const lang = useLang();
  return (
    <Panel title={t('historial.titulo')} onClose={onClose}>
      {history.length === 0 && <p className="muted">{t('historial.vacio')}</p>}
      {history.map((h, i) => (
        <p key={i} className={h.choice ? 'history-choice' : ''}>
          {h.choice ? '› ' : h.speaker ? <strong>{speakerName(h.speaker, lang)}: </strong> : null}
          {h.choice ? choiceText(h.sid, h.ci, h.text, lang) : lineText(h.sid, h.text, lang)}
        </p>
      ))}
    </Panel>
  );
}

/** Largo máximo del nombre de una partida guardada. */
const SAVE_NAME_MAX = 40;

/**
 * Guardar y cargar. Al guardar se pide un nombre (con uno sugerido: el capítulo) y después se puede cambiar
 * con «Renombrar»; borrar una partida pide confirmación.
 */
export function SaveLoadPanel({ mode, onClose }: { mode: 'save' | 'load'; onClose: () => void }) {
  const saves = useStore((s) => s.saves);
  const canSave = useStore((s) => !!s.game && canSaveGame(s.game));
  const game = useStore((s) => s.game);
  const { save, load, deleteSave, renameSave } = useStore.getState();
  const t = useT();
  const lang = useLang();
  const [naming, setNaming] = useState<{ slot: number; kind: 'save' | 'rename'; text: string } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  // Exportar e importar: el juego es web y las partidas viven en este navegador (engine/partidaArchivo.ts).
  const archivo = useRef<HTMLInputElement>(null);
  const [destino, setDestino] = useState(0);
  const [aviso, setAviso] = useState('');
  /** Lo leído de un archivo, esperando confirmar porque ese espacio ya tiene una partida. */
  const [reemplazar, setReemplazar] = useState<SaveSlot | null>(null);
  const exportar = (i: number) => {
    const p = saves[i];
    if (!p) return;
    playSelect();
    const url = URL.createObjectURL(new Blob([textoExportado(p, config.version ?? '')], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo(p);
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setAviso(t('guardar.exportado'));
  };
  const elegirArchivo = (i: number) => {
    playSelect();
    setDestino(i);
    setAviso('');
    archivo.current?.click();
  };
  const leerArchivo = async (f: File | undefined) => {
    if (!f) return;
    // Sin leer los enormes: no son partidas.
    const r = f.size > 5_000_000 ? ({ error: 'grande' } as const) : leerPartida(await f.text(), (id) => scenes.has(id));
    if ('error' in r) return setAviso(t(`guardar.importar_${r.error}`));
    if (saves[destino]) return setReemplazar(r.partida);
    useStore.getState().importarPartida(destino, r.partida);
    setAviso(t('guardar.importado'));
  };
  const slotName = (i: number) => saves[i]?.nombre || t('guardar.espacio', { n: i + 1 });
  const suggested = () => t('guardar.nombre_defecto', { n: (game && scenes.get(game.sceneId)?.chapter) ?? 1 });
  const commit = () => {
    if (!naming) return;
    const name = naming.text.trim().slice(0, SAVE_NAME_MAX);
    if (naming.kind === 'save') save(naming.slot, name || suggested());
    else renameSave(naming.slot, name);
    playSelect();
    setNaming(null);
  };
  const cancelNaming = () => {
    playCancel();
    setNaming(null);
  };
  return (
    <Panel title={mode === 'save' ? t('guardar.titulo') : t('cargar.titulo')} onClose={onClose}>
      <input
        ref={archivo}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => {
          void leerArchivo(e.target.files?.[0]);
          // Para poder elegir el mismo archivo otra vez.
          e.target.value = '';
        }}
      />
      {aviso && (
        <p className="slot-aviso" role="status">
          {aviso}
        </p>
      )}
      {Array.from({ length: SAVE_SLOTS }, (_, i) => {
        const slot = saves[i];
        const editing = naming?.slot === i ? naming : null;
        return (
          <div key={i} className="slot">
            {slot ? (
              <SaveThumb sceneId={slot.sceneId} finished={slot.finished} />
            ) : (
              <div className="save-thumb">
                <NoData />
              </div>
            )}
            {editing ? (
              <form
                className="slot-name-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  commit();
                }}
              >
                <label htmlFor={`slot-name-${i}`}>
                  {t(editing.kind === 'save' ? 'guardar.nombre_pide' : 'guardar.renombrar_pide')}
                </label>
                <input
                  id={`slot-name-${i}`}
                  autoFocus
                  value={editing.text}
                  maxLength={SAVE_NAME_MAX}
                  placeholder={editing.kind === 'save' ? suggested() : t('guardar.espacio', { n: i + 1 })}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => setNaming({ ...editing, text: e.target.value })}
                  onKeyDown={(e) => {
                    // Que las teclas no lleguen al juego (Espacio, números de las decisiones, M…).
                    e.stopPropagation();
                    if (e.key === 'Escape') cancelNaming();
                  }}
                />
                {editing.kind === 'save' && slot && <small className="slot-warn">{t('guardar.reemplaza')}</small>}
                <div className="slot-name-actions">
                  <button type="button" onClick={cancelNaming}>
                    {t('guardar.cancelar')}
                  </button>
                  <button type="submit">{t(editing.kind === 'save' ? 'guardar.guardar' : 'guardar.listo')}</button>
                </div>
              </form>
            ) : (
              <div className="slot-info">
                <strong>{slotName(i)}</strong>
                {slot?.nombre && <small className="muted">{t('guardar.espacio', { n: i + 1 })}</small>}
                {slot ? (
                  <>
                    <span className="muted">{new Date(slot.date).toLocaleString(lang)}</span>
                    <span>
                      {slot.finished?.startsWith(CHAPTER_END)
                        ? t('mapa.fin_capitulo', { n: slot.finished.slice(CHAPTER_END.length) })
                        : lineText(slot.sceneId, slot.preview, lang).slice(0, 80)}
                    </span>
                  </>
                ) : (
                  <span className="muted">{t('guardar.vacio')}</span>
                )}
              </div>
            )}
            {!editing && (
              <div className="slot-actions">
                {mode === 'save' ? (
                  <button
                    disabled={!canSave}
                    onClick={() => {
                      playSelect();
                      setNaming({ slot: i, kind: 'save', text: slot?.nombre ?? suggested() });
                    }}
                  >
                    {t('guardar.guardar')}
                  </button>
                ) : (
                  <button
                    disabled={!slot}
                    onClick={() => {
                      void enterPlayMode();
                      load(i);
                      onClose();
                    }}
                  >
                    {t('guardar.cargar')}
                  </button>
                )}
                {slot && (
                  <button
                    onClick={() => {
                      playSelect();
                      setNaming({ slot: i, kind: 'rename', text: slot.nombre ?? '' });
                    }}
                  >
                    {t('guardar.renombrar')}
                  </button>
                )}
                <button
                  disabled={!slot}
                  onClick={() => {
                    playSelect();
                    setDeleting(i);
                  }}
                >
                  {t('guardar.borrar')}
                </button>
                {slot && <button onClick={() => exportar(i)}>{t('guardar.exportar')}</button>}
                <button onClick={() => elegirArchivo(i)}>{t('guardar.importar')}</button>
              </div>
            )}
          </div>
        );
      })}
      {reemplazar && (
        <ConfirmDialog
          title={t('guardar.importar_titulo')}
          text={t('guardar.importar_texto', { nombre: slotName(destino) })}
          confirm={t('guardar.importar')}
          cancel={t('guardar.cancelar')}
          onCancel={() => setReemplazar(null)}
          onConfirm={() => {
            useStore.getState().importarPartida(destino, reemplazar);
            setReemplazar(null);
            setAviso(t('guardar.importado'));
          }}
        />
      )}
      {deleting !== null && saves[deleting] && (
        <ConfirmDialog
          title={t('guardar.borrar_titulo')}
          text={t('guardar.borrar_texto', { nombre: slotName(deleting) })}
          confirm={t('guardar.borrar')}
          cancel={t('guardar.cancelar')}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            deleteSave(deleting);
            setDeleting(null);
          }}
        />
      )}
    </Panel>
  );
}

/** Ventana de confirmación (la misma de «¿Volver al menú?»), encima de todo; Escape cancela. */
function ConfirmDialog({
  title,
  text,
  confirm,
  cancel,
  onCancel,
  onConfirm,
}: {
  title: string;
  text: string;
  confirm: string;
  cancel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const back = () => {
    playCancel();
    onCancel();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      back();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });
  return createPortal(
    <div className="confirm-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="confirm-box">
        <b id="confirm-dialog-title">{title}</b>
        <p>{text}</p>
        <div className="confirm-actions">
          <button onClick={back} autoFocus>
            {cancel}
          </button>
          <button
            className="confirm-danger"
            onClick={() => {
              playCancel();
              onConfirm();
            }}
          >
            {confirm}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function EndingsGallery({ onClose }: { onClose: () => void }) {
  const seen = useStore((s) => s.endingsSeen);
  const t = useT();
  const lang = useLang();
  // Solo los finales que existen en esta versión: los del juego completo aparecen cuando estén escritos.
  const visible = endings.filter((e) => e.estado === 'jugable' && (!e.oculto || seen[e.id]));
  const groups = [
    { title: t('finales.grupo'), list: visible.filter((e) => e.tipo !== BAD_END) },
    { title: t('finales.bad'), list: visible.filter((e) => e.tipo === BAD_END) },
  ];
  return (
    <Panel title={t('finales.titulo')} onClose={onClose}>
      {groups.map((g) => (
        <section key={g.title} className="ending-group">
          <h3>
            {g.title} ({g.list.filter((e) => seen[e.id]).length}/{g.list.length})
          </h3>
          {g.list.length === 0 && <p className="muted">{t('finales.proximos')}</p>}
          {g.list.map((e) => (
            <div key={e.id} className={`ending ${seen[e.id] ? '' : 'ending-locked'}`}>
              <strong>{seen[e.id] ? endingName(e, lang) : '???'}</strong>
              <span className="muted">
                {e.pieza} · {e.tipo}
                {seen[e.id] ? ` · ${new Date(seen[e.id]).toLocaleDateString(lang)}` : ''}
              </span>
            </div>
          ))}
        </section>
      ))}
    </Panel>
  );
}

/** Extras: entradas a la galería de imágenes y a los finales, como comandos de la terminal. */
export function ExtrasPanel({
  onClose,
  onOpen,
}: {
  onClose: () => void;
  onOpen: (o: 'gallery' | 'endings' | 'torneo') => void;
}) {
  const t = useT();
  const galleryNew = useGalleryState().hasNew;
  const entries = [
    { id: 'gallery' as const, cmd: 'galeria', label: t('extras.galeria'), desc: t('extras.galeria_desc') },
    { id: 'endings' as const, cmd: 'finales', label: t('extras.finales'), desc: t('extras.finales_desc') },
    // El torneo, apagado en la demo publicada (`torneo_activo` en juego.json).
    ...(config.torneo_activo === false ? [] : [{ id: 'torneo' as const, cmd: 'torneo', label: t('extras.torneo'), desc: t('extras.torneo_desc') }]),
  ];
  return (
    <Panel title={t('extras.titulo')} onClose={onClose}>
      <CompletionMeter />
      <div className="extras">
        {entries.map((e) => (
          <button
            key={e.id}
            className="extras-entry"
            onClick={() => {
              playSelect();
              onOpen(e.id);
            }}
          >
            <span className="term-prompt">&gt;</span>
            <span>
              <strong>{e.label}</strong>
              <small>{e.desc}</small>
            </span>
            {e.id === 'gallery' && galleryNew && <NewDot />}
            <span className="extras-run">./{e.cmd}</span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

/** Cuánto falta para el 100 % (todo lo desbloqueable cuenta), con el detalle por tipo. */
function CompletionMeter() {
  const t = useT();
  const c = useCompletion();
  return (
    <section className="completion">
      <div className="completion-head">
        <strong>{c.percent.toFixed(2)} %</strong>
        <span>
          {c.missing === 0
            ? t('progreso.completo')
            : t('progreso.falta', { n: ((10000 - Math.round(c.percent * 100)) / 100).toFixed(2), k: c.missing })}
        </span>
      </div>
      <div className="completion-bar" role="progressbar" aria-valuenow={c.percent} aria-valuemin={0} aria-valuemax={100}>
        <i style={{ width: `${c.percent}%` }} />
      </div>
      <details className="completion-detail">
        <summary>{t('progreso.detalle')}</summary>
        <ul>
          {c.parts.map((p) => (
            <li key={p.id} className={p.got === p.total ? 'completion-done' : ''}>
              <span>{t(`progreso.${p.id}`)}</span>
              <span>
                {p.got}/{p.total}
              </span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

/** La parte de «Conoce más» a la que va una sección (el juego o el autor); la advertencia no tiene. */
const parteDe = (s: object) => ('parte' in s ? (s.parte as string) : undefined);

/** Una canción (o disco) de «Conoce más». Sin `spotify`, el vínculo busca la canción en Spotify. */
type CancionConoce = { personaje?: string; cancion: string; banda: string; nota?: string; spotify?: string };

/** Un bloque de texto de «Conoce más»: párrafos, una lista de canciones y su cierre. */
type BloqueConoceData = { parrafos: string[]; canciones?: CancionConoce[]; cierre?: string[] };

/**
 * Un vínculo de canción: el nombre en color, que abre Spotify (decisión del autor: las canciones van como vínculos en el
 * texto, sin listas ni botones).
 */
function VinculoCancion({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="about-vinculo" href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/** Un párrafo con vínculos escritos como `[texto](https://…)` (en los JSON de «Conoce más»). */
function conVinculos(texto: string): ReactNode[] {
  return texto.split(/(\[[^\]]+\]\(https?:\/\/[^)\s]+\))/).map((parte, i) => {
    const m = parte.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    return m ? <VinculoCancion key={i} href={m[2]}>{m[1]}</VinculoCancion> : parte;
  });
}

function BloqueConoce({ b }: { b: object }) {
  const t = useT();
  const { parrafos, canciones, cierre } = b as BloqueConoceData;
  return (
    <>
      {/* Un párrafo que empieza con «### » es un subtítulo dentro de la sección (la nota personal). */}
      {parrafos.map((p, i) =>
        p.startsWith('### ') ? (
          <h4 key={i} className="about-subtitulo">
            {p.slice(4)}
          </h4>
        ) : (
          <p key={i}>{conVinculos(p)}</p>
        ),
      )}
      {/* La canción de cada personaje: con su botón para escucharla en Spotify (decisión del autor). */}
      {canciones?.map((c) => (
        <div key={c.cancion} className="about-cancion">
          <p>
            {c.personaje && <b>{c.personaje}:</b>} «{c.cancion}», {c.banda}. {c.nota}
          </p>
          <a
            className="about-spotify"
            href={c.spotify ?? `https://open.spotify.com/search/${encodeURIComponent(`${c.cancion} ${c.banda}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            ▶ {t('conoce.escuchar')}
          </a>
        </div>
      ))}
      {cierre?.map((p, i) => (
        <p key={`c${i}`}>{conVinculos(p)}</p>
      ))}
    </>
  );
}

/** «Conoce más del proyecto»: qué es el juego, de qué trata, sus temas, cómo nació y enlaces del autor. */
export function AboutPanel({ onClose }: { onClose: () => void }) {
  const t = useT();
  const conoceMas = localized(conoceMasEs, conoceMasEn, useLang());
  return (
    <Panel title={conoceMas.titulo} onClose={onClose}>
      <div className="about">
        <img className="about-logo" src={`${import.meta.env.BASE_URL}marca/logo.webp`} alt="PROJECT GENESIS" />
        {/* Antes del índice: que no es obligatoria, pero ayuda a entender la obra. */}
        {'aviso' in conoceMas && conoceMas.aviso && <p className="about-aviso">{conoceMas.aviso}</p>}
        {/* Índice: cada sección a un toque (la página es larga). */}
        <nav className="about-indice" id="about-indice" aria-label={t('conoce.indice')}>
          <b>{t('conoce.indice')}</b>
          {/* Primero lo que va antes de todo (la advertencia); después, el juego y el autor por separado. */}
          {[undefined, 'juego', 'autor'].map((parte) => (
            <div key={parte ?? 'inicio'} className="about-indice-parte">
              {parte && <span>{t(`conoce.parte_${parte}`)}</span>}
              <ul>
                {conoceMas.secciones.map((s, i) =>
                  parteDe(s) === parte ? (
                    <li key={s.titulo}>
                      <button type="button" onClick={() => document.getElementById(`about-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                        {s.titulo}
                      </button>
                    </li>
                  ) : null,
                )}
              </ul>
            </div>
          ))}
        </nav>
        {conoceMas.secciones.map((s, i) => (
          <section key={s.titulo} className="about-section" id={`about-${i}`}>
            {/* El título de la parte, antes de su primera sección. */}
            {parteDe(s) && (i === 0 || parteDe(s) !== parteDe(conoceMas.secciones[i - 1])) && (
              <h2 className="about-parte">{t(`conoce.parte_${parteDe(s)}`)}</h2>
            )}
            <h3>{s.titulo}</h3>
            <BloqueConoce b={s} />
            {/* Más de lo mismo dentro de la sección, después de su cierre (Bad Bunny, Mac Miller). */}
            {'anexos' in s && (s.anexos as BloqueConoceData[] | undefined)?.map((b, k) => <BloqueConoce key={k} b={b} />)}
            <button type="button" className="about-arriba" onClick={() => document.getElementById('about-indice')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              ↑ {t('conoce.indice')}
            </button>
          </section>
        ))}
        <div className="about-links">
          {conoceMas.enlaces.map((l) => (
            <a
              key={l.url}
              className={`about-link ${'destacado' in l && l.destacado ? 'about-link-main' : ''}`}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {l.texto}
              {/* La donación: amarilla, con el logo de PayPal (pedido del autor). */}
              {'destacado' in l && l.destacado && <img src={assetUrl('marca/paypal.webp')} alt="PayPal" draggable={false} />}
            </a>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// Tamaños de texto de la caja de diálogo.
const TEXT_SIZES = [
  { label: 'opciones.tam_pequena', value: 0.9 },
  { label: 'opciones.tam_normal', value: 1 },
  { label: 'opciones.tam_grande', value: 1.15 },
  { label: 'opciones.tam_muy_grande', value: 1.3 },
];

/** Cuánto tarda cada parte del borrado (ms). */
const DELETE_FILE_MS = 260;
const DELETE_DONE_MS = 1100;
const DELETE_FADE_MS = 800;
/** Borrar en plena partida: un glitch corto, la pantalla en negro un momento y el título. */
const DELETE_GLITCH_MS = 1900;

/**
 * El borrado en sí: barra de progreso y los archivos que se van «borrando» (con chistes), «Borrado completado»,
 * fundido a negro y vuelta al título con todo en cero (sin recargar la página). Textos en src/data/borrado.json.
 */
function Deleting({ glitch = false }: { glitch?: boolean }) {
  const lang = useLang();
  const tx = localized(borradoEs, borradoEn, lang);
  const files = tx.archivos;
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<'files' | 'done' | 'fade'>('files');
  useEffect(() => {
    if (phase === 'files') {
      if (n >= files.length) {
        setPhase('done');
        return;
      }
      const timer = setTimeout(() => setN(n + 1), DELETE_FILE_MS);
      return () => clearTimeout(timer);
    }
    if (phase === 'done') {
      const timer = setTimeout(() => setPhase('fade'), DELETE_DONE_MS);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      useStore.getState().resetAll();
      window.dispatchEvent(new Event('genesis:borrado'));
    }, glitch ? DELETE_GLITCH_MS : DELETE_FADE_MS);
    return () => clearTimeout(timer);
  }, [n, phase, files.length, glitch]);
  const pct = Math.round((Math.min(n, files.length) / files.length) * 100);
  return (
    <>
      <div className="danger-modal deleting" role="status" aria-live="polite">
        <div className="danger-modal-head">
          <h3>{phase === 'files' ? tx.titulo : tx.completado}</h3>
          <span className="deleting-pct">{pct}%</span>
        </div>
        <div className="deleting-body">
          <div className="deleting-bar">
            <i style={{ width: `${pct}%` }} />
          </div>
          <ul className="deleting-files">
            {files.slice(Math.max(0, n - 6), n).map((f, i) => (
              <li key={f} className={i === Math.min(n, 6) - 1 && phase === 'files' ? 'current' : ''}>
                <span className="deleting-x">✕</span> {tx.borrando} {f}
              </li>
            ))}
          </ul>
          {phase !== 'files' && (
            <p className="deleting-done">
              <b>✓ {tx.completado}</b> {tx.remate}
            </p>
          )}
        </div>
      </div>
      {phase === 'fade' &&
        // Afuera de todo (en plena pelea, la pausa no la congela ni la recorta).
        createPortal(<div className={`deleting-fade ${glitch ? 'glitch' : ''}`} aria-hidden />, document.body)}
    </>
  );
}

/** Quita tildes y espacios de más, para comparar la frase de confirmación sin exigir ortografía perfecta. */
const plain = (x: string) =>
  x
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/**
 * Zona de peligro (como la de GitHub): borrar todos los datos. Hay que escribir la frase de confirmación;
 * borra partidas, lo desbloqueado (galería, finales, Boringram, lo leído) y las opciones, y recarga el juego.
 */
function DangerZone({ glitch = false }: { glitch?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const phrase = t('opciones.borrar_frase');
  const ok = plain(typed) === plain(phrase);
  return (
    <section className="danger-zone">
      <h3>{t('opciones.peligro')}</h3>
      <div className="danger-row">
        <div>
          <b>{t('opciones.borrar_datos')}</b>
          <p>{t('opciones.borrar_desc')}</p>
        </div>
        <button
          className="danger"
          onClick={() => {
            playCancel();
            setOpen(true);
          }}
        >
          {t('opciones.borrar_datos')}
        </button>
      </div>
      {open && (
        <div className="danger-modal-backdrop">
          {deleting ? (
            <Deleting glitch={glitch} />
          ) : (
            <div className="danger-modal" role="dialog" aria-modal="true" aria-labelledby="danger-title">
              <div className="danger-modal-head">
                <h3 id="danger-title">{t('opciones.borrar_datos')}</h3>
                <button
                  className="danger-modal-x"
                  aria-label={t('opciones.borrar_no')}
                  onClick={() => {
                    playCancel();
                    setOpen(false);
                    setTyped('');
                  }}
                >
                  ×
                </button>
              </div>
              <div className="danger-confirm">
                <p className="danger-warning">{t('opciones.borrar_seguro')}</p>
                <p className="muted">{t('opciones.borrar_desc')}</p>
                <label>
                  {t('opciones.borrar_escribe')} <code>{phrase}</code>
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    autoFocus
                    placeholder={phrase}
                  />
                </label>
                <small className="muted">{t('opciones.borrar_nota')}</small>
                <button
                  className="danger danger-full"
                  disabled={!ok}
                  onClick={() => {
                    playCancel();
                    setDeleting(true);
                  }}
                >
                  {t('opciones.borrar_si')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** `enJuego`: abierto en plena partida (la pausa de una pelea); borrar todo termina con un glitch y vuelve al título. */
export function OptionsPanel({ onClose, enJuego = false }: { onClose: () => void; enJuego?: boolean }) {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const t = useT();
  const lang = useLang();
  const detected = detectLanguage();
  return (
    <Panel title={t('opciones.titulo')} onClose={onClose}>
      <h3 className="options-section">{t('opciones.idioma')}</h3>
      <div className="option">
        <div className="segmented">
          {(['auto', 'es', 'en'] as const).map((l) => (
            <button
              key={l}
              className={settings.language === l ? 'active' : ''}
              onClick={() => setSettings({ language: l })}
            >
              {l === 'auto' ? `${t('idioma.auto')} (${t(`idioma.${detected.lang}`)})` : t(`idioma.${l}`)}
            </button>
          ))}
        </div>
        <span className="muted options-tip">
          {settings.language === 'auto'
            ? t('idioma.detectado', { idioma: t(`idioma.${detected.lang}`), codigo: detected.code })
            : t('idioma.elegido', { idioma: t(`idioma.${lang}`) })}
        </span>
        {t('idioma.historia_es') && <span className="muted options-tip">{t('idioma.historia_es')}</span>}
      </div>

      <h3 className="options-section">{t('opciones.lectura')}</h3>
      {/* Vista previa: muestra al momento el tamaño del texto y la opacidad de la caja. */}
      <div className="reading-preview" aria-hidden>
        <div className="dialog dialog-has-speaker" style={{ '--speaker': '#ff6fa5' } as CSSProperties}>
          <div className="dialog-speaker">Nikki</div>
          <div className="dialog-text">{t('opciones.preview')}</div>
        </div>
      </div>
      <div className="option">
        {t('opciones.tamano')}
        <div className="segmented">
          {TEXT_SIZES.map((s) => (
            <button
              key={s.value}
              className={settings.textScale === s.value ? 'active' : ''}
              onClick={() => setSettings({ textScale: s.value })}
            >
              {t(s.label)}
            </button>
          ))}
        </div>
      </div>
      <label className="option">
        {t('opciones.opacidad', { n: Math.round(settings.boxOpacity * 100) })}
        <input
          type="range"
          min={0.4}
          max={1}
          step={0.04}
          value={settings.boxOpacity}
          onChange={(e) => setSettings({ boxOpacity: Number(e.target.value) })}
        />
      </label>
      <label className="option">
        {t('opciones.velocidad', {
          v:
            settings.textSpeed >= TEXT_SPEED_INSTANT
              ? t('opciones.instantaneo')
              : t('opciones.letras', { n: settings.textSpeed }),
        })}
        <input
          type="range"
          min={10}
          max={TEXT_SPEED_INSTANT}
          step={5}
          value={Math.min(settings.textSpeed, TEXT_SPEED_INSTANT)}
          onChange={(e) => setSettings({ textSpeed: Number(e.target.value) })}
        />
      </label>
      <label className="option">
        {t('opciones.auto', { n: (settings.autoDelayMs / 1000).toFixed(1) })}
        <input
          type="range"
          min={300}
          max={5000}
          step={100}
          value={settings.autoDelayMs}
          onChange={(e) => setSettings({ autoDelayMs: Number(e.target.value) })}
        />
      </label>
      <p className="muted options-tip">{t('opciones.ocultar_tip')}</p>

      <h3 className="options-section">{t('opciones.sonido')}</h3>
      <label className="option">
        <input type="checkbox" checked={settings.muted} onChange={(e) => setSettings({ muted: e.target.checked })} />
        {t('opciones.silenciar')}
      </label>
      <label className="option">
        {t('opciones.musica', { n: Math.round(settings.musicVolume * 100) })}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.musicVolume}
          onChange={(e) => setSettings({ musicVolume: Number(e.target.value) })}
        />
      </label>
      <label className="option">
        {t('opciones.efectos', { n: Math.round(settings.sfxVolume * 100) })}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.sfxVolume}
          onChange={(e) => setSettings({ sfxVolume: Number(e.target.value) })}
        />
      </label>
      <label className="option">
        <input
          type="checkbox"
          checked={settings.typingSound}
          onChange={(e) => setSettings({ typingSound: e.target.checked })}
        />
        {t('opciones.tecleo')}
      </label>

      <h3 className="options-section">{t('opciones.pantalla')}</h3>
      {/* Modo de pantalla: cada uno con su miniatura de cómo se ve la partida. */}
      <div className="option option-modo">
        {t('opciones.modo_pantalla')}
        <div className="modo-pantalla" role="radiogroup" aria-label={t('opciones.modo_pantalla')}>
          {([false, true] as const).map((crt) => (
            <button
              key={String(crt)}
              role="radio"
              aria-checked={!!settings.filtroTv === crt}
              className={`modo-tarjeta ${!!settings.filtroTv === crt ? 'active' : ''}`}
              onClick={() => setSettings({ filtroTv: crt })}
            >
              <span className={`modo-mini ${crt ? 'crt' : 'panoramico'}`} aria-hidden>
                <span className="modo-mini-pantalla">
                  <i />
                </span>
                {crt && <span className="modo-mini-logo" />}
              </span>
              <b>{t(crt ? 'opciones.modo_crt' : 'opciones.modo_panoramico')}</b>
              <small>{t(crt ? 'opciones.modo_crt_desc' : 'opciones.modo_panoramico_desc')}</small>
            </button>
          ))}
        </div>
        {settings.filtroTv && (
          <div className="tv-fondos" role="radiogroup" aria-label={t('opciones.tv_fondo')}>
            <span>{t('opciones.tv_fondo')}</span>
            {(['ninguno', 'espacio', 'cosmico', 'cuarto'] as const).map((f) => (
              <button
                key={f}
                role="radio"
                aria-checked={(settings.tvFondo ?? 'cuarto') === f}
                className={`tv-fondo-opcion opcion-${f} ${(settings.tvFondo ?? 'cuarto') === f ? 'active' : ''}`}
                onClick={() => setSettings({ tvFondo: f })}
              >
                <i className={`tv-fondo-muestra fondo-${f}`} aria-hidden />
                {t(`opciones.tv_fondo_${f}`)}
              </button>
            ))}
          </div>
        )}
        {settings.filtroTv && (
          <label className="option modo-efecto">
            <input type="checkbox" checked={settings.tvEfecto !== false} onChange={(e) => setSettings({ tvEfecto: e.target.checked })} />
            <span>
              {t('opciones.tv_efecto')}
              <small className="muted options-tip">{t('opciones.tv_efecto_nota')}</small>
            </span>
          </label>
        )}
      </div>
      <label className="option">
        <input
          type="checkbox"
          checked={settings.reduceEffects}
          onChange={(e) => setSettings({ reduceEffects: e.target.checked })}
        />
        {t('opciones.reducir')}
      </label>

      <DangerZone glitch={enJuego} />
    </Panel>
  );
}
