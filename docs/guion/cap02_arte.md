# Capítulo 2 — Lista de arte

Todo lo que el Capítulo 2 necesita y todavía es un cuadro gris (`PLACEHOLDER:`), más las caras y poses nuevas que harían falta para que los personajes no repitan siempre las mismas. Entre paréntesis: en cuántas escenas aparece y la primera escena donde sale.

Formato de siempre: sprites en el PSB de cada personaje (lienzo 1200x1600, a la estatura de `src/data/estaturas.json`), fondos 16:9 en `docs/fondos/`, imágenes de Boringram en `docs/boringram/`.

---

## 1. Sprites que faltan (hoy son cuadros grises)

### Trajes de baño — playa del Verano (89 escenas cada uno, desde `cap02_ve_020`)

Comprados en un puesto de la playa. Sugerido, nunca explícito.

| Sprite | Expresiones que piden las escenas |
| --- | --- |
| `jair_bano` | base, avergonzado, asustado, atontado (mirando), cansado, **quemado por el sol** (cara, nariz y hombros rojos, desde `cap02_bp_024`), orgulloso («supervisión»), triste |
| `cami_bano` | base, burlona, burla, molesta, furia («si te ríes, te ahogo»), seria, **tirada en la arena** (pose relajada), **mojada con la tabla** (perdió contra las olas) |
| `rikka_bano` | base, sonrojada (**tapándose con los brazos**), sorprendida («¡está fría en lugares sagrados!»), enojada, tierna (untando aceite), orgullosa (ciudadela de arena), **con la espada en alto pescando**, **mojada de cara** (cayó al agua), triste (el recuerdo de su amiga) |

### Ebrios — taberna del Invierno (`cap02_t_r01` en adelante)

| Sprite | Escenas | Expresiones |
| --- | --- | --- |
| `jair_ebrio` | 76 | base (sonrisa floja, ojos entrecerrados), sonrojado, risa tonta, nervioso (ante los retos), atontado (mirando a Rikka cantar) |
| `cami_ebria` | 62 | base, coqueta / provocadora («bésame o bebe»), risa, fanfarrona (después del pulso), **dormida sobre el hombro** |
| `rikka_ebria` | 56 | base, muy sonrojada, risa sin motivo, **cantando desafinada**, tímida (el sorbito), **dormida con la frente en la mesa** |

### Con resaca — la mañana en la posada (`cap02_t_m01`)

| Sprite | Escenas | Expresiones |
| --- | --- | --- |
| `jair_resaca` | 17 | base (ojeras, pelo revuelto), dolor de cabeza, **cocinando** (delantal, cuchillo y cebolla), satisfecho (el desayuno salió bien) |
| `cami_resaca` | 13 | base, furiosa con el sol («alguien apague el sol»), comiendo, sorprendida («esto revive a los muertos») |
| `rikka_resaca` | 13 | base, mareada, tapándose los ojos, conmovida («perdí la mitad de mi vida») |

### Personajes nuevos

| Sprite | Escenas | Descripción |
| --- | --- | --- |
| `sacerdotisa_invierno` (**Kira**) | 38 | Misma cara que Rikka, otros colores: túnica blanca con escarcha en los bordes. Expresiones: base, seria, sorprendida, burlona (los berrinches de Rikka), preocupada |
| `sacerdotisa_otono` (**Zaki**) | 38 | Misma cara que Rikka: túnica ocre con hojas bordadas. Expresiones: base, seria, desconfiada (el forastero), sorprendida (la puerta se abre), sonrisa leve |
| `guardia_rey` | 20 | La guardia del Rey Malvado (distinta de los soldados de la Federación). Base y apuntando |
| `vendedor_otono` | 5 | El vendedor del Otoño, que es un soldado disfrazado: ropa celta humilde y delantal. Base y sonrisa falsa |
| `nail_atada` | 7 | Nail atada a un poste en el almacén del molino |
| `rikka_traje_espada` | 13 | Rikka con el traje rojo de Cami y la espada desenvainada (la pelea del almacén). Base y peleando |

---

## 2. Expresiones que hoy usan un sustituto

Ya se usan en el guion, pero mientras no existen se muestra otra parecida (alias en `tools/sprites.config.json`):

- **Cami:** `seria`, `burla`, `sospecha`, `enojada`, `molesta`, `furia`, `miedo`, `dolor`, `sonrojada`, `asombro`. Son de las más usadas del capítulo: `burla` (141 escenas), `seria` (57), `furia` (35) y `sospecha` (34).
- **Rikka:** `seria` (82 escenas; hoy es `base`).

