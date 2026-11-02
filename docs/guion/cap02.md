<!-- guion:cap02.json -->
# Capítulo 2 — El viaje del héroe

> **Estado:** borrador. Inicio del capítulo escrito por Claude a partir del plan del autor (docs/guion/cap02_plan.md). Todavía no está enlazado al final del Capítulo 1: para probarlo, abrir el juego con ?escena=cap02_001. No es canon hasta que el autor lo apruebe.
>
> **Cómo editar:** cambia el hablante (entre `**...:**`) o el texto de cualquier línea, o el texto de una opción.
> No borres ni cambies los códigos entre comillas invertidas (`063`): así se sabe a qué escena corresponde cada línea.
> Narración: líneas que empiezan con «—». Las líneas que empiezan con «>» son notas y no se importan.
> Al terminar, corre `npm run guion:importar` y después `npm run test:routes`.
> Para agregar, quitar o reordenar escenas, pídemelo: la importación solo cambia textos.


### fondos/puente_rojo.webp

> ♪ música: serene
`001` — Rikka le cura el tobillo a Cami en el refugio con un ungüento que huele a flores y a algo que mejor no preguntar.

`002` **Cami:** Arde.

`003` **Rikka:** Es para que aprendas a caer mejor.

`004` **Cami:** Caí desde otra dimensión.

`005` **Rikka:** Por eso. Hay que aprender.

`006` — Una hora después, Cami camina. Cojea un poco, pero camina sola, y se encarga de que Jair lo note: le pasa por delante dos veces sin necesidad.

`007` **Jair:** (Recuperó el tobillo y yo perdí el trabajo de mochila. Es la primera vez que me despiden de algo y me alivia.)

`008` **Rikka:** Vengan. Mi casa está al otro lado del bosque. La ciudadela de la Primavera.

`009` **Jair:** ¿Ciudadela?

`010` **Rikka:** Es una ciudad con murallas, pero más elegante. Como yo.

`011` **Cami:** Una ciudad con murallas y una guardiana que se pasa el día mirando un arroyo.

`012` **Rikka:** Lo miro con mucha concentración.


### fondos/sendero_primavera.webp

`012b01` — El camino a la ciudadela sube entre cerezos. Rikka va adelante, con la espalda recta y la mano cerca de la espada. Cami cojea atrás, a propósito, a la misma distancia de los dos.

`012b02` **Rikka:** ¿Y de dónde vienen? De verdad. «De arriba» no es un lugar.

`012b03` **Cami:** Yo, de la dimensión espacial. Él no sé de dónde salió. Se cayó conmigo.

`012b04` **Jair:** Vengo de… una ciudad. Bastante lejos. Con wifi.

`012b05` **Rikka:** ¿Qué es wifi?

`012b06` **Jair:** Es como el aire, pero se cae justo cuando más lo necesitas.

`012b07` **Rikka:** Qué lugar más cruel.

`012b08` — Rikka baja el paso hasta quedar al lado de Jair. Un poco demasiado al lado. Cami lo nota. Cami nota todo.

`012b09` **Rikka:** ¿Y allá tienen dinero? ¿Cuánto cuesta un pan? ¿Cobran por caminar por la calle?

`012b10` **Jair:** Cobran por casi todo. Caminar todavía es gratis. Por ahora.

`012b11` **Rikka:** «Por ahora».

`012b12` — Lo repite como quien anota una amenaza en una libreta.

`012b13` **Cami:** Pregúntale cuánto le deben de sueldo. Es su tema favorito.

`012b14` **Jair:** No es mi tema favorito. Es mi único tema.

`012b15` — El sendero se angosta. Hay espacio para dos personas, una al lado de la otra. No para tres.


> **DECISIÓN**
- `012b15#0` Caminar junto a Rikka ⟶ va a `012c01` · confianza_rikka +1
- `012b15#1` Quedarse atrás con Cami ⟶ va a `012d01`
- `012b15#2` Caminar en medio de las dos ⟶ va a `012e01`

`012c01` **Rikka:** …Puedes caminar a mi lado. Pero no mires la espada. Es de mala educación.

`012c02` **Jair:** No iba a mirar la espada.

`012c03` **Rikka:** Todos miran la espada.

`012c04` **Cami:** Yo miro el camino. Alguien tiene que hacerlo.

> ⤷ continúa en `013`

`012d01` **Cami:** No necesito niñera.

`012d02` **Jair:** No soy niñera. Soy un acompañante sin pistola.

`012d03` **Cami:** …Camina a mi ritmo. Y no me agarres el brazo, a menos que me caiga.

`012d04` — Adelante, Rikka mira hacia atrás una vez. Solo una. Y aprieta el paso.

> ⤷ continúa en `013`

`012e01` — Jair intenta caminar en medio de las dos. Hay espacio para dos. Termina con una rama de cerezo en la cara.

`012e02` **Cami:** Idiota.

`012e03` **Rikka:** Idiota.

`012e04` — Lo dicen al mismo tiempo. Se miran. A ninguna de las dos le gusta haber estado de acuerdo con la otra.


### ciudadela_primavera

`013` — La ciudadela aparece de golpe, como si el bosque se hubiera apartado para presentarla: murallas blancas, techos curvos, faroles de papel y cerezos en flor en cada esquina. Huele a té, a madera y a pan dulce.

`014` — La gente saluda a Rikka con reverencias. Ella responde a cada una con una inclinación exacta, ni un grado más ni uno menos.

`015` **Jair:** (Saluda como una noble. Y hace un rato me preguntó si le iba a cobrar por hablar con ella.)


### ciudadela_mercado

`015m01` — La calle principal es un mercado: puestos de dulces de arroz, telas, linternas de papel, peces de colores en cubetas. Un vendedor le pone a Jair un palito con tres bolitas rosadas en la mano.

`015m02` **Vendedor:** ¡Para el forastero! Dulce de primavera. Recién hecho.

`015m03` **Jair:** Gracias. ¿Cuánto…?

`015m04` **Rikka:** ¡No! No preguntes cuánto. Si preguntas cuánto, cobran.

`015m05` **Vendedor:** Para los amigos de la guardiana es gratis.

`015m06` **Rikka:** …¿Gratis?

`015m07` — Rikka mira el dulce como si fuera una trampa. Después mira al vendedor. Después agarra uno para ella, por si acaso.

`015m08` **Cami:** Gratis es mi precio favorito.

`015m09` — Cami ya se comió el suyo. Nadie la vio agarrarlo.

`015m10` **Jair:** (En mi mundo nadie regala nada. Aquí me dan dulces por caminar al lado de alguien importante. Así debe sentirse tener contactos.)

`016` **???:** ¡RIKKAAA!


### ciudadela_primavera

`017` — Dos niños bajan corriendo por la calle. Un chico con una espada de madera más larga que él y una niña con una canasta llena de flores, la mitad aplastadas.

`018` **Rikka:** Mike. Nora. ¿Qué les dije de correr por la calle principal?

`019` **Mike:** ¡Que si corremos, que sea rápido!

`020` **Nora:** Te trajimos flores. Bueno, eran flores. Mike se cayó encima.

`021` **Mike:** ¡Fue una maniobra!

`022` — Rikka se agacha y recibe las flores aplastadas como si fueran un tesoro. Por un segundo, la guardiana del puente desaparece y queda otra cosa: alguien que se acuerda de ser tierna.

`023` **Jair:** (Esto no lo escribí yo.)

`024` **Jair:** (...¿O sí?)

`025` **Nora:** ¿Y él quién es? ¿Es tu novio?

`026` **Rikka:** ¡N-no! Es... un viajero.

`027` **Mike:** ¿Y la rubia? ¿Es la novia del viajero?

`028` **Cami:** Soy su escolta. Él es mi carga.

`029` **Mike:** Todo el pueblo dice que algo cayó del cielo. ¿Fueron ustedes? ¿Se cayeron del cielo?


> **DECISIÓN**
- `029#0` «Sí. Soy un dios.» ⟶ va a `029a`
- `029#1` «No, vinimos caminando.» ⟶ va a `029b`
- `029#2` «Es complicado.» ⟶ va a `029c`

`029a` **Jair:** Sí. Del cielo. Soy un dios.

`029a2` **Mike:** ¡Mentira!

`029a3` **Nora:** Los dioses no tienen ojeras.

`029a4` **Jair:** (Ni los niños me creen. Y esta vez era verdad.)

> ⤷ continúa en `030`

`029b` **Jair:** No, no. Vinimos caminando. Como la gente normal.

`029b2` **Nora:** Tienes pasto en el pelo. Y una hoja en la oreja.

`029b3` **Mike:** Y hay un agujero con tu forma en el bosque. Lo vimos.

`029b4` **Jair:** (Me ganó una investigación de dos niños. Sin presupuesto.)

> ⤷ continúa en `030`

`029c` **Jair:** Es complicado.

`029c2` **Mike:** Eso dicen los grandes cuando no saben.

`029c3` **Jair:** (Es un niño y ya entendió cómo funciona la ingeniería de software.)

`030` — Rikka los lleva por la calle principal. Los niños se les pegan a los talones como dos perros que acaban de adoptar a un forastero.

`031` **Rikka:** Hace años esto no era así. Las calles estaban vacías. Las ventanas, cerradas con tablas.

`032` **Jair:** ¿Qué pasó?

`033` **Rikka:** Una heralda del Rey Malvado. Tzai. Ocupó la ciudadela durante mucho tiempo. Cobraba tributo por todo: por el agua, por el pan. Por mirar el cielo.

`034` **Rikka:** La derrotamos. Yo y... un grupo. Gente que ya no está aquí. Cada una siguió su camino.

`035` **Rikka:** Desde entonces cuido el puente de la entrada. Nadie entra a la ciudadela sin que yo lo vea.

`036` **Cami:** ¿Desde cuándo?

`037` **Rikka:** ...No me acuerdo. Mucho. Dejé de contar los inviernos cuando empezaron a parecerse.

`038` **Rikka:** El Rey Malvado todavía quiere estas tierras. Siempre las quiso. Pero el Rey Primavera no se lo ha permitido. Gracias a él, los cuatro reinos están en paz.

`039` **Rikka:** Yo me acuerdo de cuando no lo estaban. Me acuerdo de las guerras.

`040` **Cami:** Te acuerdas de muchas cosas. ¿Cuántos años tienes?

`041` **Rikka:** Esa es una pregunta muy grosera.

`042` **Jair:** Más de quinientos, ¿verdad?

`043` — Lo dice sin pensar. Como quien completa una línea de código que ya escribió mil veces.

`044` **Voz:** Dato recuperado: «guardiana, más de quinientos años». Origen: un archivo del usuario. Sin terminar.

`044b` — Y debajo de la Voz, más bajito, algo más. Jair no lo alcanza a oír: Rikka ya está hablando.

`044c` **Voz:** Acceso del usuario. Entidad 01: llave activada. Paso abierto.

`044d` — Cami se lleva una mano al pecho, como si algo le hubiera dado un tirón por dentro. Frunce el ceño. No dice nada.

`045` **Rikka:** ...Más o menos. Se podría decir que sí. Creo que sí.

`046` **Rikka:** ¿Cómo sabes eso?

`047` **Cami:** ¿Quinientos?

`048` **Jair:** (Porque lo escribí yo. Hace años, en un borrador que nunca terminé: una heroína que peleó en una guerra dentro de su propio universo. Quinientos años de guardia. Me pareció un número épico.)

`049` **Jair:** (No puedo decir eso. «Hola, te inventé un martes a las dos de la mañana».)

`050` **Jair:** Lo... leí por ahí.

`051` **Rikka:** ¿Dónde?

`052` **Jair:** En un libro. De historia. De aquí. Muy famoso. Tú eres muy famosa.

`053` **Rikka:** ...Bueno. Eso es cierto.

`054` — Rikka sigue caminando, satisfecha. Cami no. Cami lo mira con los ojos entrecerrados, como quien encuentra un error en un informe y decide no reportarlo todavía.

`055` **Cami:** (Susurrando) Tú no lees libros de historia.

`056` **Jair:** Leo muchas cosas.

`057` **Cami:** Hace dos horas no sabías ni en qué dimensión estabas.


### ciudadela_muralla

`057w01` — Rikka los lleva por una escalera de piedra hasta lo alto de la muralla. Desde ahí se ve todo: los techos curvos, el río, el bosque. Y a lo lejos, pequeño y rojo, su puente.

`057w02` **Rikka:** Desde aquí lo cuido cuando no estoy en él. Es más difícil, pero se puede.

`057w03` **Jair:** ¿Nunca te tomas vacaciones?

`057w04` **Rikka:** ¿Vacaciones?

`057w05` **Jair:** Días en los que no trabajas. Y te pagan igual.

`057w06` **Rikka:** Eso no existe.

`057w07` **Jair:** En mi mundo tampoco, mucho. Pero dicen que existe.

`057w08` — Cami no mira la ciudad. Mira el bosque, hacia el puente.

`057w09` **Cami:** Algo no está bien. Hay demasiado silencio allá abajo.

`057w10` **Rikka:** El bosque siempre está en silencio. Es lo que tiene ser antiguo.

`057w11` — Cami se lleva la mano al pecho otra vez, sin darse cuenta. Bajan de la muralla justo a tiempo para oírlo.


### ciudadela_primavera

> ♪ música: sad_suspense
`058` — Entonces la ciudadela se queda callada. No de golpe: por partes. Primero los pájaros. Después los vendedores. Después los niños.

`059` — Por la calle principal entran soldados de negro. Cascos lisos, sin cara. Los mismos del castillo. Marchan sin prisa, como si la calle ya fuera suya.

`060` **Cami:** No.

`061` **Rikka:** ¿Soldados de la Federación? ¿Aquí? Es imposible. Nadie de otra dimensión llega tan fácil hasta la ciudadela. Nadie.

`062` **Rikka:** ...Nadie, cuando yo estoy en el puente.

`063` **Jair:** (Y no estaba en el puente. Estaba con nosotros.)

`064` **Soldado enmascarado:** Buscamos a una fugitiva de la dimensión espacial. Rubia. Traje azul. Peligrosa. Sabemos que está aquí.

`065` **Rikka:** Mike. Nora. A casa. Ahora.

`066` **Mike:** Pero...

`067` **Rikka:** Ahora.

`068` — Los niños corren. Esta vez nadie les dice que lo hagan rápido.

`069` **Cami:** Vienen por mí. Ustedes no tienen nada que ver.

`070` **Jair:** Tenemos que salir de aquí.

`071` **Rikka:** Por el mercado. Conozco un camino por los techos. Síganme y no pregunten.


### ciudadela_tejados

> ♪ música: adventure1
`072` — Rikka salta a un toldo, del toldo a una cornisa y de la cornisa a un tejado, sin despeinarse. Cami la sigue, cojeando y maldiciendo. Jair las sigue a las dos, sin dignidad.

`073` **Jair:** (No hago ejercicio desde la secundaria. Ahora salto tejados. Mi doctor estaría orgulloso. Si tuviera doctor.)

`074` **Rikka:** No pises las tejas rojas. Son de la casa del herrero y me odia.

`075` **Jair:** ¿Por qué te odia?

`076` **Rikka:** Porque siempre piso sus tejas rojas.

`076t01` — Entre dos tejados hay un hueco. No es grande. Para Rikka es un paso. Para Cami, un salto en un pie. Para Jair, un abismo.

`076t02` **Jair:** ¿No hay otro camino?

`076t03` **Rikka:** Sí. Por abajo, entre los soldados.

`076t04` — Jair salta. Llega con una pierna; la otra se queda en el aire. Rikka lo agarra del cuello de la camisa y lo sube de un tirón, sin esfuerzo, como quien levanta una bolsa del mercado.

`076t05` **Rikka:** Pesas menos de lo que pareces.

`076t06` **Jair:** Gracias. Creo.

`076t07` **Cami:** Yo lo sostuve con un tobillo roto. Que conste.

`076t08` **Rikka:** Nadie te preguntó.

`076t09` **Jair:** (Me salvaron dos veces en un día. Ninguna de las dos me dejó olvidarlo.)


### almacen_te

> ♪ música: sad_suspense
`077` — Terminan escondidos en un almacén de té pegado a la muralla. Huele a hojas secas y a polvo. Afuera, las botas siguen marchando.

`078` **Rikka:** Bueno. Ahora sí pregunto. ¿Por qué la Federación cruzaría una dimensión entera por ti?

`079` **Cami:** Porque soy un problema. Y porque mi misión es derrotar al Rey Malvado.

`080` **Rikka:** ¿Derrotar al Rey Malvado? ¿Tú? ¿Con un tobillo recién curado y una pistola?

`081` **Cami:** Y con él.

`082` **Jair:** ¿Yo?

`083` **Rikka:** Es una idea suicida.

`084` **Cami:** Nadie te pidió permiso.

`085` **Rikka:** Nadie me pide permiso nunca. Por eso sigo viva.

`086` — Las dos se miran. Jair conoce esa mirada: la vio en mil reuniones de proyecto, justo antes de que alguien dijera «mejor lo hablamos por separado».

`087` **Jair:** Cami tiene sus motivos.

`088` **Jair:** No los sé todos. Creo que ni ella los sabe todos. Pero los tiene. Y yo la voy a apoyar.

`089` — Lo dice y se sorprende de decirlo. No tartamudea. No se justifica. Por una vez, no busca la salida de emergencia.

`090` **Jair:** (¿Quién dijo eso? ¿Fui yo? Afuera no apoyo ni mis propias ideas.)

`091` **Cami:** ...No necesito que me apoyes.

