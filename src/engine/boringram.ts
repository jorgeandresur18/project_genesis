// Boringram en Extras: el celular de Jair, que se llena con la historia.
// - Datos en src/data/boringram.json; la versión en inglés (src/data/en/boringram.json) solo trae los textos
//   y se mezcla por posición también dentro de las listas.
// - Cada cosa se desbloquea al visitar su escena de «desbloqueo» (snapshots) y es nueva hasta que se ve
//   en el celular (galleryOpened, con claves «bor:…», igual que la galería).
// - Hora: el celular sigue el mundo real (allá el tiempo corre 45 veces más lento que en el juego). Cada cosa
//   tiene «cuando» («D HH:MM», D = días desde el sábado de la historia) y los «hace» se calculan contra el reloj.
import { escenaPublicada } from './story';
import { useStore } from './store';
import { useLang } from './i18n';
import dataEs from '../data/boringram.json';
import dataEn from '../data/en/boringram.json';

export interface Perfil {
  usuario: string;
  nombre: string;
  foto: string;
  bio: string;
  publicaciones: number;
  seguidores: number;
  seguidos: number;
  te_sigue?: boolean;
  /** Desactivó los comentarios de sus historias. */
  historias_sin_comentarios?: boolean;
  desbloqueo: string | null;
}
export interface Comentario {
  usuario: string;
  texto: string;
}
export interface Publicacion {
  id: string;
  autor: string;
  /** foto, texto (un pensamiento, como en X) o repost (de otra cuenta). */
  tipo: 'foto' | 'texto' | 'repost';
  imagen?: string;
  texto?: string;
  /** Varias fotos, cada una con su texto («imagen» y «texto» son los de la primera). */
  carrusel?: { imagen: string; texto: string }[];
  repost?: { usuario: string; texto: string };
  likes: number;
  /** Jair le dio me gusta. */
  te_gusta?: boolean;
  cuando: string;
  /** Calculado contra el reloj del celular. */
  hace: string;
  comentarios: Comentario[];
  desbloqueo: string | null;
}
export interface Destacada {
  id: string;
  autor: string;
  titulo: string;
  imagen: string;
  texto: string;
  cuando: string;
  hace: string;
  /** Fijada: siempre la primera de su perfil. */
  fijada?: boolean;
  desbloqueo: string | null;
}
export interface Mensaje {
  de: 'ella' | 'yo';
  texto: string;
  cuando: string;
  /** Calculados contra el reloj: la hora y, si cambia respecto del anterior, el día («Hoy», «Ayer», «Hace 5 meses»). */
  dia?: string;
  hora?: string;
  destacado?: boolean;
  pendiente?: boolean;
  desbloqueo: string | null;
}
export interface Chat {
  id: string;
  perfil?: string;
  nombre?: string;
  /** Puede llevar {hace}: cuándo estuvo activa («activo», o si no, su último mensaje). */
  estado: string;
  activo?: string;
  visto?: boolean;
  mensajes: Mensaje[];
}
export interface Notificacion {
  id: string;
  app: string;
  /** Emoji o símbolo; «bori» = el icono de Boringram. */
  icono: string;
  titulo: string;
  texto: string;
  /** Sin «cuando», la de «clave» toma la hora en que el jugador la desbloqueó. */
  cuando?: string;
  hace: string;
  /** La alarma: hasta cuándo falta ({falta} en el texto); después, «texto_pasada». */
  hasta?: string;
  texto_pasada?: string;
  /** Solo se muestra con la batería baja (15 % o menos). */
  solo_bateria_baja?: boolean;
  /** Se desbloquea con algo que hace el jugador (clave en galleryOpened), no con una escena. */
  clave?: string;
  desbloqueo: string | null;
}
export interface Estado {
  desbloqueo: string | null;
  cuando: string;
  /** Sin batería, sigue la del estado anterior. */
  bateria?: number;
  /** Modo de ahorro de energía (batería en naranja). */
  ahorro?: boolean;
}
/** Un paso del recorrido: lleva a una pantalla y señala algo (sin objetivo, tarjeta en el centro). */
export interface PasoTutorial {
  /** «inicio» o «perfil:<id>». */
  vista?: string;
  /** data-tour del elemento que se señala. */
  objetivo?: string;
  gesto?: 'toque' | 'doble' | 'abajo';
  titulo: string;
  texto: string;
}
export interface BoringramData {
  yo: string;
  /** Dirección del juego publicado (para compartir). */
  sitio: string;
  /** Se sube al cambiar el diseño de las tarjetas: así las redes no muestran la vista previa vieja. */
  compartir_version?: number;
  sin_senal: { titulo: string; texto: string };
  perfiles: Record<string, Perfil>;
  publicaciones: Publicacion[];
  destacadas: Destacada[];
  chats: Chat[];
  notificaciones: Notificacion[];
  estado: Estado[];
  ajustes_rapidos: string[];
  /** Icono de cada ajuste rápido, por posición (wifi, datos, bluetooth, linterna, no_molestar, avion). */
  ajustes_iconos: string[];
  /** Días de la semana, desde el domingo. */
  dias: string[];
  textos: Record<string, string>;
  /** Recorrido de «Cómo usar» (sale solo la primera vez). */
  tutorial: PasoTutorial[];
}

