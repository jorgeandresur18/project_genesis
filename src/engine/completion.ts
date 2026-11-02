// El 100 % del juego: todo lo desbloqueable cuenta (decisión del autor; ver docs/SPEC.md). Cada tipo pesa lo mismo
// (si no, las miles de escenas taparían a los finales).
import { useStore } from './store';
import { endings, storyFiles } from './story';
import { CGS, TOTAL_PLACES, TOTAL_SPRITES, useGalleryState } from './gallery';
import { useBoringramProgress } from './boringram';
import { useReinos } from './reinos';
import { useBootcamp } from './bootcamp';

/**
 * Todas las escenas (cada una es una línea de diálogo) y todas las opciones de todas las decisiones. Las
 * secretas no cuentan: se abren justamente al llegar al 100 %.
 */
const SCENES = storyFiles.flatMap((f) => f.scenes).filter((sc) => !sc.secreto);
const CHOICES = SCENES.flatMap((sc) => sc.choices.map((_, i) => `${sc.scene_id}#${i}`));

/** Una opción que solo se ve con algo secreto completo: no cuenta para completar el capítulo (sería imposible). */
const esSecreta = (conds: { var: string }[] | undefined) => !!conds?.some((c) => c.var === 'juego_completo' || c.var === 'cap01_completo');
const CAP01 = SCENES.filter((sc) => sc.chapter === 1);
const CAP01_DECISIONES = CAP01.flatMap((sc) => sc.choices.flatMap((c, i) => (esSecreta(c.conditions) ? [] : [`${sc.scene_id}#${i}`])));
const CAP01_FINALES = [...new Set(CAP01.flatMap((sc) => (sc.ending ? [sc.ending] : [])))];

/**
 * El Capítulo 1 completo, con todas sus ramas: todas sus escenas leídas, todas sus decisiones tomadas y todos sus
 * finales vistos (sin lo secreto). Abre la escena secreta del bar con Nikki (`cap01_completo`).
 */
export function useCap01Completo(): boolean {
  const read = useStore((s) => s.readScenes);
  const taken = useStore((s) => s.choicesTaken);
  const seen = useStore((s) => s.endingsSeen);
  return CAP01.every((sc) => read[sc.scene_id]) && CAP01_DECISIONES.every((k) => taken[k]) && CAP01_FINALES.every((e) => seen[e]);
}

export interface Progress {
  /** Clave de texto: progreso.<id>. */
  id: string;
  got: number;
  total: number;
}

export function useCompletion() {
  const seen = useStore((s) => s.endingsSeen);
  const read = useStore((s) => s.readScenes);
  const taken = useStore((s) => s.choicesTaken);
  const g = useGalleryState();
  const bor = useBoringramProgress();
  const reinos = useReinos();
  const bootcamp = useBootcamp();
  // Los opcionales (muy difíciles) no hacen falta para el 100 %.
  const playable = endings.filter((e) => e.estado === 'jugable' && !e.opcional);
  const parts: Progress[] = [
    { id: 'escenas', got: SCENES.filter((sc) => read[sc.scene_id]).length, total: SCENES.length },
    { id: 'decisiones', got: CHOICES.filter((k) => taken[k]).length, total: CHOICES.length },
    { id: 'finales', got: playable.filter((e) => seen[e.id]).length, total: playable.length },
    { id: 'imagenes', got: g.images.length, total: CGS.length },
    { id: 'sprites', got: g.spriteCount, total: TOTAL_SPRITES },
    { id: 'lugares', got: g.places.size, total: TOTAL_PLACES },
    { id: 'reinos', got: reinos.unlocked.length, total: reinos.reinos.length },
    { id: 'bootcamp', got: bootcamp.progreso.hechas, total: bootcamp.progreso.total },
    ...Object.entries(bor).map(([id, p]) => ({ id, ...p })),
  ].filter((p) => p.total > 0);
  const got = parts.reduce((n, p) => n + p.got, 0);
  const total = parts.reduce((n, p) => n + p.total, 0);
  // Promedio de los tipos; solo es 100 cuando no falta nada (no se redondea hacia arriba).
  const ratio = parts.length ? parts.reduce((n, p) => n + p.got / p.total, 0) / parts.length : 0;
  // Con dos decimales: hasta lo más chico se nota (0.01 %).
  const percent = got === total ? 100 : Math.min(99.99, Math.floor(ratio * 10000) / 100);
  return { parts, got, total, percent, missing: total - got };
}
