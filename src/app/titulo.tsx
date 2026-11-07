import { CHAPTER_STARTS } from '../components/ChapterIntro';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useStore } from '../engine/store';
import { ProbadorSprites } from '../components/ProbadorSprites';
import { Batalla } from '../components/Batalla';
import { progresoDeVars, type Progreso } from '../engine/batalla';
import easterEgg from '../data/easter_egg.json';
import { NewDot } from '../components/CgGallery';
import { useGalleryState } from '../engine/gallery';
import { useBoringram } from '../engine/boringram';
import { TitleBackground } from '../components/TitleBackground';
import { useT } from '../engine/i18n';
import { enterPlayMode } from '../engine/mobile';
import { playGlitch, playSelect } from '../engine/sound';
import { config } from '../engine/story';
import { assetUrl } from '../engine/assets';
import { type Intro, type Overlay } from './tipos';
import { BootcampAviso, SecretoAviso } from './avisos';

// La pantalla de título (ver ../App.tsx).
/** Íconos del menú del título (trazo, 24×24). */
export const MENU_ICONS: Record<string, ReactNode> = {
  play: <path d="M8 5v14l11-7z" />,
  load: <path d="M3 7h6l2 2h10v10H3z" />,
  map: <><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M7.5 7.8 10.8 16M16.5 7.8 13.2 16" /></>,
  extras: <path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5l-5.3 2.9 1.2-6-4.5-4.1 6-.7z" />,
  options: <><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></>,
  about: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  bootcamp: <><rect x="3" y="4" width="18" height="12" rx="1.5" /><path d="M9 20h6M12 16v4M7 8l2 2-2 2M11 12h4" /></>,
};

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

export interface TitleProps {
  open: (o: Overlay) => void;
  intro: Intro;
  /** Se llegó a los clics del easter egg en el logo. */
  onEgg: () => void;
}

export function TitleScreen({ open, intro, onEgg }: TitleProps) {
  const clicks = useRef(0);
  // Cada clic en el logo reinicia un glitch de colores (la key fuerza a repetir la animación).
  const [hit, setHit] = useState(0);
  // Demo de batalla para probar: ?batalla=demo en la dirección (al terminar, vuelve al título).
  const [demoBatalla, setDemoBatalla] = useState(() => new URLSearchParams(location.search).get('batalla'));
  // Para probar con lo de una partida (niveles, cassettes, lo equipado): ?batalla=demo&vars={"nivel_jair":6,…}, con las
  // variables de la partida en JSON (las pruebas en navegador, tests/e2e, lo usan). Si no se entiende, se ignora.
  const [demoProgreso] = useState<Progreso | undefined>(() => {
    const crudo = new URLSearchParams(location.search).get('vars');
    if (!crudo) return undefined;
    try {
      const v = JSON.parse(crudo);
      return v && typeof v === 'object' && !Array.isArray(v) ? progresoDeVars(v) : undefined;
    } catch {
      return undefined;
    }
  });
  // Probador de sprites (herramienta del autor): ?sprites en la dirección.
  const [probador, setProbador] = useState(() => new URLSearchParams(location.search).has('sprites'));
  const newGame = useStore((s) => s.newGame);
  const error = useStore((s) => s.error);
  const still = useStore((s) => s.settings.reduceEffects);
  const t = useT();
  const storyNotice = t('idioma.historia_es');
  const pick = () => playSelect();
  // Desde el avance de la revisión de diálogos (tools/avance_dialogos.mjs), solo en desarrollo: ?escena=<id>&ir abre esa
  // escena sin pasar por «Nueva partida», para corregir la línea con el editor en vivo. Se limpia la dirección para que
  // recargar no vuelva a saltar.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const q = new URLSearchParams(location.search);
    const escena = q.get('escena');
    if (!escena || !q.has('ir')) return;
    history.replaceState(null, '', location.pathname);
    newGame(escena);
  }, [newGame]);
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
      {demoBatalla && <Batalla key={demoBatalla} id={demoBatalla} progreso={demoProgreso} onGanar={() => setDemoBatalla(null)} onPerder={() => setDemoBatalla(null)} />}
    </div>
  );
}
