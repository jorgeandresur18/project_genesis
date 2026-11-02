# Capítulo 2 — El viaje del héroe (plan del autor)

Resumen de lo que entregó el autor. Cada parte nueva se agrega aquí y después se escribe como guion.

Guion en borrador: `src/data/chapters/cap02.json` (libreto: `docs/guion/cap02.md`). Para jugarlo: `npm run dev` y abrir **http://localhost:5173/cap2**; tocar «Nueva partida» (no «Continuar»). Para una escena exacta: `?escena=<scene_id>`. **Se trabaja solo en local: no se sube a GitHub hasta que el autor lo diga.**

## División del capítulo

Duración objetivo: 1 h 30 min (como el Capítulo 1, que tiene unos 82.600 caracteres). En cuatro partes de unos 22 minutos (unos 20.000 caracteres) cada una.

| Parte | Contenido | Estado |
| --- | --- | --- |
| 1/4 | La ciudadela de la Primavera; Rikka se une; la espada DELETE y la torre | Borrador escrito: unos 18.500 caracteres (unos 20 minutos) |
| 2/4 | El viaje: misiones, la foto, las aguas termales, Nail, la armadura de Cami | Borrador en curso: unos 7.900 caracteres (unos 9 minutos); el autor manda el resto |
| 3/4 | El Verano: playas, recuerdo de Rikka, qué es el Rey Malvado; la torre estacionaria y las sacerdotisas del Invierno y del Otoño | Borrador escrito (escenas `cap02_ve_*` y `cap02_te_*`) |
| 4/4 | El espacio dimensional, la torre del Oráculo, la clave, el minijuego de Coffee, la espada DELETE; la guardia del Rey se los lleva | Borrador escrito (escenas `cap02_ed_*`, `cap02_or_*` y `cap02_fin_*`) |

### Parte 1/4: escenas

| Bloque | Lugar (fondo) | Qué pasa |
| --- | --- | --- |
| 1 | `puente_rojo` (listo) | Rikka cura el tobillo de Cami; salen hacia la ciudadela |
| 2 | `sendero_primavera` | Camino entre cerezos: Rikka pregunta por el mundo de Jair (wifi, dinero). **Decisión:** caminar junto a Rikka (+1 confianza), quedarse con Cami o ir en medio [SUGERIDO] |
| 3 | `ciudadela_primavera` | Llegada; la gente saluda a Rikka con reverencias |
| 4 | `ciudadela_mercado` | Un vendedor regala dulces; el pánico de Rikka a que le cobren [SUGERIDO] |
| 5 | `ciudadela_mercado` | Mike y Nora. **Decisión:** «Soy un dios» / «Vinimos caminando» / «Es complicado» |
| 6 | `ciudadela_primavera` | Tzai, la paz, el Rey Primavera; la edad de Rikka («más de quinientos»); la llave se activa |
| 7 | `ciudadela_muralla` | Desde la muralla se ve el puente; «vacaciones»; Cami siente el silencio [SUGERIDO] |
| 8 | `ciudadela_primavera` | Llegan los soldados; Rikka manda a los niños a casa |
| 9 | `ciudadela_tejados` | Huida por los tejados; Rikka sube a Jair de un tirón [SUGERIDO] |
| 10 | `almacen_te` | La misión de Cami, la profecía, «somos tres» |
| 11 | `ciudadela_primavera` | Los caballeros estacionales enfrentan a los soldados |
| 12 | `sendero_primavera` | Rikka no los acompaña; bajando, Cami le pregunta a Jair por los quinientos años [SUGERIDO] |
| 13 | `sala_rey_malvado` | El Rey Malvado: la llave, el Gran Ingeniero |

### Parte 1/4: arte que falta

**Fondos (6)**, 16:9, estilo de los del Capítulo 1:

| Archivo | Descripción para Gemini |
| --- | --- |
| `sendero_primavera` | Sendero de tierra que sube entre cerezos en flor hacia una ciudad amurallada que se ve a lo lejos. Faroles de piedra, pétalos en el aire, luz dorada de atardecer. Inspiración: Japón feudal. |
| `ciudadela_primavera` | Calle principal de una ciudad amurallada de inspiración japonesa feudal: casas de madera con techos curvos, faroles de papel, cerezos en flor en las esquinas, gente que pasa (sin caras definidas). Luz cálida de tarde. |
| `ciudadela_mercado` | Mercado en la misma ciudad: puestos con toldos de tela, dulces de arroz, telas de colores, linternas de papel, cubetas con peces de colores. |
| `ciudadela_muralla` | Vista desde lo alto de una muralla blanca: techos curvos, un río, un bosque y, a lo lejos, pequeño, un puente de madera rojo. Atardecer. |
| `ciudadela_tejados` | Tejados de tejas grises y rojas, de cerca, con huecos entre casas y toldos abajo. Sensación de altura y huida. |
| `almacen_te` | Interior de un almacén de té: estantes de madera, sacos y cajas de hojas, polvo en el aire, una ventana pequeña que da a la calle. Penumbra. |
| `sala_rey_malvado` | Sala de trono sin ventanas, casi a oscuras. En el centro, un estanque negro como espejo que refleja una luz fría. Atmósfera de amenaza, sin mostrar a nadie. |

