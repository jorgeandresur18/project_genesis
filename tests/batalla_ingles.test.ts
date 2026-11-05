// El inglés de las peleas (src/data/en/batalla.json): que no falte ningún texto de enemigos, diálogos, títulos ni charlas,
// que no se pierdan los marcadores ({quien}, {objetivo}…) y que con el juego en inglés lo equipado se siga encontrando.
import { describe, expect, it } from 'vitest';
import charlas from '../src/data/charlas_batalla.json';
import en from '../src/data/en/batalla.json';
import enRpg from '../src/data/en/rpg.json';
import { equipados } from '../src/engine/batalla';
import { ataqueHeroeEn, batallaEn } from '../src/engine/batallaTexto';
import { BATALLAS, FICHAS } from '../src/engine/batallas';

const TEXTOS = en.textos as Record<string, string>;
const ATAQUES = enRpg.ataques as Record<string, unknown>;
/** Lo que se escribe igual en los dos idiomas. */
const IGUALES = new Set(['Jair', 'Cami', 'Rikka', 'Nikki', 'Voz', 'THE KING']);
const NO_TEXTO = new Set(['sprite', 'sonido', 'color', 'color_disparo', 'fondo', 'anim', 'icono', 'musica', 'pantalla', 'posicion', 'objetivo', 'al_retirarse', 'al_ganar', 'filtro', 'id', 'tipo', 'enemigo', 'desbloqueo', 'descanso', 'intro']);
const marcas = (t: string) => [...new Set(t.match(/\{\w+\}/g) ?? [])].sort();

/** Los textos que se ven en una pelea (sin rutas, colores ni ids). */
function textos(x: unknown, clave = '', out: string[] = []): string[] {
  if (typeof x === 'string') {
    if (!NO_TEXTO.has(clave) && (/\s/.test(x) || /^[A-ZÁÉÍÓÚ¿¡]/.test(x))) out.push(x);
  } else if (Array.isArray(x)) x.forEach((y) => textos(y, clave, out));
  else if (x && typeof x === 'object') for (const [k, v] of Object.entries(x)) if (!k.startsWith('_')) textos(v, k, out);
  return out;
}

describe('el inglés de las peleas', () => {
  it('cada texto de los enemigos, las peleas y las charlas tiene su inglés, con los mismos marcadores', () => {
    const todos = [...textos(FICHAS.enemigos), ...Object.values(BATALLAS).flatMap((d) => [...textos(d.dialogos), d.titulo]), ...textos(charlas)];
    const faltan = [...new Set(todos)].filter((s) => !IGUALES.has(s) && !TEXTOS[s] && !ATAQUES[s]);
    expect(faltan).toEqual([]);
    for (const [es, ingles] of Object.entries(TEXTOS)) expect(marcas(ingles), es).toEqual(marcas(es));
  });

  it('con el juego en inglés, la pelea se ve en inglés y lo equipado (guardado en español) se sigue encontrando', () => {
    const d = batallaEn(BATALLAS.bastion, 'en');
    expect(d.enemigos.soldado.nombre).toBe('Federation Soldier');
    expect(d.dialogos.inicio?.[0].quien).toBe('Voz');
    const jair = d.personajes.jair;
    const elegidos = { ataques: FICHAS.heroes.jair.ataques.slice(0, 2).map((a) => a.nombre) };
    const eq = equipados(jair, 10, elegidos);
    expect(eq.ataques.map((a) => a.nombre_es)).toEqual(elegidos.ataques);
    // Un cassette suelto, traducido, también se encuentra por su nombre en español.
    const suelto = Object.values(FICHAS.sueltos).find((s) => s.ataque)!.ataque!;
    const conSuelto = equipados(jair, 10, { ataques: [suelto.nombre] }, [ataqueHeroeEn('en', suelto)]);
    expect(conSuelto.ataques).toHaveLength(1);
  });

  it('en español la pelea queda igual', () => {
    expect(batallaEn(BATALLAS.bastion, 'es')).toBe(BATALLAS.bastion);
  });
});
