import { useEffect, useState } from 'react';
import type { Scene } from './types';
import { assetUrl, isPlaceholder, screenOf } from './assets';

/** Fondo de imagen (no un marcador ni una pantalla en código): entre dos de estos el cambio es un fundido cruzado. */
const isImage = (ref: string | null) => !!ref && !isPlaceholder(ref) && screenOf(ref) === null;

// Si el fondo nuevo tarda demasiado (o no existe), la escena cambia igual.
const LOAD_TIMEOUT_MS = 8000;

/**
 * Llama a `done` cuando el fondo de la escena ya está descargado: así no se ven los personajes nuevos sobre
 * el fondo anterior mientras baja la imagen. Casi siempre es inmediato (ver engine/preload.ts).
 */
function whenBackgroundReady(scene: Scene, done: () => void): () => void {
  if (!isImage(scene.background)) {
    done();
    return () => {};
  }
  let finished = false;
  // El temporizador va primero: si la imagen ya estaba descargada, `finish` corre enseguida y lo usa.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    done();
  };
  const img = new Image();
  img.onload = finish;
  img.onerror = finish;
  img.src = assetUrl(scene.background!);
  if (img.complete) finish();
  else timer = setTimeout(finish, LOAD_TIMEOUT_MS);
  return () => {
    finished = true;
    clearTimeout(timer);
  };
}

export type TransitionPhase = 'idle' | 'out' | 'in';
export type TransitionColor = 'negro' | 'blanco' | 'negro_lento';

/** Duraciones (ms) de cada tipo de transición: oscurecer/aclarar y volver a aparecer. */
export const TRANSITIONS: Record<TransitionColor, { out: number; in: number }> = {
  negro: { out: 350, in: 450 },
  blanco: { out: 1200, in: 1600 },
  // Fin de una escena de romance: la imagen se apaga despacio y el día siguiente aparece despacio.
  negro_lento: { out: 1600, in: 1800 },
};

/**
 * Transición entre escenas. Entre dos fondos de imagen, el nuevo se funde encima del anterior (lo hace el
 * escenario). Si uno de los dos es una pantalla en código o un marcador, la pantalla funde a negro.
 * Una escena con `transicion: "negro"` o `"blanco"` usa siempre ese fundido (el blanco, largo).
 * Devuelve la escena que hay que mostrar (atrasada durante el fundido), la fase y el color.
 * Con `instant` (p. ej. «Saltar leído») el cambio es inmediato.
 */
export function useSceneTransition(scene: Scene | null, instant: boolean) {
  const [shown, setShown] = useState<Scene | null>(scene);
  // Al entrar al juego (nueva partida o carga) la escena aparece desde negro.
  const [phase, setPhase] = useState<TransitionPhase>('in');
  const [color, setColor] = useState<TransitionColor>('negro');

  useEffect(() => {
    if (!scene) return;
    if (!shown || scene.scene_id === shown.scene_id) {
      if (!shown) setShown(scene);
      return;
    }
    const crossfade = isImage(scene.background) && isImage(shown.background);
    if (instant || (!scene.transicion && scene.background === shown.background)) {
      setShown(scene);
      return;
    }
    if (!scene.transicion && crossfade) {
      // El escenario funde un fondo sobre el otro; aquí solo se espera a que el nuevo esté descargado.
      return whenBackgroundReady(scene, () => setShown(scene));
    }
    const kind = scene.transicion ?? 'negro';
    setColor(kind);
    setPhase('out');
    let cancelLoad = () => {};
    const t = setTimeout(() => {
      cancelLoad = whenBackgroundReady(scene, () => {
        setShown(scene);
        setPhase('in');
      });
    }, TRANSITIONS[kind].out);
    return () => {
      clearTimeout(t);
      cancelLoad();
    };
    // `shown` no va en las dependencias: solo se reacciona al cambio de escena del motor.
  }, [scene, instant]);

  useEffect(() => {
    if (phase !== 'in') return;
    const t = setTimeout(() => setPhase('idle'), TRANSITIONS[color].in);
    return () => clearTimeout(t);
  }, [phase, color]);

  return { shown: shown ?? scene, phase, color };
}