/** Mezcla profunda: objetos por clave y listas por posición (lo que no se traduce queda en español). */
function merge(a: unknown, b: unknown): unknown {
  if (b === undefined) return a;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x, i) => merge(x, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const out: Record<string, unknown> = { ...(a as Record<string, unknown>) };
    for (const [k, v] of Object.entries(b as Record<string, unknown>)) out[k] = merge(out[k], v);
    return out;
  }
  return b;
}

/** Lo que agregan los capítulos siguientes (src/data/boringram/capNN.json), en orden de capítulo. */
type Extra = Partial<Pick<BoringramData, 'publicaciones' | 'destacadas' | 'notificaciones' | 'estado' | 'chats'>>;
const byName = (g: Record<string, Extra>) =>
  Object.keys(g)
    .sort()
    .map((k) => ({ name: k.split('/').pop()!, data: g[k] }));
const EXTRAS_ES = byName(import.meta.glob<Extra>('../data/boringram/*.json', { eager: true, import: 'default' }));
const EXTRAS_EN = byName(import.meta.glob<Extra>('../data/en/boringram/*.json', { eager: true, import: 'default' }));

/** Suma los extras: lo nuevo arriba en el inicio, los mensajes en su chat y el estado al final. */
function withExtras(base: BoringramData, extras: Extra[]): BoringramData {
  const out: BoringramData = { ...base, chats: base.chats.map((c) => ({ ...c, mensajes: [...c.mensajes] })) };
  for (const x of extras) {
    out.publicaciones = [...(x.publicaciones ?? []), ...out.publicaciones];
    out.destacadas = [...(x.destacadas ?? []), ...out.destacadas];
    out.notificaciones = [...(x.notificaciones ?? []), ...out.notificaciones];
    out.estado = [...out.estado, ...(x.estado ?? [])];
    for (const chat of x.chats ?? []) {
      const own = out.chats.find((c) => c.id === chat.id);
      if (own) own.mensajes.push(...chat.mensajes);
      else out.chats.unshift({ ...chat, mensajes: [...chat.mensajes] });
    }
  }
  return out;
}

const ES = withExtras(
  dataEs as unknown as BoringramData,
  EXTRAS_ES.map((x) => x.data),
);
const EN = withExtras(
  merge(dataEs, dataEn) as BoringramData,
  EXTRAS_ES.map((x) => merge(x.data, EXTRAS_EN.find((y) => y.name === x.name)?.data) as Extra),
);

/** Todas las escenas que desbloquean algo (para la prueba de rutas). */
export const unlockScenes = (): string[] =>
  [...Object.values(ES.perfiles), ...ES.publicaciones, ...ES.destacadas, ...ES.chats.flatMap((c) => c.mensajes), ...ES.notificaciones, ...ES.estado]
    .map((x) => x.desbloqueo)
    .filter((x): x is string => !!x);

export const postKey = (id: string) => `bor:post:${id}`;
export const storyKey = (id: string) => `bor:story:${id}`;
export const chatKey = (id: string, n: number) => `bor:chat:${id}:${n}`;
/** Ya se vio el tutorial (se guarda con lo abierto de la galería; «Borrar todo» lo vuelve a mostrar). */
export const TUTORIAL_KEY = 'bor:tutorial';
/** Prendió la linterna alguna vez (desbloquea su notificación). */
export const LINTERNA_KEY = 'bor:linterna';
/** Prendió No molestar. */
export const NO_MOLESTAR_KEY = 'bor:no_molestar';
/** Salió de Boringram en modo avión y volvió a entrar. */
export const AVION_KEY = 'bor:avion';
/** Salió de Boringram con el wifi o los datos apagados y volvió a entrar (siempre vuelven prendidos). */
export const SIEMPRE_ACTIVOS_KEY = 'bor:siempre_activos';
/** Dio me gusta, comentó o compartió solo con datos (sin wifi). */
export const AHORRA_DATOS_KEY = 'bor:ahorra_datos';
/** Salió de Boringram con la linterna prendida. */
export const LINTERNA_OLVIDADA_KEY = 'bor:linterna_olvidada';

