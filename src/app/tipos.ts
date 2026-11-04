

// Los tipos que comparten las pantallas principales (ver ../App.tsx).
/** De dónde se llega al título: cambia cómo sale del negro. */
export type Intro = 'advertencia' | 'juego' | null;

export type Overlay =
  | 'history'
  | 'save'
  | 'load'
  | 'map'
  | 'extras'
  | 'endings'
  | 'gallery'
  | 'torneo'
  | 'boringram'
  | 'options'
  | 'about'
  | 'salir'
  | 'bootcamp'
  | 'equipo'
  | null;
