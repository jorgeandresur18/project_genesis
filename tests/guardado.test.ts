// El guardado seguro (src/engine/guardado.ts): nunca lanza errores, se recupera de un guardado corrupto y limpia lo cargado.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/** Un localStorage de mentira; `lleno` hace fallar las escrituras (como cuando no queda espacio). */
function falso(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    datos,
    lleno: false,
    getItem(k: string) {
      return datos.has(k) ? datos.get(k)! : null;
    },
    setItem(k: string, v: string) {
      if (this.lleno) throw new Error('QuotaExceededError');
      datos.set(k, v);
    },
    removeItem(k: string) {
      datos.delete(k);
    },
  };
}

async function modulo() {
  vi.resetModules();
  return import('../src/engine/guardado');
}

describe('guardado seguro', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('lee lo guardado y toma un respaldo al abrir', async () => {
    const ls = falso({ g: '{"a":1}' });
    vi.stubGlobal('localStorage', ls);
    const { almacenSeguro } = await modulo();
    expect(almacenSeguro.getItem('g')).toBe('{"a":1}');
    expect(ls.datos.get('g:respaldo')).toBe('{"a":1}');
  });

  it('si lo guardado está corrupto, lo aparta y usa el respaldo', async () => {
    const ls = falso({ g: '{"a":1, roto', 'g:respaldo': '{"a":0}' });
    vi.stubGlobal('localStorage', ls);
    const { almacenSeguro } = await modulo();
    expect(almacenSeguro.getItem('g')).toBe('{"a":0}');
    expect(ls.datos.get('g:corrupto')).toBe('{"a":1, roto');
  });

  it('corrupto y sin respaldo: arranca de cero, pero lo corrupto queda guardado', async () => {
    const ls = falso({ g: 'basura' });
    vi.stubGlobal('localStorage', ls);
    const { almacenSeguro } = await modulo();
    expect(almacenSeguro.getItem('g')).toBeNull();
    expect(ls.datos.get('g:corrupto')).toBe('basura');
  });

  it('sin espacio o sin localStorage, no lanza errores', async () => {
    const ls = falso();
    ls.lleno = true;
    vi.stubGlobal('localStorage', ls);
    const { almacenSeguro } = await modulo();
    expect(() => almacenSeguro.setItem('g', '{}')).not.toThrow();
    vi.stubGlobal('localStorage', undefined);
    expect(() => almacenSeguro.getItem('g')).not.toThrow();
    expect(() => almacenSeguro.removeItem('g')).not.toThrow();
  });

  it('sanear: lo que no tiene la forma esperada vuelve al valor por defecto', async () => {
    const { sanear } = await modulo();
    const porDefecto = { settings: {}, saves: [null, null, null], readScenes: {}, juegoCompleto: false, bootcampNombre: '', payfoe: { saldo: 0, recibido: {} } };
    const limpio = sanear(
      {
        settings: 'roto',
        saves: [{ sceneId: 'cap01_001', vars: {} }, { sceneId: 3 }, null, { sceneId: 'x', vars: {} }],
        readScenes: { cap01_001: true },
        juegoCompleto: 'sí',
        bootcampNombre: 'Jair',
        payfoe: { saldo: -50, recibido: { p1: 10, p2: 'mucho' } },
        extra: 1,
      },
      porDefecto,
      3,
    );
    expect(limpio.settings).toBeUndefined();
    expect(limpio.saves).toEqual([{ sceneId: 'cap01_001', vars: {}, history: [] }, null, null]);
    expect(limpio.readScenes).toEqual({ cap01_001: true });
    expect(limpio.juegoCompleto).toBeUndefined();
    expect(limpio.bootcampNombre).toBe('Jair');
    expect(limpio.payfoe).toEqual({ saldo: 0, recibido: { p1: 10 }, movimientos: [] });
    expect(limpio).not.toHaveProperty('extra');
    expect(sanear('basura', porDefecto, 3)).toEqual({});
  });
});
