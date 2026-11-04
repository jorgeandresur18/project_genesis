// Exportar e importar partidas (src/engine/partidaArchivo.ts) y que las partidas de versiones anteriores sigan funcionando.
import { beforeEach, describe, expect, it } from 'vitest';
import { progresoDeVars } from '../src/engine/batalla';
import { BATALLAS } from '../src/engine/batallas';
import { sanear } from '../src/engine/guardado';
import { leerPartida, nombreArchivo, textoExportado } from '../src/engine/partidaArchivo';
import { useStore, type SaveSlot } from '../src/engine/store';
import { scenes } from '../src/engine/story';
import { estadoInicial } from '../src/engine/turnos';

const ESCENA = [...scenes.keys()][0];
const existe = (id: string) => scenes.has(id);
const partida = (extra: Partial<SaveSlot> = {}): SaveSlot => ({
  sceneId: ESCENA,
  vars: { monedas: 40, mochila_vida: 2, nivel_jair: 6, xp_jair: 3, puesto_jair_cabeza: 'gorro_navidad', ruta: 'base', vio_bar: true },
  history: [{ speaker: 'Jair', text: 'Hola', sid: ESCENA }, { speaker: null, text: 'Sí', choice: true, ci: 1 }],
  date: '2026-11-04T12:00:00.000Z',
  preview: 'Hola',
  nombre: 'Capítulo 1',
  ...extra,
});
const archivo = (p: unknown) => JSON.stringify({ formato: 'project-genesis-partida', partida: p });

describe('exportar e importar una partida', () => {
  it('lo exportado se importa igual', () => {
    const r = leerPartida(textoExportado(partida(), '1.1.0-dev'), existe);
    expect(r).toEqual({ partida: partida() });
  });

  it('rechaza lo que no es una partida, sin romperse', () => {
    for (const texto of ['', 'hola', '[]', 'null', '{}', '{"formato":"otra cosa","partida":{}}', archivo({}), archivo({ sceneId: ESCENA }), archivo({ sceneId: 5, vars: {} })]) {
      expect(leerPartida(texto, existe), texto).toEqual({ error: 'no_es' });
    }
  });

  it('avisa si es de una escena que este juego no tiene, o si es enorme', () => {
    expect(leerPartida(archivo(partida({ sceneId: 'no_existe' })), existe)).toEqual({ error: 'escena' });
    expect(leerPartida('x'.repeat(5_000_001), existe)).toEqual({ error: 'grande' });
  });

  it('no deja pasar lo raro de un archivo ajeno', () => {
    const texto = `{"formato":"project-genesis-partida","partida":{"sceneId":"${ESCENA}","vars":{"__proto__":{"roto":1},"constructor":1,"bien":1,"objeto":{"a":1},"lista":[1],"nulo":null},"history":[5,{"text":1},{"text":"ok","speaker":3}],"date":"cualquiera","auto":true,"nombre":"   "}}`;
    const r = leerPartida(texto, existe);
    if (!('partida' in r)) throw new Error('debía leerla');
    expect(r.partida.vars).toEqual({ bien: 1 });
    expect(({} as Record<string, unknown>).roto).toBeUndefined();
    expect(r.partida.history).toEqual([{ speaker: null, text: 'ok' }]);
    expect(Number.isNaN(Date.parse(r.partida.date))).toBe(false);
    expect(r.partida).not.toHaveProperty('auto');
    expect(r.partida).not.toHaveProperty('nombre');
  });

  it('el nombre del archivo es seguro', () => {
    expect(nombreArchivo(partida({ nombre: 'Mi partida: ¿final?/..' }))).toMatch(/^genesis_[\w-]+_2026-11-04\.json$/);
    expect(nombreArchivo(partida({ nombre: undefined }))).toBe('genesis_partida_2026-11-04.json');
  });
});

describe('las partidas de versiones anteriores', () => {
  // Una partida como las de la demo 1.0, antes del equipo, los estados nuevos y la bomba.
  const vieja = { sceneId: ESCENA, vars: { monedas: 124, nivel_jair: 6, xp_jair: 8, nivel_cami: 15, xp_cami: 0, mochila_vida: 3, mochila_revivir: 1 }, history: [{ speaker: 'Jair', text: 'Hola' }], date: '2026-11-03T20:00:00.000Z', preview: 'Hola' };

  beforeEach(() => useStore.setState({ game: null, saves: Array(6).fill(null) }));

  it('se cargan: las variables nuevas toman su valor por defecto', () => {
    useStore.setState({ saves: [vieja as SaveSlot, null, null, null, null, null] });
    useStore.getState().load(0);
    const { game, error } = useStore.getState();
    expect(error).toBeNull();
    expect(game?.vars.monedas).toBe(124);
    expect(game?.vars.puesto_jair_traje).toBe('');
    expect(game?.vars.cassette_bomba_juicio).toBe(0);
  });

  it('pelean igual: sin ropa ni estados, con su nivel y su mochila', () => {
    const s = estadoInicial(BATALLAS.bastion, progresoDeVars(vieja.vars));
    const jair = s.heroes.find((h) => h.clave === 'jair')!;
    expect([jair.nivel, jair.xp, jair.extra, jair.extraDef, jair.dormido, jair.equipo]).toEqual([6, 8, 0, 0, 0, undefined]);
    expect(s.mochila.vida).toBe(3);
  });

  it('lo guardado sin el torneo nuevo ni la compra desde el título se limpia bien', () => {
    const porDefecto = { saves: Array(6).fill(null), torneo: { ganadas: {}, defensas: 0 }, slotCompra: null };
    const limpio = sanear({ saves: [vieja, { roto: true }], torneo: { ganadas: { bronce: 1 }, defensas: 1 } }, porDefecto, 6);
    expect(limpio.saves?.[0]).toEqual(vieja);
    expect(limpio.saves?.[1]).toBeNull();
    expect(limpio.torneo).toEqual({ ganadas: { bronce: 1 }, defensas: 1 });
    expect(limpio).not.toHaveProperty('slotCompra');
  });

  it('una exportada de la versión vieja también se importa, y queda en su espacio', () => {
    const r = leerPartida(textoExportado(vieja as SaveSlot, '1.0.0'), existe);
    if (!('partida' in r)) throw new Error('debía leerla');
    useStore.getState().importarPartida(2, r.partida);
    expect(useStore.getState().saves[2]?.vars.monedas).toBe(124);
    useStore.getState().load(2);
    expect(useStore.getState().game?.vars.monedas).toBe(124);
  });
});
