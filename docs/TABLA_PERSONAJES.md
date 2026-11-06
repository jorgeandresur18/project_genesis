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
| **Jordy** *(propuesta)* | 50 / 12 / 4 / 13 | 78 / 18 / 6 / 16 | 105 / 24 / 8 / 19 | 133 / 30 / 10 / 22 | 5.5 / 1.2 / 0.4 / 0.6 | Capítulo 4 (por decidir) |
| **Billy** *(propuesta)* | 78 / 13 / 10 / 5 | 118 / 19 / 14 / 6 | 158 / 26 / 19 / 7 | 198 / 32 / 23 / 8 | 8 / 1.25 / 0.9 / 0.2 | Capítulo 4 (por decidir) |
| **Maggi** *(propuesta)* | 44 / 5 / 4 / 16 | 67 / 8 / 6 / 19 | 89 / 10 / 8 / 23 | 112 / 13 / 10 / 26 | 4.5 / 0.5 / 0.4 / 0.7 | Capítulo 4 (por decidir) |

## Enemigos (en el orden en que aparecen)

| Personaje | Nv 5 | Nv 10 | Nv 15 | Nv 20 | Sube por nivel | Donde aparece (nivel, pelea): sus números |
|---|---|---|---|---|---|---|
| **Soldado de la Federación** | 44 / 7 / 5 / 9 | 74 / 10 / 8 / 11 | 104 / 13 / 11 / 13 | 134 / 16 / 14 / 15 | 6 / 0.6 / 0.6 / 0.4 | 4 (`bastion`): 38 / 7 / 5 / 8 |
| **Capitán de la Federación** | 78 / 11 / 9 / 8 | 118 / 15 / 13 / 10 | 158 / 20 / 17 / 11 | 198 / 24 / 21 / 13 | 8 / 0.9 / 0.8 / 0.3 | 10 (`hangar`): 118 / 15 / 13 / 10 |
| **Bicho de memoria** | 52 / 8 / 5 / 9 | 90 / 12 / 8 / 11 | 127 / 16 / 11 / 13 | 165 / 19 / 14 / 15 | 7.5 / 0.75 / 0.6 / 0.4 | 11 (`cap03_cloacas_1`): 97 / 13 / 9 / 11 |
| **Bodeguero** | 60 / 12 / 8 / 9 | 96 / 15 / 11 / 11 | 132 / 19 / 14 / 13 | 168 / 23 / 17 / 15 | 7.2 / 0.72 / 0.6 / 0.4 | 11 (`cap03_bodegas_1`): 103 / 16 / 12 / 11 |
| **Monstruo de sombras** | 72 / 10 / 9 / 7 | 112 / 14 / 13 / 8 | 152 / 19 / 17 / 9 | 192 / 23 / 21 / 10 | 8 / 0.9 / 0.8 / 0.2 | 12 (`bastion`): 128 / 16 / 15 / 8 |
| **Cocinero de guerra** | 61 / 10 / 5 / 9 | 99 / 14 / 8 / 11 | 136 / 18 / 11 / 13 | 174 / 21 / 14 / 15 | 7.5 / 0.75 / 0.6 / 0.4 | 13 (`cap03_comedor_1`): 121 / 16 / 10 / 12 |
| **Herrero** | 57 / 11 / 5 / 9 | 90 / 14 / 8 / 11 | 123 / 17 / 11 / 13 | 156 / 21 / 14 / 15 | 6.6 / 0.66 / 0.6 / 0.4 | 13 (`cap03_forja_1`): 110 / 16 / 10 / 12 |
| **Reina de los bichos** | 80 / 11 / 9 / 7 | 121 / 15 / 13 / 8 | 162 / 20 / 17 / 9 | 203 / 25 / 21 / 10 | 8.2 / 0.93 / 0.8 / 0.2 | 13 (`cap03_cloacas_1`): 145 / 18 / 16 / 8 |
| **Jefe de bodega** | 80 / 11 / 9 / 8 | 121 / 15 / 13 / 10 | 162 / 20 / 17 / 11 | 203 / 25 / 21 / 13 | 8.2 / 0.93 / 0.8 / 0.3 | 13 (`cap03_bodegas_1`): 145 / 18 / 16 / 11 |
| **Escriba de tinta** | 76 / 14 / 9 / 7 | 132 / 20 / 13 / 8 | 188 / 27 / 17 / 9 | 244 / 33 / 21 / 10 | 11.2 / 1.27 / 0.8 / 0.2 | 14 (`cap03_biblioteca_1`): 177 / 26 / 16 / 9 |
| **Celador** | 46 / 7 / 9 / 9 | 72 / 10 / 12 / 11 | 98 / 12 / 15 / 13 | 124 / 15 / 18 / 15 | 5.2 / 0.52 / 0.6 / 0.4 | 15 (`cap03_celdas_1`): 98 / 12 / 15 / 13 |
| **Sargento** | 83 / 11 / 9 / 8 | 126 / 16 / 13 / 10 | 168 / 20 / 17 / 11 | 211 / 25 / 21 / 13 | 8.5 / 0.95 / 0.8 / 0.3 | 15 (`cap03_cuarteles_2`): 168 / 20 / 17 / 11 |
| **Chef de la tropa** | 85 / 12 / 9 / 8 | 128 / 17 / 13 / 10 | 172 / 22 / 17 / 11 | 215 / 27 / 21 / 13 | 8.7 / 0.98 / 0.8 / 0.3 | 15 (`cap03_comedor_1`): 172 / 22 / 17 / 11 |
| **Maestro herrero** | 85 / 12 / 9 / 8 | 128 / 17 / 13 / 10 | 172 / 22 / 17 / 11 | 215 / 27 / 21 / 13 | 8.7 / 0.98 / 0.8 / 0.3 | 15 (`cap03_forja_1`): 172 / 22 / 17 / 11 |
| **Guardia del Verano** | 47 / 9 / 5 / 9 | 76 / 12 / 8 / 11 | 105 / 15 / 11 / 13 | 134 / 18 / 14 / 15 | 5.8 / 0.58 / 0.6 / 0.4 | 15 (`cap03_patio_1`): 105 / 15 / 11 / 13 |
| **Guardia del Otoño** | 51 / 10 / 10 / 9 | 80 / 13 / 13 / 11 | 110 / 16 / 16 / 13 | 139 / 19 / 19 / 15 | 5.9 / 0.59 / 0.6 / 0.4 | 16 (`cap03_patio_2`): 116 / 17 / 17 / 13 |
| **Guardia del Invierno** | 52 / 8 / 5 / 9 | 80 / 11 / 8 / 11 | 107 / 14 / 11 / 13 | 135 / 16 / 14 / 15 | 5.5 / 0.55 / 0.6 / 0.4 | 16 (`cap03_celdas_2`): 113 / 14 / 12 / 13 |
| **Caballero de la tabla** | 43 / 6 / 11 / 9 | 65 / 8 / 14 / 11 | 87 / 10 / 17 / 13 | 109 / 12 / 20 / 15 | 4.4 / 0.44 / 0.6 / 0.4 | 17 (`cap03_galeria_1`): 95 / 11 / 19 / 13 |
| **Alcaide** | 90 / 12 / 11 / 8 | 136 / 17 / 15 / 10 | 182 / 22 / 19 / 11 | 228 / 28 / 23 / 13 | 9.2 / 1.03 / 0.8 / 0.3 | 17 (`cap03_celdas_1`): 200 / 24 / 21 / 12 |
| **Intendente del arsenal** | 92 / 12 / 9 / 8 | 139 / 18 / 13 / 10 | 186 / 23 / 17 / 11 | 233 / 28 / 21 / 13 | 9.4 / 1.06 / 0.8 / 0.3 | 18 (`cap03_arsenal`): 214 / 26 / 20 / 12 |
| **Comandante de la guardia real** | 95 / 12 / 12 / 8 | 143 / 18 / 16 / 10 | 192 / 23 / 20 / 11 | 240 / 29 / 24 / 13 | 9.7 / 1.09 / 0.8 / 0.3 | 19 (`cap03_galeria_1`): 231 / 28 / 23 / 12 |
| **Nikki** | 45 / 7 / 2 / 10 | 64 / 11 / 3 / 12 | 83 / 14 / 3 / 13 | 102 / 17 / 4 / 15 | 3.8 / 0.62 / 0.1 / 0.3 | 20 (`nikki`, con cambios de esa pelea): 102 / 17 / 4 / 7 |
| **Rey Malvado** | 78 / 11 / 9 / 8 | 118 / 15 / 13 / 10 | 158 / 20 / 17 / 11 | 198 / 24 / 21 / 13 | 8 / 0.9 / 0.8 / 0.3 | 28 (`cap03_rey`): 262 / 32 / 28 / 16 |
| **Rey Malvado (gigante)** | 112 / 11 / 9 / 8 | 152 / 15 / 13 / 10 | 192 / 20 / 17 / 11 | 232 / 24 / 21 / 13 | 8 / 0.9 / 0.8 / 0.3 | — |
