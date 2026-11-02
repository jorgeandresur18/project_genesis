// Prueba automática de rutas: `npm run test:routes`. Ver docs/SPEC.md, sección 7.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { config, endings, storyFiles, variables } from '../src/engine/story';
import { validateStory } from '../src/engine/validate';
import type { Scene } from '../src/engine/types';

const report = validateStory(storyFiles, variables, endings, config, (ref) => existsSync(`public/${ref}`));

describe('rutas de la historia', () => {
  it('no hay escenas rotas, variables sin declarar ni finales inalcanzables', () => {
    for (const w of report.warnings) console.warn(`aviso: ${w}`);
    console.info(`${report.states} estados recorridos, ${report.reachedEndings.size} finales alcanzados`);
    expect(report.errors).toEqual([]);
  });

  it('cada final del registro (salvo los ocultos de prueba) está en docs/FINALES.md', () => {
    const finales = readFileSync('docs/FINALES.md', 'utf8');
    const missing = endings.filter((e) => !e.oculto && !finales.includes(e.id.replace(/_\d+$/, '_')));
    expect(missing.map((e) => e.id)).toEqual([]);
  });

  it('el validador detecta una historia rota', () => {
    const base = {
      chapter: 0, background: null, video_fondo: null, loop_video: false, characters: [],
      dialogue: null, choices: [], conditions: [], audio: null, ui_effect: null, next: null,
    };
    const broken = [{
      ruta: 'demo', chapter: 0, title: 'rota',
      scenes: [
        { ...base, scene_id: 'a', choices: [{ text: 'x', next: 'no_existe', set: { inventada: 1 } }] },
        { ...base, scene_id: 'b', ending: 'f' },
      ],
    }];
    const r = validateStory(broken, {}, [{ id: 'f', nombre: 'f', pieza: 'demo', tipo: 'x', estado: 'jugable' }], { inicio: 'a' });
    const all = r.errors.join('\n');
    expect(all).toMatch(/escena inexistente "no_existe"/);
    expect(all).toMatch(/variable sin declarar "inventada"/);
    expect(all).toMatch(/Final inalcanzable: f/);
  });

  it('cada capítulo traducido al inglés tiene todas sus líneas y opciones', () => {
    for (const file of readdirSync('src/data/en/chapters')) {
      const en = JSON.parse(readFileSync(`src/data/en/chapters/${file}`, 'utf8')) as Record<string, { t: string; c?: string[] }>;
      const es = JSON.parse(readFileSync(`src/data/chapters/${file}`, 'utf8')) as { scenes: Scene[] };
      const problems: string[] = [];
      for (const s of es.scenes) {
        const tr = en[s.scene_id];
        if (s.dialogue?.text && !tr?.t) problems.push(`${s.scene_id}: falta la línea`);
        if ((tr?.c?.length ?? 0) !== s.choices.length) problems.push(`${s.scene_id}: opciones ${tr?.c?.length ?? 0}/${s.choices.length}`);
      }
      const ids = new Set(es.scenes.map((s) => s.scene_id));
      for (const id of Object.keys(en)) if (!ids.has(id)) problems.push(`${id}: no existe en ${file}`);
      expect(problems, file).toEqual([]);
    }
  });

  it('todo lo de Boringram se desbloquea con una escena que existe', () => {
    const data = JSON.parse(readFileSync('src/data/boringram.json', 'utf8'));
    const base = JSON.parse(readFileSync('src/data/boringram.json', 'utf8'));
    // Lo que agregan los capítulos siguientes (src/data/boringram/capNN.json).
    const extras = existsSync('src/data/boringram') ? readdirSync('src/data/boringram') : [];
    for (const f of extras) {
      const x = JSON.parse(readFileSync(`src/data/boringram/${f}`, 'utf8'));
      for (const k of ['publicaciones', 'destacadas', 'notificaciones', 'estado'])
        data[k] = [...(data[k] ?? []), ...(x[k] ?? [])];
      data.chats = [...data.chats, ...(x.chats ?? [])];
      const en = `src/data/en/boringram/${f}`;
      if (existsSync(en)) {
        const y = JSON.parse(readFileSync(en, 'utf8'));
        for (const k of ['publicaciones', 'destacadas', 'notificaciones'])
          expect(y[k]?.length ?? 0, `${en}: ${k}`).toBe(x[k]?.length ?? 0);
      }
    }
    const ids = new Set(storyFiles.flatMap((f) => f.scenes.map((s) => s.scene_id)));
    const refs = [
      ...Object.values(data.perfiles),
      ...data.publicaciones,
      ...data.destacadas,
      ...data.chats.flatMap((c: { mensajes: unknown[] }) => c.mensajes),
      ...data.notificaciones,
      ...data.estado,
    ].map((x) => (x as { desbloqueo: string | null }).desbloqueo);
    expect(refs.filter((r) => r && !ids.has(r))).toEqual([]);
    for (const p of data.publicaciones) if (p.imagen && !p.imagen.startsWith('PLACEHOLDER:')) expect(existsSync(`public/${p.imagen}`), p.imagen).toBe(true);
    // Cada foto tiene su página para compartir (npm run compartir).
    for (const p of base.publicaciones.filter((x: { tipo: string }) => x.tipo === 'foto'))
      expect(existsSync(`public/compartir/${p.id}.html`), `falta public/compartir/${p.id}.html: corre npm run compartir`).toBe(true);
    for (const h of base.destacadas.filter((x: { imagen: string }) => !x.imagen.startsWith('PLACEHOLDER:')))
      expect(existsSync(`public/compartir/${h.id}.html`), `falta public/compartir/${h.id}.html: corre npm run compartir`).toBe(true);
    // La versión en inglés se mezcla por posición: las listas tienen que tener el mismo largo.
    const en = JSON.parse(readFileSync('src/data/en/boringram.json', 'utf8'));
    expect(en.publicaciones.length).toBe(base.publicaciones.length);
    expect(en.chats.length).toBe(base.chats.length);
    base.publicaciones.forEach((p: { comentarios: unknown[] }, i: number) =>
      expect(en.publicaciones[i].comentarios?.length ?? p.comentarios.length, `comentarios de ${i}`).toBe(p.comentarios.length),
    );
  });

  it('un final canon no cambia sin cambiar también docs/FINALES.md', () => {
    let staged: string[];
    try {
      staged = execSync('git diff --cached --name-only', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        .split('\n')
        .filter(Boolean);
    } catch {
      return; // Fuera de un repositorio git no hay nada que comparar.
    }
    const canonTouched = staged.some((f) => /^src\/data\/finales\/canon_/.test(f));
    if (canonTouched) expect(staged).toContain('docs/FINALES.md');
  });
});

describe('árbol de decisiones', () => {
  it('las peleas se abren en ramas: ganar, perder (el bad end) y el perdón', async () => {
    const { buildFlow } = await import('../src/engine/flow');
    const { scenes } = await import('../src/engine/story');
    const flow = buildFlow(scenes, config.inicio, variables, 100);
    const de = (id: string) => flow.edges.filter((e) => e.from === id).map((e) => e.to);
    // Nikki: perderla termina en su bad end y el perdón sigue por su lado.
    const nikki = flow.nodes.find((n) => n.pelea && scenes.get(n.sceneId!)?.batalla === 'nikki')!;
    expect(nikki).toBeDefined();
    const badEnd = (id: string) => de(id).some((to) => endings.find((e) => e.id === scenes.get(to)?.ending)?.tipo === 'Bad end');
    expect(badEnd(nikki.id)).toBe(true);
    expect(de(nikki.id).length).toBeGreaterThanOrEqual(3);
    // El Bastión: perder también lleva a su bad end.
    const bastion = flow.nodes.find((n) => n.pelea && scenes.get(n.sceneId!)?.batalla === 'bastion')!;
    expect(bastion).toBeDefined();
    expect(badEnd(bastion.id)).toBe(true);
  });
});
