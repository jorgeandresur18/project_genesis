import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { assetUrl } from '../engine/assets';
import { useT } from '../engine/i18n';
import { musicaMudaPorTv } from '../engine/music';
import { cablesDeAudio, playEstatica, playTvClic, playTvEncendido } from '../engine/sound';
import { useStore } from '../engine/store';
import { TitleBackground } from './TitleBackground';

/** Canales: 0 es la entrada AUX (el juego); del 1 al 5, sin señal (nieve). */
const CANALES = 5;
/** Cuánto se ve el rótulo verde (AUX, canal, volumen) después de tocar un botón. */
const OSD_MS = 2600;
const APAGAR_MS = 1500;
const ENCENDER_MS = 650;

/**
 * Filtro TV CRT (Opciones): la partida dentro de un televisor de tubo de los 90, gris oscuro, con la pantalla en
 * 4:3 un poco curva, líneas de barrido, un leve desenfoque y parpadeo. Abajo, el parlante, las entradas de video y
 * audio con sus cables, el logo y los botones, que funcionan: POWER apaga y prende la pantalla (como un tubo; apagado, el juego no se oye), VOL
 * sube y baja el volumen del juego (barras verdes) y CH y TV/VIDEO cambian entre la entrada AUX (el juego) y 5
 * canales sin señal. En el celular no hay televisor: la pantalla en 4:3 con el efecto y dos barras a los costados
 * con el logo. Los paneles (Opciones, Boringram…) se abren por encima y el menú del título no cambia.
 *
 * Siempre está montado (apagado, `activo` en falso, no se ve): así prenderlo en plena partida no reinicia nada.
 */
