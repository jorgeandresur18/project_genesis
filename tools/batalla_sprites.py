# Pasa los sprites del combate desde la galería de personajes del autor (un HTML con las hojas adentro) al juego:
# public/batalla/<personaje>.png y .json, con los nombres de animación del juego. Además:
# - a Cami se le completa el centro blanco del destello de la pistola en el ataque (venía transparente);
# - se calcula, cuadro por cuadro, de dónde salen las balas de Cami (los destellos de sus pistolas), para que el
#   juego dispare desde ahí («disparos» en el .json).
# - a cada punta de pistola del especial de Cami se le anota hacia dónde apunta (arriba, al medio o abajo), para que la
#   ráfaga siga al brazo;
# - del especial de la sombra se anotan los pasos del vórtice (ida, golpe y vuelta), para que el juego la lleve
#   hasta su objetivo y la traiga de vuelta mientras es un vórtice («viaje» en el .json).
# - la media luna de la tajada de la sombra sale de su hoja y queda como proyectil aparte (sombra_tajada.png, de
#   «ataque de la sombra.png», junto al HTML): el juego la lanza en horizontal hasta salir de la pantalla.
# Uso: python -I tools/batalla_sprites.py "docs/sprites de prueba/ULTIMOOOOS_SPRITES_Nikki.html"
import base64
import io
import json
import sys
from pathlib import Path

import numpy as np
from scipy import ndimage
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / 'public' / 'batalla'
# Personaje del HTML -> hoja del juego, y nombres de sus animaciones en el juego (las que no están, no se usan;
# «dolor» de Cami queda para más adelante).
HOJAS = {
    'lentes': ('jair', {'idle': 'idle', 'salto': 'salto', 'ataque': 'ataque', 'daño': 'daño', 'pestaneo': 'pestaneo', 'especial': 'especial',
                        'derrotado': 'derrotado'}),
    'cami': ('cami', {'idle': 'idle', 'cabello': 'cabello', 'walk': 'mover', 'salto': 'salto', 'attack': 'ataque', 'hit': 'daño',
                      'blush': 'sonrojada', 'pestaneo': 'pestaneo', 'agachada': 'agachada', 'especial': 'especial', 'derrotada': 'derrotado'}),
    'nikki': ('nikki', {'idle': 'idle', 'pestaneo': 'pestaneo', 'ataque': 'ataque', 'daño': 'daño', 'llorando': 'llorando', 'derrotada': 'derrotado',
                        'especial': 'especial'}),  # «beso» viene en su propia hoja: ver hoja_beso.
    'kimono': ('rikka', {'idle': 'idle', 'cabello': 'cabello', 'salto': 'salto', 'ataque': 'ataque', 'daño': 'daño', 'pestaneo': 'pestaneo', 'especial': 'especial'}),
    'ninja': ('soldado', {'idle': 'idle', 'correr': 'mover', 'salto': 'salto', 'ataque': 'ataque', 'daño': 'daño', 'pestaneo': 'pestaneo'}),
    'sombra': ('sombra', {'idle': 'idle', 'tajada': 'ataque', 'desgarro': 'especial', 'daño': 'daño'}),
}


def apuntar(y: int) -> int:
    """Hacia dónde apunta una pistola del especial de Cami (grados en el cuadro; 0: derecho hacia adelante), según la
    altura de su punta: las de arriba apuntan en diagonal hacia arriba, las de abajo hacia abajo y las demás derecho."""
    return -28 if y < 42 else 28 if y > 88 else 0


# La tajada de la sombra: desde este cuadro la media luna se suelta y vuela (el juego la dibuja aparte), así que se
# borra de la hoja en esos cuadros (lo claro abajo a la derecha del cuerpo; los ojos quedan más arriba).
TAJADA_SUELTA = 17


def borrar_media_luna(im: np.ndarray, fw: int, fh: int, fila: int, cuadros: int) -> int:
    total = 0
    for f in range(TAJADA_SUELTA, cuadros):
        c = im[fila * fh:(fila + 1) * fh, f * fw:(f + 1) * fw]
        zona = c[118:, 106:]
        rgb = zona[..., :3].astype(int)
        claro = (zona[..., 3] > 0) & ((rgb.max(axis=2) > 120) | ((rgb[..., 0] > 90) & (rgb[..., 2] > 140)))
        zona[claro] = 0
        total += int(claro.sum())
    return total