`092` **Jair:** Ya sé. Igual.

`093` — Rikka no dice nada. Lo mira. Al chico de ojeras, sin espada, sin armadura y sin dinero, que acaba de ofrecerse para una guerra que no es suya como quien se ofrece a cargar las bolsas del mercado.

`094` **Rikka:** (Hay una profecía. La leí hace siglos, en los archivos del palacio.)

`095` **Rikka:** (Un salvador que destruiría al Rey Malvado y se convertiría en el nuevo rey soberano. Que no pertenecería a ninguna dimensión. Que vendría de un lugar más allá de esta existencia.)

`096` **Rikka:** (Siempre creí que era un mito. Un cuento para que los niños durmieran tranquilos.)

`097` **Rikka:** (Pero cayó del cielo. Sabe mi edad. Y no tiene miedo de la manera correcta.)

`098` — Algo le late a Rikka en el pecho. Algo que no es la guardiana. Lo aplasta enseguida, con la eficiencia de quien lleva siglos aplastando cosas.

`099` **Rikka:** Yo perdí mucho por culpa del Rey Malvado. Hace años. Aprendí a vivir con eso.

`100` **Rikka:** Y por eso te lo digo: son tres. Tres. No le harían ni cosquillas a su ejército.

`101` **Jair:** Técnicamente somos dos y medio. Yo cuento como medio.

`102` **Cami:** Como un cuarto.

`103` **Rikka:** ...¿Y quién dijo que yo era la tercera?

`104` — Afuera, algo cambia. Un cuerno, largo y grave, cruza la ciudadela.

`105` **Rikka:** Los caballeros estacionales.


### ciudadela_primavera

> ♪ música: adventure1
`106` — Por la ventana del almacén se ve la calle principal. Un grupo de jinetes con armaduras de cuatro colores, rosa, verde, ocre y blanco, les corta el paso a los soldados de negro.

`107` **Caballero estacional:** ¿Con qué permiso entran seres de otra dimensión a la ciudadela de la Primavera? ¿Quién les abrió las puertas de este reino?

`108` **Soldado enmascarado:** Buscamos a una fugitiva. No es asunto del reino.

`109` **Caballero estacional:** Todo lo que pisa este suelo es asunto del reino.

`110` **Soldado enmascarado:** La fugitiva. Entréguenla y nos vamos.

`111` — Los caballeros no se mueven. Los soldados tampoco. Es el tipo de silencio que siempre termina igual.


### almacen_te

`112` **Rikka:** No van a aguantar mucho. Vamos, ahora que están ocupados.


### fondos/sendero_primavera.webp

> ♪ música: serene
`113` — Rikka los saca por una puerta de servicio, entre huertos, y los deja en un sendero que baja hacia el bosque.

`114` **Rikka:** Desde aquí siguen solos. El sendero baja hacia el bosque y se aleja de la ciudadela.

`115` **Jair:** ¿No vienes?

`116` **Rikka:** Los ayudé a escapar. No dije que los iba a ayudar con su idea loca de derrotar a un rey.

`117` **Rikka:** Tengo un puente que cuidar. Y dos niños que no saben correr despacio.

`118` **Cami:** Nadie te lo pidió.

`119` **Rikka:** Lo sé. Lo noté.

`120` — Pero no se va. Se queda en la puerta, mirándolos bajar, más tiempo del que haría falta.

`120s01` — Bajan el sendero sin hablar. Detrás, la ciudadela se hace pequeña. Cami ya casi no cojea. Igual se apoya en el hombro de Jair cuando el camino se pone feo. Solo cuando se pone feo.

`120s02` **Cami:** Lo de los quinientos años.

`120s03` **Jair:** Lo leí en un libro.

`120s04` **Cami:** No mientas. Mientes mal. Se te mueve la oreja.

`120s05` **Jair:** …¿En serio?

`120s06` **Cami:** No. Pero te la tocaste.

`120s07` **Cami:** No sé qué eres. Pero cuando dijiste ese número sentí algo. Aquí. Como una puerta que alguien abre del otro lado.

`120s08` **Jair:** (¿Una puerta?)

`120s09` — En el fondo de su cabeza algo zumba bajito, como un ventilador que nadie apagó.

`120s10` **Cami:** Olvídalo. Camina.


### sala_rey_malvado

> ◐ transición: negro
> ♪ música: sad_suspense
`121` — Lejos de ahí, en una sala sin ventanas, la oscuridad tiene forma de trono.

`122` — Sobre un estanque negro se mueve una imagen: tres figuras pequeñas en un sendero. Una rubia que cojea. Una peliverde en una puerta. Y entre las dos, un chico sin espada.

`123` — Lo que Rikka no sabe: los cuatro reyes estacionales, también el Rey Primavera, al que tanto agradece, hace mucho que están a merced de alguien.

`124` **???:** Rikka. Tan leal. Tan segura de que la paz se la debe a su rey.

`125` **???:** La paz es mía. Yo la presto. Y cobro intereses.

`126` — Los soldados no persiguen a esos dos porque alguien crea que pueden derrotarlo. Nadie que los haya visto pelear lo cree.

`127` **???:** Los busco porque uno de ellos es un puente. Un puente entre esta realidad y otra.

`127b` **???:** Una llave entre universos. Y alguien la volvió a girar. Mis soldados cruzaron por esa puerta.

`127c` **???:** ¿Fue ella? ¿Fue él? El estanque no distingue. Los dos estaban ahí cuando se abrió.

`127d` **???:** No importa. Si tengo a los dos, tengo el puente.

`128` **???:** Con el puente, este mundo podría tocar el otro. Lo que existe aquí podría existir allá.

`129` **???:** Ya se abrió dos veces sin querer. Lo que necesito es que se abra queriendo. Y para eso necesito al que da las órdenes.

`130` — La imagen del estanque se acerca al chico. A sus ojeras. A sus manos vacías.

`131` **???:** El creador de esta realidad.

`132` **???:** Lo esperé más de un milenio. Muchas civilizaciones lo adoraron como a un dios. Lo llamaban el Gran Ingeniero.

`133` **???:** Yo siempre dudé de ese dios.

`134` — En el estanque, el chico se tropieza con una raíz y casi se cae. La rubia lo agarra del cuello de la camisa sin mirarlo.

`135` **???:** ...Y ahora que lo veo, sigo dudando de él.


### campamento_noche

> ◐ transición: negro
> ♪ música: serene
`136` — Esa noche acampan al borde del bosque, lejos del camino. Jair intenta prender un fuego durante veinte minutos. Cami lo prende en dos, con un disparo de la pistola en modo mínimo.

`137` **Jair:** (Tengo una carrera universitaria y me ganó una pistola.)

`138` — Entonces se oyen pasos entre los árboles. Rápidos. Cami ya tiene la pistola en la mano antes de que Jair termine de asustarse.

`139` — Es Rikka. Sin aire, con el pelo revuelto y la espada encendida, todavía zumbando.

`140` **Rikka:** Volvieron. Los soldados. Cuando ustedes se fueron, volvieron por mí.

`141` **Rikka:** Alguien les dijo que la guardiana del puente ayudó a escapar a la fugitiva. Ahora dicen que soy cómplice. Que tengo que responder ante el rey.

`142` **Jair:** ¿Y Mike y Nora?

`143` **Rikka:** Escondidos. A salvo. Los caballeros me dieron tiempo para salir por la muralla. No mucho más.

`144` **Cami:** Te dije que te íbamos a meter en problemas.

`145` **Rikka:** No. Tú me dijiste «nadie te lo pidió». Es distinto.

`146` — Rikka apaga la espada y se sienta junto al fuego, del lado opuesto a Cami. Mira las llamas un rato largo, como quien mira una casa que se queda atrás.

`147` **Rikka:** No debí juntarme con ustedes.

`148` **Rikka:** Pero ya está. Si de verdad quieren vencer al Rey Malvado, no les basta con una pistola y un chico que tropieza con las raíces.

`149` **Rikka:** Necesitan la espada DELETE.

`150` **Jair:** …¿Cómo se llama?

`151` **Rikka:** DELETE. Nadie sabe qué significa. Es una palabra de una lengua que ya nadie habla. La leyenda dice que es la única capaz de eliminar al Rey Malvado: no de matarlo, de borrarlo. De todas las dimensiones a la vez.

`152` **Jair:** (DELETE. Como en SQL. «DELETE FROM». Borrar registros de una tabla.)

`153` **Jair:** (La última vez que usé un DELETE fue en mis prácticas. Lo corrí sin el WHERE. Borré la tabla de clientes completa. Un viernes a las seis de la tarde.)

`154` **Jair:** (Me sacaron de ahí el lunes. Muy amables. Me dieron una caja para mis cosas. Mis cosas eran una taza.)

`155` **Cami:** Yo también escuché esa historia. En mi dimensión. Los viejos de la Resistencia hablaban de una espada que borraba. Decían que se perdió en algún lugar entre los mundos.

`156` **Cami:** O que la tiene el propio Rey. Quién sabe.

`157` — Jair se queda mirando el fuego. Algo le pica detrás de los ojos. Un recuerdo que no es suyo. O que es demasiado suyo.

`158` **Jair:** (Una torre. Escribí una torre. Hace años, en otro borrador que nunca terminé. Una torre gigante, en un lugar donde se cruzaban varios mundos. Y arriba de todo, una espada.)

`159` **Jair:** La torre del Oráculo.

`160` **Cami:** La torre del Oráculo es un mito. Igual que la espada.

`161` **Jair:** Sé dónde está. En un lugar donde se tocan varias dimensiones. Una es de agua. Otra es un desierto. Y otra es una isla de cristal, o algo así.

`162` **Cami:** ¿«O algo así»?

`163` **Jair:** No me acuerdo de todo. Fue un borr… un libro. Un libro muy viejo.

`164` **Cami:** (Susurrando) Otro libro de historia.

`165` **Rikka:** Si quieren ir a otra dimensión, primero tienen que salir de esta. Y para eso, por suerte, me tienen a mí.

`166` **Rikka:** Vamos a la torre estacionaria. Es el punto medio de este reino: desde arriba se ven los cuatro reinos estacionales. Está prohibido subir.

`167` **Rikka:** Pero soy sacerdotisa de la Primavera. Tengo privilegios. Me abren puertas que a ustedes les cerrarían en la cara.

`168` **Jair:** ¿Sacerdotisa? ¿No eras guardiana del puente?

`169` **Rikka:** Se puede ser dos cosas. Tú eres un hombre sin sueldo y un viajero que cae del cielo.

`170` **Rikka:** El problema es que la torre no basta. Para cruzar a otra dimensión hace falta un puente. Un ser puente.

`171` **Jair:** ¿Qué es eso?

`172` **Rikka:** Alguien que permite viajar entre dimensiones. Dicen que es un ser extremadamente poderoso. Y es lo que el Rey Malvado más desea tener.

`173` — Cami se lleva la mano al pecho. Jair se da cuenta. Ella baja la mano rápido, como si la hubieran pillado robando.

`174` **Jair:** Entonces soy yo.

`175` **Rikka:** ¿Tú?

`176` **Jair:** Yo entré aquí. Desde otro mundo. Si eso no es cruzar entre dimensiones, no sé qué es. Soy la prueba viviente. Bueno, la prueba con ojeras.

`177` **Rikka:** Si eso es cierto, estaríamos llevándole al Rey Malvado su tesoro más preciado. Servido en bandeja. Con un lazo.

`178` **Rikka:** Pero… según las leyendas, también es el que va a librarnos de él.

`179` — Lo mira con algo que no es la guardiana ni la sacerdotisa. Algo más chico y más peligroso. Lo apaga enseguida.

`180` **Cami:** Entonces vamos a la torre. Antes de que ese rey decida venir a buscarnos él mismo.

`181` **Rikka:** Son varios días de camino. Duerman. Yo hago la primera guardia.

`182` **Cami:** Yo hago la primera guardia.

`183` — Las dos se quedan despiertas toda la noche, cada una de un lado del fuego, sin hablarse. Jair duerme como un bebé. Es lo más descansado que va a estar en toda la semana.


### camino_estaciones

> ◐ transición: negro
> ♪ música: adventure1
`p2_001` — Los días siguientes son camino. Mucho camino. Del bosque de la primavera hacia el otoño, por senderos que Rikka conoce y que no aparecen en ningún mapa. Los cerezos se van volviendo robles, y los robles, rojos.

`p2_002` — Cruzan un río ayudando a un barquero a recuperar su balsa. Le cambian a un granjero tres cestos de leña por pan y queso. Se esconden dos veces de patrullas de negro.

`p2_003` **Jair:** (Misiones secundarias. Estoy haciendo misiones secundarias. Por pan.)

`p2_004` — En un descanso, Rikka se queda mirando el atardecer desde una piedra, con el pelo suelto. Jair saca el celular para ver la hora, aunque la hora aquí no sirve de nada.

`p2_005` — Nueve por ciento de batería. Sin señal. Pero la cámara funciona.

`p2_006` — Le saca una foto a Rikka. No se da cuenta. Nadie se da cuenta. Jair guarda el celular rápido, con la cara caliente, como si hubiera robado algo.

`p2_007` **Jair:** (Es para… documentar el viaje. Es un registro. Es ingeniería.)

`p2_008` **Rikka:** Llevamos días sin bañarnos. Ya basta. Más adelante hay aguas termales. Las conozco.

`p2_009` **Cami:** Por fin dices algo útil.


### aguas_termales

> ♪ música: serene
`p2_010` — Las aguas termales están escondidas entre rocas, con vapor que sube como si el suelo respirara. Rikka y Cami se meten de un lado de una roca grande. A Jair le toca el otro lado. Solo.

`p2_011` **Jair:** (Una roca. Me separa de dos mujeres desnudas una roca. Me han separado de cosas con menos. Mi cuenta de ahorro, por ejemplo.)

`p2_012` — Del otro lado se oyen chapoteos, una discusión sobre quién ocupa más espacio y, por un rato largo, algo que suena casi a risas. Las dos. Juntas. Jair no se lo cree.

`p2_013` **Rikka:** (Del otro lado de la roca) ¡Jair! ¿Tú escribiste… digo, leíste algo sobre aguas termales en tu libro?

`p2_014` **Jair:** No. Juro que no.

`p2_015` **Cami:** (Del otro lado de la roca) Miente. Se le mueve la oreja.

`p2_016` **Jair:** ¡Tú no puedes verme la oreja!

`p2_017` — Un rato después, Rikka sale del agua envuelta en una toalla. Va a buscar su ropa a la roca donde la dejó.

`p2_018` — La ropa no está.

`p2_019` **Rikka:** …¿Dónde está mi kimono?

`p2_020` **Rikka:** ¡Mi kimono! ¡Mis prendas! ¡Alguien se robó las prendas de la sacerdotisa!

`p2_021` **Cami:** ¿Y qué tienen de especial? Es un kimono.

`p2_022` **Rikka:** ¡Son prendas encantadas! Resisten el frío, el calor, el fuego, los cortes. Se tejen una vez cada cien años. No puedo perderlas. No puedo.

`p2_023` **Jair:** (Del otro lado de la roca) ¿Están las dos… vestidas? ¿Puedo mirar?

`p2_024` **Cami:** ¡No!

`p2_025` **Rikka:** ¡No!

`p2_026` — Cami saca de su mochila un traje igual al suyo: ajustado, de piloto, de una tela que no es tela. Toca un panel en la muñeca y el azul se vuelve rojo.

`p2_027` **Cami:** Ponte esto. Al menos combina con tu mal carácter.

> ⤷ si juego_completo == true → `p2_s01` · si no → `p2_028`

`p2_s01` — Rikka se lleva el traje detrás de una roca. El vapor de las termas es tan espeso que apenas se ve su silueta. Por ahora.

`p2_s02` **Rikka:** Cami tiene que estar loca si piensa que me voy a meter en esta cosa…

`p2_s03` — Se suelta la toalla. El vapor se abre un poco, como si también quisiera mirar.

`p2_s04` **Rikka:** Nadie puede ver esto. Nadie. Una sacerdotisa no se cambia al aire libre como una… como una Cami.

`p2_s05` — Algo cruje entre los arbustos. Una ráfaga de viento se lleva el vapor de golpe, justo cuando Rikka levanta la vista.

`p2_s06` **Rikka:** ¿Jair? Si eres tú, te juro que te entierro aquí mismo y nadie te va a encontrar.

`p2_s07` — Nadie responde. Solo la sensación rarísima de que alguien la está mirando desde muy, muy lejos.

`p2_s08` — Completaste el 100 % del juego para llegar hasta aquí. Rikka no lo sabe. Mejor que no lo sepa.

`p2_s09` **Rikka:** No tiene botones, ni cordones, ni dignidad. ¿Quién diseña algo así? Seguro un hombre.

`p2_s10` **Rikka:** Está apretado. Está apretadísimo. Cami lo eligió a propósito, estoy segura.

`p2_s11` — Se lo sube de un tirón, con la cara roja hasta las orejas. El vapor vuelve a cerrarse, como un telón.

> ⤷ continúa en `p2_028`


### fondos/cg_rikka_secreto.webp

> ◐ transición: blanco
`p2_s20` **Rikka:** ¡¡PERVERTIDOOO!!

`p2_s21` — La cachetada se escucha hasta el otro lado del reino. Lo que sea que espiaba entre los arbustos sale volando y cae al agua.

`p2_s22` **Rikka:** ¡Y tú también! ¡Sí, tú, el que está tocando! ¡Te vi!

`p2_s23` — Imagen secreta desbloqueada en la galería. Rikka no la aprobó.


### aguas_termales

