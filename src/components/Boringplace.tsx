import { useState, type CSSProperties, type ReactNode } from 'react';
import { playSelect } from '../engine/sound';
import { assetUrl } from '../engine/assets';
import { OBJETOS_TIENDA, precioVenta, useBoringplace, type Articulo } from '../engine/boringplace';
import { useStore } from '../engine/store';
import s from './Boringplace.module.css';
import sb from './Boringram.module.css';

/**
 * Boringplace (dentro de Boringram): el marketplace. En la «Tienda», los objetos de las peleas están publicados como en
 * un marketplace (foto con el color del objeto, nombre y precio en tokens, la moneda del juego); adentro, su descripción
 * y cuántos comprar. «Tus artículos»: lo que vende Jair y lo de la mochila. En el Capítulo 1 todavía no hay nadie
 * vendiendo nada. (Las publicaciones de la gente siguen en el JSON, pero no salen en la tienda: eran de relleno.)
 */
export function Boringplace({ onArticulo, onToast }: { onArticulo: (id: string) => void; onToast?: (texto: string) => void }) {
  const p = useBoringplace();
  const tx = p.data.textos;
  const [pestana, setPestana] = useState<'tienda' | 'tuyos'>('tienda');
  const vars = useStore((st) => st.game?.vars);
  const monedas = (vars?.monedas as number | undefined) ?? 0;
  const tengo = (k: string) => ((vars?.[`mochila_${k}`] as number | undefined) ?? 0);
  const aviso = (texto: string) => onToast?.(texto);
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
          <span className={s.monedas}>
            {tx.monedas} <b>{monedas}</b>
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
      {!vars && <p className={s.sinTuyos}>{tx.sin_partida}</p>}
      {pestana === 'tienda' ? (
        <div className={s.grilla}>
          {p.tienda.map((x) => {
            const o = OBJETOS_TIENDA.get(x.objeto)!;
            return (
              <button key={x.objeto} className={s.tarjeta} onClick={() => onArticulo(`${ID_TIENDA}${x.objeto}`)}>
                <FotoObjeto icono={o.icono} color={x.color} />
                <span className={s.nombre}>{o.nombre}</span>
                <b className={s.precio}>{tx.precio_monedas.replace('{n}', String(x.precio))}</b>
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
          {p.deJair.length > 0 && <h4 className={s.subtitulo}>{tx.tus_publicaciones}</h4>}
          <div className={s.grilla}>
            {p.deJair.map((a) => (
              <button key={a.id} className={s.tarjeta} onClick={() => onArticulo(a.id)}>
                <Foto a={a} />
                <b className={s.precio}>{a.precio}</b>
                <span className={s.titulo}>{a.titulo}</span>
                <small className={s.lugar}>{a.lugar}</small>
              </button>
            ))}
          </div>
          {!enMochila.length && !p.deJair.length && <p className={s.sinTuyos}>{tx.sin_tuyos}</p>}
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
      <Flotante>
        <Foto a={a} grande />
      </Flotante>
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

/** Los objetos de la tienda se abren como un artículo más: `tienda:<objeto>`. */
const ID_TIENDA = 'tienda:';

/** La foto del artículo abierto: flota un poco, de arriba abajo, girando apenas en 3D. */
function Flotante({ children }: { children: ReactNode }) {
  return (
    <div className={s.escena}>
      <div className={s.flota}>{children}</div>
    </div>
  );
}

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
      <Flotante>
        <FotoObjeto icono={o.icono} color={x.color} grande />
      </Flotante>
      <div className={s.detalle}>
        <h3>{o.nombre}</h3>
        <b className={s.precioGrande}>{tx.precio_monedas.replace('{n}', String(x.precio))}</b>
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

/** La foto de un objeto de la tienda: su dibujo sobre un resplandor sutil de su color (como el fondo de Boringram). */
function FotoObjeto({ icono, color, grande = false }: { icono?: string; color?: string; grande?: boolean }) {
  return (
    <span className={`${s.fotoObjeto} ${grande ? s.fotoGrande : ''}`} style={{ '--c': color ?? '#2a1724' } as CSSProperties} aria-hidden>
      {icono && <img src={assetUrl(`${icono}.webp`)} alt="" draggable={false} />}
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
