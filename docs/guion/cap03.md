<!-- guion:cap03.json -->
# Capítulo 3 — Sin DÓNDE ir

> **Estado:** borrador. Borrador del Capítulo 3 escrito por Claude con las decisiones del autor del 5 de noviembre de 2026 (docs/guion/cap03_plan.md): la fortaleza del Rey como una torre de 9 pisos con caminos que se cruzan, hordas y descansos, la espada que se recupera en el arsenal, el Rey con yelmo (sin la forma gigante, que queda para el Capítulo 6), THE NEXUS dicho por el Rey, el DELETE sin WHERE que se escribe solo, alt_1 y el despertar. Peleas y enemigos de relleno: el autor va a crear los suyos. No es canon hasta que el autor lo apruebe.
>
> **Cómo editar:** cambia el hablante (entre `**...:**`) o el texto de cualquier línea, o el texto de una opción.
> No borres ni cambies los códigos entre comillas invertidas (`063`): así se sabe a qué escena corresponde cada línea.
> Narración: líneas que empiezan con «—». Las líneas que empiezan con «>» son notas y no se importan.
> Al terminar, corre `npm run guion:importar` y después `npm run test:routes`.
> Para agregar, quitar o reordenar escenas, pídemelo: la importación solo cambia textos.


### calabozo_fortaleza

> ◐ transición: negro_lento
`calabozo_01` — Huele a óxido, a humedad y a algo que alguna vez fue comida.

`calabozo_02` **Voz:** > Sesión restaurada. Usuario: no registrado. Ubicación: fortaleza. Nivel: −3.

`calabozo_03` **Jair:** Nivel menos tres. Hasta el calabozo tiene sótano.

`calabozo_04` **Cami:** Nos quitaron la espada. Y mis pistolas. Revisaron hasta las botas.

`calabozo_05` **Rikka:** A mí me quitaron la daga y el orgullo. La daga me dolió más.

`calabozo_06` **Jair:** La espada. La DELETE. Era lo único que…

`calabozo_07` **Cami:** Era lo único que teníamos, sí. Gracias por el resumen.

`calabozo_08` — Por el pasillo pasan dos guardias. Uno silba. El otro carga algo largo envuelto en tela, lejos del cuerpo, como si quemara.

`calabozo_09` **Guardia:** Al arsenal del piso cinco. El Rey dice que nadie la toque hasta que él la vea.

`calabozo_10` **Rikka:** Piso cinco. Nuestra espada está en el piso cinco.

`calabozo_11` **Jair:** Y nosotros en el menos tres. Ocho pisos. Como subir a la oficina el día que se cae el ascensor.

`calabozo_12` **Cami:** Con la diferencia de que en tu oficina nadie te dispara.

`calabozo_13` **Jair:** En mi oficina me mandan correos. Es peor. Al menos un disparo se termina.

`calabozo_14` **Rikka:** Jair. ¿Cuál es el plan?

`calabozo_15` — Las dos lo miran. Nadie le pidió nunca un plan para algo que no fuera un sprint de dos semanas.


> **DECISIÓN**
- `calabozo_15#0` Esperar al guardia y atacarlo cuando abra ⟶ va a `ataque_01`
- `calabozo_15#1` Que Cami fuerce la cerradura ⟶ va a `cerradura_01`
- `calabozo_15#2` Hablar con el guardia ⟶ va a `charla_01`
- `calabozo_15#3` Pedir que te lleven ante el Rey ⟶ va a `rendicion_01`

`ataque_01` **Jair:** Cuando abra para traer la comida, saltamos encima.

`ataque_02` **Cami:** ¿Tú vas a saltar encima de alguien? Quiero verlo.

`ataque_03` — La comida llega. La puerta se abre. Jair salta. Es más un tropiezo con intenciones, pero el guardia termina en el piso.

`ataque_04` **Guardia:** ¡Se escapan! ¡Los del piso de arriba, bajen!

> ⤷ continúa en `pelea_calabozo_01`

`cerradura_01` **Cami:** Rikka. Una horquilla.

`cerradura_02` **Rikka:** ¿De mi peinado? Es de la ceremonia de la Primavera. Tiene siglos.

`cerradura_03` **Cami:** Entonces ya cumplió.

`cerradura_04` — Cami trabaja la cerradura con la paciencia de alguien que ya estuvo encerrada antes. Clic.

`cerradura_05` — El clic suena más fuerte de lo que debería. Al fondo del pasillo, alguien deja de silbar.

