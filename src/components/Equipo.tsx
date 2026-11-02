import { useState, type CSSProperties } from 'react';
import { Panel } from './Panels';
import { SpriteHoja } from './Batalla';
import { useT } from '../engine/i18n';
import { useStore } from '../engine/store';
import { playSelect } from '../engine/sound';
import { ataquesDe, progresoDeVars, statsEn, tipoDe, xpParaSubir, type DatosBatalla, type Heroe, type Objeto } from '../engine/batalla';

/**
 * Equipo (botón de la barra del juego): las estadísticas de cada personaje del equipo con su sprite, lo que tiene
 * equipado (cabeza, traje y amuleto) y la mochila. Todo es de la partida en curso. El equipo se compra en
 * Boringplace (por construir: por ahora los espacios están vacíos).
 */
const BATALLAS = import.meta.glob<DatosBatalla>('../data/batallas/*.json', { eager: true, import: 'default' });
/** Cada héroe y cada objeto como aparecen por primera vez en las peleas (el Bastión primero). */
const HEROES = new Map<string, Heroe>();
const OBJETOS = new Map<string, Objeto>();
for (const k of Object.keys(BATALLAS).sort((a, b) => (a.includes('bastion') ? -1 : b.includes('bastion') ? 1 : a.localeCompare(b)))) {
  const d = BATALLAS[k];
  for (const [id, h] of Object.entries(d.personajes)) if (!HEROES.has(id)) HEROES.set(id, h);
  for (const [id, o] of Object.entries(d.objetos)) if (!OBJETOS.has(id)) OBJETOS.set(id, o);
}
/** Los espacios de equipo de cada personaje (traje sirve para un vestido, una armadura o lo que lleve). */
export const ESPACIOS = ['cabeza', 'traje', 'amuleto'] as const;

export function EquipoPanel({ onClose }: { onClose: () => void }) {
  const t = useT();
  const vars = useStore((s) => s.game?.vars ?? {});
  const progreso = progresoDeVars(vars);
  const [pestana, setPestana] = useState<'personajes' | 'mochila'>('personajes');
  // El equipo: Jair siempre; los demás, desde que pelearon con él.
  const equipo = [...HEROES.keys()].filter((k) => k === 'jair' || progreso.heroes[k]);
  const mochila = Object.entries(progreso.mochila).filter(([k, n]) => n > 0 && OBJETOS.has(k));
  return (
    <Panel title={t('equipo.titulo')} onClose={onClose} wide>
      <div className="equipo-pestanas" role="tablist">
        {(['personajes', 'mochila'] as const).map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={pestana === p}
            className={pestana === p ? 'activo' : ''}
            onClick={() => {
              playSelect();
              setPestana(p);
            }}
          >
            {t(`equipo.${p}`)}
          </button>
        ))}
      </div>
      {pestana === 'personajes' ? (
        <div className="equipo-personajes">
          {equipo.map((k) => {
            const h = HEROES.get(k)!;
            const nivel = progreso.heroes[k]?.nivel || h.nivel;
            const xp = progreso.heroes[k]?.xp ?? 0;
            const s = statsEn(h.base, h.crece, nivel);
            return (
              <article key={k} className="equipo-ficha" style={{ '--c': h.especial?.color ?? '#e8e2d4' } as CSSProperties}>
                <div className="equipo-sprite">
                  <SpriteHoja src={h.sprite} anim="idle" />
                </div>
                <div className="equipo-datos">
                  <h3>
                    {h.nombre} <small>{t('batalla.nivel')} {nivel}</small>
                  </h3>
                  <dl className="equipo-stats">
                    <dt>PS</dt>
                    <dd>{s.ps}</dd>
                    <dt>ATQ</dt>
                    <dd>{s.atq}</dd>
                    <dt>DEF</dt>
                    <dd>{s.def}</dd>
                    <dt>VEL</dt>
                    <dd>{s.vel}</dd>
                    <dt>XP</dt>
                    <dd>
                      {xp} / {xpParaSubir(nivel)}
                    </dd>
                  </dl>
                  <p className="equipo-ataques">
                    <span>{t('equipo.ataques')}</span> {ataquesDe({ nivel }, h).map((a) => a.nombre).join(' · ')}
                    {h.especial && <> · ★ {h.especial.nombre}</>}
                  </p>
                  <ul className="equipo-espacios">
                    {ESPACIOS.map((e) => (
                      <li key={e}>
                        <span>{t(`equipo.${e}`)}</span>
                        <em>{t('equipo.vacio')}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
          <p className="muted equipo-nota">{t('equipo.nota')}</p>
        </div>
      ) : (
        <div className="equipo-mochila">
          {mochila.length === 0 && <p className="muted">{t('equipo.mochila_vacia')}</p>}
          {mochila.map(([k, n]) => {
            const o = OBJETOS.get(k)!;
            return (
              <div key={k} className="equipo-objeto">
                <b>
                  {o.nombre} <small>×{n}</small>
                </b>
                <span className="equipo-tipo">{t(`equipo.tipo_${tipoDe(o)}`)}</span>
                <p>{o.texto.replace(/\{quien\}/g, t('equipo.alguien')).replace(/\{n\}/g, '…')}</p>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
