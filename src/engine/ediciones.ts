// El editor de diálogos en vivo (pedido del autor, 2026-11-06): solo en `npm run dev`. Mientras juega, el autor corrige
// el texto de una línea desde la caja de diálogo; se guarda en `docs/guion/ediciones_en_vivo.json` (lo escribe el
// servidor de desarrollo, ver `edicionesEnVivo` en vite.config.ts) y el juego lo muestra en lugar del original, con la
// marca «EDITADO». Claude lo aplica a la historia cuando el autor lo pide. En lo publicado no existe.
import { create } from 'zustand';

export const EDITOR_EN_VIVO = import.meta.env.DEV;

export interface Edicion {
  original: string;
  texto: string;
  fecha: string;
}

interface EstadoEdiciones {
  mapa: Record<string, Edicion>;
  /** Guarda el texto nuevo de una escena (o, con `null`, vuelve al original). */
  guardar: (escena: string, texto: string | null, original: string) => Promise<void>;
}

const RUTA = '/__ediciones';

export const useEdiciones = create<EstadoEdiciones>((set) => ({
  mapa: {},
  guardar: async (escena, texto, original) => {
    const r = await fetch(RUTA, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ escena, texto, original }) });
    if (r.ok) set({ mapa: (await r.json()) as Record<string, Edicion> });
  },
}));

if (EDITOR_EN_VIVO && typeof fetch !== 'undefined' && typeof window !== 'undefined') {
  fetch(RUTA)
    .then((r) => (r.ok ? r.json() : {}))
    .then((mapa) => useEdiciones.setState({ mapa: mapa as Record<string, Edicion> }))
    .catch(() => undefined);
}
