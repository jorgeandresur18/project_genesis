// La puerta de /all (src/engine/puerta.ts). El PIN no se escribe aquí: el repositorio es público.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { usaAtajo } from '../src/engine/modo';
import { huellaPin, pinCorrecto } from '../src/engine/puerta';

describe('la puerta de /all', () => {
  it('la huella es estable y distinta para cada PIN', async () => {
    expect(await huellaPin('0000')).toMatch(/^[0-9a-f]{64}$/);
    expect(await huellaPin('0000')).toBe(await huellaPin('0000'));
    expect(await huellaPin('0000')).not.toBe(await huellaPin('0001'));
  });

  it('rechaza lo que no es el PIN', async () => {
    for (const pin of ['', '0000', '1234', 'abcd', '12345']) expect(await pinCorrecto(pin), pin).toBe(false);
  });

  it('en el código solo está la huella, ya configurada', () => {
    const codigo = readFileSync('src/engine/puerta.ts', 'utf8');
    expect(codigo).toMatch(/const HUELLA = '[0-9a-f]{64}';/);
  });
});

describe('qué direcciones piden el PIN en lo publicado', () => {
  it('los atajos de prueba, sí', () => {
    for (const q of ['?batalla=bastion', '?batalla=x&vars={}', '?sprites', '?cuadricula', '?escena=cap02_x', '?bootcamp=todo', '?juego=completo', '?nivel=jefe']) {
      expect(usaAtajo('/', q, 1), q).toBe(true);
    }
    expect(usaAtajo('/all', '', 1)).toBe(true);
    expect(usaAtajo('/all/', '', 1)).toBe(true);
    expect(usaAtajo('/cap2', '', 1)).toBe(true);
    expect(usaAtajo('/cap02', '', 1)).toBe(true);
  });

  it('la demo normal, no', () => {
    for (const [ruta, q] of [['/', ''], ['/cap1', ''], ['/cap01', ''], ['/', '?otra=cosa']]) expect(usaAtajo(ruta, q, 1), ruta + q).toBe(false);
  });

  it('cuando se publique un capítulo, su enlace se abre solo', () => {
    expect(usaAtajo('/cap2', '', 2)).toBe(false);
    expect(usaAtajo('/cap3', '', 2)).toBe(true);
  });
});
