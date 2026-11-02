import { useEffect, useState, type ReactNode } from 'react';
import { useStore } from '../engine/store';
import { playGlitch, playSelect } from '../engine/sound';
import textosEs from '../data/pantalla_final.json';
import textosEn from '../data/en/pantalla_final.json';
import { localized, useLang } from '../engine/i18n';

interface Props {
  /** Nombre del final (src/data/registro_finales.json). */
  name: string;
  /** La última escena: se ve mientras se funde a negro. */
  lastScene: ReactNode;
  /** Vuelve al título con fundido a negro. */
  onTitle: () => void;
  /** Final que no es un bad end: misma secuencia, pero sobria (blanco y plata, sin glitch). */
  calm?: boolean;
  /** Primero se ve este nombre y después, con un glitch de unos segundos, el verdadero («normal» → «anormal»). */
  before?: string;
}

/** Cuándo empieza el glitch del nombre y cuánto dura. */
const GLITCH_AT = 1400;
const GLITCH_MS = 2600;

/** La palabra que cambia entre dos nombres («normal» / «anormal») y lo que queda igual alrededor. */
function cambio(a: string, b: string) {
  const pa = a.split(' ');
  const pb = b.split(' ');
  let i = 0;
  while (i < pa.length && i < pb.length && pa[i] === pb[i]) i++;
  let j = 0;
  while (j < pa.length - i && j < pb.length - i && pa[pa.length - 1 - j] === pb[pb.length - 1 - j]) j++;
  const antes = pa.slice(0, i).join(' ');
  const despues = pa.slice(pa.length - j).join(' ');
  return { antes: antes && `${antes} `, a: pa.slice(i, pa.length - j).join(' '), b: pb.slice(i, pb.length - j).join(' '), despues: despues && ` ${despues}` };
}

const FADE_MS = 1800;

/**
 * Pantalla de final: fundido a negro, la etiqueta y el nombre del final, y el botón para volver al menú.
 * Bad end: en rojo con glitch. Final temprano (`calm`): en blanco y plata, quieto.
 */
export function BadEnd({ name, lastScene, onTitle, calm, before }: Props) {
  const still = useStore((s) => s.settings.reduceEffects);
  const textos = localized(textosEs, textosEn, useLang());
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFaded(true), still ? 400 : FADE_MS);
    return () => clearTimeout(t);
  }, [still]);

  // El nombre que cambia: primero el de antes, después el glitch y queda el verdadero.
  const [paso, setPaso] = useState<'antes' | 'glitch' | 'despues'>(before ? 'antes' : 'despues');
  useEffect(() => {
    if (!faded || !before) return;
    if (still) return setPaso('despues');
    const a = setTimeout(() => {
      setPaso('glitch');
      playGlitch();
    }, GLITCH_AT);
    const b = setTimeout(() => setPaso('despues'), GLITCH_AT + GLITCH_MS);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [faded, before, still]);
  const c = before ? cambio(before, name) : null;

  if (!faded) {
    return (
      <div className="chapter-fade-wrap">
        {lastScene}
        <div className="chapter-fade" style={{ animationDuration: `${still ? 400 : FADE_MS}ms` }} aria-hidden />
      </div>
    );
  }

  return (
    <div className={`screen bad-end ${calm ? 'end-calm' : ''} ${still ? 'bad-end-still' : ''}`}>
      {!calm && <div className="bad-end-scan" aria-hidden />}
      <p className="bad-end-label">{calm ? textos.etiqueta_final : textos.etiqueta}</p>
      <h1 className="bad-end-title" data-text={name}>
        {c ? (
          <>
            {c.antes}
            <span
              className={`sub-word ${paso === 'glitch' ? 'sub-glitch bad-end-glitch-largo' : ''} ${paso !== 'antes' ? 'sub-alt' : ''}`}
              data-text={paso === 'antes' ? c.a : c.b}
            >
              {paso === 'antes' ? c.a : c.b}
            </span>
            {c.despues}
          </>
        ) : (
          name
        )}
      </h1>
      <button
        className="bad-end-button"
        onClick={() => {
          playSelect();
          onTitle();
        }}
      >
        {textos.volver}
      </button>
    </div>
  );
}
