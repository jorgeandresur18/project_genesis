import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { TEXT_SPEED_INSTANT, useStore } from '../engine/store';
import { assetUrl } from '../engine/assets';
import galeriaEs from '../data/galeria.json';
import galeriaEn from '../data/en/galeria.json';
import estaturasJson from '../data/estaturas.json';
import { localized, useLang, useT } from '../engine/i18n';
import {
  CGS,
  CHARACTERS,
  DIMENSIONS,
  TOTAL_PLACES,
  TOTAL_SPRITES,
  TODOS_RPG,
  characterColor,
  imageKey,
  placeKey,
  spriteKey,
  useGalleryState,
  type SpriteRpg,
} from '../engine/gallery';
import { reinoKey, useReinos, type Reino } from '../engine/reinos';
import { BASE_CANVAS, canvasHeight, statureOf, widthFactor } from '../engine/stature';
import type { Character } from '../engine/types';
import { Panel } from './Panels';
import { playCancel, playChip, playSelect, startTyping, stopTyping } from '../engine/sound';
import { NoData } from './NoData';
import { CapasFondo, capaDeFondo, capaDeSprite } from './SceneStage';
import { SpriteHoja, type Hoja } from './Batalla';
import { colorBalas, useEfectosSprite } from './EfectosSprite';
import { BATALLAS } from '../engine/batallas';

interface Texts {
  titulos: Record<string, string>;
  info_imagenes: Record<string, string>;
  personajes: Record<string, string>;
  sprites: Record<string, { nombre: string; info: string }>;
  rpg: Record<string, { personaje: string; nombre: string; info: string }>;
  quejas: Record<string, { imagenes: string[]; lineas: string[] }>;
  lugares: Record<string, { nombre: string; fondos: Record<string, { nombre: string; info: string; reino?: string }> }>;
}
const useTexts = () => localized(galeriaEs, galeriaEn, useLang()) as unknown as Texts;

/** Bolita que parpadea sobre lo recién desbloqueado (hasta abrirlo en el visor). */
export function NewDot({ className = '' }: { className?: string }) {
  const t = useT();
  return <span className={`new-dot ${className}`} role="img" aria-label={t('galeria.nuevo')} />;
}

type Tab = 'imagenes' | 'personajes' | 'lugares' | 'pixel';