> ⤷ continúa en `pelea_calabozo_01`

`charla_01` **Jair:** Disculpa. Una consulta rápida. ¿Ustedes tienen un protocolo de escalamiento?

`charla_02` **Guardia:** ¿Un qué?

`charla_03` **Jair:** Si un prisionero tiene una queja, ¿a quién se la manda? ¿Hay un ticket, un formulario, alguien de recursos humanos?

`charla_04` **Guardia:** Hay un garrote.

`charla_05` **Jair:** Perfecto. Muy claro el proceso.

`charla_06` — El guardia abre la celda para demostrarle el proceso. Cami no lo deja terminar la demostración.

> ⤷ continúa en `pelea_calabozo_01`

`rendicion_01` **Jair:** ¡Guardia! Quiero hablar con el Rey. Seguro podemos negociar.

`rendicion_02` **Cami:** Jair, no.

`rendicion_03` — Se lo llevan solo. A las dos las dejan en la celda, porque el Rey no las pidió todavía.

`rendicion_04` **Voz:** > Usuario entregado voluntariamente. Prioridad: baja. Tiempo de respuesta estimado: indefinido.

`rendicion_05` — Lo sientan en una sala de espera. Hay una máquina que da números. Le toca el 4.096.


### PANTALLA:negro

`rendicion_06` — Ticket cerrado

> **BAD END: Ticket cerrado**

---

### calabozo_fortaleza

`pelea_calabozo_01` — Bajan por la escalera de caracol: dos, cuatro, seis guardias. Y detrás, alguien con una capa más cara.

> ⤷ continúa en `escaleras_01`

`bad_calabozo_01` — Los arrastran de vuelta a la celda. Esta vez, con cadenas.

`bad_calabozo_02` **Voz:** > Intento de fuga registrado. Reintentos disponibles: 0.


### PANTALLA:negro

`bad_calabozo_03` — Reintento fallido

> **BAD END: Reintento fallido**

---

### fortaleza_escaleras

> ♪ música: serene
`escaleras_01` — La escalera sube en espiral por dentro de la torre. Cada descanso tiene un estandarte con el escudo del Rey: una corona encima de una tabla.

`escaleras_02` **Jair:** ¿Una tabla? ¿Su escudo es una tabla?

`escaleras_03` **Rikka:** Dicen que ahí anota todo lo que conquista. Reinos, dimensiones, gente. Si estás en su tabla, le perteneces.

`escaleras_04` **Jair:** Una base de datos con corona. Lo más aterrador que vi en mi vida.

`escaleras_05` **Cami:** ¿Y nosotros estamos en esa tabla?

`escaleras_06` **Rikka:** No lo sé. Espero que no.

`escaleras_07` — En el piso −1 hay una puerta de hierro con un cartel: «Montacargas. Solo personal autorizado».

`escaleras_08` **Jair:** Un montacargas. Nos ahorra seis pisos.

`escaleras_09` **Cami:** Nos ahorra seis pisos o la vida entera. Mira las cuerdas.


> **DECISIÓN**
- `escaleras_09#0` Bajar a las cloacas ⟶ va a `cloacas_01`
- `escaleras_09#1` Cruzar las bodegas ⟶ va a `bodegas_01`
- `escaleras_09#2` Tomar el montacargas ⟶ va a `montacargas_01`

`montacargas_01` **Jair:** Las cuerdas aguantan. Todo aguanta hasta que no.

`montacargas_02` — Suben un piso. Dos. En el tercero, algo cruje con el sonido exacto de una decisión mal tomada.

`montacargas_03` **Voz:** > Último mantenimiento: hace 512 años.


### PANTALLA:negro

`montacargas_04` — Sin mantenimiento

> **BAD END: Sin mantenimiento**

---

### fortaleza_cuarteles

`cuarteles_01` — El piso uno son los cuarteles. Literas, armaduras colgadas, olor a sudor de varios siglos. Y soldados. Muchos.

`cuarteles_02` **Voz:** > Alerta: prisioneros fuera de su celda. Todas las unidades, al piso uno.

`cuarteles_03` **Cami:** Qué bueno. Ahora vienen todos juntos y no tenemos que buscarlos.

`cuarteles_04` **Rikka:** Sin mi daga peleo con los puños. Una sacerdotisa de la Primavera también aprende eso.

`cuarteles_05` **Jair:** Yo aprendí a hacer capturas de pantalla. No sé si sirve.

> ⤷ continúa en `cuarteles_2_01`