/** «D HH:MM» -> minutos desde el sábado 0:00 de la historia (el viernes es -1). */
export const minutos = (cuando: string) => {
  const [d, hm] = cuando.trim().split(/\s+/);
  const [h, m] = hm.split(':').map(Number);
  return Number(d) * 1440 + h * 60 + m;
};

/** Hora del celular, como en la barra de estado (12 h, sin a. m. ni p. m.). */
const reloj = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60) % 12 || 12}:${String(m % 60).padStart(2, '0')}`;
};

/** «hace…» de Boringram (como en Instagram: segundos, minutos, horas, días, semanas, meses y años). */
function hace(tx: Record<string, string>, diff: number) {
  const n = (one: string, many: string, v: number) => (v === 1 ? tx[one] : tx[many].replace('{n}', String(v)));
  const dias = Math.floor(diff / 1440);
  if (diff < 1) return tx.hace_ahora;
  if (diff < 60) return tx.hace_min.replace('{n}', String(diff));
  if (diff < 1440) return tx.hace_h.replace('{n}', String(Math.floor(diff / 60)));
  if (dias < 7) return n('hace_dia', 'hace_dias', dias);
  if (dias < 60) return n('hace_semana', 'hace_semanas', Math.floor(dias / 7));
  if (dias < 365) return n('hace_mes', 'hace_meses', Math.floor(dias / 30));
  return n('hace_ano', 'hace_anos', Math.floor(dias / 365));
}

/** Lo desbloqueado en la partida guardada, y qué es nuevo. */
export function useBoringram() {
  const data = useLang() === 'en' ? EN : ES;
  const visited = useStore((s) => s.snapshots);
  const opened = useStore((s) => s.galleryOpened);
  const likes = useStore((s) => s.boringramLikes);
  const myComments = useStore((s) => s.boringramComments);
  const horas = useStore((s) => s.boringramHoras);
  const tx = data.textos;
  const open = (x: { desbloqueo: string | null }) => !x.desbloqueo || !!visited[x.desbloqueo];
  // El reloj: la hora más reciente entre los puntos de la historia ya jugados y lo que desbloquearon.
  const reached = [
    ...data.estado,
    ...data.publicaciones,
    ...data.destacadas,
    ...data.notificaciones,
    ...data.chats.flatMap((c) => c.mensajes),
  ].filter(
    (x): x is typeof x & { cuando: string } => !!x.desbloqueo && !!visited[x.desbloqueo] && !!x.cuando,
  );
  const ahora = Math.max(minutos(data.estado[0].cuando), ...reached.map((x) => minutos(x.cuando)));
  // La batería: la del último estado (en el tiempo) que la cambia.
  const bat = data.estado
    .filter((x) => open(x) && x.bateria !== undefined && minutos(x.cuando) <= ahora)
    .sort((a, b) => minutos(a.cuando) - minutos(b.cuando))
    .pop() ?? data.estado[0];
  const estado = {
    reloj: reloj(ahora),
    dia: data.dias[(((Math.floor(ahora / 1440) + 6) % 7) + 7) % 7],
    bateria: bat.bateria ?? 0,
    ahorro: !!bat.ahorro,
  };
  // Lo que todavía no pasó a esta hora no se ve; lo demás, de lo más nuevo a lo más viejo.
  const timed = <T extends { cuando?: string }>(list: T[], at: (x: T) => number = (x) => minutos(x.cuando!)) =>
    list
      .map((x) => ({ x, t: at(x) }))
      .filter((y) => y.t <= ahora)
      .sort((a, b) => b.t - a.t)
      .map(({ x, t }) => ({ ...x, hace: hace(tx, ahora - t) }));
  const perfiles = Object.fromEntries(Object.entries(data.perfiles).filter(([, p]) => open(p)));
  const publicaciones = timed(data.publicaciones.filter((p) => open(p) && perfiles[p.autor]));
  const destacadas = timed(data.destacadas.filter((d) => open(d) && perfiles[d.autor]));
  // Mensajes: la hora de cada uno y el día cuando cambia; los chats, del más reciente al más viejo.
  const today = Math.floor(ahora / 1440);
  const dayLabel = (t: number) => {
    const d = today - Math.floor(t / 1440);
    if (d === 0) return tx.dia_hoy;
    if (d === 1) return tx.dia_ayer;
    const h = hace(tx, d * 1440);
    return h.charAt(0).toUpperCase() + h.slice(1);
  };
  const chats = data.chats
    .map((c) => {
      let prev = '';
      const mensajes = c.mensajes
        .filter((m) => open(m) && minutos(m.cuando) <= ahora)
        // Por fecha: los recuerdos de Noodle suman mensajes de hace años (orden estable si coinciden).
        .sort((x, y) => minutos(x.cuando) - minutos(y.cuando))
        .map((m) => {
          const t = minutos(m.cuando);
          const dia = dayLabel(t);
          const r = ((t % 1440) + 1440) % 1440;
          const out = { ...m, hora: `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`, dia: dia !== prev ? dia : undefined };
          prev = dia;
          return out;
        });
      const suyo = [...mensajes].reverse().find((m) => m.de === 'ella');
      const activo = c.activo && minutos(c.activo) <= ahora ? minutos(c.activo) : suyo ? minutos(suyo.cuando) : ahora;
      return {
        ...c,
        estado: c.estado.replace('{hace}', hace(tx, ahora - activo)),
        mensajes,
        last: mensajes.length ? minutos(mensajes[mensajes.length - 1].cuando) : 0,
      };
    })
    .filter((c) => c.mensajes.length > 0)
    .sort((a, b) => b.last - a.last);
  const notificaciones = timed(
    data.notificaciones
      .filter(open)
      .filter((n) => !n.clave || opened[n.clave])
      .filter((n) => !n.solo_bateria_baja || estado.bateria <= 15),
    (n) => (n.hasta && minutos(n.hasta) <= ahora ? minutos(n.hasta) : n.clave ? (horas[n.clave] ?? ahora) : n.cuando ? minutos(n.cuando) : ahora),
  ).map((n) => {
    const falta = n.hasta ? minutos(n.hasta) - ahora : 0;
    const texto = n.hasta && falta <= 0 ? (n.texto_pasada ?? n.texto) : n.texto;
    return {
      ...n,
      hace: n.hasta && falta > 0 ? tx.alarma_proxima : n.hace,
      titulo: n.titulo.replace('{bateria}', String(estado.bateria)),
      texto: texto
        .replace('{bateria}', String(estado.bateria))
        .replace('{falta}', `${Math.floor(falta / 60)} h ${falta % 60} min`),
    };
  });
  // Me gusta: lo que el jugador tocó manda; si no tocó nada, lo de la historia (te_gusta).
  const liked = (p: Publicacion) => likes[p.id] ?? !!p.te_gusta;
  // Comentarios: los de la historia más los que escribió el jugador.
  const commentsOf = (p: Publicacion) => [
    ...p.comentarios,
    ...(myComments[p.id] ?? []).map((texto) => ({ usuario: data.yo, texto })),
  ];
  const storyLiked = (id: string) => !!likes[`story:${id}`];
  const likeCount = (p: Publicacion) => p.likes - (p.te_gusta ? 1 : 0) + (liked(p) ? 1 : 0);
  const newPosts = new Set(publicaciones.filter((p) => !opened[postKey(p.id)]).map((p) => p.id));
  const newStories = new Set(destacadas.filter((d) => !opened[storyKey(d.id)]).map((d) => d.id));
  // Los chats que Jair dejó en visto ya están leídos: no cuentan como nuevos.
  const newChats = new Set(chats.filter((c) => !c.visto && !opened[chatKey(c.id, c.mensajes.length)]).map((c) => c.id));
  return {
    data,
    unlocked: !!perfiles[data.yo],
    perfiles,
    publicaciones,
    destacadas,
    chats,
    notificaciones,
    estado,
    /** Minutos del reloj (para la hora de lo que desbloquea el jugador). */
    ahora,
    liked,
    likeCount,
    commentsOf,
    myComments,
    storyLiked,
    newPosts,
    newStories,
    newChats,
    hasNew: newPosts.size + newStories.size + newChats.size > 0,
  };
}

/** Para el 100 %: cuánto hay de cada cosa en el celular y cuánto se desbloqueó (sin importar si ya se abrió). */
export function useBoringramProgress() {
  const visited = useStore((s) => s.snapshots);
  const opened = useStore((s) => s.galleryOpened);
  const open = (x: { desbloqueo: string | null; clave?: string }) =>
    (!x.desbloqueo || !!visited[x.desbloqueo]) && (!x.clave || !!opened[x.clave]);
  // Antes de que Jair mire su celular en la historia, no hay nada.
  const on = open(ES.perfiles[ES.yo]);
  // En la demo, solo lo de los capítulos publicados.
  const count = <T extends { desbloqueo: string | null; clave?: string }>(todo: T[]) => {
    const list = todo.filter((x) => escenaPublicada(x.desbloqueo));
    return { got: on ? list.filter(open).length : 0, total: list.length };
  };
  return {
    publicaciones: count(ES.publicaciones.filter((p) => p.tipo !== 'texto')),
    pensamientos: count(ES.publicaciones.filter((p) => p.tipo === 'texto')),
    historias: count(ES.destacadas),
    mensajes: count(ES.chats.flatMap((c) => c.mensajes)),
    notificaciones: count(ES.notificaciones),
  };
}
