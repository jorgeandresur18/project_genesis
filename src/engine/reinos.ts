// Los cuatro reinos estacionales: emblema, ficha de la galería y carteles de lugar (src/data/reinos.json).
import { escenaPublicada } from './story';
import reinosEs from '../data/reinos.json';
import reinosEn from '../data/en/reinos.json';
import { localized, useLang } from './i18n';
import { useStore } from './store';
import { GALERIA_COMPLETA } from './modo';

export interface Reino {
  id: string;
  nombre: string;
  color: string;
  emblema: string;
  info: string;
  /** Escena que lo desbloquea; sin ella, sigue bloqueado. */
  desbloqueo?: string;
}
export interface Lugar {
  reino: string;
  nombre: string;
}
interface ReinosData {
  reinos: Reino[];
  lugares: Record<string, Lugar>;
}

/** Las fichas en inglés se mezclan por posición (como en Boringram). */
function merged(lang: string): ReinosData {
  const es = reinosEs as ReinosData;
  if (lang === 'es') return es;
  const en = reinosEn as { reinos: Partial<Reino>[]; lugares: Record<string, Partial<Lugar>> };
  return {
    reinos: es.reinos.map((r, i) => ({ ...r, ...en.reinos[i] })),
    lugares: localized(es.lugares, en.lugares, 'en'),
  };
}

export const reinoKey = (id: string) => `reino:${id}`;

export function useReinos() {
  const data = merged(useLang());
  const visited = useStore((s) => s.snapshots);
  const opened = useStore((s) => s.galleryOpened);
  // En la demo, solo los reinos de los capítulos publicados (los demás no salen ni como «???»).
  const reinos = data.reinos.filter((r) => escenaPublicada(r.desbloqueo));
  const unlocked = reinos.filter((r) => r.desbloqueo && (GALERIA_COMPLETA || visited[r.desbloqueo]));
  return {
    reinos,
    unlocked,
    isUnlocked: (r: Reino) => unlocked.includes(r),
    fresh: new Set(unlocked.filter((r) => !opened[reinoKey(r.id)]).map((r) => r.id)),
    /** Cartel de un lugar: el lugar y su reino. */
    lugar: (id: string) => {
      const l = data.lugares[id];
      const reino = l && data.reinos.find((r) => r.id === l.reino);
      return l && reino ? { ...l, reino } : null;
    },
  };
}
