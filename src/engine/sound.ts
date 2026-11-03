// Efectos de sonido de la interfaz: el texto que se escribe, elegir una opción, cancelar o cerrar y el glitch.
// Usa Web Audio: los bucles son exactos (sin el corte que deja <audio loop>) y se puede repetir solo
// la parte que suena de un archivo, aunque traiga silencio al principio o al final.
import { useStore } from './store';

const url = (file: string) => (file.includes('/') ? `${import.meta.env.BASE_URL}${file}` : `${import.meta.env.BASE_URL}audio/sfx/${file}`);
const SILENCE = 0.01; // Amplitud por debajo de la cual se considera silencio.
// Niveles de los efectos: tienen que notarse claramente sobre la música (que es un fondo sutil).
// El limitador del bus de efectos evita que se distorsionen con el volumen al máximo.
const TYPING_LEVEL = 1.6;
const SELECT_LEVEL = 2.2;
const CANCEL_LEVEL = 2.2;
const GLITCH_LEVEL = 0.55;

let ctx: AudioContext | null = null;
let sfxBus: AudioNode | null = null;
const buffers = new Map<string, Promise<AudioBuffer>>();
const ranges = new WeakMap<AudioBuffer, { start: number; end: number }>();

export function context(): AudioContext {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** Salida de los efectos, con un limitador para que los niveles altos no se distorsionen. */
function sfxOut(): AudioNode {
  const c = context();
  if (!sfxBus) {
    const limiter = c.createDynamicsCompressor();
    limiter.threshold.value = -4;
    limiter.knee.value = 4;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.08;
    limiter.connect(c.destination);
    sfxBus = limiter;
  }
  return sfxBus;
}

/** Carga y decodifica un archivo (una vez). Acepta un nombre de efecto o una ruta dentro de public/. */
export function load(file: string): Promise<AudioBuffer> {
  if (!buffers.has(file)) {
    buffers.set(
      file,
      fetch(url(file))
        .then((r) => r.arrayBuffer())
        .then((b) => context().decodeAudioData(b)),
    );
  }
  return buffers.get(file)!;
}

/** Parte del archivo que suena (sin el silencio del principio y del final), en segundos. */
export function audibleRange(buf: AudioBuffer): { start: number; end: number } {
  let range = ranges.get(buf);
  if (!range) {
    const loud = (i: number) => {
      for (let c = 0; c < buf.numberOfChannels; c++) if (Math.abs(buf.getChannelData(c)[i]) > SILENCE) return true;
      return false;
    };
    let first = 0;
    let last = buf.length - 1;
    while (first < last && !loud(first)) first++;
    while (last > first && !loud(last)) last--;
    range = { start: first / buf.sampleRate, end: (last + 1) / buf.sampleRate };
    ranges.set(buf, range);
  }
  return range;
}

/** Desbloquea el audio y precarga los efectos. Llamar desde un toque o clic del jugador. */
export function unlockAudio(): void {
  context();
  void load('texto.mp3').catch(() => {});
  void load('seleccion.mp3').catch(() => {});
  void load('cancel.mp3').catch(() => {});
  void load('glitch.mp3').catch(() => {});
}

let typing: { source: AudioBufferSourceNode; gain: GainNode } | null = null;
let typingRequest = 0;

function stopSource(): void {
  if (!typing || !ctx) return;
  const { source, gain } = typing;
  // Bajada de 30 ms para que no haga «clic» al cortar.
  gain.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
  source.stop(ctx.currentTime + 0.03);
  typing = null;
}

/** Empieza el sonido de escritura: repite en bucle la parte que suena hasta que se llame a stopTyping. */
export function startTyping(): void {
  const { sfxVolume, typingSound, muted } = useStore.getState().settings;
  if (muted || !typingSound || sfxVolume <= 0) return;
  const request = ++typingRequest;
  load('texto.mp3')
    .then((buf) => {
      if (request !== typingRequest) return; // El texto ya terminó mientras se cargaba.
      stopSource();
      const c = context();
      const { start, end } = audibleRange(buf);
      const source = c.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      source.loopStart = start;
      source.loopEnd = end;
      const gain = c.createGain();
      gain.gain.value = sfxVolume * TYPING_LEVEL;
      source.connect(gain).connect(sfxOut());
      source.start(0, start);
      typing = { source, gain };
    })
    .catch(() => {});
}

/** Detiene el sonido de escritura. */
export function stopTyping(): void {
  typingRequest++;
  stopSource();
}

/** Aviso de Boringram durante la historia (el sonido de decisión, más bajo). */
export function playNotify(): void {
  playOnce('seleccion.mp3', 0.35);
}

/** Reproduce un efecto corto una vez. */
function playOnce(file: string, level: number): void {
  const { sfxVolume, muted } = useStore.getState().settings;
  if (muted || sfxVolume <= 0) return;
  load(file)
    .then((buf) => {
      const c = context();
      const source = c.createBufferSource();
      source.buffer = buf;
      const gain = c.createGain();
      gain.gain.value = sfxVolume * level;
      source.connect(gain).connect(sfxOut());
      // Desde donde empieza a sonar (los mp3 traen un poco de silencio al principio: se sentía desfasado).
      source.start(0, audibleRange(buf).start);
    })
    .catch(() => {});
}
/** Deja cargados los sonidos de los menús (así el primero no llega tarde). */
export const precargarMenus = () => {
  void load('seleccion.mp3').catch(() => {});
  void load('cancel.mp3').catch(() => {});
  void load('texto.mp3').catch(() => {});
};

/** Sonido al elegir una opción. */
export const playSelect = () => playOnce('seleccion.mp3', SELECT_LEVEL);
/** Sonido al cancelar o cerrar un menú. */
export const playCancel = () => playOnce('cancel.mp3', CANCEL_LEVEL);
/** Sonido de glitch (p. ej. al tocar el logo del título). */
export const playGlitch = () => playOnce('glitch.mp3', GLITCH_LEVEL);

/** Sonidos de 8 bits del nivel de acción, sintetizados al momento (placeholders hasta la fase de arte). */
export type Chip =
  | 'golpe'
  | 'disparo'
  | 'impacto'
  | 'salto'
  | 'herido'
  | 'enemigo'
  | 'modem'
  | 'muerte'
  | 'vacio'
  | 'cambio'
  | 'tick'
  | 'vida'
  | 'boing'
  | 'grito'
  | 'puno'
  | 'cachetada'
  | 'espada'
  | 'tajada'
  | 'vortice'
  | 'paralisis'
  | 'revivir'
  | 'levanta'
  | 'carga'
  | 'destello'
  | 'beso';
export function playChip(kind: Chip): void {
  const { sfxVolume, muted } = useStore.getState().settings;
  if (muted || sfxVolume <= 0) return;
  const c = context();
  const t = c.currentTime;
  const out = c.createGain();
  out.gain.value = sfxVolume * 0.32;
  out.connect(sfxOut());
  /** Un tono cuadrado (o de sierra) que va de `f0` a `f1` en `dur` segundos. */
  const tono = (f0: number, f1: number, dur: number, tipo: OscillatorType = 'square', vol = 1, desde = 0) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = tipo;
    o.frequency.setValueAtTime(f0, t + desde);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + desde + dur);
    g.gain.setValueAtTime(vol, t + desde);
    g.gain.exponentialRampToValueAtTime(0.001, t + desde + dur);
    o.connect(g).connect(out);
    o.start(t + desde);
    o.stop(t + desde + dur + 0.02);
  };
  /** Ruido blanco (golpes, explosiones). */
  const ruido = (dur: number, vol = 1, desde = 0) => {
    const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource();
    const g = c.createGain();
    s.buffer = buf;
    g.gain.setValueAtTime(vol, t + desde);
    g.gain.exponentialRampToValueAtTime(0.001, t + desde + dur);
    s.connect(g).connect(out);
    s.start(t + desde);
  };
  switch (kind) {
    case 'golpe': ruido(0.08, 0.9); tono(180, 60, 0.1, 'square', 0.7); break;
    case 'disparo': tono(1400, 320, 0.12, 'square', 0.5); break;
    case 'impacto': ruido(0.05, 0.6); tono(600, 200, 0.06, 'square', 0.4); break;
    case 'salto': tono(260, 620, 0.14, 'square', 0.35); break;
    case 'herido': tono(420, 90, 0.25, 'sawtooth', 0.6); ruido(0.1, 0.4); break;
    case 'enemigo': tono(900, 500, 0.1, 'sawtooth', 0.3); break;
    case 'muerte': ruido(0.3, 0.7); tono(300, 40, 0.35, 'square', 0.5); break;
    case 'vacio': tono(220, 110, 0.18, 'square', 0.4); tono(110, 80, 0.2, 'square', 0.3, 0.12); break;
    case 'cambio': tono(500, 900, 0.06, 'square', 0.35); tono(900, 1300, 0.06, 'square', 0.3, 0.07); break;
    case 'tick': tono(1500, 1500, 0.03, 'square', 0.2); break;
    case 'vida': tono(660, 990, 0.08, 'square', 0.35); tono(990, 1320, 0.1, 'square', 0.3, 0.08); break;
    // Al tocar un emblema +18: rebota.
    case 'boing': tono(160, 560, 0.09, 'square', 0.4); tono(560, 240, 0.14, 'triangle', 0.35, 0.09); break;
    // El grito de Rikka al final de los toques: un chillido que sube, tiembla y se quiebra (placeholder de voz).
    case 'grito':
      tono(700, 1900, 0.35, 'sawtooth', 0.45);
      tono(1900, 1500, 0.5, 'square', 0.35, 0.35);
      tono(1950, 1550, 0.5, 'sawtooth', 0.25, 0.37);
      tono(1500, 300, 0.45, 'sawtooth', 0.3, 0.85);
      ruido(0.25, 0.25, 0.85);
      break;
    // Combate: cada uno suena distinto al atacar.
    case 'puno': ruido(0.06, 0.8); tono(150, 55, 0.12, 'square', 0.8); tono(90, 45, 0.08, 'triangle', 0.6, 0.03); break;
    case 'cachetada': ruido(0.04, 1); tono(2400, 900, 0.05, 'square', 0.35); ruido(0.06, 0.4, 0.04); break;
    case 'espada': tono(2600, 700, 0.09, 'sawtooth', 0.3); ruido(0.07, 0.35, 0.02); tono(1200, 1600, 0.05, 'square', 0.2, 0.08); break;
    // La media luna de la sombra: un zumbido que pasa.
    case 'tajada': tono(180, 520, 0.25, 'sawtooth', 0.35); tono(520, 140, 0.3, 'square', 0.25, 0.22); ruido(0.3, 0.2, 0.05); break;
    // El vórtice: un remolino grave que baja y sube.
    case 'vortice': tono(90, 40, 0.6, 'sawtooth', 0.4); tono(60, 180, 0.6, 'square', 0.25, 0.4); ruido(0.8, 0.15); break;
    // Parálisis de pesadilla: un temblor agudo que se apaga.
    case 'paralisis': for (let k = 0; k < 6; k++) tono(1300 - k * 120, 900 - k * 90, 0.07, 'square', 0.3, k * 0.08); tono(200, 60, 0.5, 'sawtooth', 0.3, 0.1); break;
    case 'revivir': for (let k = 0; k < 5; k++) tono(440 * 2 ** (k / 4), 440 * 2 ** ((k + 1) / 4), 0.09, 'square', 0.3, k * 0.08); break;
    // Alguien que sale volando por el aire.
    case 'levanta': tono(160, 900, 0.35, 'square', 0.35); ruido(0.2, 0.25); break;
    // Un beso que se lanza: un «mua» agudo y un brillo.
    case 'beso': tono(900, 1400, 0.08, 'triangle', 0.35); tono(1400, 700, 0.14, 'square', 0.25, 0.08); tono(2200, 2600, 0.1, 'triangle', 0.15, 0.22); break;
    // Juntar energía: un zumbido que sube.
    case 'carga': tono(120, 900, 1.4, 'sawtooth', 0.22); tono(240, 1800, 1.4, 'square', 0.12); break;
    // Un destello corto.
    case 'destello': tono(2400, 3200, 0.08, 'square', 0.3); ruido(0.12, 0.35); break;
    // El monstruo: un módem conectándose.
    case 'modem':
      tono(1200, 1200, 0.15, 'square', 0.35);
      tono(2100, 980, 0.25, 'sawtooth', 0.3, 0.15);
      ruido(0.35, 0.35, 0.35);
      tono(1650, 2400, 0.2, 'square', 0.25, 0.7);
      break;
  }
}

