import { useEffect, useState, type CSSProperties } from 'react';
import type { Dialogue } from '../engine/types';
import { TEXT_SPEED_INSTANT, useStore } from '../engine/store';
import { highlightAiVowels } from '../effects/aiVowels';
import { startTyping, stopTyping } from '../engine/sound';
import personajes from '../data/personajes_ui.json';
import { useT } from '../engine/i18n';
import { EDITOR_EN_VIVO, useEdiciones } from '../engine/ediciones';

/** Color (y si es una voz de máquina) del nombre de un hablante: «Nikki (mensaje)» usa el de Nikki. */
function speakerStyle(speaker: string): { color: string; mono: boolean } {
  const s = speaker.toLowerCase();
  const found = personajes.colores.find((c) => s.startsWith(c.prefijo));
  return { color: found?.color ?? personajes.por_defecto, mono: !!(found && 'mono' in found && found.mono) };
}

/** Color del nombre de un hablante (el mismo de la caja de diálogo). */
export const speakerColor = (speaker: string) => speakerStyle(speaker).color;

interface Props {
  dialogue: Dialogue | null;
  aiVowels: boolean;
  /** Hay decisiones en pantalla: el botón de avanzar no se muestra (se elige en el menú). */
  hasChoices: boolean;
  onAdvance: () => void;
  /** En un globo al lado de la cara (las escenas con `globo`), no en la caja de abajo. */
  globo?: boolean;
  /** Lo que dice al tocarla (en globo): reemplaza el texto de la línea mientras no se siga. */
  reaccion?: { quien: string; texto: string; n: number } | null;
  /** La escena (para el editor en vivo, solo en `npm run dev`). */
  escena?: string;
  /** Si se puede editar el texto mientras se juega (en desarrollo y en español). */
  editable?: boolean;
  /** Con el editor: la línea anterior (si se puede volver). */
  onAtras?: () => void;
  puedeAtras?: boolean;
}

/**
 * Caja de diálogo con efecto máquina de escribir. Se monta de nuevo en cada escena (key = scene_id),
 * así que siempre empieza desde cero. Al terminar marca `textDone` en el estado global.
 */
