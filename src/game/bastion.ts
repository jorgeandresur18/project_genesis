// Nivel de acción del Capítulo 1 (estilo NES, 8 bits): Jair y Cami (con el tobillo vendado, que por orgullo
// no se deja cargar) por los pasillos del Bastión. El que se controla va adelante y el otro lo sigue detrás; al
// cambiar, intercambian lugares. Jair pega a puñetazos y con el pisotón; Cami, con el blaster (corto alcance; si
// dispara mucho se descarga y hay que esperar). Los disparos enemigos le dan al que va adelante. Enemigos: los
// soldados enmascarados; jefe: el monstruo de sombras, que no muere (reaparece más adelante): al bajarle la vida, se
// retira entre las grietas. Perder lleva a un bad end.
// Ideas de diseño (sin copiar código ni arte): de Mega Man, el salto (gravedad firme, se corta al soltar), la barra
// del jefe que se llena antes de pelear, su parpadeo después de cada golpe, tres disparos como máximo en pantalla y
// enemigos que sueltan algo que cura (aquí, latas de «AGUA»); de Shovel Knight, el pisotón en el aire.
// Sprites: Cami, desde las referencias del autor (public/nivel/cami.png, ver tools/nivel_sprites.mjs); Jair, los
// soldados y el monstruo, dibujados en código (src/game/sprites.ts) hasta que haya referencias.
// Los diálogos están en src/data/niveles/bastion.json. La interfaz (inicio, tarjeta del nivel, vida, diálogos
// abajo, pausa y botones táctiles) es de React: src/components/Nivel.tsx; el juego le avisa con onEstado y
// onDialogo.
import Phaser from 'phaser';
import { crearTexturas, JAIR, MONSTRUO, SOLDADO } from './sprites';
import { playChip } from '../engine/sound';

/** Botones virtuales (la pantalla táctil); el teclado se lee aparte. */
export interface Mando {
  izq: boolean;
  der: boolean;
  saltar: boolean;
  atacar: boolean;
  cambiar: boolean;
  /** Abajo: en el aire, con Jair, el pisotón. */
  abajo: boolean;
}
export interface DialogoNivel {
  evento: string;
  quien: string;
  texto: string;
}
export interface DatosNivel {
  titulo: string;
  subtitulo: string;
  /** La tarjeta de entrada, como en los juegos de plataformas: «NIVEL 1-1». */
  tarjeta: { numero: string; nombre: string };
  jugador: { vida: number };
  bateria: { por_disparo: number; recarga_por_segundo: number; espera_recarga: number };
  dialogos: DialogoNivel[];
}
/** Lo que la interfaz muestra (vida, batería, el jefe). */
export interface EstadoNivel {
  vida: number;
  vidaMax: number;
  activo: 'jair' | 'cami';
  bateria: number;
  descargado: boolean;
  jefe: { vida: number; max: number } | null;
}
export interface OpcionesNivel {
  datos: DatosNivel;
  mando: Mando;
  reducirEfectos: boolean;
  onEstado: (e: EstadoNivel) => void;
  /** Una línea de diálogo para la caja de abajo (null: se cierra) y cuánto dura. */
  onDialogo: (linea: DialogoNivel | null, ms: number) => void;
  /** Ya cargó: la carita de Jair (pixel art) para la interfaz. */
  onListo: (caras: { jair: string }) => void;
  onGanar: () => void;
  onPerder: () => void;
}

const W = 480;
const H = 270;
const SUELO = 230;
const MUNDO = 3400;
// Salto como en los juegos de NES: gravedad firme, subida rápida, y se corta al soltar el botón.
const GRAVEDAD = 1400;
const SALTO = 520;
const CORTE_SALTO = -90;
const VELOCIDAD = 128;
// Escala de los sprites dibujados en código, para que queden en proporción con los de Cami (1,56 m ≈ 51 px).
const ESCALA = { jair: 1.7, soldado: 1.55, monstruo: 1.5 };

/** Tramos de piso (los huecos entre ellos son caídas) y bloques flotantes [x, y de arriba]. */
const PISO: [number, number][] = [[0, 900], [990, 1450], [1560, MUNDO]];
const BLOQUES: [number, number][] = [[922, 212], [1080, 196], [1190, 168], [1310, 194], [1478, 214], [1528, 198]];
/** Soldados: dónde aparecen y desde qué x del jugador. `grupo`: se mueven sincronizados, como copias. */
const OLEADAS: { x: number; y?: number; desde: number; grupo?: number; fijo?: boolean; evento?: string }[] = [
  { x: 560, desde: 230, evento: 'primer_soldado' },
  { x: 800, desde: 520, grupo: 1 },
  { x: 846, desde: 520, grupo: 1 },
  { x: 1214, y: 168, desde: 960, fijo: true },
  { x: 1400, desde: 1160 },
  { x: 2440, desde: 2260, grupo: 2 },
  { x: 2500, desde: 2260, grupo: 2 },
];
/** La sala donde se cierran las cámaras: cinco soldados copiados, de a dos. Si algo falla, se abre sola. */
const ARENA = { x: 1700, desde: 1730, olas: [[2150, 2112], [1730, 1768], [2150]], maxMs: 60000 };
/** La arena del jefe. */
const JEFE = { x: 2700, desde: 2760, aparece: 3060, vida: 40 };
/** Disparos de Cami: como mucho tres en pantalla; corto alcance. */
const MAX_DISPAROS = 3;
const ALCANCE_MS = 380;
/** Probabilidad de que un soldado suelte una lata de agua (el último antes del jefe la suelta siempre). */
const PROB_LATA = 0.3;

/** Cuadros de la tira de Cami (public/nivel/cami.png). */
const CAMI = { quieta: 0, corre: 1, apunta: 2, dispara: 3 };

interface Soldado {
  spr: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  vida: number;
  fijo: boolean;
  grupo?: number;
  proxDisparo: number;
  apuntaHasta: number;
  aturdidoHasta: number;
  empujeListo: number;
}

type EstadoJefe = 'oculto' | 'emerge' | 'quieto' | 'carga' | 'barrido' | 'escupe' | 'hundido' | 'surge' | 'huye' | 'fuera';
type Quien = 'jair' | 'cami';

