"""Los sprites de los objetos (docs/sprites de prueba/objetos/) → public/objetos/<id>.webp, recortados y chicos (para
el menú de la pelea, lo que cae del cielo, la mochila y la tienda).

    python -I tools/objetos.py
"""
from pathlib import Path

from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / 'docs' / 'sprites de prueba' / 'objetos'
SALIDA = RAIZ / 'public' / 'objetos'
LADO = 160

ARCHIVOS = {
    'Gemini_Generated_Image_f404ebf404ebf404-Photoroom': 'agua',
    'aumento ataque': 'furia_roja',
    'aumentar defensas': 'pastillas_azules',
    'especial': '4low_co',
    'caramelo dulce': 'caramelo_dulce',
    'caramelo rancio': 'caramelo_rancio',
    'revivir': 'elixit',
    'revivir++': 'elixit_plus',
    'veneno para ratas': 'veneno_ratas',
    'condon barato': 'condon_barato',
    'condon caro': 'condon_spartan',
    'medicamento para el higado': 'hepatol',
    'galleta clasica': 'galleta_clasica',
    'galleta con grajeas de chocolate': 'galleta_arcoiris',
    'galleta brownie': 'galleta_brownie',
    'galleta red velvet': 'galleta_red_velvet',
    'flor de pureza': 'flor_pureza',
    'gorro de navidad': 'gorro_navidad',
    'chaqueta de cuero': 'chaqueta_cuero',
    'chaqueta jean': 'chaqueta_jean',
    'suit azul': 'traje_azul',
    'suit rojo': 'traje_rojo',
    'traje de sacerdotiza': 'prendas_sacerdotisa',
    'zapatillas buenas': 'zapatillas_buenas',
    'zapatos plataforma': 'zapatos_plataforma',
    'token': 'token',
    'cassette_jair': 'cassette_jair',
    'cassette_cami': 'cassette_cami',
    'cassette_rikka': 'cassette_rikka',
    'cassette_nikki': 'cassette_nikki',
    'cassette_generico': 'cassette_generico',
}


def main():
    SALIDA.mkdir(parents=True, exist_ok=True)
    for nombre, id_ in ARCHIVOS.items():
        im = Image.open(ORIGEN / f'{nombre}.png').convert('RGBA')
        im = im.crop(im.getbbox())
        lado = max(im.size)
        cuadro = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
        cuadro.alpha_composite(im, ((lado - im.width) // 2, (lado - im.height) // 2))
        cuadro.resize((LADO, LADO), Image.LANCZOS).save(SALIDA / f'{id_}.webp', quality=90, method=6)
    print(len(ARCHIVOS), 'objetos en', SALIDA)


main()