> ◐ transición: negro
`p2_028` — Un rato después Rikka sale de detrás de la roca con el traje rojo. Camina raro, como si el traje fuera a morderla.

> ⤷ si rikka_perturbada == true → `p2_029_p` · si no → `p2_029`

`p2_029_p` **Rikka:** Esta ropa es indecente. Se pega a todo… No me miren. Hoy nadie me mira, ¿está claro?


> **DECISIÓN**
- `p2_029_p#0` Hacerle un comentario bonito ⟶ va a `p2_029b01` · confianza_rikka +1
- `p2_029_p#1` Hacerle un comentario atrevido ⟶ va a `p2_029a01`
- `p2_029_p#2` Quedarte callado ⟶ va a `p2_029c01`

`p2_029` **Rikka:** Esta ropa es indecente. Se pega a todo.


> **DECISIÓN**
- `p2_029#0` Hacerle un comentario bonito ⟶ va a `p2_029b01` · confianza_rikka +1
- `p2_029#1` Hacerle un comentario atrevido ⟶ va a `p2_029a01`
- `p2_029#2` Quedarte callado ⟶ va a `p2_029c01`

`p2_029b01` **Jair:** Te queda bien. Bueno… el rojo es tu color. Digo, siempre lo fue. El kimono también es rojo. Ya me callo.

> solo si rikka_perturbada == true
`p2_029b02_p` **Rikka:** …Gracias. Supongo. Pero no te acerques tanto, ¿sí?

> solo si rikka_perturbada == false
`p2_029b02` **Rikka:** ¿De… de verdad lo crees?

> solo si rikka_perturbada == true
`p2_029b03_p` — Rikka asiente, pero no baja los brazos. Sigue tapándose, y cada tanto mira hacia los arbustos.

> solo si rikka_perturbada == false
`p2_029b03` — Rikka baja los brazos. Solo un poco. Por primera vez desde que salió de detrás de la roca, deja de taparse.

`p2_029b04` **Cami:** «El rojo es tu color». Qué poético. ¿También le vas a escribir una canción?

`p2_029b05` **Jair:** Solo dije que le queda bien.

`p2_029b06` **Cami:** Ya. Yo me lo puse primero, por si a alguien le importa. Durante años. Y nadie me dijo que el azul era mi color.

`p2_029b07` **Jair:** (¿Eso fue… celos? No. Cami no se pone celosa. Cami dispara.)

`p2_029b08` — Cami se adelanta por el camino, sin decir nada más.

> ⤷ continúa en `p2_043`

`p2_029a01` **Jair:** Sacerdotisa… con ese traje y ese trasero, deberías cobrar entrada.

`p2_029a02` — Silencio. Hasta el vapor de las termas parece detenerse a escuchar.

> solo si rikka_perturbada == true
`p2_029a03_p` **Rikka:** No. Hoy no. Hoy nadie dice nada de mi cuerpo. Nadie. ¿Entendiste?

> solo si rikka_perturbada == false
`p2_029a03` **Rikka:** ¿Cobrar? ¿Cuánto se cobra por…? ¡NO! ¡No quiero saber cuánto!

> solo si rikka_perturbada == true
`p2_029a04_p` — Rikka se abraza a sí misma y da dos pasos atrás. No está roja: está pálida. Hasta Cami deja de sonreír por un segundo.

> solo si rikka_perturbada == false
`p2_029a04` — Rikka se pone de un rojo que no existe en ningún reino. Se tapa por delante con los dos brazos, después se acuerda de por qué lo dijo y se tapa por detrás. No le alcanzan los brazos.

`p2_029a05` **Cami:** Vaya. Así que el acompañante sin pistola sí venía armado.

`p2_029a06` **Jair:** ¡Se me salió! Fue… el autocompletado.

`p2_029a07` **Cami:** Conmigo no te sale ni el saludo, y con ella te sale la tarifa. No le eches la culpa a tus voces.

`p2_029a08` **Jair:** (No fui yo. Creo que no fui yo. ¿Fui yo?)

> solo si rikka_perturbada == true
`p2_029a09_p` — Rikka no le habla en todo el camino. Camina adelante, rápido, sin mirar a nadie, y se sobresalta cada vez que algo se mueve entre los arbustos.

> solo si rikka_perturbada == false
`p2_029a09` — Rikka no le habla en todo el camino. Pero de vez en cuando lo mira de reojo, se acomoda el traje y se vuelve a poner roja. Cami camina en medio de los dos, como una frontera.

> ⤷ continúa en `p2_044`

`p2_029c01` — Jair abre la boca. La cierra. La vuelve a abrir. No sale nada.

> solo si rikka_perturbada == true
`p2_029c02_p` **Rikka:** ¿Y tú? ¿Por qué me miras tanto? ¿Qué estás mirando?

> solo si rikka_perturbada == false
`p2_029c02` **Rikka:** …¿Y tú? ¿No vas a decir nada?

`p2_029c03` **Cami:** No le preguntes a él. Lleva un minuto entero mirándote el trasero.

`p2_029c04` **Jair:** ¡No es cierto!

`p2_029c05` **Cami:** Y no lo culpo.

`p2_030` **Cami:** Pero tiene razón en algo: te queda bien. Hace notar tu figura. Mira nada más.

`p2_031` **Cami:** Y qué lindo trasero, sacerdotisa.


### fondos/cg_rikka_nalgada.webp

`p2_032` — Le da una nalgada. De broma. Suena como un aplauso en una biblioteca.


### aguas_termales

> solo si rikka_perturbada == true
`p2_033_p` — Rikka se queda quieta. Después se da vuelta despacio, muy despacio, con los puños apretados.

> solo si rikka_perturbada == false
`p2_033` — Rikka se pone roja hasta las orejas. Se da vuelta como si le hubieran disparado.

> solo si rikka_perturbada == true
`p2_034_p` **Rikka:** ¡Basta! ¡Basta ya, todo el mundo! ¡¿Qué les pasa hoy a todos?! ¡No soy un juguete!

> solo si rikka_perturbada == false
`p2_034` **Rikka:** ¡Eres… eres la primera persona que me toca de esa manera! ¡Tan vulgar! ¡Tan impura!

> solo si rikka_perturbada == true
`p2_035_p` **Cami:** Uy. Alguien se levantó sensible.

> solo si rikka_perturbada == false
`p2_035` **Cami:** Siempre hay una primera vez.

`p2_036` — Jair está rojo. Más rojo que Rikka. Más rojo que el traje. Algo se le cruza por la cabeza, rápido, como una imagen en una pantalla: las dos, juntas, en una pose así. Ya lo vio antes. No sabe dónde.

`p2_037` **Jair:** (¿Dónde vi esto?)

`p2_038` **Jair:** (No. No lo vi. No pienses. No pienses.)

`p2_039` **Jair:** Cami. Ya basta. No la toques si no quiere.

`p2_040` **Cami:** …Era una broma.

`p2_041` **Jair:** Para ella no.

`p2_042` — Cami lo mira como si le hubieran cambiado al acompañante sin pistola por otro. Se da vuelta y no dice nada más.

`p2_043` — Rikka no dice nada tampoco. Pero durante todo el camino se queda cerca de Jair. Muy cerca. Más de lo que necesita alguien con una espada.


### camino_estaciones

> ◐ transición: negro
> ♪ música: sad_suspense
`p2_044` — Lejos de ahí, en un camino de tierra, una chica flaca corre con un bulto de ropa roja apretado contra el pecho. Se llama Nail. Roba para comer. Hoy robó mejor que nunca.

`p2_045` **Nail:** (Prendas de sacerdotisa. Con esto como un mes. Toda la familia come un mes.)

`p2_046` — En la curva del camino la esperan tres soldados de negro.

`p2_047` **Soldado enmascarado:** Esas prendas. Kimono rojo. Bordado de la Primavera. Son de la sacerdotisa que viaja con la fugitiva.

`p2_048` **Soldado enmascarado:** Llévensela. Y la ropa también. Va a servir de cebo.


### ciudadela_otono

> ◐ transición: negro
> ♪ música: adventure1
`p2_049` — Al día siguiente llegan a la ciudadela del Otoño: casas de piedra cubiertas de hiedra roja, piedras talladas con espirales en cada esquina, humo de chimeneas y olor a manzana asada y a hojas mojadas.

`p2_050` **Rikka:** Preguntemos si alguien vio mis prendas. Un kimono rojo con flores bordadas, una faja morada, un collar de…

`p2_051` **Cami:** Nadie va a entender esa descripción. Todos los kimonos son rojos para la gente que no usa kimono.

`p2_052` **Jair:** Yo… tengo una foto.

`p2_053` **Rikka:** ¿Una qué?


### PANTALLA:negro

`p2_054` — Jair saca el celular. Cuatro por ciento. Ahorro de energía. Busca la foto: Rikka en la piedra, mirando el atardecer, con el pelo suelto y el kimono puesto.


### ciudadela_otono

`p2_055` **Rikka:** …¿Cuándo me hiciste eso?

`p2_056` **Jair:** Es documentación. Del viaje. Es ingeniería.

`p2_057` **Cami:** Se te mueve la oreja.

`p2_058` — Un vendedor de manzanas se acerca. Mira el celular como si fuera una manzana que habla.

`p2_059` **Vendedor:** ¿Qué clase de espejo es ese? ¿Atrapa a la gente adentro?

`p2_060` **Jair:** Algo así. ¿Vio esta ropa?

`p2_061` **Vendedor:** Sí. Una chica me la quiso vender ayer. Yo no compro cosas robadas: ya tengo bastantes problemas con la guardia. Pero sé dónde se esconde. En el almacén viejo, junto al molino.

`p2_062` **Rikka:** Gracias. Que el otoño le dé buena cosecha.

`p2_063` — Cuando se van, el vendedor se quita el delantal. Debajo lleva una armadura negra. Se para junto a una piedra tallada y levanta una mano. Desde un tejado, alguien le responde con la misma seña.

`p2_064` **Soldado enmascarado:** Van a la trampa.


### almacen_molino

> ♪ música: sad_suspense
`p2_065` — El almacén del molino está casi vacío. En el medio, atada a un poste, está Nail. A sus pies, el kimono rojo.

`p2_066` **Rikka:** ¡Mis prendas!

`p2_067` **Nail:** ¡No! ¡Es una trampa! ¡Váyanse!


> **DECISIÓN**
- `p2_067#0` Ir a desatar a Nail ⟶ va a `p2_068`
- `p2_067#1` Agarrar primero las prendas de Rikka ⟶ va a `bad_prendas_01`

`bad_prendas_01` **Jair:** (Primero lo importante: el kimono. Si lo recupero, Rikka me va a querer para siempre.)

`bad_prendas_02` — Jair corre hacia la pila de ropa. Agarra el kimono, la faja, el collar. Se los abraza contra el pecho como un ladrón muy torpe.

`bad_prendas_03` **Nail:** ¡Eso no! ¡Debajo hay un hilo!

`bad_prendas_04` — Debajo del kimono hay un hilo. El hilo sube al techo. En el techo hay una red llena de piedras.

`bad_prendas_05` **Jair:** (Ah. El cebo era la ropa. Y el pez soy yo.)

`bad_prendas_06` — La red cae. Las piedras también.

`bad_prendas_07` **Rikka:** ¡JAIR! …¡Y mi kimono!

`bad_prendas_08` **Voz:** Usuario: aplastado por cebo textil. Sesión terminada.

`bad_prendas_09` **Jair:** (Por lo menos me morí abrazando algo suave.)


### PANTALLA:negro

`bad_prendas_09z` — Lavandería sagrada

> **BAD END: Lavandería sagrada**

---

### almacen_molino

`p2_068` — Las puertas se cierran detrás de ellos. De los techos bajan soldados de negro, uno detrás de otro, demasiados para contarlos.

`p2_069` **Soldado enmascarado:** La fugitiva. El forastero. Y la sacerdotisa. Los tres. El rey va a estar contento.

`p2_070` **Rikka:** ¿Los tres? ¿Ahora también me quieren a mí?

`p2_071` **Rikka:** Sabía que no tenía que juntarme con ustedes. Lo sabía.

`p2_071r01` — Rikka se lleva la mano a la cintura. La empuñadura negra sigue ahí, colgada de un cinturón que no combina con nada: lo único que Nail no se llevó. La hoja roja se enciende con un zumbido.

`p2_071r02` **Rikka:** Que conste que esto lo hago por el kimono. No por ustedes.

`p2_071r03` — Hace el giro de siempre, el elegante, el innecesario. A la mitad, el traje le tira de los hombros y el giro le sale torcido. Igual parte en dos el casco del primer soldado.

`p2_071r04` **Rikka:** ¡Este traje no deja girar! ¿Cómo pelean en tu dimensión con esto puesto?

`p2_071r05` **Cami:** Disparando. De lejos. Como la gente civilizada.

`p2_071r06` — Rikka se planta delante de Jair. Cae un soldado. Dos. Tres. Cada vez que uno se le acerca a él, la hoja roja llega primero.


> **DECISIÓN**
- `p2_071r06#0` Quedarte detrás de Rikka ⟶ va a `p2_071r07`
- `p2_071r06#1` Mirar cómo se le sube el traje ⟶ va a `bad_mirada_01`

`bad_mirada_01` **Jair:** (No mires. No mires. …Una miradita. Para verificar que esté bien.)

`bad_mirada_02` — Rikka gira. El traje rojo se sube. Jair mira. Rikka siente la mirada como se siente una corriente de aire.

`bad_mirada_03` **Rikka:** ¡¿ME ESTÁS MIRANDO EN PLENA PELEA?!

`bad_mirada_04` — Se da vuelta para reclamarle. Les da la espalda a los soldados. A todos los soldados.

`bad_mirada_05` **Soldado enmascarado:** Gracias, forastero. Muy amable.

`bad_mirada_06` — Caen los dos. Rikka primero. Jair después, todavía con la cabeza ladeada.

`bad_mirada_07` **Voz:** Usuario: distraído. Sesión terminada.

`bad_mirada_08` **Jair:** (Valió la pena. No. No valió la pena. Bueno, un poco.)


### PANTALLA:negro

`bad_mirada_08z` — Mirada indiscreta

> **BAD END: Mirada indiscreta**

---

### almacen_molino

`p2_071r07` **Jair:** (Me está cuidando a mí. No al kimono. A mí.)

`p2_071r08` **Rikka:** ¡No te muevas de detrás mío! …Y no mires. El traje se sube.

`p2_071r09` **Jair:** ¡No estoy mirando!

`p2_071r10` **Cami:** Se le mueve la oreja.

`p2_071r11` — Pero por cada casco que cae, bajan dos más del techo.

`p2_072` — Nail se suelta las cuerdas con un cuchillo escondido en la bota. Corta las de un soldado de paso. Patea otro a la cara.

`p2_073` **Nail:** ¡Por la ventana de atrás! ¡No los van a poder vencer, son demasiados!

`p2_074` — Cami dispara. Uno cae. Dos más ocupan su lugar. La ventana de atrás se llena de cascos negros. No hay salida.

`p2_075` **Cami:** No me alcanza. No me alcanza, Jair.

`p2_076` **Jair:** (No. No así. No ahora. Que alguien haga algo. Que algo la ayude…)

`p2_077` **Voz:** Solicitud del usuario recibida. Entidad 01: actualización disponible.

`p2_078` **Voz:** Instalando. No apague el equipo.

`p2_079` — El traje de Cami se enciende. Placas de metal le brotan de los hombros, de los brazos, de las piernas, y se cierran solas sobre el cuerpo, una detrás de otra, con un ruido de cerrojos.

`p2_080` — Cuando termina, Cami está dentro de un traje nuevo: metálico, ajustado, con placas en los hombros y luces azules en las juntas.

`p2_081` **Cami:** …¿Qué es esto?

`p2_082` **Jair:** (Un level up. Le acaban de dar un level up.)

`p2_082b` — Los soldados no retroceden. Siguen bajando del techo. Cami derriba a dos, a tres, y la fila vuelve a cerrarse.

`p2_082c` **Voz:** Modo armored: estable. Desbloqueando modo berserk.

`p2_082d` — Las placas siguen creciendo. Se le cierran sobre la cara, los brazos se vuelven cañones y le sale vapor de las juntas. Los ojos del casco se encienden en azul.


> **DECISIÓN**
- `p2_082d#0` Tirarte al piso ⟶ va a `p2_083`
- `p2_082d#1` Abrazarla para que se calme ⟶ va a `bad_abrazo_01`
- `p2_082d#2` Darle órdenes como un jefe ⟶ va a `bad_jefe_01`

`bad_jefe_01` **Jair:** ¡Cami! ¡Prioridad uno: los de la izquierda! ¡Prioridad dos: los de la derecha! ¡Mándame un reporte cuando termines!

`bad_jefe_02` — Cami gira la cabeza dentro del casco. Los ojos de la armadura se ponen rojos. Muy rojos.

`bad_jefe_03` **Cami:** ¿Me estás dando órdenes?

`bad_jefe_04` **Jair:** Es… una sugerencia… con fecha de entrega.

`bad_jefe_05` — Hay cosas que ni el modo berserk tolera. Que un hombre le hable como un jefe es una de ellas.

`bad_jefe_06` **Voz:** Modo berserk: jerarquía rechazada. Usuario: sesión terminada.


### PANTALLA:negro

`bad_jefe_06z` — Reunión de seguimiento

> **BAD END: Reunión de seguimiento**

---

### almacen_molino

`bad_abrazo_01` **Jair:** (Está perdiendo el control. Necesita que alguien la contenga. Que alguien… la abrace.)

