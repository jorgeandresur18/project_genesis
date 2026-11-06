import { partidaParaComprar } from './tienda';
import { conBomba, ganaBomba } from './torneo';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { almacenSeguro, sanear } from './guardado';
import { escribirEquipo } from './batalla';
import type { Vars } from './types';
import { config, scenes, variables } from './story';
import { applyChoice, enterScene, resolveNext, visibleChoices, alEntrar } from './logic';
import { PAYFOE_INICIAL, acreditar, conGanados, nuevoIdPartida, transferir, type PayFoe } from './payfoe';

export const SAVE_SLOTS = 6;
/** El nombre del guardado automático antes de una pelea. */
export const AUTO_NOMBRE = 'Antes de la pelea';
const HISTORY_LIMIT = 300;
const TRAIL_LIMIT = 300;

export interface HistoryEntry {
  speaker: string | null;
  text: string;
  /** true si la entrada es una decisión del jugador. */
  choice?: boolean;
  /** Escena de la línea (y posición de la opción elegida), para mostrarla traducida. */
  sid?: string;
  ci?: number;
}

/** Un paso atrás: la escena, sus variables y cuántas líneas tenía el historial ahí. */
export interface TrailStep {
  sceneId: string;
  vars: Vars;
  historyLen: number;
}

export interface GameState {
  sceneId: string;
  vars: Vars;
  history: HistoryEntry[];
  /** Por dónde pasó el jugador, para retroceder (no se guarda en las partidas). */
  trail?: TrailStep[];
  /** ID del final mostrado al terminar la partida. */
  finished: string | null;
}

export interface SaveSlot {
  sceneId: string;
  vars: Vars;
  history: HistoryEntry[];
  date: string;
  preview: string;
  /** Guardado en la pantalla de fin de capítulo: al cargar se vuelve a ella. */
  finished?: string | null;
  /** Nombre que le puso el jugador (se pide al guardar y se puede cambiar después). */
  nombre?: string;
  /** Lo guardó el juego solo, antes de una pelea (el mismo espacio se reusa en la próxima). */
  auto?: boolean;
}

export interface Settings {
  reduceEffects: boolean;
  /** Pausa del modo auto después de que el texto terminó de escribirse. */
  autoDelayMs: number;
  /** Caracteres por segundo; TEXT_SPEED_INSTANT o más = texto instantáneo. */
  textSpeed: number;
  /** Volumen de los efectos de sonido, de 0 a 1. */
  sfxVolume: number;
  /** Sonido mientras el texto se escribe. */
  typingSound: boolean;
  /** Volumen de la música, de 0 a 1. */
  musicVolume: number;
  /** Silencia música y efectos sin tocar los volúmenes. */
  muted: boolean;
  /** Tamaño del texto de la caja de diálogo (1 = normal). */
  textScale: number;
  /** Opacidad del fondo de la caja de diálogo, de 0,4 a 1. */
  boxOpacity: number;
  /** Idioma: «auto» usa el del navegador (ver engine/i18n.ts). */
  language: 'auto' | 'es' | 'en';
  /** Filtro TV CRT: la partida (no el menú) se ve en un televisor de tubo, en 4:3. */
  filtroTv: boolean;
  /** Con el filtro TV: el efecto de tubo (líneas de barrido, desenfoque y parpadeo). Sin él, 4:3 nítido. */
  tvEfecto: boolean;
  /** Con el filtro TV: lo que se ve detrás del televisor. */
  tvFondo: 'ninguno' | 'espacio' | 'cosmico' | 'cuarto';
}

export const TEXT_SPEED_INSTANT = 130;
const DEFAULT_SETTINGS: Settings = { reduceEffects: false, autoDelayMs: 1500, textSpeed: 45, sfxVolume: 0.6, typingSound: true, musicVolume: 0.5, muted: false, textScale: 1, boxOpacity: 0.88, language: 'auto', filtroTv: false, tvEfecto: true, tvFondo: 'cuarto' };

/** auto y skip, más adelantar (ff) y retroceder (rew) a velocidad `speed`. */
export type Mode = 'normal' | 'auto' | 'skip' | 'ff' | 'rew';
export const SPEEDS = [2, 4, 8, 16] as const;
export type Speed = (typeof SPEEDS)[number];

/** Prefijo de `game.finished` cuando la partida se detiene en un fin de capítulo (no es un final). */
export const CHAPTER_END = 'capitulo:';

/** Se puede guardar en medio de la partida y en el fin de capítulo, no en la pantalla de un final. */
export function canSaveGame(game: GameState): boolean {
  return !game.finished || game.finished.startsWith(CHAPTER_END);
}