`bad_cuarteles_01` — Eran demasiados. Siempre son demasiados.

`bad_cuarteles_02` **Voz:** > Bajas en el bando enemigo: aceptables.


### PANTALLA:negro

`bad_cuarteles_03` — Bajas aceptables

> **BAD END: Bajas aceptables**

---

### fortaleza_biblioteca_oscura

`biblioteca_01` — El piso tres es una biblioteca. O lo era: los estantes están llenos de libros en blanco, y la tinta se juntó en el piso como un charco negro.

`biblioteca_02` **Cami:** Esto ya lo vi. En el Bastión. La cosa de tinta que se arrastraba.

`biblioteca_03` — El charco se levanta. Tiene forma de algo que alguna vez quiso ser una persona.

`biblioteca_04` **Voz:** > Contenido sin registrar detectado. Asignando forma: sombra.

`biblioteca_05` **Rikka:** ¿Por qué un rey tiene esto en su biblioteca?

`biblioteca_06` **Jair:** Porque es lo que pasa con los libros que nadie termina de escribir.

`biblioteca_07` — No sabe por qué lo dijo. Le suena a algo que ya pensó antes, mirando una carpeta llena de borradores.

> ⤷ continúa en `piso4_01`

`bad_sombras_01` — La tinta los cubre. Primero los pies, después todo lo demás.

`bad_sombras_02` **Voz:** > Modo oscuro activado. No se puede desactivar.


### PANTALLA:negro

`bad_sombras_03` — Modo oscuro

> **BAD END: Modo oscuro**

---

### fortaleza_arsenal

`arsenal_01` — El piso cinco. El arsenal. Paredes enteras de armas: hachas, lanzas, armaduras vacías que parecen mirarlos.

`arsenal_02` **Rikka:** Mira, Jair. Trofeos. Son armas de los reinos que el Rey conquistó.

`arsenal_03` — En el centro, sobre un pedestal, la tela. Debajo, una empuñadura que zumba bajito, como un servidor en un cuarto cerrado.

`arsenal_04` **Jair:** La DELETE.

`arsenal_05` — Al lado del pedestal hay un hacha dorada enorme. Brilla mucho más. Tiene pinta de arma legendaria.

`arsenal_06` **Cami:** Ni se te ocurra.


> **DECISIÓN**
- `arsenal_06#0` Ir directo por la espada ⟶ va a `pelea_arsenal_01`
- `arsenal_06#1` Agarrar el hacha dorada ⟶ va a `trofeo_01`

`trofeo_01` **Jair:** Solo quiero ver cuánto pesa.

`trofeo_02` — Pesa más de lo que parece. Pesa, sobre todo, la maldición que tiene encima.

`trofeo_03` **Voz:** > Objeto no compatible con el usuario. Garantía: anulada.


### PANTALLA:negro

`trofeo_04` — Garantía anulada

> **BAD END: Garantía anulada**

---

### fortaleza_arsenal

`pelea_arsenal_01` — Jair estira la mano hacia la espada. Una voz desde la puerta lo detiene.

`pelea_arsenal_02` **Capitán:** Nadie toca eso hasta que la vea el Rey. Órdenes.

`pelea_arsenal_03` **Cami:** Qué lástima. Nosotros no recibimos órdenes de nadie.

> ⤷ continúa en `espada_01`

`bad_arsenal_01` — La espada sigue en el pedestal. Tan cerca.

`bad_arsenal_02` **Voz:** > Acceso denegado. Permisos insuficientes.


### PANTALLA:negro

`bad_arsenal_03` — Acceso denegado

> **BAD END: Acceso denegado**

---

### fortaleza_arsenal

`espada_01` — Jair toma la espada. El zumbido se apaga, como si lo hubiera estado esperando.

`espada_02` **Voz:** > Herramienta: DELETE. Propietario: usuario. Sesión del Oráculo: todavía activa.

`espada_03` **Rikka:** Te queda bien. Como si fuera tuya.

`espada_04` **Cami:** Le queda como a un cajero con una katana. Pero sirve.

`espada_05` **Jair:** Arriba está el trono. Y el Rey.

`espada_06` **Cami:** Y el que me quitó a mis padres.

`espada_07` — Nadie dice nada más. Suben.

> ⤷ continúa en `piso6_01`


### fortaleza_cloacas

`cloacas_01` — Las cloacas de la fortaleza. Agua negra, paredes con números pintados y un zumbido que viene de todos lados a la vez.