`bad_abrazo_02` — Jair corre hacia Cami con los brazos abiertos, como en el final de una película romántica de bajo presupuesto.

`bad_abrazo_03` — La armadura no reconoce abrazos. Reconoce amenazas. Los cañones giran hacia él con un zumbido casi amable.

`bad_abrazo_04` **Jair:** Cami, soy yo, soy y—

`bad_abrazo_05` — Lo que sigue dura menos de un segundo.

`bad_abrazo_06` **Voz:** Modo berserk: objetivo neutralizado. Usuario: sesión terminada.

`bad_abrazo_07` **Cami:** …¿Jair?


### PANTALLA:negro

`bad_abrazo_07z` — Abrazo de metal

> **BAD END: Abrazo de metal**

---

### almacen_molino

`p2_083` — Lo que sigue dura menos de un minuto. Cami atraviesa la fila de soldados como un camión atraviesa una cerca. Los cascos negros vuelan. Las paredes del almacén, también.

`p2_084` — Rikka agarra el kimono. Jair agarra a Nail. Salen por el agujero que deja Cami en la pared.


### bosque_otono

> ♪ música: serene
`p2_085` — Se detienen lejos, en un claro del bosque, entre robles rojos. La armadura de Cami se repliega sola, placa por placa, y las luces se apagan una por una. Debajo queda su traje azul de siempre.

`p2_085b` **Voz:** Modo armored: descargado. Requiere recarga.

`p2_086` **Cami:** No sé cómo hice eso.

`p2_087` **Jair:** (Yo tampoco. Y me preocupa que fui yo.)

`p2_088` — Nail se sienta sobre las hojas secas, sin aire. Es más chica de lo que parecía corriendo.

`p2_089` **Nail:** Lo siento. Lo de la ropa. No es que me guste robar.

`p2_090` **Nail:** Tengo dos hermanos chicos y una madre enferma. Con lo que pagan por prendas así, comemos un mes. Yo pensé… pensé que una sacerdotisa tendría más.

`p2_091` — Rikka la mira un rato. Después se levanta, con el kimono doblado bajo el brazo, y se aleja hacia la ciudadela sin decir nada.

`p2_092` — Vuelve una hora después. Ya con su kimono rojo puesto, la faja bien atada, el pelo recogido. Otra vez sacerdotisa.

`p2_093` — Le pone a Nail una bolsita de monedas en la mano.

`p2_094` **Nail:** ¿Y esto? ¿De dónde lo sacó?

`p2_095` **Rikka:** Fui a vender algunas cosas.

`p2_096` **Nail:** Gracias. De verdad. Que el otoño la cuide, sacerdotisa.

`p2_097` — Nail se va corriendo entre los robles, más liviana que cuando llegó.

`p2_098` **Cami:** ¿Qué vendiste?

`p2_099` **Rikka:** El traje que me prestaste.

`p2_100` **Cami:** ¿QUÉ?

`p2_101` **Cami:** ¡Era mío! ¡No puedes andar vendiendo ropa que no es tuya!

`p2_102` **Rikka:** Deberías agradecerme. Te salvé la vida.

`p2_103` **Cami:** ¡Tú no me salvaste nada! ¡Yo tiré la pared!

`p2_104` **Rikka:** Y además, tú no necesitas dos trajes. El tuyo se convierte en tanque cuando te enojas.

`p2_105` — Cami abre la boca. La cierra. Jair, por una vez, no dice nada. Es lo más inteligente que hace en todo el día.


### camino_invierno

`t_a01` — Dos días después, el otoño se acaba de golpe, como una página que alguien arrancó. Del otro lado empieza la nieve: el reino del Invierno.

`t_a02` **Jair:** (Mi ciudad tiene una sola estación: «hace calor». Aquí tienen cuatro y ninguna me queda bien.)

`t_ai01` — El frío llega de golpe. A Jair le castañetean los dientes con un ritmo que casi podría bailarse.

`t_ai02` **Jair:** (Camisa de manga corta en un reino de nieve. Me vestí para la oficina, no para el fin del mundo.)

`t_ai03` **Rikka:** Toma. Bébela.

`t_ai04` — Rikka le da un frasquito con un líquido rojo que brilla como una brasa.

`t_ai05` **Jair:** ¿Qué es?

`t_ai06` **Rikka:** Poción contra el frío. Receta de la Primavera. Un trago y el invierno te respeta.

`t_ai07` — Jair la bebe. Le quema la garganta, le quema el estómago y después el frío se queda afuera, como un vendedor al que nadie le abrió la puerta.

`t_ai08` **Jair:** (Mejor que cualquier calefacción. Y sin factura.)

`t_ai09` **Jair:** ¿Y ustedes? ¿No toman?

`t_ai10` **Rikka:** Mis prendas están encantadas: resisten el frío. Las tuyas resisten… nada.

`t_ai11` **Cami:** Y mi traje es térmico, ingeniero. Tecnología de verdad. No necesito jarabes de abuela.

`t_ai12` **Rikka:** ¡No es un jarabe de abuela!

`t_ai13` **Cami:** Huele a jarabe de abuela.

`t_a03` **Rikka:** Hay una posada a una hora de camino. Camas, fuego y una taberna abajo. Pasamos la noche ahí.

`t_a04` **Cami:** ¿Y con qué pagamos? Ah, cierto. Tú tienes dinero. Vendiste MI traje.

`t_a05` **Rikka:** …Era para una buena causa.

`t_a06` **Cami:** Perfecto. Entonces esta noche la buena causa invita las rondas.


### taberna_invierno

`t_b01` — La taberna de la posada huele a leña, a pan y a algo dulce que fermenta en barriles. Afuera nieva. Adentro, alguien toca un laúd con más ganas que talento.

`t_bc01` — El celular de Jair vibra en el bolsillo. Un pitido triste. Cinco por ciento. Ahorro de energía.

`t_bc02` **Jair:** (Si se apaga, se pierde todo. Las fotos. La de Rikka. Las de… otras personas.)

`t_bc03` **Rikka:** ¿Tu aparato tiene hambre?

`t_bc04` **Jair:** Algo así. Come electricidad.

`t_bc05` **Rikka:** ¿Electricidad? ¿Rayos? Las sacerdotisas de la Primavera aprendemos un poco de elemento rayo. Para encender faroles. Préstamelo.

`t_bc06` — Rikka apoya dos dedos en la parte de atrás del celular. Un chispazo azul le recorre la mano. El celular hace un sonido que Jair no le escuchaba hace días: el de la carga inalámbrica.

`t_bc07` **Voz:** Carga inalámbrica detectada. Fuente: no reconocida. Batería: 50 %.

`t_bc08` **Jair:** (Pagué extra por la carga inalámbrica y nunca la usé. Y la estrena una sacerdotisa de quinientos años con un rayo.)

`t_bc09` **Cami:** Bien. Ya comió el aparato. Ahora que coma la gente. Y pagas tú, sacerdotisa.

`t_b02` **Rikka:** Tres hidromieles. De los pequeños.

`t_b03` **Cami:** De los grandes. Paga la sacerdotisa.

`t_b04` — Llegan tres jarras del tamaño de una cabeza. La hidromiel es dorada, dulce y traicionera: sabe a jugo y pega como un martillo.

`t_b05` **Jair:** (La última vez que tomé así terminé dentro de un videojuego. No sé qué puede pasar ahora. Ya dentro de uno.)

`t_b06` — Primera ronda. Segunda. A la tercera, Rikka se ríe de un chiste que nadie contó y Cami tiene los pies arriba de la mesa.

`t_bp01` — En la mesa de al lado, un leñador del tamaño de un armario golpea la madera con el puño. Busca contrincante para echar pulsos. Nadie se anima.

`t_bp02` **Leñador:** ¡Una moneda de plata al que me gane! ¡Dos al que me aguante más de tres segundos!

`t_bp03` **Cami:** Jair. Ve.

`t_bp04` **Jair:** ¿Yo? Mis brazos sirven para escribir y para cargar el celular. En ese orden.

`t_bp05` **Cami:** Por eso. Quiero ver cuánto duras. Apuesto a que menos de tres segundos.

`t_bp06` **Rikka:** Cami, no digas esas cosas en público.

`t_bp07` **Cami:** Hablaba del pulso, sacerdotisa. La que pensó mal fuiste tú.

`t_bp08` **Rikka:** …Yo no pensé nada.

`t_bp09` — Al final va Cami. Se sienta frente al leñador, apoya el codo en la mesa y le sonríe como se le sonríe a una presa.

`t_bp10` **Leñador:** ¿Tú? Te voy a romper esa manito, muñeca.

`t_bp11` **Cami:** Inténtalo. Pero rápido, que se me calienta la hidromiel.

`t_bp12` — Dos segundos. Eso dura el leñador. El brazo le cae sobre la mesa con un ruido de tronco.

`t_bp13` **Leñador:** …Dos de plata. Y no me vuelvas a hablar.

`t_bp14` **Cami:** Nadie te habló, cariño.

`t_bp15` **Jair:** (Acaba de humillar a un armario. Y yo me enamoré un poquito. Del armario no: de la humillación.)

`t_bp16` **Rikka:** Yo también podría ganarle. Con la espada.

`t_bp17` **Cami:** Con la espada no es pulso, es homicidio.

`t_bp18` **Rikka:** En la Primavera es casi lo mismo.

`t_bp19` — Junto al fuego, una mujer mayor con un laúd empieza a cantar. Es una canción del Invierno: lenta, triste, sobre un soldado que nunca volvió de la nieve.

`t_bp20` **Rikka:** Esa canción la conozco. La cantan en todos los reinos, cada uno con su estación.

`t_bp21` **Jair:** ¿Cómo termina?

`t_bp22` **Rikka:** Igual en todos. El soldado no vuelve. Lo único que cambia es dónde lo esperan.

`t_bp23` **Cami:** Qué canción tan alegre. Pidan otra o me tomo el barril.

`t_bp24` — Como si la hubiera escuchado, la cantante pasa a una canción de taberna sobre una cabra que se casó con un rey. La taberna entera la canta. Rikka también, con las mejillas rojas, desafinando con una dignidad sagrada.

`t_bp25` **Jair:** (Rikka canta horrible. Es lo más lindo que escuché en años.)

`t_bp26` **Cami:** Te vi pensarlo.

`t_bp27` **Jair:** ¿Pensar qué?

`t_bp28` **Cami:** Eso. Tienes cara de comentario de foto lleno de corazones.

`t_b07` **Jair:** En mi dimensión hay un juego para esto. Se llama «Yo nunca nunca».

`t_b08` **Jair:** Uno dice algo que nunca hizo. El que sí lo hizo, bebe.

`t_b09` **Cami:** Un juego para emborracharse confesando cosas. Tu dimensión es horrible y me encanta.

`t_b10` **Rikka:** Yo empiezo. Yo nunca nunca… he robado.

`t_b11` — Cami bebe sin pestañear. Jair bebe también: una vez se llevó un bolígrafo del banco. Rikka bebe, porque esta mañana se comió las uvas de un puesto sin preguntar si eran gratis.

`t_b12` **Cami:** Mi turno. Yo nunca nunca… me he quitado la ropa en un lugar público.

`t_b13` **Rikka:** ¡Eso fue en unas aguas termales! ¡Y me la robaron! ¡No cuenta!

`t_b14` **Cami:** Cuenta. Bebe.

`t_b15` — Rikka bebe, roja hasta la flor del pelo.

`t_b16` **Jair:** Yo nunca nunca… he disparado un arma.

`t_b17` **Cami:** Eso es trampa. Eres un acompañante sin pistola.

`t_b18` — Cami bebe. Bebe largo, mirándolo por encima de la jarra.

`t_b19` **Cami:** Yo nunca nunca… lo he hecho con alguien más de una vez la misma noche.

`t_b20` **Jair:** …

`t_b21` **Rikka:** ¿Hecho qué?

`t_b22` **Cami:** Ay, sacerdotisa. Quinientos años y todavía preguntas «hecho qué».

`t_b23` — Nadie bebe. Cami suspira, decepcionada de los dos, y bebe ella sola. Después le guiña un ojo a Jair. Jair se atraganta con el aire.

`t_b24` **Jair:** (No pienses en eso. No pienses en eso. Estás pensando en eso.)

`t_b25` **Rikka:** Mi turno. Yo nunca nunca… he cuidado a alguien mientras dormía.

`t_b26` — Nadie bebe. Rikka mira su jarra. Después, muy rápido, mira a Jair.

`t_b27` **Rikka:** …Pero me gustaría. Que alguien lo hiciera conmigo. Aunque sea una vez. No digo quién. No digo nada. Es la hidromiel.

`t_b28` **Cami:** «No digo quién». Clarísimo, sacerdotisa. Clarísimo.

`t_bn01` **Jair:** Mi turno otra vez. Yo nunca nunca… me he enamorado de alguien de otra dimensión.

`t_bn02` — Silencio. Rikka mira el fuego. Cami mira a Rikka. Nadie bebe. Después, muy despacio, Rikka toma un sorbo tan chiquito que casi no cuenta.

`t_bn03` **Cami:** Eso fue un sorbo. Te vi.

`t_bn04` **Rikka:** ¡Tenía sed!

`t_bn05` **Cami:** Tenías sed de forastero.

`t_bn06` **Jair:** (Pregunté sin pensar. Es mi especialidad: preguntar sin pensar y después pensar sin dormir.)

`t_bn07` **Cami:** Yo nunca nunca… he fingido que me gustaba algo para quedar bien.

`t_bn08` — Jair bebe. Rikka bebe. Cami los mira a los dos con una satisfacción de cazadora.

`t_bn09` **Cami:** ¿Qué fingiste, ingeniero?

`t_bn10` **Jair:** Que me gustaba mi trabajo. Cinco años. En cada reunión. Con una sonrisa.

`t_bn11` **Cami:** Eso no es fingir. Eso es sobrevivir.

`t_bn12` **Rikka:** Yo fingí que me gustaba el té de raíz amarga del palacio. Trescientos años tomándolo por cortesía.

`t_bn13` **Cami:** ¿Trescientos años? Sacerdotisa, eso se llama relación tóxica.

`t_bn14` **Rikka:** ¿Con un té?

`t_bn15` **Cami:** Con un té. No te juzgo. Yo he tenido peores.

`t_bn16` **Rikka:** Mi turno. Yo nunca nunca… he besado a alguien.

`t_bn17` — Cami bebe sin dudar. Jair duda. Mira la jarra. Piensa en un bar que huele a tequila y en un beso torpe con sabor a costumbre.

`t_bn18` — Bebe.

`t_bn19` **Rikka:** ¿Jair besó a alguien?

`t_bn20` **Cami:** Mírala. Le dolió más que la resaca que va a tener mañana.

`t_bn21` **Rikka:** No me dolió. Pregunto por curiosidad. Académica.

`t_bn22` **Jair:** Fue… complicado. Una amiga.

`t_bn23` **Cami:** «Una amiga». En todas las dimensiones esa frase quiere decir lo mismo.

`t_bn24` **Rikka:** ¿Qué quiere decir?

`t_bn25` **Cami:** Que no es una amiga. Y que tampoco es otra cosa. Que es un lugar donde te quedas a vivir sin pagar renta.

`t_bn26` **Jair:** (Ocho años sin pagar renta. Y los intereses se cobran igual.)

`t_bn27` **Cami:** Bueno, ya me deprimí. Yo nunca nunca… me he dormido en un lugar raro.

`t_bn28` — Los tres beben. Jair se durmió sobre un teclado y despertó en otro universo. Rikka se durmió una vez en el puente y despertó con un pájaro haciendo nido en su pelo. Cami no explica nada: bebe dos veces.

`t_bn29` **Rikka:** ¿Por qué bebiste dos veces?

`t_bn30` **Cami:** Porque una vez fue en una nave y la otra… no te quiero corromper más esta noche.

`t_bn31` **Jair:** (Me da miedo preguntar. Me da más miedo no saber.)

`t_bn32` **Rikka:** Yo nunca nunca… he visto a un hombre sin camisa.

`t_bn33` **Cami:** Mentira. En las termas Jair andaba sin camisa.

`t_bn34` **Rikka:** ¡No lo miré! Tenía los ojos cerrados. Casi todo el tiempo.

`t_bn35` **Cami:** «Casi». Bebe.

`t_bn36` — Rikka bebe. Jair también bebe, por solidaridad, y nadie entiende por qué.

`t_bn37` **Cami:** ¿Y tú por qué bebes? ¿Viste a un hombre sin camisa?

`t_bn38` **Jair:** Me vi a mí mismo en el espejo. Cuenta como trauma.

`t_bn39` **Cami:** Cuenta como trauma para todos.

`t_bn40` — Afuera nieva. Adentro, el tabernero trae otra ronda sin que nadie la pida, con la mirada de quien ya vio a mil viajeros hacer el ridículo.

`t_bn41` **Tabernero:** Para la mesa del traje rojo. Por cuenta de la sacerdotisa, que ya pagó como media posada.

`t_bn42` **Rikka:** ¿Media posada?

`t_bn43` **Cami:** Bebe y no hagas cuentas, sacerdotisa. Las cuentas arruinan las noches.


> **DECISIÓN**
- `t_bn43#0` Seguir a tu ritmo ⟶ va a `t_bn44`
- `t_bn43#1` Tomarte la jarra entera de un trago ⟶ va a `bad_hidromiel_01`

`bad_hidromiel_01` **Jair:** (Hora de demostrar que en mi dimensión también sabemos beber. Bueno, que yo sé. Bueno, que puedo aprender ahora.)

