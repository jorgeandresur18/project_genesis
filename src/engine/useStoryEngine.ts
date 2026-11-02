import { useEffect } from 'react';
import { conSecretos, useStore } from './store';
import { scenes } from './story';
import { effectsOf, visibleChoices } from './logic';

const SKIP_DELAY_MS = 60;
// Adelantar y retroceder: una línea cada BASE / velocidad (x2 = 600 ms … x16 = 75 ms).
const SPEED_BASE_MS = 1200;

/** Escena actual, decisiones visibles y temporizadores de autoavance y salto de texto leído. */
export function useStoryEngine() {
  const game = useStore((s) => s.game);
  const mode = useStore((s) => s.mode);
  const speed = useStore((s) => s.speed);
  const back = useStore((s) => s.back);
  const readScenes = useStore((s) => s.readScenes);
  const settings = useStore((s) => s.settings);
  const textDone = useStore((s) => s.textDone);
  const advance = useStore((s) => s.advance);
  const setMode = useStore((s) => s.setMode);
  const setTextDone = useStore((s) => s.setTextDone);

  const scene = game ? scenes.get(game.sceneId) ?? null : null;
  const choices = scene && game ? visibleChoices(scene, conSecretos(game.vars)) : [];
  const waitingChoice = choices.length > 0;
  const effects = scene && !settings.reduceEffects ? effectsOf(scene) : [];

  useEffect(() => {
    if (!scene || game?.finished || mode === 'normal') return;
    if (mode === 'ff' || mode === 'rew') {
      // Adelantar se detiene en las decisiones; retroceder, al llegar al principio del recorrido.
      if (!textDone) setTextDone(true);
      if (mode === 'ff' && waitingChoice) {
        setMode('normal');
        return;
      }
      const t = setTimeout(() => {
        if (mode === 'ff') advance();
        else if (!back()) setMode('normal');
      }, SPEED_BASE_MS / speed);
      return () => clearTimeout(t);
    }
    if (mode === 'skip') {
      // El salto se detiene en el primer texto no leído y en las decisiones.
      if (!readScenes[scene.scene_id]) {
        setMode('normal');
        return;
      }
      if (!textDone) setTextDone(true);
      if (waitingChoice) return;
      const t = setTimeout(advance, SKIP_DELAY_MS);
      return () => clearTimeout(t);
    }
    // Auto: espera a que el texto termine de escribirse y después hace una pausa.
    if (!textDone || waitingChoice) return;
    const t = setTimeout(advance, settings.autoDelayMs);
    return () => clearTimeout(t);
  }, [scene, game?.finished, waitingChoice, mode, speed, readScenes, textDone, settings.autoDelayMs, advance, back, setMode, setTextDone]);

  return { game, scene, choices, waitingChoice, effects, mode, textDone };
}
