"""Retratos de la batalla por turnos: la cara de cada personaje (de su sprite de la novela) en pixel art.

Los héroes en «16 bits» (más resolución y colores) y los enemigos en «8 bits» (menos). Es un placeholder hasta
que el autor dibuje los retratos: se rehacen con

    python tools/retratos_batalla.py

y quedan en public/batalla/retratos/<id>.png. El recorte de la cara se ajusta en RETRATOS (centro y tamaño, en
partes del dibujo: 0 a 1).
"""
from PIL import Image

# id: (sprite de la novela, estilo, centro x, centro y, lado) — centro y lado en partes del recorte del dibujo.
RETRATOS = {
    'jair': ('public/sprites/jair/base.webp', 16, 0.5, 0.15, 0.36),
    'cami': ('public/sprites/cami/base.webp', 16, 0.5, 0.15, 0.36),
    'rikka': ('public/sprites/rikka/base.webp', 16, 0.5, 0.15, 0.36),
    'soldado': ('public/sprites/soldado_enmascarado/base.webp', 8, 0.5, 0.13, 0.3),
    'nikki': ('public/sprites/nikki/enojada.webp', 16, 0.5, 0.25, 0.36),
}
# Estilo -> (lado en píxeles del retrato, colores).
ESTILOS = {16: (48, 48), 8: (24, 12)}
ESCALA = 4


def retrato(src, estilo, cx, cy, lado):
    im = Image.open(src).convert('RGBA')
    x0, y0, x1, y1 = im.getchannel('A').getbbox()
    w, h = x1 - x0, y1 - y0
    s = lado * h
    caja = (round(x0 + cx * w - s / 2), round(y0 + cy * h - s / 2), round(x0 + cx * w + s / 2), round(y0 + cy * h + s / 2))
    cara = im.crop(caja)
    px, colores = ESTILOS[estilo]
    fondo = Image.new('RGBA', cara.size, (24, 22, 30, 255))
    fondo.alpha_composite(cara)
    chico = fondo.convert('RGB').resize((px, px), Image.LANCZOS).quantize(colores, method=Image.Quantize.MEDIANCUT)
    return chico.convert('RGB').resize((px * ESCALA * (48 // px), px * ESCALA * (48 // px)), Image.NEAREST)


if __name__ == '__main__':
    import os

    os.makedirs('public/batalla/retratos', exist_ok=True)
    for k, (src, estilo, cx, cy, lado) in RETRATOS.items():
        retrato(src, estilo, cx, cy, lado).save(f'public/batalla/retratos/{k}.png')
        print(f'ok public/batalla/retratos/{k}.png ({estilo} bits)')