`bad_hidromiel_02` — Jair levanta la jarra con las dos manos. Es del tamaño de su cabeza. La empina y no para.

`bad_hidromiel_03` **Cami:** Oye. Oye, ingeniero. Eso no se toma de un trago. Ni yo me lo tomo de un trago.

`bad_hidromiel_04` **Rikka:** ¡Jair, la hidromiel del Invierno se hace para que dure toda la noche!

`bad_hidromiel_05` — La jarra queda vacía. Jair la apoya en la mesa con una sonrisa triunfal. Después, la sonrisa se le derrite hacia un costado.

`bad_hidromiel_06` **Jair:** Estoy… perfecto. Veo… seis Rikkas. Y todas me quieren.

`bad_hidromiel_07` **Rikka:** ¡Solo hay una!

`bad_hidromiel_08` **Jair:** Qué pena. Las otras cinco eran más simpáticas.

`bad_hidromiel_09` — Se cae de la silla y no se levanta. El tabernero se acerca, lo mira y niega con la cabeza, como quien ya vio esto mil veces.

`bad_hidromiel_10` **Tabernero:** Forasteros. Siempre creen que la hidromiel es jugo.

`bad_hidromiel_11` **Voz:** Usuario: nivel de alcohol incompatible con la vida. Sesión terminada.


### PANTALLA:negro

`bad_hidromiel_11z` — Hidromiel de la casa

> **BAD END: Hidromiel de la casa**

---

### taberna_invierno

`t_bn44` **Jair:** (Lo dice la que no paga nada. Igual que mi jefe.)

`t_b29` **Cami:** Esto ya me aburrió. Pasemos a verdad o reto. Tú, Jair. Tú eliges el siguiente.

`t_r01` **Cami:** Esto ya me aburrió. Verdad o reto. Empiezas tú, ingeniero: ¿qué le haces a la sacerdotisa?


> **DECISIÓN**
- `t_r01#0` Verdad: que cuente un secreto ⟶ va a `t_va01`
- `t_r01#1` Reto: que se tome la jarra de un trago ⟶ va a `t_ra01`

`t_va01` **Rikka:** Un secreto. Tengo quinientos años de secretos. Hay que elegir bien.

`t_va02` **Rikka:** De joven… bueno, más joven… me escondía en la biblioteca del palacio a leer novelas de amor. Las prohibidas. Las de caballeros que se escapan con sacerdotisas.

`t_va03` **Cami:** Lo sabía. Por fuera, espada. Por dentro, novela barata con dibujos.

`t_va04` **Rikka:** Mi turno. Jair. ¿Verdad o reto?

`t_vb01` **Rikka:** Y piensa bien. Las sacerdotisas sabemos cuando nos mienten.


> **DECISIÓN**
- `t_vb01#0` Verdad ⟶ va a `t_vv01`
- `t_vb01#1` Reto ⟶ va a `t_vr01`

`t_vv01` **Rikka:** ¿Por qué nos ayudas? No tienes espada. No tienes dinero. Ni siquiera eres de aquí.

`t_vv02` **Cami:** Uy. Pregunta seria. Me aburro. Despiértenme cuando alguien se desnude.

`t_vv03` — Cami apoya la cabeza en la mesa «solo un momento» y se duerme abrazada a su jarra, como si alguien fuera a quitársela.

`t_vv04` — Afuera nieva más fuerte. El del laúd se fue. Quedan ellos dos, el fuego y el ruido de la leña.

`t_vv05` **Jair:** …Porque en mi mundo siempre me escondo. En el trabajo, con mi familia, con… alguien. Me escondo tan bien que a veces ni yo me encuentro.

`t_vv06` **Jair:** Aquí, por primera vez, alguien me necesita para algo más que arreglar una impresora.

`t_vv07` — Rikka estira la mano por encima de la mesa y la pone sobre la de Jair. Tiene los dedos fríos de la nieve y calientes de la hidromiel.

`t_vv08` **Rikka:** Yo también me escondo. En un puente. Hace siglos. Le decía a todos que lo cuidaba, pero creo que el puente me cuidaba a mí.

`t_vv09` **Rikka:** No me sueltes todavía. Es la hidromiel. Mañana no me acuerdo de nada. Te lo prometo.

`t_vm01` — Rikka no suelta la mano. Jair tampoco.


> **DECISIÓN**
- `t_vm01#0` Apretarle la mano ⟶ va a `t_vh01` · romance_rikka +1
- `t_vm01#1` Quedarte quieto y mirar el fuego ⟶ va a `t_vq01`


### cg_taberna_mano

`t_vh01` — Jair le aprieta la mano. Poco. Lo justo. Rikka sonríe sin abrir los ojos y apoya la cabeza en su hombro.

`t_vh02` **Rikka:** Quinientos años esperando a alguien que cayera del cielo. Y cae uno que no sabe vendar tobillos.

`t_vh03` — Al rato respira lento. Se durmió. Jair se queda quieto hasta que el fuego se apaga, para no despertarla.

> ⤷ continúa en `t_am01`


### taberna_invierno

`t_vq01` — Jair mira el fuego como si ahí estuviera la respuesta correcta. Rikka espera un poco. Después suelta la mano, despacio, sin decir nada.

`t_vq02` **Rikka:** Buenas noches, Jair.

`t_vq03` **Jair:** (Un gesto. Uno solo. Y ni eso me sale.)

> ⤷ continúa en `t_am01`

`t_vr01` **Rikka:** Reto. Dile algo bonito a Cami. Algo de verdad. Sin «es pura logística».

`t_vr02` **Jair:** …Cami. Eres la persona más valiente que conozco. Y la que más miedo me da. Las dos cosas a la vez.

`t_vr03` — Cami se queda quieta. Por una vez, no tiene respuesta. Rikka mira a una, mira al otro, y se toma la jarra entera de un trago, de pura vergüenza ajena.

`t_vr04` **Rikka:** Esto… esto ya no es mi juego. Buenas noches.

`t_vr05` — Rikka se acomoda sobre la mesa y se duerme en el acto, con la flor del pelo torcida.

> ⤷ continúa en `t_cb01`

`t_ra01` — Rikka mira la jarra. Mira a Jair. Se la toma de un trago, sin respirar, con la dignidad intacta y los ojos llorosos.

`t_ra02` **Rikka:** Quinientos años… y nunca me había tomado nada… tan rápido.

`t_ra03` **Cami:** Mi turno. Jair. ¿Verdad o reto?

`t_rb01` **Cami:** Elige rápido, que se me acaba la paciencia y la hidromiel.


> **DECISIÓN**
- `t_rb01#0` Verdad ⟶ va a `t_rv01`
- `t_rb01#1` Reto ⟶ va a `t_rr01`

`t_rv01` **Cami:** ¿Cuál de las dos te gusta más? Y no digas «las dos». Eso es de cobardes.

`t_rv02` — Las dos lo miran. Rikka, con miedo. Cami, con hambre.


> **DECISIÓN**
- `t_rv02#0` «Las dos» ⟶ va a `t_rw01`
- `t_rv02#1` «Nikki» ⟶ va a `t_rn01`

`t_rw01` **Jair:** Las dos.

`t_rw02` **Cami:** Cobarde. Te lo dije. Bebe.

`t_rw03` **Rikka:** A mí me pareció una respuesta muy diplomática.

`t_rw04` — Rikka brinda por la diplomacia. Dos veces. A la segunda, se le cierran los ojos y se queda dormida sobre la mesa.

> ⤷ continúa en `t_cb01`

`t_rn01` **Jair:** …Nikki.

`t_rn02` — Silencio. El del laúd deja de tocar.

`t_rn03` **Cami:** ¿La de los helados? ¿La del «más o menos»? Estás en otra dimensión, con dos mujeres armadas, y eliges a la que te deja en visto.

`t_rn04` **Rikka:** Eso fue… muy honesto. Y muy triste. Brindo por eso.

`t_rn05` — Rikka brinda por eso. Y por la honestidad. Y por la tristeza. A la tercera, se duerme sobre la mesa.

> ⤷ continúa en `t_cb01`

`t_rr01` **Cami:** Reto. Pero esta vez eliges tú a quién le toca. Sorpréndeme.

`t_rr02` **Jair:** Que Rikka… bese a Cami.

`t_rr03` **Jair:** (¿Lo dije en voz alta? Lo dije en voz alta.)

`t_rr04` **Cami:** Vaya. El ingeniero tiene ideas. Por mí, encantada.

`t_rr05` **Rikka:** ¡Jamás! ¡Soy una sacerdotisa! Prefiero beber.

`t_rr06` — Y bebe. Media jarra de un trago. Cami se ríe tanto que se le cae la silla.

`t_rs01` **Cami:** Otra ronda. El reto sigue en pie, sacerdotisa. ¿O el ingeniero se arrepiente?


> **DECISIÓN**
- `t_rs01#0` Insistir con el reto ⟶ va a `t_rt01`
- `t_rs01#1` Cambiar de reto ⟶ va a `t_rx01`

`t_rx01` **Jair:** Mejor otro. Que Cami… cuente un chiste.

`t_rx02` **Cami:** ¿Sabes cuál es la diferencia entre tú y una pistola? La pistola dispara cuando tiene que hacerlo.

`t_rx03` **Rikka:** …No lo entendí. Pero me da risa. Brindo por eso.

`t_rx04` — Rikka brinda por un chiste que no entendió y se queda dormida a la mitad de la carcajada.

> ⤷ continúa en `t_cb01`

`t_rt01` **Jair:** El reto sigue.

`t_rt02` **Rikka:** Traidor. Tabernero, otra.

`t_rt03` — Otra jarra. Rikka la bebe mirando a Jair como quien mira a un verdugo con lentes. Cami aplaude con los pies.

`t_rt04` **Cami:** Van tres. A la cuarta me ofendo de verdad. Ningún beso mío vale menos que cuatro jarras.

`t_ru01` **Rikka:** Jair. Por favor. Dime que ya está. Dime que el reto se acabó.


> **DECISIÓN**
- `t_ru01#0` Insistir otra vez ⟶ va a `t_rk01`
- `t_ru01#1` Rendirte: «ya está» ⟶ va a `t_ry01`

`t_ry01` **Jair:** Ya está. Se acabó. Perdón.

`t_ry02` **Rikka:** Gracias. Eres un caballero. Un caballero sin espada.

`t_ry03` — Rikka apoya la frente en la mesa para agradecérselo mejor y se queda dormida en el intento.

`t_ry04` **Cami:** Cobarde. Le arruinaste la noche a la sacerdotisa y a mí también.

> ⤷ continúa en `t_cb01`

`t_rk01` **Jair:** El reto sigue.

`t_rk02` — A la cuarta jarra, Rikka mira la quinta como quien mira una montaña. Después mira a Cami. Suspira.

`t_rk03` **Rikka:** Uno. Pequeño. Y nadie se lo cuenta a nadie. Nunca. En ninguna dimensión.


### cg_taberna_beso

`t_rk04` — Cami se inclina sobre la mesa y le da un beso rápido, apenas un toque. El tabernero deja caer un vaso. El del laúd se equivoca de nota.

`t_rk05` **Rikka:** …Sabía a hidromiel.


### taberna_invierno

`t_rk06` **Cami:** Sabía a victoria. Y a cinco jarras que pagaste tú.

`t_rk07` — Rikka apoya la frente en la mesa para pensar en lo que acaba de pasar. Diez segundos después está roncando, muy bajito, con una sonrisa que nadie le había visto.

`t_rk08` **Cami:** Qué noche. Gané un reto, un beso y una sacerdotisa dormida. Con eso me alcanza.

`t_rk09` — Cami se acurruca contra Rikka, sin pedir permiso, y se duerme también. Jair se queda despierto, cuidando a las dos.

`t_rk10` **Jair:** (Les pedí a una IA dos heroínas que se pelearan por mí. Ahora se besan entre ellas y yo pago la cuenta. No sé si es un fallo del sistema o justicia poética.)


### cg_taberna_beso

> ⤷ continúa en `t_am01`


### taberna_invierno

`t_cb01` **Cami:** Ahora quedamos tú y yo. Y no te voy a dejar elegir verdad: ya sé todas tus verdades. Son tristes.

`t_cc01` **Cami:** Reto. Bésame. O bebe. Tú eliges, acompañante.


> **DECISIÓN**
- `t_cc01#0` Besar a Cami ⟶ va a `t_ck01` · romance_cami +1
- `t_cc01#1` Beber ⟶ va a `t_cd01`

`t_ck01` — Jair deja la jarra. Cami no se mueve: espera, con esa media sonrisa de quien ya sabe cómo termina la apuesta.


### cg_taberna_beso_cami

`t_ck02` — El beso es torpe, con sabor a miel y a nieve. Cami lo agarra de la camisa para que no se arrepienta a la mitad.

`t_ck03` **Cami:** …No estuvo mal. Para alguien que nunca ha disparado un arma.


### taberna_invierno

`t_ck04` **Jair:** (Tengo treinta años y acabo de perder la cuenta de mis propios latidos.)

`t_ck05` — Cami se acomoda contra su hombro «solo un momento». A los pocos minutos está dormida, y Jair no se atreve a moverse en toda la noche.


### cg_taberna_beso_cami

> ⤷ continúa en `t_am01`


### taberna_invierno

`t_cd01` — Jair agarra la jarra y bebe hasta el fondo. Le arde todo. Se le saltan las lágrimas.

`t_cd02` **Cami:** Qué cobarde. Qué tierno. Qué cobarde.

`t_cd03` **Cami:** Está bien. Me lo guardo para cuando tengas valor. Te va a tomar como tres dimensiones.

`t_cd04` — Al rato Cami bosteza, apoya la cabeza en la mesa junto a la de Rikka y se queda dormida. Jair se queda despierto, cuidando a las dos.


### posada_amanecer

> ◐ transición: negro_lento

### posada_cuarto

`t_m01` — A la mañana, la luz del invierno entra por la ventana como un insulto personal.

`t_m02` **Cami:** Alguien apague el sol. Es una orden.

`t_m03` **Rikka:** Me duele la cabeza en lugares donde no sabía que tenía cabeza.

`t_m04` **Jair:** (La resaca es igual en todas las dimensiones. Por fin una constante universal.)

`t_m05` **Rikka:** Anoche no pasó nada. Que quede claro. Nada.

`t_m06` **Cami:** Nada de nada. Absolutamente nada que deba ser mencionado jamás.

`t_m07` **Jair:** (Nunca dos mujeres estuvieron tan de acuerdo en no mirarme.)

`t_e01` **Jair:** Conozco algo para la resaca. Un plato de mi ciudad. Allá lo comen a las siete de la mañana los que no durmieron. O sea, todos.

`t_e02` **Cami:** ¿Qué lleva? Si lleva hidromiel, te mato.

`t_e03` **Jair:** Pescado, hierbas, tomate, unas raíces… y pan. Mucho pan. Y cebolla. Mucha más cebolla de la que te parece razonable.

`t_e04` — Revisan las provisiones. Hay hierbas, tomates, raíces y pan del viaje. Falta el pescado.

`t_e05` **Rikka:** Abajo, en el río, venden pescado. Ve tú. Yo no puedo moverme. Mi cabeza tiene su propio clima.


### camino_invierno

`t_e06` — Jair baja al mercado del pueblo con resaca, con la luz del invierno clavándosele en los ojos y con la última moneda del traje rojo.

`t_e07` **Jair:** (Regatear con resaca en otra dimensión. Mi currículum crece de maneras que nadie va a creer.)


### posada_cocina

`t_e08` — En la cocina de la posada, Jair corta cebolla como si fuera lo único que sabe hacer bien. Tal vez lo es. El caldo hierve. La posada entera empieza a oler a domingo.

`t_e09` **Jair:** (Esto lo hacía mi abuela. Yo lo comía después de cada noche que no quería recordar. Ahora lo hago yo. En otra dimensión. Para dos mujeres que inventé.)


### cg_desayuno_resaca

`t_e10` — Lo sirve en tres platos hondos, con el pan al lado. Cami y Rikka lo miran con desconfianza. Después prueban. Después no hablan durante cinco minutos.


> **DECISIÓN**
- `t_e10#0` Comer despacio ⟶ va a `t_e11`
- `t_e10#1` Comer lo más rápido que puedas ⟶ va a `bad_espina_01`

`bad_espina_01` **Jair:** (Tengo hambre de resaca. Esa hambre que no es hambre: es supervivencia.)

`bad_espina_02` — Jair ataca el plato como si alguien se lo fuera a quitar. Pescado, pan, cebolla, más pan. No mastica: archiva.

`bad_espina_03` **Cami:** ¿Y ese apuro? Nadie te lo va a quitar.

`bad_espina_04` **Rikka:** En la Primavera decimos que el que come rápido…

`bad_espina_05` — Jair no escucha. Traga un pedazo de pan con una espina de pescado adentro. El pan baja. La espina, no.

`bad_espina_06` **Jair:** ¡—!

`bad_espina_07` — Se pone rojo. Después morado. Después, de un color que Rikka solo había visto en las ciruelas del Otoño.

`bad_espina_08` **Rikka:** …Se atraganta. Eso decimos: que el que come rápido se atraganta.

`bad_espina_09` **Cami:** ¡¿Y no lo podías decir más rápido?!

`bad_espina_10` — Cami le pega en la espalda. Rikka le pega en la espalda. Le pegan tanto que, si no se muere por la espina, se muere por la ayuda.

`bad_espina_11` **Voz:** Usuario: obstrucción por desayuno típico. Sesión terminada.

`bad_espina_12` **Jair:** (Morirme con el plato de mi abuela. Ella siempre me decía que comiera despacio.)