/**
 * Para probar las escenas secretas: con `?juego=completo` el juego se comporta como si estuviera al 100 %, sin
 * guardarlo (la partida real del jugador no cambia).
 */
export const PRUEBA_COMPLETO =
  typeof location !== 'undefined' && new URLSearchParams(location.search).get('juego') === 'completo';

/**
 * Las variables de lo secreto, que no viven en la partida sino en lo que el jugador ya completó: `juego_completo`
 * (el 100 %) y `cap01_completo` (todo el Capítulo 1: escenas, decisiones y finales). Se suman a las de la partida
 * para decidir qué opciones se ven y a qué rama se va.
 */
export const conSecretos = (vars: Vars): Vars => {
  const s = useStore.getState();
  return { ...vars, juego_completo: s.juegoCompleto || PRUEBA_COMPLETO, cap01_completo: s.cap01Completo || s.juegoCompleto || PRUEBA_COMPLETO };
};

/** Celular recién prendido: wifi y datos encendidos, lo demás apagado. */
const AJUSTES_INICIALES: Record<string, boolean> = { wifi: true, datos: true };

interface Store {
  settings: Settings;
  game: GameState | null;
  saves: (SaveSlot | null)[];
  /** Escenas leídas alguna vez (para saltar texto leído y el mapa). */
  readScenes: Record<string, true>;
  /** Variables con las que se vio cada escena por primera vez (para saltar desde el mapa). */
  snapshots: Record<string, Vars>;
  /** Finales alcanzados, con fecha. */
  endingsSeen: Record<string, string>;
  /** Imágenes de la galería ya vistas (id del fondo, p. ej. `cg_beso_nikki`). */
  cgSeen: Record<string, true>;
  /** Sprites secretos (desbloqueables +18) que ya se vieron: salen en la galería, sin contar para el 100 %. */
  secretosVistos: Record<string, true>;
  /** Sprites del combate (pixel art) que ya se vieron en una batalla (`batalla/<hoja>`): salen en la galería. */
  rpgVistos: Record<string, true>;
  /** Imágenes y sprites ya abiertos en el visor de la galería (lo demás desbloqueado sale como nuevo). */
  galleryOpened: Record<string, true>;
  /** Me gusta que el jugador dio o quitó en Boringram (id de la publicación -> le gusta). */
  boringramLikes: Record<string, boolean>;
  /** Comentarios que el jugador escribió en Boringram (id de la publicación -> textos). */
  boringramComments: Record<string, string[]>;
  /** Ajustes rápidos del celular de Boringram (wifi, datos, bluetooth, no_molestar, avion -> prendido). */
  boringramAjustes: Record<string, boolean>;
  /** Hora del celular (minutos) en que el jugador desbloqueó cada notificación de «clave». */
  boringramHoras: Record<string, number>;
  /** Bootcamp Genesis (extra, no canon): clases terminadas con sus estrellas (1-3), la introducción y los diplomas. */
  bootcampHechas: Record<string, number>;
  /** Nombre del alumno del Bootcamp (se pide la primera vez; sale en los diplomas). */
  bootcampNombre: string;
  /** Diplomas emitidos: código al azar (para que parezca de verdad) y fecha. */
  bootcampDiplomas: Record<string, { codigo: string; fecha: string }>;
  /** Niveles del Bootcamp cuyo desbloqueo ya se avisó en el menú. */
  bootcampAvisos: Record<string, true>;
  /** Calificación que le puso el jugador al curso (0: todavía no). */
  bootcampCalificacion: number;
  /** La reseña que escribió el jugador (sale primera, con su nombre). */
  bootcampResena: { texto: string; fecha: string } | null;
  /** Opciones elegidas alguna vez, como `scene_id#índice` (índice en `scene.choices`). Para el mapa. */
  choicesTaken: Record<string, true>;
  /**
   * El jugador llegó al 100 % alguna vez: abre las escenas secretas (variable `juego_completo` en las ramas de
   * `next`). Se queda aunque después aparezca contenido nuevo.
   */
  juegoCompleto: boolean;
  /** El jugador completó todo el Capítulo 1 (todas sus ramas) alguna vez: abre la escena secreta del bar. */
  cap01Completo: boolean;
  marcarCap01Completo: () => void;
  mode: Mode;
  /** Velocidad de adelantar o retroceder (x2, x4, x8, x16). */
  speed: Speed;
  error: string | null;
  /** El texto de la línea actual ya terminó de escribirse (efecto máquina de escribir). */
  textDone: boolean;

