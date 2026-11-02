"""La imagen secreta de Rikka (cg_rikka_secreto): toma el original del autor (sin censura, fuera del exportador de
fondos para que nunca se publique así), aclara la piel de Rikka hacia el tono de su sprite base (solo su cuerpo, no
los faroles ni la madera) y pega la censura en mosaico donde van los emblemas +18 (src/data/emblemas_18.json).

    python -I tools/cg_secreto.py "<original escalado>"
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / 'tools'))
src = (RAIZ / 'tools' / 'igualar_piel.py').read_text(encoding='utf8').replace('\nmain()\n', '\n')
piel_ns = {'__file__': str(RAIZ / 'tools' / 'igualar_piel.py')}
exec(compile(src, 'igualar_piel', 'exec'), piel_ns)

ANCHO = 1920
# Cuánto se acerca la piel al tono del sprite (1: igual; menos, para que siga siendo de noche con faroles).
ACERCAR = 0.5
# Dónde está Rikka en la imagen (en %): ahí se busca su piel.
CAJA = (36, 0, 82, 96)


def main():
    original = Path(sys.argv[1])
    im = Image.open(original).convert('RGBA')
    im = im.resize((ANCHO, round(im.height * ANCHO / im.width)), Image.LANCZOS)
    a = np.array(im)
    H, W = a.shape[:2]

    # Su piel: lo que parece piel dentro de su caja, todas las manchas grandes (cara, mano, cuerpo), un poco engordadas.
    m = piel_ns['piel'](a)
    x0, y0, x1, y1 = (int(CAJA[0] * W / 100), int(CAJA[1] * H / 100), int(CAJA[2] * W / 100), int(CAJA[3] * H / 100))
    caja = np.zeros_like(m)
    caja[y0:y1, x0:x1] = True
    m &= caja
    lab_, n = ndimage.label(m)
    if n:
        tam = ndimage.sum(m, lab_, range(1, n + 1))
        grandes = [i + 1 for i, t in enumerate(tam) if t > 0.002 * (x1 - x0) * (y1 - y0)]
        m = np.isin(lab_, grandes)
        m = ndimage.binary_closing(m, iterations=3) & piel_ns['piel'](a)
    base = np.array(Image.open(RAIZ / 'public' / 'sprites' / 'rikka' / 'base.webp').convert('RGBA'))
    lab = piel_ns['a_lab'](a[m][:, :3].astype(float))
    actual = np.median(lab[lab[:, 1] <= np.median(lab[:, 1])], axis=0)
    corrimiento = (piel_ns['tono'](base) - actual) * ACERCAR
    a[m, :3] = piel_ns['de_lab'](lab + corrimiento).astype(np.uint8)
    print('piel corrida', np.round(corrimiento, 1).tolist(), '(L, a, b) en', int(m.sum()), 'píxeles')

    # La censura: un mosaico redondo, un poco más chico que el emblema que va encima en el juego (así no asoma por los
    # bordes del emblema, pero la imagen sigue censurada aunque el emblema no esté).
    emb = json.loads((RAIZ / 'src' / 'data' / 'emblemas_18.json').read_text(encoding='utf8'))['fondos']['fondos/cg_rikka_secreto']['emblemas']
    for e in emb:
        radio = e['w'] / 100 * W * 0.44
        cx, cy = e['x'] / 100 * W, e['y'] / 100 * H
        l, t = int(cx - radio), int(cy - radio)
        r, b = int(cx + radio) + 1, int(cy + radio) + 1
        trozo = a[t:b, l:r].copy()
        bloque = max(3, round(radio / 3))
        chico = Image.fromarray(trozo).resize((max(1, (r - l) // bloque), max(1, (b - t) // bloque)), Image.BOX)
        mosaico = np.array(chico.resize((r - l, b - t), Image.NEAREST))
        yy, xx = np.mgrid[t:b, l:r]
        dentro = (xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2 <= radio ** 2
        trozo[dentro] = mosaico[dentro]
        a[t:b, l:r] = trozo
    destino = RAIZ / 'public' / 'fondos' / 'cg_rikka_secreto.webp'
    Image.fromarray(a).convert('RGB').save(destino, quality=88, method=6)
    print('listo:', destino.name, f'{W}x{H}', 'con', len(emb), 'zonas de censura')


main()