### PANTALLA:negro

`bad_espina_12z` — Sin masticar

> **BAD END: Sin masticar**

---

### cg_desayuno_resaca

`t_e11` **Cami:** …Esto revive a los muertos. ¿Por qué tu mundo tiene esto y no tiene sueldos?

`t_e12` **Rikka:** Quinientos años sin conocer esto. Siento que perdí la mitad de mi vida.


### posada_cuarto

`t_e13` **Jair:** (Les saco una foto. Y la subo. Nadie en mi mundo va a entender qué hago en una posada con nieve, pero por una vez quiero que alguien lo vea.)


### camino_invierno

`t_n01` — Pagan la posada con lo que queda del traje rojo. Afuera, el camino de nieve baja hacia el sur.

`t_n02` **Rikka:** Para llegar a la torre estacionaria hay que cruzar el Verano. Después, si el puente funciona, la del Oráculo.

`t_n03` **Cami:** Y la espada. Y el Rey. Y volver a casa con la cabeza pegada al cuello.

`t_n04` **Jair:** (Una espada que borra. En mi mundo, borrar era lo único que sabía hacer bien. Y lo hice tan bien que me echaron.)

`t_n05` — Tres sombras largas sobre la nieve, todavía con resaca, caminando hacia el sur. Antes de la torre falta un reino: el Verano.


### camino_verano

`ve_001` — Dos días después, la nieve se acaba. No de golpe: primero se vuelve barro, después pasto, después arena. El aire se calienta tanto que Jair siente que vuelve a casa.

`ve_002` **Jair:** (Calor húmedo. Ropa pegada a la espalda. Esto sí lo conozco: es lo único de este mundo que se parece al mío.)


### playa_verano

`ve_003` — El reino del Verano los recibe con una playa infinita: arena blanca, agua turquesa y palmeras que se inclinan como si también estuvieran cansadas.

`ve_004` **Rikka:** El Verano… Hace tanto que no venía.

`ve_005` **Cami:** Votación: descansamos un día. Yo voto que sí. Jair vota que sí porque yo voté. Rikka vota que sí porque está roja desde que vio el mar.

`ve_006` **Rikka:** ¡No estoy roja! Es el sol.

`ve_007` **Cami:** Qué curioso: el sol solo te pone roja cuando Jair te mira.

`ve_008` **Jair:** No la estaba mirando.

`ve_009` **Cami:** Nadie dijo que la estuvieras mirando. Solo dije «Jair». Te delataste solito, ingeniero.

`ve_010` — Deciden descansar. Por primera vez en días nadie los persigue. Es tan raro que da miedo.

`ve_011` **Jair:** (Mi ciudad tiene esto mismo: calor, humedad, mosquitos. Le falta el mar transparente. Y el descanso. Y que alguien te espere. Detalles.)

`ve_012` **Cami:** Yo me voy a cambiar. En la entrada de la playa hay un puesto de trajes de baño.

`ve_013` **Jair:** ¿Trajes de baño?

`ve_014` **Cami:** Para el agua, ingeniero. No pongas esa cara: si te desmayas, no te cargo. Ya me cargaste tú suficiente.

`ve_015` **Rikka:** ¡Cami! Hay niños en esta playa.

`ve_016` **Cami:** No hay nadie en esta playa.

`ve_017` **Rikka:** Está Jair. Jair cuenta como niño en estos temas.

`ve_018` **Jair:** Gracias. Muy amable. Treinta años y sigo en la categoría infantil.

`ve_019` **Cami:** En la infantil y en la de «mira, pero no toca». Combo completo.

`ve_020` — Al final, los tres salen del puesto con trajes de baño pagados, otra vez, con la plata del traje rojo. Cami se tira en la arena como si el reino entero fuera su toalla. Rikka mete los pies en el agua con la solemnidad de un ritual, tapándose con los brazos lo que el traje de baño no tapa.

`ve_021` **Jair:** (Cuando escribía aventuras épicas, no pensé que la mitad sería gente tirada en la arena. Aunque eso sí lo habría jugado.)

`ve_022` **Cami:** Jair. Ponme crema en la espalda.

`ve_023` **Jair:** No traemos crema.

`ve_024` **Cami:** Ya sé. Solo quería ver tu cara. Vale más que la crema.

`ve_025` **Rikka:** Si alguien necesita, en la Primavera usamos aceite de flor de cerezo. Yo podría… ponérselo a quien lo necesite. A nadie en particular.

`ve_026` **Cami:** «Nadie en particular» tiene lentes y cara de deudor.

`ve_027` **Jair:** ¿Podemos hablar del clima? El clima está muy… climático.

`bp_001` — Pasan la tarde sin hacer nada útil, que en el Verano parece ser una disciplina sagrada.

`bp_002` **Cami:** Jair, ¿sabes nadar?

`bp_003` **Jair:** Sé flotar. Que es nadar sin ambición.

`bp_004` **Cami:** Como tu carrera.

`bp_005` **Jair:** Mi carrera flota perfectamente. Está estancada, que es distinto.

`bp_006` — Rikka construye algo en la arena con una concentración feroz: murallas, techos curvos y un puente diminuto hecho con una rama.

`bp_007` **Rikka:** La ciudadela de la Primavera. A escala.

`bp_008` **Cami:** Le falta la guardiana mirando el arroyo.

`bp_009` **Rikka:** Le falta que te calles.

`bp_010` — Cami se levanta, se sacude la arena del cuerpo con una lentitud que parece ensayada y camina hacia el agua.

`bp_011` **Cami:** Ingeniero. Si me ahogo, me haces respiración boca a boca.

`bp_012` **Jair:** No sé hacer eso.

`bp_013` **Cami:** Mejor. Así practicamos más.

`bp_014` **Rikka:** ¡Yo sé hacerlo! En la Primavera nos enseñan. Para emergencias. De verdad.

`bp_015` **Cami:** ¿Ah, sí? ¿Y con quién practicaste, sacerdotisa?

`bp_016` **Rikka:** Con… un muñeco de paja.

`bp_017` **Cami:** Entonces Jair te va a parecer un gran avance.

`bp_018` **Jair:** (Comparado con un muñeco de paja. Mi autoestima tocó fondo y empezó a cavar.)

`bp_019` — Cami se mete al mar. Rikka, después de dudar un buen rato, la sigue a pasitos, gritando cada vez que una ola le toca la cintura.

`bp_020` **Rikka:** ¡Está fría! ¡Está fría en lugares sagrados!

`bp_021` **Cami:** Bienvenida al mar. Aquí lo sagrado se moja igual que lo demás.

`bp_022` **Jair:** (Desde la orilla, la escena parece un comercial. De esos que pasan tarde y te hacen sentir solo.)

`bp_023` — Jair se queda en la arena cuidando las cosas: una pistola, una espada, un kimono doblado y su dignidad, que es lo que menos pesa.

`bp_024` — Una hora después, Jair tiene la cara roja, la nariz roja y los hombros de un color que no existe en la naturaleza.

`bp_025` **Rikka:** Jair… estás del color de mi kimono.

`bp_026` **Jair:** En mi ciudad hay sol todos los días y nunca me quemé. Vengo a otra dimensión y el sol me cobra intereses.

`bp_027` **Cami:** Te dije que te pusieras crema.

`bp_028` **Jair:** ¡No hay crema!

`bp_029` **Cami:** Por eso. Te lo dije igual.

`bp_030` **Rikka:** Ven. El aceite de cerezo también sirve para las quemaduras.

`bp_031` — Rikka le unta los hombros con un aceite que huele a primavera. Lo hace despacio, con un cuidado que no tiene nada que ver con las quemaduras.

`bp_032` **Jair:** (Nadie me había tocado los hombros desde el último examen médico de la empresa. Y ese doctor no olía a flores.)

`bp_033` **Cami:** Ya está. Ya se curó. Milagro. Siguiente.

`bp_034` **Rikka:** Todavía le falta la espalda.

`bp_035` **Cami:** La espalda se la pongo yo.

`bp_036` **Jair:** Nadie me va a poner nada en ningún lado, gracias, estoy bien, me encanta arder.

`bp_037` **Cami:** Mírenlo. Dos mujeres peleándose por untarlo y él elige la combustión.

`bp_038` **Jair:** (Es que la combustión, por lo menos, sé cómo termina.)

`bp_039` — Al atardecer aparece de la nada un vendedor de cocos, como aparecen los vendedores en todas las playas de todas las dimensiones.

`bp_040` **Vendedor de cocos:** ¡Cocos frescos! ¡Agua de coco para los forasteros! ¡Agua de coco para los quemados!

`bp_041` **Rikka:** Tres. Pago yo.

`bp_042` **Cami:** Claro. Con la plata de mi traje.

`bp_043` **Rikka:** …Con la plata de tu traje.

`bp_044` **Jair:** (Ese traje rojo ya pagó una posada, la hidromiel, un desayuno y ahora cocos. Es la prenda más rentable de la historia.)

`bp_045` — Toman agua de coco sentados en la arena. Por un rato, nadie habla. El mar habla por ellos.

`bp_046` **Cami:** ¿Sabes qué es lo peor de este lugar?

`bp_047` **Jair:** ¿Qué?

`bp_048` **Cami:** Que dan ganas de quedarse. Y yo no me quedo en ningún lado. No me sale.

`bp_049` **Jair:** (A mí me pasa al revés: me quedo en todos lados. Ese es el problema.)

`ve_030` — Rikka se queda quieta con el agua por los tobillos. Mira unas rocas negras al final de la playa, como si alguien la hubiera llamado desde ahí.

`ve_031` **Rikka:** Yo estuve aquí. Hace mucho tiempo.

`ve_032` **Jair:** ¿De vacaciones?

`ve_033` **Rikka:** Venía con una amiga. Nos sentábamos en esas rocas a ver el sol meterse en el agua. Ella decía que el mar era lo único que nadie podía gobernar.


### cg_recuerdo_verano

`ve_034` — Por un segundo, el recuerdo: dos siluetas en una roca negra, los pies colgando sobre el agua, el sol partido en dos por el horizonte. Una se ríe. No se le ve la cara.


### playa_verano

`ve_035` **Rikka:** Hace muchos años que no sé de ella.

`ve_036` **Cami:** ¿Qué le pasó?

`ve_037` **Rikka:** No lo sé. Un día dejó de venir. Y después dejó de estar.

`ve_038` **Jair:** (No sé qué decir. En mi mundo, cuando alguien deja de estar, le das me gusta a su última foto y sigues bajando.)

`ve_039` **Cami:** Bueno. Si aparece, que traiga crema.

`ve_040` **Rikka:** Le habrías caído bien. Era igual de insoportable que tú.

`ve_041` **Cami:** Entonces era perfecta.

`bq_01` — Más tarde, Cami encuentra una tabla de madera tirada en la arena y decide que es una tabla de surf, aunque en el Verano nadie sepa qué es eso.

`bq_02` **Cami:** En la nave teníamos un simulador para esto. Nunca lo usé, pero vi el tutorial.

`bq_03` **Jair:** Eso es exactamente lo que digo yo de todo.

`bq_04` — Cami se para en la tabla. La primera ola la tira. La segunda también. La tercera le arranca la tabla y se la devuelve en la cara.

`bq_05` **Rikka:** ¿Eso era a propósito?

`bq_06` **Cami:** Todo lo que hago es a propósito. Incluso esto.

`bq_07` **Jair:** (Es la primera vez que la veo perder contra algo. Y es contra el agua.)

`bq_08` **Cami:** Si te ríes, te ahogo.

`bq_09` **Jair:** No me estoy riendo. Estoy respirando con alegría.

`bq_10` — Mientras tanto, Rikka pesca. O lo intenta: se queda inmóvil con el agua por las rodillas y la espada en alto, esperando a que pase un pez.

`bq_11` **Rikka:** En la Primavera pescamos así. Paciencia y un solo corte.

`bq_12` — Pasa un pez. Rikka corta. El pez sigue de largo. Rikka cae al agua de cara.

`bq_13` **Rikka:** …Los peces del Verano son más rápidos.

`bq_14` **Cami:** Los peces del Verano no tienen quinientos años.

`bq_15` **Rikka:** ¡No tengo quinientos años! Tengo… más o menos quinientos años. Pero bien llevados.

`bq_16` **Jair:** (En mi borrador decía «más de quinientos». Mejor no se lo digo.)

`bq_17` — Al final pescan algo entre los tres: Cami lo asusta, Rikka lo corta y Jair lo… mira. Alguien tiene que mirar.

`bq_18` **Jair:** Trabajo en equipo. Yo hice la supervisión.

`bq_19` **Cami:** Como en tu oficina.

`bq_20` **Jair:** Como en mi oficina.

`bq_21` — Lo asan cuando cae el sol. Es el mejor pescado que Jair comió en su vida, y no lo dice, porque decirlo lo volvería real, y lo real siempre se termina.


### playa_verano_noche

`ve_050` — De noche encienden una fogata con ramas de palmera. El fuego cruje. El mar suena como una respiración muy lenta.

`ve_051` **Jair:** Rikka. ¿Qué es en realidad el Rey Malvado? No el cuento. Lo que sabes.

`ve_052` **Rikka:** Fue el primer rey de la Primavera. Dicen que gobernaba con una felicidad que se contagiaba. Que la fiesta de los cerezos duraba un mes entero y nadie pagaba tributo.

`ve_053` **Jair:** ¿Y qué pasó?

`ve_054` **Rikka:** Un día cambió. No poco a poco: de un día para otro. Como si alguien hubiera tomado su forma de ser… y la hubiera vuelto a escribir.

`ve_055` **Jair:** («Volver a escribir». Qué manera tan rara de decirlo, para alguien de este mundo.)

`ve_056` **Rikka:** Se volvió malvado. Y obtuvo un poder que ningún rey había tenido: gobernar no solo las cuatro estaciones, sino otros reinos. Otras dimensiones. Como si alguien se lo hubiera concedido.

`ve_057` **Cami:** La Federación. Mi dimensión.

`ve_058` **Rikka:** Hemos vivido siglos bajo su tiranía.

`ve_059` **Jair:** Pero en la ciudadela dijiste que el Rey Primavera mantenía la paz.

`ve_060` **Rikka:** Eso dicen todos. Yo también lo dije. Lo digo desde hace tanto que casi me lo creo.

`ve_061` **Rikka:** Pero hace mucho que lo sospecho: esto no es paz. Es una tiranía que aprendió a sonreír. Una paz falsa.

`bf_01` **Jair:** ¿Y por qué nadie dice nada?

`bf_02` **Rikka:** Porque la paz falsa también da de comer. Los mercados abren. Los niños corren por la calle. Nadie quiere ser quien diga que todo es mentira y arruine la fiesta de los cerezos.

`bf_03` **Jair:** (En mi mundo también pasa. Le dicen «estabilidad laboral».)

`bf_04` **Cami:** En mi dimensión fue igual. Primero la paz. Después los impuestos de la paz. Después la gente que desaparece por no pagar la paz.

`bf_05` **Rikka:** ¿Y nadie se rebeló?

`bf_06` **Cami:** Algunos. Los llamaron «planetas rebeldes». Mi planeta no quería entrar a la Federación. Entró igual.

`ve_062` — Después, Cami no dice nada más. Mira el fuego con la mandíbula apretada, y Jair entiende, sin que nadie se lo explique, que está pensando en sus padres.

`ve_063` **Cami:** Él se llevó a mis padres. No con sus manos: con las de la Federación. Igual cuenta.

`ve_064` **Jair:** Cami…

`ve_065` **Cami:** No. Nada de abrazos. Si me abrazas, lloro, y si lloro, te mato. Es un círculo.

`ve_066` **Jair:** (Me quedo quieto. Es lo que mejor sé hacer: quedarme quieto mientras alguien sufre al lado mío.)

`ve_067` **Rikka:** Por eso vamos por la espada. Para que nadie más tenga que quedarse quieto.

`ve_068` — Se quedan así un rato largo, los tres frente al fuego, hasta que el sueño los vence.


### playa_verano

`ve_070` **Jair:** Bueno. Basta de descanso.

`ve_071` **Cami:** Mírenlo. Dos días de playa y ya se cree líder.

`ve_072` **Jair:** Alguien tiene que decirlo. Si no, nos quedamos a vivir aquí, y yo no tengo para pagar ni una palmera.

`ve_073` **Rikka:** Me gusta cuando das órdenes.

`ve_074` **Cami:** Ay. Lo dijo en voz alta. Rikka, eso se piensa, no se dice.

`ve_075` **Rikka:** ¡Quise decir que es bueno tener un líder!

`ve_076` **Cami:** Claro. Un líder. Que da órdenes. Que te gustan.


### camino_estaciones

`ve_077` — Parten hacia el centro del reino ancestral. Otra vez días de camino, y las estaciones se mezclan: un tramo de nieve, un tramo de hojas rojas, un tramo de pétalos, un tramo de arena.

`tr_01` — El primer día caminan entre pétalos y hojas rojas. El segundo, Jair ya no sabe en qué estación está, y le duelen los pies en las cuatro.

`tr_02` **Jair:** ¿Falta mucho?

`tr_03` **Rikka:** Un poco.

`tr_04` **Jair:** ¿Cuánto es «un poco» para alguien de quinientos años?

`tr_05` **Rikka:** Dos días. O una década. Depende del clima.

`tr_06` **Cami:** Cárgalo, sacerdotisa. Yo ya lo cargué una vez… no, espera, él me cargó a mí. Entonces te toca a ti.

`tr_07` **Rikka:** ¡No voy a cargar a Jair!