`cloacas_02` **Voz:** > Advertencia: procesos huérfanos detectados en el subsuelo.

`cloacas_03` — Del agua salen bichos. Bichos de verdad: patas de metal, ojos de cursor, y un chasquido que suena a error de compilación.

`cloacas_04` **Jair:** Bugs. Literalmente bugs. Alguien dejó correr esto sin probarlo.

`cloacas_2_01` — Cuanto más avanzan, más grandes son. Al final del túnel hay uno del tamaño de un perro, rodeado de crías.

`cloacas_2_02` **Cami:** La reina. Siempre hay una reina.

`cloacas_2_03` **Rikka:** En la Primavera las reinas plantan árboles.

`cloacas_2_04` **Cami:** Esta planta huevos. Cada uno, un problema nuevo.

> ⤷ continúa en `cuarteles_01`


### fortaleza_bodegas

`bodegas_01` — Las bodegas: barriles, sacos, cajas apiladas hasta el techo con etiquetas de reinos que ya no existen.

`bodegas_02` **Rikka:** «Té de la Primavera, cosecha 512». Era de mi templo.

`bodegas_03` — Entre las cajas aparecen los bodegueros. No llevan armadura: llevan delantal y una pala.

`bodegas_04` **Bodeguero:** Inventario. Hoy toca inventario. Y ustedes no están en la lista.

`bodegas_2_01` — El jefe de bodega los espera con un libro de cuentas abierto.

`bodegas_2_02` **Jefe de bodega:** Tres intrusos, sin registrar. Eso es un faltante. Los faltantes se corrigen.

`bodegas_2_03` **Jair:** Es mi contador. Me persigue hasta aquí.

> ⤷ continúa en `cuarteles_01`


### fortaleza_cloacas

`bad_subsuelo_01` — El subsuelo se los traga. Nadie baja nunca a revisar el subsuelo.

`bad_subsuelo_02` **Voz:** > Fuga de memoria detectada. No se liberará.


### PANTALLA:negro

`bad_subsuelo_03` — Fuga de memoria

> **BAD END: Fuga de memoria**

---

### fortaleza_cuarteles

`cuarteles_2_01` — Cuando cae el último soldado, se abre la puerta del fondo. Entra un sargento con la armadura llena de medallas.

`cuarteles_2_02` **Sargento:** ¿Quién les dio permiso para ganar?

`cuarteles_2_03` **Cami:** Nadie. Por eso nos gusta.

`piso2_01` — Arriba, el pasillo se parte en dos. A la izquierda, olor a guiso. A la derecha, calor y martillazos.

`piso2_02` **Jair:** El comedor o la forja. Los dos suben al piso tres, según el plano de la pared.

`piso2_03` **Rikka:** Tengo hambre. Pero también tengo miedo de lo que cocinan aquí.


> **DECISIÓN**
- `piso2_03#0` Ir por el comedor ⟶ va a `comedor_01`
- `piso2_03#1` Ir por la forja ⟶ va a `forja_01`


### fortaleza_comedor

`comedor_01` — El comedor de la tropa. Mesas largas, platos a medio comer y cocineros con cuchillos más grandes que sus brazos.

`comedor_02` **Cocinero:** Llegan tarde al almuerzo. El castigo es ser el almuerzo.

`comedor_2_01` — Rikka se guarda un pan en la manga. Nadie dice nada.

`comedor_2_02` — El chef sale de la cocina: gorro alto, cucharón de hierro, y cura a sus ayudantes con cada plato que sirve.

`comedor_2_03` **Chef de la tropa:** Nadie se va de mi comedor sin probar la especialidad.

> ⤷ continúa en `descanso1_01`


### fortaleza_forja

`forja_01` — La forja. Un calor que arranca el aire de los pulmones. Herreros que martillan espadas para un ejército que no se termina nunca.

`forja_02` **Herrero:** Otra horma rota. Tráiganme más metal. Ah, miren: metal que camina.

`forja_2_01` — El maestro herrero deja el yunque. Tiene los brazos quemados de siglos de trabajo y un martillo al rojo vivo.

`forja_2_02` **Maestro herrero:** Cada arma de esta torre salió de mis manos. Ustedes van a ser las primeras que rompo.

> ⤷ continúa en `descanso1_01`


### fortaleza_comedor

`bad_piso2_01` — El piso dos los termina de cansar. Literalmente.

`bad_piso2_02` **Voz:** > Tiempo de descanso agotado. Vuelva a su puesto.


### PANTALLA:negro

