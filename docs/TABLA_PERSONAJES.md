# Tabla base de los personajes

Para medirlos entre sí (pedido del autor, 2026-11-05). Cada celda es **PS / ATQ / DEF / VEL**. El nivel 5 es la base: es
el piso real del juego (nadie sale en el nivel 1; lo más bajo es Jair en el 5 y un soldado en el 4). La última columna
dice dónde aparece cada uno por primera vez y con qué números.

Se genera sola: `node tools/tabla_personajes.mjs` (lee `src/data/rpg/personajes.json` y `src/data/batallas/`). No se
edita a mano. Las fórmulas de la pelea están en `docs/BIBLIA_RPG.md` (sección 3): el daño es más o menos
ATQ × poder ÷ 10 − DEF ÷ 2, y la velocidad decide el orden del turno.

## Héroes

| Personaje | Nv 5 | Nv 10 | Nv 15 | Nv 20 | Sube por nivel | Donde aparece (nivel, pelea): sus números |
|---|---|---|---|---|---|---|
| **Jair** | 54 / 9 / 5 / 10 | 84 / 14 / 8 / 13 | 114 / 19 / 11 / 15 | 144 / 24 / 14 / 18 | 6 / 1 / 0.6 / 0.5 | 5 (`bastion`): 54 / 9 / 5 / 10 |
| **Cami** | 50 / 10 / 6 / 14 | 70 / 16 / 9 / 16 | 90 / 21 / 11 / 18 | 110 / 27 / 14 / 20 | 4 / 1.1 / 0.5 / 0.4 | 15 (`bastion`): 90 / 21 / 11 / 18 |
| **Rikka** | 52 / 10 / 6 / 12 | 77 / 15 / 9 / 14 | 102 / 20 / 12 / 16 | 127 / 25 / 15 / 18 | 5 / 1 / 0.6 / 0.4 | 10 (`demo`): 77 / 15 / 9 / 14 |

## Amigos de Jair del Capítulo 4 (propuesta, por aprobar)

| Personaje | Nv 5 | Nv 10 | Nv 15 | Nv 20 | Sube por nivel | Donde aparece (nivel, pelea): sus números |
|---|---|---|---|---|---|---|
| **Jordan** *(propuesta)* | 50 / 12 / 4 / 13 | 78 / 18 / 6 / 16 | 105 / 24 / 8 / 19 | 133 / 30 / 10 / 22 | 5.5 / 1.2 / 0.4 / 0.6 | Capítulo 4 (por decidir) |
| **Billy** *(propuesta)* | 78 / 13 / 10 / 5 | 118 / 19 / 14 / 6 | 158 / 26 / 19 / 7 | 198 / 32 / 23 / 8 | 8 / 1.25 / 0.9 / 0.2 | Capítulo 4 (por decidir) |
| **Maggi** *(propuesta)* | 44 / 5 / 4 / 16 | 67 / 8 / 6 / 19 | 89 / 10 / 8 / 23 | 112 / 13 / 10 / 26 | 4.5 / 0.5 / 0.4 / 0.7 | Capítulo 4 (por decidir) |

## Enemigos (en el orden en que aparecen)