---

## 3. Caras y poses nuevas para variar

Las más repetidas hoy: Jair `base` (233), Jair `asustado1` (220), Rikka `base` (202), Cami `base` (179), Jair `verguenza1` (121). Estas son las que más cambiarían la sensación del capítulo.

### Jair

| Nueva | Dónde se usaría |
| --- | --- |
| `sonriente` | Jair casi nunca sonríe: el pescado asado al atardecer, «bueno, ahora sí» con la espada |
| `impactado` | Distinto de asustado: ver la isla de cristal otra vez, la clave que funciona |
| `pensativo` | Mano en la barbilla: los tallados en Coffee, la fogata del Rey Malvado |
| `conmovido` | Ojos húmedos, sonrisa chica: «yo también creo en ti», la corona de hojas de Cami |
| `celoso` | Las sacerdotisas y la mirada distinta de Rikka |
| `enojado` | Más fuerte que molesto: cuando lo tratan de niño |
| `tecleando` | De espaldas o de perfil frente a la pantalla del Oráculo |
| `con_espada` | Jair con la espada DELETE en la mano (final del capítulo) |
| `capturado` | Manos atadas, la guardia del Rey se lo lleva |

### Cami

| Nueva | Dónde se usaría |
| --- | --- |
| `pensativa` / `triste_seria` | La fogata: pensando en sus padres sin llorar |
| `ternura_escondida` | Cuando se deja la corona de hojas o dice «sé que puedes» |
| `cruzada_de_brazos` | Pose: esperando que Jair compile |
| `fanfarrona` | Después de humillar al leñador en el pulso |
| `fingiendo` | «Ah, sí, yo también lo sabía» (cara de que no sabe nada) |
| `apuntando_guardia` | Ya existe `apuntando`; una versión con más tensión para la captura |

### Rikka

| Nueva | Dónde se usaría |
| --- | --- |
| `nostalgica` | El recuerdo de su amiga del Verano en la playa |
| `decidida` | «Intentémoslo igual. Con tres.» |
| `rezando` | Manos juntas: la torre, el IDE |
| `berrinche` | Inflando los cachetes: con Kira y Zaki, con Cami |
| `asombrada_cristal` | La isla de cristal y el espacio dimensional |
| `con_espada_seria` | Ya existe `espada`; una pose de guardia frente a la guardia del Rey |

### Nail, Mike, Nora y el vendedor

- **Nail:** `asustada`, `agradecida` (la bolsa de monedas), `ladrona` (sonrisa pícara).
- **Mike y Nora:** ya tienen cuatro cada uno; alcanza.
- **Caballero de la Primavera:** `serio` y `en_guardia` (con la katana).
- **Guardias del Verano, el Otoño y el Invierno** (pedido del autor, 2026-11-05): `guardia_verano` (armadura polinesia), `guardia_otono` (celta) y `guardia_invierno` (siberiana), como el de la Primavera (samurái). Aparecen cuando la historia visita su reino. **Vestimenta estacionaria** (canon): la de guardias y sacerdotisas lleva siempre el emblema de su estación en la espalda (los emblemas, del autor: `public/emblemas/primavera|verano|otono|invierno.webp`; también `sacerdotisa_invierno` y `sacerdotisa_otono`, y la ropa de sacerdotisa de Rikka; el traje rojo no lo tiene).

---

## 4. Fondos

