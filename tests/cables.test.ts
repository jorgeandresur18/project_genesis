// Los cables de audio del televisor (filtro TV CRT): sin el izquierdo o el derecho, ese lado no suena.
import { describe, expect, it, vi } from 'vitest';

class Nodo {
  conectado: [Nodo, number?, number?][] = [];
  gain = { value: 1, setTargetAtTime(v: number) { this.value = v; } };
  channelCount = 1;
  channelCountMode = 'max';
  connect(n: Nodo, a?: number, b?: number) { this.conectado.push([n, a, b]); return n; }
}
class Ctx {
  currentTime = 0;
  state = 'running';
  destination = new Nodo();
  createGain = () => new Nodo();
  createChannelSplitter = () => new Nodo();
  createChannelMerger = () => new Nodo();
  resume() {}
  suspend() {}
}
vi.stubGlobal('AudioContext', Ctx);
vi.stubGlobal('document', { hidden: false, addEventListener() {} });

describe('cables de audio', () => {
  it('cada lado tiene su volumen y se corta por separado', async () => {
    const { cablesDeAudio, salidaFinal } = await import('../src/engine/sound');
    const entrada = salidaFinal() as unknown as Nodo;
    const separar = entrada.conectado[0][0];
    const izq = separar.conectado.find(([, a]) => a === 0)![0];
    const der = separar.conectado.find(([, a]) => a === 1)![0];
    cablesDeAudio(false, true);
    expect([izq.gain.value, der.gain.value]).toEqual([0, 1]);
    cablesDeAudio(true, false);
    expect([izq.gain.value, der.gain.value]).toEqual([1, 0]);
    cablesDeAudio(false, false);
    expect([izq.gain.value, der.gain.value]).toEqual([0, 0]);
    cablesDeAudio(true, true);
    expect([izq.gain.value, der.gain.value]).toEqual([1, 1]);
  });
});
