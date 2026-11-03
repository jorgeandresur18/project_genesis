// Música de fondo.
// - Cambiar de tema: el anterior se desvanece mientras entra el nuevo.
// - Bucle suave: unos segundos antes del final, la pista se desvanece mientras vuelve a entrar desde el
//   principio, así no corta de golpe aunque el archivo termine abrupto. Los archivos no se modifican.
// - Se ignora el silencio del principio y del final de cada archivo.
import { useStore } from './store';
import { audibleRange, context, load } from './sound';

export const SILENCE = 'silencio';
const CHANGE_FADE = 2; // s: transición entre temas
const LOOP_FADE = 4; // s: superposición al volver a empezar
const START_FADE = 1.5; // s: entrada del primer tema
// La música es un fondo sutil: el volumen de Opciones se multiplica por este nivel (50 % en Opciones ≈ 15 % real).
const MUSIC_LEVEL = 0.3;

let master: GainNode | null = null;
let current: string | null = null;
let token = 0; // Invalida los bucles programados de un tema que ya se cambió.
let voices: { source: AudioBufferSourceNode; gain: GainNode }[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

/** El televisor del filtro TV CRT en un canal sin señal: la música del juego no se oye (la nieve sí). */
let mudaPorTv = false;

function level(settings: { musicVolume: number; muted: boolean }): number {
  return settings.muted || mudaPorTv ? 0 : settings.musicVolume * MUSIC_LEVEL;
}

/** Calla o devuelve la música del juego mientras el televisor está en un canal sin señal. */
export function musicaMudaPorTv(muda: boolean): void {
  mudaPorTv = muda;
  if (master) master.gain.setTargetAtTime(level(useStore.getState().settings), context().currentTime, 0.05);
}

function out(): GainNode {
  const c = context();
  if (!master) {
    master = c.createGain();
    master.gain.value = level(useStore.getState().settings);
    master.connect(c.destination);
    // El volumen de Opciones y el botón de silencio se aplican al momento.
    useStore.subscribe((s, prev) => {
      if (master && level(s.settings) !== level(prev.settings)) {
        master.gain.setTargetAtTime(level(s.settings), context().currentTime, 0.05);
      }
    });
  }
  return master;
}

function fadeOutAll(seconds: number): void {
  const c = context();
  for (const v of voices) {
    v.gain.gain.cancelScheduledValues(c.currentTime);
    v.gain.gain.setValueAtTime(v.gain.gain.value, c.currentTime);
    v.gain.gain.linearRampToValueAtTime(0, c.currentTime + seconds);
    v.source.stop(c.currentTime + seconds + 0.05);
  }
  voices = [];
  if (timer) clearTimeout(timer);
  timer = null;
}

/** Programa una vuelta de la pista en `when` y la siguiente, superpuesta, antes de que termine. */
function scheduleLoop(buf: AudioBuffer, when: number, fadeIn: number, my: number): void {
  if (my !== token) return;
  const c = context();
  const { start, end } = audibleRange(buf);
  const length = end - start;
  const fade = Math.min(LOOP_FADE, length / 4);
  const source = c.createBufferSource();
  source.buffer = buf;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0, when);
  gain.gain.linearRampToValueAtTime(1, when + fadeIn);
  gain.gain.setValueAtTime(1, when + length - fade);
  gain.gain.linearRampToValueAtTime(0, when + length);
  source.connect(gain).connect(out());
  source.start(when, start);
  source.stop(when + length + 0.05);
  const voice = { source, gain };
  voices.push(voice);
  source.onended = () => (voices = voices.filter((v) => v !== voice));
  // La siguiente vuelta entra mientras esta se desvanece. Se programa un poco antes para no llegar tarde.
  const next = when + length - fade;
  timer = setTimeout(() => scheduleLoop(buf, next, fade, my), Math.max(0, (next - c.currentTime - 1) * 1000));
}

/** Reproduce un tema (ruta dentro de public/, p. ej. «audio/musica/serene.mp3») o «silencio». */
export function playMusic(track: string | null): void {
  if (track === current) return;
  current = track;
  const my = ++token;
  fadeOutAll(CHANGE_FADE);
  if (!track || track === SILENCE) return;
  load(track)
    .then((buf) => {
      if (my !== token) return;
      const c = context();
      scheduleLoop(buf, c.currentTime + 0.05, START_FADE, my);
    })
    .catch(() => {});
}
