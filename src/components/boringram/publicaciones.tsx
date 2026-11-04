import { useEffect, useRef, useState } from 'react';
import { useStore } from '../../engine/store';
import { assetUrl, isPlaceholder } from '../../engine/assets';
import { postKey, type Perfil, type Publicacion } from '../../engine/boringram';
import { playCancel, playSelect } from '../../engine/sound';
import { isTouch } from '../../engine/mobile';
import { NewDot } from '../CgGallery';
import { KeyboardField } from '../PhoneKeyboard';
import s from '../Boringram.module.css';
import { type B, useOffline, shareId, useToast, useShare } from './comun';

// Las publicaciones de Boringram: inicio, cada foto, comentarios y compartir (ver ../Boringram.tsx).
/** Imagen de Boringram; mientras falte el arte (PLACEHOLDER:<nombre>), un cuadro gris con su nombre. */
export function Pic({ src, className = '' }: { src: string; className?: string }) {
  if (isPlaceholder(src))
    return <span className={`${s.picPlaceholder} ${className}`}>{src.replace('PLACEHOLDER:', '')}</span>;
  return <img className={className} src={assetUrl(src)} alt="" loading="lazy" draggable={false} />;
}

/** Varias fotos en una publicación: se pasan deslizando o con las flechas; abajo, un puntito por foto. */
export function Carousel({
  b,
  slides,
  index,
  onIndex,
}: {
  b: B;
  slides: { imagen: string }[];
  index: number;
  onIndex: (i: number) => void;
}) {
  const tx = b.data.textos;
  const start = useRef<{ x: number; y: number } | null>(null);
  const go = (i: number) => {
    if (i < 0 || i >= slides.length) return;
    playSelect();
    onIndex(i);
  };
  const arrow = (dir: 1 | -1) => (
    <button
      type="button"
      className={`${s.carouselArrow} ${dir < 0 ? s.carouselPrev : s.carouselNext}`}
      aria-label={tx.carrusel.replace('{n}', String(index + dir + 1)).replace('{total}', String(slides.length))}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        go(index + dir);
      }}
    >
      {dir < 0 ? '‹' : '›'}
    </button>
  );
  return (
    <div
      className={s.carousel}
      onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const st = start.current;
        start.current = null;
        if (!st) return;
        const dx = e.clientX - st.x;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - st.y)) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className={s.carouselTrack} style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((x, i) => (
          <div key={i} className={s.carouselSlide} aria-hidden={i !== index}>
            <Pic src={x.imagen} />
          </div>
        ))}
      </div>
      <span className={s.carouselCount}>
        {index + 1}/{slides.length}
      </span>
      {index > 0 && arrow(-1)}
      {index < slides.length - 1 && arrow(1)}
      <div className={s.carouselDots} aria-hidden>
        {slides.map((_, i) => (
          <i key={i} className={i === index ? s.carouselDotOn : ''} />
        ))}
      </div>
    </div>
  );
}

/**
 * Compartir una foto de verdad: muestra la miniatura que se verá en las redes (public/compartir/<id>.jpg,
 * con su página <id>.html, ver tools/compartir.mjs) y abre Facebook, Instagram, WhatsApp o X con el enlace y un
 * texto, o copia el enlace.
 */
