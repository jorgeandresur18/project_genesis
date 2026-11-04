import { useState } from 'react';
import { useStore } from '../engine/store';
import advertenciaEs from '../data/advertencia.json';
import advertenciaEn from '../data/en/advertencia.json';
import { detectLanguage, localized, useLang, useT } from '../engine/i18n';
import { enterPlayMode } from '../engine/mobile';
import { unlockAudio } from '../engine/sound';

// La advertencia de contenido del principio (ver ../App.tsx).
// Duración del fundido a negro al aceptar la advertencia.
export const WARNING_FADE_MS = 900;

export function ContentWarning({ onAccept }: { onAccept: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const still = useStore((s) => s.settings.reduceEffects);
  const lang = useLang();
  const t = useT();
  const advertencia = localized(advertenciaEs, advertenciaEn, lang);
  const language = useStore((s) => s.settings.language);
  const setSettings = useStore((s) => s.setSettings);
  const detected = detectLanguage();
  const accept = () => {
    if (leaving) return;
    // El audio y la pantalla completa solo se habilitan dentro del clic: se piden ya, antes del fundido.
    unlockAudio();
    if (useStore.getState().game) void enterPlayMode();
    setLeaving(true);
    setTimeout(onAccept, still ? 150 : WARNING_FADE_MS);
  };
  return (
    <div className={`screen warning ${leaving ? 'warning-leaving' : ''}`}>
      <div className="warning-card">
        <header className="warning-head">
          <span className="warning-badge">{advertencia.etiqueta}</span>
          <div>
            <h1>{advertencia.titulo}</h1>
            <p className="warning-rating">{advertencia.clasificacion}</p>
          </div>
        </header>
        <p className="warning-intro">{advertencia.texto}</p>
        <ul className="warning-themes">
          {advertencia.temas.map((t) => (
            <li key={t.titulo}>
              <strong>{t.titulo}</strong>
              <span>{t.detalle}</span>
            </li>
          ))}
        </ul>
        <p className="warning-note">{advertencia.nota_efectos}</p>
        <p className="warning-note">{advertencia.ficcion}</p>
        <button className="warning-accept" onClick={accept}>
          {advertencia.aceptar}
        </button>
        {/* Qué idioma se detectó y cómo cambiarlo. */}
        <div className="warning-lang">
          <span className="muted">
            {language === 'auto'
              ? t('idioma.detectado', { idioma: t(`idioma.${detected.lang}`), codigo: detected.code })
              : t('idioma.elegido', { idioma: t(`idioma.${lang}`) })}
          </span>
          <span className="segmented">
            {(['es', 'en'] as const).map((l) => (
              <button key={l} className={lang === l ? 'active' : ''} onClick={() => setSettings({ language: l })}>
                {t(`idioma.${l}`)}
              </button>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
