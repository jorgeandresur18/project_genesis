import { useState } from 'react';
import { playSelect } from '../engine/sound';
import { assetUrl } from '../engine/assets';
import { OBJETOS_TIENDA, precioVenta, useBoringplace, type Articulo } from '../engine/boringplace';
import { useStore } from '../engine/store';
import s from './Boringplace.module.css';
import sb from './Boringram.module.css';

/**
 * Boringplace (dentro de Boringram): el marketplace. «Para ti» son las cosas que vende la gente (su basura y alguna
 * estafa); «Tus artículos», lo que vende Jair para que el sueldo le llegue a fin de mes. En el Capítulo 1 todavía no
 * hay nadie vendiendo nada. Por ahora solo se mira: comprar llega con las monedas.
 */
export function Boringplace({ onArticulo, onToast }: { onArticulo: (id: string) => void; onToast?: (texto: string) => void }) {
  const p = useBoringplace();
  const tx = p.data.textos;
  const [pestana, setPestana] = useState<'tienda' | 'para_ti' | 'tuyos'>('tienda');
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
  const lista = pestana === 'para_ti' ? p.ajenos : p.deJair;
  /** Una fila de la tienda (comprar) o de la mochila (vender a la mitad). */
  const fila = (objeto: string, precio: number, vender: boolean) => {
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
            const ok = vender ? useStore.getState().venderObjeto(objeto, precio) : useStore.getState().comprarObjeto(objeto, precio);
            playSelect();
            if (vender) aviso(tx.vendido_ok.replace('{objeto}', o.nombre).replace('{n}', String(precio)));
            else aviso(ok ? tx.comprado.replace('{objeto}', o.nombre) : tx.sin_monedas.replace('{n}', String(precio - monedas)));
          }}
        >
          {vender ? tx.vender : tx.comprar} · {precio}
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
        {(['tienda', 'para_ti', 'tuyos'] as const).map((k) => (
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
            {k === 'tienda' ? tx.tienda : k === 'para_ti' ? tx.para_ti : tx.tus_articulos}
          </button>
        ))}
      </div>
      {!vars && pestana !== 'para_ti' && <p className={s.sinTuyos}>{tx.sin_partida}</p>}
      {pestana === 'tienda' ? (
        <div className={s.lista}>{p.tienda.map((x) => fila(x.objeto, x.precio, false))}</div>
      ) : pestana === 'tuyos' ? (
        <>
          <h4 className={s.subtitulo}>{tx.tus_objetos}</h4>
          {enMochila.length ? (
            <div className={s.lista}>{enMochila.map((x) => fila(x.objeto, precioVenta(x.precio), true))}</div>
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
        </>
      ) : lista.length === 0 ? (
        <p className={s.sinTuyos}>{tx.sin_tuyos}</p>
      ) : (
        <div className={s.grilla}>
          {lista.map((a) => (
            <button key={a.id} className={s.tarjeta} onClick={() => onArticulo(a.id)}>
              <Foto a={a} />
              <b className={s.precio}>{a.precio}</b>
              <span className={s.titulo}>{a.titulo}</span>
              <small className={s.lugar}>{a.lugar}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Un artículo: foto, precio, estado, vendedor, descripción y el botón (preguntar o, si es de Jair, venderlo). */
export function ArticuloVista({ id, onBack, onToast }: { id: string; onBack: () => void; onToast: (texto: string) => void }) {
  const p = useBoringplace();
  const tx = p.data.textos;
  const a = [...p.ajenos, ...p.deJair].find((x) => x.id === id);
  if (!a) return null;
  return (
    <div className={sb.feed}>
      <div className={sb.topBar}>
        <button className={sb.backBtn} onClick={onBack} aria-label={tx.atras}>
          ‹
        </button>
        <b>{tx.titulo}</b>
      </div>
      <Foto a={a} grande />
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

/** La foto del artículo: placeholder (gris con su nombre) hasta la fase de arte. */
function Foto({ a, grande = false }: { a: Articulo; grande?: boolean }) {
  return (
    <span className={`${s.foto} ${grande ? s.fotoGrande : ''}`} aria-hidden>
      <small>{a.imagen.replace('PLACEHOLDER:', '')}</small>
    </span>
  );
}
