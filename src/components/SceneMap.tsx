import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useStore } from '../engine/store';
import { BAD_END, config, endingName, getEnding, scenes, storyFiles, variables } from '../engine/story';
import { useLang, useT } from '../engine/i18n';
import { buildFlow, type FlowGroup, type FlowNode } from '../engine/flow';
import mapa from '../data/mapa.json';
import { choiceText, lineText } from '../engine/storyText';
import { Panel } from './Panels';

const NODE_W = 190;
const NODE_H = 56;
const COL_GAP = 56;
const ROW_GAP = 66;
const PAD = 40;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2.2;
// Movimiento mínimo (px) para que un arrastre no cuente como clic en un nodo.
const DRAG_THRESHOLD = 6;

interface View {
  x: number;
  y: number;
  k: number;
}
const clamp = (k: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, k));

// La historia es estática: un diagrama por capítulo, calculado una sola vez. Cada capítulo empieza en su
// primera escena (el 1, en el inicio del juego) y llega hasta su fin: así el mapa no se vuelve interminable.
// Los grupos (src/data/mapa.json, p. ej. verdad o reto) salen plegados; al tocarlos se ve la versión abierta.
const GROUPS: FlowGroup[] = mapa.grupos.map((g) => ({ id: g.id, label: g.nombre, prefixes: g.prefijos }));
const sized = (flow: ReturnType<typeof buildFlow>) => ({
  flow,
  width: flow.columns * (NODE_W + COL_GAP) - COL_GAP + PAD * 2,
  height: Math.max(...flow.nodes.map((n) => n.y)) + NODE_H + PAD * 2,
});
const CHAPTERS = [...new Set(storyFiles.map((f) => f.chapter))]
  .sort((a, b) => a - b)
  .map((chapter) => {
    const file = storyFiles.find((f) => f.chapter === chapter)!;
    const start = chapter === scenes.get(config.inicio)?.chapter ? config.inicio : file.scenes[0].scene_id;
    const folded = sized(buildFlow(scenes, start, variables, ROW_GAP, GROUPS));
    const hasGroups = folded.flow.nodes.some((n) => n.kind === 'group');
    return {
      chapter,
      first: start,
      folded,
      open: hasGroups ? sized(buildFlow(scenes, start, variables, ROW_GAP)) : folded,
    };
  });
const groupName = (id: string, lang: string) => {
  const g = mapa.grupos.find((x) => `group:${x.id}` === id);
  return g ? (lang === 'en' ? g.nombre_en : g.nombre) : id;
};
// Minimapa: como mucho este tamaño (px).
const MINI_W = 220;
const MINI_H = 110;
const pos = (n: FlowNode) => ({ x: PAD + n.col * (NODE_W + COL_GAP), y: PAD + n.y });

/**
 * Mapa de decisiones estilo Shiny Days: árbol horizontal con las decisiones, sus opciones y a dónde llevan.
 * Solo se mira: muestra lo visto y lo que falta, pero no deja saltar (para volver a un punto, el guardado).
 * Se arrastra para moverse y se acerca o aleja con la rueda, pellizcando o con los botones.
 */
