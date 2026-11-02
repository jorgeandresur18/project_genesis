// Bootcamp Genesis (extra, no canon; docs/BOOTCAMP.md): la lógica, separada de la pantalla (components/Bootcamp.tsx).
// - Niveles (Trainee, Junior…) que se desbloquean al llegar a una escena de la historia (snapshots).
// - Dentro de un nivel, cada clase se abre al terminar la anterior.
// - Cada clase terminada guarda sus estrellas (1 a 3, según los intentos fallidos); los diplomas también se guardan.
import { MODO_TODO } from './modo';
import { useStore } from './store';
import { scenes } from './story';
import type { CoffeeExercise } from '../components/CoffeeIDE';
import curso from '../data/bootcamp/curso.json';
import cursoEn from '../data/en/bootcamp/curso.json';

export interface Linea {
  quien: string;
  sprite: string;
  texto: string;
  /** Un ejemplo de código para la pizarra de atrás (se queda hasta que otra línea traiga otro). */
  codigo?: string[];
}
export interface Leccion {
  id: string;
  titulo: string;
  tema: string;
  charla: Linea[];
  ejercicio: Partial<CoffeeExercise>;
  cierre: Linea[];
}
export interface Nivel {
  id: string;
  nombre: string;
  descripcion: string;
  /** Se desbloquea al terminar este capítulo. */
  capitulo: number;
  /** Color de la dificultad (del verde al rojo). */
  color: string;
  bloqueo: string;
  lecciones: string[];
  diploma?: Diploma;
}
export interface Diploma {
  titulo: string;
  texto: string;
  /** La publicación en LinkedFired. */
  linkedfired: { texto: string; vistas: string; comentarios: { quien: string; texto: string; sprite?: string }[] };
  /** Remate del final (la graduación del último nivel). */
  remate?: { imagen: string; texto: string };
}

export type Curso = Omit<typeof curso, 'niveles'> & { niveles: Nivel[] };
/** El curso en español (la estructura: niveles, colores, capítulos; los textos, según el idioma con cursoDe). */
export const CURSO = curso as unknown as Curso;

/**
 * Mezcla la traducción sobre el original: objetos por clave y listas por posición (lo que no se traduce queda en
 * español: ids, sprites, respuestas de los huecos, paletas…). Igual que en Boringram.
 */
export function mezclar<T>(a: T, b: unknown): T {
  if (b === undefined || b === null) return a;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => mezclar(x, b[i])) as T;
  if (a && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const [k, v] of Object.entries(b as Record<string, unknown>)) out[k] = mezclar(out[k], v);
    return out as T;
  }
  return b as T;
}
const CURSO_EN = mezclar(CURSO, cursoEn);
/** El curso con los textos del idioma. */
export const cursoDe = (lang: string): Curso => (lang === 'en' ? CURSO_EN : CURSO);
export const NIVELES = CURSO.niveles;
/** Todas las clases que existen, en orden. */
export const TODAS = NIVELES.flatMap((n) => n.lecciones);
export const INTRO = '_intro';
/** Color de quien todavía no terminó ningún nivel. */
export const COLOR_INICIAL = '#ffffff';

/** Para probar: ?bootcamp=todo en la dirección abre todos los niveles y todas las clases (sin tocar el progreso). */
export const PRUEBA =
  MODO_TODO || (typeof location !== 'undefined' && new URLSearchParams(location.search).get('bootcamp') === 'todo');

/** Escenas de fin de cada capítulo (las que tienen fin_capitulo). */
const FINES = new Map<number, string[]>();
for (const s of scenes.values()) {
  if (s.fin_capitulo) FINES.set(s.fin_capitulo, [...(FINES.get(s.fin_capitulo) ?? []), s.scene_id]);
}
export const finesDe = (capitulo: number) => FINES.get(capitulo) ?? [];
export const diplomaKey = (nivel: string) => `diploma:${nivel}`;

/** Largo del nombre del alumno (sale manuscrito en el diploma). */
export const NOMBRE_MIN = 2;
export const NOMBRE_MAX = 32;

/**
 * Código de un diploma, al azar, con cara de oficial: BG-TRA-2026-7F3K-9QXA. Sin letras que se confundan (0/O, 1/I).
 * No verifica nada: es parte del chiste.
 */
export function codigoDiploma(nivel: string, fecha = new Date(), azar: () => number = Math.random): string {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bloque = () => Array.from({ length: 4 }, () => abc[Math.floor(azar() * abc.length)]).join('');
  return `BG-${nivel.slice(0, 3).toUpperCase()}-${fecha.getFullYear()}-${bloque()}-${bloque()}`;
}

/** Estrellas de una clase según los intentos fallidos al compilar. */
export const estrellas = (fallos: number) => (fallos === 0 ? 3 : fallos <= 2 ? 2 : 1);

export function useBootcamp() {
  const visited = useStore((s) => s.snapshots);
  const hechas = useStore((s) => s.bootcampHechas);
  /** Se terminó el capítulo del nivel (o se está probando). */
  const nivelDesbloqueado = (n: Nivel) => PRUEBA || finesDe(n.capitulo).some((id) => visited[id]);
  const nivelAbierto = (n: Nivel) => nivelDesbloqueado(n) && n.lecciones.length > 0;
  const nivelDe = (id: string) => NIVELES.find((n) => n.lecciones.includes(id))!;
  const leccionAbierta = (id: string) => {
    const n = nivelDe(id);
    const i = n.lecciones.indexOf(id);
    return nivelAbierto(n) && (PRUEBA || i === 0 || !!hechas[n.lecciones[i - 1]]);
  };
  const nivelTerminado = (n: Nivel) => n.lecciones.length > 0 && n.lecciones.every((id) => hechas[id]);
  const hechasN = TODAS.filter((id) => hechas[id]).length;
  return {
    /** El bootcamp se abre con el primer nivel (al terminar el Capítulo 1). */
    abierto: nivelAbierto(NIVELES[0]),
    hechas,
    nivelAbierto,
    nivelDesbloqueado,
    nivelTerminado,
    leccionAbierta,
    introVista: !!hechas[INTRO],
    progreso: { hechas: hechasN, total: TODAS.length },
    estrellas: TODAS.reduce((n, id) => n + (hechas[id] ?? 0), 0),
    /** Color de tu rango: blanco al empezar; después, el del último nivel que terminaste (del verde al rojo). */
    colorRango: [...NIVELES].reverse().find(nivelTerminado)?.color ?? COLOR_INICIAL,
  };
}