export function ShareSheet({ b, id, onClose }: { b: B; id: string; onClose: () => void }) {
  const tx = b.data.textos;
  const story = b.destacadas.find((x) => x.id === id);
  // Una foto de un carrusel (<id>-<n>): su publicación, con el texto de esa foto.
  const [, base, n] = /^(.*)-(\d+)$/.exec(id) ?? [];
  const slide = b.publicaciones.find((p) => p.id === base)?.carrusel?.[Number(n) - 1];
  const post =
    b.publicaciones.find((p) => p.id === id) ??
    (slide && { autor: b.publicaciones.find((p) => p.id === base)!.autor, texto: slide.texto ?? '' }) ??
    (story && { autor: story.autor, texto: story.texto });
  const [note, setNote] = useState('');
  if (!post) return null;
  const user = b.perfiles[post.autor]?.usuario ?? post.autor;
  const url = `${b.data.sitio}compartir/${id}.html?v=${b.data.compartir_version ?? 1}`;
  const text = `${tx.compartir_texto} · ${user}: «${post.texto}»`;
  const card = assetUrl(`compartir/${id}.jpg`);
  const open = (href: string) => {
    playSelect();
    window.open(href, '_blank', 'noopener,noreferrer');
  };
  const copy = async () => {
    playSelect();
    try {
      await navigator.clipboard.writeText(url);
      setNote(tx.copiado);
    } catch {
      setNote(url);
    }
  };
  // Instagram y Facebook no dejan que una web les escriba el texto: se copia el texto con el enlace en el mismo
  // toque, para pegarlo, y el enlace se ve con su miniatura (la tarjeta de public/compartir).
  const copiar = (t: string) => navigator.clipboard?.writeText(t).catch(() => {});
  // Instagram: en el celular, el menú de compartir del teléfono con el texto y el enlace (se elige Instagram y
  // llega como mensaje con la miniatura); en la computadora, se copian y se abren los mensajes de Instagram.
  const instagram = () => {
    playSelect();
    copiar(`${text} ${url}`);
    if (isTouch() && typeof navigator.share === 'function') {
      setNote(tx.instagram_nota_celular);
      navigator.share({ title: 'PROJECT GENESIS', text, url }).catch(() => {});
      return;
    }
    window.open('https://www.instagram.com/direct/inbox/', '_blank', 'noopener,noreferrer');
    setNote(tx.instagram_nota);
  };
  const facebook = () => {
    copiar(text);
    open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`);
    setNote(tx.facebook_nota);
  };
  const native = async () => {
    playSelect();
    await navigator.share?.({ title: 'PROJECT GENESIS', text, url }).catch(() => {});
  };
  return (
    <div className={s.sheetBackdrop} onClick={onClose}>
      <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
        <i className={s.sheetHandle} />
        <b className={s.sheetTitle}>{tx.compartir}</b>
        <a className={s.preview} href={url} target="_blank" rel="noreferrer">
          <img src={card} alt="" draggable={false} />
          <span>
            <b>{user} en Boringram · PROJECT GENESIS</b>
            <small>{new URL(b.data.sitio).host}</small>
          </span>
        </a>
        <div className={s.shareRow}>
          <button onClick={facebook}>
            <span className={s.shareFb}>f</span>Facebook
          </button>
          <button onClick={instagram}>
            <img className={s.shareImg} src={assetUrl('marca/redes/instagram.webp')} alt="" draggable={false} />
            Instagram
          </button>
          <button onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`)}>
            <img className={s.shareImg} src={assetUrl('marca/redes/whatsapp.webp')} alt="" draggable={false} />
            WhatsApp
          </button>
          <button
            onClick={() =>
              open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
            }
          >
            <img className={s.shareImg} src={assetUrl('marca/redes/x.webp')} alt="" draggable={false} />X
          </button>
          <button onClick={copy}>
            <span className={s.shareLink}>🔗</span>
            {tx.copiar_enlace}
          </button>
          {typeof navigator.share === 'function' && (
            <button onClick={native}>
              <span className={s.shareLink}>⋯</span>
              {tx.mas}
            </button>
          )}
        </div>
        {note && <p className={s.shareNote}>{note}</p>}
      </div>
    </div>
  );
}

export function Avatar({
  perfil,
  small,
  ring,
  inicial,
}: {
  perfil?: Perfil;
  small?: boolean;
  ring?: boolean;
  inicial?: string;
}) {
  return (
    <span className={`${s.avatarRing} ${ring ? s.avatarStory : ''} ${small ? s.small : ''}`}>
      {perfil && !isPlaceholder(perfil.foto) ? (
        <img className={s.avatar} src={assetUrl(perfil.foto)} alt="" draggable={false} />
      ) : (
        // Sin foto todavía (PLACEHOLDER): la inicial del usuario.
        <span className={`${s.avatar} ${s.initial}`}>{(perfil?.usuario ?? inicial)?.[0]?.toUpperCase()}</span>
      )}
    </span>
  );
}