`bad_piso2_03` — Hora del almuerzo

> **BAD END: Hora del almuerzo**

---

### fortaleza_descanso

`descanso1_01` — Una escalera de servicio, oscura y quieta. Por primera vez en horas, nadie los persigue.

`descanso1_02` **Rikka:** Comamos. Traje pan del comedor. O de la forja. Ya no sé de dónde.

`descanso1_03` **Cami:** Robaste pan en medio de una fuga.

`descanso1_04` **Rikka:** Una sacerdotisa también aprende a sobrevivir.

`descanso1_05` **Jair:** Esto es lo más parecido a un almuerzo de trabajo que tuve en años. Y es mejor.

`descanso1_06` — Comen en silencio. Afuera, la torre sigue respirando.

`descanso1_cofre` — Debajo de la escalera hay tres cajas de provisiones de la tropa, con candados oxidados. Les alcanza el tiempo para forzar una sola.


> **DECISIÓN**
- `descanso1_cofre#0` La caja de agua sin gas (3) ⟶ va a `descanso1_cofre_a` · mochila_vida +3
- `descanso1_cofre#1` La caja de Furia Roja (2) ⟶ va a `descanso1_cofre_b` · mochila_atq +2
- `descanso1_cofre#2` La caja de galletas arcoíris (2) ⟶ va a `descanso1_cofre_c` · mochila_galleta_arcoiris +2

`descanso1_cofre_a` **Voz:** > Objeto obtenido: Agua sin gas ×3. Va a la mochila.

> ⤷ continúa en `biblioteca_entrada_01`

`descanso1_cofre_b` **Voz:** > Objeto obtenido: Furia Roja ×2. Va a la mochila.

> ⤷ continúa en `biblioteca_entrada_01`

`descanso1_cofre_c` **Voz:** > Objeto obtenido: Galleta arcoíris ×2. Va a la mochila.


### fortaleza_biblioteca_oscura

`biblioteca_entrada_01` — En la entrada de la biblioteca, unos escribas sin cara copian libros en blanco, uno detrás del otro.

`biblioteca_entrada_02` **Escriba de tinta:** Silencio. Esta es una biblioteca. Lo que hablen, lo vamos a corregir.

> ⤷ continúa en `biblioteca_01`


### fortaleza_prision_reinos

`piso4_01` — El piso cuatro tiene dos alas. En una, celdas. En la otra, un patio abierto al vacío del espacio dimensional.

`piso4_02` **Voz:** > Prisión de los reinos. Prisioneros: 1.204. Visitas: no permitidas.

`piso4_03` **Rikka:** ¿Mil doscientos? Puede haber gente de la Primavera ahí.


> **DECISIÓN**
- `piso4_03#0` Pasar por las celdas ⟶ va a `celdas_01`
- `piso4_03#1` Cruzar el patio ⟶ va a `patio_01`

`celdas_01` — Las celdas guardan gente de todos los reinos: campesinos del Otoño, soldados de la Resistencia y guardias de las cuatro estaciones, todavía con sus armaduras: los que no quisieron servir al Rey.

`celdas_01g01` **Guardia del Invierno:** Nos encerraron por decir que no. Los que dijeron que sí están en el patio y cuidan estas celdas, con el yelmo negro del Rey.

`celdas_02` **Celador:** Nadie entra a la prisión sin condena. Les voy a dar una.

`celdas_2_01` — En la última celda, un viejo jardinero de la Primavera reconoce el traje de Rikka.

`celdas_2_02` **Jardinero:** Sacerdotisa. Sabía que vendría alguien. El alcaide tiene las llaves. Y el Rey, todo lo demás.

`celdas_2_03` **Rikka:** Te sacamos de aquí. A ti y a todos.

`celdas_2_04` — El alcaide aparece al final del pasillo, con un manojo de llaves que suena como una amenaza.

> ⤷ continúa en `descanso2_01`


### fortaleza_patio

`patio_01` — El patio no tiene paredes: a los lados, el espacio dimensional, donde un océano cae sobre un desierto sin hacer ruido.

`patio_02` — Lo patrullan guardias de las estaciones con el yelmo negro del Rey encima de su armadura: del Verano, del Otoño, del Invierno. Los que dijeron que sí.

`patio_02g01` **Rikka:** Esas armaduras son de nuestros reinos. Esos guardias tenían que protegerlos.

`patio_2_01` — Al otro lado del patio espera el alcaide, con las llaves de toda la prisión colgadas del cinturón.