export class BastionScene extends Phaser.Scene {
  private o: OpcionesNivel;
  private jugador!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  /** El que no se controla: sigue al otro por el mismo camino, un poco atrás. */
  private acompanante!: Phaser.GameObjects.Sprite;
  private rastro: { x: number; pie: number; suelo: boolean }[] = [];
  private suelo!: Phaser.Physics.Arcade.StaticGroup;
  private teclas!: Record<string, Phaser.Input.Keyboard.Key>;
  private antes = { saltar: false, atacar: false, cambiar: false };
  private activo: Quien = 'jair';
  private vida = 8;
  private mirada = 1;
  private invulnerableHasta = 0;
  private golpeHasta = 0;
  private golpeListo = 0;
  private golpeEn = 0;
  private disparoListo = 0;
  private disparoFrameHasta = 0;
  private ultimoDisparo = -9999;
  private bateria = 100;
  private descargado = false;
  private coyote = 0;
  private enElAire = false;
  private velocidadAntes = 0;
  private pisando = false;
  private rebote = false;
  private saltoGuardado = 0;
  private ultimoSeguroX = 60;
  private bloqueo: [number, number] | null = null;
  private terminado = false;
  private soldados: Soldado[] = [];
  private balasRojas!: Phaser.Physics.Arcade.Group;
  private balasAzules!: Phaser.Physics.Arcade.Group;
  private gotas!: Phaser.Physics.Arcade.Group;
  private latas!: Phaser.Physics.Arcade.Group;
  private oleadas = OLEADAS.map((w) => ({ ...w, hecha: false }));
  private arena: { estado: 'espera' | 'activa' | 'hecha'; ola: number; desde: number } = { estado: 'espera', ola: 0, desde: 0 };
  private pixeles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private alarma!: Phaser.GameObjects.Rectangle;
  // Jefe.
  private jefe!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private jefeVida = JEFE.vida;
  private jefeEstado: EstadoJefe = 'oculto';
  private jefeHasta = 0;
  private jefeMirada = -1;
  private jefeCharco!: Phaser.GameObjects.Ellipse;
  private jefeMitad = false;
  private jefeGolpe: Phaser.Geom.Rectangle | null = null;
  private jefeParpadeoHasta = 0;
  private jefeBarraLlena = 0;
  // Diálogos (se muestran abajo, en React) y estado para la interfaz.
  private vistos = new Set<string>();
  private cola: DialogoNivel[] = [];
  private hablandoHasta = 0;
  private hablando = false;
  private ultimoEstado = '';

  constructor(o: OpcionesNivel) {
    super('bastion');
    this.o = o;
    this.vida = o.datos.jugador.vida;
  }

  preload() {
    this.load.spritesheet('cami', `${import.meta.env.BASE_URL}nivel/cami.png`, { frameWidth: 96, frameHeight: 56 });
  }

  create() {
    crearTexturas(this);
    this.physics.world.gravity.y = GRAVEDAD;
    this.physics.world.setBounds(0, -200, MUNDO, H + 400);
    this.physics.world.setBoundsCollision(true, true, false, false);

    // Fondo: el espacio (casi quieto) y la catedral con cables (a media velocidad).
    this.add.image(0, 0, 'fondo_lejos').setOrigin(0).setScrollFactor(0);
    this.add.tileSprite(0, 0, W, H, 'fondo_medio').setOrigin(0).setScrollFactor(0).setName('medio');

    // Piso y bloques flotantes.
    this.suelo = this.physics.add.staticGroup();
    for (const [a, b] of PISO) {
      const top = this.add.tileSprite(a, SUELO, b - a, 16, 'piso').setOrigin(0);
      this.add.tileSprite(a, SUELO + 16, b - a, H - SUELO, 'piso_hondo').setOrigin(0);
      this.suelo.add(top);
    }
    for (const [x, y] of BLOQUES) this.suelo.add(this.add.image(x, y, 'bloque').setOrigin(0));
    this.suelo.refresh();
    // Cartel antes de bajar al nivel dos: una flecha, sin texto.
    this.add.image(2620, 150, 'flecha').setDepth(2);

    // Jair adelante y Cami atrás. Para probar: ?nivel=jefe en la dirección empieza antes de la arena del jefe.
    const alJefe = new URLSearchParams(location.search).get('nivel') === 'jefe';
    if (alJefe) {
      this.oleadas.forEach((w) => (w.hecha = true));
      this.arena.estado = 'hecha';
      this.vistos.add('inicio').add('plataformas');
    }
    // Con ?nivel=… en la dirección, la escena queda a mano para las pruebas.
    if (new URLSearchParams(location.search).has('nivel')) (window as unknown as { __bastion?: BastionScene }).__bastion = this;
    this.jugador = this.physics.add.sprite(alJefe ? 2640 : 60, SUELO - 40, 'jair', 0).setDepth(10);
    this.acompanante = this.add.sprite(this.jugador.x - 22, SUELO, 'cami', 0).setDepth(9);
    this.vestir(this.jugador, 'jair', true);
    this.vestir(this.acompanante, 'cami', false);
    this.physics.add.collider(this.jugador, this.suelo);

    this.balasRojas = this.physics.add.group({ allowGravity: false });
    this.balasAzules = this.physics.add.group({ allowGravity: false });
    this.gotas = this.physics.add.group();
    this.physics.add.collider(this.balasRojas, this.suelo, (b) => b.destroy());
    this.physics.add.collider(this.gotas, this.suelo, (g) => this.salpicar(g as Phaser.Physics.Arcade.Image));
    // Lo que viene contra ellos le da al que va adelante (aunque esté parpadeando, la bala se deshace igual).
    this.physics.add.overlap(this.jugador, this.balasRojas, (_j, b) => {
      b.destroy();
      this.herir(1, (b as Phaser.Physics.Arcade.Image).x);
    });
    this.physics.add.overlap(this.jugador, this.gotas, (_j, g) => {
      g.destroy();
      this.herir(1, (g as Phaser.Physics.Arcade.Image).x);
    });
    // Latas de agua: devuelven una vida.
    this.latas = this.physics.add.group();
    this.physics.add.collider(this.latas, this.suelo);
    this.physics.add.overlap(this.jugador, this.latas, (_j, l) => {
      const lata = l as Phaser.Physics.Arcade.Image;
      lata.destroy();
      this.vida = Math.min(this.o.datos.jugador.vida, this.vida + 1);
      playChip('vida');
      this.evento('agua');
      const mas = this.add.text(lata.x, lata.y - 12, '+1', this.fuente('#e8e2d4')).setOrigin(0.5).setDepth(20);
      this.tweens.add({ targets: mas, y: mas.y - 14, alpha: 0, duration: 700, onComplete: () => mas.destroy() });
    });

    // Al morir, los soldados se desarman en una lluvia de píxeles negros.
    this.pixeles = this.add.particles(0, 0, 'pixel', {
      speed: { min: 20, max: 110 },
      angle: { min: 200, max: 340 },
      lifespan: { min: 500, max: 1100 },
      gravityY: 220,
      scale: { start: 1, end: 0.3 },
      alpha: { start: 1, end: 0 },
      tint: [0x000000, 0x14151b, 0x2b2e3b, 0x3d4254],
      emitting: false,
    });
    this.pixeles.setDepth(12);

    // El jefe espera bajo el piso.
    this.jefeCharco = this.add.ellipse(0, SUELO + 1, 84, 10, 0x0b0910).setVisible(false).setDepth(4);
    this.jefe = this.physics.add.sprite(JEFE.aparece, SUELO + 1, 'monstruo', 7);
    this.jefe.setOrigin(0.5, 1).setScale(ESCALA.monstruo).setVisible(false).setDepth(8);
    this.jefe.body.setAllowGravity(false).setImmovable(true).setSize(34, 46).setOffset(23, 17);
    // Un borde violeta, para que la tinta se distinga del fondo oscuro (solo con WebGL).
    this.jefe.preFX?.addGlow(0x8d6bff, 3, 0, false, 0.1, 10);
    this.jefe.body.enable = false;

    // Luz de emergencia: roja, fija, con un pulso leve.
    this.alarma = this.add.rectangle(0, 0, W, H, 0xff2030, 0.06).setOrigin(0).setScrollFactor(0).setDepth(100);

    // Cámara.
    this.cameras.main.setBounds(0, 0, MUNDO, H);
    this.cameras.main.startFollow(this.jugador, true, 0.12, 0.12, 0, 20);
    this.cameras.main.setRoundPixels(true);

    // Teclado: flechas o A/D, saltar (↑, W, espacio), atacar (J, X, Z), cambiar (Q, K, Shift, Tab), abajo (↓, S).
    this.teclas = this.input.keyboard!.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE,J,X,Z,Q,K,SHIFT,TAB') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.addCapture('TAB,SPACE,UP,DOWN,LEFT,RIGHT');

    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.o.onListo({ jair: this.textures.getBase64('cara', 0) });
    this.emitirEstado(true);
    this.time.delayedCall(450, () => this.evento('inicio'));
  }