| Personaje | Nv 5 | Nv 10 | Nv 15 | Nv 20 | Sube por nivel | Donde aparece (nivel, pelea): sus números |
|---|---|---|---|---|---|---|
| **Soldado de la Federación** | 44 / 7 / 5 / 9 | 74 / 10 / 8 / 11 | 104 / 13 / 11 / 13 | 134 / 16 / 14 / 15 | 6 / 0.6 / 0.6 / 0.4 | 4 (`bastion`): 38 / 7 / 5 / 8 |
| **Capitán de la Federación** | 78 / 11 / 9 / 8 | 118 / 15 / 13 / 10 | 158 / 20 / 17 / 11 | 198 / 24 / 21 / 13 | 8 / 0.9 / 0.8 / 0.3 | 10 (`hangar`): 118 / 15 / 13 / 10 |
| **Bicho de memoria** | 52 / 8 / 5 / 9 | 89 / 12 / 8 / 11 | 126 / 15 / 11 / 13 | 163 / 19 / 14 / 15 | 7.4 / 0.74 / 0.6 / 0.4 | 11 (`cap03_cloacas_1`): 96 / 12 / 9 / 11 |
| **Bodeguero** | 60 / 12 / 8 / 9 | 97 / 16 / 11 / 11 | 133 / 19 / 14 / 13 | 170 / 23 / 17 / 15 | 7.3 / 0.73 / 0.6 / 0.4 | 11 (`cap03_bodegas_1`): 104 / 16 / 12 / 11 |
| **Monstruo de sombras** | 72 / 10 / 9 / 7 | 112 / 14 / 13 / 8 | 152 / 19 / 17 / 9 | 192 / 23 / 21 / 10 | 8 / 0.9 / 0.8 / 0.2 | 12 (`bastion`): 128 / 16 / 15 / 8 |
| **Cocinero de guerra** | 61 / 10 / 5 / 9 | 99 / 14 / 8 / 11 | 136 / 18 / 11 / 13 | 174 / 21 / 14 / 15 | 7.5 / 0.75 / 0.6 / 0.4 | 13 (`cap03_comedor_1`): 121 / 16 / 10 / 12 |
| **Herrero** | 55 / 11 / 5 / 9 | 87 / 14 / 8 / 11 | 118 / 17 / 11 / 13 | 150 / 20 / 14 / 15 | 6.3 / 0.63 / 0.6 / 0.4 | 13 (`cap03_forja_1`): 106 / 16 / 10 / 12 |
| **Caballero de la tabla** | 36 / 5 / 11 / 9 | 55 / 6 / 14 / 11 | 74 / 8 / 17 / 13 | 93 / 10 / 20 / 15 | 3.8 / 0.38 / 0.6 / 0.4 | 13 (`cap03_galeria_1`): 67 / 8 / 16 / 12 |
| **Reina de los bichos** | 83 / 11 / 9 / 7 | 126 / 16 / 13 / 8 | 168 / 20 / 17 / 9 | 211 / 25 / 21 / 10 | 8.5 / 0.95 / 0.8 / 0.2 | 13 (`cap03_cloacas_1`): 151 / 18 / 16 / 8 |
| **Jefe de bodega** | 83 / 11 / 9 / 8 | 126 / 16 / 13 / 10 | 168 / 20 / 17 / 11 | 211 / 25 / 21 / 13 | 8.5 / 0.95 / 0.8 / 0.3 | 13 (`cap03_bodegas_1`): 151 / 18 / 16 / 11 |
| **Escriba de tinta** | 76 / 14 / 9 / 7 | 133 / 21 / 13 / 8 | 189 / 27 / 17 / 9 | 246 / 33 / 21 / 10 | 11.3 / 1.28 / 0.8 / 0.2 | 14 (`cap03_biblioteca_1`): 178 / 26 / 16 / 9 |
| **Celador** | 40 / 6 / 9 / 9 | 63 / 8 / 12 / 11 | 86 / 10 / 15 / 13 | 109 / 13 / 18 / 15 | 4.6 / 0.46 / 0.6 / 0.4 | 15 (`cap03_celdas_1`): 86 / 10 / 15 / 13 |
| **Sargento** | 88 / 12 / 9 / 8 | 133 / 17 / 13 / 10 | 178 / 22 / 17 / 11 | 223 / 27 / 21 / 13 | 9 / 1.01 / 0.8 / 0.3 | 15 (`cap03_cuarteles_2`): 178 / 22 / 17 / 11 |
| **Chef de la tropa** | 92 / 12 / 9 / 8 | 139 / 18 / 13 / 10 | 186 / 23 / 17 / 11 | 233 / 28 / 21 / 13 | 9.4 / 1.06 / 0.8 / 0.3 | 15 (`cap03_comedor_1`): 186 / 23 / 17 / 11 |
| **Maestro herrero** | 92 / 12 / 9 / 8 | 139 / 18 / 13 / 10 | 186 / 23 / 17 / 11 | 233 / 28 / 21 / 13 | 9.4 / 1.06 / 0.8 / 0.3 | 15 (`cap03_forja_1`): 186 / 23 / 17 / 11 |
| **Guardia del Verano** | 43 / 8 / 5 / 9 | 70 / 11 / 8 / 11 | 96 / 13 / 11 / 13 | 123 / 16 / 14 / 15 | 5.3 / 0.53 / 0.6 / 0.4 | 15 (`cap03_patio_1`): 96 / 13 / 11 / 13 |
| **Guardia del Otoño** | 47 / 9 / 10 / 9 | 75 / 12 / 13 / 11 | 102 / 15 / 16 / 13 | 130 / 17 / 19 / 15 | 5.5 / 0.55 / 0.6 / 0.4 | 16 (`cap03_patio_2`): 108 / 15 / 17 / 13 |
| **Guardia del Invierno** | 51 / 8 / 5 / 9 | 78 / 11 / 8 / 11 | 105 / 14 / 11 / 13 | 132 / 16 / 14 / 15 | 5.4 / 0.54 / 0.6 / 0.4 | 16 (`cap03_celdas_2`): 110 / 14 / 12 / 13 |
| **Alcaide** | 102 / 14 / 11 / 8 | 154 / 20 / 15 / 10 | 206 / 25 / 19 / 11 | 258 / 31 / 23 / 13 | 10.4 / 1.17 / 0.8 / 0.3 | 17 (`cap03_celdas_1`): 226 / 28 / 21 / 12 |
| **Intendente del arsenal** | 107 / 15 / 9 / 8 | 161 / 21 / 13 / 10 | 216 / 27 / 17 / 11 | 270 / 33 / 21 / 13 | 10.9 / 1.22 / 0.8 / 0.3 | 18 (`cap03_arsenal`): 248 / 31 / 20 / 12 |
| **Comandante de la guardia real** | 111 / 15 / 12 / 8 | 168 / 22 / 16 / 10 | 225 / 28 / 20 / 11 | 282 / 34 / 24 / 13 | 11.4 / 1.28 / 0.8 / 0.3 | 19 (`cap03_galeria_1`): 270 / 33 / 23 / 12 |
| **Nikki** | 45 / 7 / 2 / 10 | 64 / 11 / 3 / 12 | 83 / 14 / 3 / 13 | 102 / 17 / 4 / 15 | 3.8 / 0.62 / 0.1 / 0.3 | 20 (`nikki`, con cambios de esa pelea): 102 / 17 / 4 / 7 |
| **Rey Malvado** | 91 / 10 / 9 / 8 | 130 / 14 / 13 / 10 | 170 / 18 / 17 / 11 | 209 / 23 / 21 / 13 | 7.9 / 0.88 / 0.8 / 0.3 | 26 (`cap03_rey`): 257 / 28 / 26 / 15 |
| **Rey Malvado (gigante)** | 112 / 11 / 9 / 8 | 152 / 15 / 13 / 10 | 192 / 20 / 17 / 11 | 232 / 24 / 21 / 13 | 8 / 0.9 / 0.8 / 0.3 | — |
