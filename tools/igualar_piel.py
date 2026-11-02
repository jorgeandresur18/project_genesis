"""Iguala el tono de piel de algunos sprites de la novela al de su sprite base (tools/sprites.config.json,
«igualar_piel»). Corre la piel entera (en el espacio de color Lab) hasta el tono promedio del base: el rubor, las
lágrimas y las líneas se mueven con ella, así que se conservan. Corregir dos veces no cambia nada, así que se puede
correr después de cada `npm run sprites` (lo hace el script).

    python -I tools/igualar_piel.py
"""
import json
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SPRITES = RAIZ / 'public' / 'sprites'


def a_lab(rgb: np.ndarray) -> np.ndarray:
    c = rgb / 255.0
    c = np.where(c > 0.04045, ((c + 0.055) / 1.055) ** 2.4, c / 12.92)
    xyz = c @ np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]).T
    xyz /= np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], axis=-1)


def de_lab(lab: np.ndarray) -> np.ndarray:
    fy = (lab[..., 0] + 16) / 116
    fx, fz = fy + lab[..., 1] / 500, fy - lab[..., 2] / 200
    f = np.stack([fx, fy, fz], axis=-1)
    xyz = np.where(f ** 3 > 0.008856, f ** 3, (f - 16 / 116) / 7.787) * np.array([0.95047, 1.0, 1.08883])
    c = xyz @ np.array([[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]]).T
    c = np.where(c > 0.0031308, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055, 12.92 * c)
    return np.clip(np.round(c * 255), 0, 255)


def piel(a: np.ndarray) -> np.ndarray:
    """Lo que es piel: opaco y de tono durazno o anaranjado (no el pelo verde, ni la ropa, ni las líneas oscuras)."""
    rgb = a[..., :3].astype(float)
    mx, mn = rgb.max(axis=-1), rgb.min(axis=-1)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    sat = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    return (a[..., 3] > 200) & (r >= g) & (g >= b) & (r > 140) & (mx > 120) & (sat > 0.18) & (sat < 0.85) & (r - b > 30) & (g - b > 10)


def tono(a: np.ndarray) -> np.ndarray:
    """El tono de la piel limpia de la cara: en la franja de la cara, la mediana de la mitad menos roja (el rubor y las
    mejillas, que tiran hacia el rojo, quedan afuera: el rubor de cada expresión se respeta)."""
    ys, _ = np.nonzero(a[..., 3] > 200)
    top, bot = ys.min(), ys.max()
    h = int((bot - top) * 0.22)
    cara = a[top + int(h * 0.55):top + int(h * 1.55)]
    lab = a_lab(cara[piel(cara)][:, :3].astype(float))
    return np.median(lab[lab[:, 1] <= np.median(lab[:, 1])], axis=0)


def main():
    config = json.loads((RAIZ / 'tools' / 'sprites.config.json').read_text(encoding='utf8'))
    for personaje, v in config.get('igualar_piel', {}).items():
        base = np.array(Image.open(SPRITES / personaje / f"{v['base']}.webp").convert('RGBA'))
        objetivo = tono(base)
        for nombre in v['sprites']:
            ruta = SPRITES / personaje / f'{nombre}.webp'
            if not ruta.exists():
                print(f'  ! {personaje}/{nombre}: no existe')
                continue
            a = np.array(Image.open(ruta).convert('RGBA'))
            m = piel(a)
            lab = a_lab(a[m][:, :3].astype(float))
            corrimiento = objetivo - tono(a)
            if np.abs(corrimiento).max() < 2.5:
                print(f'  · {personaje}/{nombre}: ya tiene el tono del base')
                continue
            a[m, :3] = de_lab(lab + corrimiento).astype(np.uint8)
            Image.fromarray(a).save(ruta, quality=90, method=6)
            print(f'  ✓ {personaje}/{nombre}: piel corrida {np.round(corrimiento, 1).tolist()} (L, a, b)')


main()
