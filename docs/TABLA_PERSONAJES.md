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
| **Maggi** *(propuesta)* | 44 / 12 / 4 / 14 | 67 / 17 / 6 / 17 | 89 / 23 / 8 / 20 | 112 / 29 / 10 / 23 | 4.5 / 1.15 / 0.4 / 0.6 | Capítulo 4 (por decidir) |

## Enemigos (en el orden en que aparecen)

| Personaje | Nv 5 | Nv 10 | Nv 15 | Nv 20 | Sube por nivel | Donde aparece (nivel, pelea): sus números |
|---|---|---|---|---|---|---|
| **Soldado de la Federación** | 44 / 7 / 5 / 9 | 74 / 10 / 8 / 11 | 104 / 13 / 11 / 13 | 134 / 16 / 14 / 15 | 6 / 0.6 / 0.6 / 0.4 | 4 (`bastion`): 38 / 7 / 5 / 8 |
| **Capitán de la Federación** | 78 / 11 / 9 / 8 | 118 / 15 / 13 / 10 | 158 / 20 / 17 / 11 | 198 / 24 / 21 / 13 | 8 / 0.9 / 0.8 / 0.3 | 10 (`hangar`): 118 / 15 / 13 / 10 |
| **Bicho de memoria** | 28 / 5 / 5 / 9 | 49 / 7 / 8 / 11 | 69 / 9 / 11 / 13 | 90 / 11 / 14 / 15 | 4.1 / 0.41 / 0.6 / 0.4 | 11 (`cap03_cloacas_1`): 53 / 7 / 9 / 11 |
| **Bodeguero** | 13 / 3 / 8 / 9 | 21 / 3 / 11 / 11 | 29 / 4 / 14 / 13 | 37 / 5 / 17 / 15 | 1.6 / 0.16 / 0.6 / 0.4 | 11 (`cap03_bodegas_1`): 23 / 4 / 12 / 11 |
| **Monstruo de sombras** | 72 / 10 / 9 / 7 | 112 / 14 / 13 / 8 | 152 / 19 / 17 / 9 | 192 / 23 / 21 / 10 | 8 / 0.9 / 0.8 / 0.2 | 12 (`bastion`): 128 / 16 / 15 / 8 |
| **Cocinero de guerra** | 56 / 9 / 5 / 9 | 91 / 12 / 8 / 11 | 126 / 16 / 11 / 13 | 161 / 19 / 14 / 15 | 7 / 0.7 / 0.6 / 0.4 | 13 (`cap03_comedor_1`): 112 / 14 / 10 / 12 |
| **Herrero** | 49 / 9 / 5 / 9 | 77 / 12 / 8 / 11 | 105 / 15 / 11 / 13 | 133 / 18 / 14 / 15 | 5.6 / 0.56 / 0.6 / 0.4 | 13 (`cap03_forja_1`): 94 / 14 / 10 / 12 |
| **Reina de los bichos** | 245 / 30 / 9 / 7 | 364 / 43 / 13 / 8 | 484 / 57 / 17 / 9 | 603 / 70 / 21 / 10 | 23.9 / 2.69 / 0.8 / 0.2 | 13 (`cap03_cloacas_1`): 436 / 51 / 16 / 8 |
| **Jefe de bodega** | 173 / 24 / 9 / 8 | 260 / 34 / 13 / 10 | 347 / 44 / 17 / 11 | 434 / 53 / 21 / 13 | 17.4 / 1.97 / 0.8 / 0.3 | 13 (`cap03_bodegas_1`): 312 / 40 / 16 / 11 |
| **Escriba de tinta** | 85 / 15 / 9 / 7 | 148 / 22 / 13 / 8 | 210 / 29 / 17 / 9 | 273 / 36 / 21 / 10 | 12.5 / 1.42 / 0.8 / 0.2 | 14 (`cap03_biblioteca_1`): 198 / 27 / 16 / 9 |
| **Celador** | 54 / 7 / 9 / 9 | 84 / 10 / 12 / 11 | 114 / 13 / 15 / 13 | 144 / 16 / 18 / 15 | 6 / 0.6 / 0.6 / 0.4 | 15 (`cap03_celdas_1`): 114 / 13 / 15 / 13 |
| **Sargento** | 140 / 18 / 9 / 8 | 208 / 26 / 13 / 10 | 276 / 33 / 17 / 11 | 344 / 41 / 21 / 13 | 13.6 / 1.52 / 0.8 / 0.3 | 15 (`cap03_cuarteles_2`): 276 / 33 / 17 / 11 |
| **Chef de la tropa** | 133 / 18 / 9 / 8 | 197 / 25 / 13 / 10 | 262 / 32 / 17 / 11 | 326 / 40 / 21 / 13 | 12.9 / 1.46 / 0.8 / 0.3 | 15 (`cap03_comedor_1`): 262 / 32 / 17 / 11 |
| **Maestro herrero** | 142 / 20 / 9 / 8 | 208 / 27 / 13 / 10 | 274 / 35 / 17 / 11 | 340 / 42 / 21 / 13 | 13.2 / 1.49 / 0.8 / 0.3 | 15 (`cap03_forja_1`): 274 / 35 / 17 / 11 |
| **Guardia del Verano** | 55 / 10 / 5 / 9 | 89 / 13 / 8 / 11 | 123 / 17 / 11 / 13 | 157 / 20 / 14 / 15 | 6.8 / 0.68 / 0.6 / 0.4 | 15 (`cap03_patio_1`): 123 / 17 / 11 / 13 |
| **Guardia del Otoño** | 60 / 11 / 10 / 9 | 94 / 14 / 13 / 11 | 129 / 18 / 16 / 13 | 163 / 21 / 19 / 15 | 6.9 / 0.69 / 0.6 / 0.4 | 16 (`cap03_patio_2`): 136 / 18 / 17 / 13 |
| **Guardia del Invierno** | 62 / 11 / 5 / 9 | 95 / 14 / 8 / 11 | 129 / 17 / 11 / 13 | 162 / 21 / 14 / 15 | 6.7 / 0.67 / 0.6 / 0.4 | 16 (`cap03_celdas_2`): 136 / 18 / 12 / 13 |
| **Caballero de la tabla** | 33 / 4 / 11 / 9 | 50 / 6 / 14 / 11 | 67 / 8 / 17 / 13 | 84 / 9 / 20 / 15 | 3.4 / 0.34 / 0.6 / 0.4 | 17 (`cap03_salon_1`): 73 / 8 / 19 / 13 |
| **Alcaide** | 98 / 11 / 11 / 8 | 143 / 16 / 15 / 10 | 188 / 21 / 19 / 11 | 233 / 26 / 23 / 13 | 9 / 1.01 / 0.8 / 0.3 | 17 (`cap03_celdas_1`): 206 / 23 / 21 / 12 |
| **Intendente del arsenal** | 113 / 14 / 9 / 8 | 164 / 19 / 13 / 10 | 214 / 25 / 17 / 11 | 265 / 30 / 21 / 13 | 10.1 / 1.13 / 0.8 / 0.3 | 18 (`cap03_arsenal`): 245 / 28 / 20 / 12 |
| **Comandante de la guardia real** | 123 / 17 / 12 / 8 | 176 / 23 / 16 / 10 | 228 / 29 / 20 / 11 | 281 / 34 / 24 / 13 | 10.5 / 1.18 / 0.8 / 0.3 | 19 (`cap03_salon_1`): 270 / 33 / 23 / 12 |
| **Nikki** | 45 / 7 / 2 / 10 | 64 / 11 / 3 / 12 | 83 / 14 / 3 / 13 | 102 / 17 / 4 / 15 | 3.8 / 0.62 / 0.1 / 0.3 | 20 (`nikki`, con cambios de esa pelea): 102 / 17 / 4 / 7 |
| **Rey Malvado** | 112 / 11 / 9 / 8 | 160 / 17 / 13 / 10 | 209 / 22 / 17 / 11 | 257 / 28 / 21 / 13 | 9.7 / 1.09 / 0.8 / 0.3 | 22 (`cap03_rey`): 277 / 30 / 23 / 13 |
| **Rey Malvado (gigante)** | 112 / 11 / 9 / 8 | 152 / 15 / 13 / 10 | 192 / 20 / 17 / 11 | 232 / 24 / 21 / 13 | 8 / 0.9 / 0.8 / 0.3 | — |
