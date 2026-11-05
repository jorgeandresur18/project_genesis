// La puerta de /all (src/engine/puerta.ts). El PIN no se escribe aquí: el repositorio es público.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
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