  /** Partida nueva desde el inicio (o desde `start`, para probar un capítulo en borrador). */
  newGame: (start?: string) => void;
  advance: () => void;
  /** Minijuego resuelto: sigue a la escena siguiente (ver `minijuego` en la escena). */
  /** Con `vars`, además guarda esas variables (p. ej. el nivel y la experiencia que se ganaron en una batalla). */
  solveMinigame: (vars?: Vars) => void;
  /** Salir del minijuego sin resolverlo: va a `minijuego_salida` de la escena. */
  exitMinigame: () => void;
  /** Se terminó la secuencia de toques de los emblemas: va a `toques_salida` de la escena. */
  salirPorToques: () => void;
  /** Perder el nivel de acción o la batalla: va a `nivel_derrota` (o `batalla_derrota`) de la escena. */
  loseLevel: () => void;
  /** La música de la pelea en curso (manda sobre la de la escena mientras dura; no se guarda). */
  musicaBatalla: string | null;
  setMusicaBatalla: (m: string | null) => void;
  /** Sigue en otro capítulo desde un fin de capítulo, con las mismas variables (modo /all). */
  seguirCapitulo: (sceneId: string) => void;
  /** La batalla termina con el perdón del rival: va a `batalla_perdon` (con las variables de la pelea). */
  perdonarBatalla: (vars?: Vars) => void;
  /** Clic o Espacio: si el texto se está escribiendo, lo completa; si ya terminó, avanza. */
  next: () => void;
  setTextDone: (done: boolean) => void;
  /** Marca una imagen de la galería como vista. */
  markCg: (id: string) => void;
  /** Marca un sprite secreto como visto (`personaje/expresión`). */
  marcarSecreto: (id: string) => void;
  /** Marca sprites del combate como vistos (`batalla/<hoja>`). */
  marcarRpg: (ids: string[]) => void;
  markGalleryOpened: (key: string) => void;
  setBoringramLike: (id: string, liked: boolean) => void;
  addBoringramComment: (id: string, text: string) => void;
  removeBoringramComment: (id: string, index: number) => void;
  setBoringramAjustes: (patch: Record<string, boolean>) => void;
  /** Desbloquea una notificación de «clave» y guarda la hora del celular (solo la primera vez). */
  markBoringramEvento: (key: string, minutos: number) => void;
  /** Marca algo del Bootcamp; si ya estaba, se queda con lo mejor (las estrellas). */
  markBootcamp: (id: string, valor?: number) => void;
  setBootcampNombre: (nombre: string) => void;
  avisarBootcamp: (nivel: string) => void;
  calificarBootcamp: (estrellas: number) => void;
  /** Publica (o borra, con null) la reseña del jugador. */
  resenarBootcamp: (texto: string | null) => void;
  /** Emite el diploma de un nivel la primera vez (código y fecha); después devuelve siempre el mismo. */
  emitirDiploma: (nivel: string, codigo: string) => void;
  marcarJuegoCompleto: () => void;
  choose: (index: number) => void;
  jumpTo: (sceneId: string) => void;
  quitToTitle: () => void;
  save: (slot: number, nombre?: string) => void;
  /** Cambia el nombre de una partida guardada (vacío: vuelve a «Espacio N»). */
  /** Boringplace: comprar (si alcanzan las monedas) y vender (de la mochila). Devuelven si se pudo. */
  comprarObjeto: (objeto: string, precio: number, stockVar?: string) => boolean;
  /** Desde el título: la partida guardada para la que se compra (null: la más reciente). */
  slotCompra: number | null;
  setSlotCompra: (slot: number | null) => void;
  /** Cambia las variables de la partida en curso o, en el título, las de la partida para la que se compra. */
  conVarsTienda: (cambio: (vars: Vars) => Vars | null) => boolean;
  /** PayFoe: la billetera del jugador, fuera de las partidas (ver src/engine/payfoe.ts). */
  payfoe: PayFoe;
  /**
   * Equipa lo elegido de un héroe (`ataques` o `especiales`, por nombre y en orden) en la partida en curso
   * (docs/BIBLIA_RPG.md, sección 18). Solo fuera de las peleas: el panel de Equipo no lo ofrece en una pelea.
   */
  equipar: (heroe: string, tipo: 'ataques' | 'especiales', nombres: string[]) => void;
  /**
   * El equipo y los permanentes, fuera de las peleas (engine/equipo.ts). Aplica un cambio a las variables de la
   * partida: `cambio` devuelve las nuevas, o null si no se pudo. Devuelve si se pudo.
   */
  cambiarVars: (cambio: (vars: Vars) => Vars | null) => boolean;
  /** Boringplace: comprar (si alcanzan los tokens) y vender un cassette suelto (`cassette_<id>`). Devuelven si se pudo. */
  comprarCassette: (id: string, precio: number) => boolean;
  venderCassette: (id: string, precio: number) => boolean;
  /**
   * El Torneo Genesis (fuera de las partidas): cuántas veces se ganó cada copa y cuántas defensas del título lleva
   * Nikki (cada vez que se le gana, la campeona sube). Ver src/engine/torneo.ts.
   */
  torneo: {
    ganadas: Record<string, number>;
    defensas: number;
    /** Bombas ganadas que todavía no se le dieron a una partida. */
    bombas?: number;
    /** Los jefes de la torre ya vencidos (en cualquier partida): se pueden elegir en el torneo. */
    jefes?: Record<string, true>;
  };
  /** Le da a una partida guardada una bomba ganada en el torneo. */
  darBombaAPartida: (slot: number) => void;
  /** Un premio del torneo a PayFoe (lo que pase del tope se pierde). Devuelve lo que entró. */
  premioTorneo: (n: number) => number;
  /** Se ganó una copa (la final contra Nikki): suma la copa y una defensa del título. */
  ganarCopa: (id: string) => void;
  /** Un jefe de la torre vencido: queda para elegir en el torneo. */
  vencerJefe: (clave: string) => void;
  /** Pasa tokens de la partida en curso a PayFoe (nunca al revés). Devuelve cuántos pasaron. */
  transferirAPayfoe: (n: number) => number;
  venderObjeto: (objeto: string, precio: number) => boolean;
  /** Antes de una pelea: guarda solo, si hay un espacio vacío (o el del guardado automático anterior). */
  autoguardarPelea: () => void;
  renameSave: (slot: number, nombre: string) => void;
  load: (slot: number) => void;
  deleteSave: (slot: number) => void;
  /** Pone en ese espacio una partida leída de un archivo (ver engine/partidaArchivo.ts). */
  importarPartida: (slot: number, partida: SaveSlot) => void;
  setMode: (mode: Mode, speed?: Speed) => void;
  /** Borra todo: partidas, desbloqueables, lo leído y las opciones (Opciones › Zona de peligro). */
  resetAll: () => void;
  /** Vuelve a la línea anterior (deshace también las decisiones). */
  back: () => boolean;
  /** Avanza hasta la próxima decisión (o un final). */
  toNextChoice: () => void;
  /** Vuelve a la decisión anterior (deshaciéndola). */
  toPrevChoice: () => void;
  setSettings: (patch: Partial<Settings>) => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      /** Avanza a la escena siguiente. Una escena con minijuego solo avanza cuando se resuelve. */
      function advanceFrom(solved: boolean, patch?: Vars) {
        const { game: actual } = get();
        const game = actual && patch ? { ...actual, vars: conGanados(actual.vars, { ...actual.vars, ...patch }) } : actual;
        if (!game) return;
        // En una pantalla de final o de fin de capítulo se sale con sus botones, no avanzando
        // (un doble clic en la última línea se saltaba la pantalla del final).
        if (game.finished) return;
        const scene = scenes.get(game.sceneId);
        if (!scene || visibleChoices(scene, conSecretos(game.vars)).length > 0) return;
        if ((scene.minijuego || scene.nivel || scene.batalla) && !solved) {
          if (get().mode !== 'normal') set({ mode: 'normal' });
          return;
        }
        markRead(scene.scene_id);
        if (scene.ending) {
          set({ game: { ...game, finished: scene.ending }, mode: 'normal' });
          return;
        }
        if (scene.fin_capitulo && scene.next === null) {
          set({ game: { ...game, finished: `${CHAPTER_END}${scene.fin_capitulo}` }, mode: 'normal' });
          return;
        }
        const next = resolveNext(scene.next, conSecretos(game.vars));
        if (!next) {
          set({ error: `La escena ${scene.scene_id} no tiene continuación`, mode: 'normal' });
          return;
        }
        goTo(next, game.vars, game.history, stepFrom(game));
      }