export function SceneMap({ onClose }: { onClose: () => void }) {
  const snapshots = useStore((s) => s.snapshots);
  const choicesTaken = useStore((s) => s.choicesTaken);
  const endingsSeen = useStore((s) => s.endingsSeen);
  const current = useStore((s) => s.game?.sceneId);
  const t = useT();
  const lang = useLang();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  // Pestañas: los capítulos que ya se empezaron (el 1 siempre). Abre en el capítulo de la escena actual.
  const tabs = CHAPTERS.filter((c, i) => i === 0 || snapshots[c.first]);
  const [chapter, setChapter] = useState(
    () =>
      (current && tabs.find((c) => c.chapter === scenes.get(current)?.chapter)?.chapter) ??
      tabs[tabs.length - 1].chapter,
  );
  // Grupo abierto (verdad o reto): se ve el árbol entero; si no, el grupo es un solo nodo.
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const chapterData = CHAPTERS.find((c) => c.chapter === chapter)!;
  const { flow, width, height } = openGroup ? chapterData.open : chapterData.folded;
  const groupMembers = (id: string) => chapterData.folded.flow.nodes.find((n) => n.id === id)?.members ?? [];

  const reached = (n: FlowNode): boolean => {
    switch (n.kind) {
      case 'start':
        return true;
      case 'decision':
        return !!snapshots[n.sceneId!];
      case 'group':
        return (n.members ?? []).some((id) => snapshots[id]);
      case 'option':
        return !!choicesTaken[n.id];
      case 'ending': {
        const s = scenes.get(n.sceneId!)!;
        return s.ending ? !!endingsSeen[s.ending] : !!snapshots[s.scene_id];
      }
    }
  };
  const byId = new Map(flow.nodes.map((n) => [n.id, n]));

  // Centra la vista en un nodo (la decisión actual o la última alcanzada).
  const focusNode = useCallback((n: FlowNode | undefined, k = 1) => {
    const vp = viewportRef.current;
    if (!vp || !n) return;
    const p = pos(n);
    setView({ k, x: vp.clientWidth / 2 - (p.x + NODE_W / 2) * k, y: vp.clientHeight / 2 - (p.y + NODE_H / 2) * k });
  }, []);
  const focusTarget = () =>
    flow.nodes.find((n) => n.kind === 'decision' && n.sceneId === current) ??
    flow.nodes.filter((n) => n.kind === 'decision' && reached(n)).sort((a, b) => b.col - a.col)[0] ??
    flow.nodes[0];
  const fitAll = () => {
    const vp = viewportRef.current;
    if (!vp) return;
    const k = clamp(Math.min(vp.clientWidth / width, vp.clientHeight / height));
    setView({ k, x: (vp.clientWidth - width * k) / 2, y: (vp.clientHeight - height * k) / 2 });
  };
  // Al abrir (y al cambiar de capítulo): centrado en la decisión actual o en la última alcanzada.
  useEffect(() => {
    setOpenGroup(null);
    focusNode(focusTarget());
    // Solo al abrir el mapa o cambiar de capítulo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter]);
  // Al abrir un grupo: centrado en su primera decisión.
  useEffect(() => {
    if (!openGroup) return;
    const first = groupMembers(openGroup)[0];
    focusNode(
      flow.nodes.find((n) => n.kind === 'decision' && n.sceneId === first),
      view.k,
    );
    // Solo al abrir un grupo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openGroup]);
  const foldGroup = () => {
    const id = openGroup;
    setOpenGroup(null);
    // Después de plegar, el grupo vuelve a ser un nodo: se centra en él.
    requestAnimationFrame(() =>
      focusNode(
        chapterData.folded.flow.nodes.find((n) => n.id === id),
        view.k,
      ),
    );
  };

  // Tamaño del área visible (para el minimapa).
  const [vpSize, setVpSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const update = () => setVpSize({ w: vp.clientWidth, h: vp.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(vp);
    return () => ro.disconnect();
  }, []);

  // Zoom con centro en un punto de la pantalla (el cursor o el medio del pellizco).
  const zoomAt = (factor: number, cx: number, cy: number) =>
    setView((v) => {
      const k = clamp(v.k * factor);
      return { k, x: cx - ((cx - v.x) * k) / v.k, y: cy - ((cy - v.y) * k) / v.k };
    });
  const zoomCenter = (factor: number) => {
    const vp = viewportRef.current;
    if (vp) zoomAt(factor, vp.clientWidth / 2, vp.clientHeight / 2);
  };

  // Rueda del mouse (no pasiva, para que la página no se desplace).
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    vp.addEventListener('wheel', onWheel, { passive: false });
    return () => vp.removeEventListener('wheel', onWheel);
  }, []);

  // Arrastrar con un dedo o el mouse; pellizcar con dos dedos.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: 0, pinch: 0 });
  const onPointerDown = (e: ReactPointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current.moved = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, next);
    if (pointers.current.size === 1) {
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      gesture.current.moved += Math.abs(dx) + Math.abs(dy);
      // Recién al pasar el umbral se toma el puntero: así un toque corto sigue siendo un clic en el nodo.
      if (gesture.current.moved > DRAG_THRESHOLD) {
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      }
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const r = viewportRef.current!.getBoundingClientRect();
      if (gesture.current.pinch)
        zoomAt(dist / gesture.current.pinch, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      gesture.current.pinch = dist;
      gesture.current.moved = DRAG_THRESHOLD + 1;
    }
  };
  const onPointerUp = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) gesture.current.pinch = 0;
  };

  const label = (n: FlowNode): string => {
    if (n.kind === 'start') return t('mapa.inicio');
    if (n.kind === 'group') return reached(n) ? `${groupName(n.id, lang)} · ${t('mapa.grupo_abrir')}` : '???';
    if (n.kind === 'ending') {
      const s = scenes.get(n.sceneId!)!;
      if (!s.ending) return reached(n) ? t('mapa.fin_capitulo', { n: s.fin_capitulo ?? '' }) : '???';
      const id = s.ending;
      const e = getEnding(id);
      const prefix = e?.tipo === BAD_END ? t('mapa.bad') : t('mapa.fin');
      return reached(n) ? `${prefix}: ${e ? endingName(e, lang) : id}` : '???';
    }
    if (n.kind === 'decision') return reached(n) ? lineText(n.sceneId, n.label, lang) : '???';
    // Opción: se ve si ya se eligió, o si está tachada en una decisión ya vista.
    if (reached(n) || (n.locked && snapshots[n.sceneId!])) return choiceText(n.sceneId, n.choiceIndex, n.label, lang);
    return '???';
  };

  return (
    <Panel title={t('mapa.titulo')} onClose={onClose} wide>
      {tabs.length > 1 && (
        <div className="flow-tabs" role="tablist">
          {tabs.map((c) => (
            <button
              key={c.chapter}
              role="tab"
              aria-selected={c.chapter === chapter}
              className={c.chapter === chapter ? 'active' : ''}
              onClick={() => setChapter(c.chapter)}
            >
              {t('mapa.capitulo', { n: c.chapter })}
            </button>
          ))}
        </div>
      )}
      <div
        className={`flow-viewport ${gesture.current.moved > DRAG_THRESHOLD ? 'flow-dragging' : ''}`}
        ref={viewportRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="flow"
          style={{ width, height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})` }}
        >
          <svg className="flow-edges" width={width} height={height}>
            {flow.edges.map((e, i) => {
              const a = byId.get(e.from)!;
              const b = byId.get(e.to)!;
              const pa = pos(a);
              const pb = pos(b);
              const x1 = pa.x + NODE_W;
              const y1 = pa.y + NODE_H / 2;
              const x2 = pb.x;
              const y2 = pb.y + NODE_H / 2;
              const mid = (x1 + x2) / 2;
              return (
                <path
                  key={i}
                  d={`M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`}
                  className={reached(a) && reached(b) ? 'flow-edge flow-edge-taken' : 'flow-edge'}
                />
              );
            })}
          </svg>
          {flow.nodes.map((n) => {
            const p = pos(n);
            const ok = reached(n);
            // Solo se mira: los grupos (verdad o reto) se abren; a una decisión no se salta (para eso, el guardado).
            const canOpen = n.kind === 'group' && ok;
            const classes = [
              'flow-node',
              `flow-${n.kind}`,
              ok ? 'flow-reached' : 'flow-unknown',
              n.locked ? 'flow-locked' : '',
              n.kind === 'ending' && getEnding(scenes.get(n.sceneId!)!.ending ?? '')?.tipo === BAD_END
                ? 'flow-bad'
                : '',
              n.sceneId === current && n.kind === 'decision' ? 'flow-current' : '',
            ].join(' ');
            return (
              <button
                key={n.id}
                className={classes}
                style={{ left: p.x, top: p.y, width: NODE_W, height: NODE_H }}
                disabled={!canOpen}
                title={canOpen ? t('mapa.grupo_abrir') : undefined}
                onClick={() => {
                  // Si fue un arrastre, no es un clic.
                  if (gesture.current.moved > DRAG_THRESHOLD) return;
                  setOpenGroup(n.id);
                }}
              >
                <span>{label(n)}</span>
              </button>
            );
          })}
        </div>
        <div className="flow-controls" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => zoomCenter(1.25)} aria-label={t('mapa.acercar')}>
            +
          </button>
          <span>{Math.round(view.k * 100)} %</span>
          <button onClick={() => zoomCenter(0.8)} aria-label={t('mapa.alejar')}>
            −
          </button>
          <button onClick={fitAll}>{t('mapa.ver_todo')}</button>
          <button onClick={() => focusNode(focusTarget())}>{t('mapa.ir_actual')}</button>
          {openGroup && <button onClick={foldGroup}>{t('mapa.plegar', { nombre: groupName(openGroup, lang) })}</button>}
        </div>
        <Minimap
          nodes={flow.nodes}
          width={width}
          height={height}
          view={view}
          vp={vpSize}
          reached={reached}
          current={current}
          onCenter={(cx, cy) => setView((v) => ({ ...v, x: vpSize.w / 2 - cx * v.k, y: vpSize.h / 2 - cy * v.k }))}
        />
      </div>
      <div className="flow-legend">
        <span className="flow-chip flow-chip-decision">{t('mapa.ley_decision')}</span>
        <span className="flow-chip">{t('mapa.ley_opcion')}</span>
        <span className="flow-chip flow-chip-bad">{t('mapa.ley_bad')}</span>
        <span className="flow-chip">{t('mapa.ley_fin')}</span>
        <span className="flow-chip flow-chip-unknown">{t('mapa.ley_desconocido')}</span>
        <span className="muted flow-hint">{t('mapa.ayuda')}</span>
      </div>
    </Panel>
  );
}

/**
 * Minimapa: el árbol entero en chico, con un recuadro que marca lo que se está viendo. Tocar o arrastrar
 * sobre él lleva la vista a ese punto.
 */
function Minimap({
  nodes,
  width,
  height,
  view,
  vp,
  reached,
  current,
  onCenter,
}: {
  nodes: FlowNode[];
  width: number;
  height: number;
  view: View;
  vp: { w: number; h: number };
  reached: (n: FlowNode) => boolean;
  current?: string;
  onCenter: (x: number, y: number) => void;
}) {
  const k = Math.min(MINI_W / width, MINI_H / height);
  const w = width * k;
  const h = height * k;
  const dragging = useRef(false);
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    onCenter((e.clientX - r.left) / k, (e.clientY - r.top) / k);
  };
  const kindOf = (n: FlowNode) => {
    if (n.kind === 'group') return 'mini-group';
    if (n.kind === 'decision' && n.sceneId === current) return 'mini-current';
    if (n.kind === 'ending' && getEnding(scenes.get(n.sceneId!)!.ending ?? '')?.tipo === BAD_END) return 'mini-bad';
    return reached(n) ? 'mini-reached' : '';
  };
  return (
    <div
      className="flow-minimap"
      style={{ width: w, height: h }}
      onPointerDown={(e) => {
        e.stopPropagation();
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e);
      }}
      onPointerMove={(e) => dragging.current && move(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      aria-hidden
    >
      <svg width={w} height={h}>
        {nodes.map((n) => {
          const p = pos(n);
          return (
            <rect
              key={n.id}
              x={p.x * k}
              y={p.y * k}
              width={Math.max(1.5, NODE_W * k)}
              height={Math.max(1.5, NODE_H * k)}
              className={`mini-node ${kindOf(n)}`}
            />
          );
        })}
        <rect
          className="mini-view"
          x={(-view.x / view.k) * k}
          y={(-view.y / view.k) * k}
          width={(vp.w / view.k) * k}
          height={(vp.h / view.k) * k}
        />
      </svg>
    </div>
  );
}