(Son 7 contando `sala_rey_malvado`; el puente rojo ya está.)

**Sprites nuevos (4 personajes):**

| Personaje | Expresiones mínimas | Notas |
| --- | --- | --- |
| Mike | base, emocionado, asustado | Niño de la ciudadela, espada de madera. `TODO(canon)`: edad y aspecto |
| Nora | base, curiosa, asustada | Niña de la ciudadela, canasta de flores. `TODO(canon)`: edad y aspecto |
| Caballero estacional | base | Armadura en cuatro colores (rosa, verde, ocre, blanco). Puede ser uno genérico |
| Vendedor | base | Vendedor del mercado; opcional (puede quedar sin sprite) |

**Expresiones que faltan de personajes ya hechos:** Rikka **enojada**, Rikka **tierna** (con los niños), Rikka **triste** (cuando habla de lo que perdió), Cami **seria** (hoy usa la base) y Cami **dolor** (hoy usa cansada).

**Imagen con personajes (opcional):** `cg_rikka_cura_cami`, Rikka vendándole el tobillo a Cami mientras Jair mira de lejos.


- Jair, Cami y Rikka siguen camino a la **ciudadela de la Primavera**, hogar de Rikka. Ahí viven sus amigos, dos niños: **Mike** y **Nora**.
- Rikka cuenta que el pueblo vive hace años en prosperidad, desde que acabaron con la ocupación de una **heralda del Rey Malvado**, **Tzai** (la de RikkaQuest), que ocupaba el territorio.
- Rikka es la **guardiana del puente** a la entrada de la ciudadela desde hace tanto tiempo que ya no recuerda cuánto.
- El Rey Malvado todavía quiere gobernar esas tierras, pero gracias al **Rey Primavera** no ha pasado; al menos los 4 reinos están en paz. Rikka recuerda cuando había guerras. (Es un Rey Primavera nuevo: el Rey Malvado fue el anterior.)
- Cami le pregunta a Rikka su edad. Jair dice: «Tienes más de 500 años, ¿verdad?». Rikka: «Más o menos, se podría decir que sí… ¿cómo sabes eso?». Cami se sorprende. Jair estaba por decir que él había escrito algo de una heroína que luchó en una guerra dentro de su universo, pero inventa una excusa: que lo leyó por ahí.
- Llegan **soldados buscando a Cami**: saben que está en el pueblo. Como Rikka no estaba en el puente, no pudo cuidar la entrada. A Rikka le sorprende que ahora seres de otras dimensiones lleguen aquí con tanta facilidad. Deciden escapar.
- Cami dice que su misión es **derrotar al Rey Malvado**. Rikka: es una idea suicida. Jair: Cami tiene sus motivos y él la va a apoyar.
- Rikka empieza a **sentir algo** por la determinación de Jair de ayudar a otros. Había leído una profecía: un **salvador** que destruiría al Rey Malvado y se volvería el nuevo rey soberano; no pertenecería a ninguna dimensión, vendría de un lugar más allá de esta existencia. Creía que era un mito, pero cree que puede ser él.
- Rikka perdió mucho hace años por culpa del Rey Malvado, pero aprendió a vivir con ello. Aun así: son solo 3, no le harían ni cosquillas a su ejército.
- Llegan los **caballeros estacionales** y les preguntan a los soldados quién les permitió a seres de otras dimensiones irrumpir en la ciudadela y en el reino; los soldados insisten en buscar a Cami.
- Rikka los ayuda a escapar, pero no promete ayudarlos con la «loca idea» de derrotar al Rey Malvado.

### Lo que Rikka no sabe (escena del Rey Malvado)