/** Galería: imágenes del juego y sprites de los personajes. Lo que no se vio todavía queda bloqueado. */
export function CgGallery({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>('imagenes');
  const g = useGalleryState();
  const r = useReinos();
  const pick = (next: Tab) => {
    if (next === tab) return;
    playSelect();
    setTab(next);
  };
  return (
    <Panel
      title={t('galeria.titulo', {
        vistas: g.images.length + g.spriteCount + g.places.size + r.unlocked.length,
        total: CGS.length + TOTAL_SPRITES + TOTAL_PLACES + r.reinos.length,
      })}
      onClose={onClose}
      wide
    >
      <TermWindow
        className="gallery-term"
        tabs={[
          {
            key: 'imagenes',
            label: t('galeria.imagenes'),
            extra: `${g.images.length}/${CGS.length}`,
            dot: g.newImages.size > 0,
          },
          {
            key: 'personajes',
            label: t('galeria.personajes'),
            extra: `${g.spriteCount}/${TOTAL_SPRITES}`,
            dot: g.newSpriteCount > 0,
          },
          {
            key: 'pixel',
            label: t('galeria.pixel_art'),
            extra: `${g.rpgTodos.length}/${TODOS_RPG.length}`,
          },
          {
            key: 'lugares',
            label: t('galeria.lugares'),
            extra: `${g.places.size + r.unlocked.length}/${TOTAL_PLACES + r.reinos.length}`,
            dot: g.newPlaces.size + r.fresh.size > 0,
          },
        ]}
        active={tab}
        onTab={(k) => pick(k as Tab)}
      >
        {tab === 'imagenes' ? <Images /> : tab === 'personajes' ? <Characters /> : tab === 'pixel' ? <PixelArt /> : <Places />}
      </TermWindow>
    </Panel>
  );
}

interface TabSpec {
  key: string;
  label: string;
  extra?: string;
  /** Color de la pestaña (el del personaje). */
  color?: string;
  /** Hay algo nuevo adentro. */
  dot?: boolean;
  muted?: boolean;
}

/**
 * Ventana con pestañas como las de una terminal (ícono, título, ×, «+» y la flecha).
 * `onClose` muestra la × de la pestaña; el «+» y la flecha son decorativos.
 */
function TermWindow({
  tabs,
  active,
  onTab,
  onClose,
  right,
  color,
  className = '',
  children,
}: {
  tabs: TabSpec[];
  active?: string;
  onTab?: (key: string) => void;
  onClose?: () => void;
  right?: ReactNode;
  /** Color de la ventana entera (el del personaje). */
  color?: string;
  className?: string;
  children: ReactNode;
}) {
  const t = useT();
  const current = active ?? tabs[0].key;
  return (
    <section
      className={`wt-window ${color ? 'wt-colored' : ''} ${className}`}
      style={color ? ({ '--wt': color } as CSSProperties) : undefined}
    >
      <div className="wt-tabs" role="tablist">
        {tabs.map((tab) => (
          <div
            key={tab.key}
            role="tab"
            aria-selected={tab.key === current}
            className={`wt-tab ${tab.key === current ? 'active' : ''} ${onTab ? 'clickable' : ''} ${tab.color ? 'wt-tab-colored' : ''} ${tab.muted ? 'wt-tab-muted' : ''}`}
            style={tab.color ? ({ '--wt': tab.color } as CSSProperties) : undefined}
            onClick={() => onTab?.(tab.key)}
          >
            <span className="wt-icon" aria-hidden>
              ›_
            </span>
            <span className="wt-label">{tab.label}</span>
            {tab.extra && <span className="wt-extra">{tab.extra}</span>}
            {tab.dot && <NewDot className="new-dot-tab" />}
            {onClose && (
              <button
                className="wt-close"
                aria-label={t('panel.cerrar')}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <span className="wt-plus" aria-hidden>
          +
        </span>
        <span className="wt-caret" aria-hidden>
          ⌄
        </span>
        {right && <span className="wt-right">{right}</span>}
      </div>
      <div className="wt-body">{children}</div>
    </section>
  );
}

function Images() {
  const t = useT();
  const texts = useTexts();
  const g = useGalleryState();
  // Las secretas van al final y solo cuando ya se vieron (no salen bloqueadas).
  const unlocked = [...g.images, ...g.secretImages];
  const markOpened = useStore((s) => s.markGalleryOpened);
  const [open, setOpen] = useState<number | null>(null);
  return (
    <>
      {CGS.length === 0 && <p className="muted">{t('galeria.vacia')}</p>}
      <div className="gallery-grid">
        {CGS.map((id) =>
          unlocked.includes(id) ? (
            <button key={id} className="gallery-item" onClick={() => setOpen(unlocked.indexOf(id))}>
              <div className="gallery-thumb">
                <img src={assetUrl(`fondos/${id}.webp`)} alt="" loading="lazy" draggable={false} />
                {g.newImages.has(id) && <NewDot className="new-dot-item" />}
              </div>
              <span className="gallery-title">{texts.titulos[id] ?? id}</span>
            </button>
          ) : (
            <button key={id} className="gallery-item gallery-locked" disabled>
              <div className="gallery-thumb">
                  <NoData />
                </div>
              <span className="gallery-title">???</span>
            </button>
          ),
        )}
        {g.secretImages.map((id) => (
          <button key={id} className="gallery-item gallery-secreta" onClick={() => setOpen(unlocked.indexOf(id))}>
            <div className="gallery-thumb">
              <img src={assetUrl(`fondos/${id}.webp`)} alt="" loading="lazy" draggable={false} />
              {/* La censura también en la miniatura. */}
              {capaDeFondo(`fondos/${id}`) && <CapasFondo capa={capaDeFondo(`fondos/${id}`)!} src={assetUrl(`fondos/${id}.webp`)} fijos />}
              {g.newImages.has(id) && <NewDot className="new-dot-item" />}
            </div>
            <span className="gallery-title">{texts.titulos[id] ?? id}</span>
          </button>
        ))}
      </div>
      {open !== null && (
        <Viewer
          quejaDe={(i) => Object.entries(texts.quejas).find(([, q]) => q.imagenes.includes(unlocked[i]))?.[0] ?? null}
          capas={(i, vapor, alTocar) => {
            const capa = capaDeFondo(`fondos/${unlocked[i]}`);
            return capa && <CapasFondo capa={capa} src={assetUrl(`fondos/${unlocked[i]}.webp`)} contener vapor={vapor} onToque={alTocar} />;
          }}
          src={(i) => assetUrl(`fondos/${unlocked[i]}.webp`)}
          label={(i) => texts.titulos[unlocked[i]] ?? unlocked[i]}
          info={(i) => ({ file: `${unlocked[i]}.webp`, text: texts.info_imagenes[unlocked[i]] ?? '' })}
          onShow={(i) => markOpened(imageKey(unlocked[i]))}
          count={unlocked.length}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

type PlaceItem = { kind: 'reino'; reino: Reino } | { kind: 'fondo'; id: string };

/**
 * Lugares: los fondos del juego por dimensión (mundo real, espacial y de las estaciones), cada uno con su
 * ficha. En la de las estaciones, arriba, los emblemas de los reinos. Se desbloquean al verlos en el juego.
 */
function Places() {
  const t = useT();
  const texts = useTexts();
  const g = useGalleryState();
  const r = useReinos();
  const markOpened = useStore((s) => s.markGalleryOpened);
  const [sel, setSel] = useState(DIMENSIONS[0].id);
  const [open, setOpen] = useState<number | null>(null);
  const dim = DIMENSIONS.find((d) => d.id === sel)!;
  const text = texts.lugares[sel];
  const kingdoms = sel === 'estaciones';
  const reinoOf = (id: string) => r.reinos.find((x) => x.id === text.fondos[id]?.reino);
  // El visor recorre lo desbloqueado de la dimensión abierta: los reinos y después los fondos.
  const items: PlaceItem[] = [
    ...(kingdoms ? r.unlocked.map((reino) => ({ kind: 'reino' as const, reino })) : []),
    ...dim.fondos.filter((f) => g.places.has(f.id)).map((f) => ({ kind: 'fondo' as const, id: f.id })),
  ];
  const indexOf = (match: (x: PlaceItem) => boolean) => items.findIndex(match);
  const count = (d: (typeof DIMENSIONS)[number]) => {
    const seen = d.fondos.filter((f) => g.places.has(f.id)).length + (d.id === 'estaciones' ? r.unlocked.length : 0);
    const total = d.fondos.length + (d.id === 'estaciones' ? r.reinos.length : 0);
    return `${seen}/${total}`;
  };
  return (
    <>
      <TermWindow
        className="character-tabs"
        tabs={DIMENSIONS.map((d) => ({
          key: d.id,
          label: texts.lugares[d.id].nombre,
          extra: count(d),
          dot: d.fondos.some((f) => g.newPlaces.has(f.id)) || (d.id === 'estaciones' && r.fresh.size > 0),
        }))}
        active={sel}
        onTab={(k) => {
          if (k === sel) return;
          playSelect();
          setSel(k);
        }}
      >
        {kingdoms && (
          <>
            <h4 className="places-heading">{t('galeria.reinos_titulo')}</h4>
            <div className="kingdom-grid">
              {r.reinos.map((reino) =>
                r.isUnlocked(reino) ? (
                  <button
                    key={reino.id}
                    className="kingdom-item"
                    style={{ '--reino': reino.color } as CSSProperties}
                    onClick={() => setOpen(indexOf((x) => x.kind === 'reino' && x.reino === reino))}
                  >
                    <span className="kingdom-frame">
                      <img src={assetUrl(reino.emblema)} alt="" loading="lazy" draggable={false} />
                      {r.fresh.has(reino.id) && <NewDot className="new-dot-item" />}
                    </span>
                    <span className="gallery-title">{reino.nombre}</span>
                  </button>
                ) : (
                  <div key={reino.id} className="kingdom-item kingdom-locked" aria-hidden>
                    <span className="kingdom-frame">
                      <NoData />
                    </span>
                    <span className="gallery-title">???</span>
                  </div>
                ),
              )}
            </div>
            <h4 className="places-heading">{texts.lugares[sel].nombre}</h4>
          </>
        )}
        <div className="gallery-grid">
          {dim.fondos.map((f) => {
            const reino = reinoOf(f.id);
            return g.places.has(f.id) ? (
              <button
                key={f.id}
                className="gallery-item"
                onClick={() => setOpen(indexOf((x) => x.kind === 'fondo' && x.id === f.id))}
              >
                <div className="gallery-thumb">
                  <img src={assetUrl(`fondos/${f.id}.webp`)} alt="" loading="lazy" draggable={false} />
                  {/* El emblema del reino sale recién cuando ese emblema ya se desbloqueó. */}
                  {reino && r.isUnlocked(reino) && <img className="place-badge" src={assetUrl(reino.emblema)} alt="" draggable={false} />}
                  {g.newPlaces.has(f.id) && <NewDot className="new-dot-item" />}
                </div>
                <span className="gallery-title">{text.fondos[f.id]?.nombre ?? f.id}</span>
              </button>
            ) : (
              <button key={f.id} className="gallery-item gallery-locked" disabled>
                <div className="gallery-thumb">
                  <NoData />
                </div>
                <span className="gallery-title">???</span>
              </button>
            );
          })}
        </div>
      </TermWindow>
      {open !== null && items[open] && (
        <Viewer
          src={(i) => {
            const x = items[i];
            return assetUrl(x.kind === 'reino' ? x.reino.emblema : `fondos/${x.id}.webp`);
          }}
          label={(i) => {
            const x = items[i];
            return x.kind === 'reino' ? x.reino.nombre : (text.fondos[x.id]?.nombre ?? x.id);
          }}
          info={(i) => {
            const x = items[i];
            return x.kind === 'reino'
              ? { file: `reino_${x.reino.id}.webp`, text: x.reino.info }
              : { file: `${x.id}.webp`, text: text.fondos[x.id]?.info ?? '' };
          }}
          onShow={(i) => {
            const x = items[i];
            markOpened(x.kind === 'reino' ? reinoKey(x.reino.id) : placeKey(x.id));
          }}
          emblem={(i) => items[i].kind === 'reino'}
          count={items.length}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

/**
 * Miniatura de un sprite a la misma escala que los demás: un lienzo más alto (un cuerpo entero) o más ancho
 * (un «recortado») no se achica para entrar entero; se recorta en la miniatura (en el visor se ve completo).
 */
function thumbScale(id: string, expr: string): CSSProperties | undefined {
  const c: Character = { id, sprite: `sprites/${id}/${expr}.webp`, pos: 'centro' };
  const h = canvasHeight(statureOf(c)) / BASE_CANVAS;
  const w = h * widthFactor(c);
  if (h === 1 && w === 1) return undefined;
  // Centrado con «left» (el efecto al pasar el mouse usa transform).
  return {
    position: 'absolute',
    top: 0,
    left: `${((1 - w) / 2) * 100}%`,
    width: `${w * 100}%`,
    height: `${h * 100}%`,
    maxWidth: 'none',
  };
}

const ALL = 'todos';
const MISC = 'varios';
/** Personajes con pestaña propia (galeria.json «principales»); el resto (enemigos, NPC) va en «Varios». */
const MAIN = CHARACTERS.filter((c) => galeriaEs.principales.includes(c.id));
const OTHERS = CHARACTERS.filter((c) => !galeriaEs.principales.includes(c.id));

/**
 * Pestañas: Todos, una por personaje principal con su color, y Varios. Un personaje que todavía no
 * apareció en la historia se llama «???».
 */
function Characters() {
  const t = useT();
  const texts = useTexts();
  const g = useGalleryState();
  const markOpened = useStore((s) => s.markGalleryOpened);
  const [sel, setSel] = useState(ALL);
  // Posición en `flat`: el visor recorre todo lo visto de la pestaña abierta (en «Todos», de todos).
  const [open, setOpen] = useState<number | null>(null);
  const seenOf = (id: string) => g.sprites.get(id) ?? [];
  const known = (id: string) => seenOf(id).length > 0;
  const nameOf = (id: string, expr: string) => texts.sprites[`${id}/${expr}`]?.nombre ?? expr.replace(/_/g, ' ');
  const label = (id: string) => (known(id) ? (texts.personajes[id] ?? id) : '???');
  const shown = sel === ALL ? [...MAIN, ...OTHERS] : sel === MISC ? OTHERS : CHARACTERS.filter((c) => c.id === sel);
  const flat: { id: string; expr: string; rpg?: SpriteRpg }[] = shown.flatMap((c) => [
    ...seenOf(c.id).map((sp) => ({ id: c.id, expr: sp.expr })),
    ...g.secretSprites(c.id).map((expr) => ({ id: c.id, expr })),
  ]);
  // La acción que se ve del sprite del combate abierto (se elige en la ficha).
  const [accion, setAccion] = useState('idle');
  const rpgNombre = (hoja: string) => texts.rpg[hoja]?.nombre ?? hoja;
  const newIn = (list: typeof CHARACTERS) => list.some((c) => (g.newSprites.get(c.id)?.length ?? 0) > 0);
  const miscKnown = OTHERS.some((c) => known(c.id));
  const count = (list: typeof CHARACTERS) =>
    `${list.reduce((n, c) => n + seenOf(c.id).length, 0)}/${list.reduce((n, c) => n + c.sprites.length, 0)}`;
  const pick = (key: string) => {
    if (key === sel) return;
    playSelect();
    setSel(key);
  };

  const grid = (c: (typeof CHARACTERS)[number]) => (
    <div className="sprite-grid">
      {c.sprites.map((s) =>
        seenOf(c.id).includes(s) ? (
          <button
            key={s.expr}
            className="sprite-item"
            onClick={() => setOpen(flat.findIndex((f) => f.id === c.id && f.expr === s.expr))}
          >
            <span className="sprite-cell">
              <img
                src={assetUrl(`sprites/${c.id}/${s.expr}.webp`)}
                style={thumbScale(c.id, s.expr)}
                alt=""
                loading="lazy"
                draggable={false}
              />
              {g.newSprites.get(c.id)?.includes(s) && <NewDot className="new-dot-item" />}
            </span>
            <span className="sprite-name">{nameOf(c.id, s.expr)}</span>
          </button>
        ) : (
          <div key={s.expr} className="sprite-item" aria-hidden>
            <span className="sprite-cell">
              <NoData />
            </span>
            <span className="sprite-name muted">???</span>
          </div>
        ),
      )}
      {/* Los secretos: solo los que ya se vieron, al final y con borde magenta. */}
      {g.secretSprites(c.id).map((expr) => (
        <button
          key={expr}
          className="sprite-item sprite-item-secreto"
          onClick={() => setOpen(flat.findIndex((f) => f.id === c.id && f.expr === expr))}
        >
          <span className="sprite-cell">
            <img src={assetUrl(`sprites/${c.id}/${expr}.webp`)} alt="" loading="lazy" draggable={false} />
            {/* La censura también en la miniatura. */}
            {capaDeSprite(`${c.id}/${expr}`) && (
              <CapasFondo capa={capaDeSprite(`${c.id}/${expr}`)!} src={assetUrl(`sprites/${c.id}/${expr}.webp`)} contener fijos />
            )}
          </span>
          <span className="sprite-name">{nameOf(c.id, expr)}</span>
        </button>
      ))}
      {/* Los del combate: pixel art animado. */}
      {/* Los del combate (pixel art) van en su propia pestaña, «Pixel art». */}
    </div>
  );

  /** Una ventana por personaje principal, con su color. */
  const characterWindow = (c: (typeof CHARACTERS)[number]) => (
    <TermWindow
      key={c.id}
      className={known(c.id) ? '' : 'sprite-window-locked'}
      color={known(c.id) ? characterColor(c.id) : undefined}
      tabs={[{ key: c.id, label: label(c.id), color: known(c.id) ? characterColor(c.id) : undefined, dot: newIn([c]) }]}
      right={count([c])}
    >
      {grid(c)}
    </TermWindow>
  );

  /** Varios: una sección por personaje (enemigos y NPC), cada una con su nombre y su color. */
  const miscSections = (
    <div className="misc-sections">
      {OTHERS.map((c) => (
        <section
          key={c.id}
          className={`misc-section ${known(c.id) ? '' : 'misc-section-locked'}`}
          style={{ '--wt': known(c.id) ? characterColor(c.id) : '#5d626c' } as CSSProperties}
        >
          <header>
            <span className="misc-swatch" aria-hidden />
            <h4>{label(c.id)}</h4>
            {newIn([c]) && <NewDot className="new-dot-tab" />}
            <span className="misc-count">{count([c])}</span>
          </header>
          {grid(c)}
        </section>
      ))}
    </div>
  );

  const miscTab = {
    key: MISC,
    label: miscKnown ? t('galeria.varios') : '???',
    color: miscKnown ? characterColor(MISC) : undefined,
    muted: !miscKnown,
    dot: newIn(OTHERS),
  };
  const windowColor = sel === MISC ? miscTab.color : sel !== ALL && known(sel) ? characterColor(sel) : undefined;
  return (
    <>
      <TermWindow
        className="character-tabs"
        tabs={[
          { key: ALL, label: t('galeria.todos'), dot: g.newSpriteCount > 0 },
          ...MAIN.map((c) => ({
            key: c.id,
            label: label(c.id),
            color: known(c.id) ? characterColor(c.id) : undefined,
            muted: !known(c.id),
            dot: newIn([c]),
          })),
          ...(OTHERS.length ? [miscTab] : []),
        ]}
        active={sel}
        onTab={pick}
        color={windowColor}
      >
        {sel === ALL ? (
          <div className="sprite-windows">
            {MAIN.map(characterWindow)}
            {OTHERS.length > 0 && (
              <TermWindow
                className={miscKnown ? '' : 'sprite-window-locked'}
                color={miscTab.color}
                tabs={[{ ...miscTab, muted: false }]}
                right={count(OTHERS)}
              >
                {miscSections}
              </TermWindow>
            )}
          </div>
        ) : sel === MISC ? (
          <>
            <p className="sprite-count muted">{count(OTHERS)}</p>
            {miscSections}
          </>
        ) : (
          shown.map((c) => (
            <div key={c.id}>
              <p className="sprite-count muted">{count([c])}</p>
              {grid(c)}
            </div>
          ))
        )}
      </TermWindow>
      {open !== null && flat[open] && (
        <Viewer
          sprite
          quejaDe={(i) => (texts.quejas[flat[i].id] ? flat[i].id : null)}
          contenido={(i) => {
            const r = flat[i].rpg;
            return r ? <SpriteRpgVista r={r} accion={accion} /> : null;
          }}
          ficha={(i) => {
            const r = flat[i].rpg;
            return r ? <AccionesRpg r={r} accion={accion} onAccion={setAccion} /> : null;
          }}
          capas={(i, vapor, alTocar) => {
            const capa = capaDeSprite(`${flat[i].id}/${flat[i].expr}`);
            const src = assetUrl(`sprites/${flat[i].id}/${flat[i].expr}.webp`);
            return capa && <CapasFondo capa={capa} src={src} contener vapor={vapor} onToque={alTocar} />;
          }}
          src={(i) => assetUrl(`sprites/${flat[i].id}/${flat[i].expr}.webp`)}
          label={(i) =>
            `${texts.personajes[flat[i].id] ?? flat[i].id} · ${flat[i].rpg ? rpgNombre(flat[i].expr) : nameOf(flat[i].id, flat[i].expr)}`
          }
          info={(i) =>
            flat[i].rpg
              ? { file: `${flat[i].expr}.png`, text: texts.rpg[flat[i].expr]?.info ?? '' }
              : { file: `${flat[i].id}/${flat[i].expr}.webp`, text: texts.sprites[`${flat[i].id}/${flat[i].expr}`]?.info ?? '' }
          }
          onShow={(i) => {
            setAccion('idle');
            markOpened(spriteKey(flat[i].id, flat[i].expr));
          }}
          whole={(i) => {
            const other = (galeriaEs.completo as Record<string, string>)[`${flat[i].id}/${flat[i].expr}`];
            return other ? assetUrl(`sprites/${other}.webp`) : null;
          }}
          count={flat.length}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

/** Visor a pantalla completa con flechas e «Información». Se cierra con «Cerrar» o Escape. */
function Viewer({
  src,
  label,
  info,
  onShow,
  count,
  index,
  onIndex,
  onClose,
  sprite,
  emblem,
  whole,
  capas,
  contenido,
  ficha,
  quejaDe,
}: {
  src: (i: number) => string;
  label: (i: number) => string;
  info: (i: number) => { file: string; text: string };
  /** Se llama con cada imagen que se muestra (para quitarle la marca de nueva). */
  onShow: (i: number) => void;
  count: number;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  sprite?: boolean;
  /** Si la imagen es el emblema de un reino (se ve más chico, centrado). */
  emblem?: (i: number) => boolean;
  /** Versión completa de la imagen (botón «Ver completo»), o null si no tiene. */
  whole?: (i: number) => string | null;
  /** Animación encima de la imagen (p. ej. los emblemas +18 y el vapor de una imagen secreta); `alTocar`: al tocar un emblema. */
  capas?: (i: number, vapor: boolean, alTocar: () => void) => ReactNode;
  /** En lugar de la imagen (p. ej. un sprite del combate animado). */
  contenido?: (i: number) => ReactNode;
  /** Algo más dentro de la ficha (p. ej. las acciones del sprite del combate). */
  ficha?: (i: number) => ReactNode;
  /** Al tocar un emblema: quién se queja (su id en «quejas» de galeria.json), o null si no dice nada. */
  quejaDe?: (i: number) => string | null;
}) {
  const t = useT();
  const [showInfo, setShowInfo] = useState(false);
  // «Ver completo»: muestra la otra versión del sprite (p. ej. el cuerpo entero); al cambiar de imagen, vuelve.
  const [full, setFull] = useState(false);
  // Las imágenes secretas tienen vapor, que se puede quitar y volver a poner.
  const [vapor, setVapor] = useState(true);
  /** El menú de abajo, oculto (para ver el sprite entero); se vuelve a mostrar con el botón chico o tocando la imagen. */
  const [sinMenu, setSinMenu] = useState(false);
  const capasActuales = capas?.(index, vapor, () => tocar()) ?? null;
  const propio = contenido?.(index) ?? null;
  const texts = useTexts();
  const [queja, setQueja] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!queja) return;
    const timer = setTimeout(() => setQueja(null), 3600);
    return () => clearTimeout(timer);
  }, [queja]);
  useEffect(() => setQueja(null), [index]);
  const tocar = () => {
    const quien = quejaDe?.(index);
    const lineas = quien ? texts.quejas[quien]?.lineas : undefined;
    if (!quien || !lineas?.length) return;
    playChip('boing');
    setQueja({ texto: siguienteQueja(quien, lineas), n: Math.random() });
  };
  const extraFicha = ficha?.(index) ?? null;
  // Volumen (solo el pixel art del combate): se inclina un poco hacia el mouse (o el dedo), como una chapa.
  const [giro, setGiro] = useState({ x: 0, y: 0 });
  const inclinar = (e: { clientX: number; clientY: number; currentTarget: HTMLElement }) => {
    if (!propio) return;
    const r = e.currentTarget.getBoundingClientRect();
    setGiro({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
  };
  const wholeSrc = whole?.(index) ?? null;
  useEffect(() => setFull(false), [index]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => onShow(index), [index]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % count);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, count, onIndex, onClose]);
  const current = info(index);
  return (
    <div
      className={`gallery-viewer ${sprite ? 'gallery-viewer-sprite' : ''} ${emblem?.(index) ? 'gallery-viewer-emblem' : ''} ${sinMenu ? 'sin-menu' : ''}`}
    >
      {sinMenu && (
        <button className="viewer-mostrar-menu" onClick={() => setSinMenu(false)} aria-label={t('galeria.mostrar_menu')}>
          ☰ {t('galeria.mostrar_menu')}
        </button>
      )}
      <div className="viewer-main">
        <div
          className={`viewer-stage ${propio ? 'viewer-volumen' : sprite ? 'viewer-profundidad' : ''}`}
          style={propio ? ({ '--gx': giro.x, '--gy': giro.y } as CSSProperties) : undefined}
          onPointerMove={inclinar}
          onPointerLeave={() => setGiro({ x: 0, y: 0 })}
        >
          {/* Lo que dice el personaje cuando le tocan los emblemas (Rikka, en lo secreto). */}
          {queja && (
            <span key={queja.n} className="viewer-queja" role="status">
              {queja.texto}
            </span>
          )}
          {propio ?? (
            <img
              key={`${index}-${full}`}
              className={wholeSrc ? (full ? 'viewer-whole' : 'viewer-part') : ''}
              src={full && wholeSrc ? wholeSrc : src(index)}
              alt=""
              draggable={false}
            />
          )}
          {!propio && capasActuales}
        </div>
        {showInfo && (
          <TermWindow
            className="info-window"
            tabs={[{ key: 'info', label: current.file }]}
            onClose={() => {
              playCancel();
              setShowInfo(false);
            }}
          >
            <TypedInfo key={current.file} file={current.file} text={current.text} />
            {extraFicha}
            <button
              className="info-close"
              onClick={() => {
                playCancel();
                setShowInfo(false);
              }}
            >
              {t('galeria.cerrar_ficha')}
            </button>
          </TermWindow>
        )}
      </div>
      <div className="gallery-viewer-bar">
        <button onClick={() => onIndex((index - 1 + count) % count)} aria-label={t('galeria.anterior')}>
          ◀
        </button>
        <span>{label(index)}</span>
        <button onClick={() => onIndex((index + 1) % count)} aria-label={t('galeria.siguiente')}>
          ▶
        </button>
        {wholeSrc && (
          <button
            className={`viewer-whole-btn ${full ? 'active' : ''}`}
            onClick={() => {
              playSelect();
              setFull(!full);
            }}
          >
            {t(full ? 'galeria.ver_sprite' : 'galeria.ver_completo')}
          </button>
        )}
        {capasActuales && (
          <button
            className={`viewer-vapor-btn ${vapor ? '' : 'active'}`}
            onClick={() => {
              playSelect();
              setVapor(!vapor);
            }}
          >
            {t(vapor ? 'galeria.vapor_quitar' : 'galeria.vapor_poner')}
          </button>
        )}
        {/* Solo abre la ficha: se cierra desde la ficha (× o «Cerrar»). El «Cerrar» de esta barra cierra el visor. */}
        <button
          className={showInfo ? 'active' : ''}
          aria-pressed={showInfo}
          onClick={() => {
            if (showInfo) return;
            playSelect();
            setShowInfo(true);
          }}
        >
          {t('galeria.informacion')}
        </button>
        <button
          onClick={() => {
            playCancel();
            setSinMenu(true);
          }}
        >
          {t('galeria.ocultar_menu')}
        </button>
        <button
          onClick={() => {
            playCancel();
            onClose();
          }}
        >
          {t('panel.cerrar')}
        </button>
      </div>
    </div>
  );
}

/** Ficha que se escribe letra por letra, con el sonido de escritura de la caja de diálogo. */
/** Cuántas veces se quejó cada uno en esta sesión: primero en orden; después, al azar entre las últimas seis. */
const quejas = new Map<string, number>();
function siguienteQueja(quien: string, lineas: string[]): string {
  const n = quejas.get(quien) ?? 0;
  quejas.set(quien, n + 1);
  if (n < lineas.length) return lineas[n];
  const ultimas = lineas.slice(-6);
  return ultimas[Math.floor(Math.random() * ultimas.length)];
}

/** Un sprite del combate en el visor: animado, grande y en pixel art (la acción se elige en la ficha). */
function SpriteRpgVista({ r, accion }: { r: SpriteRpg; accion: string }) {
  const escena = useRef<HTMLDivElement>(null);
  const [hoja, setHoja] = useState<Hoja | null>(null);
  useEffect(() => {
    void fetch(`${import.meta.env.BASE_URL}${r.hoja}.json`)
      .then((x) => x.json())
      .then((j: Hoja) => setHoja(j));
  }, [r]);
  // Los rivales miran a la izquierda en la pelea: acá todos miran a la derecha, y lo que lanzan sale hacia allá.
  const efectos = useEfectosSprite({ escena, selector: '.viewer-rpg .batalla-sprite', hoja, anim: accion, color: COLOR_BALAS.get(r.hoja) });
  const [alto, setAlto] = useState(600);
  useEffect(() => {
    const el = escena.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAlto(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const c = (hoja as (Hoja & { cuerpo?: [number, number, number, number] }) | null)?.cuerpo;
  const cuerpoAlto = c ? c[3] - c[1] : 93;
  // Según la guía de estaturas: el más alto (la sombra, 240 cm) llena el alto disponible (arriba de la barra) y los
  // demás, en proporción a su estatura.
  const estatura = ESTATURAS[(galeriaEs.rpg as Record<string, { personaje: string }>)[r.hoja]?.personaje] ?? 165;
  const zoom = (((alto - 90) * 0.9) / cuerpoAlto) * (estatura / ESTATURA_MAX);
  return (
      // El tamaño: el cuerpo, con la escala que tiene en la pelea (la sombra es grande), sin pasarse del alto.
    <div className="viewer-rpg" ref={escena} style={{ '--zrpg': zoom } as CSSProperties}>
      <Centrado hoja={r.hoja}>
        {accion === 'clon' ? (
          // El Clon de sombra: ella y, al lado, su copia hecha de sombra (como en la pelea).
          <span className="rpg-con-clon">
            <span className="batalla-figura clon">
              <SpriteHoja src={r.hoja} anim="idle" bucle />
            </span>
            <SpriteHoja key={`${r.hoja}-idle`} src={r.hoja} anim="idle" bucle />
          </span>
        ) : (
          <SpriteHoja key={`${r.hoja}-${accion}`} src={r.hoja} anim={accion} bucle alCuadro={efectos.alCuadro} />
        )}
      </Centrado>
      {efectos.capa}
    </div>
  );
}
/** La guía de estaturas (cm): el tamaño de cada uno en el visor del pixel art. */
const ESTATURAS = estaturasJson.personajes as Record<string, number>;
const ESTATURA_MAX = Math.max(...Object.keys(galeriaEs.rpg).map((h) => ESTATURAS[(galeriaEs.rpg as Record<string, { personaje: string }>)[h].personaje] ?? 165));
const COLOR_BALAS = colorBalas(Object.values(BATALLAS));

/** «Pixel art»: los personajes del combate que ya aparecieron en una pelea; sus acciones se desbloquean al verlas. */
function PixelArt() {
  const t = useT();
  const g = useGalleryState();
  const texts = useTexts();
  const [open, setOpen] = useState<number | null>(null);
  const [accion, setAccion] = useState('idle');
  const lista = g.rpgTodos;
  return (
    <>
      <div className="sprite-grid pixel-grid">
        {TODOS_RPG.map((r) => {
          const i = lista.findIndex((x) => x.hoja === r.hoja);
          const nombre = texts.personajes[(galeriaEs.rpg as Record<string, { personaje: string }>)[r.hoja].personaje];
          return i < 0 ? (
            <div key={r.hoja} className="sprite-item sprite-item-rpg locked">
              <span className="sprite-cell">???</span>
              <span className="sprite-name">???</span>
            </div>
          ) : (
            <button key={r.hoja} className="sprite-item sprite-item-rpg" onClick={() => setOpen(i)}>
              <span className="sprite-cell">
                <span className="sprite-rpg-mini">
                  <Centrado hoja={r.hoja} alto={88}>
                    <SpriteHoja src={r.hoja} anim="idle" />
                  </Centrado>
                </span>
              </span>
              <span className="sprite-name">{nombre}</span>
            </button>
          );
        })}
      </div>
      {!lista.length && <p className="muted">{t('galeria.pixel_vacio')}</p>}
      {open !== null && lista[open] && (
        <Viewer
          sprite
          contenido={(i) => <SpriteRpgVista r={lista[i]} accion={accion} />}
          ficha={(i) => <AccionesRpg r={lista[i]} accion={accion} onAccion={setAccion} />}
          src={() => ''}
          label={(i) => `${texts.personajes[(galeriaEs.rpg as Record<string, { personaje: string }>)[lista[i].hoja].personaje]} · ${t('galeria.pixel_art')}`}
          info={(i) => ({ file: `${lista[i].hoja}.png`, text: texts.rpg[lista[i].hoja]?.info ?? '' })}
          onShow={() => setAccion('idle')}
          count={lista.length}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

/**
 * Centra un sprite del combate: sus cuadros traen el personaje corrido a un costado (el aire para el arma o el
 * especial), así que se corre según dónde está su cuerpo en reposo (`centro_x` de la hoja).
 */
function Centrado({ hoja, children, alto }: { hoja: string; children: ReactNode; alto?: number }) {
  const [corre, setCorre] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState<number | undefined>(undefined);
  useEffect(() => {
    void fetch(`${import.meta.env.BASE_URL}${hoja}.json`)
      .then((x) => x.json())
      .then((j: Hoja & { cuerpo?: [number, number, number, number] }) => {
        const c = j.cuerpo;
        if (c) setCorre([(j.frameWidth / 2 - (c[0] + c[2]) / 2) / j.frameWidth, (j.frameHeight / 2 - (c[1] + c[3]) / 2) / j.frameHeight]);
        // `alto`: el cuerpo ocupa esos px (la miniatura), sea cual sea el tamaño de su cuadro.
        if (c && alto) setZoom(alto / (c[3] - c[1]));
      });
  }, [hoja, alto]);
  return (
    <span className="rpg-centrado" style={{ '--cx': `${corre[0] * 100}%`, '--cy': `${corre[1] * 100}%`, ...(zoom ? { '--zmini': zoom } : {}) } as CSSProperties}>
      {children}
    </span>
  );
}

/** Las acciones que se muestran en la ficha, en este orden: la pose base, los ataques, el especial, el golpe y la caída. */
const ACCIONES_FICHA = ['idle', 'ataque', 'beso', 'especial', 'aura', 'clon', 'daño', 'derrotado'];
/** Las hojas que tienen el Clon de sombra (Nikki): no es una fila de la hoja, es un especial del combate. */
const CON_CLON = new Set(
  Object.values(BATALLAS).flatMap((d) =>
    Object.values(d.enemigos).flatMap((e) => (e.clon ? [e.sprite] : [])),
  ),
);

/** El nombre del especial de cada hoja (de las peleas: «Ráfaga de puños», «Lluvia de plasma»…), para su botón. */
const NOMBRE_ESPECIAL = new Map<string, string>();
for (const d of Object.values(BATALLAS)) {
  for (const x of [...Object.values(d.personajes), ...Object.values(d.enemigos)]) {
    if (x.especial && !NOMBRE_ESPECIAL.has(x.sprite)) NOMBRE_ESPECIAL.set(x.sprite, x.especial.nombre);
  }
}

/** Las acciones de un sprite del combate (las filas de su hoja, el especial incluido), para verlas en el visor. */
function AccionesRpg({ r, accion, onAccion }: { r: SpriteRpg; accion: string; onAccion: (a: string) => void }) {
  const t = useT();
  const vista = useGalleryState().rpgAccionVista;
  const [lista, setLista] = useState<string[]>([]);
  useEffect(() => {
    void fetch(`${import.meta.env.BASE_URL}${r.hoja}.json`)
      .then((x) => x.json())
      .then((j: { animations: Record<string, unknown> }) =>
        setLista(ACCIONES_FICHA.filter((a) => a in j.animations || (a === 'clon' && CON_CLON.has(r.hoja)))),
      );
  }, [r]);
  return (
    <div className="rpg-acciones">
      <span className="rpg-acciones-titulo">{t('galeria.acciones')}</span>
      {lista.map((a) =>
        vista(r.hoja, a) ? (
          <button
            key={a}
            className={a === accion ? 'active' : ''}
            onClick={() => {
              playSelect();
              onAccion(a);
            }}
          >
            {/* El especial se llama como en la pelea. */}
            {(a === 'especial' && NOMBRE_ESPECIAL.get(r.hoja)) || t(`galeria.accion.${a}`)}
          </button>
        ) : (
          <button key={a} className="bloqueada" disabled title={t('galeria.accion_bloqueada')}>
            ???
          </button>
        ),
      )}
    </div>
  );
}

function TypedInfo({ file, text }: { file: string; text: string }) {
  const speed = useStore((s) => s.settings.textSpeed);
  const instant = speed >= TEXT_SPEED_INSTANT || useStore.getState().settings.reduceEffects;
  const [count, setCount] = useState(instant ? text.length : 0);
  useEffect(() => {
    if (instant || !text) return;
    const start = performance.now();
    let frame = 0;
    startTyping();
    const tick = (now: number) => {
      const n = Math.floor(((now - start) / 1000) * Math.max(speed, 45));
      if (n >= text.length) {
        setCount(text.length);
        stopTyping();
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
  }, [text, speed, instant]);
  const done = count >= text.length;
  return (
    <div className="info-text">
      <div className="term-boot">
        <span className="term-prompt">$</span> <span>cat {file.replace(/\.webp$/, '.txt')}</span>
      </div>
      <p>
        {text.slice(0, count)}
        <span className={`info-cursor ${done ? 'blink' : ''}`}>▌</span>
        <span className="info-hidden">{text.slice(count)}</span>
      </p>
    </div>
  );
}
