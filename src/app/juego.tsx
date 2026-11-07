import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAPTER_END, useStore, SPEEDS } from '../engine/store';
import { BAD_END, endingName, getEnding } from '../engine/story';
import { useStoryEngine } from '../engine/useStoryEngine';
import { preloadFrom } from '../engine/preload';
import { TRANSITIONS, useSceneTransition } from '../engine/useSceneTransition';
import { effectsOf } from '../engine/logic';
import { CoffeeIDE } from '../components/CoffeeIDE';
import { Nivel } from '../components/Nivel';
import { Batalla } from '../components/Batalla';
import { progresoDeVars } from '../engine/batalla';
import { SceneStage } from '../components/SceneStage';
import { DialogBox } from '../components/DialogBox';
import { DecisionMenu } from '../components/DecisionMenu';
import { ChapterEnd } from '../components/ChapterEnd';
import { BadEnd } from '../components/BadEnd';
import { CHAPTER_INTRO_OUT_MS, CHAPTER_STARTS, ChapterIntro } from '../components/ChapterIntro';
import { useLang, useT } from '../engine/i18n';
import { canFullscreen, isTouch, toggleFullscreen } from '../engine/mobile';
import { playCancel, playSelect } from '../engine/sound';
import { choiceText, sceneDialogue } from '../engine/storyText';
import { type Overlay } from './tipos';
import { BoringramToast, BoringramBall } from './avisos';

// El juego en marcha: la novela y su barra (ver ../App.tsx).
/** Triángulos de adelantar/retroceder: uno más por cada velocidad (x2 = 2 … x16 = 5). */
export function Triangles({ dir, n }: { dir: 'left' | 'right'; n: number }) {
  return (
    <span className={`triangles triangles-${dir}`} aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} viewBox="0 0 10 10">
          <path d={dir === 'right' ? 'M1 1 9 5 1 9z' : 'M9 1 1 5 9 9z'} />
        </svg>
      ))}
    </span>
  );
}

/**
 * «¿Volver al menú?»: lo que no se guardó se pierde. Se puede guardar primero o seguir jugando (también con
 * Escape). En el fin de capítulo cambia el aviso (sin guardar, hay que repetir el capítulo) y «Cancelar».
 */
