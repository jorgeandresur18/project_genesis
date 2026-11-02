import { useState } from 'react';
import { playSelect } from '../engine/sound';
import { useBoringplace, type Articulo } from '../engine/boringplace';
import s from './Boringplace.module.css';
import sb from './Boringram.module.css';

/**
 * Boringplace (dentro de Boringram): el marketplace. «Para ti» son las cosas que vende la gente (su basura y alguna
 * estafa); «Tus artículos», lo que vende Jair para que el sueldo le llegue a fin de mes. En el Capítulo 1 todavía no
 * hay nadie vendiendo nada. Por ahora solo se mira: comprar llega con las monedas.
 */
export function Boringplace({ onArticulo }: { onArticulo: (id: string) => void }) {
  const p = useBoringplace();
  const tx = p.data.textos;
  const [pestana, setPestana] = useState<'para_ti' | 'tuyos'>('para_ti');
  if (!p.abierto) {
    return (
      <div className={s.vacio}>
        <span className={s.vacioIcono} aria-hidden>
          🏷
        </span>
        <b>{p.data.vacio.titulo}</b>
        <p>{p.data.vacio.texto}</p>
      </div>
    );
  }
  const lista = pestana === 'para_ti' ? p.ajenos : p.deJair;
  return (
    <div className={sb.feed}>
      <div className={sb.topBar}>
        <b>{tx.titulo}</b>
      </div>
      <div className={s.pestanas} role="tablist">
        {(['para_ti', 'tuyos'] as const).map((k) => (
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
            {k === 'para_ti' ? tx.para_ti : tx.tus_articulos}
          </button>
        ))}
      </div>
      {lista.length === 0 ? (
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
