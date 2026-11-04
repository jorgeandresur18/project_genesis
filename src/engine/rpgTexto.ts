// El inglés de los objetos, los cassettes y los ataques de los héroes (src/data/en/rpg.json). Solo cambia lo que se ve: la
// partida sigue guardando lo equipado con el nombre en español, así que cambiar de idioma no desequipa nada.
import en from '../data/en/rpg.json';
import type { Ataque, Especial, Objeto } from './batalla';
import type { Lang } from './i18n';

const OBJETOS = en.objetos as Record<string, { nombre: string; texto: string }>;
const ATAQUES = en.ataques as Record<string, { nombre: string; texto: string }>;

/** El objeto en el idioma del jugador. */
export function objetoEn<T extends Objeto>(lang: Lang, id: string, o: T): T {
  return lang === 'en' && OBJETOS[id] ? { ...o, ...OBJETOS[id] } : o;
}
/** El nombre de un ataque o especial, a partir de su nombre en español. */
export const nombreAtaque = (lang: Lang, nombre: string) => (lang === 'en' ? (ATAQUES[nombre]?.nombre ?? nombre) : nombre);
/** El ataque o especial en el idioma del jugador. */
export function ataqueEn<T extends Ataque | Especial>(lang: Lang, a: T): T {
  return lang === 'en' && ATAQUES[a.nombre] ? { ...a, ...ATAQUES[a.nombre] } : a;
}