export function TvViejo({ activo, children }: { activo: boolean; children: ReactNode }) {
  const t = useT();
  const pantalla = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [encendida, setEncendida] = useState(true);
  const [transicion, setTransicion] = useState<null | 'apagando' | 'encendiendo'>(null);
  const [canal, setCanal] = useState(0);
  const [osd, setOsd] = useState<null | { tipo: 'canal' | 'volumen'; n: number }>(null);
  const volumen = useStore((s) => (s.settings.muted ? 0 : s.settings.musicVolume));
  const efecto = useStore((s) => s.settings.tvEfecto !== false);
  const fondo = useStore((s) => s.settings.tvFondo ?? 'cuarto');
  // Los cables de las entradas: se desenchufan con un clic (y se vuelven a enchufar). Video: sin imagen (queda el
  // rótulo AUX). Audio izquierdo (blanco) y derecho (rojo): sin ese lado.
  const [cables, setCables] = useState({ video: true, izq: true, der: true });
  const [brilla, setBrilla] = useState(0);

  // El juego está pensado para la ventana entera: dentro del televisor se achica en proporción a la pantalla
  // (la letra base y el zoom de los sprites; los efectos se ubican igual que siempre).
  useEffect(() => {
    const raiz = document.documentElement;
    const el = pantalla.current;
    if (!activo || !el) {
      raiz.style.removeProperty('font-size');
      setEscala(1);
      return;
    }
    const medir = () => {
      const s = Math.min(1, Math.max(0.55, el.getBoundingClientRect().height / window.innerHeight));
      setEscala(s);
      raiz.style.fontSize = `${s * 100}%`;
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    window.addEventListener('resize', medir);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', medir);
      raiz.style.removeProperty('font-size');
    };
  }, [activo]);

  // Apagado, el juego no se oye: silencia el sonido y, al prenderlo, lo devuelve (solo si lo silenció el televisor).
  const silencioDelTv = useRef(false);
  const devolverSonido = () => {
    if (!silencioDelTv.current) return;
    silencioDelTv.current = false;
    useStore.getState().setSettings({ muted: false });
  };
  // Al apagar el filtro (o salir de la partida), el televisor vuelve a estar prendido, en AUX y con sonido.
  useEffect(() => {
    if (activo) return;
    setEncendida(true);
    setCanal(0);
    setOsd(null);
    setCables({ video: true, izq: true, der: true });
    devolverSonido();
  }, [activo]);
  useEffect(() => devolverSonido, []);

  // El rótulo verde se va solo.
  useEffect(() => {
    if (!osd) return;
    const id = setTimeout(() => setOsd(null), OSD_MS);
    return () => clearTimeout(id);
  }, [osd]);

  // Sin un cable de audio, ese lado no suena (al apagar el filtro, todo vuelve a sonar).
  useEffect(() => {
    cablesDeAudio(!activo || cables.izq, !activo || cables.der);
  }, [activo, cables.izq, cables.der]);
  useEffect(() => () => cablesDeAudio(true, true), []);
  const tirar = (k: 'video' | 'izq' | 'der') => {
    playTvClic();
    setCables((c) => ({ ...c, [k]: !c[k] }));
  };
  const sinVideo = !cables.video && canal === 0;

  // En un canal sin señal suena la nieve y no la música del juego.
  const nieve = activo && encendida && canal > 0;
  useEffect(() => (nieve ? playEstatica() : undefined), [nieve]);
  useEffect(() => {
    musicaMudaPorTv(activo && canal > 0);
    return () => musicaMudaPorTv(false);
  }, [activo, canal]);

  const power = () => {
    if (transicion) return;
    if (encendida) {
      playTvEncendido(false);
      if (!useStore.getState().settings.muted) {
        silencioDelTv.current = true;
        useStore.getState().setSettings({ muted: true });
      }
      setOsd(null);
      setTransicion('apagando');
      setTimeout(() => {
        setEncendida(false);
        setTransicion(null);
      }, APAGAR_MS);
    } else {
      devolverSonido();
      playTvEncendido(true);
      setEncendida(true);
      setTransicion('encendiendo');
      setTimeout(() => {
        setTransicion(null);
        setOsd({ tipo: 'canal', n: canal });
      }, ENCENDER_MS);
    }
  };
  const cambiarCanal = (n: number) => {
    if (!encendida || transicion) return;
    playTvClic();
    setCanal(n);
    setOsd({ tipo: 'canal', n });
  };
  const subirVolumen = (paso: number) => {
    if (!encendida || transicion) return;
    playTvClic();
    const { settings, setSettings } = useStore.getState();
    const v = Math.round(Math.min(1, Math.max(0, (settings.muted ? 0 : settings.musicVolume) + paso)) * 10) / 10;
    // Sube o baja la música y los efectos juntos (como el volumen de un televisor).
    setSettings({ musicVolume: v, sfxVolume: v, muted: false });
    setOsd({ tipo: 'volumen', n: v });
  };

  const barra = (
    <div className="tv-barra" aria-hidden>
      {/* El logo flota despacio y un brillo metálico lo recorre. */}
      <span className="tv-barra-logo">
        <img src={assetUrl('marca/logo_tv.webp')} alt="" draggable={false} />
        <i className="tv-brillo" />
      </span>
    </div>
  );
  const boton = (texto: string, accion: () => void, clase = 'tv-boton') => (
    <button type="button" className={clase} aria-label={texto} title={texto} onClick={accion} />
  );
  return (
    <div
      className={`tv fondo-${fondo} ${activo ? '' : 'apagado'} ${efecto ? '' : 'nitido'} ${!encendida || transicion === 'apagando' ? 'tv-sin-luz' : canal > 0 ? 'tv-nieve' : ''}`}
      style={{ '--tv-escala': escala } as CSSProperties}
    >
      {/* Detrás: un color con estrellas o el cuarto de Jair (oscurecido, con la lámpara y el cielo que respiran). */}
      <div className="tv-fondo" aria-hidden>
        {/* Azul espacial y morado cósmico: el fondo del menú de inicio, más oscuro y teñido. */}
        {activo && (fondo === 'espacio' || fondo === 'cosmico') && (
          <>
            <div className="tv-fondo-titulo">
              <TitleBackground logos />
            </div>
            <i className="tv-fondo-tinte" />
          </>
        )}
        {fondo === 'cuarto' && (
          <div className="tv-cuarto">
            <i className="tv-cuarto-cielo" />
            <i className="tv-cuarto-lampara" />
          </div>
        )}
      </div>
      {barra}
      <div className="tv-caja">
        <div
          className={`tv-pantalla ${encendida ? '' : 'sin-imagen'} ${transicion ?? ''} ${canal > 0 ? 'sin-senal' : ''}`}
          ref={pantalla}
        >
          <div className="tv-imagen">{children}</div>
          {/* Sin el cable de video: la pantalla en negro (el juego sigue y se oye) y el rótulo AUX fijo. */}
          {encendida && sinVideo && <span className="tv-sin-video" aria-hidden />}
          {/* Un canal sin señal: nieve encima del juego (que sigue ahí, en AUX). */}
          {encendida && canal > 0 && <span className="nodata tv-estatica" aria-hidden />}
          {encendida && sinVideo && !transicion && !osd && <b className="tv-osd tv-osd-fijo">AUX</b>}
          {osd && (
            <div className="tv-osd" aria-live="polite">
              {osd.tipo === 'canal' ? (
                <b>{osd.n === 0 ? 'AUX' : `CH ${String(osd.n).padStart(2, '0')}`}</b>
              ) : (
                <>
                  <b>{t('tv.volumen')}</b>
                  <span className="tv-osd-barras">
                    {Array.from({ length: 20 }, (_, i) => (
                      <i key={i} className={i < Math.round(volumen * 20) ? 'llena' : ''} />
                    ))}
                  </span>
                </>
              )}
            </div>
          )}
          <div className="tv-crt" aria-hidden />
        </div>
        <div className="tv-panel">
          <span className="tv-izquierda">
            <span className="tv-parlante" />
            {/* Las entradas de video y audio, con sus cables enchufados (por ahí entra el juego), y los audífonos. */}
            <span className="tv-entradas">
              <span className="tv-jack">
                <button type="button" className={`tv-rca amarillo ${cables.video ? '' : 'suelto'}`} aria-label="VIDEO" aria-pressed={cables.video} onClick={() => tirar('video')} />
                <small>VIDEO</small>
              </span>
              <span className="tv-jack">
                <span className="tv-par">
                  <button type="button" className={`tv-rca blanco ${cables.izq ? '' : 'suelto'}`} aria-label="AUDIO L" aria-pressed={cables.izq} onClick={() => tirar('izq')} />
                  <button type="button" className={`tv-rca rojo ${cables.der ? '' : 'suelto'}`} aria-label="AUDIO R" aria-pressed={cables.der} onClick={() => tirar('der')} />
                </span>
                <small>L-AUDIO-R</small>
              </span>
              <span className="tv-jack">
                <i className="tv-audifonos" />
                <small>PHONES</small>
              </span>
            </span>
          </span>
          {/* El emblema: al tocarlo brilla como una chapa de metal. */}
          <button type="button" className="tv-emblema" aria-label="PROJECT GENESIS" onClick={() => setBrilla((n) => n + 1)}>
            <img className="tv-logo" src={assetUrl('marca/logo_tv.webp')} alt="" draggable={false} />
            {brilla > 0 && <i key={brilla} className="tv-emblema-brillo" />}
          </button>
          <span className="tv-botones">
            <span className="tv-control">
              <span className="tv-par">
                {boton(`${t('tv.volumen')} −`, () => subirVolumen(-0.1))}
                {boton(`${t('tv.volumen')} +`, () => subirVolumen(0.1))}
              </span>
              <small>− VOL +</small>
            </span>
            <span className="tv-control">
              <span className="tv-par">
                {boton(`${t('tv.canal')} −`, () => cambiarCanal((canal + CANALES) % (CANALES + 1)))}
                {boton(`${t('tv.canal')} +`, () => cambiarCanal((canal + 1) % (CANALES + 1)))}
              </span>
              <small>− CH +</small>
            </span>
            <span className="tv-control">
              {boton('TV/VIDEO', () => cambiarCanal(canal === 0 ? 1 : 0))}
              <small>TV/VIDEO</small>
            </span>
            <span className="tv-control">
              <span className="tv-par">
                {boton('POWER', power, 'tv-encendido')}
                <i className={`tv-led ${encendida ? 'prendida' : ''}`} aria-hidden />
              </span>
              <small>POWER</small>
            </span>
          </span>
        </div>
      </div>
      {barra}
    </div>
  );
}
