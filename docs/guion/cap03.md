<!-- guion:cap03.json -->
# Capítulo 3 — Sin DÓNDE ir

> **Estado:** borrador. Borrador del Capítulo 3 escrito por Claude con las decisiones del autor del 5 de noviembre de 2026 (docs/guion/cap03_plan.md): la fortaleza del Rey piso por piso, la espada que se recupera en el arsenal, el Rey con yelmo, THE NEXUS dicho por el Rey, el DELETE sin WHERE que se escribe solo, alt_1 y el despertar. Peleas y enemigos de relleno: el autor va a crear los suyos. No es canon hasta que el autor lo apruebe.
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
- `escaleras_09#0` Seguir por la escalera ⟶ va a `cuarteles_01`
- `escaleras_09#1` Tomar el montacargas ⟶ va a `montacargas_01`

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

> ⤷ continúa en `biblioteca_01`

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

> ⤷ continúa en `arsenal_01`

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

`gigante_01` — El Rey cae de rodillas. Y en vez de rendirse, crece.

`gigante_02` — El yelmo toca el techo. Las paredes de la sala se corren para hacerle lugar, como si la fortaleza entera fuera parte de su cuerpo.

`gigante_03` **Voz:** > Advertencia: entidad excede los límites del mapa.

`gigante_04` **Cami:** Esto no es justo. Esto no es nada justo.

> ⤷ continúa en `delete_01`

`bad_rey_01` **Rey Malvado:** Ya lo sabía. No saben usarla.

`bad_rey_02` **Voz:** > Sesión finalizada por el administrador.


### PANTALLA:negro

`bad_rey_03` — Fin de la sesión

> **BAD END: Fin de la sesión**

---

### sala_del_trono

`delete_01` — El Rey gigante levanta una mano del tamaño de una casa. Debajo están Cami y Rikka, en el piso, sin poder moverse.

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