- El Rey Malvado tiene a los **4 reyes estacionales** a su merced.
- No busca a Cami porque crea que lo va a derrotar, sino porque **ella es un puente entre esta realidad y otra** (es el nexus, pero en el Capítulo 2 no se dice la palabra). Si obtiene el nexus que hay dentro de Cami, puede materializar su realidad en la otra realidad.
- Pero necesita que **el héroe** dé esa orden… y mira a Jair: o más bien, al **creador** de esta realidad. Lo ha esperado más de un milenio y ahora está aquí.
- «Muchas civilizaciones lo adoraban como a un dios. Lo llamaban **el Gran Ingeniero**. Yo siempre dudé de ese dios… y ahora que lo veo, sigo dudando de él».

### Parte 1/4 (final) y parte 2/4: arte que falta

**Fondos:**

| Archivo | Descripción para Gemini |
| --- | --- |
| `campamento_noche` | Claro al borde de un bosque de cerezos, de noche, con una fogata pequeña, mochilas y mantas en el suelo. Estrellas y luz naranja del fuego. |
| `camino_estaciones` | Camino de tierra que pasa de un bosque de cerezos a un bosque de robles rojos y naranjas de otoño, con un río y colinas a lo lejos. |
| `aguas_termales` | Aguas termales naturales entre rocas grandes, con vapor que sube, plantas alrededor y una roca enorme en el medio que separa dos pozas. Atardecer. Sin personas. |
| `ciudadela_otono` | Ciudadela del Otoño, de inspiración celta: casas de piedra con hiedra roja, piedras talladas con espirales, robles rojos y naranjas, humo de chimeneas, puestos de manzanas. Tarde nublada. |
| `almacen_molino` | Interior de un almacén viejo de piedra y madera junto a un molino: sacos de grano, barriles, un poste en el medio, luz que entra por las rendijas, una ventana atrás. |
| `bosque_otono` | Claro tranquilo en un bosque de robles rojos y naranjas, con el suelo cubierto de hojas secas. Atardecer. |

**Sprites y variantes:**

| Qué | Para qué |
| --- | --- |
| **Nail** (base, asustada, atada, agradecida) | La ladrona. Un poco más joven y más bajita que Cami, pelo naranja, ropa humilde |
| **Rikka con el traje rojo** (base, sonrojada) | El traje de Cami en rojo |
| **Cami en modo berserk**: `armored_bersek_mode` (cuerpo entero, sola) y `armored_bersek_medio` (hasta la cintura, con el soldado); las dos salen de la misma capa del PSB | Segunda fase de la pelea del almacén, después del armored |
| **Cami armored**: el traje metálico (`armored_base`, `armored_seria`, `armored_furiosa`) | Primera fase de la pelea del almacén. Es temporal: al terminar la batalla vuelve a su traje de siempre y el armored queda recargándose |
| **Rikka con el traje rojo y la espada encendida** (`rikka_traje_espada`) | La pelea corta en el almacén del molino; la empuñadura es lo único que Nail no se llevó |
| **Cami y Rikka con toalla** (opcional) | La escena de las termas; sugerente, nunca explícita |

**Imágenes con personajes (opcionales):** `cg_aguas_termales` (vapor, rocas, siluetas; nada explícito), `cg_cami_armadura` (la transformación) y la foto de Rikka en el celular de Jair (Rikka en una piedra mirando el atardecer, con el pelo suelto).

**Prompt para Gemini (Nail):** chica un poco más joven y más bajita que Cami (Cami mide 1,56 m), pelo naranja despeinado, ropa humilde y gastada de un pueblo pobre (túnica corta remendada, pantalones sueltos, vendas en las manos, sandalias), una bolsa cruzada y un cuchillo pequeño en la bota. Mismo estilo de dibujo que los sprites de Cami y Rikka, cuerpo entero, fondo transparente.

### Parte 2/4 (cierre): la posada del Invierno

Escenas `cap02_t_*` (95 escenas, unos 7.600 caracteres). Camino al Invierno → taberna: hidromiel que paga Rikka, «Yo nunca nunca» → **decisión** reto (beso Rikka–Cami; Rikka se duerme; Cami: besarla o beber, `romance_cami`) o verdad (secretos; Cami se duerme; charla con Rikka que le toma la mano: apretarla o no, `romance_rikka`) → resaca → camino a la torre. El cierre provisional del capítulo (`fin_capitulo: 2`) pasó al final de esta escena.

**Fondos:** `camino_invierno` (sendero nevado con pinos, bruma, luz fría de tarde), `posada_invierno` (no se usa todavía; exterior de madera con nieve en el techo y ventanas cálidas), `taberna_invierno` (taberna rústica con chimenea, barriles, mesas de madera, ventanas con nieve, luz anaranjada), `posada_cuarto` (cuarto sencillo de posada a la mañana, luz blanca de invierno por la ventana, tres camas deshechas).

