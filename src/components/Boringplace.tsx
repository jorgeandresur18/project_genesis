import { useState, type CSSProperties } from 'react';
import { playSelect } from '../engine/sound';
import { assetUrl } from '../engine/assets';
import { OBJETOS_TIENDA, colorDeObjeto, precioVenta, useBoringplace, type Articulo } from '../engine/boringplace';
import { useStore } from '../engine/store';
import { useLang } from '../engine/i18n';
import { TOPE_PAYFOE, transferible, type Movimiento } from '../engine/payfoe';
import s from './Boringplace.module.css';
import sb from './Boringram.module.css';

/**
 * Boringplace (dentro de Boringram): el marketplace. En la «Tienda», los objetos de las peleas están publicados como en
 * un marketplace (foto con el color de su tipo: curación, mejora, para el rival…; nombre y precio en tokens, la moneda del juego); adentro, su descripción
 * y cuántos comprar. «Tus artículos»: lo de la mochila, para venderlo. Arriba, PayFoe (la billetera del jugador), que
 * abre su propia pantalla (`payfoe`). En el Capítulo 1 todavía no hay nadie
 * vendiendo nada. (Las publicaciones de la gente y las de Jair siguen en el JSON, pero no se muestran: eran de relleno.)
 */
export function Boringplace({ onArticulo, onToast }: { onArticulo: (id: string) => void; onToast?: (texto: string) => void }) {
  const p = useBoringplace();
  const tx = p.data.textos;
  const [pestana, setPestana] = useState<'tienda' | 'tuyos'>('tienda');
  const vars = useStore((st) => st.game?.vars);
  const monedas = (vars?.monedas as number | undefined) ?? 0;
  const tengo = (k: string) => ((vars?.[`mochila_${k}`] as number | undefined) ?? 0);
  const aviso = (texto: string) => onToast?.(texto);
  const f = useFormato();
  if (!p.abierto) {
    return (
      <div className={s.vacio}>
        <img className={s.vacioIcono} src={assetUrl('marca/boringplace_icono.webp')} alt="" draggable={false} />
        <b>{p.data.vacio.titulo}</b>
        <p>{p.data.vacio.texto}</p>
      </div>
    );
  }
  /** Una fila de la mochila (vender a la mitad). */
  const fila = (objeto: string, precio: number) => {
    const o = OBJETOS_TIENDA.get(objeto)!;
    return (
      <div key={objeto} className={s.objeto}>
        {o.icono ? <img src={assetUrl(`${o.icono}.webp`)} alt="" draggable={false} /> : <span />}
        <span className={s.objetoTexto}>
          <b>{o.nombre}</b>
          <small>{p.data.tienda.find((x) => x.objeto === objeto)?.descripcion}</small>
          {tengo(objeto) > 0 && <small className={s.tienes}>{tx.tienes.replace('{n}', String(tengo(objeto)))}</small>}
        </span>
        <button
          className={s.botonChico}
          disabled={!vars}
          onClick={() => {
            useStore.getState().venderObjeto(objeto, precio);
            playSelect();
            aviso(tx.vendido_ok.replace('{objeto}', o.nombre).replace('{n}', String(precio)));
          }}
        >
          {tx.vender} · {precio}
        </button>
      </div>
    );
  };
  const enMochila = p.data.tienda.filter((x) => tengo(x.objeto) > 0);
  return (
    <div className={sb.feed}>
      <div className={sb.topBar}>
        <img className={s.logo} src={assetUrl('marca/boringplace.webp')} alt={tx.titulo} draggable={false} />
        {vars && (
          <span className={s.monedas} title={tx.monedas}>
            <Token chico /> <b>{f(monedas)}</b>
          </span>
        )}
      </div>
      <div className={s.pestanas} role="tablist">
        {(['tienda', 'tuyos'] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={pestana === k}
            className={pestana === k ? s.pestanaOn : ''}
            onClick={() => {
              playSelect();
              setPestana(k);
            }}
          >
            {k === 'tienda' ? tx.tienda : tx.tus_articulos}
          </button>
        ))}
      </div>
      <TarjetaPayfoe onAbrir={() => onArticulo(ID_PAYFOE)} />
      {!vars && <p className={s.sinTuyos}>{tx.sin_partida}</p>}
      {pestana === 'tienda' ? (
        <div className={s.grilla}>
          {p.tienda.map((x) => {
            const o = OBJETOS_TIENDA.get(x.objeto)!;
            return (
              <button key={x.objeto} className={s.tarjeta} onClick={() => onArticulo(`${ID_TIENDA}${x.objeto}`)}>
                <FotoObjeto icono={o.icono} color={colorDeObjeto(o)} />
                <span className={s.nombre}>{o.nombre}</span>
                <Precio n={x.precio} />
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <h4 className={s.subtitulo}>{tx.tus_objetos}</h4>
          {enMochila.length ? (
            <div className={s.lista}>{enMochila.map((x) => fila(x.objeto, precioVenta(x.precio)))}</div>
          ) : (
            <p className={s.mochilaVacia}>{tx.mochila_vacia}</p>
          )}
        </>
      )}
    </div>
  );
}

/** Un artículo: foto, precio, estado, vendedor, descripción y el botón (preguntar o, si es de Jair, venderlo). */
export function ArticuloVista({ id, onBack, onToast }: { id: string; onBack: () => void; onToast: (texto: string) => void }) {
  const p = useBoringplace();
  const tx = p.data.textos;
  const a = [...p.ajenos, ...p.deJair].find((x) => x.id === id);
  if (id === ID_PAYFOE) return <BilleteraVista onBack={onBack} onToast={onToast} />;
  if (id.startsWith(ID_TIENDA)) return <ObjetoVista objeto={id.slice(ID_TIENDA.length)} onBack={onBack} onToast={onToast} />;
  if (!a) return null;
  return (
    <div className={sb.feed}>
      <div className={sb.topBar}>
        <button className={sb.backBtn} onClick={onBack} aria-label={tx.atras}>
          ‹
        </button>
        <b>{tx.titulo}</b>
      </div>
      <div className={s.escena}>
        <Foto a={a} grande />
      </div>
      <div className={s.detalle}>
        <b className={s.precioGrande}>{a.precio}</b>
        <h3>{a.titulo}</h3>
        <small className={s.lugar}>{tx.publicado.replace('{cuando}', a.publicado).replace('{lugar}', a.lugar)}</small>
        <p className={s.fila}>
          <span>{tx.estado}</span> {a.estado}
        </p>
        {!a.de_jair && (
          <p className={s.fila}>
            <span>{tx.vendedor}</span> {a.vendedor_nombre} <small>@{a.vendedor}</small> {'★'.repeat(a.estrellas ?? 0)}
          </p>
        )}
        <p className={s.descripcion}>{a.descripcion}</p>
        {a.de_jair && a.vistas !== undefined && <small className={s.lugar}>{tx.vistas.replace('{n}', String(a.vistas))}</small>}
        <button
          className={s.boton}
          onClick={() => {
            playSelect();
            onToast(a.respuesta);
          }}
        >
          {a.de_jair ? tx.vendido : tx.disponible}
        </button>
      </div>
    </div>
  );
}

/** Los números con separador de miles siempre (999.999 / 999,999); es-ES no separa los de cuatro cifras. */
function useFormato() {
  const sep = useLang() === 'en' ? ',' : '.';
  return (x: number) => String(x).replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** La moneda del juego (el token), con un brillo sutil de moneda nueva que la cruza de vez en cuando. */
function Token({ chico = false, grande = false }: { chico?: boolean; grande?: boolean }) {
  return (
    <span
      className={`${s.token} ${chico ? s.tokenChico : ''} ${grande ? s.tokenGrande : ''}`}
      style={{ '--mascara': `url(${assetUrl('objetos/token.webp')})` } as CSSProperties}
      aria-hidden
    >
      <img src={assetUrl('objetos/token.webp')} alt="" draggable={false} />
    </span>
  );
}

/** Un precio: la moneda y el número. */
function Precio({ n, grande = false }: { n: number; grande?: boolean }) {
  const f = useFormato();
  return (
    <b className={`${s.precio} ${grande ? s.precioGrande : ''}`}>
      <Token chico={!grande} /> {f(n)}
    </b>
  );
}

/** PayFoe, arriba de la tienda: la moneda, el nombre y el saldo. Se toca y abre la billetera. */
function TarjetaPayfoe({ onAbrir }: { onAbrir: () => void }) {
  const tx = useBoringplace().data.textos;
  const f = useFormato();
  const saldo = useStore((st) => st.payfoe.saldo);
  return (
    <button
      className={s.payfoe}
      onClick={() => {
        playSelect();
        onAbrir();
      }}
    >
      <Token />
      <span className={s.payfoeTexto}>
        <span className={s.payfoeMarca} translate="no">
          {tx.payfoe}
        </span>
        <b className={s.payfoeSaldo}>{f(saldo)}</b>
      </span>
      <span className={s.payfoeVer}>{tx.ver_billetera} ›</span>
    </button>
  );
}

/**
 * La billetera: el saldo de PayFoe (y su tope), la billetera de la partida con la transferencia (cuánto pasar; nunca
 * al revés), para qué sirve cada una y los últimos movimientos.
 */
function BilleteraVista({ onBack, onToast }: { onBack: () => void; onToast: (texto: string) => void }) {
  const tx = useBoringplace().data.textos;
  const f = useFormato();
  const lang = useLang();
  const payfoe = useStore((st) => st.payfoe);
  const vars = useStore((st) => st.game?.vars);
  const puede = vars ? transferible(vars, payfoe) : 0;
  const [cuanto, setCuanto] = useState<number | null>(null);
  // Lo elegido no puede pasar de lo que se puede transferir (al transferir, baja).
  const n = Math.min(cuanto ?? puede, puede);
  const paso = Math.max(1, 10 ** Math.max(0, String(puede).length - 2));
  const fecha = (m: Movimiento) => new Date(m.fecha).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { day: 'numeric', month: 'short' });
  return (
    <div className={sb.feed}>
      <div className={sb.topBar}>
        <button className={sb.backBtn} onClick={onBack} aria-label={tx.atras}>
          ‹
        </button>
        <b className={s.payfoeMarca} translate="no">
          {tx.payfoe}
        </b>
      </div>
      <div className={s.billetera}>
        <div className={s.saldoGrande}>
          <Token grande />
          <b>{f(payfoe.saldo)}</b>
          <small>{tx.payfoe_tope_de.replace('{n}', f(TOPE_PAYFOE))}</small>
        </div>

        {vars ? (
          <section className={s.bloque}>
            <h4>{tx.billetera_partida_titulo}</h4>
            <p className={s.filaSaldo}>
              <Token chico /> <b>{f((vars.monedas as number | undefined) ?? 0)}</b>
              <small>{tx.transferible.replace('{n}', f(puede))}</small>
            </p>
            {puede > 0 && (
              <div className={s.cantidad}>
                <span>{tx.cantidad}</span>
                <button aria-label={tx.menos} disabled={n <= 1} onClick={() => setCuanto(Math.max(1, n - paso))}>
                  −
                </button>
                <b>{f(n)}</b>
                <button aria-label={tx.mas} disabled={n >= puede} onClick={() => setCuanto(Math.min(puede, n + paso))}>
                  +
                </button>
                <button className={s.todo} disabled={n >= puede} onClick={() => setCuanto(puede)}>
                  {tx.todo}
                </button>
              </div>
            )}
            <button
              className={s.boton}
              onClick={() => {
                playSelect();
                if (payfoe.saldo >= TOPE_PAYFOE) return onToast(tx.payfoe_tope);
                const t = useStore.getState().transferirAPayfoe(n);
                setCuanto(null);
                onToast(t > 0 ? tx.transferido.replace('{n}', f(t)) : tx.nada_transferible);
              }}
            >
              {tx.transferir.replace('{n}', f(n))}
            </button>
          </section>
        ) : (
          <p className={s.nota}>{tx.billetera_sin_partida}</p>
        )}

        <section className={s.bloque}>
          <h4>{tx.uso_titulo}</h4>
          <ul className={s.usos}>
            <li>{tx.uso_partida}</li>
            <li>{tx.uso_payfoe}</li>
            <li>{tx.uso_sentido}</li>
          </ul>
        </section>

        <section className={s.bloque}>
          <h4>{tx.movimientos}</h4>
          {payfoe.movimientos?.length ? (
            <ul className={s.movimientos}>
              {payfoe.movimientos.map((m, i) => (
                <li key={i}>
                  <span>{tx[`mov_${m.tipo}`]}</span>
                  <small>{fecha(m)}</small>
                  <b className={m.tipo === 'compra' ? s.sale : s.entra}>
                    {m.tipo === 'compra' ? '−' : '+'}
                    {f(m.n)}
                  </b>
                </li>
              ))}
            </ul>
          ) : (
            <p className={s.nota}>{tx.sin_movimientos}</p>
          )}
        </section>
      </div>
    </div>
  );
}

/** La billetera se abre como un artículo más. */
const ID_PAYFOE = 'payfoe';

/** Los objetos de la tienda se abren como un artículo más: `tienda:<objeto>`. */
const ID_TIENDA = 'tienda:';

/** La publicación de un objeto de las peleas: foto, precio, descripción, cuántos tienes y cuántos comprar. */
function ObjetoVista({ objeto, onBack, onToast }: { objeto: string; onBack: () => void; onToast: (texto: string) => void }) {
  const p = useBoringplace();
  const tx = p.data.textos;
  const vars = useStore((st) => st.game?.vars);
  const [n, setN] = useState(1);
  const x = p.tienda.find((t) => t.objeto === objeto);
  const o = OBJETOS_TIENDA.get(objeto);
  if (!x || !o) return null;
  const monedas = (vars?.monedas as number | undefined) ?? 0;
  const tengo = (vars?.[`mochila_${objeto}`] as number | undefined) ?? 0;
  const total = n * x.precio;
  const comprar = () => {
    playSelect();
    if (monedas < total) {
      onToast(tx.sin_monedas.replace('{n}', String(total - monedas)));
      return;
    }
    for (let i = 0; i < n; i++) useStore.getState().comprarObjeto(objeto, x.precio);
    onToast(n === 1 ? tx.comprado.replace('{objeto}', o.nombre) : tx.comprados.replace('{n}', String(n)).replace('{objeto}', o.nombre));
    setN(1);
  };
  return (
    <div className={sb.feed}>
      <div className={sb.topBar}>
        <button className={sb.backBtn} onClick={onBack} aria-label={tx.atras}>
          ‹
        </button>
        <b>{tx.titulo}</b>
        {vars && (
          <span className={s.monedas}>
            {tx.monedas} <b>{monedas}</b>
          </span>
        )}
      </div>
      <div className={s.escena}>
        <FotoObjeto icono={o.icono} color={colorDeObjeto(o)} grande />
      </div>
      <div className={s.detalle}>
        <h3>{o.nombre}</h3>
        <Precio n={x.precio} grande />
        <small className={s.lugar}>{tx.lugar_tienda}</small>
        <p className={s.descripcion}>{x.descripcion}</p>
        {tengo > 0 && <small className={s.tienes}>{tx.tienes.replace('{n}', String(tengo))}</small>}
        {vars ? (
          <>
            <div className={s.cantidad}>
              <span>{tx.cantidad}</span>
              <button aria-label={tx.menos} disabled={n <= 1} onClick={() => setN(n - 1)}>
                −
              </button>
              <b>{n}</b>
              <button aria-label={tx.mas} onClick={() => setN(n + 1)}>
                +
              </button>
            </div>
            <button className={s.boton} onClick={comprar}>
              {tx.comprar_n.replace('{n}', String(n)).replace('{total}', String(total))}
            </button>
          </>
        ) : (
          <p className={s.sinTuyos}>{tx.sin_partida}</p>
        )}
      </div>
    </div>
  );
}

/**
 * La foto de un objeto de la tienda: su dibujo sobre un resplandor oscuro del color de su tipo (como el fondo de
 * Boringram). En la publicación abierta (`grande`), solo el dibujo flota de arriba abajo, girando apenas en 3D.
 */
function FotoObjeto({ icono, color, grande = false }: { icono?: string; color?: string; grande?: boolean }) {
  return (
    <span className={`${s.fotoObjeto} ${grande ? s.fotoGrande : ''}`} style={{ '--c': color ?? '#2a1724' } as CSSProperties} aria-hidden>
      {icono && <img className={grande ? s.flota : undefined} src={assetUrl(`${icono}.webp`)} alt="" draggable={false} />}
    </span>
  );
}

/** La foto del artículo: placeholder (gris con su nombre) hasta la fase de arte. */
function Foto({ a, grande = false }: { a: Articulo; grande?: boolean }) {
  return (
    <span className={`${s.foto} ${grande ? s.fotoGrande : ''}`} aria-hidden>
      <small>{a.imagen.replace('PLACEHOLDER:', '')}</small>
    </span>
  );
}
