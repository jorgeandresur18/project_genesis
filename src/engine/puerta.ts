// La puerta de /all en lo publicado: pide un PIN que solo sabe el autor (decisión del autor, 2026-11-05).
// Aquí está solo su huella (SHA-256), porque el repositorio es público: el número no se escribe en ningún archivo, commit
// ni documento. Sirve para que nadie entre por casualidad, no como seguridad: todo corre en el navegador del jugador.

const SAL = 'project-genesis:all:';
const HUELLA = '5986453792c7102410585bc53649af3e35cf11de88348e8e48137e3462fea0c7';
const CLAVE = 'genesis-all-abierto';

/** La huella de un PIN. */
export async function huellaPin(pin: string): Promise<string> {
  const datos = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SAL + pin));
  return [...new Uint8Array(datos)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const pinCorrecto = async (pin: string) => (await huellaPin(pin)) === HUELLA;

/** Si este navegador ya puso el PIN. */
export function allAbierto(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(CLAVE) === HUELLA;
  } catch {
    return false;
  }
}

/** Recuerda en este navegador que ya se puso el PIN. */
export function abrirAll() {
  try {
    localStorage.setItem(CLAVE, HUELLA);
  } catch {
    // Sin almacenamiento: lo pedirá otra vez.
  }
}
