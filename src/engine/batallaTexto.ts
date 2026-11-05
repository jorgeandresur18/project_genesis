// El inglés de las peleas (src/data/en/batalla.json y, para los ataques de los héroes, src/data/en/rpg.json). Se traduce
// la pelea entera al empezar: enemigos, diálogos, títulos, charlas y objetos. Los ataques de los héroes guardan su
// nombre en español en `nombre_es`, porque lo equipado se guarda (y se busca) por ese nombre.
import en from '../data/en/batalla.json';
import type { Ataque, DatosBatalla, Especial } from './batalla';
import type { Lang } from './i18n';
import { ataqueEn, objetoEn } from './rpgTexto';

const TEXTOS = en.textos as Record<string, string>;
/** Lo que no se traduce nunca: el juego lo reconoce por su texto («Voz» es la narración, sin nombre). */
const FIJOS = new Set(['Voz']);
/** Las claves que no son texto (rutas, colores, ids): no se tocan. */
const NO_TEXTO = new Set(['sprite', 'sonido', 'color', 'color_disparo', 'fondo', 'anim', 'icono', 'musica', 'pantalla', 'posicion', 'objetivo', 'al_retirarse', 'al_ganar', 'filtro', 'id', 'tipo', 'enemigo', 'desbloqueo', 'descanso', 'intro']);

/** Un texto de pelea en el idioma del jugador (si no tiene inglés, queda en español). */
export const textoBatalla = (lang: Lang, s: string) => (lang === 'en' && !FIJOS.has(s) ? (TEXTOS[s] ?? s) : s);

/** Cambia todos los textos de un objeto (sin tocar rutas, colores ni ids). */
function traducir<T>(x: T, clave = ''): T {
  if (typeof x === 'string') return (NO_TEXTO.has(clave) ? x : textoBatalla('en', x)) as T;
  if (Array.isArray(x)) return x.map((y) => traducir(y, clave)) as T;
  if (x && typeof x === 'object') return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, k.startsWith('_') ? v : traducir(v, k)])) as T;
  return x;
}

/** Un ataque o especial de héroe en inglés, recordando su nombre en español (`nombre_es`). */
export function ataqueHeroeEn<T extends Ataque | Especial>(lang: Lang, a: T): T {
  if (lang !== 'en') return a;
  return { ...traducir(a), ...ataqueEn(lang, a), nombre_es: a.nombre_es ?? a.nombre } as T;
}

/** La pelea en el idioma del jugador. */
export function batallaEn(d: DatosBatalla, lang: Lang): DatosBatalla {
  if (lang !== 'en') return d;
  const personajes = Object.fromEntries(
    Object.entries(d.personajes).map(([k, h]) => {
      const t = traducir(h);
      const at = <T extends Ataque | Especial>(lista?: T[]) => lista?.map((a) => ataqueHeroeEn(lang, a));
      return [
        k,
        {
          ...t,
          ataques: at(h.ataques)!,
          especial: h.especial && ataqueHeroeEn(lang, h.especial),
          especiales: at(h.especiales),
          aprende: h.aprende?.map((x) => ({ ...x, ataque: ataqueHeroeEn(lang, x.ataque) })),
          especiales_extra: h.especiales_extra?.map((x) => ({ ...x, especial: ataqueHeroeEn(lang, x.especial) })),
        },
      ];
    }),
  ) as DatosBatalla['personajes'];
  return {
    ...traducir(d),
    personajes,
    objetos: Object.fromEntries(Object.entries(d.objetos).map(([k, o]) => [k, objetoEn(lang, k, o)])),
    retratos: Object.fromEntries(Object.entries(d.retratos).map(([k, v]) => [textoBatalla(lang, k), v])),
  };
}
