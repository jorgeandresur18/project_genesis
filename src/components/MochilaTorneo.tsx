// La mochila del torneo y el equipo de sus peleadores (decisiones del autor, 2026-11-06). Las cuentas están en
// engine/mochilaTorneo.ts; aquí solo se muestran: qué hay en la mochila y, para cada peleador elegido, qué lleva puesto
// en cada espacio (se cambia con la ropa de la mochila o se vuelve al equipo de fábrica).
import { useT, useLang } from '../engine/i18n';
import { useStore } from '../engine/store';
import { playSelect } from '../engine/sound';
import { FICHAS } from '../engine/batallas';
import { ESPACIOS } from '../engine/equipo';
import { TORNEO, fichaPeleador } from '../engine/torneo';
import { piezas } from '../engine/mochilaTorneo';
import { objetoEn } from '../engine/rpgTexto';

export function MochilaTorneo({ peleadores }: { peleadores: string[] }) {
  const t = useT();
  const lang = useLang();
  const torneo = useStore((s) => s.torneo);
  const nombre = (id: string) => objetoEn(lang, id, FICHAS.objetos[id]).nombre;
  const enMochila = Object.entries(torneo.mochila ?? {}).filter(([, n]) => n > 0);
  const unicos = [...new Set(peleadores)];
  return (
    <section className="torneo-mochila">
      <h4>{t('torneo.mochila')}</h4>
      {enMochila.length ? (
        <div className="torneo-opciones">
          {enMochila.map(([id, n]) => (
            <span key={id} className="torneo-objeto">
              {nombre(id)} <small>×{n}</small>
            </span>
          ))}
        </div>
      ) : (
        <p className="muted">{t('torneo.mochila_vacia')}</p>
      )}
      {unicos.map((k) => {
        const puesto = piezas(k, torneo);
        const fabrica = (TORNEO.equipo_peleadores[k] as string[] | undefined) ?? [];
        return (
          <div key={k} className="torneo-ropa">
            <b>{fichaPeleador(k).nombre}</b>
            {ESPACIOS.map((e) => {
              // Lo que puede ir en este espacio: lo que lleva, lo suyo de fábrica y la ropa de la mochila.
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
    </section>
  );
}
