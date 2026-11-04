import { useContext, useEffect, useRef, useState } from 'react';
import { ArticuloVista, Boringplace } from './Boringplace';
import { useStore } from '../engine/store';
import { assetUrl } from '../engine/assets';
import { AHORRA_DATOS_KEY, AVION_KEY, NO_MOLESTAR_KEY, SIEMPRE_ACTIVOS_KEY, postKey, TUTORIAL_KEY, useBoringram } from '../engine/boringram';
import { playCancel, playSelect } from '../engine/sound';
import { enterPlayMode, enterPortraitMode, releaseOrientation } from '../engine/mobile';
import pantallas from '../data/pantallas.json';
import { NewDot } from './CgGallery';
import { KeyboardProvider } from './PhoneKeyboard';
import s from './Boringram.module.css';
import { type View, type B, NetContext, ShareContext, ToastContext } from './boringram/comun';
import { HeadsUp, useTorch, StatusBar, Shade, Skeleton } from './boringram/telefono';
import { ShareSheet, Avatar, Feed, PostView } from './boringram/publicaciones';
import { useDragScroll, usePullToRefresh } from './boringram/gestos';
import { Tour } from './boringram/tour';
import { Profile } from './boringram/perfil';
import { StoryView } from './boringram/historias';
import { Inbox, ChatView } from './boringram/mensajes';

/** Al abrir: el logo sobre negro y, un instante, el esqueleto de la app cargando. */
// El celular sube con la pantalla apagada (RISE_MS); después se prende con el logo.
const RISE_MS = 600;

const BOOT_LOGO_MS = 900 + RISE_MS;

const BOOT_SKELETON_MS = 650;

const CLOSE_MS = 700;

/**
 * Extras › Boringram: el celular de Jair, a pantalla completa y en vertical. Se llena con lo que pasa
 * en la historia. Se cierra con «Cerrar» (o Escape).
 */