**Opcionales:** Rikka y Cami ebrias (sonrojadas, ojos entrecerrados), imagen `cg_taberna_beso` (el beso rápido, sugerido) e imagen `cg_taberna_mano` (Rikka con la cabeza en el hombro de Jair junto al fuego).

### Boringram en el Capítulo 2

Datos en `src/data/boringram/cap02.json` (inglés en `src/data/en/boringram/cap02.json`). En la taberna, Rikka carga el celular con elemento rayo (escenas `cap02_t_bc*`). **Arte que falta:** `historia_jair_termas` (Jair posando en las aguas termales, foto vertical de celular, estilo selfie, ropa puesta).

### Posada: verdad o reto, resaca y desayuno (reescrito)

Escenas `cap02_t_r*`, `cap02_t_v*`, `cap02_t_c*` (verdad o reto) y `cap02_t_e*` (desayuno). Tres imágenes, una por partida:

| Imagen | Cómo se llega |
| --- | --- |
| `cg_taberna_mano` | Verdad a Rikka → Verdad para Jair → apretarle la mano |
| `cg_taberna_beso_cami` | Cualquier camino donde Rikka se duerma primero → «Besar a Cami» |
| `cg_taberna_beso` | Reto a Rikka → Reto (Jair propone el beso) → insistir → insistir otra vez |

**Sprites nuevos:** ebrios (`jair_ebrio`, `cami_ebria`, `rikka_ebria`: sonrojados, ojos entrecerrados, sonrisa floja) y con resaca (`jair_resaca`, `cami_resaca`, `rikka_resaca`: ojeras, pelo revuelto, cara de dolor de cabeza). Hoy salen como cuadros grises en sus escenas.

**Imágenes con personajes:** `cg_taberna_mano` (Rikka con la cabeza en el hombro de Jair junto al fuego, las manos juntas sobre la mesa), `cg_taberna_beso` (Cami y Rikka, beso rápido sobre la mesa, sugerido), `cg_taberna_beso_cami` (Cami agarra a Jair de la camisa y lo besa), `cg_desayuno_resaca` (los tres comiendo el caldo en platos hondos, con pan, en el cuarto de la posada).

**Fondos:** `posada_cocina` (cocina rústica de la posada con olla al fuego y cebollas cortadas).

**Boringram:** `boringram_desayuno_resaca` (foto del desayuno para la publicación de Jair) e `historia_jair_cocina` (Jair cocinando, foto vertical tipo selfie).

### Partes 3/4 y 4/4: el Verano, la torre estacionaria y la torre del Oráculo

**Minijuego:** `cap02_or_046` (`"minijuego": "coffee_espada"`, datos en `src/data/minijuegos/coffee_espada.json`). Solución: blend, espresso, invocar, refill, usuario, desenvainarSiDios, decaf, pour.

**Fondos nuevos (hoy cuadros grises):** `camino_verano`, `playa_verano`, `playa_verano_noche` (fogata), `torre_estacionaria` (una cara por estación; la del Verano, arena sin cuidar), `torre_estacionaria_puerta` (puerta de piedra sin manija con cuatro símbolos: flor, sol, hoja y copo de nieve), `espacio_dimensional` (un océano que cae sobre un desierto y la isla de cristal donde se tocan), `torre_oraculo` (llanura gris y una torre altísima), `torre_oraculo_interior` (escalera en espiral, columnas con nombres de campos), `oraculo_cima` (sala redonda con un altar y una pantalla).

**Imagen:** `cg_recuerdo_verano` (flashback: dos siluetas en una roca negra frente al mar al atardecer; a la amiga no se le ve la cara).

**Sprites nuevos:** `sacerdotisa_invierno` (túnica blanca con escarcha) y `sacerdotisa_otono` (túnica ocre con hojas bordadas); las dos con la cara de Rikka, cambiando los colores. `guardia_rey` (la guardia del Rey Malvado).

### Trajes de baño (playa del Verano)

Sprites nuevos (hoy cuadros grises, de `cap02_ve_020` a `cap02_bq_21`): `jair_bano`, `cami_bano` y `rikka_bano`, con las expresiones que piden esas escenas (base, burlona, sonrojada, enojada, preocupada, tierna, asustado, atontado, quemado por el sol). Jair termina con la cara y los hombros rojos por el sol (`cap02_bp_024`).

**Fondo nuevo:** `posada_amanecer` (el amanecer sobre la posada nevada, entre la noche de la taberna y la mañana de la resaca).