      /** Entra en una escena y registra lectura, historial, instantánea y final. */
      function goTo(id: string, vars: Vars, history: HistoryEntry[], trail: TrailStep[] = []) {
        const { scene, error } = enterScene(id, vars, (s) => scenes.get(s));
        if (!scene) {
          set({ error: error ?? 'Error desconocido', mode: 'normal' });
          return;
        }
        let nextVars = alEntrar(scene, vars);
        // La música vigente viaja en las variables, así suena bien al cargar o saltar desde el mapa.
        if (scene.audio) nextVars = { ...nextVars, _musica: scene.audio };
        const patch: Partial<Store> = {};
        if (scene.ending) {
          nextVars = { ...nextVars, final_alcanzado: scene.ending };
          if (!get().endingsSeen[scene.ending]) {
            patch.endingsSeen = { ...get().endingsSeen, [scene.ending]: new Date().toISOString() };
          }
        }
        if (!get().snapshots[scene.scene_id]) {
          patch.snapshots = { ...get().snapshots, [scene.scene_id]: vars };
        }
        const nextHistory = scene.dialogue
          ? [...history, { speaker: scene.dialogue.speaker, text: scene.dialogue.text, sid: scene.scene_id }].slice(-HISTORY_LIMIT)
          : history;
        set({
          ...patch,
          error: null,
          textDone: !scene.dialogue,
          game: { sceneId: scene.scene_id, vars: nextVars, history: nextHistory, trail, finished: null },
        });
      }

