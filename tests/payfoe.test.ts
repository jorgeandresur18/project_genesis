// PayFoe (src/engine/payfoe.ts): la billetera del jugador, el tope y el arreglo contra la duplicación.
import { describe, expect, it } from 'vitest';
import { PAYFOE_INICIAL, TOPE_PAYFOE, acreditar, conGanados, transferible, transferir } from '../src/engine/payfoe';

const partida = { partida_id: 'p1', monedas: 500, tokens_ganados: 500 };

describe('PayFoe', () => {
  it('cuenta lo que se gana (y no lo que se gasta)', () => {
    expect(conGanados({ monedas: 10, tokens_ganados: 10 }, { monedas: 40 }).tokens_ganados).toBe(40);
    expect(conGanados({ monedas: 40, tokens_ganados: 40 }, { monedas: 25 }).tokens_ganados).toBeUndefined();
  });

  it('transfiere de la partida a PayFoe y lo descuenta de la partida', () => {
    const r = transferir(partida, PAYFOE_INICIAL, 500);
    expect(r.transferido).toBe(500);
    expect(r.vars.monedas).toBe(0);
    expect(r.payfoe.saldo).toBe(500);
    expect(r.payfoe.recibido.p1).toBe(500);
    expect(r.payfoe.movimientos?.[0]).toMatchObject({ tipo: 'transferencia', n: 500 });
  });

  it('cargar el guardado de antes de transferir no deja transferir otra vez', () => {
    const { payfoe } = transferir(partida, PAYFOE_INICIAL, 500);
    // El guardado viejo sigue con sus 500 tokens, pero ya figuran como transferidos.
    expect(transferible(partida, payfoe)).toBe(0);
    expect(transferir(partida, payfoe, 500).transferido).toBe(0);
    // Lo que gane después en esa partida, sí.
    const despues = conGanados(partida, { ...partida, monedas: 620 });
    expect(transferible(despues, payfoe)).toBe(120);
  });

  it('no pasa del tope: la transferencia se queda en la partida y el premio que sobra se pierde', () => {
    const casiLleno = { saldo: TOPE_PAYFOE - 100, recibido: {} };
    expect(transferible(partida, casiLleno)).toBe(100);
    const r = transferir(partida, casiLleno, 500);
    expect(r.payfoe.saldo).toBe(TOPE_PAYFOE);
    expect(r.vars.monedas).toBe(400);
    const premio = acreditar(casiLleno, 300);
    expect(premio.payfoe.saldo).toBe(TOPE_PAYFOE);
    expect(premio.perdido).toBe(200);
    expect(premio.payfoe.movimientos?.[0]).toMatchObject({ tipo: 'premio', n: 100 });
  });

  it('una partida sin número (guardada antes de PayFoe) recibe uno al transferir', () => {
    const r = transferir({ monedas: 50, tokens_ganados: 50 }, PAYFOE_INICIAL, 50);
    expect(typeof r.vars.partida_id).toBe('string');
    expect(r.payfoe.recibido[r.vars.partida_id as string]).toBe(50);
  });
});
