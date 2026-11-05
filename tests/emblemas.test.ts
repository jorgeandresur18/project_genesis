// Los sprites secretos de Rikka (src/data/emblemas_18.json): emblemas, manos de Cami y lo que dice según dónde.
import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import emblemas from '../src/data/emblemas_18.json';
import galeriaEs from '../src/data/galeria.json';
import galeriaEn from '../src/data/en/galeria.json';

type Mano = { imagen: string; x: number; y: number; w: number; h: number };
const sprites = emblemas.sprites as Record<string, { x: number; y: number; w: number; zona?: string }[]>;
const manos = emblemas.manos as Record<string, { sprites: string[]; marca: boolean; cara?: { x: number; y: number }; acciones: Record<string, unknown>[] }>;
const ZONAS = ['pecho_izq', 'pecho_der', 'pechos', 'nalga_izq', 'nalga_der', 'nalgas', 'abajo'];

describe('manos de los sprites secretos', () => {
  it('cada sprite existe, cada mano tiene su imagen y cada acción apunta a un emblema que existe', () => {
    for (const [grupo, m] of Object.entries(manos)) {
      expect(m.cara, grupo).toBeDefined();
      for (const s of m.sprites) {
        expect(existsSync(`public/sprites/${s}.webp`), s).toBe(true);
        for (const a of m.acciones) {
          const imgs = [a.mano, a.abierta, a.cerrada].filter(Boolean) as Mano[];
          for (const img of imgs) expect(existsSync(`public/${img.imagen}.webp`), img.imagen).toBe(true);
          if (a.tipo !== 'nalgada') expect(sprites[s][a.emblema as number], `${s} ${a.tipo}`).toBeDefined();
          if (a.tipo === 'pecho') expect(sprites[s][a.emblema as number].zona).toBe('pecho');
        }
      }
    }
  });
  it('con el pantalón del traje (vistiéndose), la nalgada no deja marca', () => {
    expect(manos.vistiendose.marca).toBe(false);
    expect(manos.espalda.marca).toBe(true);
  });
  it('de frente, cada pecho tiene su mano (izquierda y derecha) y la de abajo apunta', () => {
    const tipos = manos.frente.acciones.map((a) => `${a.tipo}:${a.lado ?? ''}`).sort();
    expect(tipos).toEqual(['apunta:', 'pecho:der', 'pecho:izq']);
  });
});

describe('lo que dice Rikka según dónde la tocan', () => {
  it('en la galería y en la novela, en español y en inglés, hay frases para cada zona', () => {
    for (const g of [galeriaEs, galeriaEn]) {
      const r = (g.quejas as Record<string, { zonas?: Record<string, string[]>; zonas_novela?: Record<string, string[]> }>).rikka;
      for (const z of ZONAS) {
        expect(r.zonas?.[z]?.length, `galería ${z}`).toBeGreaterThan(0);
        expect(r.zonas_novela?.[z]?.length, `novela ${z}`).toBeGreaterThan(0);
      }
    }
  });
});