export function DialogBox({ dialogue, aiVowels, hasChoices, onAdvance, globo = false, reaccion = null, escena, editable = false, onAtras, puedeAtras = false }: Props) {
  const textDone = useStore((s) => s.textDone);
  const setTextDone = useStore((s) => s.setTextDone);
  const speed = useStore((s) => s.settings.textSpeed);
  const t = useT();
  const [count, setCount] = useState(0);
  // El editor en vivo: lo que el autor corrigió de esta línea (se muestra en lugar del original, con «EDITADO»).
  const conEditor = EDITOR_EN_VIVO && editable && !!escena;
  const edicion = useEdiciones((s) => (conEditor && escena ? s.mapa[escena] : undefined));
  const guardar = useEdiciones((s) => s.guardar);
  // La marca ✓: la línea la escribió el autor y la corrigió Claude (ya está en la historia).
  const revisada = useEdiciones((s) => (conEditor && escena ? !!s.revisadas[escena] : false));
  const marcarRevisada = useEdiciones((s) => s.marcarRevisada);
  const [editando, setEditando] = useState<string | null>(null);
  const original = dialogue?.text ?? '';
  const text = edicion ? edicion.texto : original;

  useEffect(() => {
    if (textDone) return;
    if (speed >= TEXT_SPEED_INSTANT) {
      setTextDone(true);
      return;
    }
    const start = performance.now();
    let frame = 0;
    startTyping();
    const tick = (now: number) => {
      const n = Math.floor(((now - start) / 1000) * speed);
      if (n >= text.length) {
        stopTyping();
        setTextDone(true);
        return;
      }
      setCount(n);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      stopTyping();
    };
  }, [textDone, speed, text, setTextDone]);

  if (!dialogue) return null;
  // Al tocarla (en globo): su reacción ocupa el globo, entera, con su nombre.
  if (reaccion) dialogue = { speaker: reaccion.quien, text: reaccion.texto };
  const visible = reaccion ? reaccion.texto : textDone ? text : text.slice(0, count);
  const render = (t: string) => (aiVowels ? highlightAiVowels(t) : t);
  const who = dialogue.speaker ? speakerStyle(dialogue.speaker) : null;
  // Los pensamientos van entre paréntesis: en cursiva, para distinguirlos de lo que se dice en voz alta.
  const thought = /^\(.*\)$/s.test(text.trim());
  return (
    <div
      className={`dialog ${who ? 'dialog-has-speaker' : 'dialog-narration'} ${globo ? 'dialog-globo' : ''}`}
      style={who ? ({ '--speaker': who.color } as CSSProperties) : undefined}
    >
      {dialogue.speaker && <div className={`dialog-speaker ${who?.mono ? 'dialog-speaker-mono' : ''}`}>{render(dialogue.speaker)}</div>}
      {conEditor && edicion && !reaccion && (
        <span className={`dialog-editado ${edicion.autor === 'claude' ? 'dialog-borrador' : ''}`}>{edicion.autor === 'claude' ? 'BORRADOR' : 'EDITADO'}</span>
      )}
      {conEditor && revisada && !reaccion && (
        <span className="dialog-revisada" title="Revisada: la escribiste tú y la corrigió Claude, o la aprobaste tú">
          ✓
        </span>
      )}
      {/* Con el editor (solo en desarrollo): una línea atrás o adelante, al lado de la caja. */}
      {conEditor && editando === null && (
        <>
          <button
            className="dialog-flecha dialog-flecha-atras"
            disabled={!puedeAtras}
            onClick={(e) => {
              e.stopPropagation();
              onAtras?.();
            }}
            onMouseDown={(e) => e.preventDefault()}
            title="Línea anterior"
          >
            ◀
          </button>
          <button
            className="dialog-flecha dialog-flecha-adelante"
            disabled={hasChoices && textDone}
            onClick={(e) => {
              e.stopPropagation();
              onAdvance();
            }}
            onMouseDown={(e) => e.preventDefault()}
            title="Línea siguiente"
          >
            ▶
          </button>
        </>
      )}
      {conEditor && !reaccion && editando === null && (
        <button
          className={`dialog-listo ${revisada ? 'dialog-listo-quitar' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            void marcarRevisada(escena!, !revisada);
          }}
          onMouseDown={(e) => e.preventDefault()}
          title={revisada ? 'Quitar la marca ✓' : 'Marcar esta línea como lista (✓)'}
        >
          {revisada ? 'Quitar ✓' : '✓ Listo'}
        </button>
      )}
      {conEditor && !reaccion && editando === null && (
        <button
          className="dialog-editar"
          onClick={(e) => {
            e.stopPropagation();
            setEditando(text);
          }}
          onMouseDown={(e) => e.preventDefault()}
          title="Editar esta línea (solo en desarrollo)"
        >
          ✎ Editar
        </button>
      )}
      {editando !== null ? (
        <div className="dialog-editor" onClick={(e) => e.stopPropagation()}>
          <textarea
            autoFocus
            value={editando}
            onChange={(e) => setEditando(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            rows={Math.min(8, Math.max(3, Math.ceil(editando.length / 70)))}
          />
          <div className="dialog-editor-botones">
            <button
              className="dialog-editor-guardar"
              onClick={() => {
                const nuevo = editando.trim();
                void guardar(escena!, nuevo && nuevo !== original ? nuevo : null, original);
                setEditando(null);
              }}
            >
              Guardar
            </button>
            {edicion && (
              <button
                onClick={() => {
                  void guardar(escena!, null, original);
                  setEditando(null);
                }}
              >
                Volver al original
              </button>
            )}
            <button
              onClick={() => {
                void marcarRevisada(escena!, !revisada);
                setEditando(null);
              }}
            >
              {revisada ? 'Quitar ✓' : 'Poner ✓'}
            </button>
            <button onClick={() => setEditando(null)}>Cancelar</button>
          </div>
          {edicion && <small className="dialog-editor-original">Original: {original}</small>}
        </div>
      ) : (
      <div key={reaccion?.n} className={`dialog-text ${thought && !reaccion ? 'dialog-thought' : ''} ${who?.mono ? 'dialog-mono' : ''} ${reaccion ? 'dialog-reaccion' : ''}`}>
        {render(visible)}
        {/* El resto del texto ocupa su lugar sin verse, para que la caja no cambie de tamaño al escribir. */}
        {!textDone && !reaccion && <span className="dialog-hidden">{text.slice(count)}</span>}
      </div>
      )}
      {/* Deja claro dónde tocar: mientras se escribe, completa el texto; al terminar, pasa al siguiente. */}
      {!(hasChoices && textDone) && editando === null && (
        <button
          className={`dialog-advance ${textDone ? 'dialog-advance-ready' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onAdvance();
          }}
          onMouseDown={(e) => e.preventDefault()}
          title={t('dialogo.ayuda')}
        >
          {textDone ? t('dialogo.siguiente') : t('dialogo.mostrar_todo')}
        </button>
      )}
    </div>
  );
}
