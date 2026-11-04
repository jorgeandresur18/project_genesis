import { useState } from 'react';
import { playSelect } from '../../engine/sound';
import { NewDot } from '../CgGallery';
import s from '../Boringram.module.css';
import { type B } from './comun';
import { Pic, Avatar, Post, MultiIcon } from './publicaciones';

// El perfil de Boringram (ver ../Boringram.tsx).
export function Profile({
  b,
  id,
  onPost,
  onStory,
  onBack,
}: {
  b: B;
  id: string;
  onPost: (id: string) => void;
  onStory: (id: string) => void;
  onBack?: () => void;
}) {
  const tx = b.data.textos;
  const [tab, setTab] = useState<'fotos' | 'pensamientos' | 'me_gusta'>('fotos');
  const mine = id === b.data.yo;
  const likedPosts = b.publicaciones.filter((x) => b.liked(x));
  const likedStories = b.destacadas.filter((x) => b.storyLiked(x.id));
  const p = b.perfiles[id];
  const photos = b.publicaciones.filter((x) => x.autor === id && x.tipo === 'foto');
  const thoughts = b.publicaciones.filter((x) => x.autor === id && x.tipo !== 'foto');
  // Las fijadas (p. ej. la favorita de Jair) van siempre primero.
  const stories = b.destacadas.filter((x) => x.autor === id).sort((a, c) => Number(!!c.fijada) - Number(!!a.fijada));
  if (!p) return null;
  return (
    <div className={s.profile}>
      <div className={s.topBar}>
        {onBack && (
          <button className={s.backBtn} onClick={onBack} aria-label={tx.atras}>
            ‹
          </button>
        )}
        <b>{p.usuario}</b>
      </div>
      <div className={s.profileHead}>
        <Avatar perfil={p} ring={stories.some((x) => b.newStories.has(x.id))} />
        <div className={s.counts}>
          <span>
            <b>{p.publicaciones}</b>
            {tx.publicaciones}
          </span>
          <span>
            <b>{p.seguidores.toLocaleString()}</b>
            {tx.seguidores}
          </span>
          <span>
            <b>{p.seguidos}</b>
            {tx.seguidos}
          </span>
        </div>
      </div>
      <div className={s.bio}>
        <b>{p.nombre}</b>
        <p>{p.bio}</p>
      </div>
      {id !== b.data.yo && (
        <div className={s.followRow}>
          <span className={s.following}>{tx.siguiendo}</span>
          {p.te_sigue && <span className={s.followsYou}>{tx.te_sigue}</span>}
        </div>
      )}
      {stories.length > 0 && (
        <div className={s.highlights} data-tour="destacadas">
          {stories.map((h) => (
            <button key={h.id} className={s.highlight} onClick={() => onStory(h.id)}>
              <span className={`${s.highlightRing} ${b.newStories.has(h.id) ? s.avatarStory : ''}`}>
                <Pic src={h.imagen} />
              </span>
              <small>{h.titulo}</small>
              {b.newStories.has(h.id) && <NewDot className={s.highlightDot} />}
            </button>
          ))}
        </div>
      )}
      <div className={s.profileTabs} role="tablist" data-tour="pestanas">
        {(['fotos', 'pensamientos', 'me_gusta'] as const).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            className={tab === k ? s.profileTabOn : ''}
            onClick={() => {
              if (tab === k) return;
              playSelect();
              setTab(k);
            }}
          >
            {k === 'me_gusta' ? tx.me_gusta_tab : tx[k]}
            {k !== 'me_gusta' && (k === 'fotos' ? photos : thoughts).some((x) => b.newPosts.has(x.id)) && (
              <NewDot className={s.inlineDot} />
            )}
          </button>
        ))}
      </div>
      {tab === 'me_gusta' ? (
        !mine ? (
          <p className={s.privateLikes}>
            <span aria-hidden>🔒</span>
            {tx.likes_privados.replace('{usuario}', p.usuario)}
          </p>
        ) : likedPosts.length + likedStories.length === 0 ? (
          <p className={s.empty}>{tx.likes_vacios}</p>
        ) : (
          <div className={s.grid}>
            {likedStories.map((x) => (
              <button key={`story-${x.id}`} className={`${s.gridItem} ${s.gridStory}`} onClick={() => onStory(x.id)}>
                <Pic src={x.imagen} />
                <span className={s.gridStoryTag}>{tx.historias_gustadas}</span>
              </button>
            ))}
            {likedPosts.map((x) =>
              x.tipo === 'foto' ? (
                <button key={x.id} className={s.gridItem} onClick={() => onPost(x.id)}>
                  <Pic src={x.imagen!} />
                  {x.carrusel && <MultiIcon />}
                </button>
              ) : (
                <button key={x.id} className={`${s.gridItem} ${s.gridText}`} onClick={() => onPost(x.id)}>
                  <span>{x.tipo === 'repost' ? x.repost!.texto : x.texto}</span>
                </button>
              ),
            )}
          </div>
        )
      ) : tab === 'fotos' ? (
        <div className={s.grid}>
          {photos.map((x) => (
            <button key={x.id} className={s.gridItem} onClick={() => onPost(x.id)}>
              <Pic src={x.imagen!} />
              {x.carrusel && <MultiIcon />}
              {b.newPosts.has(x.id) && <NewDot className={s.itemDot} />}
            </button>
          ))}
        </div>
      ) : (
        <div className={s.feed}>
          {thoughts.map((x) => (
            <Post key={x.id} b={b} post={x} onPerfil={() => undefined} onPost={onPost} />
          ))}
        </div>
      )}
    </div>
  );
}
