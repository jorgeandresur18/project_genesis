import { useEffect, useState } from 'react';
import { useStore } from '../engine/store';
import { assetUrl } from '../engine/assets';
import { playCancel, playSelect } from '../engine/sound';
import { PRUEBA, codigoDiploma, type Curso, type Nivel } from '../engine/bootcamp';
import { useCurso } from './bootcampDatos';
import conoceMas from '../data/conoce_mas.json';

/**
 * El diploma de un nivel del Bootcamp: el nombre del alumno manuscrito, un código al azar con cara de oficial, la
 * letra chica que dice que no vale nada y los enlaces del juego (el repositorio y la página del autor, que salen de
 * «Conoce más»). Se descarga como imagen o se comparte en redes; también se publica en LinkedFired (el chiste).
 */
const fmt = (s: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce((out, [k, v]) => out.replace(`{${k}}`, String(v)), s);
/** Los enlaces que van en el diploma (marcados en src/data/conoce_mas.json). */
const ENLACES = (conoceMas.enlaces as { texto: string; url: string; en_diploma?: boolean }[]).filter((l) => l.en_diploma);
const FIRMA = '"Great Vibes", "Segoe Script", cursive';

export function DiplomaView({
  nivel,
  onPublicar,
  onVolver,
}: {
  nivel: Nivel;
  onPublicar: () => void;
  onVolver: () => void;
}) {
  const { tx } = useCurso();
  const d = nivel.diploma!;
  const nombre = useStore((s) => s.bootcampNombre);
  const guardado = useStore((s) => s.bootcampDiplomas[nivel.id]);
  const [deUnUso] = useState(() => ({ codigo: codigoDiploma(nivel.id), fecha: new Date().toISOString() }));
  const emitido = PRUEBA ? (guardado ?? deUnUso) : guardado;
  const emitir = useStore((s) => s.emitirDiploma);
  const publicado = useStore((s) => (s.bootcampHechas[`diploma:${nivel.id}`] ?? 0) >= 2);
  const [compartir, setCompartir] = useState(false);
  const [nota, setNota] = useState('');
  // La primera vez que se ve, se emite: código y fecha quedan guardados para siempre.
  useEffect(() => {
    if (!emitido && !PRUEBA) emitir(nivel.id, codigoDiploma(nivel.id));
  }, [emitido, emitir, nivel.id]);
  if (!emitido) return null;
  const fecha = new Date(emitido.fecha).toLocaleDateString(tx.fecha_idioma, { day: 'numeric', month: 'long', year: 'numeric' });
  const texto = fmt(tx.compartir_texto, { titulo: d.titulo, codigo: emitido.codigo });
  const archivo = `diploma-bootcamp-genesis-${nivel.id}.png`;
  const imagen = () => dibujar(tx, { nombre, titulo: d.titulo, texto: d.texto, codigo: emitido.codigo, fecha });
  const descargar = async () => {
    playSelect();
    const url = (await imagen()).toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = archivo;
    a.click();
  };
  /** Compartir el archivo con el menú del sistema (celular); si no se puede, se descarga. */
  const compartirArchivo = async (aviso?: string) => {
    const canvas = await imagen();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
    const file = blob && new File([blob], archivo, { type: 'image/png' });
    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text: texto }).catch(() => {});
      return;
    }
    await descargar();
    if (aviso) setNota(aviso);
  };
  const abrir = (url: string) => {
    playSelect();
    window.open(url, '_blank', 'noopener');
  };
  const sitio = encodeURIComponent(tx.sitio);
  const t = encodeURIComponent(texto);

  return (
    <div className="bc-stage bc-diploma-wrap">
      <article className="bc-diploma">
        <img className="bc-diploma-emblem" src={assetUrl('marca/bootcamp_emblema.webp')} alt="" draggable={false} />
        <small>BOOTCAMP GENESIS · {tx.otorgado}</small>
        <p className="bc-diploma-name">{nombre}</p>
        <small>{tx.por}</small>
        <h2>{d.titulo}</h2>
        <p>{d.texto}</p>
        <div className="bc-signs">
          <span>{tx.diploma_firma_1}</span>
          <span>{tx.diploma_firma_2}</span>
        </div>
        <footer className="bc-diploma-foot">
          <span>
            {tx.codigo}: <b>{emitido.codigo}</b>
            <br />
            {fmt(tx.fecha, { fecha })}
          </span>
          <span className="bc-diploma-links">
            {tx.mas_info}:
            {ENLACES.map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                {l.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            ))}
          </span>
        </footer>
        <p className="bc-fine">{tx.letra_chica}</p>
      </article>
      <div className="bc-actions">
        <button
          className="bc-btn bc-btn-ghost"
          onClick={() => {
            playCancel();
            onVolver();
          }}
        >
          {tx.volver}
        </button>
        <button className="bc-btn" onClick={() => void descargar()}>
          ⬇ {tx.descargar}
        </button>
        <button
          className="bc-btn"
          onClick={() => {
            playSelect();
            setCompartir((v) => !v);
          }}
        >
          ↗ {tx.compartir}
        </button>
        <button className="bc-btn bc-btn-linked" onClick={onPublicar}>
          in {publicado ? tx.publicado : tx.publicar}
        </button>
      </div>
      {compartir && (
        <div className="bc-share">
          <button onClick={() => abrir(`https://www.linkedin.com/sharing/share-offsite/?url=${sitio}`)}>
            <span className="bc-share-in">in</span>LinkedIn
          </button>
          <button onClick={() => abrir(`https://www.facebook.com/sharer/sharer.php?u=${sitio}&quote=${t}`)}>
            <span className="bc-share-fb">f</span>Facebook
          </button>
          <button onClick={() => void compartirArchivo(tx.instagram_nota)}>
            <img src={assetUrl('marca/redes/instagram.webp')} alt="" draggable={false} />
            Instagram
          </button>
          <button onClick={() => abrir(`https://wa.me/?text=${t}%20${sitio}`)}>
            <img src={assetUrl('marca/redes/whatsapp.webp')} alt="" draggable={false} />
            WhatsApp
          </button>
          <button onClick={() => abrir(`https://twitter.com/intent/tweet?text=${t}&url=${sitio}`)}>
            <img src={assetUrl('marca/redes/x.webp')} alt="" draggable={false} />X
          </button>
          <button
            onClick={() => {
              playSelect();
              void navigator.clipboard?.writeText(`${texto} ${tx.sitio}`).then(() => setNota(tx.copiado));
            }}
          >
            <span className="bc-share-in">🔗</span>
            {tx.copiar}
          </button>
          {nota && <p className="bc-share-note">{nota}</p>}
        </div>
      )}
    </div>
  );
}

