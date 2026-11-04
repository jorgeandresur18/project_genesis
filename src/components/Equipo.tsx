import { useState, type CSSProperties } from 'react';
import { Panel } from './Panels';
import { SpriteHoja } from './batalla/sprites';
import { useT } from '../engine/i18n';
import { useStore } from '../engine/store';
import { playSelect } from '../engine/sound';
import { MAX_ATAQUES, MAX_ESPECIALES, enMochila, equipados, progresoDeVars, statsEn, tipoDe, xpParaSubir, type Heroe, type Objeto } from '../engine/batalla';
import { Cassette } from './Cassette';
import { BATALLAS, FICHAS, copiasLibres, sueltosQueTengo } from '../engine/batallas';

/**
 * Equipo (botón de la barra del juego): las estadísticas de cada personaje del equipo con su sprite, lo que tiene
 * equipado (cabeza, traje y amuleto) y la mochila. Todo es de la partida en curso. El equipo se compra en
 * Boringplace (por construir: por ahora los espacios están vacíos).
 */
/** Cada héroe y cada objeto como aparecen por primera vez en las peleas (el Bastión primero). */
const HEROES = new Map<string, Heroe>();
const OBJETOS = new Map<string, Objeto>();
for (const k of Object.keys(BATALLAS).sort((a, b) => (a.includes('bastion') ? -1 : b.includes('bastion') ? 1 : a.localeCompare(b)))) {
  const d = BATALLAS[k];
  for (const [id, h] of Object.entries(d.personajes)) if (!HEROES.has(id)) HEROES.set(id, h);
  for (const [id, o] of Object.entries(d.objetos)) if (!OBJETOS.has(id)) OBJETOS.set(id, o);
}
/** Los espacios de equipo de cada personaje (traje sirve para un vestido, una armadura o lo que lleve). */
export const ESPACIOS = ['cabeza', 'traje', 'pies', 'amuleto'] as const;
/** Cuántos van en el grupo (las fichas vacías son los lugares que todavía no se ocupan). */
const GRUPO = 3;

/**
 * Los ataques de un héroe como cassettes (docs/BIBLIA_RPG.md, sección 18): los equipados (hasta 3 ataques y 2
 * especiales) y, abajo, los que están en la mochila. Tocar uno lo equipa o lo guarda (solo fuera de las peleas).
 */
