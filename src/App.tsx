import { Suspense, lazy, useEffect, useState } from 'react';
import { EquipoPanel } from './components/Equipo';
import { TorneoPantalla } from './components/Torneo';
import { TvViejo } from './components/TvViejo';
import { CHAPTER_END, useStore } from './engine/store';
import { scenes } from './engine/story';
import { AboutPanel, EndingsGallery, ExtrasPanel, HistoryPanel, OptionsPanel, SaveLoadPanel } from './components/Panels';
import { EasterEgg, type EggPhase } from './components/EasterEgg';
import { CgGallery } from './components/CgGallery';
import { SceneMap } from './components/SceneMap';
import { AudioToggle } from './components/AudioToggle';
import { useLang } from './engine/i18n';
import { playMusic, SILENCE } from './engine/music';
import { config } from './engine/story';
import { type Intro, type Overlay } from './app/tipos';
import { EventToast, RotateHint } from './app/avisos';
import { ConfirmTitle, Game } from './app/juego';
import { ContentWarning } from './app/advertencia';
import { TitleScreen } from './app/titulo';

// Boringram y el Bootcamp se descargan recién al abrirlos (el menú carga más rápido).
const BoringramScreen = lazy(() => import('./components/Boringram').then((m) => ({ default: m.BoringramScreen })));

const BootcampScreen = lazy(() => import('./components/Bootcamp').then((m) => ({ default: m.BootcampScreen })));

// Fundido a negro al volver al título.
const TITLE_FADE_MS = 800;

// Después, el mismo negro se disuelve encima del título.
const TITLE_REVEAL_MS = 1200;

/** Cuánto se queda en negro entre salir del juego y que aparezca el menú. */
const TITLE_HOLD_MS = 350;