/** El diploma como imagen (1600 × 1130), para descargarlo o compartirlo. */
async function dibujar(tx: Curso['textos'], d: { nombre: string; titulo: string; texto: string; codigo: string; fecha: string }) {
  const W = 1600;
  const H = 1130;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  await document.fonts.load(`120px ${FIRMA}`).catch(() => {});
  const emblema = await cargar(assetUrl('marca/bootcamp_emblema.webp')).catch(() => null);

  const fondo = g.createLinearGradient(0, 0, W, H);
  fondo.addColorStop(0, '#fbf6e9');
  fondo.addColorStop(1, '#ecdfc1');
  g.fillStyle = fondo;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = '#b89b55';
  g.lineWidth = 6;
  g.strokeRect(40, 40, W - 80, H - 80);
  g.lineWidth = 2;
  g.strokeRect(58, 58, W - 116, H - 116);

  if (emblema) g.drawImage(emblema, W / 2 - 60, 90, 120, 119);
  g.textAlign = 'center';
  g.fillStyle = '#8a6d2c';
  g.font = '700 26px system-ui, sans-serif';
  espaciado(g, `BOOTCAMP GENESIS · ${tx.otorgado.toUpperCase()}`, W / 2, 255, 8);
  g.fillStyle = '#2b2620';
  g.font = `120px ${FIRMA}`;
  g.fillText(d.nombre, W / 2, 390, W - 260);
  g.strokeStyle = '#b89b55';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(W / 2 - 420, 420);
  g.lineTo(W / 2 + 420, 420);
  g.stroke();
  g.fillStyle = '#8a6d2c';
  g.font = '700 24px system-ui, sans-serif';
  espaciado(g, tx.por.toUpperCase(), W / 2, 470, 6);
  g.fillStyle = '#2b2620';
  g.font = '700 54px Georgia, "Times New Roman", serif';
  const y = parrafo(g, d.titulo, W / 2, 545, W - 360, 62);
  g.font = '28px Georgia, serif';
  g.fillStyle = '#3d362c';
  parrafo(g, d.texto, W / 2, y + 40, W - 420, 40);

  // Firmas
  g.font = '22px system-ui, sans-serif';
  g.fillStyle = '#6b5d40';
  for (const [x, firma] of [
    [W / 2 - 330, tx.diploma_firma_1],
    [W / 2 + 330, tx.diploma_firma_2],
  ] as const) {
    g.beginPath();
    g.moveTo(x - 230, 840);
    g.lineTo(x + 230, 840);
    g.stroke();
    g.fillText(firma, x, 872);
  }
  g.font = `52px ${FIRMA}`;
  g.fillStyle = '#2b2620';
  g.fillText('Jair', W / 2 - 330, 825);

  // Código, fecha y enlaces
  g.textAlign = 'left';
  g.font = '20px ui-monospace, Consolas, monospace';
  g.fillStyle = '#6b5d40';
  g.fillText(`${tx.codigo}: ${d.codigo}`, 100, 955);
  g.fillText(fmt(tx.fecha, { fecha: d.fecha }), 100, 983);
  g.textAlign = 'right';
  ENLACES.forEach((l, i) => g.fillText(l.url.replace(/^https?:\/\//, '').replace(/\/$/, ''), W - 100, 955 + i * 28));
  g.textAlign = 'center';
  g.font = 'italic 17px Georgia, serif';
  g.fillStyle = '#8a7a5a';
  parrafo(g, tx.letra_chica, W / 2, 1028, W - 320, 24);

  // El sello
  const sello = g.createRadialGradient(W - 175, 175, 10, W - 165, 185, 80);
  sello.addColorStop(0, '#ff6b6b');
  sello.addColorStop(1, '#a8101a');
  g.fillStyle = sello;
  g.beginPath();
  g.arc(W - 170, 180, 78, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fff';
  g.font = '800 22px system-ui, sans-serif';
  g.fillText(tx.sello_1, W - 170, 175);
  g.font = '700 16px system-ui, sans-serif';
  g.fillText(tx.sello_2, W - 170, 200);
  return c;
}

function cargar(src: string) {
  return new Promise<HTMLImageElement>((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = src;
  });
}

/** Texto centrado con espacio entre letras. */
function espaciado(g: CanvasRenderingContext2D, s: string, x: number, y: number, sp: number) {
  const ancho = [...s].reduce((n, ch) => n + g.measureText(ch).width + sp, -sp);
  let cx = x - ancho / 2;
  g.textAlign = 'left';
  for (const ch of s) {
    g.fillText(ch, cx, y);
    cx += g.measureText(ch).width + sp;
  }
  g.textAlign = 'center';
}

/** Párrafo centrado que se corta en líneas; devuelve dónde terminó. */
function parrafo(g: CanvasRenderingContext2D, s: string, x: number, y: number, ancho: number, alto: number) {
  let linea = '';
  for (const palabra of s.split(' ')) {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (g.measureText(prueba).width > ancho && linea) {
      g.fillText(linea, x, y);
      y += alto;
      linea = palabra;
    } else linea = prueba;
  }
  if (linea) g.fillText(linea, x, y);
  return y;
}