| Fondo | Escenas | Descripción |
| --- | --- | --- |
| `ciudadela_primavera` | 78 | Murallas blancas, techos curvos, faroles de papel, cerezos en flor en cada esquina |
| `ciudadela_mercado` | 11 | Calle principal con puestos: dulces de arroz, telas, linternas, peces de colores en cubetas |
| `ciudadela_muralla` | 11 | Lo alto de la muralla blanca, con la ciudadela abajo |
| `ciudadela_tejados` | 14 | Los tejados curvos de noche (la huida) |
| `almacen_te` | 30 | Un almacén de té, oscuro, con sacos y cajas (el escondite) |
| `sala_rey_malvado` | 18 | La sala del Rey Malvado, con el estanque negro |
| `campamento_noche` | 48 | Fogata en el bosque, de noche |
| `camino_estaciones` | 30 | Sendero donde se mezclan tramos de nieve, hojas rojas, pétalos y arena |
| `aguas_termales` | 55 | Termas naturales entre rocas, con vapor |
| `ciudadela_otono` | 15 | Casas de piedra con hiedra roja, espirales talladas, humo de chimeneas |
| `almacen_molino` | 64 | El almacén viejo junto al molino: vigas, sacos, un poste en el medio |
| `bosque_otono` | 22 | Claro entre robles rojos |
| `camino_invierno` | 26 | Camino nevado; a lo lejos, la posada |
| `taberna_invierno` | **197** | La taberna de la posada: leña, barriles, fuego, mesas largas. **La más usada del capítulo** |
| `posada_amanecer` | 1 | El amanecer sobre la posada nevada |
| `posada_cuarto` | 13 | Cuarto de la posada con tres camas desordenadas, luz de invierno por la ventana |
| `posada_cocina` | 2 | Cocina rústica, olla al fuego, cebollas cortadas |
| `camino_verano` | 2 | La nieve se vuelve barro, después pasto, después arena |
| `playa_verano` | 113 | Playa infinita: arena blanca, agua turquesa, palmeras cansadas y rocas negras al final |
| `playa_verano_noche` | 25 | La misma playa de noche, con fogata de ramas de palmera |
| `torre_estacionaria` | 37 | La torre donde se tocan los cuatro reinos: una cara de nieve, una de hojas, una de flores y una de arena seca |
| `torre_estacionaria_puerta` | 28 | Puerta de piedra sin manija con cuatro símbolos (los emblemas: flor, sol, hoja, copo) |
| `espacio_dimensional` | 8 | Un océano que cae como cascada sobre un desierto, con la isla de cristal flotando donde se tocan |
| `torre_oraculo` | 4 | Llanura gris, sin viento ni sombra, con una torre altísima |
| `torre_oraculo_interior` | 127 | Escalera en espiral alrededor de un vacío; columnas de piedra con nombres de campos («id», «nombre»…) |
| `oraculo_cima` | 79 | Sala redonda sin ventanas con un altar y una pantalla negra incrustada |

Opcionales, para variar la torre del Oráculo (hoy todos sus pisos usan el mismo fondo): `oraculo_papelera` (espadas rotas, coronas, un dragón de piedra sin cabeza), `oraculo_cache` (una sala con mesa, tres sillas y una ventana falsa), `oraculo_respaldos` (estatuas tapadas con sábanas blancas) y `oraculo_pagos` (un mostrador vacío con una campanita).

---

## 5. Imágenes (galería)

| Imagen | Escenas | Descripción |
| --- | --- | --- |
| `cg_taberna_mano` | 4 | Rikka con la cabeza en el hombro de Jair junto al fuego, las manos juntas sobre la mesa |
| `cg_taberna_beso_cami` | 3 | Cami agarra a Jair de la camisa y lo besa |
| `cg_taberna_beso` | 3 | Cami y Rikka, beso rápido sobre la mesa (sugerido) |
| `cg_desayuno_resaca` | 15 | Los tres comiendo el caldo en platos hondos, con pan, en el cuarto de la posada |
| `cg_recuerdo_verano` | 1 | Flashback: dos siluetas en una roca negra frente al mar al atardecer; a la amiga no se le ve la cara |

Ya existe: `cg_rikka_nalgada`.

Sugeridas (no están en el guion todavía): el pulso de Cami contra el leñador, Rikka pescando con la espada, la espada DELETE apareciendo en la luz.

---

## 6. Boringram

| Imagen | Tipo | Descripción |
| --- | --- | --- |
| `boringram_playa` | Foto del feed | Selfie de Jair en la playa, en traje de baño y quemado por el sol, con Cami y Rikka al fondo (la del comentario de Jordan sobre «la rubia») |
| `boringram_desayuno_resaca` | Foto del feed | El desayuno de la resaca, tres platos hondos con pan |
| `historia_jair_taberna` | Historia (vertical) | Jair ebrio levantando la jarra, con Cami y Rikka detrás, borroso y mal encuadrado |
| `historia_jair_cocina` | Historia (vertical) | Jair cocinando con resaca, selfie |
| `historia_jair_termas` | Historia (vertical) | Jair posando en el paisaje de las termas |
| `jordan_perfil` | Foto de perfil | Jordan, el amigo de Jair (Capítulo 4). Hoy se ve su inicial |

Sugeridas, para que la playa y la taberna tengan más fotos (habría que agregarlas a Boringram):

- **Playa:** la ciudadela de arena de Rikka; el pescado asado al atardecer; los pies en la arena con el mar (pensamiento de Jair).
- **Taberna:** la jarra de hidromiel del tamaño de una cabeza; Rikka cantando (foto movida).
- **Resaca:** la ventana del cuarto con la luz «como un insulto personal».