      /** El paso actual, para poder volver a él. */
      function stepFrom(game: GameState): TrailStep[] {
        const step = { sceneId: game.sceneId, vars: game.vars, historyLen: game.history.length };
        return [...(game.trail ?? []), step].slice(-TRAIL_LIMIT);
      }

      function markRead(id: string) {
        if (!get().readScenes[id]) set({ readScenes: { ...get().readScenes, [id]: true } });
      }

      return {
        settings: DEFAULT_SETTINGS,
        game: null,
        saves: Array(SAVE_SLOTS).fill(null),
        readScenes: {},
        snapshots: {},
        endingsSeen: {},
        cgSeen: {},
        secretosVistos: {},
        rpgVistos: {},
        galleryOpened: {},
        boringramLikes: {},
        boringramComments: {},
        boringramAjustes: AJUSTES_INICIALES,
        boringramHoras: {},
        bootcampHechas: {},
        bootcampNombre: '',
        bootcampDiplomas: {},
        bootcampAvisos: {},
        bootcampCalificacion: 0,
        bootcampResena: null,
        choicesTaken: {},
        juegoCompleto: false,
        cap01Completo: false,
        mode: 'normal',
        speed: 2,
        error: null,
        textDone: false,

        newGame: (start) => goTo(start && scenes.has(start) ? start : config.inicio, { ...variables, partida_id: nuevoIdPartida() }, []),

        next: () => {
          if (get().textDone) get().advance();
          else set({ textDone: true });
        },

        setTextDone: (done) => set({ textDone: done }),

        markCg: (id) => {
          if (!get().cgSeen[id]) set({ cgSeen: { ...get().cgSeen, [id]: true } });
        },

        marcarSecreto: (id) => {
          if (!get().secretosVistos[id]) set({ secretosVistos: { ...get().secretosVistos, [id]: true } });
        },

        marcarRpg: (ids) => {
          const nuevos = ids.filter((id) => !get().rpgVistos[id]);
          if (nuevos.length) set({ rpgVistos: { ...get().rpgVistos, ...Object.fromEntries(nuevos.map((id) => [id, true as const])) } });
        },

        setBoringramLike: (id, liked) => set({ boringramLikes: { ...get().boringramLikes, [id]: liked } }),
        removeBoringramComment: (id, index) =>
          set({
            boringramComments: {
              ...get().boringramComments,
              [id]: (get().boringramComments[id] ?? []).filter((_, i) => i !== index),
            },
          }),
        addBoringramComment: (id, text) =>
          set({ boringramComments: { ...get().boringramComments, [id]: [...(get().boringramComments[id] ?? []), text] } }),

        setBoringramAjustes: (patch) => set({ boringramAjustes: { ...get().boringramAjustes, ...patch } }),
        setBootcampNombre: (nombre) => set({ bootcampNombre: nombre.trim() }),
        avisarBootcamp: (nivel) => set({ bootcampAvisos: { ...get().bootcampAvisos, [nivel]: true } }),
        calificarBootcamp: (estrellas) => set({ bootcampCalificacion: estrellas }),
        marcarJuegoCompleto: () => {
          if (!get().juegoCompleto) set({ juegoCompleto: true });
        },
        marcarCap01Completo: () => {
          if (!get().cap01Completo) set({ cap01Completo: true });
        },
        resenarBootcamp: (texto) =>
          set({ bootcampResena: texto?.trim() ? { texto: texto.trim(), fecha: new Date().toISOString() } : null }),
        emitirDiploma: (nivel, codigo) => {
          if (get().bootcampDiplomas[nivel]) return;
          set({ bootcampDiplomas: { ...get().bootcampDiplomas, [nivel]: { codigo, fecha: new Date().toISOString() } } });
        },
        markBootcamp: (id, valor = 1) => {
          if ((get().bootcampHechas[id] ?? 0) < valor) set({ bootcampHechas: { ...get().bootcampHechas, [id]: valor } });
        },
        markBoringramEvento: (key, minutos) => {
          if (get().galleryOpened[key]) return;
          set({
            galleryOpened: { ...get().galleryOpened, [key]: true },
            boringramHoras: { ...get().boringramHoras, [key]: minutos },
          });
        },

        markGalleryOpened: (key) => {
          if (!get().galleryOpened[key]) set({ galleryOpened: { ...get().galleryOpened, [key]: true } });
        },

        advance: () => advanceFrom(false),

        solveMinigame: (vars) => advanceFrom(true, vars),

        exitMinigame: () => {
          const { game } = get();
          const scene = game && scenes.get(game.sceneId);
          if (!game || !scene?.minijuego_salida) return;
          markRead(scene.scene_id);
          goTo(scene.minijuego_salida, game.vars, game.history, stepFrom(game));
        },

        salirPorToques: () => {
          const { game } = get();
          const scene = game && scenes.get(game.sceneId);
          if (!game || !scene?.toques_salida) return;
          markRead(scene.scene_id);
          goTo(scene.toques_salida, { ...game.vars, ...scene.toques_set }, game.history, stepFrom(game));
        },

        loseLevel: () => {
          const { game } = get();
          const scene = game && scenes.get(game.sceneId);
          const derrota = scene?.nivel_derrota ?? scene?.batalla_derrota;
          if (!game || !scene || !derrota) return;
          markRead(scene.scene_id);
          goTo(derrota, game.vars, game.history, stepFrom(game));
        },

        seguirCapitulo: (sceneId) => {
          const { game } = get();
          if (!game || !scenes.has(sceneId)) return;
          goTo(sceneId, game.vars, game.history, stepFrom(game));
        },

        musicaBatalla: null,
        setMusicaBatalla: (m) => set({ musicaBatalla: m }),

        perdonarBatalla: (vars) => {
          const { game } = get();
          const scene = game && scenes.get(game.sceneId);
          if (!game || !scene?.batalla_perdon) return;
          markRead(scene.scene_id);
          goTo(scene.batalla_perdon, conGanados(game.vars, { ...game.vars, ...vars }), game.history, stepFrom(game));
        },

        toNextChoice: () => {
          for (let i = 0; i < 5000; i++) {
            const g = get().game;
            const scene = g && scenes.get(g.sceneId);
            if (!g || !scene || g.finished || get().error || scene.minijuego || scene.nivel || scene.batalla || visibleChoices(scene, conSecretos(g.vars)).length > 0)
              break;
            get().advance();
          }
          set({ mode: 'normal', textDone: true });
        },

        toPrevChoice: () => {
          const atChoice = () => {
            const g = get().game;
            const scene = g && scenes.get(g.sceneId);
            return !!(g && scene && visibleChoices(scene, conSecretos(g.vars)).length > 0);
          };
          if (!get().back()) return;
          while (!atChoice() && get().back()) {
            // Sigue volviendo hasta llegar a una escena con decisión (o al comienzo del recorrido).
          }
          set({ mode: 'normal', textDone: true });
        },

        back: () => {
          const { game } = get();
          const trail = game?.trail ?? [];
          if (!game || game.finished || trail.length === 0) return false;
          const prev = trail[trail.length - 1];
          set({
            error: null,
            textDone: true,
            game: {
              sceneId: prev.sceneId,
              vars: prev.vars,
              history: game.history.slice(0, prev.historyLen),
              trail: trail.slice(0, -1),
              finished: null,
            },
          });
          return true;
        },

        choose: (index) => {
          const { game } = get();
          if (!game) return;
          const scene = scenes.get(game.sceneId);
          const choice = scene && visibleChoices(scene, conSecretos(game.vars))[index];
          if (!scene || !choice || choice.locked) return;
          markRead(scene.scene_id);
          const ci = scene.choices.indexOf(choice);
          const key = `${scene.scene_id}#${ci}`;
          if (!get().choicesTaken[key]) set({ choicesTaken: { ...get().choicesTaken, [key]: true } });
          goTo(
            choice.next,
            applyChoice(choice, game.vars),
            [...game.history, { speaker: null, text: choice.text, choice: true, sid: scene.scene_id, ci }],
            stepFrom(game),
          );
          if (get().mode !== 'normal' && get().mode !== 'auto') set({ mode: 'normal' });
        },

        jumpTo: (sceneId) => {
          const vars = get().snapshots[sceneId];
          if (vars) goTo(sceneId, vars, []);
        },

        quitToTitle: () => set({ game: null, mode: 'normal', error: null }),

        save: (slot, nombre) => {
          const { game, saves } = get();
          if (!game || !canSaveGame(game)) return;
          const text = game.finished
            ? `Fin del capítulo ${game.finished.slice(CHAPTER_END.length)}`
            : scenes.get(game.sceneId)?.dialogue?.text ?? game.sceneId;
          const next = [...saves];
          next[slot] = {
            sceneId: game.sceneId,
            vars: game.vars,
            history: game.history,
            date: new Date().toISOString(),
            preview: text.slice(0, 80),
            finished: game.finished,
            ...(nombre?.trim() ? { nombre: nombre.trim() } : {}),
          };
          set({ saves: next });
        },

        autoguardarPelea: () => {
          // Antes de una pelea, si hay lugar: en el espacio del guardado automático anterior o en el primero vacío.
          // Si todos los espacios son del jugador, no se pisa ninguno.
          const { saves } = get();
          const slot = saves.findIndex((x) => x?.auto) >= 0 ? saves.findIndex((x) => x?.auto) : saves.findIndex((x) => !x);
          if (slot < 0) return;
          get().save(slot, AUTO_NOMBRE);
          set({ saves: get().saves.map((x, i) => (i === slot && x ? { ...x, auto: true } : x)) });
        },

        slotCompra: null,
        setSlotCompra: (slot) => set({ slotCompra: slot }),
        conVarsTienda: (cambio) => {
          const { game, saves, slotCompra } = get();
          if (game) {
            const vars = cambio(game.vars);
            if (!vars) return false;
            set({ game: { ...game, vars } });
            return true;
          }
          const slot = partidaParaComprar(saves, slotCompra);
          const partida = slot >= 0 ? saves[slot] : null;
          const vars = partida && cambio(partida.vars);
          if (!partida || !vars) return false;
          set({ saves: saves.map((x, i) => (i === slot ? { ...partida, vars } : x)) });
          return true;
        },
        comprarObjeto: (objeto, precio, stockVar) =>
          get().conVarsTienda((v) => {
            const monedas = (v.monedas as number) ?? 0;
            if (monedas < precio) return null;
            const k = `mochila_${objeto}`;
            const nuevas: Vars = { ...v, monedas: monedas - precio, [k]: ((v[k] as number) ?? 0) + 1 };
            if (stockVar) nuevas[stockVar] = ((v[stockVar] as number) ?? 0) + 1;
            return nuevas;
          }),
        venderObjeto: (objeto, precio) =>
          get().conVarsTienda((v) => {
            const k = `mochila_${objeto}`;
            if (!((v[k] as number) > 0)) return null;
            return conGanados(v, { ...v, monedas: ((v.monedas as number) ?? 0) + precio, [k]: (v[k] as number) - 1 });
          }),

        equipar: (heroe, tipo, nombres) => {
          const { game } = get();
          if (!game) return;
          set({ game: { ...game, vars: { ...game.vars, [`${tipo}_${heroe}`]: escribirEquipo(nombres) } } });
        },
        cambiarVars: (cambio) => {
          const { game } = get();
          const vars = game && cambio(game.vars);
          if (!game || !vars) return false;
          set({ game: { ...game, vars } });
          return true;
        },

        comprarCassette: (id, precio) =>
          get().conVarsTienda((v) => {
            const monedas = (v.monedas as number) ?? 0;
            if (monedas < precio) return null;
            const k = `cassette_${id}`;
            return { ...v, monedas: monedas - precio, [k]: ((v[k] as number) ?? 0) + 1 };
          }),
        venderCassette: (id, precio) =>
          get().conVarsTienda((v) => {
            const k = `cassette_${id}`;
            if (!((v[k] as number) > 0)) return null;
            return conGanados(v, { ...v, monedas: ((v.monedas as number) ?? 0) + precio, [k]: (v[k] as number) - 1 });
          }),

        torneo: { ganadas: {}, defensas: 0 },
        premioTorneo: (n) => {
          const r = acreditar(get().payfoe, n);
          set({ payfoe: r.payfoe });
          return n - r.perdido;
        },
        vencerJefe: (clave) => {
          const t = get().torneo;
          if (!t.jefes?.[clave]) set({ torneo: { ...t, jefes: { ...t.jefes, [clave]: true } } });
        },
        ganarCopa: (id) => {
          const t = get().torneo;
          set({ torneo: { ...t, ganadas: { ...t.ganadas, [id]: (t.ganadas[id] ?? 0) + 1 }, defensas: t.defensas + 1, bombas: (t.bombas ?? 0) + (ganaBomba(t.ganadas, id) ? 1 : 0) } });
        },
        darBombaAPartida: (slot) => {
          const { saves, torneo } = get();
          const partida = saves[slot];
          if (!partida || !torneo.bombas) return;
          set({ saves: saves.map((x, i) => (i === slot ? conBomba(partida) : x)), torneo: { ...torneo, bombas: torneo.bombas - 1 } });
        },

        payfoe: PAYFOE_INICIAL,
        transferirAPayfoe: (n) => {
          const { game, payfoe } = get();
          if (!game) return 0;
          const r = transferir(game.vars, payfoe, n);
          if (r.transferido > 0 || r.vars.partida_id !== game.vars.partida_id) set({ game: { ...game, vars: r.vars }, payfoe: r.payfoe });
          return r.transferido;
        },

        renameSave: (slot, nombre) => {
          const old = get().saves[slot];
          if (!old) return;
          const next = [...get().saves];
          const { nombre: _, ...rest } = old;
          next[slot] = nombre.trim() ? { ...rest, nombre: nombre.trim() } : rest;
          set({ saves: next });
        },

        load: (slot) => {
          const data = get().saves[slot];
          if (!data) return;
          if (!scenes.has(data.sceneId)) {
            set({ error: `La partida apunta a una escena que ya no existe: ${data.sceneId}` });
            return;
          }
          // Variables nuevas declaradas después de guardar toman su valor por defecto.
          set({
            error: null,
            mode: 'normal',
            textDone: false,
            game: { sceneId: data.sceneId, vars: { ...variables, ...data.vars }, history: data.history, finished: data.finished ?? null },
          });
        },

        importarPartida: (slot, partida) => set({ saves: get().saves.map((x, i) => (i === slot ? partida : x)) }),

        deleteSave: (slot) => {
          const next = [...get().saves];
          next[slot] = null;
          set({ saves: next });
        },

        setMode: (mode, speed) => set(speed ? { mode, speed } : { mode }),

        resetAll: () =>
          set({
            settings: DEFAULT_SETTINGS,
            game: null,
            saves: Array(SAVE_SLOTS).fill(null),
            readScenes: {},
            snapshots: {},
            endingsSeen: {},
            cgSeen: {},
        secretosVistos: {},
        rpgVistos: {},
            galleryOpened: {},
            boringramLikes: {},
            boringramComments: {},
            boringramAjustes: AJUSTES_INICIALES,
            boringramHoras: {},
            bootcampHechas: {},
            bootcampNombre: '',
            bootcampDiplomas: {},
            bootcampAvisos: {},
            bootcampCalificacion: 0,
            bootcampResena: null,
            payfoe: PAYFOE_INICIAL,
            torneo: { ganadas: {}, defensas: 0 },
            choicesTaken: {},
            juegoCompleto: false,
        cap01Completo: false,
            mode: 'normal',
            error: null,
            textDone: false,
          }),
        setSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      };
    },
    {
      name: 'genesis-vn',
      version: 1,
      // Las opciones guardadas antes de agregar una opción nueva toman su valor por defecto.
      // El guardado seguro (src/engine/guardado.ts): nunca lanza errores y se recupera de un guardado corrupto.
      storage: createJSONStorage(() => almacenSeguro),
      merge: (persisted, current) => {
        // Lo cargado, limpio: lo que no tiene la forma esperada vuelve a su valor por defecto.
        const p = sanear(persisted, current as unknown as Record<string, unknown>, SAVE_SLOTS) as Partial<Store>;
        // El juego siempre abre en el título: la partida en curso no se restaura (se sigue con «Continuar»,
        // que carga el último guardado). Las versiones anteriores sí la guardaban: se ignora.
        return { ...current, ...p, game: null, settings: { ...current.settings, ...p.settings } };
      },
      partialize: (s) => ({
        settings: s.settings,
        saves: s.saves,
        readScenes: s.readScenes,
        snapshots: s.snapshots,
        endingsSeen: s.endingsSeen,
        cgSeen: s.cgSeen,
        secretosVistos: s.secretosVistos,
        rpgVistos: s.rpgVistos,
        galleryOpened: s.galleryOpened,
        boringramLikes: s.boringramLikes,
        boringramComments: s.boringramComments,
        boringramAjustes: s.boringramAjustes,
        boringramHoras: s.boringramHoras,
        bootcampHechas: s.bootcampHechas,
        bootcampNombre: s.bootcampNombre,
        bootcampDiplomas: s.bootcampDiplomas,
        bootcampAvisos: s.bootcampAvisos,
        bootcampCalificacion: s.bootcampCalificacion,
        bootcampResena: s.bootcampResena,
        payfoe: s.payfoe,
        torneo: s.torneo,
        choicesTaken: s.choicesTaken,
        juegoCompleto: s.juegoCompleto,
        cap01Completo: s.cap01Completo,
      }),
    },
  ),
);

// Solo en desarrollo (npm run dev y las pruebas en navegador, tests/e2e): las pruebas recorren la historia moviendo el
// estado del juego (avanzar, elegir, ganar o perder una pelea) sin jugar cada pelea. En lo publicado no existe.
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __genesis?: typeof useStore }).__genesis = useStore;
