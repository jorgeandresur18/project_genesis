import { useEffect, useState, type CSSProperties } from 'react';
import type { Dialogue } from '../engine/types';
import { TEXT_SPEED_INSTANT, useStore } from '../engine/store';
import { highlightAiVowels } from '../effects/aiVowels';
import { startTyping, stopTyping } from '../engine/sound';
import personajes from '../data/personajes_ui.json';
import { useT } from '../engine/i18n';

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
}

/**
 * Caja de diálogo con efecto máquina de escribir. Se monta de nuevo en cada escena (key = scene_id),
 * así que siempre empieza desde cero. Al terminar marca `textDone` en el estado global.
 */
export function DialogBox({ dialogue, aiVowels, hasChoices, onAdvance, globo = false, reaccion = null }: Props) {
  const textDone = useStore((s) => s.textDone);
  const setTextDone = useStore((s) => s.setTextDone);
  const speed = useStore((s) => s.settings.textSpeed);
  const t = useT();
  const [count, setCount] = useState(0);
  const text = dialogue?.text ?? '';

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
      <div key={reaccion?.n} className={`dialog-text ${thought && !reaccion ? 'dialog-thought' : ''} ${who?.mono ? 'dialog-mono' : ''} ${reaccion ? 'dialog-reaccion' : ''}`}>
        {render(visible)}
        {/* El resto del texto ocupa su lugar sin verse, para que la caja no cambie de tamaño al escribir. */}
        {!textDone && !reaccion && <span className="dialog-hidden">{text.slice(count)}</span>}
      </div>
      {/* Deja claro dónde tocar: mientras se escribe, completa el texto; al terminar, pasa al siguiente. */}
      {!(hasChoices && textDone) && (
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
