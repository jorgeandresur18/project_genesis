import type { EndingInfo, GameConfig, Scene, StoryFile, VarDecl } from './types';
import variablesJson from '../data/variables.json';
import registroJson from '../data/registro_finales.json';
import juegoJson from '../data/juego.json';
import { MODO_TODO } from './modo';

// Toda la narrativa se carga desde src/data. Los componentes nunca contienen texto de historia.
const modules = import.meta.glob<StoryFile>(
  ['../data/chapters/*.json', '../data/expansions/**/*.json', '../data/finales/*.json', '../data/demo/*.json'],
  { eager: true, import: 'default' },
);

export const storyFiles: StoryFile[] = Object.keys(modules)
  .sort()
  .map((path) => modules[path]);

export const variables = variablesJson as VarDecl;
export const endings = registroJson as EndingInfo[];
/**
 * La configuración del juego. En lo que se compila para publicar (`import.meta.env.PROD`) se le aplica `demo_publica`
 * (lo de más adelante, apagado), salvo en /all; en el servidor de desarrollo y en las pruebas, todo prendido.
 */
const base = juegoJson as GameConfig;
export const config: GameConfig = import.meta.env.PROD && !MODO_TODO && base.demo_publica ? { ...base, ...base.demo_publica } : base;

export const scenes = new Map<string, Scene>();
for (const file of storyFiles) {
  for (const scene of file.scenes) scenes.set(scene.scene_id, scene);
}

export function getScene(id: string): Scene {
  const scene = scenes.get(id);
  if (!scene) throw new Error(`Escena inexistente: ${id}`);
  return scene;
}

/** Valor de `tipo` en el registro para los game over (aparte de los finales de docs/FINALES.md). */
export const BAD_END = 'Bad end';

/** Nombre de un final en el idioma pedido (si no tiene traducción, el original). */
export function endingName(e: EndingInfo, lang: 'es' | 'en'): string {
  return lang === 'en' ? (e.nombre_en ?? e.nombre) : e.nombre;
}

export function getEnding(id: string): EndingInfo | undefined {
  return endings.find((e) => e.id === id);
}