export default function App() {
  const [accepted, setAccepted] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  // Easter egg del título: Nikki bloquea el menú hasta que el jugador le responda.
  const [egg, setEgg] = useState<EggPhase>('off');
  const hasGame = useStore((s) => !!s.game);
  const filtroTv = useStore((s) => s.settings.filtroTv);
  // Entrada elegante del título: al llegar desde la advertencia y al volver de una partida.
  const [intro, setIntro] = useState<Intro>('advertencia');
  useEffect(() => {
    if (hasGame) setIntro(null);
  }, [hasGame]);
  // Volver al título desde el juego: una sola capa negra que primero tapa el juego y después se
  // disuelve encima del título (sin soltar el negro en el medio, que se veía como un parpadeo doble).
  const [toTitle, setToTitle] = useState<'out' | 'in' | null>(null);
  const still = useStore((s) => s.settings.reduceEffects);
  const goToTitle = () => {
    if (toTitle) return;
    setToTitle('out');
    setOverlay(null);
    useStore.getState().setMode('normal');
    setTimeout(
      () => {
        setIntro('juego');
        useStore.getState().quitToTitle();
        // Un instante en negro antes de que aparezca el menú.
        setTimeout(
          () => {
            setToTitle('in');
            setTimeout(() => setToTitle(null), still ? 150 : TITLE_REVEAL_MS);
          },
          still ? 0 : TITLE_HOLD_MS,
        );
      },
      still ? 150 : TITLE_FADE_MS,
    );
  };
  // Al terminar el borrado de datos (Opciones › Zona de peligro), el título aparece desde negro.
  useEffect(() => {
    const onReset = () => {
      setOverlay(null);
      setIntro('juego');
      setToTitle('in');
      setTimeout(() => setToTitle(null), still ? 150 : TITLE_REVEAL_MS);
    };
    window.addEventListener('genesis:borrado', onReset);
    return () => window.removeEventListener('genesis:borrado', onReset);
  }, [still]);
  // Después del grito de Rikka en la galería (pedido del autor): de la pantalla blanca, un degradado al título, que
  // vuelve a empezar (se monta de nuevo, con su entrada).
  const [vueltaTitulo, setVueltaTitulo] = useState(0);
  const [blanco, setBlanco] = useState(false);
  useEffect(() => {
    const onGrito = () => {
      setOverlay(null);
      setIntro('juego');
      setVueltaTitulo((n) => n + 1);
      setBlanco(true);
      setTimeout(() => setBlanco(false), still ? 150 : 1800);
    };
    window.addEventListener('genesis:grito', onGrito);
    return () => window.removeEventListener('genesis:grito', onGrito);
  }, [still]);
  // Opciones de lectura: tamaño del texto y opacidad de la caja (las usa styles.css).
  // El atributo lang de la página sigue al idioma del juego (lectores de pantalla, traducción del navegador).
  const lang = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const textScale = useStore((s) => s.settings.textScale);
  const boxOpacity = useStore((s) => s.settings.boxOpacity);
  useEffect(() => {
    document.documentElement.style.setProperty('--text-scale', String(textScale));
    document.documentElement.style.setProperty('--box-alpha', String(boxOpacity));
  }, [textScale, boxOpacity]);
  // Título y fin de capítulo: el tema del título. En juego: el tema vigente de la escena. En una pantalla de final: silencio.
  // El Bootcamp tiene su propio tema (mientras no exista, sigue el del título).
  const bootcampMusic = overlay === 'bootcamp' ? (config.musica_bootcamp ?? null) : null;
  const music = useStore((s) =>
    s.musicaBatalla
      ? s.musicaBatalla
      : bootcampMusic
      ? bootcampMusic
      : !s.game || s.game.finished?.startsWith(CHAPTER_END)
      ? (config.musica_titulo ?? SILENCE)
      : s.game.finished
        ? SILENCE
        : ((s.game.vars._musica as string | null) ?? SILENCE),
  );
  useEffect(() => {
    if (accepted) playMusic(music);
  }, [accepted, music]);

  // Una partida guardada en el navegador puede apuntar a una escena que ya se borró del JSON.
  useEffect(() => {
    const { game, quitToTitle } = useStore.getState();
    if (game && !scenes.has(game.sceneId)) quitToTitle();
  }, []);

  if (!accepted) {
    return (
      <ContentWarning
        // El clic en «Continuar» habilita el audio y, si hay una partida en curso, la pantalla completa (ver ContentWarning).
        onAccept={() => setAccepted(true)}
      />
    );
  }

  const close = () => setOverlay(null);
  return (
    <div className="app">
      {hasGame ? (
        // Siempre dentro del televisor (apagado, no se nota): así prenderlo o apagarlo en plena partida no
        // vuelve a montar el juego (una pelea no empieza de nuevo).
        <TvViejo activo={!!filtroTv}>
          <Game open={setOverlay} paused={overlay !== null} onTitle={goToTitle} />
        </TvViejo>
      ) : (
        <TitleScreen
          key={vueltaTitulo}
          open={setOverlay}
          intro={intro}
          onEgg={() => {
            if (egg === 'off' || egg === 'gone') setEgg('on');
          }}
        />
      )}
      {overlay === 'history' && <HistoryPanel onClose={close} />}
      {(overlay === 'save' || overlay === 'load') && <SaveLoadPanel mode={overlay} onClose={close} />}
      {overlay === 'map' && <SceneMap onClose={close} />}
      {overlay === 'endings' && <EndingsGallery onClose={close} />}
      {overlay === 'torneo' && <TorneoPantalla onClose={close} />}
      {overlay === 'gallery' && <CgGallery onClose={close} />}
      {overlay === 'boringram' && (
        <Suspense fallback={null}>
          <BoringramScreen onClose={close} />
        </Suspense>
      )}
      {overlay === 'extras' && <ExtrasPanel onClose={close} onOpen={setOverlay} />}
      {overlay === 'bootcamp' && (
        <Suspense fallback={null}>
          <BootcampScreen onClose={close} />
        </Suspense>
      )}
      {!hasGame && <EasterEgg phase={egg} onGone={() => setEgg('gone')} />}
      {overlay === 'options' && <OptionsPanel onClose={close} />}
      {overlay === 'equipo' && <EquipoPanel onClose={close} />}
      {overlay === 'about' && <AboutPanel onClose={close} />}
      {overlay === 'salir' && (
        <ConfirmTitle
          chapterEnd={!!useStore.getState().game?.finished}
          onCancel={close}
          onSave={() => setOverlay('save')}
          onConfirm={goToTitle}
        />
      )}
      <AudioToggle />
      {/* Siempre montado: lleva la cuenta aunque Boringram esté abierto (adentro avisa el propio celular). */}
      <EventToast hidden={overlay === 'boringram'} onOpen={() => setOverlay('boringram')} />
      {hasGame && <RotateHint />}
      {blanco && <div className="grito-al-titulo" aria-hidden />}
      {toTitle && (
        <div
          className={`to-title-fade to-title-${toTitle}`}
          style={{
            animationDuration: `${still ? 150 : toTitle === 'out' ? TITLE_FADE_MS : TITLE_REVEAL_MS}ms`,
          }}
          aria-hidden
        />
      )}
    </div>
  );
}

