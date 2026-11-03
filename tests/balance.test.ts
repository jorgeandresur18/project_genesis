// Balance de la pelea del Bastión: se simulan miles de peleas con dos jugadores. El descuidado solo ataca (Cami
// cuando puede, siempre al más débil; el especial, apenas lo tiene) y nunca usa la mochila; el atento cura al que
// baja del 40 % y usa los potenciadores y los recargadores. Los soldados también cargan y usan su especial. Como en el
// juego: los ataques normales a veces fallan, Cami solo descansa después de atacar, el especial de la sombra paraliza
// y, si van perdiendo, el juego ayuda (objetos que caen y más críticos). La meta (docs/SPEC.md): que el descuidado pierda casi siempre y que el atento gane casi siempre,
// pero llegando justo. Si cambias números en src/data/batallas/bastion.json y esto falla, la pelea quedó muy fácil
// o muy difícil.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CARGA, CONFUSION, cargar, crearClon, crearLuchador, dano, eligeAtaque, eligeEspecial, seConfunde, disponibles, especialListo, falla, ganarXp, golpesEspecial, seRetira, usarObjeto, vanPerdiendo, vivo, xpDe, type DatosBatalla, type Luchador } from '../src/engine/batalla';
function sim(D: DatosBatalla, listo: boolean, N = 2000) {
  let gana = 0, hpFin = 0;
  for (let s = 0; s < N; s++) {
    const hs = D.heroes.map((k) => crearLuchador(k, k, 'heroe', D.personajes[k], D.personajes[k].nivel));
    const mochila: Record<string, number> = {};
    let es: Luchador[] = []; let sal = 0; let act: string[] = []; let jefe = false; let turnos = 0; let fin = 0;
    const sacar = (c: string, n: number) => { const e = crearLuchador(c + Math.random(), c, 'enemigo', D.enemigos[c], n); e.carga = Math.floor(Math.random() * 40); es = [...es.filter(vivo), e]; };
    const pierden = () => !!D.ayuda && vanPerdiendo(hs, D.ayuda.umbral);
    const pegar = (a: Luchador, b: Luchador, poder: number, normal = true) => {
      if (normal && falla(D, a, b)) return;
      const j = D.enemigos[b.clave];
      const extra = a.lado === 'heroe' && pierden() ? D.ayuda!.critico : 0;
      b.ps = Math.max(j?.huye_a ? 1 : 0, b.ps - dano(a, b, poder, Math.random, extra).n);
      cargar(b, CARGA.recibir);
    };
    const cae = (e: Luchador) => {
      if (e.clon !== undefined) return;
      hs.filter(vivo).forEach((x) => ganarXp(x, D.personajes[x.clave], xpDe(e.nivel)));
      if (Math.random() < D.botin.probabilidad) { const k = D.botin.objetos[Math.floor(Math.random() * D.botin.objetos.length)]; mochila[k] = (mochila[k] ?? 0) + 1; }
      if (sal < D.horda.niveles.length) sacar(D.horda.enemigo, D.horda.niveles[sal++]);
    };
    for (; sal < D.horda.al_inicio; sal++) sacar(D.horda.enemigo, D.horda.niveles[sal]);
    // Sin horda: el jefe sale de entrada.
    if (!D.horda.niveles.length) { jefe = true; sacar(D.jefe.enemigo, D.jefe.nivel); }
    while (turnos < 300) {
      turnos++;
      const disp = disponibles(hs, D.personajes, act);
      // Solo atacar cansa (a Cami).
      act = [];
      const recien: Luchador[] = [];
      for (const h of disp) {
        if (!vivo(h)) continue;
        if (listo) {
          const herido = hs.filter(vivo).find((x) => x.ps < x.psMax * 0.4);
          if (herido && mochila.vida > 0) { mochila.vida--; usarObjeto(D.objetos.vida, herido); continue; }
          if (h.clave === 'cami' && mochila.atq > 0) { mochila.atq--; usarObjeto(D.objetos.atq, h); continue; }
          if (h.clave === 'jair' && mochila.def > 0) { mochila.def--; usarObjeto(D.objetos.def, h); continue; }
          if (D.personajes[h.clave].especial && !especialListo(h) && mochila.carga > 0) { mochila.carga--; usarObjeto(D.objetos.carga, h); continue; }
        }
        const e = es.filter(vivo).sort((a, b) => a.ps - b.ps)[0];
        if (!e) break;
        const esp = D.personajes[h.clave].especial;
        act.push(h.id);
        // Confundido: a veces se pega a sí mismo.
        if (seConfunde(h)) { h.ps = Math.max(0, h.ps - dano(h, h, CONFUSION.poder).n); continue; }
        if (esp && especialListo(h)) {
          h.carga = 0;
          for (const b of golpesEspecial(esp, esp.objetivo === 'todos' ? es.filter(vivo) : [e])) {
            if (!vivo(b)) continue;
            pegar(h, b, esp.poder, false);
            if (!vivo(b)) cae(b);
          }
        } else {
          cargar(h, CARGA.atacar);
          pegar(h, e, D.personajes[h.clave].ataques[0].poder);
          if (!vivo(e)) cae(e);
        }
        const j = es.find((x) => D.enemigos[x.clave].jefe && x.clon === undefined);
        if (j && seRetira(j, D.enemigos[j.clave])) { fin = 1; break; }
      }
      if (fin) break;
      if (!es.some(vivo) && !jefe) { jefe = true; sacar(D.jefe.enemigo, D.jefe.nivel); continue; }
      for (const e of es.filter(vivo)) {
        cargar(e, CARGA.turnoEnemigo);
        const vs = hs.filter(vivo); if (!vs.length) break;
        const esp = D.enemigos[e.clave].especial;
        // Su especial (o el remate contra el que está por caer) o el clon de sombra, como en el juego.
        const el = eligeEspecial(e, D.enemigos[e.clave], hs, es);
        if (el?.tipo === 'clon') {
          const c = D.enemigos[e.clave].clon!;
          e.carga = 0;
          e.ps = Math.max(1, e.ps - Math.round(e.psMax * c.costo));
          es = [...es, crearClon(e, c, 'clon' + Math.random())];
          continue;
        }
        if (el && esp) {
          e.carga = 0;
          const blanco = el.blanco ?? vs[Math.floor(Math.random() * vs.length)];
          for (const h of golpesEspecial(esp, [blanco])) if (vivo(h)) pegar(e, h, esp.poder, false);
          continue;
        }
        const at = eligeAtaque(D.enemigos[e.clave].ataques, vs);
        if (!at) continue;
        const { ataque: a, blancos: bl } = at;
        // La parálisis de pesadilla: no hace daño; reemplaza el descanso de Cami (no se suma).
        if (a.paraliza) { for (const h of bl) { h.paralizado = a.paraliza; recien.push(h); act = act.filter((id) => id !== h.id); } continue; }
        // El beso confusión: no hace daño; confunde (a veces se esquiva).
        if (a.confunde) { for (const h of bl) { h.confundido = a.confunde; recien.push(h); } continue; }
        for (const h of bl) pegar(e, h, a.poder);
      }
      if (!hs.some(vivo)) break;
      hs.forEach((h) => { if (h.paralizado && !recien.includes(h)) h.paralizado--; if (h.confundido && !recien.includes(h)) h.confundido--; });
      // Los clones se evaporan.
      es.forEach((x) => { if (x.clon !== undefined && x.ps > 0 && --x.clon <= 0) x.ps = 0; });
      if (D.ayuda && pierden() && Math.random() < D.ayuda.cae) mochila[D.ayuda.objeto] = (mochila[D.ayuda.objeto] ?? 0) + 1;
    }
    if (fin) { gana++; hpFin += hs.reduce((s, h) => s + h.ps / h.psMax, 0) / hs.length; }
  }
  return { gana: gana / N, vida: hpFin / gana };
}

