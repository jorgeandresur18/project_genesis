// Validación de la historia: la usa `npm run test:routes`. Ver docs/SPEC.md, sección 7.
import type { Condition, EndingInfo, GameConfig, Scene, StoryFile, VarDecl, Vars } from './types';
import { UI_EFFECTS, VAPORES } from './types';
import { applyChoice, checkAll, effectsOf, enterScene, resolveNext } from './logic';

/** Cuántas opciones puede ofrecer una decisión de la novela a la vez (decisión del autor, 2026-11-02). */
export const MAX_OPCIONES = 4;
import { isKnownScreen, isPlaceholder, screenOf } from './assets';
import reinos from '../data/reinos.json';

const LUGARES = new Set(Object.keys(reinos.lugares));
/** Minijuegos que existen (src/data/minijuegos/<id>.json). */
const MINIJUEGOS = new Set(
  Object.keys(import.meta.glob('../data/minijuegos/*.json')).map((p) => p.split('/').pop()!.replace('.json', '')),
);
/** Batallas por turnos que existen (src/data/batallas/<id>.json). */
const BATALLAS = new Set(
  Object.keys(import.meta.glob('../data/batallas/*.json')).map((p) => p.split('/').pop()!.replace('.json', '')),
);
/** Las variables que guarda cada batalla al ganarla haciendo retirar al jefe (`premio.vars`, p. ej. la noche anormal). */
const PREMIOS = Object.fromEntries(
  Object.entries(import.meta.glob<{ premio?: { vars?: Vars } }>('../data/batallas/*.json', { eager: true, import: 'default' })).map(([p, d]) => [
    p.split('/').pop()!.replace('.json', ''),
    d.premio?.vars ?? {},
  ]),
);
/** Niveles de acción que existen (src/data/niveles/<id>.json). */
const NIVELES = new Set(
  Object.keys(import.meta.glob('../data/niveles/*.json')).map((p) => p.split('/').pop()!.replace('.json', '')),
);

const MAX_STATES = 200_000;

export interface Report {
  errors: string[];
  warnings: string[];
  reachedEndings: Set<string>;
  /** Capítulos cuyo fin (sin continuación todavía) se alcanza. */
  reachedChapterEnds: Set<number>;
  visitedScenes: Set<string>;
  states: number;
}

