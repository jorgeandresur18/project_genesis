// El simulador del balance: juega miles de peleas con las reglas del juego (src/engine/turnos.ts y batalla.ts, las
// mismas que usa Batalla.tsx), sin pantalla. Solo es suyo cómo juega cada jugador:
// - El descuidado solo ataca (siempre al más débil; el especial, apenas lo tiene) y nunca usa la mochila.
// - El atento además cura al que baja del 40 % y usa los potenciadores y los recargadores.
// Sin usos en sus ataques, cualquiera de los dos esquiva. Decide al momento de actuar (en el juego se elige antes).
// No se simula: pedirle perdón a Nikki (y por eso tampoco la traición), Hablar, los cebos ni revivir.
import capitan from '../public/batalla/capitan.json';
import variables from '../src/data/variables.json';
import {
  CARGA,
  enCampo,
  CONFUSION,
  cargar,
  disponibles,
  noActua,
  equipados,
  especialListo,
  esquiva,
  falla,
  ganarXp,
  gastarUso,
  golpesEspecial,
  quedan,
  seConfunde,
  seRetira,
  tickVeneno,
  usarObjeto,
  vanPerdiendo,
  vivo,
  xpDe,
  type Ataque,
  type DatosBatalla,
  type Luchador,
  ataqueCopiado,
  puedeRecibir,
} from '../src/engine/batalla';
import {
  aplicarEstacion,
  blancoDelCanon,
  desterrar,
  estacionAlAzar,
  quemarConEspecial,
  dejarEstado,
  confundirA,
  decidirEnemigo,
  envenenarConBola,
  estadoInicial,
  evaporarClones,
  finDeTurno,
  golpesDelCanon,
  hacerClon,
  llegaRefuerzo,
  paralizarA,
  poderBarrido,
  resolverGolpe,
  sumarEnemigo,
  fotoEstados,
  ordenDelTurno,
  sufreAlFinal,
  idNuevo,
} from '../src/engine/turnos';

/** Los golpes del cañón salen de la hoja del Capitán, como en el juego. */
const GOLPES_CANON = golpesDelCanon(capitan.animations.especial.seq as number[], capitan.rayo as unknown as Record<string, number[]>);

