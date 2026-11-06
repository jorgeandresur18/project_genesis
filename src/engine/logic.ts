// Lógica pura del motor, compartida por la interfaz y por la prueba de rutas.
import type { Choice, Condition, Next, Scene, Vars } from './types';

export function checkCondition(c: Condition, vars: Vars): boolean {
  const v = vars[c.var];
  switch (c.op) {
    case '==':
      return v === c.value;
    case '!=':
      return v !== c.value;
    case '>':
      return (v as number) > (c.value as number);
    case '>=':
      return (v as number) >= (c.value as number);
    case '<':
      return (v as number) < (c.value as number);
    case '<=':
      return (v as number) <= (c.value as number);
  }
}

export function checkAll(conditions: Condition[] | undefined, vars: Vars): boolean {
  return (conditions ?? []).every((c) => checkCondition(c, vars));
}

export function resolveNext(next: Next, vars: Vars): string | null {
  if (next === null || typeof next === 'string') return next;
  return next.find((b) => checkAll(b.conditions, vars))?.to ?? null;
}

export function applyChoice(choice: Choice, vars: Vars): Vars {
  const out = { ...vars, ...choice.set };
  for (const [k, n] of Object.entries(choice.add ?? {})) {
    out[k] = ((out[k] as number) ?? 0) + n;
  }
  if (choice.equipo) cambiarRopa(out, choice.equipo);
  return out;
}

/** Las variables al entrar en una escena con `equipo` (una copia; sin `equipo`, las mismas). */
export const alEntrar = (scene: Scene, vars: Vars): Vars => {
  if (!scene.equipo) return vars;
  const out = { ...vars };
  cambiarRopa(out, scene.equipo);
  return out;
};

/** Saca una prenda de la partida: de la mochila y de quien la lleve puesta. */
function sacarPrenda(vars: Vars, id: string) {
  vars[`mochila_${id}`] = 0;
  for (const [k, v] of Object.entries(vars)) if (v === id && /^puesto_.+_(cabeza|traje|pies|amuleto)$/.test(k)) vars[k] = '';
}

/** Los cambios de ropa de una opción (`equipo`), sobre `vars` (ya copiada). */
function cambiarRopa(vars: Vars, equipo: NonNullable<Choice['equipo']>) {
  for (const id of equipo.quita ?? []) sacarPrenda(vars, id);
  for (const [heroe, espacios] of Object.entries(equipo.viste ?? {})) {
    for (const [espacio, id] of Object.entries(espacios)) {
      const k = `puesto_${heroe}_${espacio}`;
      const antes = vars[k];
      if (antes === id) continue;
      sacarPrenda(vars, id);
      if (typeof antes === 'string' && antes) vars[`mochila_${antes}`] = ((vars[`mochila_${antes}`] as number) || 0) + 1;
      vars[k] = id;
    }
  }
}

export function visibleChoices(scene: Scene, vars: Vars): Choice[] {
  return scene.choices.filter((c) => checkAll(c.conditions, vars));
}

/**
 * Entra en una escena: salta las escenas cuyas condiciones no se cumplen.
 * Devuelve la escena donde realmente se detiene, o null si una cadena de saltos termina sin destino.
 */
export function enterScene(
  id: string,
  vars: Vars,
  lookup: (id: string) => Scene | undefined,
): { scene: Scene | null; error?: string } {
  let current: string | null = id;
  for (let guard = 0; guard < 1000 && current; guard++) {
    const scene = lookup(current);
    if (!scene) return { scene: null, error: `Escena inexistente: ${current}` };
    if (checkAll(scene.conditions, vars)) return { scene };
    current = resolveNext(scene.next, vars);
  }
  return { scene: null, error: `Salto sin destino desde ${id}` };
}

export function effectsOf(scene: Scene): string[] {
  if (!scene.ui_effect) return [];
  return Array.isArray(scene.ui_effect) ? scene.ui_effect : [scene.ui_effect];
}