export function PostHead({
  b,
  post,
  onPerfil,
  tour,
}: {
  b: B;
  post: Publicacion;
  onPerfil: (id: string) => void;
  tour?: boolean;
}) {
  const p = b.perfiles[post.autor];
  return (
    <button className={s.postHead} onClick={() => onPerfil(post.autor)} data-tour={tour ? 'autor' : undefined}>
      <Avatar perfil={p} small ring={b.destacadas.some((d) => d.autor === post.autor && b.newStories.has(d.id))} />
      <b>{p?.usuario ?? post.autor}</b>
      <small>{post.hace}</small>
    </button>
  );
}

/** Corazón (rojo si Jair le dio me gusta), comentar y enviar; luego los me gusta. */
export function PostActions({
  b,
  post,
  onComment,
  tour,
  slide = 0,
}: {
  b: B;
  post: Publicacion;
  onComment: () => void;
  tour?: boolean;
  /** En un carrusel, la foto que se está viendo (se comparte esa). */
  slide?: number;
}) {
  const mark = (id: string) => (tour ? id : undefined);
  const onShare = useShare();
  const tx = b.data.textos;
  const setLike = useStore((st) => st.setBoringramLike);
  const offline = useOffline();
  const liked = b.liked(post);
  const [pop, setPop] = useState(0);
  const n = b.likeCount(post);
  return (
    <>
      <div className={s.postActions}>
        <button
          className={s.likeBtn}
          data-tour={mark('like')}
          aria-pressed={liked}
          aria-label={tx.me_gusta.replace('{n}', String(n))}
          onClick={() => {
            if (offline()) return;
            if (!liked) playSelect();
            setLike(post.id, !liked);
            setPop((p) => p + 1);
          }}
        >
          <svg key={pop} viewBox="0 0 24 24" className={`${liked ? s.liked : ''} ${pop ? s.likePop : ''}`}>
            <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
          </svg>
        </button>
        <button
          className={s.likeBtn}
          onClick={onComment}
          aria-label={tx.agregar_comentario}
          data-tour={mark('comentar')}
        >
          <svg viewBox="0 0 24 24" className={s.shareIcon}>
            <path d="M4 5h16v11H8l-4 4z" />
          </svg>
        </button>
        {post.tipo === 'foto' ? (
          <button
            className={s.likeBtn}
            onClick={() => onShare(shareId(post.id, slide))}
            aria-label={tx.compartir}
            data-tour={mark('compartir')}
          >
            <svg viewBox="0 0 24 24" className={s.shareIcon}>
              <path d="M21 3 3 10.5l7 2.5 2.5 7z" />
            </svg>
          </button>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M21 3 3 10.5l7 2.5 2.5 7z" />
          </svg>
        )}
      </div>
      <p className={s.likes}>
        {liked ? tx.te_gusta.replace('{n}', String(n - 1)) : tx.me_gusta.replace('{n}', String(n))}
      </p>
    </>
  );
}

/**
 * Escribir un comentario: queda guardado debajo de la publicación. Máximo 2 por publicación («no seas
 * acosador»); comentarse a uno mismo se puede, pero la app te dice que das pena.
 */