`patio_2_02` **Alcaide:** Ningún prisionero salió nunca de esta torre. Ustedes no van a ser los primeros.

> ⤷ continúa en `descanso2_01`


### fortaleza_prision_reinos

`bad_prision_01` — Los encierran en el piso cuatro, entre los mil doscientos.

`bad_prision_02` **Voz:** > Prisioneros: 1.207. Condena: perpetua.


### PANTALLA:negro

`bad_prision_03` — Cadena perpetua

> **BAD END: Cadena perpetua**

---

### fortaleza_descanso

`descanso2_01` — Detrás de una puerta, un depósito de antorchas apagadas. Se sientan en el piso.

`descanso2_02` **Cami:** Jair. ¿Por qué el Rey dijo que no estás en ninguna tabla?

`descanso2_03` **Jair:** No sé. En el trabajo tampoco aparezco en el organigrama.

`descanso2_04` **Cami:** No es un chiste.

`descanso2_05` **Jair:** Ya sé. Por eso lo hago chiste.

`descanso2_06` — Arriba está el arsenal. Y la espada.

`descanso2_cofre` — Entre las antorchas hay tres cofres con el sello del Rey. Cami fuerza uno antes de que alguien los oiga.


> **DECISIÓN**
- `descanso2_cofre#0` El de la cruz rosada: Elixit (2) ⟶ va a `descanso2_cofre_a` · mochila_revivir +2
- `descanso2_cofre#1` El que tintinea: monedas (200) ⟶ va a `descanso2_cofre_b` · monedas +200
- `descanso2_cofre#2` El que suena a lata: 4Low-Co (2) ⟶ va a `descanso2_cofre_c` · mochila_carga +2

`descanso2_cofre_a` **Voz:** > Objeto obtenido: Elixit ×2. Va a la mochila.

> ⤷ continúa en `arsenal_01`

`descanso2_cofre_b` **Voz:** > Objeto obtenido: 200 monedas. Va a la mochila.

> ⤷ continúa en `arsenal_01`

`descanso2_cofre_c` **Voz:** > Objeto obtenido: 4Low-Co ×2. Va a la mochila.

> ⤷ continúa en `arsenal_01`


### fortaleza_salon_guardia

`piso6_01` — El piso seis es de la guardia real. Dos caminos llevan al trono: el salón de armas o la galería de retratos.

`piso6_02` **Voz:** > Acceso restringido. Solo personal de la tabla del Rey.


> **DECISIÓN**
- `piso6_02#0` Ir por el salón de armas ⟶ va a `salon_01`
- `piso6_02#1` Ir por la galería de retratos ⟶ va a `galeria_01`

`salon_01` — Los caballeros de la tabla: armaduras negras con un número grabado en el pecho. Ninguno se repite.

`salon_02` **Caballero de la tabla:** Cada uno de nosotros es único. Por eso no se puede borrar a ninguno.

`salon_2_01` — El comandante de la guardia real baja la visera.

`salon_2_02` **Comandante:** Hasta aquí llegan. Detrás de mí solo está el Rey.

> ⤷ continúa en `descanso3_01`


### fortaleza_galeria_retratos

`galeria_01` — La galería tiene retratos de todos los reyes de la Primavera. El último está tapado con una tela negra.

`galeria_02` **Rikka:** Ese era él. Antes.

`galeria_03` — Los caballeros de la tabla salen de detrás de los cuadros.

`galeria_2_01` — Al final de la galería, el comandante de la guardia real cuida la última puerta.

`galeria_2_02` **Comandante:** Nadie mira ese retrato. Ni siquiera él.

> ⤷ continúa en `descanso3_01`


### fortaleza_salon_guardia

`bad_guardia_01` — La guardia real no deja pasar a nadie. Tampoco a ellos.

`bad_guardia_02` **Voz:** > Escolta denegada. Solicitud archivada.


### PANTALLA:negro

`bad_guardia_03` — Escolta denegada

> **BAD END: Escolta denegada**

---

### fortaleza_descanso

`descanso3_01` — La última escalera. Arriba, una puerta enorme con la corona y la tabla.

`descanso3_02` **Rikka:** Si no salimos de esta…

`descanso3_03` **Jair:** Salimos. Tengo que ir a trabajar mañana. Bueno, hoy. En algún momento.

`descanso3_04` **Cami:** Ese es el peor discurso motivador que escuché en mi vida.

`descanso3_05` **Jair:** Es el único que tengo.