/** Una pelea entera. Devuelve el estado final y si ganó. */
function pelea(D: DatosBatalla, listo: boolean, esencias: boolean) {
  // Con esencias, como en el juego: cada pelea simulada es una partida distinta (otra semilla).
  const s = estadoInicial(D, undefined, esencias ? `sim${Math.random()}` : undefined);
  const hs = s.heroes;
  /** Un golpe de un enemigo: al que eligió esquivar, los especiales le hacen la mitad. */
  const especialA = (a: Luchador, b: Luchador, poder: number) => resolverGolpe(s, D, a, b, poder, b.esquivando);
  /** Los refuerzos que llegaron en este turno: actúan al final del turno, como en el juego. */
  let llegaron: Luchador[] = [];
  const cae = (e: Luchador) => {
    if (e.clon !== undefined) return;
    // En el torneo no se gana experiencia (decisión del autor, 2026-11-06).
    if (!D.torneo) hs.filter(vivo).forEach((x) => ganarXp(x, D.personajes[x.clave], xpDe(e.nivel)));
    if (Math.random() < D.botin.probabilidad) {
      const k = D.botin.objetos[Math.floor(Math.random() * D.botin.objetos.length)];
      s.mochila[k] = (s.mochila[k] ?? 0) + 1;
    }
    if (llegaRefuerzo(s, D, e)) llegaron.push(sumarEnemigo(s, D, D.horda.enemigo, D.horda.niveles[s.salieron++]));
  };
  const seRetiraElJefe = () => {
    const j = s.enemigos.find((e) => D.enemigos[e.clave].jefe && e.clon === undefined);
    return !!j && seRetira(j, D.enemigos[j.clave]);
  };
  /** Usa un objeto si le conviene (solo el atento). */
  const usaObjeto = (h: Luchador) => {
    const herido = hs.filter(vivo).find((x) => x.ps < x.psMax * 0.4);
    const usar = (k: string, en: Luchador) => {
      s.mochila[k]--;
      usarObjeto(D.objetos[k], en);
      return true;
    };
    if (herido && s.mochila.vida > 0) return usar('vida', herido);
    if (h.clave === 'cami' && s.mochila.atq > 0) return usar('atq', h);
    if (h.clave === 'jair' && s.mochila.def > 0) return usar('def', h);
    if (D.personajes[h.clave].especial && !especialListo(h) && s.mochila.carga > 0) return usar('carga', h);
    return false;
  };
  const actuarHeroe = (h: Luchador) => {
    if (listo && usaObjeto(h)) return;
    const vivos = s.enemigos.filter(vivo);
    // Si ya no queda ningún enemigo (antes del jefe), los ataques de este turno se pierden.
    if (!vivos.length) return;
    const e = [...vivos].sort((a, b) => a.ps - b.ps)[0];
    const eq = equipados(D.personajes[h.clave], h.nivel);
    const esp = especialListo(h) ? eq.especiales[0] : undefined;
    // El atento primero duerme, confunde o paraliza al rival que todavía se mueve (Maggie, el beso de Nikki) y le pega
    // mientras no se mueve; el descuidado solo pega.
    const quieto = (x: Luchador) => x.dormido > 0 || x.confundido > 0 || x.paralizado > 0 || x.congelado > 0;
    const deEstado = listo && !quieto(e) ? eq.ataques.find((a: Ataque) => (a.confunde || a.paraliza || a.deja) && !a.cebo && quedan(h, a) > 0) : undefined;
    const ataque = deEstado ?? eq.ataques.find((a: Ataque) => a.poder > 0 && !a.confunde && !a.paraliza && !a.cebo && !a.cura && !a.alMismo && quedan(h, a) > 0);
    // Sin usos ni especial no puede atacar: esquiva.
    if (!esp && !ataque) {
      h.esquivando = true;
      cargar(h, CARGA.esquivar);
      return;
    }
    s.actuaron.push(h.id);
    if (seConfunde(h)) {
      cargar(h, CARGA.atacar);
      resolverGolpe(s, D, h, h, CONFUSION.poder);
      return;
    }
    if (esp) {
      h.carga = 0;
      const blancos = esp.objetivo === 'todos' ? vivos : [e];
      for (const b of golpesEspecial(esp, blancos)) if (vivo(b)) resolverGolpe(s, D, h, b, esp.poder);
      for (const b of blancos) dejarEstado(s, b, esp.deja);
      blancos.filter((b) => !vivo(b)).forEach(cae);
      return;
    }
    gastarUso(h, ataque!);
    const copia = ataqueCopiado(ataque!, h.copiado);
    const blancos = copia.objetivo === 'todos' ? vivos : [e];
    cargar(h, CARGA.atacar);
    // Los que no hacen daño: solo el estado (si no falla).
    if (copia.confunde || copia.paraliza) {
      for (const b of blancos) {
        if (falla(D, h, b)) continue;
        if (copia.confunde) confundirA(s, b, copia.confunde);
        else paralizarA(s, b);
      }
      return;
    }
    for (const b of blancos) if (!falla(D, h, b)) {
      resolverGolpe(s, D, h, b, copia.poder);
      dejarEstado(s, b, copia.deja);
      if (copia.aplica?.veneno && vivo(b) && !b.envenenado && puedeRecibir(b, 'envenenado')) b.envenenado = { ...copia.aplica.veneno };
    }
    blancos.filter((b) => !vivo(b)).forEach(cae);
  };
  const actuarEnemigo = (e: Luchador) => {
    const en = D.enemigos[e.clave];
    const r = decidirEnemigo(s, D, e);
    if (r.tipo === 'confundido') {
      resolverGolpe(s, D, e, e, CONFUSION.poder);
      if (!vivo(e)) cae(e);
    } else if (r.tipo === 'remate') {
      resolverGolpe(s, D, e, r.blanco, Math.max(r.golpe.poder, r.blanco.ps * 50));
    } else if (r.tipo === 'clon') {
      e.carga = 0;
      hacerClon(s, en.clon!, e, idNuevo(s, `${e.clave}-clon`));
    } else if (r.tipo === 'bola') {
      const bt = en.bola_toxica!;
      e.carga = 0;
      for (const x of hs.filter(vivo)) {
        especialA(e, x, bt.poder);
        envenenarConBola(x, bt.veneno, x.esquivando);
      }
      // Salpica a los suyos (no a ella).
      for (const x of s.enemigos.filter((y) => vivo(y) && y !== e)) if (!x.envenenado && puedeRecibir(x, 'envenenado')) x.envenenado = { ...bt.veneno };
    } else if (r.tipo === 'especial') {
      const esp = r.especial;
      e.carga = 0;
      if (esp.canon) {
        for (const g of GOLPES_CANON) {
          const x = blancoDelCanon(hs, r.blanco, g.fuerte);
          if (!x) break;
          especialA(e, x, g.fuerte ? esp.poder : poderBarrido(esp.poder));
        }
        return;
      }
      const blancos = esp.objetivo === 'todos' ? hs.filter(vivo) : [r.blanco];
      for (const b of golpesEspecial(esp, blancos, hs.length)) if (vivo(b)) especialA(e, b, esp.poder);
      // Lo que el especial deja además, como en el juego: las estaciones (el Rey), la grieta y la quemadura.
      if (esp.estaciones) for (const x of [...new Set(blancos)].filter(vivo)) aplicarEstacion(s, x, estacionAlAzar());
      if (esp.destierro) {
        const candidatos = hs.filter(enCampo);
        const x = candidatos[Math.floor(Math.random() * candidatos.length)];
        if (x) desterrar(s, x, esp.destierro);
      }
      quemarConEspecial(s, esp, blancos);
    } else if (r.tipo === 'ataque') {
      const a = r.ataque;
      if (a.confunde || a.paraliza) {
        for (const h of r.blancos) {
          if (esquiva(D, h, e)) continue;
          h.copiado = a;
          if (a.confunde) confundirA(s, h, a.confunde);
          else paralizarA(s, h);
        }
        return;
      }
      // La ráfaga del Capitán: varias balas, una a cada blanco por turno; cada una puede fallar.
      const n = a.balas ? a.balas[0] + Math.floor(Math.random() * (a.balas[1] - a.balas[0] + 1)) : r.blancos.length;
      for (let k = 0; k < n; k++) {
        const h = r.blancos[k % r.blancos.length];
        if (vivo(h) && !falla(D, e, h) && !esquiva(D, h, e)) {
          resolverGolpe(s, D, e, h, a.poder);
          h.copiado = a;
        }
      }
    }
  };

  // Cómo empieza: la horda o, sin horda, el jefe de entrada.
  for (; s.salieron < Math.min(D.horda.al_inicio, D.horda.niveles.length); s.salieron++) sumarEnemigo(s, D, D.horda.enemigo, D.horda.niveles[s.salieron]);
  if (!D.horda.niveles.length || D.jefe_con_horda) sumarEnemigo(s, D, D.jefe.enemigo, D.jefe.nivel);

  for (let turno = 0; turno < 300; turno++) {
    const disp = disponibles(hs, D.personajes, s.actuaron);
    const alEmpezar = fotoEstados([...hs, ...s.enemigos]);
    s.actuaron = [];
    // El orden del turno, como en el juego (`ordenDelTurno`): del más rápido al más lento, héroes y enemigos mezclados.
    // (El simulador decide al actuar: sus esquivas, cuando se queda sin usos, no van con prioridad.)
    const orden = ordenDelTurno([...disp.map((h) => ({ l: h, dato: 'heroe' as const })), ...s.enemigos.filter(vivo).map((e) => ({ l: e, dato: 'enemigo' as const }))]);
    llegaron = [];
    for (const { l, dato } of orden) {
      if (!vivo(l)) continue;
      if (dato === 'heroe') {
        if (noActua(l) || l.desterrado || !s.enemigos.some(vivo)) continue;
        actuarHeroe(l);
        if (seRetiraElJefe()) return { s, gana: true };
      } else {
        if (!hs.some(enCampo)) continue;
        actuarEnemigo(l);
      }
    }
    for (const e of llegaron) if (vivo(e) && hs.some(enCampo)) actuarEnemigo(e);
    // Se acabó la horda: sale el jefe (actúa desde el turno siguiente).
    if (!s.enemigos.some(vivo) && !D.jefe_con_horda) {
      sumarEnemigo(s, D, D.jefe.enemigo, D.jefe.nivel);
      continue;
    }
    finDeTurno(s);
    if (!hs.some(vivo)) return { s, gana: false };
    for (const l of [...hs, ...s.enemigos].filter((x) => vivo(x) && x.envenenado && sufreAlFinal(alEmpezar, x, 'envenenado'))) {
      tickVeneno(l, l.lado === 'enemigo' && !!D.enemigos[l.clave]?.jefe && l.clon === undefined);
      if (!vivo(l) && l.lado === 'enemigo') cae(l);
    }
    if (!hs.some(vivo)) return { s, gana: false };
    if (seRetiraElJefe()) return { s, gana: true };
    evaporarClones(s);
    const a = D.ayuda;
    if (a && vanPerdiendo(hs, a.umbral) && Math.random() < a.cae) s.mochila[a.objeto] = (s.mochila[a.objeto] ?? 0) + 1;
  }
  return { s, gana: false };
}