export function Composer({
  b,
  post,
  openRef,
}: {
  b: B;
  post: Publicacion;
  openRef: React.MutableRefObject<(() => void) | null>;
}) {
  const tx = b.data.textos;
  const toast = useToast();
  const add = useStore((st) => st.addBoringramComment);
  const offline = useOffline();
  const send = (t: string) => {
    if (offline()) return false;
    if ((useStore.getState().boringramComments[post.id]?.length ?? 0) >= 2) {
      playCancel();
      toast(tx.acosador);
      return true;
    }
    playSelect();
    add(post.id, t);
    if (post.autor === b.data.yo) toast(tx.propio_post);
    return true;
  };
  return (
    <div className={s.composer}>
      <Avatar perfil={b.perfiles[b.data.yo]} small />
      <KeyboardField
        id={`post:${post.id}`}
        placeholder={tx.agregar_comentario}
        submitLabel={tx.publicar}
        onSubmit={send}
        openRef={openRef}
      />
    </div>
  );
}

/** En el inicio, los dos primeros comentarios (y «Ver los N comentarios» si hay más); abierta, todos. */
export function Comments({ b, post, all, onMore }: { b: B; post: Publicacion; all?: boolean; onMore?: () => void }) {
  const tx = b.data.textos;
  const comments = b.commentsOf(post);
  const remove = useStore((st) => st.removeBoringramComment);
  if (comments.length === 0) return null;
  const list = all ? comments : comments.slice(0, 2);
  return (
    <div className={s.comments}>
      {!all && comments.length > 2 && (
        <button className={s.moreComments} onClick={onMore}>
          {tx.ver_comentarios.replace('{n}', String(comments.length))}
        </button>
      )}
      {list.map((c, i) => {
        // Los comentarios del jugador van después de los de la historia: esos se pueden borrar.
        const mine = i - post.comentarios.length;
        return (
          <p key={i} className={c.usuario === b.data.yo ? s.myComment : ''}>
            <b>{c.usuario}</b> {c.texto}
            {mine >= 0 && (
              <button
                className={s.deleteComment}
                onClick={() => {
                  playCancel();
                  remove(post.id, mine);
                }}
              >
                {tx.borrar}
              </button>
            )}
          </p>
        );
      })}
    </div>
  );
}

export function Post({
  b,
  post,
  onPerfil,
  onPost,
  full,
  tour,
}: {
  b: B;
  post: Publicacion;
  onPerfil: (id: string) => void;
  onPost?: (id: string) => void;
  full?: boolean;
  /** La publicación que señala el tutorial. */
  tour?: boolean;
}) {
  const tx = b.data.textos;
  const [slide, setSlide] = useState(0);
  const caption = post.carrusel?.[slide]?.texto ?? post.texto;
  const user = b.perfiles[post.autor]?.usuario ?? post.autor;
  const isNew = b.newPosts.has(post.id);
  const setLike = useStore((st) => st.setBoringramLike);
  const [burst, setBurst] = useState(0);
  const composer = useRef<(() => void) | null>(null);
  const offline = useOffline();
  // Doble toque en la foto: me gusta (nunca lo quita), con el corazón grande.
  const doubleTap = () => {
    if (offline()) return;
    if (!b.liked(post)) playSelect();
    setLike(post.id, true);
    setBurst((x) => x + 1);
  };
  return (
    <article className={`${s.post} ${post.tipo !== 'foto' ? s.textPost : ''}`}>
      {post.tipo === 'repost' && <p className={s.repostTag}>⟳ {tx.reposteo.replace('{usuario}', user)}</p>}
      <PostHead b={b} post={post} onPerfil={onPerfil} tour={tour} />
      {post.tipo === 'foto' && (
        <div className={s.postImage} onDoubleClick={doubleTap} data-tour={tour ? 'foto' : undefined}>
          {post.carrusel ? (
            <Carousel b={b} slides={post.carrusel} index={slide} onIndex={setSlide} />
          ) : (
            <Pic src={post.imagen!} />
          )}
          {burst > 0 && (
            <svg key={burst} viewBox="0 0 24 24" className={s.burst} aria-hidden>
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
            </svg>
          )}
          {isNew && <NewDot className={s.itemDot} />}
        </div>
      )}
      {post.tipo === 'texto' && (
        <p className={s.thought}>
          {post.texto}
          {isNew && <NewDot className={s.inlineDot} />}
        </p>
      )}
      {post.tipo === 'repost' && (
        <blockquote className={s.quoted}>
          <b>@{post.repost!.usuario}</b>
          <span>{post.repost!.texto}</span>
          {isNew && <NewDot className={s.inlineDot} />}
        </blockquote>
      )}
      <PostActions
        b={b}
        post={post}
        tour={tour}
        slide={slide}
        onComment={() => (full ? composer.current?.() : onPost?.(post.id))}
      />
      {post.tipo === 'foto' && (
        <p className={s.caption}>
          <b>{user}</b> {caption}
        </p>
      )}
      <Comments b={b} post={post} all={full} onMore={() => onPost?.(post.id)} />
      {full && <Composer b={b} post={post} openRef={composer} />}
    </article>
  );
}

