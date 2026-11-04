import { createContext, useContext } from 'react';
import { useBoringram } from '../../engine/boringram';
import { playCancel } from '../../engine/sound';

// Lo que comparten las pantallas de Boringram (ver ../Boringram.tsx).
export type View =
  | { kind: 'feed' }
  | { kind: 'mensajes' }
  | { kind: 'perfil'; id: string }
  | { kind: 'post'; id: string; back: View }
  | { kind: 'story'; id: string; back: View }
  | { kind: 'chat'; id: string }
  | { kind: 'tienda' }
  | { kind: 'articulo'; id: string };

export type B = ReturnType<typeof useBoringram>;

/** Sin conexión (wifi y datos apagados, o modo avión): lo que necesita internet avisa y no se hace. */
export const NetContext = createContext({ online: true, msg: '', usar: () => {} });

export function useOffline() {
  const net = useContext(NetContext);
  const toast = useToast();
  return () => {
    if (net.online) {
      net.usar();
      return false;
    }
    playCancel();
    toast(net.msg);
    return true;
  };
}

/**
 * Lo que se comparte: la publicación (<id>) o, en un carrusel, la foto que se está viendo (<id>-2, <id>-3…;
 * cada una tiene su tarjeta en public/compartir, ver tools/compartir.mjs).
 */
export const shareId = (id: string, slide: number) => (slide > 0 ? `${id}-${slide + 1}` : id);

/** Abre la ventana de compartir de una foto (ver ShareSheet). */
export const ShareContext = createContext<(id: string) => void>(() => {});

/** Aviso de la app arriba del celular (p. ej. «no seas acosador»). */
export const ToastContext = createContext<(text: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export const useShare = () => useContext(ShareContext);