`tr_08` **Cami:** Lo pensaste.

`tr_09` **Rikka:** ¡Por un segundo!

`tr_10` — En el tramo de nieve, Cami resbala y Jair la agarra del brazo. Ella se suelta enseguida, como si el contacto quemara.

`tr_11` **Cami:** No te acostumbres.

`tr_12` **Jair:** No me acostumbro a nada. Es mi estilo de vida.

`tr_13` — En el tramo de otoño, Rikka le pone a Cami hojas rojas en el pelo mientras duerme. Cami se despierta con una corona de otoño y no dice nada en todo el día. Pero tampoco se la quita.

`tr_14` **Jair:** (Es lo más tierno que vi en todo el viaje. Y lo vi solo yo. Qué desperdicio no tener batería.)

`tr_15` — Las noches son frías y largas. Duermen pegados al fuego, los tres, sin decir que duermen pegados.


### torre_estacionaria

`te_001` — Y entonces la ven: la torre estacionaria, en el punto exacto donde se tocan los cuatro reinos. Cada cara tiene su estación: nieve en una, hojas en otra, flores en la tercera… y en la cuarta, arena seca que nadie parece cuidar.

`te_002` **Jair:** (Esa la dibujé yo. Bueno, una parecida. En una servilleta, en una reunión que pudo haber sido un correo.)

`te_003` — En la entrada esperan dos mujeres con túnicas ceremoniales: una blanca, con escarcha en los bordes; otra de tonos ocres, con hojas bordadas. La del Invierno y la del Otoño.

`te_004` **Kira:** Esa túnica… Esa forma de caminar, como si el suelo te debiera algo.

`te_005` **Zaki:** La sacerdotisa de la Primavera. Rikka.

`te_006` **Rikka:** Kira. Zaki. Hace tanto…

`te_007` — Jair las mira y siente algo raro. Las dos se parecen a Rikka. No como hermanas: como si las hubieran hecho con el mismo molde y después les hubieran cambiado el color.

`te_008` **Jair:** (La misma cara. Los mismos ojos. Otra estación. Como cuando reciclas un modelo 3D y solo le cambias la textura.)

`te_009` **Cami:** ¿Son tus hermanas?

`te_010` **Rikka:** No. Todas las sacerdotisas nos parecemos. Siempre fue así. Nadie sabe por qué.

`te_011` **Cami:** Qué ahorro de presupuesto.

`te_012` **Kira:** ¿Qué hace la sacerdotisa de la Primavera tan lejos de su puente?

`te_013` **Rikka:** Necesitamos ir al espacio dimensional. A la torre del Oráculo.

`te_014` **Zaki:** …

`te_015` **Kira:** Por la espada.

`te_016` **Rikka:** Por la espada DELETE. Para terminar con el Rey Malvado.

`te_017` **Zaki:** Es una idea suicida.

`te_018` **Kira:** Es peor que suicida: es repetida. La intentaron cien antes que tú, y ninguno volvió a contarla.

`te_019` — Entonces las dos miran detrás de Rikka. Ven a Jair. Ven a Cami.

`te_020` **Zaki:** Ese es un forastero.

`te_021` **Kira:** Y la chica del traje azul también. No pertenecen a ninguna estación.

`te_022` **Cami:** La chica del traje azul tiene nombre y una pistola. Elige con cuál quieres conocerla.

`te_023` **Rikka:** Él puede ser el de la profecía.

`te_024` **Zaki:** ¿Él?

`te_025` — Las dos sacerdotisas miran a Jair de arriba abajo. Jair se acomoda los lentes, sonríe incómodo y saluda con la mano, como en una entrevista de trabajo que ya sabe que perdió.

`te_026` **Jair:** Hola. Mucho gusto. Vengo de más allá de esta existencia. Más o menos.

`te_027` **Kira:** No pertenece a ninguna dimensión. Eso es cierto: no huele a ninguna.

`te_028` **Cami:** Huele a sudor de cuatro reinos.

`te_029` **Zaki:** Aunque fuera él, no alcanza. La puerta al espacio dimensional se abre con las cuatro sacerdotisas. Somos tres.

`te_030` **Rikka:** Falta la del Verano.

`te_031` **Kira:** Hace muchos años que desapareció. Tú lo sabes mejor que nadie.

`te_032` — Rikka baja la mirada. Jair se acuerda de las rocas negras de la playa, de las dos siluetas, de la risa sin cara.

`te_033` **Jair:** (La amiga. La sacerdotisa del Verano era su amiga.)

`te_034` **Rikka:** Intentémoslo igual. Con tres.

`te_035` **Zaki:** Con tres no se abre.

`te_036` **Rikka:** Entonces que no se abra delante de mí. Prefiero verla fallar a quedarme con la duda otros quinientos años.

`te_037` **Kira:** … Está bien. Por la profecía. Y porque tus berrinches siguen siendo insoportables.


### torre_estacionaria_puerta

`te_038` — Las tres sacerdotisas se paran frente a una puerta de piedra sin manija. Tiene cuatro símbolos tallados: una flor, un sol, una hoja y un copo de nieve.

`te_039` — Juntan las manos. El aire se enfría, después se calienta, después huele a hojas mojadas. Tres símbolos se encienden. El del sol se queda apagado.

`te_040` **Zaki:** Ya está. No alcanza.

`te_041` — Jair da un paso hacia la puerta sin saber por qué. Cami también. Por un instante quedan los dos uno al lado del otro, frente a la piedra.

`te_042` **Voz:** > Llave activada. Paso abierto.

`te_043` — El sol se enciende. Los cuatro símbolos brillan a la vez y la puerta se abre hacia adentro, en silencio, como si siempre hubiera estado esperando.

`te_044` **Kira:** Eso… no lo hicimos nosotras.

`te_045` **Rikka:** La profecía.

`te_046` **Jair:** (¿Yo? No toqué nada. Juro que no toqué nada. Es lo que digo siempre que rompo producción.)

`te_047` **Cami:** No me miren a mí. Yo solo estaba parada.

`te_048` **Zaki:** Del otro lado no hay suelo. Se cae. Mucho. Y no se sabe adónde.

`te_049` **Cami:** Ya nos caímos entre dimensiones una vez. Tenemos práctica.

`te_050` **Jair:** (Práctica. La última vez casi me borro junto con una isla de cristal.)

`te_051` **Rikka:** Gracias. Si vuelvo, les traigo arena del Verano.

`te_052` **Kira:** Si vuelves, tráenos a la del Verano.

`tf_01` **Zaki:** Rikka. Una cosa más.

`tf_02` **Rikka:** ¿Qué?

`tf_03` **Zaki:** Al forastero lo miras distinto. Como se mira algo que uno no quiere perder.

`tf_04` **Rikka:** No lo miro de ninguna manera.

`tf_05` **Kira:** Lo miras de una manera muy concreta.

`tf_06` **Cami:** Gracias. Llevo semanas diciéndolo y nadie me cree.

`tf_07` **Rikka:** ¡Nos vamos!

`tf_08` **Zaki:** Y del otro lado no se separen. Lo que se pierde allá no se vuelve a encontrar.

`tf_09` **Jair:** (Como los calcetines en la lavadora.)

`tf_10` **Cami:** Tranquilas. Yo me encargo de que este no se pierda. Le pongo correa si hace falta.

`tf_11` **Jair:** No necesito correa.

`tf_12` **Cami:** Eso dicen todos los que necesitan correa.

`te_053` — Saltan.


### espacio_dimensional

`ed_001` — Caen. Otra vez. Pero esta caída tiene paisaje: un océano entero se derrama desde arriba, como una cascada sin principio, y se estrella contra un desierto que se lo traga sin mojarse.

`ed_002` — Y en el punto exacto donde el agua toca la arena, flotando, una isla de cristal.

`ed_003` **Jair:** Yo estuve aquí.

`ed_004` **Cami:** ¿Qué?

`ed_005` **Jair:** Esa isla. Cuando caímos la primera vez, después del Bastión. Se estaba borrando. Como cuando seleccionas algo y aprietas suprimir.

`ed_006` — Aterrizan en la isla. El cristal está entero. Debajo se ven otras franjas de colores, otros mundos a medio hacer. Esta vez no cruje.

`ed_007` **Rikka:** Aquí se tocan todas: el agua, la arena, el cristal. Las dimensiones que nadie gobierna.

`ed_008` — Más allá de la isla, el paisaje se vacía: una llanura gris, sin viento ni sombra, como una oficina un lunes a las siete de la mañana. En el centro, una torre altísima.


### torre_oraculo

`ed_009` **Cami:** La torre del Oráculo. Y yo que creía que era un mito.

`ed_010` **Jair:** (Torre altísima. Desolada. Carísima. Nadie sabe qué hay adentro y todos pagan por usarla. Sí: es Oracle.)

`ed_011` **Rikka:** Dicen que el Oráculo responde cualquier pregunta. Siempre que se la hagan bien.

`ed_012` **Jair:** Clásico. Si la consulta está mal hecha, te devuelve error. Y te cobra igual.


### torre_oraculo_interior

`or_001` — Por dentro, la torre es una escalera en espiral alrededor de un vacío. En cada piso hay columnas de piedra en filas, con nombres tallados en la base: «id», «nombre», «fecha_creacion», «borrado».

`or_002` **Jair:** (Cada piso es una tabla, y las columnas son columnas. Literalmente. Quien diseñó esto tenía cero imaginación. O sea: yo.)

`or_003` **Cami:** ¿Por qué hay un letrero que dice «licencia por núcleo»?

`or_004` **Jair:** Porque aquí te cobran por cada cosa que piensas. No toques nada.

`or_005` — En las paredes, entre piso y piso, hay tallados: líneas cortas, llaves, paréntesis, palabras raras en filas ordenadas.

`or_006` **Jair:** Esto… esto es Coffee.

`or_007` **Cami:** ¿Café?

`or_008` **Jair:** No. Bueno, sí. Es un lenguaje de programación. Lo usaba en el trabajo. Esa palabra, «brew», declara algo que no cambia. Esa otra, «pour», devuelve un valor.

`or_009` **Cami:** Para mí son garabatos. Garabatos con mucha autoestima.

`or_010` **Rikka:** Yo lo he visto antes.

`or_011` **Jair:** ¿Dónde?

`or_012` **Rikka:** En los archivos del palacio, en los pergaminos más viejos, los que nadie podía leer. Es la lengua de GENESIS. La lengua de la creación.

`or_013` **Rikka:** Dicen que fue la primera lengua. Con ella, el Gran Ingeniero formó el universo, palabra por palabra.

`or_014` **Jair:** (¿El universo de este juego está escrito en Coffee? Claro que está escrito en Coffee: GRAVITY usa Coffee. ¿Por qué me sorprendo?)

`or_015` **Cami:** Ah, sí. Eso. Yo también lo sabía.

`or_016` **Rikka:** ¿De verdad?

`or_017` **Cami:** Obvio. Lo estudié. En la escuela de… lenguas antiguas. Del espacio.

`or_018` **Jair:** (No lo sabía.)

`or_019` **Cami:** Te vi pensar que no lo sabía. Sigue subiendo.

`oc_001` — Suben. Y suben. La escalera no termina: solo cambia de piso, y cada piso tiene un letrero tallado.

`oc_002` — PISO 3: «USUARIOS». Las columnas tienen nombres de personas que Jair no conoce. Miles. Algunas están tachadas con una raya limpia.

`oc_003` **Rikka:** ¿Qué significan las rayas?

`oc_004` **Jair:** Que esos registros se borraron. O que alguien quiso borrarlos y no se animó a hacerlo bien.

`oc_005` **Cami:** ¿Y nosotros estamos?

`oc_006` **Jair:** No sé. Y no pienso buscar. Hay cosas que es mejor no consultar.

`oc_007` **Cami:** Cobarde.

`oc_008` **Jair:** Precavido. Es lo mismo, pero con mejor sueldo.

`oc_009` — PISO 7: «LOGS». Las paredes están cubiertas de líneas diminutas, una debajo de otra, sin fin: fechas, horas, cosas que pasaron.

`oc_010` **Rikka:** Es como un diario. Un diario de todo.

`oc_011` **Jair:** Es un registro de eventos. Todo lo que pasa queda anotado. Nadie lo lee nunca, hasta que algo explota.

`oc_012` **Cami:** Lee uno.

`oc_013` **Jair:** «Usuario dormido sobre el teclado. Autocompletando.» …Qué log tan raro. Sigamos.

`oc_014` **Cami:** ¿Qué decía?

`oc_015` **Jair:** Nada. Basura. Errores. Sigamos subiendo.

`oc_016` — PISO 12: «PAPELERA». Una sala llena de cosas tiradas: espadas rotas, coronas, mapas a medio dibujar, un dragón de piedra sin cabeza.

`oc_017` **Rikka:** ¿Qué es todo esto?

`oc_018` **Jair:** Lo que alguien hizo y después tiró. Ideas descartadas. Todo proyecto tiene una papelera así de llena.

`oc_019` **Cami:** ¿Y esa armadura con un letrero que dice «versión dos, mejor no»?

`oc_020` **Jair:** (Esa me suena. No sé de dónde. Mejor no pensarlo.)

`oc_021` **Rikka:** Mira, una flor de piedra. Está entera.

`oc_022` **Rikka:** Qué triste que alguien la haya tirado estando entera.

`oc_023` **Jair:** (A veces se tira lo que está entero. Porque no encaja. Porque no hay tiempo. Porque ya hay otra.)

`oc_024` — PISO 19: «PERMISOS». Una puerta con tres cerraduras y un letrero: «Solo administradores». La puerta está abierta de par en par.

`oc_025` **Cami:** Qué seguridad.

`oc_026` **Jair:** Seguridad empresarial: tres cerraduras y la puerta abierta porque a alguien le daba flojera usar la llave.

`oc_027` — PISO 23: una voz sale de las paredes, plana, sin emoción, como la de un contestador automático.

`oc_028` **Voz:** > ORÁCULO. Haga su consulta.

`oc_029` **Cami:** ¿Le podemos preguntar cualquier cosa?

`oc_030` **Rikka:** Dicen que responde todo. Si se pregunta bien.

`oc_031` **Cami:** Oráculo: ¿Jair es virgen?

`oc_032` **Jair:** ¡Cami!

`oc_033` **Voz:** > Error de sintaxis cerca de «Jair». Consulta rechazada.

`oc_034` **Cami:** No dijo que no.

`oc_035` **Jair:** ¡Dijo error de sintaxis!

`oc_036` **Rikka:** Oráculo… ¿dónde está la sacerdotisa del Verano?

`oc_037` **Voz:** > Registro no encontrado.

`oc_038` — Rikka se queda quieta un segundo. Después sigue subiendo, más rápido que antes, para que nadie le vea la cara.

`oc_039` **Jair:** Oráculo, ¿cuánto falta para la cima?

`oc_040` **Voz:** > Consulta válida. Respuesta disponible en la versión con licencia.

`oc_041` **Jair:** Sí. Definitivamente es Oracle.

`oc_042` **Cami:** Ni en la torre sagrada te dejan preguntar gratis.

`od_01` — PISO 27: «CACHÉ». Entran a una sala con una mesa, tres sillas y una ventana falsa.

`od_02` **Cami:** Esta sala ya la vimos.

`od_03` **Rikka:** No. Es la primera vez que subimos.

`od_04` — Salen por la puerta del fondo. Entran a una sala con una mesa, tres sillas y una ventana falsa.

`od_05` **Cami:** Esta sala ya la vimos.

`od_06` **Jair:** Es la caché. Guarda lo último que viste para mostrártelo más rápido. Aunque ya no sea cierto.

`od_07` **Rikka:** ¿Y cómo se sale?

`od_08` **Jair:** Hay que borrarla. O esperar a que expire.

`od_09` **Cami:** ¿Y cuánto tarda en expirar?

`od_10` **Jair:** Depende de quién la configuró. Si fui yo, nunca.

`od_11` — Pasan por la misma sala cuatro veces. A la quinta, Rikka se enoja, le da una patada a la mesa y la sala se borra como un dibujo de tiza bajo la lluvia.

`od_12` **Rikka:** Así se limpia la caché en la Primavera.

`od_13` **Jair:** (En mi oficina funciona igual.)

`od_14` — PISO 31: «TRIGGERS». El piso está lleno de baldosas con letras. Un letrero advierte: «Pisar una baldosa dispara un evento. No todos los eventos son buenos».

`od_15` **Cami:** Yo piso la primera.

`od_16` **Jair:** ¡No—!

`od_17` — Cami pisa una baldosa. Del techo cae confeti. Suena una música de fiesta. Una voz anuncia: «¡Felicidades, usuario número un millón!».

`od_18` **Cami:** …¿Gané algo?

`od_19` **Jair:** No. Es publicidad. Nunca ganas nada.

`od_20` **Rikka:** ¿Y esta baldosa, la que dice «DROP»?

`od_21` **Jair:** ¡Esa no! ¡Esa ni la mires! ¡Esa borra la tabla entera!

`od_22` **Rikka:** Qué palabra tan pequeña para algo tan grande.

`od_23` **Jair:** (Así son las peores. DROP. DELETE. Unas letras de más y te quedas sin trabajo.)

`od_24` — Cruzan saltando de baldosa en baldosa. Jair va primero, leyendo cada letra en voz alta como quien desactiva una bomba. Cami pisa exactamente donde pisó él. Rikka va última, pisando donde se le da la gana, y de milagro no pasa nada.

`od_25` — PISO 37: «RESPALDOS». Una sala llena de estatuas cubiertas con sábanas blancas.