export function ConfirmTitle({
  chapterEnd,
  onCancel,
  onSave,
  onConfirm,
}: {
  chapterEnd: boolean;
  onCancel: () => void;
  onSave: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  const cancel = () => {
    playCancel();
    onCancel();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      cancel();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });
  return (
    <div className="confirm-backdrop" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className="confirm-box">
        <b id="confirm-title">{t('salir.titulo')}</b>
        <p>{t(chapterEnd ? 'salir.texto_fin' : 'salir.texto')}</p>
        <div className="confirm-actions">
          <button
            onClick={() => {
              playSelect();
              onSave();
            }}
          >
            {t('salir.guardar')}
          </button>
          <button onClick={cancel} autoFocus>
            {t(chapterEnd ? 'salir.cancelar' : 'salir.seguir')}
          </button>
          <button
            className="confirm-danger"
            onClick={() => {
              playSelect();
              onConfirm();
            }}
          >
            {t('salir.si')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Game({ open, paused, onTitle }: { open: (o: Overlay) => void; paused: boolean; onTitle: () => void }) {
  // La caja de diálogo se apoya encima de la barra según su altura real (en pantallas angostas o en el televisor la
  // barra baja a dos filas y la pisaba).
  const medidorBarra = useRef<ResizeObserver | null>(null);
  const refBarra = useCallback((el: HTMLDivElement | null) => {
    medidorBarra.current?.disconnect();
    if (!el) return;
    medidorBarra.current = new ResizeObserver(() => {
      if (el.offsetHeight) (el.closest('.stage') as HTMLElement | null)?.style.setProperty('--toolbar-h', `${el.offsetHeight}px`);
    });
    medidorBarra.current.observe(el);
  }, []);
  // Al volver de una pelea a la novela, la escena aparece desde negro (ver .batalla-vuelta).
  const [deBatalla, setDeBatalla] = useState(0);
  const volverDeBatalla = () => {
    const n = Date.now();
    setDeBatalla(n);
    setTimeout(() => setDeBatalla((x) => (x === n ? 0 : x)), 1200);
  };
  const { game, scene, choices, waitingChoice, mode, textDone } = useStoryEngine();
  const { next, choose, setMode, back, toNextChoice, toPrevChoice } = useStore.getState();
  // Al llegar a una pelea, el juego guarda solo (si hay un espacio libre): así, si sales o pierdes, se vuelve acá.
  const escenaPelea = scene?.batalla ? scene.scene_id : null;
  useEffect(() => {
    if (escenaPelea) useStore.getState().autoguardarPelea();
  }, [escenaPelea]);
  const speed = useStore((s) => s.speed);
  const canGoBack = useStore((s) => (s.game?.trail?.length ?? 0) > 0);
  const error = useStore((s) => s.error);
  const reaccionGlobo = useStore((s) => s.reaccionGlobo);
  const [menuOpen, setMenuOpen] = useState(false);
  // Ocultar la caja y los botones para mirar la imagen (tecla H o botón «Ocultar»; cualquier clic la devuelve).
  const [uiHidden, setUiHidden] = useState(false);
  const t = useT();
  const lang = useLang();
  const reduceEffects = useStore((s) => s.settings.reduceEffects);
  // Portada «CAPÍTULO N» al llegar a la primera escena de un capítulo.
  const [card, setCard] = useState<{ chapter: number; leaving: boolean } | null>(null);
  const cardFor = useRef<string | null>(null);
  const trailLen = useRef(0);
  const sceneNow = useStore((s) => s.game?.sceneId);
  useEffect(() => {
    if (!sceneNow || cardFor.current === sceneNow) return;
    const chapter = CHAPTER_STARTS.get(sceneNow);
    cardFor.current = sceneNow;
    // Al retroceder hasta el comienzo del capítulo (el recorrido se acortó) no vuelve a salir la portada.
    const steps = useStore.getState().game?.trail?.length ?? 0;
    const wentBack = steps < trailLen.current;
    trailLen.current = steps;
    if (wentBack) return;
    if (chapter !== undefined) setCard({ chapter, leaving: false });
  }, [sceneNow]);
  const leaveCard = useCallback(() => {
    setCard((c) => (c && !c.leaving ? { ...c, leaving: true } : c));
    setTimeout(() => setCard(null), CHAPTER_INTRO_OUT_MS);
  }, []);
  // Cambio de lugar: fundido a negro. Durante el oscurecimiento se muestra la escena anterior.
  const { shown, phase, color } = useSceneTransition(scene, mode === 'skip' || mode === 'ff' || mode === 'rew');
  // Fondos y sprites de lo que viene, descargados de antemano.
  const sceneId = scene?.scene_id;
  useEffect(() => {
    if (sceneId) preloadFrom(sceneId);
  }, [sceneId]);
  const fading = phase === 'out';
  // Escena sin texto con «espera»: la imagen se queda un rato y la historia sigue sola (un clic la adelanta).
  const waitMs = shown && !shown.dialogue ? shown.espera : undefined;
  useEffect(() => {
    if (!waitMs || fading || card) return;
    const timer = setTimeout(() => useStore.getState().advance(), waitMs);
    return () => clearTimeout(timer);
  }, [shown?.scene_id, waitMs, fading, card]);
  const onPhone = /^PANTALLA:(celular|boringram)/.test(shown?.background ?? '');
  // Las imágenes de la galería (fondos cg_*) se desbloquean al verlas.
  const shownBackground = shown?.background;
  useEffect(() => {
    const cg = shownBackground?.match(/^fondos\/(cg_[a-z0-9_]+)\.webp$/);
    if (cg) useStore.getState().markCg(cg[1]);
  }, [shownBackground]);
  const advanceIfReady = () => {
    if (!fading) next();
  };
  const enNivel = (!!shown?.nivel || !!shown?.batalla) && textDone;

  useEffect(() => {
    if (paused) return;
    const onKey = (e: KeyboardEvent) => {
      if (useStore.getState().game?.finished) return; // En los finales se elige con los botones.
      // Escribiendo en el editor de diálogos en vivo: las teclas son del texto.
      if ((e.target as HTMLElement | null)?.closest?.('textarea, input')) return;
      if (card) return; // La portada del capítulo se salta sola (ver ChapterIntro).
      if (enNivel) return; // En el nivel de acción, las teclas son del juego.
      if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
        setUiHidden((h) => !h);
        return;
      }
      // ← o Retroceso: una línea atrás.
      if ((e.key === 'ArrowLeft' || e.key === 'Backspace') && !fading) {
        e.preventDefault();
        setMode('normal');
        back();
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (uiHidden) {
          setUiHidden(false);
          return;
        }
        if (!fading && !(waitingChoice && textDone)) next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paused, fading, waitingChoice, textDone, next, back, setMode, uiHidden, card, enNivel]);

  // Abrir un panel detiene el autoavance y el salto.
  useEffect(() => {
    if (paused) setMode('normal');
  }, [paused, setMode]);

  if (!game || !scene || !shown) return null;

  if (game.finished) {
    if (game.finished.startsWith(CHAPTER_END)) {
      return (
        <ChapterEnd
          chapter={Number(game.finished.slice(CHAPTER_END.length))}
          onSave={() => open('save')}
          // Volver al inicio pide confirmación, igual que desde el juego.
          onTitle={() => open('salir')}
          lastScene={
            <SceneStage scene={shown} effects={[]} speakers={[]} lines={game.history.filter((h) => !h.choice)}>
              {null}
            </SceneStage>
          }
        />
      );
    }
    const ending = getEnding(game.finished);
    if (ending) {
      return (
        <BadEnd
          calm={ending.tipo !== BAD_END}
          name={endingName(ending, lang)}
          before={lang === 'en' ? (ending.nombre_antes_en ?? ending.nombre_antes) : ending.nombre_antes}
          onTitle={onTitle}
          lastScene={
            <SceneStage scene={shown} effects={[]} speakers={[]} lines={game.history}>
              {null}
            </SceneStage>
          }
        />
      );
    }
    return (
      <div className="screen ending-card" onClick={onTitle}>
        <p className="muted">{t('juego.fin')}</p>
        <h1>{ending ? endingName(ending, lang) : game.finished}</h1>
        <p className="muted">{t('juego.volver_titulo')}</p>
      </div>
    );
  }

  const toggle = (m: 'auto' | 'skip') => setMode(mode === m ? 'normal' : m);
  // ⏪ / ⏩: cada toque sube la velocidad (x2 → x4 → x8 → x16) y el siguiente lo apaga.
  const cycle = (m: 'ff' | 'rew') => {
    if (mode !== m) return setMode(m, SPEEDS[0]);
    const i = SPEEDS.indexOf(speed);
    if (i === SPEEDS.length - 1) setMode('normal');
    else setMode(m, SPEEDS[i + 1]);
  };
  const buttons = (
    <>
      <button
        className="speed-btn"
        onClick={() => {
          playSelect();
          toPrevChoice();
        }}
        disabled={!canGoBack}
        title={t('juego.decision_anterior')}
      >
        <span className="jump-icon" aria-hidden>
          ⏐
        </span>
        <Triangles dir="left" n={1} />
        {t('juego.decision_anterior')}
      </button>
      <button
        className={`speed-btn ${mode === 'rew' ? 'active' : ''}`}
        onClick={() => cycle('rew')}
        disabled={!canGoBack && mode !== 'rew'}
        title={t('juego.retroceder_ayuda')}
      >
        <Triangles dir="left" n={mode === 'rew' ? SPEEDS.indexOf(speed) + 2 : 2} />
        {t('juego.retroceder')}
        {mode === 'rew' && <span className="speed-x">x{speed}</span>}
      </button>
      <button
        className="speed-btn speed-stop"
        onClick={() => setMode('normal')}
        disabled={mode !== 'ff' && mode !== 'rew'}
        title={t('juego.parar')}
        aria-label={t('juego.parar')}
      >
        <svg viewBox="0 0 10 10" aria-hidden>
          <rect x="1" y="1" width="8" height="8" rx="1" />
        </svg>
      </button>
      <button
        className={`speed-btn ${mode === 'ff' ? 'active' : ''}`}
        onClick={() => cycle('ff')}
        title={t('juego.adelantar_ayuda')}
      >
        {t('juego.adelantar')}
        {mode === 'ff' && <span className="speed-x">x{speed}</span>}
        <Triangles dir="right" n={mode === 'ff' ? SPEEDS.indexOf(speed) + 2 : 2} />
      </button>
      <button
        className="speed-btn"
        onClick={() => {
          playSelect();
          toNextChoice();
        }}
        disabled={waitingChoice}
        title={t('juego.proxima_decision')}
      >
        {t('juego.proxima_decision')}
        <Triangles dir="right" n={1} />
        <span className="jump-icon" aria-hidden>
          ⏐
        </span>
      </button>
      <button className={mode === 'auto' ? 'active' : ''} onClick={() => toggle('auto')}>
        {t('juego.auto')}
      </button>
      {!onPhone && <BoringramBall onOpen={() => open('boringram')} label={t('titulo.boringram')} />}
      <button onClick={() => open('history')}>{t('juego.historial')}</button>
      <button onClick={() => open('save')}>{t('juego.guardar')}</button>
      <button onClick={() => open('load')}>{t('juego.cargar')}</button>
      <button onClick={() => open('map')}>{t('juego.mapa')}</button>
      <button onClick={() => open('equipo')}>{t('juego.equipo')}</button>
      <button onClick={() => open('options')}>{t('juego.opciones')}</button>
      <button onClick={() => setUiHidden(true)} title={t('juego.ocultar_ayuda')}>
        {t('juego.ocultar')}
      </button>
      {isTouch() && canFullscreen() && <button onClick={() => void toggleFullscreen()}>{t('juego.pantalla_completa')}</button>}
      {/* Volver al título pide confirmación: lo no guardado se pierde. */}
      <button onClick={() => open('salir')}>{t('juego.titulo')}</button>
    </>
  );
  return (
    <SceneStage
      scene={shown}
      effects={reduceEffects ? [] : effectsOf(shown)}
      speakers={game.history.filter((h) => !h.choice).map((h) => h.speaker)}
      lines={game.history}
    >
      {error && <p className="error stage-error">{error}</p>}
      {/* En las escenas del celular la historia ya lo muestra: el botón y el aviso esperan. */}
      {!onPhone && <BoringramToast onOpen={() => open('boringram')} />}
      {mode !== 'normal' && (
        <div className="mode-badge" aria-live="polite">
          {mode === 'auto'
            ? t('juego.modo_auto')
            : mode === 'skip'
              ? t('juego.modo_saltar')
              : t(mode === 'ff' ? 'juego.modo_adelantar' : 'juego.modo_retroceder', { n: speed })}
        </div>
      )}
      {uiHidden && <div className="stage-click stage-unhide" onClick={() => setUiHidden(false)} aria-hidden />}
      {!uiHidden && waitingChoice && textDone && !fading && (
        <DecisionMenu
          choices={choices.map((c) => ({ ...c, text: choiceText(scene?.scene_id, scene?.choices.indexOf(c), c.text, lang) }))}
          onChoose={(i) => {
            playSelect();
            choose(i);
          }}
        />
      )}
      {/* Minijuego: sale cuando termina de escribirse la línea; la historia sigue al resolverlo. */}
      {shown.minijuego && textDone && !fading && !card && (
        <CoffeeIDE
          key={`ide-${shown.scene_id}`}
          id={shown.minijuego}
          onSolved={() => useStore.getState().solveMinigame()}
          onExit={shown.minijuego_salida ? () => useStore.getState().exitMinigame() : undefined}
        />
      )}
      {/* Nivel de acción: sale cuando termina de escribirse la línea; ganarlo sigue con la historia y perderlo
          lleva a su bad end. */}
      {shown.nivel && textDone && !fading && !card && (
        <Nivel
          key={`nivel-${shown.scene_id}`}
          id={shown.nivel}
          onGanar={() => useStore.getState().solveMinigame()}
          onPerder={() => useStore.getState().loseLevel()}
        />
      )}
      {/* Batalla por turnos: igual que el nivel (ganarla sigue; perderla, su bad end). */}
      {shown.batalla && textDone && !fading && !card && (
        <Batalla
          key={`batalla-${shown.scene_id}`}
          id={shown.batalla}
          progreso={progresoDeVars(game.vars)}
          onGanar={(vars) => {
            volverDeBatalla();
            useStore.getState().solveMinigame(vars);
          }}
          onPerder={() => {
            volverDeBatalla();
            useStore.getState().loseLevel();
          }}
          onSalir={onTitle}
          onPerdonar={
            shown.batalla_perdon
              ? (vars) => {
                  volverDeBatalla();
                  useStore.getState().perdonarBatalla(vars);
                }
              : undefined
          }
        />
      )}
      {/* De la pelea a la novela: la escena aparece desde negro. */}
      {deBatalla && <div key={deBatalla} className="batalla-vuelta" aria-hidden />}
      {/* La línea nueva empieza a escribirse cuando aparece su escena, no detrás del negro. */}
      {!fading && !uiHidden && !card && (
        <DialogBox
          key={shown.scene_id}
          dialogue={sceneDialogue(shown, lang)}
          aiVowels={!reduceEffects && effectsOf(shown).includes('ai_vowels')}
          hasChoices={waitingChoice}
          onAdvance={advanceIfReady}
          globo={!!shown.globo}
          escena={shown.scene_id}
          editable={lang === 'es'}
          reaccion={shown.globo && reaccionGlobo?.escena === shown.scene_id ? reaccionGlobo : null}
        />
      )}
      <div
        className={`scene-fade scene-fade-${phase} scene-fade-${color}`}
        style={{
          animationDuration: `${phase === 'out' ? TRANSITIONS[color].out : TRANSITIONS[color].in}ms`,
        }}
        aria-hidden
      />
      {/* Evita que los botones queden enfocados y Espacio los vuelva a pulsar en vez de avanzar. */}
      {card && <ChapterIntro chapter={card.chapter} leaving={card.leaving} onLeave={leaveCard} />}
      <div ref={refBarra} className={`toolbar ${uiHidden ? 'ui-hidden' : ''}`} onMouseDown={(e) => e.preventDefault()}>
        {buttons}
      </div>
      {/* Pantallas chicas: los mismos botones dentro de un menú ☰. */}
      <div className={`toolbar-compact ${uiHidden ? 'ui-hidden' : ''}`} onMouseDown={(e) => e.preventDefault()}>
        <button
          className={`menu-toggle ${mode !== 'normal' ? 'active' : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={t('juego.menu')}
        >
          ☰
        </button>
        {menuOpen && (
          <div className="menu-popup" onClick={() => setMenuOpen(false)}>
            {buttons}
          </div>
        )}
      </div>
    </SceneStage>
  );
}
