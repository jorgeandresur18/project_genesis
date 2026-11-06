import { useEffect, useState, type ReactNode } from 'react';
import { MODO_TODO } from '../engine/modo';
import { CHAPTER_STARTS } from './ChapterIntro';
import { useStore } from '../engine/store';
import { config, storyFiles } from '../engine/story';
import { playCancel, playGlitch, playSelect } from '../engine/sound';
import textosEs from '../data/fin_capitulo.json';
import textosEn from '../data/en/fin_capitulo.json';
import { localized, useLang } from '../engine/i18n';
import { assetUrl } from '../engine/assets';
import { transferible } from '../engine/payfoe';

interface Props {
  chapter: number;
  /** La última escena del capítulo: se ve mientras se funde a negro. */
  lastScene: ReactNode;
  onSave: () => void;
  /** Vuelve al título con fundido a negro. */
  onTitle: () => void;
}

const FADE_MS = 1800;
// El título del capítulo se corrompe un momento: glitch, la otra versión, glitch y vuelta.
const GLITCH_AT = 2000;
const GLITCH_MS = 320;
const ALT_MS = 1400;

/**
 * Lo que tienen en común el título y su versión corrupta, y lo que cambia: «El viaje del » + «héroe» /
 * «antihéroe». Solo la parte que cambia hace el glitch.
 */
function splitDiff(a: string, b: string) {
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  // La parte que cambia empieza al principio de una palabra.
  while (start > 0 && a[start - 1] !== ' ') start--;
  let end = 0;
  while (end < a.length - start && end < b.length - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++;
  while (end > 0 && a[a.length - end] !== ' ') end--;
  return {
    before: a.slice(0, start),
    a: a.slice(start, a.length - end),
    b: b.slice(start, b.length - end),
    after: a.slice(a.length - end),
  };
}
const n = (text: string, chapter: number) => text.replace('{n}', String(chapter));

/** Fin de capítulo: fundido a negro, «FIN DEL CAPÍTULO N» en grande y Continuar / Guardar / Volver al inicio. */
export function ChapterEnd({ chapter, lastScene, onSave, onTitle }: Props) {
  const still = useStore((s) => s.settings.reduceEffects);
  const [faded, setFaded] = useState(false);
  const [soon, setSoon] = useState(false);
  const lang = useLang();
  const textos = localized(textosEs, textosEn, lang);
  const file = storyFiles.find((f) => f.ruta === 'base' && f.chapter === chapter);
  const title = lang === 'en' ? (file?.title_en ?? file?.title) : file?.title;
  const background = (textos.fondos as Record<string, string>)[String(chapter)];
  const alt = lang === 'en' ? (file?.title_glitch_en ?? file?.title_glitch) : file?.title_glitch;
  // 'normal' → 'glitch' → 'alt' → 'glitch' → 'normal' (una sola vez).
  const [sub, setSub] = useState<'normal' | 'glitch' | 'alt' | 'glitch-out'>('normal');
  useEffect(() => {
    if (!faded || !alt || still) return;
    const steps: [number, typeof sub][] = [
      [GLITCH_AT, 'glitch'],
      [GLITCH_AT + GLITCH_MS, 'alt'],
      [GLITCH_AT + GLITCH_MS + ALT_MS, 'glitch-out'],
      [GLITCH_AT + GLITCH_MS * 2 + ALT_MS, 'normal'],
    ];
    const timers = steps.map(([ms, step]) =>
      setTimeout(() => {
        if (step === 'glitch' || step === 'glitch-out') playGlitch();
        setSub(step);
      }, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [faded, alt, still]);
  // PayFoe: al terminar cada capítulo se pueden pasar los tokens ganados en la partida (decisión del autor, 2026-11-06).
  const vars = useStore((s) => s.game?.vars);
  const payfoe = useStore((s) => s.payfoe);
  const puede = config.payfoe_activo && vars ? transferible(vars, payfoe) : 0;
  const [paso, setPaso] = useState<number | null>(null);
  const diff = title && alt ? splitDiff(title, alt) : null;
  const word = sub === 'alt' || sub === 'glitch-out' ? diff?.b : diff?.a;

  useEffect(() => {
    const t = setTimeout(() => setFaded(true), still ? 400 : FADE_MS);
    return () => clearTimeout(t);
  }, [still]);

  if (!faded) {
    return (
      <div className="chapter-fade-wrap">
        {lastScene}
        <div className="chapter-fade" style={{ animationDuration: `${still ? 400 : FADE_MS}ms` }} aria-hidden />
      </div>
    );
  }

  const click = (fn: () => void) => () => {
    playSelect();
    fn();
  };
  return (
    <div className={`screen chapter-end ${still ? 'chapter-end-still' : ''}`}>
      {/* Fondo: un lugar del capítulo, oscurecido, con la cuadrícula del título encima. */}
      <div className="chapter-end-bg" aria-hidden>
        {background && <img src={assetUrl(background)} alt="" draggable={false} />}
        <div className="chapter-end-grid" />
      </div>
      <div className="chapter-end-text">
        <h1 className="chapter-end-title" data-text={n(textos.fin, chapter)}>
          {n(textos.fin, chapter)}
        </h1>
        {title && (
          <p className="chapter-end-sub">
            {diff ? (
              <>
                {diff.before}
                <span
                  className={`sub-word ${sub.startsWith('glitch') ? 'sub-glitch' : ''} ${sub === 'alt' ? 'sub-alt' : ''}`}
                  data-text={word}
                >
                  {word}
                </span>
                {diff.after}
              </>
            ) : (
              title
            )}
          </p>
        )}
      </div>
      {config.payfoe_activo && vars && (
        <div className="chapter-end-payfoe">
          {paso !== null ? (
            <p>{paso > 0 ? textos.payfoe.hecho.replace('{n}', String(paso)) : textos.payfoe.nada}</p>
          ) : puede > 0 ? (
            <>
              <p>{textos.payfoe.texto.replace('{n}', String(puede))}</p>
              <button onClick={click(() => setPaso(useStore.getState().transferirAPayfoe(puede)))}>{textos.payfoe.boton.replace('{n}', String(puede))}</button>
            </>
          ) : (
            <p>{textos.payfoe.nada}</p>
          )}
        </div>
      )}
      <nav className="chapter-end-menu">
        <button
          onClick={click(() => {
            // Sigue en el capítulo siguiente si ya se puede jugar (`capitulo_maximo` en juego.json; en /all, todos);
            // si no, «próximamente».
            const jugable = MODO_TODO || chapter + 1 <= (config.capitulo_maximo ?? 1);
            const siguiente = jugable ? [...CHAPTER_STARTS].find(([, n]) => n === chapter + 1)?.[0] : undefined;
            if (siguiente) useStore.getState().seguirCapitulo(siguiente);
            else setSoon(true);
          })}
        >
          {textos.continuar}
        </button>
        <button onClick={click(onSave)}>{textos.guardar}</button>
        <button onClick={click(onTitle)}>{textos.inicio}</button>
      </nav>
      {soon && (
        <div className="chapter-soon-backdrop" onClick={() => setSoon(false)}>
          <div className="chapter-soon" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <p className="chapter-soon-label">{textos.proximo.estado}</p>
            <h2>{n(textos.proximo.titulo, chapter + 1)}</h2>
            <p className="chapter-soon-text">{textos.proximo.texto}</p>
            <button
              onClick={() => {
                playCancel();
                setSoon(false);
              }}
            >
              {textos.proximo.cerrar}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
