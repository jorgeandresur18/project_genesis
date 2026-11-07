# Separa la galería de personajes del autor (un HTML pesado con todas las hojas adentro) en una carpeta por personaje,
# cada una con su propio HTML liviano (el mismo visor, con un solo personaje). Así el autor le pasa a Claude solo el
# personaje que cambió, y el importador del combate (tools/batalla_sprites.py) puede leer la carpeta entera.
#
#   python -I -X utf8 tools/sprites_separar.py separar "docs/sprites de prueba/sprites_rpg_8.html"
#       → docs/sprites de prueba/personajes/<id>/<id>.html (uno por personaje) y un índice personajes/index.html.
#   python -I -X utf8 tools/sprites_separar.py juntar
#       → docs/sprites de prueba/personajes/todos.html (todos juntos otra vez, en el orden del índice).
#
# Para cambiar un personaje: reemplazar su <id>.html por el nuevo (del mismo visor) y listo; el resto queda igual.
import html
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CARPETA = RAIZ / 'docs' / 'sprites de prueba' / 'personajes'
ORDEN = CARPETA / 'orden.json'
# Cómo se llama cada uno en el juego (la carpeta lleva ese nombre; el visor del autor usa otros: kimono, lentes…).
EN_EL_JUEGO = {
    'lentes': 'Jair', 'cami': 'Cami', 'kimono': 'Rikka', 'nikki': 'Nikki', 'princesa': 'Rikka princesa de luna',
    'armored': 'Cami armored', 'camiblaster': 'Cami armored blaster', 'berserk': 'Cami berserk',
    'ninja': 'Soldado', 'soldado': 'Capitan', 'sombra': 'Sombra', 'piedra': 'Sombra de roca',
    'piedras': 'Sombra de roca - piedras', 'bola': 'Nikki - bola toxica',
}


def carpeta_de(c: dict) -> Path:
    return CARPETA / f"{EN_EL_JUEGO.get(c['id'], c['name'])} ({c['id']})"


def partes(texto: str):
    """El visor en tres partes: lo de antes de los datos, la lista de personajes y lo de después."""
    i = texto.index('const CHARS=')
    j = texto.index('];', i) + 1
    return texto[:i], json.loads(texto[i + len('const CHARS='):j]), texto[j:]


def armar(antes: str, chars: list, despues: str, intro: str) -> str:
    antes = re.sub(r'<p id="intro">[^<]*</p>', f'<p id="intro">{html.escape(intro)}</p>', antes, count=1)
    return antes + 'const CHARS=' + json.dumps(chars, ensure_ascii=False, separators=(',', ':')) + despues


def separar(ruta: Path):
    antes, chars, despues = partes(ruta.read_text(encoding='utf8'))
    CARPETA.mkdir(parents=True, exist_ok=True)
    filas = []
    for c in chars:
        d = carpeta_de(c)
        d.mkdir(exist_ok=True)
        f = d / f"{c['id']}.html"
        f.write_text(armar(antes, [c], despues, f"{c['name']}: sus hojas y animaciones (separado de {ruta.name})."), encoding='utf8')
        kb = f.stat().st_size // 1024
        filas.append((c['id'], EN_EL_JUEGO.get(c['id'], c['name']), kb, list(c['anims']), d.name))
        print(f"{d.name:40s} {kb:6d} KB")
    ORDEN.write_text(json.dumps([x[0] for x in filas], ensure_ascii=False, indent=1) + '\n', encoding='utf8')
    # El índice: un enlace a cada personaje, con sus animaciones.
    items = ''.join(
        f'<li><a href="{html.escape(carp)}/{html.escape(i)}.html"><b>{html.escape(n)}</b></a> <small>({i}, {kb} KB)</small><br>'
        f'<span>{html.escape(", ".join(a))}</span></li>'
        for i, n, kb, a, carp in filas
    )
    (CARPETA / 'index.html').write_text(
        '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
        '<title>Personajes del combate</title><style>body{margin:0;padding:24px 16px;font:15px/1.5 system-ui,sans-serif;'
        'background:#151218;color:#efe9f2}main{max-width:760px;margin:0 auto}a{color:#ff8fbd}li{margin:0 0 12px}'
        'span,small{color:#a397a9}</style></head><body><main><h1>Personajes del combate</h1>'
        f'<p>Separados de <code>{html.escape(ruta.name)}</code>. Cada carpeta tiene el HTML de un solo personaje: para '
        'cambiar uno, se reemplaza ese archivo. <code>python -I -X utf8 tools/sprites_separar.py juntar</code> los '
        f'vuelve a unir en <code>todos.html</code>.</p><ul>{items}</ul></main></body></html>\n',
        encoding='utf8',
    )
    print('índice:', CARPETA / 'index.html')


def leer_carpeta(carpeta: Path = CARPETA):
    """Todos los personajes de la carpeta, en el orden del índice (los que no están en el índice, al final)."""
    orden = json.loads(ORDEN.read_text(encoding='utf8')) if ORDEN.exists() else []
    archivos = {p.stem: p for p in carpeta.glob('*/*.html')}
    ids = [i for i in orden if i in archivos] + sorted(i for i in archivos if i not in orden)
    base = None
    chars = []
    for i in ids:
        antes, cs, despues = partes(archivos[i].read_text(encoding='utf8'))
        base = base or (antes, despues)
        chars += cs
    return base, chars


def juntar():
    (antes, despues), chars = leer_carpeta()
    f = CARPETA / 'todos.html'
    f.write_text(armar(antes, chars, despues, f'Todos los personajes juntos ({len(chars)}), unidos desde sus carpetas.'), encoding='utf8')
    print(f, f.stat().st_size // 1024, 'KB,', len(chars), 'personajes')


if __name__ == '__main__':
    if len(sys.argv) >= 3 and sys.argv[1] == 'separar':
        separar(Path(sys.argv[2]))
    elif len(sys.argv) >= 2 and sys.argv[1] == 'juntar':
        juntar()
    else:
        print(__doc__ or 'Uso: separar <html> | juntar')
