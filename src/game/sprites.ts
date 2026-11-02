// Sprites de 8 bits del nivel de acción, dibujados píxel por píxel en un canvas (placeholders hasta la fase de
// arte). Cada textura es una tira de cuadros del mismo tamaño, mirando a la derecha; el juego los voltea.
import type Phaser from 'phaser';

type Ctx = CanvasRenderingContext2D;
const px = (c: Ctx, color: string, x: number, y: number, w = 1, h = 1) => {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
};

/** Crea una tira de `n` cuadros de w×h y dibuja cada uno con `draw(ctx, x0, i)`. */
function tira(scene: Phaser.Scene, key: string, w: number, h: number, n: number, draw: (c: Ctx, x0: number, i: number) => void) {
  const tex = scene.textures.createCanvas(key, w * n, h)!;
  const c = tex.context;
  c.imageSmoothingEnabled = false;
  for (let i = 0; i < n; i++) {
    draw(c, i * w, i);
    tex.add(i, 0, i * w, 0, w, h);
  }
  tex.refresh();
}

/** Azar con semilla: el mismo dibujo en cada partida. */
function azar(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Paleta.
const J = { pelo: '#14121a', peloBrillo: '#2e2a3c', piel: '#c68a58', pielSombra: '#9c6840', lentes: '#d8b24c', vidrio: '#a8dcff', camisa: '#1c1b24', estampado: '#7c5ccc', pantalon: '#cdb88c', pantalonSombra: '#a08c62', zapato: '#25252b' };
const C = { pelo: '#f4d77a', peloSombra: '#cfa443', piel: '#f2c9a2', traje: '#2f63d6', trajeBrillo: '#5e8ff2', trajeSombra: '#1d3c93', venda: '#f1f1f1', blaster: '#9aa3b5', blasterSombra: '#5b6273', luz: '#7ef0ff' };
const S = { armadura: '#14151b', brillo: '#2b2e3b', borde: '#3d4254', mascara: '#dfe2ea', mascaraSombra: '#a7acba', rifle: '#4f5564', punta: '#ff4d6d' };

/** Frames de Jair: 0-1 quieto, 2-5 caminar, 6 salto, 7-8 puñetazo, 9 pisotón. */
export const JAIR = { quieto: [0, 1], caminar: [2, 3, 4, 5], salto: 6, golpe: [7, 8], pisoton: 9 };
export const CAMI = { quieto: [0, 1], caminar: [2, 3, 4, 5], salto: 6, apuntar: 7, disparo: 8 };

/** Jair: pelo rizado, lentes, camisa negra estampada y pantalón beige (1,65 m). */
function dibujarJair(c: Ctx, o: number, i: number) {
  // Piernas: [x izquierda, alto, x derecha, alto] según el cuadro.
  const piernas: Record<number, [number, number, number, number]> = {
    0: [13, 10, 17, 10], 1: [13, 10, 17, 10],
    2: [12, 10, 18, 9], 3: [13, 9, 17, 10], 4: [14, 10, 16, 9], 5: [13, 10, 17, 9],
    6: [13, 7, 17, 7], 7: [12, 10, 18, 10], 8: [12, 10, 18, 10], 9: [14, 12, 16, 12],
  };
  const [lx, lh, rx, rh] = piernas[i];
  const b = i === 1 ? 1 : 0; // respiración
  const pie = 37;
  const pierna = (x: number, alto: number) => {
    px(c, J.pantalon, o + x, pie - alto - 2, 2, alto);
    px(c, J.pantalonSombra, o + x, pie - alto - 2, 1, alto);
    px(c, J.zapato, o + x, pie - 2, 3, 2);
  };
  pierna(lx, lh);
  pierna(rx, rh);
  // Pisotón: las piernas juntas, estiradas hacia abajo, con una estela.
  if (i === 9) {
    px(c, '#ffffff', o + 13, pie, 6, 1);
    px(c, '#c9ccd6', o + 12, pie - 14, 1, 6);
    px(c, '#c9ccd6', o + 20, pie - 14, 1, 6);
  }
  // Brazo de atrás (se balancea al caminar).
  const t = 16 + b;
  const vaiven = i >= 2 && i <= 5 ? [0, 1, 0, -1][i - 2] : 0;
  px(c, J.camisa, o + 10, t + 1, 2, 3);
  px(c, J.piel, o + 10 + vaiven, t + 4, 2, 4);
  // Torso: camisa negra estampada.
  px(c, J.camisa, o + 12, t, 8, 11 - b);
  px(c, J.estampado, o + 14, t + 2);
  px(c, J.estampado, o + 17, t + 4);
  px(c, J.estampado, o + 15, t + 7);
  px(c, J.estampado, o + 18, t + 1);
  px(c, J.piel, o + 15, t - 1, 2, 1);
  // Cabeza: piel, pelo rizado y los lentes.
  const h = 7 + b;
  px(c, J.piel, o + 13, h, 7, 8);
  px(c, J.pielSombra, o + 13, h + 6, 2, 2);
  px(c, J.pelo, o + 12, h - 3, 9, 4);
  px(c, J.pelo, o + 12, h + 1, 1, 4);
  for (const x of [12, 14, 16, 18, 20]) px(c, J.pelo, o + x, h - 4);
  px(c, J.peloBrillo, o + 15, h - 2, 2, 1);
  px(c, J.lentes, o + 15, h + 3, 6, 1);
  px(c, J.vidrio, o + 16, h + 4, 1, 1);
  px(c, J.vidrio, o + 19, h + 4, 1, 1);
  px(c, J.lentes, o + 15, h + 4);
  px(c, J.lentes, o + 18, h + 4);
  // Brazo de adelante: quieto, a medio golpe o con el puño estirado.
  if (i === 7 || i === 8) {
    const largo = i === 7 ? 5 : 9;
    px(c, J.camisa, o + 20, t + 2, 3, 3);
    px(c, J.piel, o + 22, t + 3, largo, 2);
    px(c, J.piel, o + 22 + largo, t + 2, 3, 4);
    px(c, J.pielSombra, o + 24 + largo, t + 2, 1, 4);
    if (i === 8) px(c, '#fff4c2', o + 26 + largo, t + 1, 1, 6);
  } else {
    px(c, J.camisa, o + 20, t + 1, 2, 4);
    px(c, J.piel, o + 20 - vaiven, t + 5, 2, 4);
  }
}

/** Frames del soldado: 0-3 caminar, 4 apuntar (la punta se carga), 5 disparo. */
export const SOLDADO = { caminar: [0, 1, 2, 3], apuntar: 4, disparo: 5 };

/** Soldado enmascarado: armadura negra, máscara lisa sin rostro y un arma larga y delgada. */
function dibujarSoldado(c: Ctx, o: number, i: number) {
  const pasos: [number, number][] = [[12, 17], [13, 16], [12, 17], [11, 18], [12, 17], [12, 17]];
  const [l, r] = pasos[i];
  const lift = i === 1 || i === 3 ? 1 : 0;
  // Piernas y botas.
  px(c, S.armadura, o + l, 28, 3, 13 - lift);
  px(c, S.armadura, o + r, 28, 3, 13);
  px(c, S.brillo, o + l, 28, 1, 12 - lift);
  px(c, '#08080b', o + l, 41 - lift, 4, 2);
  px(c, '#08080b', o + r, 41, 4, 2);
  // Torso con hombreras.
  px(c, S.armadura, o + 11, 14, 10, 15);
  px(c, S.brillo, o + 12, 15, 1, 12);
  px(c, S.borde, o + 11, 21, 10, 1);
  px(c, S.armadura, o + 9, 14, 3, 4);
  px(c, S.armadura, o + 20, 14, 3, 4);
  px(c, S.borde, o + 9, 14, 3, 1);
  px(c, S.borde, o + 20, 14, 3, 1);
  // Casco y máscara lisa (sin ojos, sin boca).
  px(c, S.armadura, o + 12, 3, 9, 11);
  px(c, S.borde, o + 12, 3, 9, 1);
  px(c, S.mascara, o + 15, 5, 6, 7);
  px(c, S.mascaraSombra, o + 15, 10, 6, 2);
  px(c, S.mascaraSombra, o + 15, 5, 1, 7);
  // Brazos y el arma, larga y delgada.
  px(c, S.armadura, o + 17, 18, 5, 3);
  px(c, S.rifle, o + 15, 19, 16, 2);
  px(c, S.borde, o + 15, 19, 16, 1);
  px(c, S.armadura, o + 13, 20, 4, 3);
  if (i === 4) px(c, S.punta, o + 30, 19, 2, 2);
  if (i === 5) {
    px(c, S.punta, o + 30, 18, 2, 4);
    px(c, '#ffd0da', o + 31, 19, 1, 2);
  }
}

/** Frames del monstruo: 0-2 quieto, 3 carga el brazo, 4 barrido, 5 escupe, 6-7 hundirse. */
export const MONSTRUO = { quieto: [0, 1, 2], carga: 3, barrido: 4, escupe: 5, hundirse: [6, 7] };

/** Monstruo de sombras: tinta derramada que decidió tener hambre, con un hueco por cara. */
function dibujarMonstruo(c: Ctx, o: number, i: number) {
  const r = azar(7 + i * 31);
  const tinta = '#0b0910';
  const brillo = '#2b1e46';
  const reflejo = '#55418a';
  // Altura del cuerpo según el cuadro (al hundirse, se achica).
  const alto = i === 6 ? 30 : i === 7 ? 10 : 50;
  const base = 63;
  // Charco.
  for (let x = 4; x < 76; x++) {
    const d = Math.abs(x - 40) / 36;
    const hh = Math.max(1, Math.round((1 - d * d) * 5 + r() * 2));
    px(c, tinta, o + x, base - hh, 1, hh + 1);
  }
  // Cuerpo: una columna que se angosta hacia arriba, con bordes temblorosos.
  for (let y = 0; y < alto; y++) {
    const yy = base - 4 - y;
    const ancho = Math.round(16 + 9 * Math.sin((y / alto) * Math.PI * 0.85) + r() * 3);
    px(c, tinta, o + 40 - ancho / 2, yy, ancho, 1);
    if (r() < 0.25) px(c, brillo, o + 40 - ancho / 2 + 1, yy, 2, 1);
  }
  if (alto > 20) {
    const cara = base - 4 - alto + 12;
    // El hueco por cara, con un brillo de módem adentro.
    px(c, '#000000', o + 34, cara, 12, 10);
    px(c, '#000000', o + 36, cara - 1, 8, 12);
    px(c, '#3b2b6a', o + 35, cara + 1, 1, 8);
    px(c, '#3b2b6a', o + 44, cara + 1, 1, 8);
    for (let k = 0; k < 4; k++) px(c, '#8d7be0', o + 37 + Math.floor(r() * 6), cara + 2 + Math.floor(r() * 6));
    if (i === 5) px(c, '#b9a8ff', o + 38, cara + 4, 4, 3);
    // Reflejos violetas sobre la tinta.
    for (let k = 0; k < 6; k++) px(c, reflejo, o + 32 + Math.floor(r() * 16), cara + 12 + Math.floor(r() * 26));
    // Gotas que caen.
    for (let k = 0; k < 3; k++) px(c, tinta, o + 30 + Math.floor(r() * 20), cara + 14 + Math.floor(r() * 20), 1, 3);
    // Brazos: recogido (carga) o estirado (barrido).
    if (i === 3) {
      px(c, tinta, o + 22, cara + 2, 10, 4);
      px(c, tinta, o + 18, cara - 6, 5, 10);
      px(c, brillo, o + 19, cara - 5, 1, 6);
    } else if (i === 4) {
      px(c, tinta, o + 46, cara + 18, 34, 5);
      px(c, brillo, o + 50, cara + 18, 26, 1);
      px(c, tinta, o + 74, cara + 15, 6, 10);
    } else {
      px(c, tinta, o + 48, cara + 16, 6, 14);
      px(c, tinta, o + 26, cara + 16, 6, 14);
    }
  }
}

/** Todas las texturas del nivel. */
export function crearTexturas(scene: Phaser.Scene) {
  tira(scene, 'jair', 32, 40, 10, dibujarJair);
  // La lata de «AGUA» (como la de la máquina expendedora): devuelve una vida.
  tira(scene, 'lata', 8, 10, 1, (c) => {
    px(c, '#8fa3b8', 1, 0, 6, 1);
    px(c, '#4f9ad8', 0, 1, 8, 8);
    px(c, '#9fd1ff', 1, 2, 1, 6);
    px(c, '#ffffff', 2, 4, 4, 2);
    px(c, '#8fa3b8', 1, 9, 6, 1);
  });
  tira(scene, 'soldado', 32, 44, 6, dibujarSoldado);
  tira(scene, 'monstruo', 80, 64, 8, dibujarMonstruo);

  // Proyectiles y partículas.
  tira(scene, 'bala_azul', 8, 4, 1, (c) => {
    px(c, C.luz, 0, 1, 8, 2);
    px(c, '#ffffff', 4, 1, 4, 2);
    px(c, C.trajeBrillo, 0, 0, 3, 4);
  });
  tira(scene, 'bala_roja', 8, 3, 1, (c) => {
    px(c, S.punta, 0, 0, 8, 3);
    px(c, '#ffd0da', 3, 1, 5, 1);
  });
  tira(scene, 'gota', 8, 8, 1, (c) => {
    px(c, '#0b0910', 2, 0, 4, 8);
    px(c, '#0b0910', 0, 2, 8, 4);
    px(c, '#55418a', 2, 2, 1, 2);
  });
  tira(scene, 'pixel', 2, 2, 1, (c) => px(c, '#ffffff', 0, 0, 2, 2));

  // La carita de Jair para la interfaz (la de Cami sale de su sprite).
  tira(scene, 'cara', 12, 12, 2, (c, o, i) => {
    if (i === 0) {
      px(c, J.piel, o + 2, 3, 8, 8);
      px(c, J.pelo, o + 1, 0, 10, 4);
      px(c, J.lentes, o + 3, 6, 7, 1);
      px(c, J.vidrio, o + 4, 7);
      px(c, J.vidrio, o + 8, 7);
    } else {
      px(c, C.pelo, o + 1, 0, 10, 5);
      px(c, C.pelo, o + 1, 4, 2, 7);
      px(c, C.piel, o + 3, 4, 7, 7);
      px(c, '#2a2a3a', o + 5, 7);
      px(c, '#2a2a3a', o + 8, 7);
    }
  });

  // Flecha hacia abajo: el cartel antes de bajar al nivel dos.
  tira(scene, 'flecha', 16, 20, 1, (c) => {
    px(c, '#1c2230', 3, 0, 10, 12);
    px(c, '#7cf2ff', 6, 2, 4, 8);
    px(c, '#1c2230', 0, 11, 16, 2);
    for (let k = 0; k < 6; k++) px(c, '#7cf2ff', 2 + k, 10 + k, 12 - k * 2, 1);
  });

  // Escenario: piso de piedra blanca, bloques flotantes y el fondo del Bastión.
  tira(scene, 'piso', 16, 16, 1, (c) => {
    px(c, '#c9ccd6', 0, 0, 16, 16);
    px(c, '#eef0f5', 0, 0, 16, 2);
    px(c, '#a9adba', 0, 15, 16, 1);
    px(c, '#a9adba', 7, 2, 1, 13);
    px(c, '#b8bcc8', 2, 6, 3, 1);
    px(c, '#b8bcc8', 10, 10, 4, 1);
  });
  tira(scene, 'piso_hondo', 16, 16, 1, (c) => {
    px(c, '#8b8f9c', 0, 0, 16, 16);
    px(c, '#7a7e8b', 7, 0, 1, 16);
    px(c, '#9a9eaa', 2, 5, 3, 1);
  });
  tira(scene, 'bloque', 48, 12, 1, (c) => {
    px(c, '#d7dae3', 0, 0, 48, 12);
    px(c, '#f4f5f8', 0, 0, 48, 2);
    px(c, '#9ea2af', 0, 10, 48, 2);
    px(c, '#b7bbc7', 15, 2, 1, 8);
    px(c, '#b7bbc7', 32, 2, 1, 8);
    px(c, '#7cf2ff', 22, 5, 4, 1);
  });

  // Fondo lejano: espacio con la nebulosa magenta y estrellas.
  const lejos = scene.textures.createCanvas('fondo_lejos', 480, 270)!;
  {
    const c = lejos.context;
    const g = c.createLinearGradient(0, 0, 0, 270);
    g.addColorStop(0, '#07060d');
    g.addColorStop(1, '#14081a');
    c.fillStyle = g;
    c.fillRect(0, 0, 480, 270);
    const r = azar(3);
    for (const [x, y, rad] of [[120, 80, 90], [330, 60, 110], [420, 150, 70]]) {
      const n = c.createRadialGradient(x, y, 4, x, y, rad);
      n.addColorStop(0, 'rgba(214, 60, 170, 0.45)');
      n.addColorStop(1, 'rgba(214, 60, 170, 0)');
      c.fillStyle = n;
      c.fillRect(0, 0, 480, 270);
    }
    for (let k = 0; k < 140; k++) px(c, r() < 0.15 ? '#ffd6f4' : '#ffffff', Math.floor(r() * 480), Math.floor(r() * 200), 1, 1);
    lejos.refresh();
  }
  // Fondo medio: catedral de piedra blanca con tuberías y paneles de luz, y ventanales al espacio.
  const medio = scene.textures.createCanvas('fondo_medio', 192, 270)!;
  {
    const c = medio.context;
    // Ventanal (transparente) entre dos columnas.
    px(c, 'rgba(20, 16, 30, 0.55)', 0, 0, 192, 270);
    c.clearRect(70, 30, 70, 150);
    px(c, '#3a3e4c', 68, 28, 74, 3);
    px(c, '#3a3e4c', 103, 30, 2, 150);
    // Columnas.
    for (const x of [18, 150]) {
      px(c, '#9ea3b2', x, 0, 26, 270);
      px(c, '#c3c7d2', x + 3, 0, 4, 270);
      px(c, '#7c8191', x + 22, 0, 4, 270);
      for (let y = 20; y < 270; y += 46) px(c, '#8a8fa0', x, y, 26, 2);
    }
    // Tuberías y paneles de luz.
    px(c, '#3b404f', 50, 0, 6, 270);
    px(c, '#525868', 51, 0, 1, 270);
    px(c, '#3b404f', 0, 200, 192, 5);
    for (const y of [60, 120, 170]) {
      px(c, '#1c2230', 54, y, 10, 14);
      px(c, '#7cf2ff', 56, y + 3, 6, 2);
      px(c, '#7cf2ff', 56, y + 8, 3, 2);
    }
    medio.refresh();
  }
}