/** Juega `N` peleas: cuántas gana y, en las que gana, con cuánta vida termina y con qué nivel. */
export function sim(D: DatosBatalla, listo: boolean, N = 2000, esencias = true) {
  let gana = 0;
  let vida = 0;
  const niveles: Record<string, number> = {};
  for (let i = 0; i < N; i++) {
    const r = pelea(D, listo, esencias);
    if (!r.gana) continue;
    gana++;
    vida += r.s.heroes.reduce((n, h) => n + h.ps / h.psMax, 0) / r.s.heroes.length;
    r.s.heroes.forEach((h) => (niveles[h.clave] = (niveles[h.clave] ?? 0) + h.nivel));
  }
  return { gana: gana / N, vida: vida / gana, niveles: Object.fromEntries(Object.entries(niveles).map(([k, n]) => [k, n / gana])) };
}

/** Para calibrar a mano: los dos jugadores en una pelea. */
export const informe = (D: DatosBatalla) => ({ descuidado: sim(D, false), atento: sim(D, true) });

/**
 * La ropa con que empieza cada partida (`puesto_<héroe>_<espacio>` de variables.json): Cami con su traje y su placa,
 * Rikka con sus prendas y su flor, Jair con sus lentes. Las peleas de la historia se miden con ella puesta.
 */
export const ROPA_DE_INICIO: Record<string, string[]> = {};
for (const [k, v] of Object.entries(variables as Record<string, unknown>)) {
  const m = k.match(/^puesto_(.+)_(cabeza|traje|pies|amuleto)$/);
  if (m && typeof v === 'string' && v) (ROPA_DE_INICIO[m[1]] ??= []).push(v);
}
/** La pelea con la ropa de inicio puesta (sin pisar el equipo fijo que ya traiga, como el del torneo). */
export const conRopa = (D: DatosBatalla): DatosBatalla => (D.equipo_fijo ? D : { ...D, equipo_fijo: ROPA_DE_INICIO });

