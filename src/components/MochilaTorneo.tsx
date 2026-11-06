// La preparación del torneo (decisiones del autor, 2026-11-06): antes de la primera ronda se equipa a cada peleador
// (con la ropa de la mochila principal, o se deja la de fábrica) y se arma la mochila de combate, que sale de la
// principal y tiene un tope. Las cuentas están en engine/mochilaTorneo.ts; aquí solo se muestran.
import { useState } from 'react';
import { useT, useLang } from '../engine/i18n';
import { useStore } from '../engine/store';
import { playSelect } from '../engine/sound';
import { FICHAS } from '../engine/batallas';
import { ESPACIOS } from '../engine/equipo';
import { TORNEO, fichaPeleador } from '../engine/torneo';
import { TOPE_COMBATE, esGastable, piezas } from '../engine/mochilaTorneo';
import { objetoEn } from '../engine/rpgTexto';

export function PreparacionTorneo({ peleadores, tope = TOPE_COMBATE, onListo, onVolver }: { peleadores: string[]; tope?: number; onListo: (combate: Record<string, number>) => void; onVolver: () => void }) {
  const t = useT();
  const lang = useLang();
  const torneo = useStore((s) => s.torneo);
  const [combate, setCombate] = useState<Record<string, number>>({});
  const nombre = (id: string) => objetoEn(lang, id, FICHAS.objetos[id]).nombre;
  const enMochila = Object.entries(torneo.mochila ?? {}).filter(([, n]) => n > 0);
  const gastables = enMochila.filter(([id]) => esGastable(FICHAS.objetos[id]));
  const llevo = Object.values(combate).reduce((a, b) => a + b, 0);
  return (
    <section className="torneo-mochila">
      <h3>{t('torneo.preparacion')}</h3>
      {/* La ropa de cada peleador: la de fábrica, o la de la mochila principal. */}
      <h4>{t('torneo.equipar')}</h4>
      {[...new Set(peleadores)].map((k) => {
        const puesto = piezas(k, torneo);
        const fabrica = (TORNEO.equipo_peleadores[k] as string[] | undefined) ?? [];
        return (
          <div key={k} className="torneo-ropa">
            <b>{fichaPeleador(k).nombre}</b>
            {ESPACIOS.map((e) => {
              const opciones = [...new Set([puesto[e], ...fabrica, ...enMochila.map(([id]) => id)].filter((id): id is string => !!id && FICHAS.objetos[id]?.espacio === e))];
              return (
                <label key={e}>
                  <span>{t(`equipo.${e}`)}</span>
                  <select
                    value={puesto[e] ?? ''}
                    onChange={(ev) => {
                      playSelect();
                      const id = ev.target.value;
                      if (id) useStore.getState().ponerPrendaTorneo(k, id);
                      else useStore.getState().sacarPrendaTorneo(k, e);
                    }}
                  >
                    <option value="">{t('equipo.vacio')}</option>
                    {opciones.map((id) => (
                      <option key={id} value={id}>
                        {nombre(id)}
                      </option>
                    ))}
                  </select>
                </label>
              );
            })}
            <button
              onClick={() => {
                playSelect();
                useStore.getState().restaurarEquipoTorneo(k);
              }}
            >
              {t('torneo.restaurar')}
            </button>
          </div>
        );
      })}
      {/* La mochila de combate: sale de la principal, con tope; en el torneo nadie regala nada. */}
      <h4>{t('torneo.combate', { n: llevo, max: tope })}</h4>
      {gastables.length ? (
        gastables.map(([id, max]) => {
          const n = combate[id] ?? 0;
          return (
            <div key={id} className="torneo-combate">
              <span>
                {nombre(id)} <small>({t('torneo.en_mochila', { n: max })})</small>
              </span>
              <button aria-label={t('torneo.menos')} disabled={n <= 0} onClick={() => setCombate({ ...combate, [id]: n - 1 })}>
                −
              </button>
              <b>{n}</b>
              <button aria-label={t('torneo.mas')} disabled={n >= max || llevo >= tope} onClick={() => setCombate({ ...combate, [id]: n + 1 })}>
                +
              </button>
            </div>
          );
        })
      ) : (
        <p className="muted">{t('torneo.mochila_vacia')}</p>
      )}
      <div className="torneo-opciones">
        <button
          onClick={() => {
            playSelect();
            onVolver();
          }}
        >
          {t('torneo.volver')}
        </button>
        <button
          className="torneo-empezar"
          onClick={() => {
            playSelect();
            onListo(combate);
          }}
        >
          {t('torneo.a_pelear')}
        </button>
      </div>
    </section>
  );
}
