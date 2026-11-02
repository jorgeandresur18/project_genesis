// Contenido de la galería y qué está desbloqueado (y qué es nuevo). Lo usan la galería, Extras y el título.
// - Imágenes: los fondos `fondos/cg_*.webp` del guion; se desbloquean al verlos en el juego (cgSeen). Las de
//   escenas secretas no cuentan para el total ni salen bloqueadas: aparecen al final recién cuando se ven.
// - Sprites: los de los capítulos de galeria.json («capitulos_sprites»); se desbloquean al visitar una escena
//   donde aparecen (snapshots). Una expresión que hoy es sustituto de otra (alias en tools/sprites.config.json)
//   cuenta como la otra, para no repetir la misma imagen.
// - Lugares: los fondos del guion por dimensión (galeria.json «lugares»); se desbloquean al visitar una escena
//   donde aparecen. Solo cuentan los que ya tienen imagen.
// - Nuevo: desbloqueado y todavía no abierto en el visor de la galería (galleryOpened).
import { useStore } from './store';
import { storyFiles } from './story';
import galeria from '../data/galeria.json';
import spriteConfig from '../../tools/sprites.config.json';
import emblemas from '../data/emblemas_18.json';

const cgsDe = (secretas: boolean): string[] => {
  const ids: string[] = [];
  for (const file of storyFiles) {
    for (const scene of file.scenes) {
      if (!!scene.secreto !== secretas) continue;
      const m = scene.background?.match(/^fondos\/(cg_[a-z0-9_]+)\.webp$/);
      if (m && !ids.includes(m[1])) ids.push(m[1]);
    }
  }
  return ids;
};
export const CGS = cgsDe(false);
export const CGS_SECRETOS = cgsDe(true).filter((id) => !CGS.includes(id));

const ALIAS = Object.fromEntries(
  Object.entries(spriteConfig.personajes).map(([id, c]) => [
    id,
    ('alias' in c ? c.alias : {}) as Record<string, string>,
  ]),
);

/** Sprites que no salen en la galería (galeria.json «ocultar»; p. ej. la versión entera de otro). */
const HIDDEN = new Set<string>(galeria.ocultar);

export interface CharacterSprites {
  id: string;
  /** Expresión (archivo real) -> escenas donde aparece. */
  sprites: { expr: string; scenes: string[] }[];
}

export const CHARACTERS: CharacterSprites[] = (() => {
  const byId = new Map<string, Map<string, string[]>>();
  for (const file of storyFiles) {
    if (!galeria.capitulos_sprites.includes(file.chapter)) continue;
    for (const scene of file.scenes) {
      // Las escenas secretas (juego al 100 %) no suman sprites: si no, el 100 % sería imposible.
      if (scene.secreto) continue;
      for (const c of scene.characters) {
        const m = c.sprite.match(/^sprites\/([^/]+)\/([^/.]+)\.webp$/);
        if (!m) continue;
        const expr = ALIAS[m[1]]?.[m[2]] ?? m[2];
        if (HIDDEN.has(`${m[1]}/${expr}`)) continue;
        const sprites = byId.get(m[1]) ?? new Map<string, string[]>();
        sprites.set(expr, [...(sprites.get(expr) ?? []), scene.scene_id]);
        byId.set(m[1], sprites);
      }
    }
  }
  const order = Object.keys(galeria.personajes);
  return [...byId.keys()]
    .sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99))
    .map((id) => ({ id, sprites: [...byId.get(id)!].map(([expr, scenes]) => ({ expr, scenes })) }));
})();

/**
 * Sprites secretos (desbloqueables +18, los de src/data/emblemas_18.json) por personaje: salen al final de su
 * pestaña recién cuando se ven (`secretosVistos`), con borde magenta, y no cuentan para el total.
 */
export const SPRITES_SECRETOS: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const clave of Object.keys(emblemas.sprites)) {
    const [id, expr] = clave.split('/');
    map.set(id, [...(map.get(id) ?? []), expr]);
  }
  return map;
})();