  /** Texto dentro del juego (los «+1»): tipografía de píxel, a tamaño entero para que se vea nítida. */
  private fuente(color: string): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color, resolution: 1 };
  }

  /**
   * Pone la textura, la escala y el cuerpo de cada personaje. Los dos se paran con los pies en el mismo lugar:
   * el sprite que sigue (sin físicas) se ubica por los pies.
   */
  private vestir(spr: Phaser.GameObjects.Sprite, quien: Quien, fisico: boolean) {
    spr.setTexture(quien, 0);
    if (quien === 'jair') {
      spr.setScale(ESCALA.jair);
      if (fisico) (spr.body as Phaser.Physics.Arcade.Body).setSize(12, 30).setOffset(10, 7);
      else spr.setOrigin(0.5, 37 / 40);
    } else {
      spr.setScale(1);
      if (fisico) (spr.body as Phaser.Physics.Arcade.Body).setSize(16, 44).setOffset(40, 11);
      else spr.setOrigin(0.5, 55 / 56);
    }
  }

  // ---------------------------------------------------------------- diálogos
  /** Encola las líneas de un evento (cada evento habla una sola vez). */
  private evento(nombre: string) {
    if (this.vistos.has(nombre)) return;
    this.vistos.add(nombre);
    this.cola.push(...this.o.datos.dialogos.filter((d) => d.evento === nombre));
  }

  /** Pasa a la caja de abajo la línea que toca, el tiempo justo para escribirla y leerla. */
  private hablar(t: number) {
    if (this.hablando && t < this.hablandoHasta) return;
    const linea = this.cola.shift();
    if (!linea) {
      if (this.hablando) this.o.onDialogo(null, 0);
      this.hablando = false;
      return;
    }
    const ms = Math.min(6500, 1300 + linea.texto.length * 55);
    this.hablando = true;
    this.hablandoHasta = t + ms;
    this.o.onDialogo(linea, ms);
  }

  private emitirEstado(forzar = false) {
    const visible = this.jefeEstado !== 'oculto' && this.jefeEstado !== 'fuera';
    const e: EstadoNivel = {
      vida: Math.max(0, this.vida),
      vidaMax: this.o.datos.jugador.vida,
      activo: this.activo,
      bateria: Math.round(this.bateria),
      descargado: this.descargado,
      jefe: visible ? { vida: Math.min(this.jefeVida, this.jefeBarraLlena), max: JEFE.vida } : null,
    };
    const clave = JSON.stringify(e);
    if (forzar || clave !== this.ultimoEstado) {
      this.ultimoEstado = clave;
      this.o.onEstado(e);
    }
  }

  // ---------------------------------------------------------------- entrada
  private leer() {
    const k = this.teclas;
    const m = this.o.mando;
    const izq = k.LEFT.isDown || k.A.isDown || m.izq;
    const der = k.RIGHT.isDown || k.D.isDown || m.der;
    const saltar = k.UP.isDown || k.W.isDown || k.SPACE.isDown || m.saltar;
    const atacar = k.J.isDown || k.X.isDown || k.Z.isDown || m.atacar;
    const cambiar = k.Q.isDown || k.K.isDown || k.SHIFT.isDown || k.TAB.isDown || m.cambiar;
    const abajo = k.DOWN.isDown || k.S.isDown || m.abajo;
    const r = {
      izq,
      der,
      abajo,
      saltar,
      saltarYa: saltar && !this.antes.saltar,
      atacarYa: atacar && !this.antes.atacar,
      cambiarYa: cambiar && !this.antes.cambiar,
    };
    this.antes = { saltar, atacar, cambiar };
    return r;
  }

  // ---------------------------------------------------------------- bucle
  update(time: number, delta: number) {
    const t = time;
    const dt = Math.min(delta, 50) / 1000;
    (this.children.getByName('medio') as Phaser.GameObjects.TileSprite).tilePositionX = this.cameras.main.scrollX * 0.5;
    this.alarma.setAlpha(this.o.reducirEfectos ? 0.06 : 0.05 + 0.035 * (1 + Math.sin(t / 420)));
    this.hablar(t);
    this.emitirEstado();
    if (this.terminado) return;

    const e = this.leer();
    const body = this.jugador.body;
    const enSuelo = body.blocked.down;
    if (enSuelo) {
      this.coyote = t + 80;
      // El último lugar seguro (para volver si se cae a un hueco): sobre el piso, no en un bloque.
      if (PISO.some(([a, b]) => this.jugador.x > a + 16 && this.jugador.x < b - 16) && body.bottom >= SUELO - 1) this.ultimoSeguroX = this.jugador.x;
    }
    // Al caer: un aplastón y polvo.
    if (enSuelo && this.enElAire) this.aterrizar(this.velocidadAntes);
    this.enElAire = !enSuelo;
    this.velocidadAntes = body.velocity.y;

    // Moverse (más lento mientras pega).
    const dir = (e.der ? 1 : 0) - (e.izq ? 1 : 0);
    const herido = t < this.invulnerableHasta - 850;
    if (!herido) body.setVelocityX(dir * VELOCIDAD * (t < this.golpeHasta ? 0.45 : 1));
    if (dir) this.mirada = dir;
    // Saltar: con un margen al borde (coyote) y guardando el botón un instante; se corta al soltar.
    if (e.saltarYa) this.saltoGuardado = t + 110;
    if (this.saltoGuardado > t && t < this.coyote) {
      body.setVelocityY(-SALTO);
      this.saltoGuardado = 0;
      this.coyote = 0;
      this.estirar(1.12, 0.9);
      playChip('salto');
    }
    if (!e.saltar && body.velocity.y < CORTE_SALTO && !this.rebote) body.setVelocityY(CORTE_SALTO);
    if (enSuelo) this.rebote = false;
    // Pisotón (con Jair, en el aire y abajo): cae con los pies y rebota sobre lo que pisa.
    this.pisando = this.activo === 'jair' && !enSuelo && e.abajo;
    if (this.pisando && body.velocity.y > 0) this.pisar();

    if (e.cambiarYa) this.cambiar();

    // Atacar.
    if (e.atacarYa) {
      if (this.activo === 'jair' && t > this.golpeListo) {
        this.golpeHasta = t + 230;
        this.golpeListo = t + 330;
        this.golpeEn = t + 70;
      } else if (this.activo === 'cami') this.disparar(t);
    }
    if (this.golpeEn && t >= this.golpeEn) {
      this.golpeEn = 0;
      this.golpear();
    }
    // La batería se recarga sola un rato después del último disparo.
    const b = this.o.datos.bateria;
    if (t - this.ultimoDisparo > b.espera_recarga * 1000) this.bateria = Math.min(100, this.bateria + b.recarga_por_segundo * dt);
    if (this.descargado && this.bateria >= 100) this.descargado = false;

    // Caer a un hueco: una vida menos y de vuelta al último piso seguro.
    if (this.jugador.y > H + 40) this.caer();

    this.animarJugador(t, enSuelo, dir);
    this.rastro.push({ x: this.jugador.x, pie: body.bottom, suelo: enSuelo });
    if (this.rastro.length > 40) this.rastro.shift();
    this.animarAcompanante(t);
    this.limitarArena();
    this.actualizarOleadas(t);
    this.actualizarSoldados(t);
    this.actualizarJefe(t);
  }

  /** Estira o aplasta un instante (salto y caída), sobre la escala del personaje. */
  private estirar(sy: number, sx: number) {
    if (this.o.reducirEfectos) return;
    const base = this.activo === 'jair' ? ESCALA.jair : 1;
    this.tweens.killTweensOf(this.jugador);
    this.jugador.setScale(base * sx, base * sy);
    this.tweens.add({ targets: this.jugador, scaleX: base, scaleY: base, duration: 140, ease: 'Quad.easeOut' });
  }

  private aterrizar(vy: number) {
    if (vy < 260) return;
    this.estirar(0.88, 1.1);
    this.pixeles.setParticleTint(0x9ea2af);
    this.pixeles.explode(6, this.jugador.x, this.jugador.body.bottom - 1);
    this.pixeles.setParticleTint(0x14151b);
  }

  /** Cambian de lugar: el de atrás pasa adelante y ataca él. */
  private cambiar() {
    const b = this.jugador.body;
    const pie = b.bottom;
    const { x: vx, y: vy } = b.velocity;
    this.activo = this.activo === 'jair' ? 'cami' : 'jair';
    this.tweens.killTweensOf(this.jugador);
    this.vestir(this.jugador, this.activo, true);
    // Con los pies donde estaban: el centro del sprite, según el cuadro, la escala y el cuerpo de cada uno.
    const [alto, desde, cuerpo, escala] = this.activo === 'jair' ? [40, 7, 30, ESCALA.jair] : [56, 11, 44, 1];
    b.reset(this.jugador.x, pie + (alto * escala) / 2 - (desde + cuerpo) * escala);
    b.setVelocity(vx, vy);
    this.vestir(this.acompanante, this.activo === 'jair' ? 'cami' : 'jair', false);
    playChip('cambio');
    this.pixeles.explode(6, this.jugador.x, pie - 20);
    this.pixeles.explode(6, this.acompanante.x, pie - 20);
    this.evento(this.activo === 'cami' ? 'cambio_cami' : 'cambio_jair');
  }

  private animarJugador(t: number, enSuelo: boolean, dir: number) {
    let f: number;
    if (this.activo === 'jair') {
      if (this.pisando) f = JAIR.pisoton;
      else if (t < this.golpeHasta) f = t < this.golpeHasta - 140 ? JAIR.golpe[0] : JAIR.golpe[1];
      else if (!enSuelo) f = JAIR.salto;
      else if (dir) f = JAIR.caminar[Math.floor(t / 110) % 4];
      else f = JAIR.quieto[Math.floor(t / 600) % 2];
    } else {
      if (t < this.disparoFrameHasta) f = CAMI.dispara;
      else if (t - this.ultimoDisparo < 350) f = CAMI.apunta;
      else if (!enSuelo) f = CAMI.corre;
      else if (dir) f = Math.floor(t / 140) % 2 ? CAMI.corre : CAMI.quieta;
      else f = CAMI.quieta;
    }
    this.jugador.setFrame(f).setFlipX(this.mirada < 0);
    // Parpadeo mientras es invulnerable.
    this.jugador.setAlpha(t < this.invulnerableHasta && Math.floor(t / 70) % 2 ? 0.35 : 1);
  }

  /** El de atrás: va por el mismo camino, con un poco de retraso, y se queda a un paso del otro. */
  private animarAcompanante(t: number) {
    const a = this.acompanante;
    const d = this.rastro[Math.max(0, this.rastro.length - 13)] ?? { x: this.jugador.x, pie: this.jugador.body.bottom, suelo: true };
    let x = d.x;
    if (Math.abs(this.jugador.x - x) < 22) x = this.jugador.x - this.mirada * 22;
    const antes = a.x;
    a.x += (x - a.x) * 0.3;
    a.y = d.pie;
    const mov = a.x - antes;
    const quien = this.activo === 'jair' ? 'cami' : 'jair';
    if (quien === 'jair') {
      if (!d.suelo) a.setFrame(JAIR.salto);
      else if (Math.abs(mov) > 0.4) a.setFrame(JAIR.caminar[Math.floor(t / 110) % 4]);
      else a.setFrame(JAIR.quieto[Math.floor(t / 600) % 2]);
    } else if (!d.suelo || Math.abs(mov) > 0.4) a.setFrame(Math.floor(t / 140) % 2 ? CAMI.corre : CAMI.quieta);
    else a.setFrame(CAMI.quieta);
    a.setFlipX(Math.abs(mov) > 0.4 ? mov < 0 : this.mirada < 0);
  }

  /** El cuerpo del que va adelante (para los golpes que recibe). */
  private cuerpo() {
    const b = this.jugador.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  private limitarArena() {
    if (!this.bloqueo) return;
    const [a, b] = this.bloqueo;
    this.jugador.x = Phaser.Math.Clamp(this.jugador.x, a + 12, b - 12);
    this.acompanante.x = Phaser.Math.Clamp(this.acompanante.x, a + 10, b - 10);
    // Los soldados tampoco quedan fuera de alcance.
    for (const s of this.soldados) s.spr.x = Phaser.Math.Clamp(s.spr.x, a + 16, b - 16);
  }

  private bloquear(x: number | null) {
    const cam = this.cameras.main;
    if (x === null) {
      this.bloqueo = null;
      cam.setBounds(0, 0, MUNDO, H);
      return;
    }
    this.bloqueo = [x, x + W];
    cam.setBounds(x, 0, W, H);
  }

  // ---------------------------------------------------------------- ataques
  private golpear() {
    const m = this.mirada;
    const b = this.jugador.body;
    const zona = new Phaser.Geom.Rectangle(m > 0 ? b.right - 2 : b.left - 38, b.y + 6, 40, b.height * 0.55);
    let acerto = false;
    for (const s of [...this.soldados]) {
      if (Phaser.Geom.Intersects.RectangleToRectangle(zona, this.cuerpoDe(s.spr))) {
        this.danarSoldado(s, 2, m * 190);
        acerto = true;
      }
    }
    if (this.jefeVulnerable() && Phaser.Geom.Intersects.RectangleToRectangle(zona, this.cuerpoDe(this.jefe))) {
      this.danarJefe(2);
      acerto = true;
    }
    playChip(acerto ? 'golpe' : 'salto');
    if (acerto) {
      this.evento('primer_golpe');
      if (!this.o.reducirEfectos) this.cameras.main.shake(60, 0.004);
    }
  }

  private cuerpoDe(spr: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody) {
    const b = spr.body;
    return new Phaser.Geom.Rectangle(b.x, b.y, b.width, b.height);
  }

  private disparar(t: number) {
    const b = this.o.datos.bateria;
    if (this.descargado || this.bateria < b.por_disparo) {
      if (t > this.disparoListo) {
        playChip('vacio');
        this.disparoListo = t + 300;
      }
      return;
    }
    if (t < this.disparoListo || this.balasAzules.countActive() >= MAX_DISPAROS) return;
    this.disparoListo = t + 170;
    this.disparoFrameHasta = t + 110;
    this.ultimoDisparo = t;
    this.bateria -= b.por_disparo;
    if (this.bateria < b.por_disparo) {
      this.descargado = true;
      this.evento('descarga');
    }
    const m = this.mirada;
    // Sale de la boca del blaster.
    const bala = this.balasAzules.create(this.jugador.x + m * 34, this.jugador.body.y + 12, 'bala_azul') as Phaser.Physics.Arcade.Image;
    bala.setFlipX(m < 0).setVelocityX(m * 300).setDepth(11);
    // Corto alcance: la energía se disipa enseguida.
    this.tweens.add({ targets: bala, alpha: 0, delay: ALCANCE_MS - 70, duration: 70, onComplete: () => bala.destroy() });
    playChip('disparo');
  }

  /** Pisotón: si los pies de Jair caen sobre un soldado o sobre el monstruo, le pega y rebota. */
  private pisar() {
    const b = this.jugador.body;
    const pies = new Phaser.Geom.Rectangle(b.x, b.bottom - 4, b.width, 8);
    const s = this.soldados.find((x) => Phaser.Geom.Intersects.RectangleToRectangle(pies, this.cuerpoDe(x.spr)) && b.bottom < x.spr.body.y + 14);
    const jefe = !s && this.jefeVulnerable() && Phaser.Geom.Intersects.RectangleToRectangle(pies, this.cuerpoDe(this.jefe)) && b.bottom < this.jefe.body.y + 20;
    if (!s && !jefe) return;
    if (s) this.danarSoldado(s, 2, 0);
    else this.danarJefe(2);
    b.setVelocityY(-430);
    this.rebote = true;
    this.invulnerableHasta = Math.max(this.invulnerableHasta, this.time.now + 220);
    this.evento('pisoton');
    playChip('golpe');
    if (!this.o.reducirEfectos) this.cameras.main.shake(60, 0.004);
  }

  /** Revisa los disparos azules contra los soldados y el jefe (por cuerpo, no por el dibujo). */
  private revisarBalas() {
    for (const obj of this.balasAzules.getChildren()) {
      const bala = obj as Phaser.Physics.Arcade.Image;
      if (!bala.active) continue;
      const r = bala.getBounds();
      const s = this.soldados.find((x) => Phaser.Geom.Intersects.RectangleToRectangle(r, this.cuerpoDe(x.spr)));
      if (s) {
        this.danarSoldado(s, 1, Math.sign(bala.body!.velocity.x) * 80);
        bala.destroy();
        continue;
      }
      if (this.jefeVulnerable() && Phaser.Geom.Intersects.RectangleToRectangle(r, this.cuerpoDe(this.jefe))) {
        this.danarJefe(1);
        bala.destroy();
      }
    }
  }

  // ---------------------------------------------------------------- jugador
  private herir(n: number, desdeX?: number) {
    const t = this.time.now;
    if (this.terminado || t < this.invulnerableHasta) return;
    this.vida -= n;
    this.invulnerableHasta = t + 1100;
    const lado = desdeX === undefined ? -this.mirada : Math.sign(this.jugador.x - desdeX) || 1;
    this.jugador.body.setVelocity(lado * 150, -260);
    playChip('herido');
    if (!this.o.reducirEfectos) this.cameras.main.shake(130, 0.007);
    this.jugador.setTintFill(0xffffff);
    this.time.delayedCall(90, () => this.jugador.clearTint());
    if (this.vida <= 2) this.evento('vida_baja');
    if (this.vida <= 0) this.perder();
  }

  private caer() {
    this.evento('caida');
    this.jugador.setPosition(this.ultimoSeguroX, SUELO - 60);
    this.jugador.body.setVelocity(0, 0);
    // El de atrás reaparece a su lado.
    this.rastro = [];
    this.acompanante.setPosition(this.ultimoSeguroX - this.mirada * 22, SUELO);
    this.invulnerableHasta = 0;
    this.herir(1);
    this.jugador.body.setVelocity(0, 0);
  }

  private perder() {
    this.terminado = true;
    this.vida = 0;
    this.emitirEstado(true);
    this.jugador.body.setVelocity(0, 0);
    this.jugador.setTint(0x777a85);
    this.acompanante.setTint(0x777a85);
    this.tweens.add({ targets: this.jugador, angle: this.mirada * -80, y: this.jugador.y + 10, duration: 500, ease: 'Quad.easeIn' });
    playChip('muerte');
    this.cola = [];
    this.hablando = false;
    this.evento('derrota');
    this.time.delayedCall(2800, () => {
      this.cameras.main.fadeOut(900, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.o.onPerder());
    });
  }

  // ---------------------------------------------------------------- soldados
  private actualizarOleadas(t: number) {
    const x = this.jugador.x;
    for (const w of this.oleadas) {
      if (w.hecha || x < w.desde) continue;
      w.hecha = true;
      this.crearSoldado(w.x, w.y ?? SUELO, w.fijo, w.grupo);
      if (w.evento) this.evento(w.evento);
    }
    if (x > 860) this.evento('plataformas');
    // La sala: se cierran las cámaras y llegan los copiados, de a dos.
    if (this.arena.estado === 'espera' && x > ARENA.desde) {
      this.arena.estado = 'activa';
      this.arena.desde = t;
      this.bloquear(ARENA.x);
      this.evento('arena');
    }
    if (this.arena.estado === 'activa') {
      const ola = ARENA.olas[this.arena.ola];
      if (ola && this.soldados.length <= 1) {
        this.arena.ola++;
        ola.forEach((sx, i) => this.time.delayedCall(i * 260, () => this.crearSoldado(sx, SUELO, false, 10 + this.arena.ola)));
      } else if ((!ola && this.soldados.length === 0) || t - this.arena.desde > ARENA.maxMs) {
        // Terminada (o, si algo se trabó, se abre sola: nadie se queda encerrado).
        this.arena.estado = 'hecha';
        this.bloquear(null);
        this.evento('arena_fin');
      }
    }
    if (this.jefeEstado === 'oculto' && x > JEFE.desde) this.despertarJefe();
  }

  private crearSoldado(x: number, pisoY: number, fijo = false, grupo?: number) {
    const spr = this.physics.add.sprite(x, pisoY - 36, 'soldado', 0).setScale(ESCALA.soldado).setDepth(9);
    spr.body.setSize(12, 36).setOffset(10, 7);
    this.physics.add.collider(spr, this.suelo);
    // Aparecen como copiados: de píxeles a cuerpo.
    spr.setAlpha(0);
    this.tweens.add({ targets: spr, alpha: 1, duration: 260 });
    this.pixeles.explode(10, x, pisoY - 30);
    const t = this.time.now;
    const s: Soldado = { spr, vida: 3, fijo, grupo, proxDisparo: t + 900 + (grupo ? 0 : Math.random() * 600), apuntaHasta: 0, aturdidoHasta: 0, empujeListo: 0 };
    // Los del mismo grupo comparten el ritmo: giran y disparan a la vez.
    const igual = grupo !== undefined && this.soldados.find((o) => o.grupo === grupo);
    if (igual) s.proxDisparo = igual.proxDisparo;
    this.soldados.push(s);
  }

  private actualizarSoldados(t: number) {
    this.revisarBalas();
    const yo = this.cuerpo();
    for (const s of [...this.soldados]) {
      const spr = s.spr;
      if (spr.y > H + 60) {
        this.matarSoldado(s);
        continue;
      }
      const dx = this.jugador.x - spr.x;
      const dist = Math.abs(dx);
      if (t < s.aturdidoHasta) continue;
      spr.setFlipX(dx < 0);
      const dirx = Math.sign(dx) || 1;
      // Empujón si el que va adelante se le pega.
      if (Phaser.Geom.Intersects.RectangleToRectangle(yo, this.cuerpoDe(spr)) && t > s.empujeListo) {
        s.empujeListo = t + 1200;
        this.herir(1, spr.x);
      }
      if (t < s.apuntaHasta) {
        spr.setVelocityX(0).setFrame(SOLDADO.apuntar);
        continue;
      }
      if (s.apuntaHasta && t >= s.apuntaHasta) {
        // Dispara a la altura del pecho: le da al que va adelante.
        s.apuntaHasta = 0;
        spr.setFrame(SOLDADO.disparo);
        const bala = this.balasRojas.create(spr.x + dirx * 26, spr.y - 4, 'bala_roja') as Phaser.Physics.Arcade.Image;
        bala.setVelocityX(dirx * 160).setFlipX(dirx < 0).setDepth(11);
        this.time.delayedCall(3000, () => bala.active && bala.destroy());
        playChip('enemigo');
        s.proxDisparo = t + 1700 + (s.grupo ? 0 : Math.random() * 700);
        continue;
      }
      if (dist < 240 && t > s.proxDisparo && dist > 50) {
        s.apuntaHasta = t + 450;
        continue;
      }
      // Se acerca hasta una distancia de tiro (al alcance del blaster de Cami).
      if (!s.fijo && dist > 80 && dist < 340) {
        spr.setVelocityX(dirx * 52).setFrame(SOLDADO.caminar[Math.floor(t / 140) % 4]);
      } else {
        spr.setVelocityX(0).setFrame(SOLDADO.caminar[0]);
      }
    }
  }

  private danarSoldado(s: Soldado, n: number, empuje: number) {
    s.vida -= n;
    s.aturdidoHasta = this.time.now + 260;
    s.apuntaHasta = 0;
    s.spr.setVelocityX(empuje).setTintFill(0xffffff);
    this.time.delayedCall(80, () => s.spr.active && s.spr.clearTint());
    playChip('impacto');
    if (s.vida <= 0) this.matarSoldado(s);
  }

  private matarSoldado(s: Soldado) {
    this.soldados = this.soldados.filter((x) => x !== s);
    const { x, y } = s.spr;
    // A veces suelta una lata de agua; el último antes del jefe, siempre.
    const ultimo = s.grupo === 2 && !this.soldados.some((o) => o.grupo === 2);
    if (y < H && (ultimo || Math.random() < PROB_LATA)) {
      const lata = this.latas.create(x, y - 10, 'lata') as Phaser.Physics.Arcade.Image;
      lata.setScale(1.5).setVelocity(0, -260).setDepth(9);
      this.time.delayedCall(9000, () => lata.active && this.tweens.add({ targets: lata, alpha: 0, duration: 400, onComplete: () => lata.destroy() }));
    }
    s.spr.body.enable = false;
    this.pixeles.explode(30, x, y - 4);
    playChip('muerte');
    // Se apaga como un monitor: se aplasta y desaparece.
    this.tweens.add({ targets: s.spr, scaleY: 0.05, scaleX: ESCALA.soldado * 1.3, alpha: 0.6, duration: 160, onComplete: () => s.spr.destroy() });
  }

  // ---------------------------------------------------------------- jefe
  private despertarJefe() {
    this.bloquear(JEFE.x);
    this.jefeEstado = 'emerge';
    this.jefeHasta = this.time.now + 1400;
    this.jefe.setVisible(true).setFrame(MONSTRUO.hundirse[1]).setX(JEFE.aparece);
    this.jefe.body.enable = true;
    // La barra del jefe se llena antes de que empiece a pelear.
    this.jefeBarraLlena = 0;
    this.tweens.addCounter({
      from: 0,
      to: JEFE.vida,
      duration: 1300,
      onUpdate: (tw) => {
        const v = Math.floor(tw.getValue() ?? 0);
        if (v > this.jefeBarraLlena && v % 2 === 0) playChip('tick');
        this.jefeBarraLlena = v;
      },
    });
    playChip('modem');
    if (!this.o.reducirEfectos) this.cameras.main.shake(400, 0.004);
    this.evento('jefe');
  }

  private jefeVulnerable() {
    return ['quieto', 'carga', 'barrido', 'escupe'].includes(this.jefeEstado) && this.time.now > this.jefeParpadeoHasta;
  }

  private danarJefe(n: number) {
    this.jefeVida = Math.max(0, this.jefeVida - n);
    // Parpadea un instante: no se le puede volver a pegar enseguida.
    this.jefeParpadeoHasta = this.time.now + 240;
    this.jefe.setTintFill(0xb9a8ff);
    this.time.delayedCall(70, () => this.jefe.clearTint());
    this.tweens.add({ targets: this.jefe, alpha: 0.4, yoyo: true, repeat: 1, duration: 55 });
    playChip('impacto');
    if (!this.jefeMitad && this.jefeVida <= JEFE.vida / 2 && this.jefeVida > 0) {
      this.jefeMitad = true;
      this.evento('jefe_mitad');
    }
    if (this.jefeVida <= 0) this.retirarJefe();
  }

  /** No muere: se derrama entre las grietas y deja de estar a la vista. */
  private retirarJefe() {
    this.jefeEstado = 'huye';
    this.jefeGolpe = null;
    this.gotas.clear(true, true);
    // Lo que quedaba por decir ya no importa: solo se dice lo de la retirada.
    this.jefeMitad = true;
    this.cola = [];
    this.hablando = false;
    playChip('modem');
    this.jefe.setFrame(MONSTRUO.hundirse[0]);
    this.time.delayedCall(700, () => this.jefe.setFrame(MONSTRUO.hundirse[1]));
    this.tweens.add({ targets: this.jefe, alpha: 0, delay: 1300, duration: 600 });
    for (let k = 0; k < 4; k++) this.time.delayedCall(k * 300, () => this.tinta(this.jefe.x, SUELO - 10, 12));
    this.evento('jefe_huye');
    this.time.delayedCall(2200, () => {
      this.jefeEstado = 'fuera';
      this.jefe.body.enable = false;
    });
    // Gana cuando terminan de hablar.
    this.terminado = true;
    this.jugador.body.setVelocityX(0);
    const esperar = () => {
      if (this.cola.length || this.hablando) return void this.time.delayedCall(300, esperar);
      this.cameras.main.fadeOut(900, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.o.onGanar());
    };
    this.time.delayedCall(2600, esperar);
  }

  private tinta(x: number, y: number, n: number) {
    this.pixeles.setParticleTint(0x0b0910);
    this.pixeles.explode(n, x, y);
    this.pixeles.setParticleTint(0x14151b);
  }

  private salpicar(g: Phaser.Physics.Arcade.Image) {
    this.tinta(g.x, g.y, 8);
    g.destroy();
  }

  private actualizarJefe(t: number) {
    if (this.jefeEstado === 'oculto' || this.jefeEstado === 'fuera' || this.jefeEstado === 'huye') return;
    const j = this.jefe;
    const dx = this.jugador.x - j.x;
    const rapido = this.jefeMitad ? 0.75 : 1;
    const yo = this.cuerpo();
    // Contacto: tocar la tinta duele.
    if (this.jefeEstado !== 'hundido' && Phaser.Geom.Intersects.RectangleToRectangle(yo, this.cuerpoDe(j))) this.herir(1, j.x);
    if (this.jefeGolpe && Phaser.Geom.Intersects.RectangleToRectangle(yo, this.jefeGolpe)) this.herir(1, j.x);

    switch (this.jefeEstado) {
      case 'emerge':
        j.setFrame(t > this.jefeHasta - 500 ? MONSTRUO.hundirse[0] : MONSTRUO.hundirse[1]);
        if (t > this.jefeHasta) this.jefeA('quieto', 1400 * rapido);
        break;
      case 'quieto':
        // Se desliza hacia el jugador, como petróleo.
        this.jefeMirada = Math.sign(dx) || 1;
        j.setFlipX(this.jefeMirada < 0).setFrame(MONSTRUO.quieto[Math.floor(t / 180) % 3]);
        j.x += this.jefeMirada * 30 * (1 / 60);
        if (t > this.jefeHasta) {
          const r = Math.random();
          if (Math.abs(dx) < 130 && r < 0.55) this.jefeA('carga', 650 * rapido);
          else if (r < 0.75) this.jefeA('escupe', 450 * rapido);
          else this.jefeA('hundido', 1500);
        }
        break;
      case 'carga':
        j.setFrame(MONSTRUO.carga);
        if (t > this.jefeHasta) {
          // El barrido va bajo: se esquiva saltando.
          this.jefeA('barrido', 280);
          const x0 = j.x + (this.jefeMirada > 0 ? 8 : -128);
          this.jefeGolpe = new Phaser.Geom.Rectangle(x0, SUELO - 34, 120, 30);
          playChip('golpe');
          if (!this.o.reducirEfectos) this.cameras.main.shake(90, 0.005);
        }
        break;
      case 'barrido':
        j.setFrame(MONSTRUO.barrido);
        if (t > this.jefeHasta) {
          this.jefeGolpe = null;
          this.jefeA('quieto', 1100 * rapido);
        }
        break;
      case 'escupe':
        j.setFrame(MONSTRUO.escupe);
        if (t > this.jefeHasta) {
          for (let k = 0; k < (this.jefeMitad ? 4 : 3); k++) {
            const g = this.gotas.create(j.x + this.jefeMirada * 10, SUELO - 64, 'gota') as Phaser.Physics.Arcade.Image;
            g.setScale(1.5).setVelocity(this.jefeMirada * (90 + k * 55), -430 - k * 40).setDepth(11);
          }
          playChip('enemigo');
          this.jefeA('quieto', 1300 * rapido);
        }
        break;
      case 'hundido': {
        // Se hunde y viaja bajo el piso como un charco hacia el jugador.
        const resto = this.jefeHasta - t;
        if (resto > 1200) j.setFrame(MONSTRUO.hundirse[0]);
        else {
          j.setVisible(false);
          this.jefeCharco.setVisible(true).setY(SUELO + 1);
          const objetivo = Phaser.Math.Clamp(this.jugador.x, JEFE.x + 50, JEFE.x + W - 50);
          j.x += Phaser.Math.Clamp(objetivo - j.x, -2.6, 2.6);
          this.jefeCharco.setX(j.x).setScale(1 + 0.08 * Math.sin(t / 60), 1);
        }
        if (t > this.jefeHasta) {
          this.jefeCharco.setVisible(false);
          j.setVisible(true).setFrame(MONSTRUO.hundirse[1]);
          this.jefeGolpe = new Phaser.Geom.Rectangle(j.x - 32, SUELO - 60, 64, 60);
          playChip('modem');
          this.jefeA('surge', 420);
        }
        break;
      }
      case 'surge':
        j.setFrame(t > this.jefeHasta - 200 ? MONSTRUO.quieto[0] : MONSTRUO.hundirse[0]);
        if (t > this.jefeHasta) {
          this.jefeGolpe = null;
          this.jefeA('quieto', 1200 * rapido);
        }
        break;
    }
  }

  private jefeA(estado: EstadoJefe, ms: number) {
    this.jefeEstado = estado;
    this.jefeHasta = this.time.now + ms;
  }
}

/** Arranca el nivel dentro de `padre`. Devuelve cómo pausarlo y cómo destruirlo. */
export function crearNivel(padre: HTMLElement, o: OpcionesNivel) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: padre,
    width: W,
    height: H,
    pixelArt: true,
    backgroundColor: '#05050a',
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: GRAVEDAD }, debug: false } },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    audio: { noAudio: true },
    banner: false,
    scene: new BastionScene(o),
  });
  return {
    pausar: (p: boolean) => (p ? game.scene.pause('bastion') : game.scene.resume('bastion')),
    destruir: () => game.destroy(true),
  };
}
