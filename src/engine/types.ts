// Modelo de datos de la historia. Ver docs/SPEC.md, sección 3.

export type VarValue = number | boolean | string | null;
export type Vars = Record<string, VarValue>;

export type ConditionOp = '==' | '!=' | '>' | '>=' | '<' | '<=';

export interface Condition {
  var: string;
  op: ConditionOp;
  value: VarValue;
}

/** Rama condicional de `next`: la primera cuyas condiciones se cumplen gana. */
export interface Branch {
  conditions?: Condition[];
  to: string;
}

export type Next = string | Branch[] | null;

export const VAPORES = ['espeso', 'medio', 'ligero', 'rafaga'] as const;
export type Vapor = (typeof VAPORES)[number];

export interface Character {
  id: string;
  sprite: string;
  pos: 'izquierda' | 'centro' | 'derecha';
  /** Fuerza hacia dónde mira; si no está, el motor lo decide (ver engine/facing.ts). */
  mira?: 'izquierda' | 'derecha';
}

export interface Dialogue {
  speaker: string | null;
  text: string;
}

export interface Choice {
  text: string;
  next: string;
  /** Asigna valores absolutos. */
  set?: Vars;
  /** Suma a variables numéricas (p. ej. confianza). */
  add?: Record<string, number>;
  /** Opción tachada: se ve, pero no se puede elegir (efecto locked_choice). */
  locked?: boolean;
  /** Si no se cumplen, la opción no se muestra. */
  conditions?: Condition[];
}

// Luces: luz_carga (blanco que parpadea cada vez más rápido y termina en blanco total), luz_revela (empieza en
// blanco y se aclara), flash (destello blanco rápido), flash_rayo (destello azul).
export const UI_EFFECTS = [
  'os_menu',
  'glitch',
  'boringram_flash',
  'ai_vowels',
  'locked_choice',
  'luz_carga',
  'luz_revela',
  'flash',
  'flash_rayo',
] as const;
const LIGHTS = ['luz_carga', 'luz_revela', 'flash', 'flash_rayo'];
/** Efecto de luz de la escena (se dibuja encima de los personajes), si tiene uno. */
export const lightOf = (effects: string[]) => effects.find((e) => LIGHTS.includes(e)) ?? null;
export type UiEffect = (typeof UI_EFFECTS)[number];