/** Para calibrar a mano: `npx vitest run tests/balance.test.ts` muestra cómo quedó. */
export function informe(D: DatosBatalla) {
  return { descuidado: sim(D, false), atento: sim(D, true) };
}

describe('balance del Bastión', () => {
  const D = JSON.parse(readFileSync('src/data/batallas/bastion.json', 'utf8')) as DatosBatalla;
  it('el jugador descuidado gana pocas veces (entre 10 % y 55 %)', () => {
    const r = sim(D, false);
    console.log('balance', JSON.stringify(informe(D)));
    expect(r.gana).toBeGreaterThan(0.1);
    expect(r.gana).toBeLessThan(0.55);
  });
  it('el jugador atento gana casi siempre (75 % o más), pero termina con menos de la mitad de la vida', () => {
    const r = sim(D, true);
    expect(r.gana).toBeGreaterThan(0.75);
    expect(r.vida).toBeLessThan(0.5);
  });
});

describe('balance de Nikki en el bar (escena secreta del Capítulo 1)', () => {
  const D = JSON.parse(readFileSync('src/data/batallas/nikki.json', 'utf8')) as DatosBatalla;
  it('es muy, muy difícil ganarle: el jugador que solo ataca gana muy pocas veces (entre 2 % y 15 %; la salida es pedirle perdón)', () => {
    const r = sim(D, false);
    console.log('nikki', JSON.stringify(r));
    expect(r.gana).toBeGreaterThan(0.02);
    expect(r.gana).toBeLessThan(0.15);
  });
});
