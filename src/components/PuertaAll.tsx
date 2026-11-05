import { useState, type FormEvent } from 'react';
import { abrirAll, pinCorrecto } from '../engine/puerta';

/** Pantalla de /all en lo publicado: pide el PIN del autor. Con el correcto, recarga y entra con todo prendido. */
export function PuertaAll() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const entrar = async (e: FormEvent) => {
    e.preventDefault();
    if (await pinCorrecto(pin)) {
      abrirAll();
      location.reload();
      return;
    }
    setError(true);
    setPin('');
  };
  return (
    <main className="puerta-all">
      <form onSubmit={(e) => void entrar(e)}>
        <label htmlFor="puerta-pin">PIN de acceso</label>
        <input
          id="puerta-pin"
          type="password"
          inputMode="numeric"
          autoComplete="off"
          autoFocus
          maxLength={4}
          value={pin}
          onChange={(e) => {
            setError(false);
            setPin(e.target.value.replace(/\D/g, ''));
          }}
        />
        <button type="submit" disabled={pin.length !== 4}>
          Entrar
        </button>
        {error && <p role="alert">PIN incorrecto.</p>}
        <a href="./">Ir al juego</a>
      </form>
    </main>
  );
}