export function validateStory(
  files: StoryFile[],
  variables: VarDecl,
  endings: EndingInfo[],
  config: GameConfig,
  /** Comprueba que un recurso que no es PLACEHOLDER exista (en la prueba, dentro de public/). */
  assetExists: (ref: string) => boolean = () => true,
): Report {
  const errors: string[] = [];
  const warnings: string[] = [];
  const scenes = new Map<string, Scene>();

  for (const file of files) {
    for (const scene of file.scenes) {
      if (scenes.has(scene.scene_id)) errors.push(`scene_id duplicado: ${scene.scene_id}`);
      scenes.set(scene.scene_id, scene);
    }
  }

  const endingIds = new Set<string>();
  for (const e of endings) {
    if (endingIds.has(e.id)) errors.push(`Final duplicado en el registro: ${e.id}`);
    endingIds.add(e.id);
  }

  if (!scenes.has(config.inicio)) errors.push(`La escena de inicio no existe: ${config.inicio}`);

  // Revisión estática de cada escena.
  const checkVars = (where: string, conds: Condition[] | undefined) => {
    for (const c of conds ?? []) {
      if (!(c.var in variables)) errors.push(`${where}: variable sin declarar "${c.var}"`);
    }
  };
  const checkTarget = (where: string, to: string) => {
    if (!scenes.has(to)) errors.push(`${where}: apunta a una escena inexistente "${to}"`);
  };

  for (const scene of scenes.values()) {
    const id = scene.scene_id;
    checkVars(id, scene.conditions);
    if (typeof scene.next === 'string') checkTarget(id, scene.next);
    if (Array.isArray(scene.next)) {
      for (const b of scene.next) {
        checkTarget(id, b.to);
        checkVars(id, b.conditions);
      }
    }
    scene.choices.forEach((c, i) => {
      const where = `${id} opción ${i + 1}`;
      checkTarget(where, c.next);
      checkVars(where, c.conditions);
      for (const k of Object.keys(c.set ?? {})) {
        if (!(k in variables)) errors.push(`${where}: variable sin declarar "${k}"`);
      }
      for (const k of Object.keys(c.add ?? {})) {
        if (!(k in variables)) errors.push(`${where}: variable sin declarar "${k}"`);
        else if (typeof variables[k] !== 'number') errors.push(`${where}: "add" sobre variable no numérica "${k}"`);
      }
    });
    for (const ref of [scene.background, scene.video_fondo, scene.audio, ...scene.characters.map((c) => c.sprite)]) {
      if (!ref || ref === 'silencio' || isPlaceholder(ref)) continue;
      const screen = screenOf(ref);
      if (screen !== null ? !isKnownScreen(screen) : !assetExists(ref)) errors.push(`${id}: recurso inexistente "${ref}"`);
    }
    for (const fx of effectsOf(scene)) {
      if (!(UI_EFFECTS as readonly string[]).includes(fx)) errors.push(`${id}: ui_effect desconocido "${fx}"`);
    }
    if (scene.vapor && !(VAPORES as readonly string[]).includes(scene.vapor)) errors.push(`${id}: vapor desconocido "${scene.vapor}"`);
    if (scene.toques_salida) {
      checkTarget(`${id} (salida por toques)`, scene.toques_salida);
      if (!scene.secreto) errors.push(`${id}: «toques_salida» solo va en escenas secretas`);
    }
    for (const k of Object.keys(scene.toques_set ?? {})) {
      if (!(k in variables)) errors.push(`${id} (toques_set): variable sin declarar "${k}"`);
    }
    if (scene.lugar && !LUGARES.has(scene.lugar)) errors.push(`${id}: lugar desconocido "${scene.lugar}"`);
    if (scene.minijuego && !MINIJUEGOS.has(scene.minijuego)) errors.push(`${id}: minijuego desconocido "${scene.minijuego}"`);
    if (scene.minijuego && scene.choices.length > 0) errors.push(`${id}: un minijuego no puede tener decisiones`);
    if (scene.minijuego_salida) checkTarget(`${id} (salida del minijuego)`, scene.minijuego_salida);
    if (scene.nivel && !NIVELES.has(scene.nivel)) errors.push(`${id}: nivel desconocido "${scene.nivel}"`);
    if (scene.nivel && scene.choices.length > 0) errors.push(`${id}: un nivel no puede tener decisiones`);
    if (scene.nivel && !scene.nivel_derrota) errors.push(`${id}: el nivel necesita nivel_derrota`);
    if (scene.nivel_derrota) checkTarget(`${id} (derrota del nivel)`, scene.nivel_derrota);
    if (scene.batalla && !BATALLAS.has(scene.batalla)) errors.push(`${id}: batalla desconocida "${scene.batalla}"`);
    if (scene.batalla && scene.choices.length > 0) errors.push(`${id}: una batalla no puede tener decisiones`);
    if (scene.batalla && !scene.batalla_derrota) errors.push(`${id}: la batalla necesita batalla_derrota`);
    if (scene.batalla_derrota) checkTarget(`${id} (derrota de la batalla)`, scene.batalla_derrota);
    if (scene.batalla_perdon) checkTarget(`${id} (perdón en la batalla)`, scene.batalla_perdon);
    if (scene.batalla_perdon && !scene.batalla) errors.push(`${id}: batalla_perdon sin batalla`);
    if (scene.espera && scene.dialogue) errors.push(`${id}: una escena con «espera» no lleva diálogo`);
    if (scene.transicion && !['negro', 'blanco', 'negro_lento'].includes(scene.transicion)) {
      errors.push(`${id}: transición desconocida "${scene.transicion}"`);
    }
    if (scene.choices.length > 0 && scene.next !== null) {
      errors.push(`${id}: tiene decisiones y "next" a la vez; usa solo uno`);
    }
    if (scene.ending) {
      if (!endingIds.has(scene.ending)) errors.push(`${id}: final no registrado "${scene.ending}"`);
      if (scene.next !== null || scene.choices.length > 0) errors.push(`${id}: una escena de final no puede continuar`);
      if (scene.fin_capitulo) errors.push(`${id}: una escena no puede ser final y fin de capítulo a la vez`);
    } else if (scene.fin_capitulo && scene.next === null && scene.choices.length > 0) {
      errors.push(`${id}: un fin de capítulo sin continuación no puede tener decisiones`);
    } else if (!scene.fin_capitulo && scene.choices.length === 0 && scene.next === null) {
      errors.push(`${id}: callejón sin salida (sin "next", decisiones ni final)`);
    }
  }

  // Recorrido de todas las rutas: cada estado es (escena, variables).
  const reachedEndings = new Set<string>();
  const reachedChapterEnds = new Set<number>();
  const visitedScenes = new Set<string>();
  const seen = new Set<string>();
  const queue: { scene: Scene; vars: Vars }[] = [];
  const lookup = (s: string) => scenes.get(s);

  const push = (from: string, to: string, vars: Vars) => {
    const { scene, error } = enterScene(to, vars, lookup);
    if (!scene) {
      errors.push(`${from} → ${to}: ${error}`);
      return;
    }
    const key = `${scene.scene_id}|${JSON.stringify(vars)}`;
    if (seen.has(key)) return;
    seen.add(key);
    queue.push({ scene, vars });
  };

  if (scenes.has(config.inicio)) push('inicio', config.inicio, { ...variables });
  // También desde la primera escena de cada capítulo: así se recorre un capítulo que todavía no está
  // enlazado al anterior (con las variables iniciales).
  for (const file of files) {
    const first = file.scenes[0]?.scene_id;
    if (first && first !== config.inicio) push(`inicio del capítulo ${file.chapter}`, first, { ...variables });
  }

  while (queue.length > 0) {
    if (seen.size > MAX_STATES) {
      errors.push(`Más de ${MAX_STATES} estados: revisa contadores que crecen sin límite`);
      break;
    }
    const { scene, vars } = queue.shift()!;
    visitedScenes.add(scene.scene_id);
    if (scene.ending) {
      reachedEndings.add(scene.ending);
      continue;
    }
    if (scene.fin_capitulo && scene.next === null) {
      reachedChapterEnds.add(scene.fin_capitulo);
      continue;
    }
    // Salir del minijuego sin resolverlo también es un camino.
    if (scene.minijuego_salida) push(`${scene.scene_id} (salida)`, scene.minijuego_salida, vars);
    // Perder el nivel de acción también es un camino (un bad end).
    if (scene.nivel_derrota) push(`${scene.scene_id} (derrota)`, scene.nivel_derrota, vars);
    if (scene.batalla_derrota) push(`${scene.scene_id} (derrota en batalla)`, scene.batalla_derrota, vars);
    if (scene.batalla_perdon) push(`${scene.scene_id} (perdón en batalla)`, scene.batalla_perdon, vars);
    // Tocar los emblemas hasta el grito también es un camino.
    if (scene.toques_salida) push(`${scene.scene_id} (toques)`, scene.toques_salida, { ...vars, ...scene.toques_set });
    const SECRETOS = { juego_completo: true, cap01_completo: true };
    // Opciones que solo aparecen con lo secreto completo (p. ej. la del bar con el Capítulo 1 completo).
    for (const c of scene.choices) {
      if (!c.locked && !checkAll(c.conditions, vars) && checkAll(c.conditions, { ...vars, ...SECRETOS })) {
        push(`${scene.scene_id} (opción secreta)`, c.next, applyChoice(c, vars));
      }
    }
    const visible = scene.choices.filter((c) => checkAll(c.conditions, vars));
    // Regla de la novela: a lo sumo 4 opciones a la vez (contando las secretas que se pueden destapar).
    const conSecretas = scene.choices.filter((c) => checkAll(c.conditions, { ...vars, ...SECRETOS }));
    if (Math.max(visible.length, conSecretas.length) > MAX_OPCIONES)
      errors.push(`${scene.scene_id}: ${Math.max(visible.length, conSecretas.length)} opciones a la vez (el máximo es ${MAX_OPCIONES})`);
    if (visible.length > 0) {
      const open = visible.filter((c) => !c.locked);
      if (open.length === 0) errors.push(`${scene.scene_id}: todas las opciones visibles están tachadas (bloqueo)`);
      for (const c of open) push(scene.scene_id, c.next, applyChoice(c, vars));
      continue;
    }
    const next = resolveNext(scene.next, vars);
    if (!next) {
      errors.push(`${scene.scene_id}: sin continuación con variables ${JSON.stringify(vars)}`);
      continue;
    }
    // Ganar la batalla haciendo retirar al jefe guarda sus variables (p. ej. Nikki: la noche anormal).
    const ganadas = scene.batalla ? { ...vars, ...PREMIOS[scene.batalla] } : vars;
    push(scene.scene_id, resolveNext(scene.next, ganadas) ?? next, ganadas);
    // Las escenas secretas solo se abren con el juego al 100 % (`juego_completo`, ver engine/store.ts): ese
    // camino también se recorre.
    const completo = resolveNext(scene.next, { ...vars, ...SECRETOS });
    if (completo && completo !== next) push(`${scene.scene_id} (juego completo)`, completo, vars);
  }

  for (const e of endings) {
    if (e.estado === 'jugable' && !reachedEndings.has(e.id)) errors.push(`Final inalcanzable: ${e.id}`);
  }
  for (const id of scenes.keys()) {
    if (!visitedScenes.has(id)) warnings.push(`Escena inalcanzable: ${id}`);
  }

  return { errors: [...new Set(errors)], warnings, reachedEndings, reachedChapterEnds, visitedScenes, states: seen.size };
}
