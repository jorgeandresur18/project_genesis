"""Las manos del jugador en la escena secreta de las termas (novela; pedido del autor, 2026-11-05).

Toma docs/palma.png, docs/agarrando.png y docs/apuntando.png (fondo transparente, antebrazo que entra desde arriba a
la derecha), difumina el antebrazo para que no termine en un corte y las pone igual que las manos de Cami (las capas del
PSD de los desbloqueables, ya exportadas en public/sprites/rikka/manos): para cada acción se gira, se escala y se mueve
la mano para que su muñeca y la punta del dedo coincidan con las de la mano de Cami (si el pulgar queda del otro lado,
antes se espeja). Guarda public/sprites/rikka/manos/jugador_<grupo>_<acción>.webp y escribe «manos_jugador» en
src/data/emblemas_18.json (pecho: palma que se cierra en agarrando; nalgada: palma; apunta: apuntando).
Uso: python -I -X utf8 tools/manos_jugador.py [--vista carpeta]
"""
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / 'public/sprites/rikka/manos'
SPRITE_W, SPRITE_H = 1200, 1600  # el lienzo de los sprites (3:4)
CALIDAD = 2  # las imágenes se guardan al doble del tamaño en que se ven (en el lienzo del sprite)
# Antebrazo: de t = x/W - y/H (crece hacia arriba a la derecha) entre DESDE (opaco) y HASTA (transparente).
DESDE, HASTA = 0.43, 0.70

# Las manos nuevas (px del PNG original, 2400×1792): muñeca, punta del dedo que manda y punta del pulgar.
NUEVAS = {
    'palma': {'muneca': (1476, 504), 'punta': (504, 1500), 'pulgar': (1524, 1416)},
    'agarrando': {'muneca': (1476, 504), 'punta': (600, 1500), 'pulgar': (1416, 1416)},
    'apuntando': {'muneca': (1476, 504), 'punta': (690, 1632), 'pulgar': (1524, 1416)},
}
# Las de Cami (px de su imagen): muñeca, punta del dedo medio (o del índice, en la que apunta) y del pulgar.
CAMI = {
    'pecho0': {'muneca': (197, 120), 'punta': (3, 28), 'pulgar': (55, 165)},
    'pecho1': {'muneca': (41, 115), 'punta': (234, 30), 'pulgar': (181, 167)},
    'apunta': {'muneca': (110, 202), 'punta': (80, 5), 'pulgar': (5, 107)},
    'nalgada_izq': {'muneca': (42, 165), 'punta': (142, 7), 'pulgar': (190, 152)},
    'nalgada_der': {'muneca': (130, 180), 'punta': (62, 10), 'pulgar': (5, 145)},
}


def cargar(nombre: str) -> Image.Image:
    im = Image.open(RAIZ / f'docs/{nombre}.png').convert('RGBA')
    a = np.asarray(im).copy()
    H, W = a.shape[:2]
    alfa = a[..., 3].astype(np.float32)
    alfa[alfa < 8] = 0
    ys, xs = np.mgrid[0:H, 0:W]
    alfa *= np.clip((HASTA - (xs / W - ys / H)) / (HASTA - DESDE), 0, 1)
    a[..., 3] = alfa.astype(np.uint8)
    return Image.fromarray(a)


def lado(p: dict) -> float:
    """De qué lado del eje muñeca→punta queda el pulgar (el signo dice si es mano izquierda o derecha, vista así)."""
    (wx, wy), (tx, ty), (px, py) = p['muneca'], p['punta'], p['pulgar']
    return (tx - wx) * (py - wy) - (ty - wy) * (px - wx)