export interface Scene {
  scene_id: string;
  chapter: number;
  background: string | null;
  video_fondo: string | null;
  loop_video: boolean;
  characters: Character[];
  dialogue: Dialogue | null;
  choices: Choice[];
  /** Si no se cumplen al entrar, la escena se salta y se sigue su `next`. */
  conditions: Condition[];
  audio: string | null;
  ui_effect: UiEffect | UiEffect[] | null;
  /** Acción que ocurre sola en una pantalla en código al entrar a la escena (p. ej. borrar el correo). */
  accion_pantalla?: 'eliminar' | 'descargar';
  next: Next;
  /** ID de final (docs/FINALES.md). La escena cierra la partida y se registra en la galería. */
  ending?: string;
  /**
   * Fin de capítulo: no es un final ni va a la galería. Muestra «Fin del capítulo N» y, mientras no exista
   * el capítulo siguiente, vuelve al título. Cuando exista, esta escena pasa a tener `next` hacia él.
   */
  fin_capitulo?: number;
  /**
   * Escena secreta: solo se abre con el juego al 100 % (variable `juego_completo`). No cuenta para el 100 %
   * ni para la galería (si contara, el 100 % sería imposible).
   */
  secreto?: boolean;
  /**
   * Vapor de las termas encima de la escena (detrás del diálogo): «espeso» casi tapa la silueta, «medio» deja
   * ver, «ligero» apenas se nota y «rafaga» se lo lleva de golpe el viento (y queda ligero). Solo atmósfera: la
   * censura va siempre pegada en la imagen.
   */
  vapor?: Vapor;
  /**
   * Escena secreta donde se pueden tocar los emblemas +18: cada toque sigue la «secuencia» del personaje
   * (src/data/emblemas_18.json); al último (el grito) la historia salta a esta escena.
   */
  toques_salida?: string;
  /** Variables que se guardan al salir por los toques (p. ej. que Rikka quedó perturbada). */
  toques_set?: Vars;
  /**
   * Transición al entrar a esta escena. Por defecto, fundido a negro solo si cambia el fondo.
   * «blanco»: fundido largo a blanco (cruce del mundo real al de la IA); se hace aunque no cambie el fondo.
   */
  transicion?: 'negro' | 'blanco' | 'negro_lento';
  /**
   * Escena sin diálogo que se queda en pantalla estos milisegundos y sigue sola (p. ej. una imagen que se
   * deja ver un rato antes de un fundido).
   */
  espera?: number;
  /** Al llegar a un lugar: cartel con el emblema de su reino y el nombre (src/data/reinos.json, «lugares»). */
  lugar?: string;
  /**
   * Minijuego (src/data/minijuegos/<id>.json): sale cuando termina de escribirse la línea de la escena, y la
   * historia no avanza hasta resolverlo (ni con Adelantar ni con «Próxima decisión»).
   */
  minijuego?: string;
  /** Adónde va la historia si el jugador sale del minijuego sin resolverlo. */
  minijuego_salida?: string;
  /**
   * Nivel de acción (src/data/niveles/<id>.json; el juego, en src/game): sale cuando termina de escribirse la
   * línea de la escena, y la historia no avanza hasta ganarlo. Ganarlo sigue con `next`.
   */
  nivel?: string;
  /** Adónde va la historia si el jugador pierde el nivel (un bad end). */
  nivel_derrota?: string;
  /**
   * Batalla por turnos (src/data/batallas/<id>.json): sale cuando termina de escribirse la línea de la escena, y la
   * historia no avanza hasta ganarla. Ganarla sigue con `next`.
   */
  batalla?: string;
  /** Adónde va la historia si el grupo pierde la batalla (un bad end). */
  batalla_derrota?: string;
  /** Adónde va si el rival perdona y la pelea termina hablando (Nikki, después de pedirle perdón tres veces). */
  batalla_perdon?: string;
}

export interface StoryFile {
  ruta: string;
  chapter: number;
  title: string;
  /** Título en inglés (pantalla de fin de capítulo). */
  title_en?: string;
  /**
   * Otra versión del título que asoma con un glitch en la pantalla de fin de capítulo y vuelve al título
   * de siempre (Capítulo 2: «El viaje del antihéroe»).
   */
  title_glitch?: string;
  title_glitch_en?: string;
  /** `borrador` mientras el autor no apruebe los diálogos. */
  estado?: 'borrador' | 'aprobado';
  nota?: string;
  scenes: Scene[];
}

export type VarDecl = Record<string, VarValue>;

export interface EndingInfo {
  id: string;
  nombre: string;
  /** Nombre en inglés. */
  nombre_en?: string;
  pieza: string;
  tipo: string;
  /** Solo los finales `jugable` deben ser alcanzables en la prueba de rutas. */
  estado: 'jugable' | 'por_escribir';
  /** Los finales de prueba no se muestran en la galería ni van en FINALES.md. */
  oculto?: boolean;
  /** No hace falta para el 100 % (es muy difícil de conseguir; p. ej. ganarle a Nikki). */
  opcional?: boolean;
  /**
   * En la pantalla del final, primero se ve este nombre y después, con un glitch, el verdadero (la palabra que
   * cambia): «Una noche normal» → «Una noche anormal».
   */
  nombre_antes?: string;
  nombre_antes_en?: string;
}

export interface GameConfig {
  inicio: string;
  /** Tema de la pantalla de título. */
  musica_titulo?: string;
  /** Tema del Bootcamp Genesis (sin él, sigue el del título). */
  musica_bootcamp?: string | null;
  /** Versión que se ve en una esquina del título. */
  version?: string;
  /** PayFoe se ve en Boringplace (apagado hasta que haya algo que comprar con él; ver docs/BIBLIA_RPG.md, sección 17). */
  payfoe_activo?: boolean;
}