export function BoringramScreen({ onClose }: { onClose: () => void }) {
  const b = useBoringram();
  const reduce = useStore((st) => st.settings.reduceEffects);
  const [boot, setBoot] = useState<'logo' | 'skeleton' | 'app'>(reduce ? 'app' : 'logo');
  const [closing, setClosing] = useState(false);
  const [shade, setShade] = useState(false);
  const torch = useTorch(b.ahora);
  const aj = useStore((st) => st.boringramAjustes);
  const setAj = useStore((st) => st.setBoringramAjustes);
  const evento = useStore((st) => st.markBoringramEvento);
  // El wifi y los datos siempre vuelven prendidos. Al salir en modo avión, o con el wifi o los datos
  // apagados, la primera vez llega su notificación (con aviso en el menú o en el juego).
  const ahoraRef = useRef(b.ahora);
  ahoraRef.current = b.ahora;
  useEffect(() => {
    const reset = () => {
      const prev = useStore.getState().boringramAjustes;
      if (prev.avion || !prev.wifi || !prev.datos) setAj({ avion: false, wifi: true, datos: true });
      return prev;
    };
    reset();
    return () => {
      const prev = reset();
      if (prev.avion) evento(AVION_KEY, ahoraRef.current);
      else if (!prev.wifi || !prev.datos) evento(SIEMPRE_ACTIVOS_KEY, ahoraRef.current);
    };
    // Solo al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const toggleAjuste = (icon: string) => {
    if (icon === 'linterna') return void torch.toggle();
    const on = !aj[icon];
    if (icon === 'avion') {
      if (on && torch.on) void torch.toggle();
      return setAj(
        on ? { avion: true, wifi: false, datos: false, bluetooth: false } : { avion: false, wifi: true, datos: true },
      );
    }
    // Los datos no funcionan en modo avión: prenderlos lo quita (el wifi y el bluetooth sí se pueden).
    if (icon === 'datos' && on && aj.avion) return setAj({ datos: true, avion: false });
    if (icon === 'no_molestar' && on) evento(NO_MOLESTAR_KEY, b.ahora);
    setAj({ [icon]: on });
  };
  const net = {
    online: !!(aj.wifi || aj.datos),
    msg: aj.avion ? b.data.textos.sin_red_avion : b.data.textos.sin_red,
    // Solo con datos (sin wifi): la primera vez que da me gusta, comenta o comparte, llega el aviso de ahorrar datos.
    usar: () => {
      if (!aj.wifi && aj.datos) evento(AHORRA_DATOS_KEY, b.ahora);
    },
  };
  // «Cómo usar» desde fuera del celular: cada toque pide el recorrido otra vez.
  const [tourRequest, setTourRequest] = useState(0);
  // Lupa (solo en computadora): la app en vertical a toda la altura, sin el marco del celular. Se recuerda.
  const [big, setBig] = useState(() => {
    try {
      return localStorage.getItem(BIG_KEY) === '1';
    } catch {
      return false;
    }
  });
  const toggleBig = () => {
    playSelect();
    setBig((v) => {
      try {
        localStorage.setItem(BIG_KEY, v ? '0' : '1');
      } catch {
        // Sin almacenamiento: solo dura esta vez.
      }
      return !v;
    });
  };

  // En celular, Boringram va en vertical; al cerrarlo se suelta la orientación.
  useEffect(() => {
    void enterPortraitMode();
    return () => {
      if (useStore.getState().game) void enterPlayMode();
      else releaseOrientation();
    };
  }, []);

  useEffect(() => {
    if (boot === 'app') return;
    const timer = setTimeout(
      () => setBoot(boot === 'logo' ? 'skeleton' : 'app'),
      boot === 'logo' ? BOOT_LOGO_MS : BOOT_SKELETON_MS,
    );
    return () => clearTimeout(timer);
  }, [boot]);

  const close = () => {
    if (closing) return;
    playCancel();
    if (reduce) return onClose();
    setClosing(true);
    setTimeout(onClose, CLOSE_MS);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (shade) setShade(false);
      else close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div
      className={`${s.screen} ${closing ? s.closing : ''} ${big ? s.big : ''} ${torch.on && !torch.touch ? s.torchOn : ''}`}
    >
      {/* Easter egg: con la linterna prendida, detrás del celular se enciende una luz (en computadora). */}
      {torch.on && !torch.touch && <div className={s.torchGlow} aria-hidden />}
      <div className={s.phone}>
        {/* Pantalla apagada: se va al terminar de subir y vuelve al bloquear el celular. */}
        <div className={s.screenOff} aria-hidden>
          <svg viewBox="0 0 24 24">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" />
          </svg>
        </div>
        <StatusBar b={b} aj={aj} torch={torch.on} onPull={() => boot === 'app' && setShade(true)} />
        {shade && <Shade b={b} aj={aj} torch={torch.on} onTile={toggleAjuste} onClose={() => setShade(false)} />}
        {!shade && <HeadsUp b={b} onOpen={() => setShade(true)} />}
        {/* Celular sin linterna real (o sin permiso): la pantalla se ilumina. */}
        {torch.on && torch.touch && !torch.real && <div className={s.torchScreen} aria-hidden />}
        {boot === 'logo' ? (
          <div className={s.splash}>
            <img src={assetUrl(pantallas.boringram.logo)} alt="Boringram" draggable={false} />
          </div>
        ) : boot === 'skeleton' ? (
          <Skeleton label={b.data.textos.cargando} />
        ) : (
          <NetContext.Provider value={net}>
            <App b={b} tourRequest={tourRequest} onClose={close} />
          </NetContext.Provider>
        )}
      </div>
      {/* Celular en horizontal: se pide girarlo (solo se ve con CSS en esa situación). */}
      <div className={s.rotateHint} role="alert">
        <div className={s.rotatePhone} aria-hidden />
        <p>{b.data.textos.girar}</p>
        <p className={s.rotateNote}>{b.data.textos.girar_nota}</p>
      </div>
      {/* En computadora, fuera del celular; en el celular van en el menú ⋮ de la app. */}
      <div className={s.sideBtns}>
        <button className={s.closeBtn} onClick={close}>
          {b.data.textos.cerrar}
        </button>
        <button
          className={s.helpOut}
          data-tour="ayuda"
          onClick={() => {
            playSelect();
            setTourRequest((n) => n + 1);
          }}
        >
          <span aria-hidden>?</span> {b.data.textos.como_usar}
        </button>
        <button className={s.helpOut} onClick={toggleBig} aria-pressed={big}>
          <span aria-hidden>
            <svg viewBox="0 0 24 24">
              <circle cx="10.5" cy="10.5" r="6" />
              <path d={big ? 'M8 10.5h5M20 20l-5-5' : 'M8 10.5h5M10.5 8v5M20 20l-5-5'} />
            </svg>
          </span>{' '}
          {big ? b.data.textos.modo_celular : b.data.textos.ampliar}
        </button>
      </div>
    </div>
  );
}

const BIG_KEY = 'genesis-boringram-grande';

function App({ b, tourRequest, onClose }: { b: B; tourRequest: number; onClose: () => void }) {
  const tx = b.data.textos;
  const [view, setView] = useState<View>({ kind: 'feed' });
  const scroller = useDragScroll();
  const refresh = usePullToRefresh(scroller, view.kind === 'feed');
  const [sharing, setSharing] = useState<string | null>(null);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  const showToast = (text: string) => setToast({ key: Date.now(), text });
  const net = useContext(NetContext);
  // Cada vista empieza arriba, como al cambiar de pantalla en el celular.
  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [view, scroller]);
  const markOpened = useStore((st) => st.markGalleryOpened);
  const [tutorial, setTutorial] = useState(() => !useStore.getState().galleryOpened[TUTORIAL_KEY]);
  useEffect(() => {
    if (tourRequest > 0) setTutorial(true);
  }, [tourRequest]);
  const closeTutorial = () => {
    playCancel();
    markOpened(TUTORIAL_KEY);
    setTutorial(false);
    setView({ kind: 'feed' });
  };
  const go = (next: View) => {
    playSelect();
    setView(next);
  };
  const back = (to: View) => {
    playCancel();
    setView(to);
  };

  // Lo que se ve en el inicio deja de ser nuevo después de un momento (para que se alcance a ver la marca).
  useEffect(() => {
    if (view.kind !== 'feed') return;
    const timer = setTimeout(() => b.publicaciones.forEach((p) => markOpened(postKey(p.id))), 1500);
    return () => clearTimeout(timer);
  }, [view.kind, b.publicaciones, markOpened]);

  if (!b.unlocked) {
    return (
      <>
        <AppBar b={b} onClose={onClose} />
        <div className={s.noSignal}>
          <span className={s.noSignalIcon} aria-hidden>
            ✕
          </span>
          <b>{b.data.sin_senal.titulo}</b>
          <p>{b.data.sin_senal.texto}</p>
        </div>
      </>
    );
  }

  const onPerfil = (id: string) => {
    if (b.perfiles[id]) go({ kind: 'perfil', id });
  };
  const tab =
    view.kind === 'mensajes' || view.kind === 'chat'
      ? 'mensajes'
      : view.kind === 'tienda' || view.kind === 'articulo'
        ? 'tienda'
        : view.kind === 'perfil' && view.id === b.data.yo
        ? 'perfil'
        : 'inicio';
  return (
    <ShareContext.Provider
      value={(id) => {
        if (!net.online) {
          playCancel();
          return showToast(net.msg);
        }
        net.usar();
        playSelect();
        setSharing(id);
      }}
    >
      <ToastContext.Provider value={showToast}>
        <KeyboardProvider>
          <AppBar b={b} onClose={onClose} onHelp={() => setTutorial(true)} />
          <div className={s.content} ref={scroller} data-tour="inicio">
            {view.kind === 'feed' && (refresh.pull > 0 || refresh.state !== 'idle') && (
              <div className={s.pull} style={{ height: refresh.state === 'idle' ? refresh.pull : 56 }}>
                {refresh.state === 'done' ? (
                  <span className={s.pullDone}>✓ {tx.al_dia}</span>
                ) : (
                  <img
                    className={refresh.state === 'loading' ? s.pullSpin : ''}
                    style={
                      refresh.state === 'idle'
                        ? { transform: `rotate(${refresh.pull * 4}deg)`, opacity: refresh.pull / 60 }
                        : undefined
                    }
                    src={assetUrl('marca/boringram_icono.webp')}
                    alt=""
                    draggable={false}
                  />
                )}
              </div>
            )}
            {view.kind === 'feed' && (
              <Feed
                b={b}
                onPerfil={onPerfil}
                onPost={(id) => go({ kind: 'post', id, back: view })}
                onStory={(id) => go({ kind: 'story', id, back: view })}
              />
            )}
            {view.kind === 'perfil' && (
              <Profile
                b={b}
                id={view.id}
                onPost={(id) => go({ kind: 'post', id, back: view })}
                onStory={(id) => go({ kind: 'story', id, back: view })}
                onBack={view.id === b.data.yo ? undefined : () => back({ kind: 'feed' })}
              />
            )}
            {view.kind === 'post' && <PostView b={b} id={view.id} onBack={() => back(view.back)} onPerfil={onPerfil} />}
            {view.kind === 'mensajes' && <Inbox b={b} onChat={(id) => go({ kind: 'chat', id })} />}
            {view.kind === 'chat' && (
              <ChatView b={b} id={view.id} onBack={() => back({ kind: 'mensajes' })} onPerfil={onPerfil} />
            )}
            {view.kind === 'tienda' && <Boringplace onArticulo={(id) => go({ kind: 'articulo', id })} onToast={showToast} />}
            {view.kind === 'articulo' && <ArticuloVista id={view.id} onBack={() => back({ kind: 'tienda' })} onToast={showToast} />}
          </div>
          {sharing && <ShareSheet b={b} id={sharing} onClose={() => setSharing(null)} />}
          {view.kind === 'story' && <StoryView b={b} id={view.id} onClose={() => back(view.back)} />}
          {/* Con una historia abierta no hay barra de abajo (como en las redes): así nunca tapa su pie. */}
          {view.kind !== 'story' && (
            <nav className={s.nav}>
              <button
                className={tab === 'inicio' ? s.navOn : ''}
                onClick={() => go({ kind: 'feed' })}
                aria-label={tx.inicio}
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" />
                </svg>
                {b.newPosts.size > 0 && <NewDot className={s.navDot} />}
              </button>
              <button
                className={tab === 'mensajes' ? s.navOn : ''}
                onClick={() => go({ kind: 'mensajes' })}
                aria-label={tx.mensajes}
                data-tour="nav-mensajes"
              >
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M21 3 3 10.5l7 2.5 2.5 7z" />
                </svg>
                {b.newChats.size > 0 && <NewDot className={s.navDot} />}
              </button>
              <button
                className={tab === 'tienda' ? s.navOn : ''}
                onClick={() => go({ kind: 'tienda' })}
                aria-label={tx.boringplace}
                data-tour="nav-tienda"
              >
                {/* La casita del logo de Boringplace. */}
                <img
                  src={assetUrl('marca/boringplace_icono.webp')}
                  alt=""
                  draggable={false}
                  style={{ width: '1.55rem', height: '1.55rem', opacity: tab === 'tienda' ? 1 : 0.55 }}
                />
              </button>
              <button
                className={tab === 'perfil' ? s.navOn : ''}
                onClick={() => go({ kind: 'perfil', id: b.data.yo })}
                aria-label={tx.perfil}
                data-tour="nav-perfil"
              >
                <Avatar perfil={b.perfiles[b.data.yo]} small />
              </button>
            </nav>
          )}
          {toast && (
            <div key={toast.key} className={s.appToast} role="status">
              <img src={assetUrl('marca/boringram_icono.webp')} alt="" draggable={false} />
              <span>{toast.text}</span>
            </div>
          )}
          {tutorial && b.data.tutorial.length > 0 && <Tour b={b} onView={setView} onClose={closeTutorial} />}
        </KeyboardProvider>
      </ToastContext.Provider>
    </ShareContext.Provider>
  );
}

function AppBar({ b, onClose, onHelp }: { b: B; onClose: () => void; onHelp?: () => void }) {
  const tx = b.data.textos;
  const [menu, setMenu] = useState(false);
  const pick = (action: () => void) => {
    setMenu(false);
    action();
  };
  return (
    <div className={s.appBar}>
      <img src={assetUrl(pantallas.boringram.logo)} alt="Boringram" draggable={false} />
      {/* Solo en el celular (en computadora, «Cómo usar» y «Cerrar» van fuera de la pantalla). */}
      <button
        type="button"
        className={s.menuBtn}
        aria-label={tx.menu}
        aria-expanded={menu}
        data-tour="ayuda"
        onClick={() => {
          playSelect();
          setMenu(!menu);
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {menu && (
        <>
          <div className={s.menuShield} onClick={() => setMenu(false)} />
          <div className={s.menu} role="menu">
            {onHelp && (
              <button
                role="menuitem"
                onClick={() =>
                  pick(() => {
                    playSelect();
                    onHelp();
                  })
                }
              >
                <span aria-hidden>?</span> {tx.como_usar}
              </button>
            )}
            <button role="menuitem" onClick={() => pick(onClose)}>
              <span aria-hidden>✕</span> {tx.cerrar_app}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
