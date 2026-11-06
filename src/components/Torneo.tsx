// El Torneo Genesis (docs/BIBLIA_RPG.md, sección 17; datos de relleno en src/data/rpg/torneo.json): se elige la copa,
// la modalidad (simple, doble o triple) y los peleadores; después, cuatro rondas seguidas hasta la final contra Nikki.
// Cada ronda ganada paga tokens a PayFoe; si se pierde, se queda eliminado pero lo ganado se queda.
import { useState } from 'react';
import { Panel } from './Panels';
import { Batalla } from './Batalla';
import { useT } from '../engine/i18n';
import { useStore } from '../engine/store';
import { playSelect } from '../engine/sound';
import { HEROES_TORNEO, JEFES_TORRE, NIKKI_PELEADORA, REY_PELEADOR, TORNEO, peleadorAbierto, armarRonda, copaAbierta, fichaPeleador, premioDe, type Copa, type Modalidad } from '../engine/torneo';
import { nuevaSemilla } from '../engine/esencia';
import { GALERIA_COMPLETA } from '../engine/modo';

type Fase = { paso: 'menu' } | { paso: 'pelea'; ronda: number } | { paso: 'ronda'; ronda: number; premio: number } | { paso: 'fin'; gano: boolean };

export function TorneoPantalla({ onClose }: { onClose: () => void }) {
  const t = useT();
  const visitadas = useStore((s) => s.snapshots);
  const torneo = useStore((s) => s.torneo);
  const saves = useStore((s) => s.saves);
  const [copa, setCopa] = useState<Copa | null>(null);
  const [modalidad, setModalidad] = useState<Modalidad>(TORNEO.modalidades[0]);
  const [elegidos, setElegidos] = useState<string[]>(['jair']);
  const [fase, setFase] = useState<Fase>({ paso: 'menu' });
  const [ganado, setGanado] = useState(0);
  // Las esencias de este torneo: se sortean al empezarlo (otro torneo, otras).
  const [semilla, setSemilla] = useState(nuevaSemilla);
  // Los peleadores: los que la historia ya desbloqueó (Jair siempre; los demás, desde que pelearon en alguna partida) y
  // los jefes de la torre ya vencidos (decisión del autor, 2026-11-05).
  const disponibles = [
    // Cada uno, después de su pelea RPG en la historia (decisión del autor, 2026-11-06; ver torneo.json).
    ...HEROES_TORNEO.filter((k) => GALERIA_COMPLETA || peleadorAbierto(k, visitadas)),
    ...JEFES_TORRE.filter((k) => GALERIA_COMPLETA || torneo.jefes?.[k]),
    ...[NIKKI_PELEADORA, REY_PELEADOR].filter((k) => GALERIA_COMPLETA || peleadorAbierto(k, visitadas)),
  ];
  const abierta = (c: Copa) => GALERIA_COMPLETA || copaAbierta(c, visitadas, torneo.ganadas);
  const listos = elegidos.length === modalidad.peleadores;

  if (fase.paso === 'pelea' && copa) {
    const final = fase.ronda === TORNEO.rondas.length - 1;
    return (
      <Batalla
        key={`${copa.id}-${fase.ronda}`}
        id="torneo"
        datos={armarRonda(copa, fase.ronda, modalidad, elegidos, torneo.defensas, semilla)}
        onGanar={() => {
          const entro = useStore.getState().premioTorneo(premioDe(copa, fase.ronda, modalidad));
          setGanado((g) => g + entro);
          if (final) useStore.getState().ganarCopa(copa.id);
          setFase({ paso: 'ronda', ronda: fase.ronda, premio: entro });
        }}
        onPerder={() => setFase({ paso: 'fin', gano: false })}
      />
    );
  }

  // La bomba ganada espera hasta que se elija a qué partida va (el torneo está fuera de las partidas).
  const bombas = torneo.bombas ?? 0;
  const premioBomba =
    bombas > 0 && fase.paso !== 'ronda' ? (
      <div className="torneo-bomba">
        <h4>{t('torneo.bomba', { n: bombas })}</h4>
        {saves.some(Boolean) ? (
          <div className="torneo-opciones">
            {saves.map((p, i) =>
              p ? (
                <button key={i} onClick={() => useStore.getState().darBombaAPartida(i)}>
                  {p.nombre ?? p.date}
                </button>
              ) : null,
            )}
          </div>
        ) : (
          <p className="muted">{t('torneo.bomba_sin_partida')}</p>
        )}
      </div>
    ) : null;

  return (
    <Panel title={t('torneo.titulo')} onClose={onClose}>
      <div className="torneo">
        {premioBomba}
        {fase.paso === 'menu' && (
          <>
            <p className="muted">{t('torneo.intro')}</p>
            <h4>{t('torneo.copa')}</h4>
            <div className="torneo-opciones">
              {TORNEO.copas.map((c) => (
                <button
                  key={c.id}
                  className={copa?.id === c.id ? 'active' : ''}
                  disabled={!abierta(c)}
                  onClick={() => {
                    playSelect();
                    setCopa(c);
                  }}
                >
                  <b>{abierta(c) ? c.nombre : '???'}</b>
                  <small>{abierta(c) ? t('torneo.nivel', { n: c.nivel }) : t('torneo.cerrada')}</small>
                  {(torneo.ganadas[c.id] ?? 0) > 0 && <small className="torneo-ganada">{t('torneo.ganada', { n: torneo.ganadas[c.id] })}</small>}
                </button>
              ))}
            </div>
            <h4>{t('torneo.modalidad')}</h4>
            <div className="torneo-opciones">
              {TORNEO.modalidades.map((m) => (
                <button
                  key={m.id}
                  className={modalidad.id === m.id ? 'active' : ''}
                  onClick={() => {
                    playSelect();
                    setModalidad(m);
                    setElegidos((e) => e.slice(0, m.peleadores));
                  }}
                >
                  <b>{m.nombre}</b>
                  <small>{t('torneo.peleadores', { n: m.peleadores })}</small>
                </button>
              ))}
            </div>
            <h4>{t('torneo.equipo', { n: modalidad.peleadores })}</h4>
            <div className="torneo-opciones">
              {/* Se puede repetir personaje (decisión del autor): tocar suma uno más al equipo. */}
              {disponibles.map((k) => {
                const veces = elegidos.filter((x) => x === k).length;
                return (
                  <button
                    key={k}
                    className={veces ? 'active' : ''}
                    disabled={elegidos.length >= modalidad.peleadores}
                    onClick={() => {
                      playSelect();
                      setElegidos((e) => (e.length < modalidad.peleadores ? [...e, k] : e));
                    }}
                  >
                    <b>{fichaPeleador(k).nombre}</b>
                    {veces > 1 && <small>×{veces}</small>}
                  </button>
                );
              })}
            </div>
            {elegidos.length > 0 && (
              <>
                <h4>{t('torneo.tu_equipo')}</h4>
                <div className="torneo-opciones">
                  {elegidos.map((k, i) => (
                    <button
                      key={`${k}-${i}`}
                      className="active"
                      onClick={() => {
                        playSelect();
                        setElegidos((e) => e.filter((_, j) => j !== i));
                      }}
                      aria-label={t('torneo.quitar', { nombre: fichaPeleador(k).nombre })}
                    >
                      <b>{fichaPeleador(k).nombre}</b>
                      <small>✕</small>
                    </button>
                  ))}
                </div>
              </>
            )}
            {copa && (
              <p className="muted">
                {t('torneo.premios', { lista: copa.premios.map((_, i) => premioDe(copa, i, modalidad)).join(' · ') })}
              </p>
            )}
            <button
              className="torneo-empezar"
              disabled={!copa || !listos}
              onClick={() => {
                playSelect();
                setGanado(0);
                setSemilla(nuevaSemilla());
                setFase({ paso: 'pelea', ronda: 0 });
              }}
            >
              {t('torneo.empezar')}
            </button>
          </>
        )}
        {fase.paso === 'ronda' && copa && (
          <>
            <h3>{TORNEO.rondas[fase.ronda].nombre}: {t('torneo.ronda_ganada')}</h3>
            <p>{t('torneo.premio', { n: fase.premio })}</p>
            {fase.ronda < TORNEO.rondas.length - 1 ? (
              <>
                <p className="muted">{t('torneo.siguiente', { ronda: TORNEO.rondas[fase.ronda + 1].nombre })}</p>
                <button className="torneo-empezar" onClick={() => setFase({ paso: 'pelea', ronda: fase.ronda + 1 })}>
                  {t('torneo.seguir')}
                </button>
              </>
            ) : (
              <button className="torneo-empezar" onClick={() => setFase({ paso: 'fin', gano: true })}>
                {t('torneo.terminar')}
              </button>
            )}
          </>
        )}
        {fase.paso === 'fin' && (
          <>
            <h3>{t(fase.gano ? 'torneo.campeon' : 'torneo.eliminado')}</h3>
            <p>{t('torneo.total', { n: ganado })}</p>
            <button className="torneo-empezar" onClick={() => setFase({ paso: 'menu' })}>
              {t('torneo.otra')}
            </button>
          </>
        )}
      </div>
    </Panel>
  );
}
