import { Suspense, lazy, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { EquipoPanel } from './components/Equipo';
import { CHAPTER_END, useStore, SPEEDS } from './engine/store';
import { BAD_END, endingName, getEnding, scenes } from './engine/story';
import { useStoryEngine } from './engine/useStoryEngine';
import { preloadFrom } from './engine/preload';
import { TRANSITIONS, useSceneTransition } from './engine/useSceneTransition';
import { effectsOf } from './engine/logic';
import { CoffeeIDE } from './components/CoffeeIDE';
import { Nivel } from './components/Nivel';
import { ProbadorSprites } from './components/ProbadorSprites';
import { Batalla } from './components/Batalla';
import { progresoDeVars } from './engine/batalla';
import { SceneStage } from './components/SceneStage';
import { DialogBox } from './components/DialogBox';
import { DecisionMenu } from './components/DecisionMenu';
import { AboutPanel, EndingsGallery, ExtrasPanel, HistoryPanel, OptionsPanel, SaveLoadPanel } from './components/Panels';
import { EasterEgg, type EggPhase } from './components/EasterEgg';
import easterEgg from './data/easter_egg.json';
import { CgGallery, NewDot } from './components/CgGallery';
import { useGalleryState } from './engine/gallery';
import { useBoringram } from './engine/boringram';
// Boringram y el Bootcamp se descargan recién al abrirlos (el menú carga más rápido).
const BoringramScreen = lazy(() => import('./components/Boringram').then((m) => ({ default: m.BoringramScreen })));
const BootcampScreen = lazy(() => import('./components/Bootcamp').then((m) => ({ default: m.BootcampScreen })));
import { NIVELES, PRUEBA, cursoDe, useBootcamp } from './engine/bootcamp';
import { useCompletion } from './engine/completion';
import { TitleBackground } from './components/TitleBackground';
import { SceneMap } from './components/SceneMap';
import { ChapterEnd } from './components/ChapterEnd';
import { BadEnd } from './components/BadEnd';
import { CHAPTER_INTRO_OUT_MS, CHAPTER_STARTS, ChapterIntro } from './components/ChapterIntro';
import { AudioToggle } from './components/AudioToggle';
import advertenciaEs from './data/advertencia.json';
import advertenciaEn from './data/en/advertencia.json';
import { detectLanguage, localized, useLang, useT } from './engine/i18n';
import { canFullscreen, enterPlayMode, isTouch, toggleFullscreen } from './engine/mobile';
import { playCancel, playGlitch, playNotify, playSelect, unlockAudio } from './engine/sound';
import { playMusic, SILENCE } from './engine/music';
import { config } from './engine/story';
import { assetUrl } from './engine/assets';
import { choiceText, sceneDialogue } from './engine/storyText';

// Fundido a negro al volver al título.
const TITLE_FADE_MS = 800;
// Después, el mismo negro se disuelve encima del título.
const TITLE_REVEAL_MS = 1200;

/** De dónde se llega al título: cambia cómo sale del negro. */
type Intro = 'advertencia' | 'juego' | null;

type Overlay =
  | 'history'
  | 'save'
  | 'load'
  | 'map'
  | 'extras'
  | 'endings'
  | 'gallery'
  | 'boringram'
  | 'options'
  | 'about'
  | 'salir'
  | 'bootcamp'
  | 'equipo'
  | null;

export default function App() {
  const [accepted, setAccepted] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  // Easter egg del título: Nikki bloquea el menú hasta que el jugador le responda.
  const [egg, setEgg] = useState<EggPhase>('off');
  const hasGame = useStore((s) => !!s.game);
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
        setToTitle('in');
        setTimeout(() => setToTitle(null), still ? 150 : TITLE_REVEAL_MS);
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
        <Game open={setOverlay} paused={overlay !== null} onTitle={goToTitle} />
      ) : (
        <TitleScreen
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

/**
 * Para probar un capítulo: abrir el juego en /capN (p. ej. /cap2) hace que «Nueva partida» empiece en la
 * primera escena de ese capítulo; ?escena=<scene_id> empieza en una escena cualquiera.
 */
function urlStart(): { scene: string; chapter?: number } | null {
  const escena = new URLSearchParams(window.location.search).get('escena');
  if (escena) return { scene: escena };
  const m = window.location.pathname.match(/\/cap0?(\d+)\/?$/i);
  if (!m) return null;
  const chapter = Number(m[1]);
  const first = [...CHAPTER_STARTS].find(([, n]) => n === chapter);
  return first ? { scene: first[0], chapter } : null;
}

/** Triángulos de adelantar/retroceder: uno más por cada velocidad (x2 = 2 … x16 = 5). */
function Triangles({ dir, n }: { dir: 'left' | 'right'; n: number }) {
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
 * Aviso de Boringram durante la historia: cuando una escena desbloquea una publicación, una historia o un
 * mensaje, baja una notificación como en el celular. Tocarla abre Boringram.
 */
function BoringramToast({ onOpen }: { onOpen: () => void }) {
  const b = useBoringram();
  const tx = b.data.textos;
  const seen = useRef<Set<string> | null>(null);
  const [toast, setToast] = useState<{ key: number; text: string; user: string } | null>(null);
  const items = [
    // No avisa de lo que publica el propio Jair ni de los chats que deja en visto.
    ...b.publicaciones.filter((p) => p.autor !== b.data.yo).map((p) => ({ id: `p:${p.id}`, user: p.autor, text: tx.notif_post })),
    ...b.destacadas.filter((d) => d.autor !== b.data.yo).map((d) => ({ id: `s:${d.id}`, user: d.autor, text: tx.notif_historia })),
    ...b.chats.filter((c) => !c.visto).map((c) => ({ id: `c:${c.id}:${c.mensajes.length}`, user: c.perfil ?? c.nombre ?? '', text: tx.notif_mensaje })),
  ];
  const ids = items.map((x) => x.id).join('|');
  useEffect(() => {
    const now = new Set(ids.split('|'));
    if (seen.current === null) {
      seen.current = now; // Lo que ya estaba desbloqueado al empezar no avisa.
      return;
    }
    const fresh = items.filter((x) => !seen.current!.has(x.id));
    seen.current = now;
    if (fresh.length === 0) return;
    const f = fresh[fresh.length - 1];
    const user = b.perfiles[f.user]?.usuario ?? f.user;
    setToast({ key: Date.now(), user, text: f.text.replace('{usuario}', user) });
    playNotify();
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  if (!toast) return null;
  return (
    <button key={toast.key} className="bori-toast" onClick={onOpen}>
      <img src={assetUrl('marca/boringram_icono.webp')} alt="" draggable={false} />
      <span>
        <small>Boringram · {tx.abrir}</small>
        <b>{toast.text}</b>
      </span>
    </button>
  );
}

/**
 * Aviso de las notificaciones del celular que no vienen de la historia sino de algo que hizo el jugador en
 * Boringram (la linterna, el modo avión, el wifi apagado…): baja en el menú o en el juego al conseguirlas.
 */
function EventToast({ hidden, onOpen }: { hidden: boolean; onOpen: () => void }) {
  const b = useBoringram();
  const seen = useRef<Set<string> | null>(null);
  const [toast, setToast] = useState<{ key: number; icono: string; app: string; titulo: string } | null>(null);
  const events = b.notificaciones.filter((n) => n.clave);
  const ids = events.map((n) => n.id).join('|');
  useEffect(() => {
    const now = new Set(ids.split('|'));
    const fresh = seen.current === null ? [] : events.filter((n) => !seen.current!.has(n.id));
    seen.current = now; // Lo que ya estaba al abrir el juego no avisa.
    if (hidden || fresh.length === 0) return;
    const n = fresh[0];
    setToast({ key: Date.now(), icono: n.icono, app: n.app, titulo: n.titulo });
    playNotify();
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);
  if (!toast || hidden) return null;
  return (
    <button key={toast.key} className="bori-toast" onClick={onOpen}>
      <span className="bori-toast-icon" aria-hidden>
        {toast.icono}
      </span>
      <span>
        <small>
          {toast.app} · {b.data.textos.abrir}
        </small>
        <b>{toast.titulo}</b>
      </span>
    </button>
  );
}

/**
 * «¿Volver al menú?»: lo que no se guardó se pierde. Se puede guardar primero o seguir jugando (también con
 * Escape). En el fin de capítulo cambia el aviso (sin guardar, hay que repetir el capítulo) y «Cancelar».
 */
function ConfirmTitle({
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

/**
 * En el menú: al terminar un capítulo por primera vez, avisa que se desbloqueó su nivel del Bootcamp (uno a la vez).
 * Tocarlo abre el Bootcamp.
 */
function BootcampAviso({ onOpen }: { onOpen: () => void }) {
  const b = useBootcamp();
  const avisados = useStore((s) => s.bootcampAvisos);
  const avisar = useStore((s) => s.avisarBootcamp);
  const curso = cursoDe(useLang());
  const nivel = PRUEBA ? undefined : NIVELES.find((n) => b.nivelAbierto(n) && !avisados[n.id]);
  const [toast, setToast] = useState<{ key: number; n: number; nombre: string; color: string } | null>(null);
  useEffect(() => {
    if (!nivel) return;
    const timer = setTimeout(() => {
      setToast({ key: Date.now(), n: NIVELES.indexOf(nivel) + 1, nombre: curso.niveles[NIVELES.indexOf(nivel)].nombre, color: nivel.color });
      avisar(nivel.id);
      playNotify();
    }, 1200);
    return () => clearTimeout(timer);
  }, [nivel, avisar]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);
  if (!toast) return null;
  return (
    <button key={toast.key} className="bori-toast bc-toast" style={{ ['--lvl' as string]: toast.color }} onClick={onOpen}>
      <img src={assetUrl('marca/bootcamp_emblema.webp')} alt="" draggable={false} />
      <span>
        <small>{curso.textos.aviso_app}</small>
        <b>{curso.textos.aviso.replace('{n}', String(toast.n)).replace('{nombre}', toast.nombre)}</b>
      </span>
    </button>
  );
}

/** Primera escena secreta del Capítulo 2: mientras no se lea, el menú sigue recordando que hay algo nuevo ahí. */
const PRIMERA_SECRETA = [...scenes.values()].find((s) => s.secreto && s.chapter === 2)?.scene_id;
const SECRETO_MS = 8000;

/**
 * En el menú: al llegar al 100 % se abren las escenas secretas (ver `juegoCompleto` en engine/store.ts) y, hasta
 * que el jugador las vea, un aviso le pide volver a jugar el Capítulo 2. Sale después del aviso del Bootcamp.
 */
function SecretoAviso() {
  const t = useT();
  const { percent } = useCompletion();
  const completo = useStore((s) => s.juegoCompleto);
  const marcar = useStore((s) => s.marcarJuegoCompleto);
  const visto = useStore((s) => (PRIMERA_SECRETA ? !!s.readScenes[PRIMERA_SECRETA] : true));
  const [toast, setToast] = useState<'cap02' | null>(null);
  useEffect(() => {
    if (percent === 100) marcar();
  }, [percent, marcar]);
  const pendiente = (completo || percent === 100) && !visto ? 'cap02' : null;
  useEffect(() => {
    if (!pendiente) return;
    const timer = setTimeout(() => {
      setToast(pendiente);
      playNotify();
    }, 6000);
    return () => clearTimeout(timer);
  }, [pendiente]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), SECRETO_MS);
    return () => clearTimeout(timer);
  }, [toast]);
  if (!toast) return null;
  return (
    <button className="bori-toast secreto-toast" onClick={() => setToast(null)}>
      <img src={assetUrl('marca/emblema_18.webp')} alt="" draggable={false} />
      <span>
        <small>{t('secreto.aviso_app')}</small>
        <b>{t('secreto.aviso')}</b>
      </span>
    </button>
  );
}

/** Botón redondo de Boringram en la esquina, con la cantidad de cosas nuevas. */
function BoringramBall({ onOpen, label }: { onOpen: () => void; label: string }) {
  const b = useBoringram();
  if (!b.unlocked) return null;
  const n = b.newPosts.size + b.newStories.size + b.newChats.size;
  return (
    <button className="bori-ball" onClick={onOpen} aria-label={n ? `${label} (${n})` : label} title={label}>
      <img src={assetUrl('marca/boringram_icono.webp')} alt="" draggable={false} />
      {n > 0 && <span className="bori-badge">{n > 9 ? '9+' : n}</span>}
    </button>
  );
}

/** Celular en vertical durante el juego: se pide girarlo (solo se ve con CSS en esa situación). */
function RotateHint() {
  const t = useT();
  return (
    <div className="rotate-hint" role="alert">
      <div className="rotate-hint-phone" aria-hidden />
      <p>{t('juego.girar')}</p>
      <p className="muted">{t('juego.girar_nota')}</p>
    </div>
  );
}

// Duración del fundido a negro al aceptar la advertencia.
const WARNING_FADE_MS = 900;

function ContentWarning({ onAccept }: { onAccept: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const still = useStore((s) => s.settings.reduceEffects);
  const lang = useLang();
  const t = useT();
  const advertencia = localized(advertenciaEs, advertenciaEn, lang);
  const language = useStore((s) => s.settings.language);
  const setSettings = useStore((s) => s.setSettings);
  const detected = detectLanguage();
  const accept = () => {
    if (leaving) return;
    // El audio y la pantalla completa solo se habilitan dentro del clic: se piden ya, antes del fundido.
    unlockAudio();
    if (useStore.getState().game) void enterPlayMode();
    setLeaving(true);
    setTimeout(onAccept, still ? 150 : WARNING_FADE_MS);
  };
  return (
    <div className={`screen warning ${leaving ? 'warning-leaving' : ''}`}>
      <div className="warning-card">
        <header className="warning-head">
          <span className="warning-badge">{advertencia.etiqueta}</span>
          <div>
            <h1>{advertencia.titulo}</h1>
            <p className="warning-rating">{advertencia.clasificacion}</p>
          </div>
        </header>
        <p className="warning-intro">{advertencia.texto}</p>
        <ul className="warning-themes">
          {advertencia.temas.map((t) => (
            <li key={t.titulo}>
              <strong>{t.titulo}</strong>
              <span>{t.detalle}</span>
            </li>
          ))}
        </ul>
        <p className="warning-note">{advertencia.nota_efectos}</p>
        <p className="warning-note">{advertencia.ficcion}</p>
        <button className="warning-accept" onClick={accept}>
          {advertencia.aceptar}
        </button>
        {/* Qué idioma se detectó y cómo cambiarlo. */}
        <div className="warning-lang">
          <span className="muted">
            {language === 'auto'
              ? t('idioma.detectado', { idioma: t(`idioma.${detected.lang}`), codigo: detected.code })
              : t('idioma.elegido', { idioma: t(`idioma.${lang}`) })}
          </span>
          <span className="segmented">
            {(['es', 'en'] as const).map((l) => (
              <button key={l} className={lang === l ? 'active' : ''} onClick={() => setSettings({ language: l })}>
                {t(`idioma.${l}`)}
              </button>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Íconos del menú del título (trazo, 24×24). */
const MENU_ICONS: Record<string, ReactNode> = {
  play: <path d="M8 5v14l11-7z" />,
  load: <path d="M3 7h6l2 2h10v10H3z" />,
  map: <><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M7.5 7.8 10.8 16M16.5 7.8 13.2 16" /></>,
  extras: <path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5l-5.3 2.9 1.2-6-4.5-4.1 6-.7z" />,
  options: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  about: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  bootcamp: <><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M9 20h6M12 16v4M7 8l2 2-2 2M11 12h4" /></>,
};

interface TitleProps {
  open: (o: Overlay) => void;
  intro: Intro;
  /** Se llegó a los clics del easter egg en el logo. */
  onEgg: () => void;
}

function TitleScreen({ open, intro, onEgg }: TitleProps) {
  const clicks = useRef(0);
  // Cada clic en el logo reinicia un glitch de colores (la key fuerza a repetir la animación).
  const [hit, setHit] = useState(0);
  // Demo de batalla para probar: ?batalla=demo en la dirección (al terminar, vuelve al título).
  const [demoBatalla, setDemoBatalla] = useState(() => new URLSearchParams(location.search).get('batalla'));
  // Probador de sprites (herramienta del autor): ?sprites en la dirección.
  const [probador, setProbador] = useState(() => new URLSearchParams(location.search).has('sprites'));
  const newGame = useStore((s) => s.newGame);
  const error = useStore((s) => s.error);
  const still = useStore((s) => s.settings.reduceEffects);
  const t = useT();
  const storyNotice = t('idioma.historia_es');
  const pick = () => playSelect();
  const galleryNew = useGalleryState().hasNew;
  const boringramNew = useBoringram().hasNew;
  const load = useStore((s) => s.load);
  // Espacio de la partida guardada más reciente (-1 si no hay ninguna).
  const lastSave = useStore((s) =>
    s.saves.reduce((best, slot, i) => (slot && (best < 0 || slot.date > s.saves[best]!.date) ? i : best), -1),
  );
  const tiles: [Overlay, string, string][] = [
    ['load', 'load', 'titulo.cargar'],
    ['map', 'map', 'titulo.mapa'],
    ['boringram', 'boringram', 'titulo.boringram'],
    ['bootcamp', 'bootcamp', 'titulo.bootcamp'],
    ['extras', 'extras', 'titulo.extras'],
    ['options', 'options', 'titulo.opciones'],
    ['about', 'about', 'titulo.conoce'],
  ];
  return (
    <div
      className={`screen title ${intro && !still ? 'title-intro' : ''} ${intro === 'advertencia' ? 'title-intro-velo' : ''}`}
    >
      <TitleBackground />
      <h1 className={`title-logo ${still ? '' : 'title-logo-glitch'}`}>
        <span
          className="logo-float"
          data-hit={hit > 0 ? '' : undefined}
          onClick={() => {
            playGlitch();
            setHit((h) => h + 1);
            if (++clicks.current >= easterEgg.clics) {
              clicks.current = 0;
              onEgg();
            }
          }}
        >
          <img key={hit} src={`${import.meta.env.BASE_URL}marca/logo.webp`} alt="PROJECT GENESIS" draggable={false} />
          {!still && (
            <>
              <img
                className="logo-slice logo-slice-a"
                src={`${import.meta.env.BASE_URL}marca/logo.webp`}
                alt=""
                aria-hidden
                draggable={false}
              />
              <img
                className="logo-slice logo-slice-b"
                src={`${import.meta.env.BASE_URL}marca/logo.webp`}
                alt=""
                aria-hidden
                draggable={false}
              />
            </>
          )}
        </span>
      </h1>
      {storyNotice && <p className="muted title-notice">{storyNotice}</p>}
      {urlStart()?.chapter && (
        <p className="title-notice title-chapter-notice">{t('titulo.empieza_en', { n: urlStart()!.chapter! })}</p>
      )}
      {error && <p className="error">{error}</p>}
      <nav className="title-menu">
        <div className="title-main-actions">
          {/* Con partidas guardadas, «Continuar» carga la más reciente. */}
          {lastSave >= 0 && (
            <button
              className="title-primary"
              onClick={() => {
                pick();
                void enterPlayMode();
                load(lastSave);
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                {MENU_ICONS.play}
              </svg>
              {t('titulo.continuar')}
            </button>
          )}
          <button
            className={lastSave >= 0 ? 'title-secondary' : 'title-primary'}
            onClick={() => {
              pick();
              void enterPlayMode();
              // Para probar un capítulo en borrador: abrir el juego con ?escena=<scene_id>.
              newGame(urlStart()?.scene);
            }}
          >
            {lastSave < 0 && (
              <svg viewBox="0 0 24 24" aria-hidden>
                {MENU_ICONS.play}
              </svg>
            )}
            {t('titulo.nueva')}
          </button>
        </div>
        <div className="title-tiles">
          {tiles.map(([o, icon, label], i) => (
            <button
              key={o}
              className="title-tile"
              style={{ '--i': i } as CSSProperties}
              onClick={() => {
                pick();
                open(o);
              }}
            >
              {icon === 'bootcamp' ? (
                <img className="title-tile-icon" src={assetUrl('marca/bootcamp_icono_blanco.webp')} alt="" draggable={false} />
              ) : icon === 'boringram' ? (
                // La cámara con las «zzz» del logo de Boringram, sin las letras.
                <img className="title-tile-icon" src={assetUrl('marca/boringram_icono.webp')} alt="" draggable={false} />
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden>
                  {MENU_ICONS[icon]}
                </svg>
              )}
              <span>{t(label)}</span>
              {((o === 'extras' && galleryNew) || (o === 'boringram' && boringramNew)) && (
                <NewDot className="new-dot-tile" />
              )}
            </button>
          ))}
        </div>
      </nav>
      <BootcampAviso onOpen={() => open('bootcamp')} />
      <SecretoAviso />
      {config.version && <span className="title-version">{t('titulo.version', { v: config.version })}</span>}
      {probador && <ProbadorSprites onCerrar={() => setProbador(false)} />}
      {demoBatalla && <Batalla key={demoBatalla} id={demoBatalla} onGanar={() => setDemoBatalla(null)} onPerder={() => setDemoBatalla(null)} />}
    </div>
  );
}

function Game({ open, paused, onTitle }: { open: (o: Overlay) => void; paused: boolean; onTitle: () => void }) {
  // Al volver de una pelea a la novela, la escena aparece desde negro (ver .batalla-vuelta).
  const [deBatalla, setDeBatalla] = useState(0);
  const volverDeBatalla = () => {
    const n = Date.now();
    setDeBatalla(n);
    setTimeout(() => setDeBatalla((x) => (x === n ? 0 : x)), 1200);
  };
  const { game, scene, choices, waitingChoice, mode, textDone } = useStoryEngine();
  const { next, choose, setMode, back, toNextChoice, toPrevChoice } = useStore.getState();
  const speed = useStore((s) => s.speed);
  const canGoBack = useStore((s) => (s.game?.trail?.length ?? 0) > 0);
  const error = useStore((s) => s.error);
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
      <div className={`toolbar ${uiHidden ? 'ui-hidden' : ''}`} onMouseDown={(e) => e.preventDefault()}>
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