function Cassettes({
  heroe,
  h,
  nivel,
  elegidos,
  soloVer,
  cassettes,
  equipoTodos,
  ganados,
}: {
  heroe: string;
  h: Heroe;
  nivel: number;
  elegidos?: { ataques?: string[]; especiales?: string[] };
  soloVer: boolean;
  /** Los cassettes sueltos que se tienen y lo que tiene equipado cada uno (para no equipar más copias de las que hay). */
  cassettes?: Record<string, number>;
  equipoTodos?: Record<string, { ataques?: string[] }>;
  /** Los especiales ganados en la historia (p. ej. el Armored de Cami). */
  ganados?: string[];
}) {
  const t = useT();
  const [aviso, setAviso] = useState('');
  const sueltos = sueltosQueTengo(cassettes);
  const eq = equipados(h, nivel, elegidos, sueltos, ganados);
  const mochila = enMochila(h, nivel, elegidos, sueltos, ganados);
  /** El id del suelto de un ataque (si es suelto): son grises y se equipan si queda una copia libre. */
  const idSuelto = (nombre: string) => Object.entries(FICHAS.sueltos).find(([, x]) => x.ataque.nombre === nombre)?.[0];
  const de = (nombre: string) => (idSuelto(nombre) ? undefined : heroe);
  const nombres = (l: { nombre: string }[]) => l.map((x) => x.nombre);
  const cambiar = (tipo: 'ataques' | 'especiales', nombre: string) => {
    if (soloVer) return;
    const actuales = nombres(eq[tipo]);
    const max = tipo === 'ataques' ? MAX_ATAQUES : MAX_ESPECIALES;
    let nuevos: string[];
    if (actuales.includes(nombre)) {
      // Siempre tiene que quedar al menos un ataque (los especiales sí pueden quedar en cero).
      if (tipo === 'ataques' && actuales.length <= 1) return setAviso(t('equipo.minimo'));
      nuevos = actuales.filter((n) => n !== nombre);
    } else {
      if (actuales.length >= max) return setAviso(t('equipo.sin_espacio'));
      const id = idSuelto(nombre);
      if (id && copiasLibres(id, cassettes, equipoTodos) <= 0) return setAviso(t('equipo.sin_copias'));
      nuevos = [...actuales, nombre];
    }
    playSelect();
    setAviso('');
    useStore.getState().equipar(heroe, tipo, nuevos);
  };
  const huecos = (n: number, max: number) => Array.from({ length: Math.max(0, max - n) }, (_, i) => <span key={`h${i}`} className="cassette-hueco">{t('equipo.vacio_hueco')}</span>);
  return (
    <div className="equipo-cassettes">
      <span className="equipo-cassettes-titulo">{t('equipo.ataques')}</span>
      <div className="equipo-cassettes-fila">
        {eq.ataques.map((a) => (
          <Cassette key={a.nombre} de={de(a.nombre)} nombre={a.nombre} onClick={soloVer ? undefined : () => cambiar('ataques', a.nombre)} titulo={a.texto.replace(/\{quien\}/g, h.nombre)} />
        ))}
        {huecos(eq.ataques.length, MAX_ATAQUES)}
      </div>
      <span className="equipo-cassettes-titulo">{t('equipo.especiales')}</span>
      <div className="equipo-cassettes-fila">
        {eq.especiales.map((e) => (
          <Cassette key={e.nombre} de={heroe} nombre={e.nombre} especial onClick={soloVer ? undefined : () => cambiar('especiales', e.nombre)} titulo={e.texto.replace(/\{quien\}/g, h.nombre)} />
        ))}
        {huecos(eq.especiales.length, MAX_ESPECIALES)}
      </div>
      {(mochila.ataques.length > 0 || mochila.especiales.length > 0) && (
        <>
          <span className="equipo-cassettes-titulo">{t('equipo.en_mochila')}</span>
          <div className="equipo-cassettes-fila">
            {mochila.ataques.map((a) => (
              <Cassette key={a.nombre} de={de(a.nombre)} nombre={a.nombre} apagado onClick={soloVer ? undefined : () => cambiar('ataques', a.nombre)} />
            ))}
            {mochila.especiales.map((e) => (
              <Cassette key={e.nombre} de={heroe} nombre={e.nombre} especial apagado onClick={soloVer ? undefined : () => cambiar('especiales', e.nombre)} />
            ))}
          </div>
        </>
      )}
      {!soloVer && <small className="equipo-cassettes-nota">{aviso || t('equipo.toca')}</small>}
    </div>
  );
}

export function EquipoPanel({ onClose, soloVer = false, grupo }: { onClose: () => void; soloVer?: boolean; grupo?: string[] }) {
  const t = useT();
  const vars = useStore((s) => s.game?.vars ?? {});
  const progreso = progresoDeVars(vars);
  const [pestana, setPestana] = useState<'personajes' | 'mochila'>('personajes');
  // El equipo: Jair siempre; los demás, desde que pelearon con él.
  // En una pelea, los que están peleando (aunque sea su primera).
  const equipo = [...HEROES.keys()].filter((k) => k === 'jair' || progreso.heroes[k] || grupo?.includes(k));
  const mochila = Object.entries(progreso.mochila).filter(([k, n]) => n > 0 && OBJETOS.has(k));
  return (
    <Panel title={t('equipo.titulo')} onClose={onClose}>
      <p className="equipo-monedas">
        {t('equipo.monedas')} <b>{progreso.monedas ?? 0}</b>
      </p>
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
          {[...equipo, ...Array.from({ length: Math.max(0, GRUPO - equipo.length) }, () => '')].map((k, i) => {
            // Un lugar del grupo que todavía nadie ocupa.
            if (!k)
              return (
                <article key={`vacio-${i}`} className="equipo-ficha vacia">
                  <div className="equipo-sprite">?</div>
                  <h3>???</h3>
                </article>
              );
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
                  <Cassettes heroe={k} h={h} nivel={nivel} elegidos={progreso.equipo?.[k]} soloVer={soloVer || !useStore.getState().game} cassettes={progreso.cassettes} equipoTodos={progreso.equipo} ganados={progreso.especialesGanados} />
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
          <p className="muted equipo-nota">{t(soloVer ? 'equipo.nota_pelea' : 'equipo.nota')}</p>
        </div>
      ) : (
        <div className="equipo-mochila">
          {mochila.length === 0 && <p className="equipo-mochila-vacia">{t('equipo.mochila_vacia_titulo')}</p>}
          {mochila.map(([k, n]) => {
            const o = OBJETOS.get(k)!;
            return (
              <div key={k} className="equipo-objeto">
                <b>
                  {o.icono && <img className="equipo-icono" src={`${import.meta.env.BASE_URL}${o.icono}.webp`} alt="" draggable={false} />}
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