def poner(img: Image.Image, nueva: dict, cami: dict, caja: dict, cami_tam: tuple):
    """La mano nueva girada, escalada y movida sobre la de Cami. Devuelve la imagen y su caja (en % del sprite)."""
    W = img.width
    pts = dict(nueva)
    if (lado(nueva) > 0) != (lado(cami) > 0):
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
        pts = {k: (W - 1 - x, y) for k, (x, y) in nueva.items()}
    # Los puntos de Cami, en px del lienzo del sprite (× CALIDAD).
    ex = caja['w'] / 100 * SPRITE_W / cami_tam[0]
    ey = caja['h'] / 100 * SPRITE_H / cami_tam[1]
    destino = {
        k: ((caja['x'] / 100 * SPRITE_W + x * ex) * CALIDAD, (caja['y'] / 100 * SPRITE_H + y * ey) * CALIDAD)
        for k, (x, y) in cami.items()
    }
    a, b = np.array(pts['muneca'], float), np.array(pts['punta'], float)
    A, B = np.array(destino['muneca']), np.array(destino['punta'])
    s = np.linalg.norm(B - A) / np.linalg.norm(b - a)
    th = math.atan2(B[1] - A[1], B[0] - A[0]) - math.atan2(b[1] - a[1], b[0] - a[0])
    R = np.array([[math.cos(th), -math.sin(th)], [math.sin(th), math.cos(th)]]) * s
    c = img.getbbox()
    esquinas = np.array([[c[0], c[1]], [c[2], c[1]], [c[0], c[3]], [c[2], c[3]]], float)
    dst = (esquinas - a) @ R.T + A
    x0, y0 = np.floor(dst.min(axis=0)).astype(int)
    x1, y1 = np.ceil(dst.max(axis=0)).astype(int)
    # La transformación inversa (de la imagen de salida a la original), como la pide PIL.
    Ri = np.linalg.inv(R)
    off = a - Ri @ (A - np.array([x0, y0], float))
    out = img.transform(
        (int(x1 - x0), int(y1 - y0)),
        Image.AFFINE,
        (Ri[0, 0], Ri[0, 1], off[0], Ri[1, 0], Ri[1, 1], off[1]),
        resample=Image.BICUBIC,
    )
    bb = out.getbbox()
    out = out.crop(bb)
    bx0, by0 = x0 + bb[0], y0 + bb[1]
    caja_out = {
        'x': round(bx0 / CALIDAD / SPRITE_W * 100, 2),
        'y': round(by0 / CALIDAD / SPRITE_H * 100, 2),
        'w': round(out.width / CALIDAD / SPRITE_W * 100, 2),
        'h': round(out.height / CALIDAD / SPRITE_H * 100, 2),
    }
    return out, caja_out


def main():
    vista = Path(sys.argv[sys.argv.index('--vista') + 1]) if '--vista' in sys.argv else None
    destino = vista or SALIDA
    nuevas = {n: cargar(n) for n in NUEVAS}
    p = RAIZ / 'src/data/emblemas_18.json'
    e = json.loads(p.read_text(encoding='utf-8'))
    jugador = {}
    for grupo, g in e['manos'].items():
        acciones = []
        for a in g['acciones']:
            b = {k: v for k, v in a.items() if k not in ('mano', 'abierta', 'cerrada')}
            if a['tipo'] == 'pecho':
                # Al revés que la de Cami (pedido del autor): el brazo entra desde afuera, por el costado, y los dedos van
                # hacia el centro; por eso, los puntos de la mano del otro pecho (las cajas son simétricas).
                puntos = CAMI['pecho1'] if a['lado'] == 'izq' else CAMI['pecho0']
                partes = (('abierta', 'palma'), ('cerrada', 'agarrando'))
            else:
                puntos = CAMI['apunta'] if a['tipo'] == 'apunta' else CAMI['nalgada_' + a['lado']]
                partes = (('mano', 'palma' if a['tipo'] == 'nalgada' else 'apuntando'),)
            for clave, mano in partes:
                cami = a[clave]
                tam = Image.open(RAIZ / ('public/' + cami['imagen'] + '.webp')).size
                img, caja = poner(nuevas[mano], NUEVAS[mano], puntos, cami, tam)
                nombre = 'jugador_' + Path(cami['imagen']).name
                if vista:
                    img.save(destino / (nombre + '.png'))
                else:
                    img.save(destino / (nombre + '.webp'), quality=92)
                b[clave] = {'imagen': 'sprites/rikka/manos/' + nombre, **caja}
            acciones.append(b)
        jugador[grupo] = {**{k: v for k, v in g.items() if k != 'acciones'}, 'acciones': acciones}
    if vista:
        (vista / 'manos_jugador.json').write_text(json.dumps(jugador, indent=2, ensure_ascii=False), encoding='utf-8')
        return
    e['manos_jugador'] = jugador
    p.write_text(json.dumps(e, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    print('manos del jugador listas')


if __name__ == '__main__':
    main()