/** Un sprite del combate (pixel art): su hoja, con todas sus animaciones (el especial incluido). */
export interface SpriteRpg {
  hoja: string;
}
/**
 * Sprites del combate por personaje de la galería (galeria.json «rpg»): salen al final de su pestaña recién cuando
 * se vieron en una batalla (`rpgVistos`) y no cuentan para el total. En el visor se ven animados y la ficha tiene
 * sus acciones.
 */
export const SPRITES_RPG: Map<string, SpriteRpg[]> = (() => {
  const map = new Map<string, SpriteRpg[]>();
  for (const [hoja, { personaje }] of Object.entries(galeria.rpg)) map.set(personaje, [...(map.get(personaje) ?? []), { hoja }]);
  return map;
})();

export const TOTAL_SPRITES = CHARACTERS.reduce((n, c) => n + c.sprites.length, 0);

/** Fondo (id) -> escenas donde aparece. */
const SCENES_BY_BACKGROUND = (() => {
  const map = new Map<string, string[]>();
  for (const file of storyFiles) {
    for (const scene of file.scenes) {
      const m = scene.background?.match(/^fondos\/([a-z0-9_]+)\.webp$/);
      if (m) map.set(m[1], [...(map.get(m[1]) ?? []), scene.scene_id]);
    }
  }
  return map;
})();

export interface Dimension {
  id: string;
  /** Fondos de la dimensión que ya están en el guion con su imagen, en el orden de galeria.json. */
  fondos: { id: string; scenes: string[] }[];
}
export const DIMENSIONS: Dimension[] = Object.entries(galeria.lugares).map(([id, d]) => ({
  id,
  fondos: Object.keys(d.fondos)
    .filter((f) => SCENES_BY_BACKGROUND.has(f))
    .map((f) => ({ id: f, scenes: SCENES_BY_BACKGROUND.get(f)! })),
}));
export const TOTAL_PLACES = DIMENSIONS.reduce((n, d) => n + d.fondos.length, 0);
export const placeKey = (id: string) => `lug:${id}`;

/** Color de la ventana de cada personaje (los mismos de la caja de diálogo). */
export const characterColor = (id: string): string => (galeria.colores as Record<string, string>)[id] ?? '#a3a8b2';

export const imageKey = (id: string) => `img:${id}`;
export const spriteKey = (character: string, expr: string) => `spr:${character}/${expr}`;

/** Qué hay desbloqueado y qué es nuevo, según la partida guardada. */
export function useGalleryState() {
  const cgSeen = useStore((s) => s.cgSeen);
  const secretosVistos = useStore((s) => s.secretosVistos);
  const rpgVistos = useStore((s) => s.rpgVistos);
  const visited = useStore((s) => s.snapshots);
  const opened = useStore((s) => s.galleryOpened);
  const images = CGS.filter((id) => cgSeen[id]);
  const secretImages = CGS_SECRETOS.filter((id) => cgSeen[id]);
  const sprites = new Map(
    CHARACTERS.map((c) => [c.id, c.sprites.filter((s) => s.scenes.some((scene) => visited[scene]))] as const),
  );
  const isNew = (key: string) => !opened[key];
  const newImages = [...images, ...secretImages].filter((id) => isNew(imageKey(id)));
  const newSprites = new Map(
    [...sprites].map(([id, list]) => [id, list.filter((s) => isNew(spriteKey(id, s.expr)))] as const),
  );
  const newSpriteCount = [...newSprites.values()].reduce((n, l) => n + l.length, 0);
  const places = new Set(
    DIMENSIONS.flatMap((d) => d.fondos.filter((f) => f.scenes.some((scene) => visited[scene])).map((f) => f.id)),
  );
  const newPlaces = new Set([...places].filter((id) => isNew(placeKey(id))));
  return {
    places,
    newPlaces,
    images,
    secretImages,
    rpgSprites: (id: string) => (SPRITES_RPG.get(id) ?? []).filter((r) => rpgVistos[r.hoja]),
    secretSprites: (id: string) => (SPRITES_SECRETOS.get(id) ?? []).filter((expr) => secretosVistos[`${id}/${expr}`]),
    sprites,
    spriteCount: [...sprites.values()].reduce((n, l) => n + l.length, 0),
    newImages: new Set(newImages),
    newSprites,
    newSpriteCount,
    hasNew: newImages.length + newSpriteCount + newPlaces.size > 0,
  };
}
