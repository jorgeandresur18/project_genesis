// Cómo habla alguien según su estado: la frase con quejidos (veneno, quemado) y las palabras revueltas (confundido).
import { describe, expect, it } from 'vitest';
import { conQuejidos, revolver } from '../src/engine/batalla';

describe('hablar con un estado', () => {
  it('con dolor: la misma frase, cortada con quejidos', () => {
    const r = conQuejidos('En serio. Perdón. Ocho años, Nikki, y lo arruiné en un segundo.', ['¡Arg!'], () => 0);
    console.log(r);
    expect(r.replace(/… ¡Arg!… /g, ' ')).toBe('En serio. Perdón. Ocho años, Nikki, y lo arruiné en un segundo.');
    expect(r.match(/¡Arg!/g)?.length).toBe(2);
  });
  it('confundido sin frases propias: las mismas palabras, revueltas', () => {
    const r = revolver('Nikki, perdón. Fue sin pensar.', () => 0.3);
    console.log(r);
    expect(r.replace('… ¿no?', '').toLowerCase().replace(/[^a-záéíóúñ ]/g, '').split(' ').sort()).toEqual(['fue', 'nikki', 'pensar', 'perdón', 'sin']);
  });
});
