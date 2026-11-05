# Capítulo 3 — Lista de arte

Lo que el Capítulo 3 (la torre del Rey) necesita y hoy es un cuadro gris (`PLACEHOLDER:`), más las hojas de pelea de los
enemigos nuevos. Entre paréntesis: en cuántas escenas sale y la primera escena. Sacado de `src/data/chapters/cap03.json`
el 5 de noviembre de 2026; si el capítulo cambia, se vuelve a sacar.

Formato de siempre: sprites en el PSB de cada personaje (lienzo 1200x1600, a la estatura de `src/data/estaturas.json`),
fondos 16:9 en `docs/fondos/`, hojas de pelea en `public/batalla/` (como `soldado`, `capitan` y `sombra`).

**Arte al final** (decisión del autor): esto es para la fase de arte; nada se bloquea esperándolo.

---

## 1. Sprites que faltan

| Sprite | Escenas | Qué es |
| --- | --- | --- |
| `rey_yelmo` | 18 (`cap03_trono_*`) | THE KING con el **yelmo cerrado**: no se le ve la cara (canon). Lleva la espada de las estaciones. Poses: de pie en el trono, con la espada en alto (el DELETE, `cap03_delete_01`). La forma gigante **no** va en este capítulo (queda para el 6). |
| `guardia_verano` | 1 + pelea (`cap03_patio_1`) | Armadura **polinesia**: fibra de coco tejida, casco de plumas, lanza con dientes de tiburón, tatuajes. **Emblema del sol en la espalda**. |
| `guardia_otono` | 1 + pelea (`cap03_patio_2`) | Armadura **celta**: bronce con espirales, torques, escudo redondo, casco con alas de cuervo. **Emblema de la hoja en la espalda**. |
| `guardia_invierno` | 1 + pelea (`cap03_celdas_2`) | Armadura **siberiana**: escamas bajo abrigo de piel, gorro de piel con orejeras, hacha larga, barba con escarcha. **Emblema del copo en la espalda**. |

Los mismos tres guardias salen en el Capítulo 2 (al llegar a cada reino; ver `cap02_arte.md`): **un solo dibujo sirve
para los dos capítulos**. En la torre hay dos versiones de cada uno:
- **Presos** (las celdas, `cap03_celdas_01g01`): la armadura gastada, sin armas.
- **Al servicio del Rey** (las peleas): la misma armadura con el **yelmo negro del Rey** encima.

Los emblemas: `public/emblemas/` (flor, sol, hoja y copo; dibujos del autor).

**Expresiones de Jair, Cami y Rikka:** el capítulo usa solo caras que ya existen (Rikka con su ropa de sacerdotisa). Las
que harían falta para que no se repitan tanto (opcionales): Jair **herido** y **decidido** (el WHERE que olvida), Cami
**herida** en el piso (el DELETE), Rikka **herida** en el piso y **emocionada** (el jardinero de la Primavera,
`cap03_celdas_2`).

## 2. Fondos (hoy cuadros grises)

Pisos de abajo hacia arriba, como en la torre:

| Fondo | Escenas | Descripción |
| --- | --- | --- |
| `calabozo_fortaleza` | 38 (`cap03_calabozo_01`) | Piso −3. Celda de piedra húmeda, rejas, una antorcha, el guardia afuera. |
| `fortaleza_escaleras` | 12 (`cap03_escaleras_01`) | La escalera de caracol que sube del calabozo; al lado, la puerta del montacargas. |
| `fortaleza_cloacas` | 10 (`cap03_cloacas_01`) | Pisos −2/−1. Agua negra, paredes con números pintados, nidos de bichos. |
| `fortaleza_bodegas` | 7 (`cap03_bodegas_01`) | Barriles y cajas hasta el techo, con etiquetas de reinos que ya no existen. |
| `fortaleza_cuarteles` | 13 (`cap03_cuarteles_01`) | Piso 1. Literas, armeros, mesas de cartas, una puerta al fondo (el sargento). |
| `fortaleza_comedor` | 7 (`cap03_comedor_01`) | Piso 2. Mesas largas con platos a medio comer, la cocina al fondo. |
| `fortaleza_forja` | 4 (`cap03_forja_01`) | Piso 2. Hornos, yunques, espadas a medio hacer, todo rojo de calor. |
| `fortaleza_descanso` | 29 (`cap03_descanso1_01`) | Los tres descansos: escalera de servicio, depósito de antorchas y la última escalera. Puede ser uno solo con tres variantes de luz. Incluye **los cofres** (cajas de la tropa, cofres con el sello del Rey, el altar de ofrendas). |
| `fortaleza_biblioteca_oscura` | 11 (`cap03_biblioteca_01`) | Piso 3. Estantes altísimos en penumbra, libros en blanco, sombras entre los pasillos. |
| `fortaleza_prision_reinos` | 12 (`cap03_piso4_01`) | Piso 4. Pasillo de celdas con presos de los cuatro reinos (y guardias estacionales presos). |
| `fortaleza_patio` | 5 (`cap03_patio_01`) | Piso 4. Patio sin paredes: a los lados, el espacio dimensional (un océano que cae sobre un desierto). |
| `fortaleza_arsenal` | 21 (`cap03_arsenal_01`) | Piso 5. Armas en las paredes; la espada DELETE en un soporte; un hacha dorada de trofeo (la trampa). |
| `fortaleza_salon_guardia` | 8 (`cap03_piso6_01`) | Piso 6. Salón de armas de la guardia real; armaduras negras con números en el pecho. |
| `fortaleza_galeria_retratos` | 5 (`cap03_galeria_01`) | Piso 6. Retratos de los reyes de la Primavera; el último, tapado con una tela negra. |
| `sala_del_trono` | 22 (`cap03_trono_01`) | Piso 7. El trono, la corona y la tabla; la puerta enorme. |
| `vacio_blanco` | 20 (`cap03_vacio_01`) | Después del DELETE: blanco total, sin horizonte. |
| `departamento_manana` | 13 (`cap03_despertar_04`) | El cuarto de Jair a la mañana: la computadora, el teclado, el celular al 1 %. |
| `pc_genesis_restaurar` | 5 (`cap03_solo_04`) | Primer plano de la pantalla de GENESIS con la opción de restaurar (el final `alt_1`). |

## 3. Peleas: hojas de los enemigos nuevos

Hoy todos usan una hoja que ya existe (soldado, capitán o sombra) con otro nombre, pero ya tienen sus propios ataques y especiales (`src/data/rpg/personajes.json`). Cuando el autor haga los suyos, se
cambia la ficha en `src/data/rpg/personajes.json` y se reequilibra la torre (`tests/torre_ajuste.test.ts`).

| Enemigo | Usa hoy | Piso | Idea |
| --- | --- | --- | --- |
| Bicho de memoria / Reina de los bichos | soldado / sombra | Cloacas | Bichos de metal con ojos de cursor; la reina, del tamaño de un perro, pone huevos. |
| Bodeguero / Jefe de bodega | soldado / capitán | Bodegas | Delantal y pala; el jefe, con un libro de cuentas. |
| Sargento | capitán | Cuarteles | Armadura llena de medallas. |
| Cocinero de guerra / Chef de la tropa | soldado / capitán | Comedor | Cuchillos enormes; el chef, gorro alto y cucharón de hierro. |
| Herrero / Maestro herrero | soldado / capitán | Forja | Brazos quemados, martillo al rojo vivo. |
| Escriba de tinta | sombra | Biblioteca | Sin cara, hecho de tinta, con una pluma. |
| Celador / Alcaide | soldado / capitán | Prisión | Manojo de llaves; el alcaide, las llaves de toda la prisión en el cinturón. |
| Guardias del Verano, el Otoño y el Invierno | soldado | Prisión | Ver arriba (con el yelmo negro del Rey). |
| Intendente del arsenal | capitán | Arsenal | Cuida la espada DELETE. |
| Caballero de la tabla / Comandante | soldado / capitán | Guardia real | Armadura negra con un número único grabado en el pecho. |
| Rey Malvado (THE KING) | capitán | Trono | El yelmo cerrado; la espada de las estaciones (sus dos especiales: las estaciones y la Tajada del abismo). |

## 4. Efectos (opcionales)

- **La grieta de la Tajada del abismo** (el héroe «desaparecido»): hoy el héroe se ve casi transparente.
- **Las estaciones de la espada:** un destello de color por estación (flor, sol, hoja, copo) al caer cada una.
