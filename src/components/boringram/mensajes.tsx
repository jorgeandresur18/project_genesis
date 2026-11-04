import { useEffect } from 'react';
import { useStore } from '../../engine/store';
import { chatKey } from '../../engine/boringram';
import { NewDot } from '../CgGallery';
import s from '../Boringram.module.css';
import { type B } from './comun';
import { Avatar } from './publicaciones';

// Los mensajes de Boringram (ver ../Boringram.tsx).
export function Inbox({ b, onChat }: { b: B; onChat: (id: string) => void }) {
  const tx = b.data.textos;
  return (
    <div className={s.inbox}>
      <div className={s.topBar}>
        <b>{tx.mensajes}</b>
      </div>
      {b.chats.map((c) => {
        const perfil = c.perfil ? b.perfiles[c.perfil] : undefined;
        const last = c.mensajes[c.mensajes.length - 1];
        const isNew = b.newChats.has(c.id);
        return (
          <button key={c.id} className={`${s.chatRow} ${isNew ? s.unread : ''}`} onClick={() => onChat(c.id)}>
            <Avatar perfil={perfil} inicial={c.nombre} />
            <span className={s.chatInfo}>
              <b>{perfil?.usuario ?? c.nombre}</b>
              <small>
                {last.de === 'yo' ? `${tx.tu} ` : ''}
                {last.texto}
              </small>
            </span>
            {c.visto ? <span className={s.seen}>{tx.visto}</span> : isNew && <NewDot />}
          </button>
        );
      })}
    </div>
  );
}

export function ChatView({
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
  const tx = b.data.textos;
  const markOpened = useStore((st) => st.markGalleryOpened);
  const chat = b.chats.find((c) => c.id === id);
  useEffect(() => {
    if (chat) markOpened(chatKey(chat.id, chat.mensajes.length));
  }, [chat, markOpened]);
  if (!chat) return null;
  const perfil = chat.perfil ? b.perfiles[chat.perfil] : undefined;
  return (
    <div className={s.chatView}>
      <div className={s.topBar}>
        <button className={s.backBtn} onClick={onBack} aria-label={tx.atras}>
          ‹
        </button>
        <button className={s.chatTitle} onClick={() => chat.perfil && onPerfil(chat.perfil)} disabled={!perfil}>
          <Avatar perfil={perfil} small inicial={chat.nombre} />
          <span>
            <b>{perfil?.usuario ?? chat.nombre}</b>
            <small>{chat.estado}</small>
          </span>
        </button>
      </div>
      <div className={s.messages}>
        {chat.mensajes.map((m, i) => (
          <div key={i} className={s.messageBlock}>
            {m.dia && <span className={s.day}>{m.dia}</span>}
            <div className={`${s.bubble} ${m.de === 'yo' ? s.mine : ''} ${m.destacado ? s.starred : ''}`}>
              {m.destacado && <span className={s.star}>{tx.destacado}</span>}
              {m.texto}
              <small>{m.pendiente ? '🕓' : m.hora}</small>
            </div>
          </div>
        ))}
        {chat.visto && <span className={s.seenLine}>{tx.visto_chat}</span>}
      </div>
      <div className={s.compose}>{tx.escribir}</div>
    </div>
  );
}