def proyectil(html: Path):
    """La media luna de la tajada, recortada a su contenido, y dónde estaba en el cuadro (de ahí sale)."""
    ruta = html.parent / 'ataque de la sombra.png'
    if not ruta.exists():
        return None
    im = Image.open(ruta).convert('RGBA')
    x0, y0, x1, y1 = im.getbbox()
    im.crop((x0, y0, x1, y1)).save(SALIDA / 'sombra_tajada.png')
    return {'imagen': 'batalla/sombra_tajada', 'cuadro': TAJADA_SUELTA, 'x': x0, 'y': y0, 'ancho': x1 - x0, 'alto': y1 - y0}


# El beso de Nikki viene en una hoja aparte con cuadros más anchos (el corazón vuela hacia adelante). Se recorta al
# ancho de Nikki (su cuerpo está a la izquierda, alineado con su pose base) y, desde que el corazón sale volando,
# se borra de la hoja: el juego lo dibuja aparte (nikki_corazon.png, de «nikki corazon.png» junto al HTML) y lo
# lanza hasta salir de la pantalla.
# Se suelta en el cuadro 78: el corazón ya se separó de la mano y todavía cabe entero en el cuadro de Nikki (desde el
# 81 el borde del cuadro lo corta). Ahí el corazón aparte aparece justo encima del dibujado.
BESO_SUELTA = 78
# Los primeros cuadros del beso son la pose base completa (respira y pestañea) antes del destello (el 50): en la
# pelea se empieza un poco antes del destello, así el cambio de pose y el sonido van juntos.
BESO_DESDE = 46
BESO_CORAZON = {'x': 104, 'y': 39, 'ancho': 21, 'alto': 20}


