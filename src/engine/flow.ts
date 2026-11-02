// Diagrama de decisiones (estilo Shiny Days): solo inicio, decisiones, sus opciones y finales.
// Las escenas lineales intermedias se colapsan.
import type { Scene, Vars } from './types';
import { applyChoice, enterScene, resolveNext, visibleChoices } from './logic';

export type FlowKind = 'start' | 'decision' | 'option' | 'ending' | 'group';

export interface FlowNode {
  id: string;
  kind: FlowKind;
  sceneId?: string;
  choiceIndex?: number;
  label: string;
  locked?: boolean;
  /** Grupo plegado: las escenas de decisión que tiene adentro. */
  members?: string[];
  col: number;
  y: number;
}

export interface FlowEdge {
  from: string;
  to: string;
}

export const START_ID = '__inicio';

/** Seguidilla de decisiones que se muestra como un solo nodo plegado (src/data/mapa.json). */
export interface FlowGroup {
  id: string;
  label: string;
  prefixes: string[];
}

/**
 * Avanza por las escenas lineales con las variables reales (saltando escenas condicionales y
 * eligiendo la rama de `next` que corresponde) hasta la siguiente decisión visible o un final.
 */
function walk(start: string, vars: Vars, scenes: Map<string, Scene>): Scene | null {
  let id: string | null = start;
  for (let guard = 0; guard < 10000 && id; guard++) {
    const { scene } = enterScene(id, vars, (s) => scenes.get(s));
    if (!scene) return null;
    if (scene.ending || (scene.fin_capitulo && scene.next === null) || visibleChoices(scene, vars).length > 0) return scene;
    id = resolveNext(scene.next, vars);
  }
  return null;
}

const MAX_STATES = 100_000;

export function buildFlow(
  scenes: Map<string, Scene>,
  inicio: string,
  variables: Vars,
  rowGap: number,
  groups: FlowGroup[] = [],
) {
  const nodes = new Map<string, FlowNode>();
  const edges = new Map<string, FlowEdge>();
  const link = (from: string, to: string) => edges.set(`${from}>${to}`, { from, to });

  const addScene = (s: Scene) => {
    if (nodes.has(s.scene_id)) return;
    nodes.set(s.scene_id, {
      id: s.scene_id,
      kind: s.ending || s.fin_capitulo ? 'ending' : 'decision',
      sceneId: s.scene_id,
      label: s.dialogue?.text ?? s.scene_id,
      col: 0,
      y: 0,
    });
  };

  // Recorre los estados (decisión, variables) como la prueba de rutas, para dibujar solo caminos posibles.
  nodes.set(START_ID, { id: START_ID, kind: 'start', label: 'Inicio', col: 0, y: 0 });
  const seen = new Set<string>();
  const queue: { scene: Scene; vars: Vars }[] = [];
  const visit = (from: string, scene: Scene | null, vars: Vars) => {
    if (!scene) return;
    addScene(scene);
    link(from, scene.scene_id);
    const key = `${scene.scene_id}|${JSON.stringify(vars)}`;
    if (seen.has(key) || seen.size > MAX_STATES) return;
    seen.add(key);
    queue.push({ scene, vars });
  };
  visit(START_ID, walk(inicio, variables, scenes), variables);
  while (queue.length > 0) {
    const { scene, vars } = queue.shift()!;
    if (scene.ending || (scene.fin_capitulo && scene.next === null)) continue;
    for (const c of visibleChoices(scene, vars)) {
      const i = scene.choices.indexOf(c);
      const oid = `${scene.scene_id}#${i}`;
      if (!nodes.has(oid)) {
        nodes.set(oid, { id: oid, kind: 'option', sceneId: scene.scene_id, choiceIndex: i, label: c.text, locked: c.locked, col: 0, y: 0 });
      }
      link(scene.scene_id, oid);
      if (c.locked) continue;
      const next = applyChoice(c, vars);
      visit(oid, walk(c.next, next, scenes), next);
    }
  }
  for (const g of groups) collapse(g, nodes, edges);
  return layout(nodes, [...edges.values()], scenes, rowGap);
}

/** Pliega un grupo: sus decisiones y opciones pasan a ser un solo nodo, con las aristas que entran y salen. */
function collapse(g: FlowGroup, nodes: Map<string, FlowNode>, edges: Map<string, FlowEdge>) {
  const members = [...nodes.values()].filter((n) => n.sceneId && g.prefixes.some((p) => n.sceneId!.startsWith(p)));
  if (members.length === 0) return;
  const gid = `group:${g.id}`;
  const ids = new Set(members.map((m) => m.id));
  nodes.set(gid, {
    id: gid,
    kind: 'group',
    label: g.label,
    members: [...new Set(members.map((m) => m.sceneId!))],
    col: 0,
    y: 0,
  });
  for (const [key, e] of [...edges]) {
    const from = ids.has(e.from);
    const to = ids.has(e.to);
    if (!from && !to) continue;
    edges.delete(key);
    if (from && to) continue;
    const a = from ? gid : e.from;
    const b = to ? gid : e.to;
    edges.set(`${a}>${b}`, { from: a, to: b });
  }
  for (const id of ids) nodes.delete(id);
}

function layout(nodes: Map<string, FlowNode>, edges: FlowEdge[], scenes: Map<string, Scene>, rowGap: number) {
  // Columnas: camino más largo desde el inicio, ignorando las aristas que cierran ciclos.
  const out = new Map<string, string[]>();
  for (const e of edges) out.set(e.from, [...(out.get(e.from) ?? []), e.to]);
  const back = new Set<FlowEdge>();
  const state = new Map<string, 'open' | 'done'>();
  const order: string[] = [];
  const dfs = (id: string) => {
    state.set(id, 'open');
    for (const to of out.get(id) ?? []) {
      if (state.get(to) === 'open') back.add(edges.find((e) => e.from === id && e.to === to)!);
      else if (!state.has(to)) dfs(to);
    }
    state.set(id, 'done');
    order.unshift(id);
  };
  dfs(START_ID);
  const forward = edges.filter((e) => !back.has(e));
  for (const id of order) {
    for (const e of forward)
      if (e.from === id) nodes.get(e.to)!.col = Math.max(nodes.get(e.to)!.col, nodes.get(id)!.col + 1);
  }

  // Filas: las opciones se abren en abanico alrededor de su decisión; el resto se centra entre quienes llegan.
  const byCol = new Map<number, FlowNode[]>();
  for (const n of nodes.values()) byCol.set(n.col, [...(byCol.get(n.col) ?? []), n]);
  const cols = [...byCol.keys()].sort((a, b) => a - b);
  for (const col of cols) {
    const list = byCol.get(col)!;
    for (const n of list) {
      if (n.kind === 'start') continue;
      if (n.kind === 'option') {
        const parent = nodes.get(n.sceneId!)!;
        const count = scenes.get(n.sceneId!)!.choices.length;
        n.y = parent.y + (n.choiceIndex! - (count - 1) / 2) * rowGap;
      } else {
        const incoming = forward.filter((e) => e.to === n.id).map((e) => nodes.get(e.from)!.y);
        n.y = incoming.length ? incoming.reduce((a, b) => a + b, 0) / incoming.length : 0;
      }
    }
    // Evita que se encimen dentro de la columna.
    list.sort((a, b) => a.y - b.y);
    for (let i = 1; i < list.length; i++) list[i].y = Math.max(list[i].y, list[i - 1].y + rowGap);
  }
  const minY = Math.min(...[...nodes.values()].map((n) => n.y));
  for (const n of nodes.values()) n.y -= minY;

  return { nodes: [...nodes.values()], edges, columns: cols.length };
}
