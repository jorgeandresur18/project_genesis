// El guardado seguro: nunca rompe el juego (docs/CRONOGRAMA.md, «Robustez»).
// - Leer o escribir en localStorage puede fallar: modo privado, almacenamiento bloqueado o lleno. Aquí nada lanza un
//   error: si no se puede escribir, se avisa (evento `genesis:guardado-fallo`) y el juego sigue.
// - Si lo guardado está corrupto (no es JSON), no se pierde: se copia aparte (`<clave>:corrupto`) y se usa el último
//   respaldo bueno (`<clave>:respaldo`, que se toma al abrir el juego, una vez por sesión). Si no hay respaldo, el juego
//   arranca de cero, pero lo corrupto queda guardado para poder recuperarlo a mano.
// - `sanear` limpia lo que se carga: lo que no tiene la forma esperada vuelve a su valor por defecto, sin tirar lo demás.
import type { StateStorage } from 'zustand/middleware';

export const EVENTO_FALLO = 'genesis:guardado-fallo';

/** El localStorage, si existe y se puede usar (puede tirar un error con solo tocarlo). */
function almacen(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const esJson = (raw: string) => {
  try {
    JSON.parse(raw);
    return true;
  } catch {
    return false;
  }
};

let respaldoTomado = false;
let falloAvisado = false;

export const almacenSeguro: StateStorage = {
  getItem: (clave) => {
    const ls = almacen();
    if (!ls) return null;
    try {
      const raw = ls.getItem(clave);
      if (raw === null) return null;
      if (esJson(raw)) {
        // Una copia de lo último bueno, al abrir el juego (antes de que esta sesión escriba nada).
        if (!respaldoTomado) {
          respaldoTomado = true;
          try {
            ls.setItem(`${clave}:respaldo`, raw);
          } catch {
            // Sin espacio para el respaldo: no importa, lo principal sigue.
          }
        }
        return raw;
      }
      // Corrupto: se aparta (no se pisa nunca) y se usa el respaldo, si sirve.
      try {
        if (ls.getItem(`${clave}:corrupto`) === null) ls.setItem(`${clave}:corrupto`, raw);
      } catch {
        // Sin espacio: igual seguimos.
      }
      const respaldo = ls.getItem(`${clave}:respaldo`);
      return respaldo !== null && esJson(respaldo) ? respaldo : null;
    } catch {
      return null;
    }
  },
  setItem: (clave, valor) => {
    try {
      almacen()?.setItem(clave, valor);
      falloAvisado = false;
    } catch {
      // Una vez por racha de fallos, para no llenar la pantalla de avisos.
      if (!falloAvisado && typeof window !== 'undefined') {
        falloAvisado = true;
        window.dispatchEvent(new Event(EVENTO_FALLO));
      }
    }
  },
  removeItem: (clave) => {
    try {
      almacen()?.removeItem(clave);
    } catch {
      // Nada que hacer.
    }
  },
};

const esObjeto = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const esNumero = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);

/**
 * Lo cargado, limpio: cada campo que no tiene el tipo del valor por defecto vuelve al de por defecto (un objeto
 * donde va un objeto, una lista donde va una lista, un número, un texto…). Las partidas guardadas que no tienen
 * escena o variables se descartan (esa casilla queda vacía), y la lista siempre tiene `espacios` casillas.
 */
export function sanear<T extends Record<string, unknown>>(cargado: unknown, porDefecto: T, espacios: number): Partial<T> {
  if (!esObjeto(cargado)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, def] of Object.entries(porDefecto)) {
    if (!(k in cargado)) continue;
    const v = cargado[k];
    if (typeof def === 'function') continue;
    if (k === 'saves') {
      const lista = Array.isArray(v) ? v : [];
      out.saves = Array.from({ length: espacios }, (_, i) => {
        const s = lista[i];
        if (!esObjeto(s) || typeof s.sceneId !== 'string' || !esObjeto(s.vars)) return null;
        return Array.isArray(s.history) ? s : { ...s, history: [] };
      });
    } else if (k === 'payfoe') {
      const p = esObjeto(v) ? v : {};
      out.payfoe = {
        saldo: esNumero(p.saldo) && p.saldo >= 0 ? Math.floor(p.saldo) : 0,
        recibido: esObjeto(p.recibido) ? Object.fromEntries(Object.entries(p.recibido).filter(([, n]) => esNumero(n))) : {},
        movimientos: Array.isArray(p.movimientos) ? p.movimientos.filter((m) => esObjeto(m) && esNumero(m.n) && esNumero(m.fecha)) : [],
      };
    } else if (def === null) {
      out[k] = v;
    } else if (Array.isArray(def)) {
      if (Array.isArray(v)) out[k] = v;
    } else if (typeof def === 'object') {
      if (esObjeto(v)) out[k] = v;
    } else if (typeof v === typeof def && (typeof v !== 'number' || Number.isFinite(v))) {
      out[k] = v;
    }
  }
  return out as Partial<T>;
}