`od_26` **Rikka:** ¿Qué son?

`od_27` **Jair:** Copias de seguridad. De… algo. No levanten las sábanas.

`od_28` **Cami:** ¿Por qué no?

`od_29` **Jair:** Porque, en mi experiencia, debajo de un respaldo siempre hay algo que alguien prefería no volver a ver.

`od_30` — Nadie levanta las sábanas. Pero cuando pasan, una se mueve apenas, como si debajo alguien respirara.

`od_31` **Rikka:** …Subamos más rápido.

`od_32` — PISO 41: «PAGOS». Un mostrador vacío con una campanita y un letrero: «Renueve su licencia para continuar».

`od_33` **Cami:** ¿Ahora hay que pagar para subir?

`od_34` **Rikka:** ¿Cuánto? ¿Cuánto cuesta? Me queda poco del traje.

`od_35` **Jair:** Tranquila. Nunca nadie atiende estos mostradores. Si tocas la campanita, te ponen en espera.

`od_36` — Rikka toca la campanita. Desde algún lugar empieza una música de espera, alegre y eterna.

`od_37` **Voz:** > Su consulta es importante para nosotros. Tiempo estimado de espera: 47 años.

`od_38` **Cami:** Cuarenta y siete años. Rikka, para ti eso es un fin de semana.

`od_39` **Rikka:** ¡No es gracioso!

`od_40` — Jair pasa por debajo del mostrador. Detrás hay otra escalera, sin letrero, sin licencia y sin campanita.

`od_41` **Jair:** Siempre hay una puerta de atrás. Siempre. La ponen los mismos que hacen los mostradores.

`od_42` **Cami:** ¿Y tú cómo sabías?

`od_43` **Jair:** Porque yo también dejo puertas de atrás. En todo lo que hago. Es lo único que hago bien.

`oc_043` — Suben los últimos pisos en silencio. Les arden las piernas. El vacío del centro parece más hondo en cada vuelta.


### oraculo_cima

`or_030` — Arriba de todo, en una sala redonda sin ventanas, hay algo que no tiene nada que ver con la piedra: una especie de ordenador. Una pantalla negra incrustada en un altar, con un cursor que parpadea.

`or_031` **Voz:** > ORÁCULO. Acceso restringido. Ingrese la clave.

`or_032` **Cami:** ¿Clave? Nadie nos dijo nada de una clave.

`or_033` **Rikka:** Los pergaminos no decían nada de eso. Solo decían que la espada esperaba.

`or_034` **Jair:** (Una clave. Si esto es Oracle, la clave por defecto es… no. No puede ser tan fácil.)

`or_035` — Jair se acerca al altar. El teclado tiene teclas de piedra. Sus dedos, sin pedirle permiso, escriben la clave de su computadora. La de su casa. La que usa desde hace años para todo, aunque le dijeron mil veces que no.

`or_036` — ••••••••••

`or_037` **Voz:** > Clave correcta. Bienvenido, usuario.

`or_037b` — Nadie lo nota, pero Cami no está mirando la pantalla. Está mirando los dedos de Jair.

`or_037c` — Mueve los labios en silencio, una vez, dos veces, como quien repite un número para no olvidarlo. Después vuelve a poner cara de que no le importa nada.

`or_038` **Cami:** ¿Cómo…?

`or_039` **Rikka:** ¿Cómo sabías la clave del Oráculo?

`or_040` **Jair:** No la sabía. Puse la de mi computadora.

`or_041` **Cami:** ¿Y funcionó? ¿La clave de la torre más sagrada de todas las dimensiones es la de tu computadora?

`or_042` **Jair:** (La misma que uso para el banco, el correo y Boringram. Seguridad informática nivel: yo.)

`or_043` **Voz:** > Reliquia sellada: DELETE. Para liberarla, compile el ritual.

`or_044` — La pantalla se llena de archivos: un proyecto entero, abierto delante de ellos, con huecos en el código como dientes que faltan.

`or_045` **Jair:** (Código ajeno, sin documentación y lleno de comentarios pasivo-agresivos. Me siento en casa.)

`or_046` **Jair:** (Bien. A compilar esto.)

> ⤷ continúa en `or_050`

`or_mx00` — Jair cierra el programa, se aparta de la pantalla y se frota los ojos.

> ⤷ si salidas_ide == 0 → `or_mx0_1` · si salidas_ide == 1 → `or_mx1_1` · si salidas_ide == 2 → `or_mx2_1` · si salidas_ide == 3 → `or_mx3_1` · si salidas_ide == 4 → `or_mx4_1` · si salidas_ide == 5 → `or_mx5_1` · si salidas_ide == 6 → `or_mx6_1` · si no → `or_mx7_1`

`or_mx0_1` **Jair:** (Estoy algo oxidado. Cinco años arreglando el código de otros y ya no sé escribir el mío.)

`or_mx0_2` **Cami:** ¿Y? ¿Salió la espada?

`or_mx0_3` **Jair:** Todavía no. Dame un minuto. O varios.

`or_mx0_4` **Rikka:** Tómate el tiempo que necesites. Ya esperé quinientos años; puedo esperar otro rato.

> ⤷ continúa en `or_mx90`

`or_mx1_1` **Cami:** ¿Otra vez afuera? La espada no se va a liberar sola porque la mires feo.

`or_mx1_2` **Jair:** Estoy… depurando. Mentalmente.

`or_mx1_3` **Cami:** Depurando. Así le dicen en tu mundo a mirar la pared.

> ⤷ continúa en `or_mx90`

`or_mx2_1` **Rikka:** Jair, respira. En la Primavera decimos que el que se apura se atraganta.

`or_mx2_2` **Jair:** (Y en mi oficina, que el que se atraganta se queda sin bono.)

`or_mx2_3` **Rikka:** Si quieres, te traigo agua. Bueno, aquí no hay agua. Te traigo ánimo.

> ⤷ continúa en `or_mx90`

`or_mx3_1` **Cami:** Si sales una vez más, te meto yo dentro de la pantalla. Con todo y lentes.

`or_mx3_2` **Rikka:** Y yo la ayudo.

`or_mx3_3` **Jair:** (Se pusieron de acuerdo. Eso nunca es bueno para mí.)

> ⤷ continúa en `or_mx90`

`or_mx4_1` **Rikka:** ¿Ya lo resolviste? Pusiste cara de haberlo resuelto.

`or_mx4_2` **Jair:** Es la cara que pongo cuando no entiendo nada.

`or_mx4_3` **Cami:** La conozco. La pusiste todo el viaje.

> ⤷ continúa en `or_mx90`

`or_mx5_1` **Cami:** Te propongo algo: yo le disparo a la máquina y tú le dices al Rey que fue un accidente.

`or_mx5_2` **Rikka:** ¡No le dispares a la reliquia más sagrada de todas las dimensiones!

`or_mx5_3` **Cami:** Era una propuesta. Para la lluvia de ideas.

`or_mx5_4` **Jair:** (Hasta Cami ya habla como en una reunión de oficina. La contaminé.)

> ⤷ continúa en `or_mx90`

`or_mx6_1` **Rikka:** Volví a leer los tallados de la escalera. No entendí nada, pero los leí con mucha fe.

`or_mx6_2` **Cami:** La fe no compila, sacerdotisa.

`or_mx6_3` **Rikka:** Lo que hace él tampoco compila, y nadie le dice nada.

`or_mx6_4` **Jair:** (Eso dolió más que el error.)

> ⤷ continúa en `or_mx90`

`or_mx7_1` **Cami:** Oye. Sé que puedes. Te vi saltar un puente roto cargándome. Esto es solo una pantalla.

`or_mx7_2` **Rikka:** Yo también creo en ti. Aunque no entienda nada de lo que haces.

`or_mx7_3` **Jair:** (Nadie me decía algo así desde la tesis. Y esa vez era por compromiso.)

`or_mx7_4` **Cami:** Ya. Suficiente cariño por hoy. Vuelve a esa cosa.

`or_mx90` **Jair:** (¿Y ahora?)


> **DECISIÓN**
- `or_mx90#0` Volver al IDE ⟶ va a `or_046` · salidas_ide = 1, salio_del_ide = true · solo si salidas_ide == 0
- `or_mx90#1` Volver al IDE ⟶ va a `or_046` · salidas_ide = 2, salio_del_ide = true · solo si salidas_ide == 1
- `or_mx90#2` Volver al IDE ⟶ va a `or_046` · salidas_ide = 3, salio_del_ide = true · solo si salidas_ide == 2
- `or_mx90#3` Volver al IDE ⟶ va a `or_046` · salidas_ide = 4, salio_del_ide = true · solo si salidas_ide == 3
- `or_mx90#4` Volver al IDE ⟶ va a `or_046` · salidas_ide = 5, salio_del_ide = true · solo si salidas_ide == 4
- `or_mx90#5` Volver al IDE ⟶ va a `or_046` · salidas_ide = 6, salio_del_ide = true · solo si salidas_ide == 5
- `or_mx90#6` Volver al IDE ⟶ va a `or_046` · salidas_ide = 7, salio_del_ide = true · solo si salidas_ide == 6
- `or_mx90#7` Volver al IDE ⟶ va a `or_046` · salidas_ide = 0, salio_del_ide = true · solo si salidas_ide == 7
- `or_mx90#8` Rendirse ⟶ va a `or_mxr1` · salio_del_ide = true · solo si salio_del_ide == false

`or_mxr1` **Jair:** Me rindo. No puedo. Esto me queda grande.

`or_mxr2` **Cami:** ¿Rendirte? ¿Después de cuatro reinos, una trampa, una taberna y una resaca?

`or_mxr3` **Rikka:** Me robaron la ropa por esto. Bebí hidromiel por esto. Me dejé ver en traje de baño por esto.

`or_mxr4` **Cami:** Nadie sale de esta torre hasta que esa espada esté en tu mano. Ni tú, ni tu orgullo.

`or_mxr5` **Jair:** (No me dejan rendirme. Es la primera vez que alguien no me deja rendirme.)


> **DECISIÓN**
- `or_mxr5#0` Volver al IDE ⟶ va a `or_046` · salidas_ide = 1, salio_del_ide = true · solo si salidas_ide == 0
- `or_mxr5#1` Volver al IDE ⟶ va a `or_046` · salidas_ide = 2, salio_del_ide = true · solo si salidas_ide == 1
- `or_mxr5#2` Volver al IDE ⟶ va a `or_046` · salidas_ide = 3, salio_del_ide = true · solo si salidas_ide == 2
- `or_mxr5#3` Volver al IDE ⟶ va a `or_046` · salidas_ide = 4, salio_del_ide = true · solo si salidas_ide == 3
- `or_mxr5#4` Volver al IDE ⟶ va a `or_046` · salidas_ide = 5, salio_del_ide = true · solo si salidas_ide == 4
- `or_mxr5#5` Volver al IDE ⟶ va a `or_046` · salidas_ide = 6, salio_del_ide = true · solo si salidas_ide == 5
- `or_mxr5#6` Volver al IDE ⟶ va a `or_046` · salidas_ide = 7, salio_del_ide = true · solo si salidas_ide == 6
- `or_mxr5#7` Volver al IDE ⟶ va a `or_046` · salidas_ide = 0, salio_del_ide = true · solo si salidas_ide == 7

`or_050` — La pantalla se pone verde. El altar tiembla. Del suelo sube una luz blanca y, en el centro de la luz, aparece una espada.

`or_051` — No tiene adornos. Es sobria, casi aburrida, como una herramienta. En la hoja, grabado en letras que solo Jair puede leer, dice: DELETE.

`or_052` **Rikka:** La espada DELETE. Existe.

`or_053` **Cami:** Compilaste un milagro.

`or_054` **Jair:** (Compilé un milagro. Con ciento doce advertencias.)

`or_055` — Jair la toma. Pesa menos de lo que esperaba. Pesa como un teclado.

`or_056` **Jair:** Bueno. Ahora sí.

`fin_001` — Y entonces la sala se llena de pasos.

`fin_002` — La guardia del Rey Malvado entra por todos lados a la vez, como si hubiera estado ahí desde siempre, esperando a que alguien hiciera el trabajo difícil.

`fin_003` **Cami:** Atrás de mí.

`fin_004` **Guardia del Rey:** La espada. Y los tres. El Rey quiere verlos.


> **DECISIÓN**
- `fin_004#0` Quedarte quieto ⟶ va a `fin_005`
- `fin_004#1` Atacar con la espada DELETE ⟶ va a `bad_delete_01`

`bad_delete_01` **Jair:** (Tengo la espada que borra. Uso la espada que borra. No puede ser tan difícil.)

`bad_delete_02` — Jair levanta la espada DELETE. La hoja se ilumina y en el aire, delante de él, se escriben letras blancas, una por una, como en una consola:

`bad_delete_03` — DELETE FROM usuarios WHERE nombre = 'Jair';

`bad_delete_04` **Jair:** ¡No, no, no, eso no! ¡El WHERE está mal! ¡Está al revés!

`bad_delete_05` **Cami:** ¿Qué es un «güer»?

`bad_delete_06` — La espada no espera a que lo arregle. Las espadas nunca esperan.

`bad_delete_07` **Voz:** 1 registro eliminado. Usuario: sesión terminada.

`bad_delete_08` **Rikka:** ¿Jair? …¿Jair?


### PANTALLA:negro

`bad_delete_08z` — WHERE nombre = 'Jair'

> **BAD END: WHERE nombre = 'Jair'**

---

### oraculo_cima

`fin_005` **Rikka:** Sobre mi cadáver.

`fin_006` **Guardia del Rey:** Eso también se puede arreglar. Pero el Rey los prefiere vivos.

`fin_007` **Jair:** (Siempre igual. Yo hago el trabajo y otro se lleva el mérito. Como en la oficina.)

`fin_008` — Son demasiados y la torre no tiene salida. Los rodean y los empujan hacia la escalera.


> **DECISIÓN**
- `fin_008#0` Bajar sin resistirte ⟶ va a `fin_009`
- `fin_008#1` Saltar al vacío del centro de la torre ⟶ va a `bad_vacio_01`
- `fin_008#2` Ofrecerle tus ahorros al guardia ⟶ va a `bad_soborno_01`
- `fin_008#3` Hacerte el muerto ⟶ va a `bad_muerto_01`


### torre_oraculo_interior

`bad_muerto_01` **Jair:** (Si me hago el muerto, me dejan. En los documentales les funciona a las zarigüeyas.)

`bad_muerto_02` — Jair se tira al piso, cierra los ojos y saca la lengua. Es la peor actuación en la historia de las dimensiones.

`bad_muerto_03` **Cami:** ¿En serio? ¿Ahora?

`bad_muerto_04` **Guardia del Rey:** Este se murió. Al vacío con él.

`bad_muerto_05` **Jair:** ¡Resucité! ¡Milagro! ¡Estoy vivo!

`bad_muerto_06` **Guardia del Rey:** Tarde.

`bad_muerto_07` **Voz:** Usuario: declarado muerto por voluntad propia. Sesión terminada.


### PANTALLA:negro

`bad_muerto_07z` — Zarigüeya

> **BAD END: Zarigüeya**

---

### torre_oraculo_interior

`bad_soborno_01` **Jair:** Espera. Espera. Tengo dinero. Ahorrado. Mucho. Bueno, bastante. Bueno, algo.

`bad_soborno_02` **Guardia del Rey:** ¿Cuánto?

`bad_soborno_03` **Jair:** (No digas la cifra. Nunca digas la cifra.)

`bad_soborno_04` **Jair:** Suficiente.

`bad_soborno_05` **Guardia del Rey:** ¿En qué moneda?

`bad_soborno_06` **Jair:** …En la de mi dimensión. Está en el banco. Puedo hacer una transferencia si me prestan un celular con señal.

`bad_soborno_07` — El guardia lo mira un largo rato. Después mira a sus compañeros. Después se ríe, por primera vez en siglos, y la risa le dura justo hasta que deja de reírse.

`bad_soborno_08` **Voz:** Usuario: soborno sin fondos disponibles. Sesión terminada.


### PANTALLA:negro

`bad_soborno_08z` — Fondos insuficientes

> **BAD END: Fondos insuficientes**

---

### torre_oraculo_interior

`bad_vacio_01` **Jair:** (El vacío del centro. Si salto, caigo en algún lado. Siempre caigo en algún lado. Ya me pasó dos veces.)

`bad_vacio_02` — Jair se suelta, corre y salta hacia el vacío del centro de la torre.

`bad_vacio_03` **Cami:** ¡¿QUÉ HACES?!

`bad_vacio_04` — Cae. Cae. Cae. Pasan las columnas, los logs, la papelera. Pero esta vez no hay franja dorada, ni isla de cristal, ni bosque.

`bad_vacio_05` — El vacío del Oráculo no lleva a ninguna dimensión. Es solo eso: vacío. Decaf.

`bad_vacio_06` **Voz:** Usuario: valor nulo. Sesión terminada.

`bad_vacio_07` **Jair:** (Tercera caída. A la tercera se acabó la suerte. Como con los préstamos.)


### PANTALLA:negro

`bad_vacio_07z` — Valor nulo

> **BAD END: Valor nulo**

---

### oraculo_cima

`fin_009` — Lo último que Jair alcanza a ver es la pantalla del Oráculo, todavía encendida, con una línea nueva:

`fin_010` **Voz:** > Sesión activa. No cierre esta ventana.


### sin fondo

`fin_011` — Se los llevan ante el Rey Malvado.

> **FIN DEL CAPÍTULO 2** (no es un final: sigue en el capítulo siguiente)

---
