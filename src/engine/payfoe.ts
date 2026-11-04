// PayFoe: la billetera del jugador, fuera de las partidas (diseño en docs/BIBLIA_RPG.md, sección 17).
// - Cada partida tiene su billetera (`monedas`); PayFoe es otra, global, con tope de 999.999 tokens.
// - Se transfiere de la partida a PayFoe, nunca al revés.
// - Contra la duplicación (guardar, transferir, cargar el guardado viejo y volver a transferir): cada partida tiene un
//   `partida_id` y un contador `tokens_ganados` que solo sube; PayFoe anota cuánto recibió de cada partida y solo deja
//   transferir lo ganado que todavía no se transfirió.
import type { Vars } from './types';

/** El máximo que puede tener PayFoe. Lo más caro cuesta 1.000.000: nunca se compra (es el chiste). */
export const TOPE_PAYFOE = 999_999;

export interface PayFoe {
  saldo: number;
  /** Cuánto recibió de cada partida (`partida_id` → tokens). */
  recibido: Record<string, number>;
}

export const PAYFOE_INICIAL: PayFoe = { saldo: 0, recibido: {} };

/** Un número para la partida nueva (no tiene que ser secreto: solo distinto). */
export const nuevoIdPartida = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Las variables después de un cambio, con lo que subieron las monedas sumado a `tokens_ganados`. */
export function conGanados(antes: Vars, despues: Vars): Vars {
  const suba = num(despues.monedas) - num(antes.monedas);
  if (suba <= 0) return despues;
  return { ...despues, tokens_ganados: num(antes.tokens_ganados) + suba };
}

/** Cuánto se puede transferir de esta partida a PayFoe ahora (lo que hay, lo no transferido y el lugar que queda). */
export function transferible(vars: Vars, p: PayFoe): number {
  const id = typeof vars.partida_id === 'string' ? vars.partida_id : '';
  const pendiente = num(vars.tokens_ganados) - num(id ? p.recibido[id] : 0);
  return Math.max(0, Math.min(num(vars.monedas), pendiente, TOPE_PAYFOE - p.saldo));
}

/** Transfiere `n` tokens (sin pasarse de lo transferible): las variables y PayFoe como quedan. */
export function transferir(vars: Vars, p: PayFoe, n: number): { vars: Vars; payfoe: PayFoe; transferido: number } {
  const id = typeof vars.partida_id === 'string' && vars.partida_id ? vars.partida_id : nuevoIdPartida();
  const conId = { ...vars, partida_id: id };
  const t = Math.max(0, Math.min(Math.floor(n), transferible(conId, p)));
  return {
    vars: { ...conId, monedas: num(vars.monedas) - t },
    payfoe: { saldo: p.saldo + t, recibido: { ...p.recibido, [id]: num(p.recibido[id]) + t } },
    transferido: t,
  };
}

/** Suma a PayFoe (premios del torneo): lo que pase del tope se pierde. Devuelve también lo perdido. */
export function acreditar(p: PayFoe, n: number): { payfoe: PayFoe; perdido: number } {
  const entra = Math.max(0, Math.min(Math.floor(n), TOPE_PAYFOE - p.saldo));
  return { payfoe: { ...p, saldo: p.saldo + entra }, perdido: Math.max(0, Math.floor(n) - entra) };
}
