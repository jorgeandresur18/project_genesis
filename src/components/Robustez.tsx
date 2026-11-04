// Robustez (docs/CRONOGRAMA.md): que un error no deje la pantalla en blanco y que el jugador sepa si no se pudo guardar.
// - `ErrorBoundary`: si algo del juego falla al dibujarse, en vez de una pantalla en blanco sale un aviso dentro del
//   mundo del juego, con «Volver al menú» (sin tocar las partidas guardadas) y «Recargar».
// - `AvisoGuardado`: si el navegador no deja guardar (sin espacio, modo privado), avisa una vez; el juego sigue.
import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { useStore } from '../engine/store';
import { resolveLang, translate, useT } from '../engine/i18n';
import { EVENTO_FALLO } from '../engine/guardado';

/** Traduce sin hooks (la pantalla de error no puede depender de que React siga bien). */
function t(key: string) {
  let lang: 'es' | 'en' = 'es';
  try {
    lang = resolveLang(useStore.getState().settings.language);
  } catch {
    // Si ni el estado responde, español.
  }
  return translate(lang, key);
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; intento: number }> {
  state = { error: null as Error | null, intento: 0 };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Para quien abra la consola (y para reportarlo).
    console.error('PROJECT GENESIS: error en la interfaz', error, info.componentStack);
  }

  private volverAlMenu = () => {
    try {
      useStore.getState().quitToTitle();
    } catch {
      // Si el estado también falla, al menos se intenta dibujar de nuevo.
    }
    // Una clave nueva vuelve a montar todo desde cero.
    this.setState((s) => ({ error: null, intento: s.intento + 1 }));
  };

  render() {
    if (!this.state.error) return <div key={this.state.intento} className="robustez-raiz">{this.props.children}</div>;
    return (
      <div className="error-pantalla" role="alertdialog" aria-labelledby="error-titulo">
        <div className="error-caja">
          <small className="error-voz">{t('error.voz')}</small>
          <h2 id="error-titulo">{t('error.titulo')}</h2>
          <p>{t('error.texto')}</p>
          <p className="error-seguro">{t('error.partidas')}</p>
          <code className="error-detalle">{String(this.state.error.message || this.state.error).slice(0, 200)}</code>
          <div className="error-botones">
            <button className="menu-btn" onClick={this.volverAlMenu}>
              {t('error.menu')}
            </button>
            <button className="menu-btn" onClick={() => window.location.reload()}>
              {t('error.recargar')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

/** Aviso de que el navegador no dejó guardar (una vez por racha de fallos; ver src/engine/guardado.ts). */
export function AvisoGuardado() {
  const tr = useT();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const alFallar = () => {
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 8000);
    };
    window.addEventListener(EVENTO_FALLO, alFallar);
    return () => {
      window.removeEventListener(EVENTO_FALLO, alFallar);
      clearTimeout(timer);
    };
  }, []);
  if (!visible) return null;
  return (
    <button className="aviso-guardado" role="alert" onClick={() => setVisible(false)}>
      <b>{tr('guardado.fallo_titulo')}</b>
      <span>{tr('guardado.fallo_texto')}</span>
    </button>
  );
}