def hoja_beso(c: dict, html: Path):
    b = c['sheets']['beso']
    an = c['anims']['beso']
    im = np.array(Image.open(io.BytesIO(base64.b64decode(b['src'].split('base64,')[1]))).convert('RGBA'))
    fw, fh, bw, cols = c['fw'], c['fh'], b['fw'], an['cols']
    fila = np.zeros((fh, an['frames'] * fw, 4), im.dtype)
    for f in range(an['frames']):
        cuadro = im[(f // cols) * fh:(f // cols + 1) * fh, (f % cols) * bw:(f % cols) * bw + fw].copy()
        if f >= BESO_SUELTA:
            # Todo lo que flota delante de la mano (el corazón con su borde y los brillos): lo que no toca el cuerpo.
            lab, n = ndimage.label(cuadro[..., 3] > 0)
            if n > 1:
                cuerpo = np.argmax(np.bincount(lab.ravel())[1:]) + 1
                for i, sl in enumerate(ndimage.find_objects(lab), 1):
                    if i != cuerpo and sl[1].start >= 94 and sl[0].stop <= 72:
                        cuadro[sl][lab[sl] == i] = 0
        fila[:, f * fw:(f + 1) * fw] = cuadro
    proy = None
    ruta = html.parent / 'nikki corazon.png'
    if ruta.exists():
        cor = Image.open(ruta).convert('RGBA')
        cor = cor.crop(cor.getbbox())
        # A 4 veces su tamaño en la pelea, nítido (es pixel art).
        cor.resize((BESO_CORAZON['ancho'] * 4, BESO_CORAZON['alto'] * 4), Image.NEAREST).save(SALIDA / 'nikki_corazon.png')
        proy = {'imagen': 'batalla/nikki_corazon', 'cuadro': BESO_SUELTA, **BESO_CORAZON}
    return fila, {'frames': an['frames'], 'fps': an['fps'], 'loop': False, 'seq': list(range(BESO_DESDE, an['frames']))}, proy


def viaje(seq: list) -> dict:
    """Los pasos (de la secuencia) del especial de la sombra: se vuelve vórtice y viaja (ida), reaparece junto a su
    objetivo, salta y al aterrizar golpea (golpe), se vuelve vórtice otra vez y regresa (vuelta)."""
    return {
        'ida': [seq.index(14), seq.index(18)],
        'golpe': [seq.index(44), seq.index(51)],
        'vuelta': [seq.index(58), seq.index(65)],
    }


def leer_html(ruta: Path):
    h = ruta.read_text(encoding='utf8')
    i = h.index('const CHARS=')
    j = h.index('];', i) + 1
    return json.loads(h[i + len('const CHARS='):j])


def rellenar_destello(im: np.ndarray, fw: int, fh: int, fila: int, cuadros: int) -> int:
    """El hueco transparente entre la boca de la pistola y los rayos del destello pasa a blanco."""
    total = 0
    for f in range(cuadros):
        x0, y0 = f * fw + 70, fila * fh + 25
        c = im[y0:y0 + 50, x0:x0 + 46]
        rgb = c[..., :3].astype(int)
        a = c[..., 3] > 0
        flash = a & (rgb.max(axis=2) > 170) & ((rgb[..., 2] > 180) | (rgb[..., 0] > 200))
        amarillo = a & (rgb[..., 0] > 200) & (rgb[..., 2] < 170)
        amarillo[:, :20] = False  # el pelo rubio no es un rayo
        ys, _ = np.where(amarillo)
        if flash.sum() < 30 or not len(ys):
            continue
        cy = int(np.median(ys))
        oscuro = a & (rgb.max(axis=2) < 70)
        semillas = [(yy, np.where(oscuro[yy])[0].max()) for yy in range(cy - 4, cy + 5) if 0 <= yy < c.shape[0] and oscuro[yy].any()]
        if not semillas:
            continue
        mx = int(np.median([x for _, x in semillas]))
        H, W = flash.shape
        pila = [(yy, mx + 1) for yy, _ in semillas]
        vistos = set()
        while pila:
            y, x = pila.pop()
            if (y, x) in vistos or not (0 <= y < H and 0 <= x < W):
                continue
            vistos.add((y, x))
            arriba = flash[max(0, y - 8):y, x].any()
            abajo = flash[y + 1:y + 9, x].any()
            if a[y, x] or not (arriba and abajo and mx < x <= mx + 16):
                continue
            c[y, x] = [255, 255, 255, 255]
            total += 1
            pila += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
        im[y0:y0 + 50, x0:x0 + 46] = c
    return total


def destellos(im: np.ndarray, fw: int, fh: int, fila: int, cuadros: int) -> dict:
    """Por cuadro, el centro de cada destello de pistola (zonas brillantes celestes, blancas o amarillas a la derecha
    del cuerpo), en píxeles del cuadro: de ahí salen las balas."""
    salida = {}
    for f in range(cuadros):
        c = im[fila * fh:(fila + 1) * fh, f * fw:(f + 1) * fw]
        rgb = c[..., :3].astype(int)
        a = c[..., 3] > 0
        brillo = a & (rgb.min(axis=2) > 200) | (a & (rgb[..., 2] > 225) & (rgb[..., 1] > 200))
        brillo[:, : int(fw * 0.62)] = False  # el cuerpo y el pelo quedan a la izquierda
        if brillo.sum() < 12:
            continue
        # Zonas conectadas (las de cada pistola).
        etiquetas = np.zeros(brillo.shape, int)
        zonas = []
        for y, x in zip(*np.where(brillo)):
            if etiquetas[y, x]:
                continue
            n = len(zonas) + 1
            pila, pts = [(y, x)], []
            etiquetas[y, x] = n
            while pila:
                py, px = pila.pop()
                pts.append((py, px))
                for dy in (-2, -1, 0, 1, 2):
                    for dx in (-2, -1, 0, 1, 2):
                        qy, qx = py + dy, px + dx
                        if 0 <= qy < brillo.shape[0] and 0 <= qx < brillo.shape[1] and brillo[qy, qx] and not etiquetas[qy, qx]:
                            etiquetas[qy, qx] = n
                            pila.append((qy, qx))
            zonas.append(pts)
        puntos = []
        for pts in zonas:
            if len(pts) < 10:
                continue
            ys = [p[0] for p in pts]
            xs = [p[1] for p in pts]
            puntos.append([round(sum(xs) / len(xs)), round(sum(ys) / len(ys))])
        if puntos:
            salida[str(f)] = sorted(puntos, key=lambda p: p[1])
    return salida


# Una hoja más ancha que esto no se ve en algunos celulares: sus filas largas se parten en renglones de COLUMNAS
# cuadros («columnas» en el .json; cada animación empieza en su propio renglón).
# El Capitán de la Federación («soldado» en el HTML): su hoja normal (176 px de ancho) y la de su especial (320 px: el
# rayo sale del cuadro). Todo va en cuadros de CAPITAN_ANCHO, con el cuerpo a la izquierda como en el HTML (así entra
# el rayo cuando lo levanta). En el ataque se borran los rayos dibujados (el juego dispara balas rojas desde la punta
# del fusil, en cada fogonazo). En el especial, los cuadros en que el rayo sale del cuadro original guardan dónde
# corta el borde y hacia dónde va (`rayo`): el juego lo sigue, ondulado, hasta el borde de la pantalla.
CAPITAN_ANCHO = 192
CAPITAN_PUNTA = 128  # desde acá a la derecha, en el ataque, todo lo rojo es el rayo dibujado (se borra salvo el fogonazo)
CAPITAN_FOGONAZO = 140


def es_rojo(q: np.ndarray) -> np.ndarray:
    return (q[..., 3] > 0) & (q[..., 0] > 190) & (q[..., 1] < 140)


def hoja_capitan(c: dict):
    fw, fh, W = c['fw'], c['fh'], CAPITAN_ANCHO
    im = np.array(Image.open(io.BytesIO(base64.b64decode(c['src'].split('base64,')[1]))).convert('RGBA'))
    sh = c['sheets']['especial']
    es = np.array(Image.open(io.BytesIO(base64.b64decode(sh['src'].split('base64,')[1]))).convert('RGBA'))
    filas, meta = [], {'frameWidth': W, 'frameHeight': fh, 'animations': {}}
    disparos, rayo = {}, {}

    def cuadro(hoja, ancho, cols, fila, f):
        x, y = (f % cols) * ancho, (fila + f // cols) * fh
        q = np.zeros((fh, W, 4), hoja.dtype)
        trozo = hoja[y:y + fh, x:x + min(ancho, W)]
        q[:, :trozo.shape[1]] = trozo
        return q

    for nombre, a in c['anims'].items():
        hoja, ancho = (es, sh['fw']) if a.get('sheet') == 'especial' else (im, fw)
        cols = a.get('cols') or (hoja.shape[1] // ancho)
        cuadros = []
        for f in range(a['frames']):
            q = cuadro(hoja, ancho, cols, a['row'], f)
            if nombre == 'ataque':
                rojo = es_rojo(q)
                rojo[:, :CAPITAN_PUNTA] = False
                # Un fogonazo: el rayo recién sale de la punta y llega al borde del cuadro (no el que ya va volando).
                if rojo[:, fw - 6:].any() and rojo[:, CAPITAN_FOGONAZO:CAPITAN_FOGONAZO + 6].any():
                    ys, xs = np.nonzero(rojo[:, CAPITAN_PUNTA:CAPITAN_FOGONAZO])
                    if len(xs):
                        disparos[str(f)] = [[CAPITAN_PUNTA + round(float(xs.mean())), round(float(ys.mean()))]]
                # Todo lo que está más allá del fogonazo es el rayo dibujado (su centro es casi blanco): fuera.
                q[:, CAPITAN_FOGONAZO + 6:] = 0
            if nombre == 'especial':
                orig = hoja[(a['row'] + f // cols) * fh:(a['row'] + f // cols + 1) * fh, (f % cols) * ancho:(f % cols + 1) * ancho]
                rojo = es_rojo(orig)
                borde = np.nonzero(rojo[:, -3:].any(axis=1))[0]
                corte = np.nonzero(rojo[:, W - 3:W].any(axis=1))[0]
                if len(borde) and len(corte):
                    y0, y1 = float(corte.mean()), float(borde.mean())
                    ang = float(np.arctan2(y1 - y0, (ancho - 1) - (W - 2)))
                    rayo[str(f)] = [W, round(y0, 1), round(ang, 4), int(borde.max() - borde.min() + 1)]
            cuadros.append(q)
        meta['animations'][nombre] = {'row': len(filas), 'frames': a['frames'], 'fps': a['fps'], 'loop': a['loop'],
                                      **({'seq': a['seq']} if 'seq' in a else {})}
        filas.append(np.concatenate(cuadros, axis=1))
    ancho = max(x.shape[1] for x in filas)
    im = np.concatenate([np.pad(x, ((0, 0), (0, ancho - x.shape[1]), (0, 0))) for x in filas])
    meta['disparos'] = {'ataque': disparos}
    meta['rayo'] = rayo
    print('capitan: disparos', disparos, '· cuadros con rayo afuera:', len(rayo))
    return im, meta


ANCHO_MAX = 4096
COLUMNAS = 20


def repartir(im: np.ndarray, fw: int, fh: int, meta: dict) -> np.ndarray:
    filas = []
    for a in meta['animations'].values():
        fila = im[a['row'] * fh:(a['row'] + 1) * fh]
        a['row'] = len(filas)
        for k in range(0, a['frames'], COLUMNAS):
            renglon = np.zeros((fh, COLUMNAS * fw, 4), im.dtype)
            trozo = fila[:, k * fw:min(a['frames'], k + COLUMNAS) * fw]
            renglon[:, :trozo.shape[1]] = trozo
            filas.append(renglon)
    meta['columnas'] = COLUMNAS
    return np.concatenate(filas)


def main():
    ruta = Path(sys.argv[1]) if len(sys.argv) > 1 else RAIZ / 'docs' / 'sprites de prueba' / 'ULTIMOOOOS_SPRITES_Nikki.html'
    for c in leer_html(ruta):
        if c['id'] == 'soldado':
            im, meta = hoja_capitan(c)
            if im.shape[1] > ANCHO_MAX:
                im = repartir(im, meta['frameWidth'], meta['frameHeight'], meta)
            Image.fromarray(im).save(SALIDA / 'capitan.png')
            (SALIDA / 'capitan.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
            print('capitan', Image.fromarray(im).size, list(meta['animations']))
            continue
        if c['id'] not in HOJAS:
            continue
        nombre, mapa = HOJAS[c['id']]
        fw, fh = c['fw'], c['fh']
        im = np.array(Image.open(io.BytesIO(base64.b64decode(c['src'].split('base64,')[1]))).convert('RGBA'))
        meta = {'frameWidth': fw, 'frameHeight': fh, 'animations': {}}
        for k, a in c['anims'].items():
            if k not in mapa:
                continue
            anim = {'row': a['row'], 'frames': a['frames'], 'fps': a['fps'], 'loop': a['loop']}
            # Orden de cuadros (los especiales repiten cuadros durante unos 5 segundos).
            if 'seq' in a:
                anim['seq'] = a['seq']
            meta['animations'][mapa[k]] = anim
        if nombre == 'cami':
            at = c['anims']['attack']
            print('cami: destello rellenado,', rellenar_destello(im, fw, fh, at['row'], at['frames']), 'pixeles')
            es = c['anims']['especial']
            # El ataque es una sola pistola: un solo punto por cuadro (el promedio de sus destellos).
            ataque = {f: [[round(sum(p[0] for p in ps) / len(ps)), round(sum(p[1] for p in ps) / len(ps))]]
                      for f, ps in destellos(im, fw, fh, at['row'], at['frames']).items()}
            # El pecho (más o menos donde están los hombros): la bala sale en la dirección pecho → punta de la pistola.
            meta['ancla_disparo'] = [56, 58]
            meta['disparos'] = {
                'ataque': ataque,
                'especial': {f: [[x, y, apuntar(y)] for x, y in ps] for f, ps in destellos(im, fw, fh, es['row'], es['frames']).items()},
            }
            print('cami: disparos', {k: len(v) for k, v in meta['disparos'].items()})
        if nombre == 'nikki' and 'beso' in c.get('sheets', {}):
            fila, anim, proy = hoja_beso(c, ruta)
            meta['animations']['beso'] = {'row': im.shape[0] // fh, **anim}
            # La fila del beso es más larga que las otras: la hoja se ensancha (y después se parte en renglones).
            ancho = max(im.shape[1], fila.shape[1])
            im = np.concatenate([np.pad(im, ((0, 0), (0, ancho - im.shape[1]), (0, 0))), np.pad(fila, ((0, 0), (0, ancho - fila.shape[1]), (0, 0)))])
            if proy:
                meta['proyectiles'] = {'beso': proy}
        if nombre == 'sombra':
            meta['viaje'] = viaje(c['anims']['desgarro']['seq'])
            p = proyectil(ruta)
            if p:
                ta = c['anims']['tajada']
                print('sombra: media luna borrada de la tajada,', borrar_media_luna(im, fw, fh, ta['row'], ta['frames']), 'pixeles')
                meta['proyectil'] = p
        if im.shape[1] > ANCHO_MAX:
            im = repartir(im, fw, fh, meta)
        if nombre == 'sombra':
            # Al retirarse: se hunde hasta quedar hecha vórtice (el comienzo del especial, en sus mismas filas).
            es = meta['animations']['especial']
            meta['animations']['retirada'] = {**es, 'loop': False, 'seq': es['seq'][:meta['viaje']['ida'][0] + 4]}
        Image.fromarray(im).save(SALIDA / f'{nombre}.png')
        (SALIDA / f'{nombre}.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
        print(nombre, Image.fromarray(im).size, list(meta['animations']))


main()
