"""La censura de los sprites desbloqueables (src/data/emblemas_18.json, «sprites»): un mosaico redondo donde va cada
emblema, un poco más chico que el emblema (no asoma por sus bordes, y el sprite sigue censurado aunque el emblema no
esté). Mismo mosaico que tools/cg_secreto.py. Pasarlo dos veces no cambia nada que se note.

    python -I tools/censura_sprites.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent


def censurar(a: np.ndarray, emblemas: list) -> None:
    H, W = a.shape[:2]
    for e in emblemas:
        radio = e['w'] / 100 * W * 0.44
        cx, cy = e['x'] / 100 * W, e['y'] / 100 * H
        l, t = max(0, int(cx - radio)), max(0, int(cy - radio))
        r, b = min(W, int(cx + radio) + 1), min(H, int(cy + radio) + 1)
        trozo = a[t:b, l:r].copy()
        bloque = max(3, round(radio / 3))
        chico = Image.fromarray(trozo).resize((max(1, (r - l) // bloque), max(1, (b - t) // bloque)), Image.BOX)
        mosaico = np.array(chico.resize((r - l, b - t), Image.NEAREST))
        yy, xx = np.mgrid[t:b, l:r]
        dentro = (xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2 <= radio ** 2
        trozo[dentro] = mosaico[dentro]
        a[t:b, l:r] = trozo


def main():
    datos = json.loads((RAIZ / 'src' / 'data' / 'emblemas_18.json').read_text(encoding='utf8'))
    for clave, emblemas in datos['sprites'].items():
        ruta = RAIZ / 'public' / 'sprites' / f'{clave}.webp'
        a = np.array(Image.open(ruta).convert('RGBA'))
        censurar(a, emblemas)
        Image.fromarray(a).save(ruta, quality=90, method=6)
        print('censura:', clave, len(emblemas), 'zonas')


main()