`descanso3_cofre` — Junto a la puerta del trono hay un altar de ofrendas para el Rey. Rikka dice que tomar una no es robar: es recuperar.


> **DECISIÓN**
- `descanso3_cofre#0` Elixit++ (1) ⟶ va a `descanso3_cofre_a` · mochila_revivir_plus +1
- `descanso3_cofre#1` Caramelo dulce (1) ⟶ va a `descanso3_cofre_b` · mochila_caramelo_dulce +1
- `descanso3_cofre#2` Galletas brownie (3) ⟶ va a `descanso3_cofre_c` · mochila_galleta_brownie +3

`descanso3_cofre_a` **Voz:** > Objeto obtenido: Elixit++ ×1. Va a la mochila.

> ⤷ continúa en `trono_01`

`descanso3_cofre_b` **Voz:** > Objeto obtenido: Caramelo dulce ×1. Va a la mochila.

> ⤷ continúa en `trono_01`

`descanso3_cofre_c` **Voz:** > Objeto obtenido: Galleta brownie ×3. Va a la mochila.


### sala_del_trono

> ♪ silencio
`trono_01` — La sala del trono es enorme y casi vacía. Al fondo, en un trono de metal y raíces de la Primavera, alguien los espera con un yelmo cerrado.

`trono_02` **Rey Malvado:** Llegaron solos. Me ahorran los guardias.

`trono_03` **Rey Malvado:** Tú. El que no está en ninguna tabla. Y tú, la de azul: la llave.

`trono_04` **Cami:** ¿La llave de qué?

`trono_05` **Rey Malvado:** Del NEXUS. THE NEXUS: todos los mundos que conocen, cosidos uno con otro. Las estaciones, el espacio, las islas. Son un solo lugar con muchas puertas.

`trono_06` **Rey Malvado:** Y tú abres las puertas, niña. Por eso te busqué. Por eso tuve que llevarme a tus padres.

`trono_07` **Rikka:** Tú eras el rey de la Primavera. Mi gente te quería. ¿Qué te pasó?

`trono_08` **Rey Malvado:** Me mejoraron, sacerdotisa. Alguien escribió encima de lo que yo era. Ahora veo más lejos que cualquier rey.

`trono_09` **Rey Malvado:** Y lo que veo es esto: con la llave y con él, puedo llegar adonde ninguna puerta llega. A su mundo.

`trono_10` — El yelmo gira hacia Jair. Por un segundo, Jair tiene la impresión absurda de que debajo hay alguien conocido.

`trono_11` **Jair:** No vas a llegar a ningún lado. Tenemos tu espada.

`trono_12` **Rey Malvado:** Tienen una espada. Veamos si saben usarla.

> ⤷ continúa en `delete_01`

`bad_rey_01` **Rey Malvado:** Ya lo sabía. No saben usarla.

`bad_rey_02` **Voz:** > Sesión finalizada por el administrador.


### PANTALLA:negro

`bad_rey_03` — Fin de la sesión

> **BAD END: Fin de la sesión**

---

### sala_del_trono

`delete_01` — El Rey se levanta una última vez y alza la espada de las estaciones sobre Cami y Rikka, que están en el piso, sin poder moverse.

`delete_02` **Rikka:** ¡Jair!

`delete_03` — No hay tiempo para pensar. Jair corre, salta con una agilidad que no tiene, y clava la espada en el pecho del Rey.


### PANTALLA:negro

`delete_04` **Voz:** > DELETE

`delete_05` **Voz:** > DELETE FROM

`delete_06` **Voz:** > DELETE FROM tabla_del_rey

`delete_07` **Voz:** > DELETE FROM tabla_del_rey;

`delete_08` — Jair mira la línea. Algo le falta. Lo sabe como se saben estas cosas: un segundo tarde.

`delete_09` **Jair:** El WHERE.

`delete_10` **Jair:** Me faltó el WHERE.

`delete_11` **Voz:** > Ejecutando sentencia. Registros afectados: todos.


### sala_del_trono

`delete_12` **Rey Malvado:** ¿Qué hiciste, ingeniero?

`delete_13` — El Rey se deshace desde los pies, en cuadros de colores, como una imagen que no terminó de cargar. Detrás de él, la sala. Detrás de la sala, la fortaleza. Detrás de la fortaleza, todo.

`delete_14` **Voz:** > Eliminando: Primavera. Invierno. Otoño. Verano. Federación. Resistencia. Islas. Espacio dimensional.

`delete_15` **Jair:** No, no, no. Ctrl+Z. ¡Ctrl+Z!