/** Televisor viejo (filtro TV CRT): el clic de un botón. */
export function playTvClic(): void {
  const { sfxVolume, muted } = useStore.getState().settings;
  if (muted || sfxVolume <= 0) return;
  const c = context();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'square';
  o.frequency.value = 1800;
  g.gain.setValueAtTime(sfxVolume * 0.08, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.03);
  o.connect(g).connect(sfxOut());
  o.start();
  o.stop(c.currentTime + 0.04);
}

/** Televisor viejo: el golpe grave del tubo al prender o apagar (al prender, además, el silbido agudo). */
export function playTvEncendido(prender: boolean): void {
  const { sfxVolume, muted } = useStore.getState().settings;
  if (muted || sfxVolume <= 0) return;
  const c = context();
  const t = c.currentTime;
  const golpe = c.createOscillator();
  const g = c.createGain();
  golpe.type = 'sine';
  golpe.frequency.setValueAtTime(prender ? 70 : 110, t);
  golpe.frequency.exponentialRampToValueAtTime(prender ? 140 : 40, t + 0.25);
  g.gain.setValueAtTime(sfxVolume * 0.5, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  golpe.connect(g).connect(sfxOut());
  golpe.start(t);
  golpe.stop(t + 0.32);
  if (!prender) return;
  const silbido = c.createOscillator();
  const gs = c.createGain();
  silbido.frequency.value = 15700;
  gs.gain.setValueAtTime(sfxVolume * 0.02, t);
  gs.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  silbido.connect(gs).connect(sfxOut());
  silbido.start(t);
  silbido.stop(t + 0.92);
}

/** Televisor viejo: el ruido de un canal sin señal. Devuelve cómo pararlo. */
export function playEstatica(): () => void {
  const { sfxVolume, muted } = useStore.getState().settings;
  if (muted || sfxVolume <= 0) return () => {};
  const c = context();
  const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const datos = buf.getChannelData(0);
  for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1;
  const fuente = c.createBufferSource();
  fuente.buffer = buf;
  fuente.loop = true;
  const filtro = c.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.value = 3000;
  filtro.Q.value = 0.6;
  const g = c.createGain();
  g.gain.value = sfxVolume * 0.07;
  fuente.connect(filtro).connect(g).connect(sfxOut());
  fuente.start();
  return () => {
    g.gain.setTargetAtTime(0, c.currentTime, 0.03);
    fuente.stop(c.currentTime + 0.15);
  };
}