/** Insignia de carrusel (varias fotos) en las cuadrículas, como en las redes. */
export function MultiIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.multiIcon} aria-hidden>
      <rect x="7" y="3" width="14" height="14" rx="2" />
      <path d="M17 21H5a2 2 0 0 1-2-2V7" />
    </svg>
  );
}

/**
 * Historias arriba del inicio: un círculo por cuenta con historias desbloqueadas (la tuya primero; después
 * las que tienen algo sin ver). Abre la más nueva sin ver o, si ya se vio todo, la más nueva.
 */
export function StoryRail({ b, onStory }: { b: B; onStory: (id: string) => void }) {
  const authors = [...new Set(b.destacadas.map((d) => d.autor))].filter((a) => b.perfiles[a]);
  if (authors.length === 0) return null;
  const unseen = (a: string) => b.destacadas.some((d) => d.autor === a && b.newStories.has(d.id));
  const order = authors.sort(
    (x, y) => Number(y === b.data.yo) - Number(x === b.data.yo) || Number(unseen(y)) - Number(unseen(x)),
  );
  const open = (a: string) => {
    const mine = b.destacadas.filter((d) => d.autor === a);
    const pick = mine.find((d) => b.newStories.has(d.id)) ?? mine.find((d) => !d.fijada) ?? mine[0];
    onStory(pick.id);
  };
  return (
    <div className={s.storyRail}>
      {order.map((a) => (
        <button key={a} type="button" className={s.storyRailItem} onClick={() => open(a)}>
          <Avatar perfil={b.perfiles[a]} ring={unseen(a)} />
          <small>{a === b.data.yo ? b.data.textos.tu_historia : b.perfiles[a].usuario}</small>
          {unseen(a) && <NewDot className={s.railDot} />}
        </button>
      ))}
    </div>
  );
}

export function Feed({
  b,
  onPerfil,
  onPost,
  onStory,
}: {
  b: B;
  onPerfil: (id: string) => void;
  onPost: (id: string) => void;
  onStory: (id: string) => void;
}) {
  if (b.publicaciones.length === 0) return <p className={s.empty}>{b.data.textos.sin_publicaciones}</p>;
  return (
    <div className={s.feed}>
      <StoryRail b={b} onStory={onStory} />
      {b.publicaciones.map((p) => (
        <Post key={p.id} b={b} post={p} onPerfil={onPerfil} onPost={onPost} />
      ))}
    </div>
  );
}

export function PostView({
  b,
  id,
  onBack,
  onPerfil,
}: {
  b: B;
  id: string;
  onBack: () => void;
  onPerfil: (id: string) => void;
}) {
  const markOpened = useStore((st) => st.markGalleryOpened);
  useEffect(() => markOpened(postKey(id)), [id, markOpened]);
  const post = b.publicaciones.find((p) => p.id === id);
  if (!post) return null;
  return (
    <div className={s.feed}>
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={onBack} aria-label={b.data.textos.atras}>
          ‹
        </button>
        <b>{b.perfiles[post.autor]?.usuario}</b>
      </div>
      <Post b={b} post={post} onPerfil={onPerfil} full tour />
    </div>
  );
}