`delete_16` **Voz:** > Esta acción no se puede deshacer.


### vacio_blanco

> ◐ transición: blanco
`vacio_01` — Blanco. Ni piso, ni cielo, ni horizonte. Solo blanco, y tres personas paradas en él.

`vacio_02` **Cami:** ¿Seguimos… aquí?

`vacio_03` **Rikka:** Mi reino. Mis hermanas. La Primavera.

`vacio_04` — Rikka no llora. Mira el blanco como se mira un lugar donde hubo una casa.

`vacio_05` **Voz:** > Registros restantes: 3.

`vacio_06` **Jair:** Tres. Somos nosotros. Ustedes deberían haber… La tabla entera…

`vacio_07` **Cami:** No sé por qué seguimos. No me importa. ¿Cómo salimos de aquí?

`vacio_08` — Jair se acuerda de la Grieta. Del ruido que hizo cuando Cami estaba cerca. De cómo se abrió cuando él quiso irse.

`vacio_09` **Jair:** Tú abres las puertas. Lo dijo él.

`vacio_10` **Cami:** ¿Y tú qué eres? ¿El que gira la llave?

`vacio_11` **Jair:** Supongo. Dame la mano.

`vacio_12` — Ella se la da. Esta vez, Jair no espera que pase algo: decide que pase.

`vacio_13` **Voz:** > Llave: activada a voluntad. Paso: abierto. Destino: usuario.

`vacio_14` — Frente a ellos se abre una grieta. Del otro lado se ve un cuarto chico, una computadora encendida y una silla con alguien dormido.

`vacio_15` — Jair entiende que puede cruzar. Y entiende, también, que nadie le dijo que ellas pudieran hacerlo.


> **DECISIÓN**
- `vacio_15#0` Cruzar solo ⟶ va a `solo_01`
- `vacio_15#1` Cruzar con las dos ⟶ va a `despertar_01`

`solo_01` **Jair:** Lo siento.

`solo_02` — No espera respuesta. Cruza. Detrás, la grieta se cierra sobre dos caras que no alcanza a mirar.


### departamento_manana

> ◐ transición: blanco
`solo_03` — Jair despierta frente a la computadora. Le duele el cuello. El cuarto huele a encierro.


### pc_genesis_restaurar

`solo_04` **Voz:** > GENESIS: se detectó la eliminación de todos los registros. Se puede restaurar.

`solo_05` **Voz:** > Completa: 8 exabytes. Tiempo estimado: 8.112 años. Compactada: 5 petabytes. Tiempo estimado: 6 meses.

`solo_06` — Hay tres botones: «Completa», «Compactada» y «Cancelar».

`solo_07` — Jair mueve el mouse. El cursor se queda un rato encima de «Compactada».

`solo_08` — Hace clic en «Cancelar».


### departamento_manana

`solo_09` — Se ducha. Se viste. Llega tarde al trabajo y nadie le pregunta nada. Esa noche no se queda despierto. La siguiente, tampoco.


### PANTALLA:negro

`solo_10` — Cancelar

> **FIN: Cancelar**

---

### vacio_blanco

`despertar_01` **Jair:** Vamos. Las dos.

`despertar_02` **Rikka:** ¿Adónde?

`despertar_03` **Jair:** A mi casa. Les advierto que es chica.


### departamento_manana

> ◐ transición: blanco
> ♪ silencio
`despertar_04` — Jair despierta frente a la computadora, con la cara pegada al teclado. Tiene la marca de las teclas en la mejilla.

`despertar_05` **Jair:** ¿Me quedé dormido? Qué sueño más largo.

`despertar_06` — La pantalla está en negro. En la mesa, el celular vibra.

`despertar_07` — Son las 9:36. Entraba a las nueve.

`despertar_08` **Jair:** No. No, no, no. Tarde otra vez.

`despertar_09` **Voz:** > GENESIS: migración completada. 2 entidades movidas a la tabla «jair».

`despertar_10` **Jair:** ¿Migración de qué?

`despertar_11` — Detrás de él, alguien respira. Y alguien más contesta, en voz baja, algo sobre el olor del cuarto.

`despertar_12` — Jair se da vuelta despacio.

`despertar_13` — Cami y Rikka están en su cuarto.

`despertar_14` **Cami:** Así que esta es tu casa. Qué lindo: un dios con el cuarto desordenado.

> **FIN DEL CAPÍTULO 3** (no es un final: sigue en el capítulo siguiente)

---
