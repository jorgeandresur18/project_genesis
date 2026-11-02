# FINALES — PROJECT GENESIS

Los finales se registran aquí con un ID estable. Agrega los nuevos al final de la tabla. No modifiques los finales canon sin una orden explícita del autor.

| ID | Nombre | Pieza | Tipo | Estado |
| --- | --- | --- | --- | --- |
| `final_canon_1` | El Malo, "La Jaula Voluntaria" | Juego base | Canon | Escrito |
| `final_canon_2` | El Bueno, "The AnothergIrl" | Juego base | Canon | Confirmado, texto por completar |
| `alt_1` | Cancelar (nombre provisional) | Juego base | No canon | Definido, por escribir |
| `alt_2` a `alt_6` | Alternativos del juego base | Juego base | No canon | Por escribir |
| `gpp_1` a `gpp_4` | Finales de Génesis++ | Génesis++ | No canon | Por escribir |
| `gs_1` a `gs_4` | Finales de Génesis# (secuela del Capítulo 7B) | Génesis# | Por definir | Sin definir |

Total confirmado: 12. Con Génesis#, hasta 16. RikkaQuest no tiene finales.

## Detalle de los alternativos

- **`alt_1`, «Cancelar» (nombre provisional), Capítulo 3:** después del DELETE sin WHERE, Jair decide volver al mundo real **solo**, dejando a Cami y a Rikka. GENESIS le ofrece restaurar el juego (completo: 8 exabytes, unos 8.112 años; compactado: 5 petabytes, unos 6 meses). Jair pone «Cancelar». La historia termina en un final normal, con la pantalla sobria (sin rojo ni glitch). `[CANON]`

## Bad ends (game over) — aparte de los 12 `[CANON]`

Muertes o fracasos tempranos, estilo Shiny Days. No cuentan entre los 12 finales ni afectan a los canon. Al llegar a uno, la partida termina y vuelve al título. Se muestran en la galería en su propia sección.

| ID | Nombre | Capítulo | Decisión que lo dispara | Estado |
| --- | --- | --- | --- | --- |
| `bad_cap01_huida` | Nadie más se encarga | 1 | Al despertar, «Correr en dirección contraria» en vez de ir hacia la voz de Cami | Borrador |
| `bad_cap01_escudo` | Escudo humano | 1 | Ante el monstruo, «Esconderte detrás de Cami» | Borrador |
| `bad_cap01_patrulla` | Pendiente de revisión | 1 | En la patrulla, «Cruzar ya» a destiempo | Borrador |
| `bad_cap01_bastion` | Partida no guardada | 1 | Perder la pelea del Bastión (`batalla: "bastion"`, después de la máquina expendedora): los soldados los archivan | Borrador |
| `bad_cap01_capitan` | Un solo turno | 1 | Frente al capitán en el núcleo de la Grieta, «Pelear contra el capitán» | Borrador |
| `bad_cap01_acorazado` | Valiente, por una vez | 1 | En el invierno, frente al monstruo acorazado, «Enfrentar al monstruo» | Borrador |
| `bad_cap01_nikki` | Cachetadas infinitas | 1 | Escena secreta (con el Capítulo 1 completo): en el bar, «Propasarte» cuando Nikki pide el beso, y perder la pelea contra ella (`batalla: "nikki"`): Nikki llora sola sobre él y le grita idiota por morirse e irse de su vida. Cuenta para el 100 % | Borrador |
| `bad_cap02_prendas` | Lavandería sagrada | 2 | En la trampa del molino, «Agarrar primero las prendas de Rikka» | Borrador |
| `bad_cap02_hidromiel` | Hidromiel de la casa | 2 | En la taberna, cuando Cami dice «Bebe y no hagas cuentas», «Tomarte la jarra entera de un trago» | Borrador |
| `bad_cap02_espina` | Sin masticar | 2 | En el desayuno de la resaca, «Comer lo más rápido que puedas» | Borrador |
| `bad_cap02_mirada` | Mirada indiscreta | 2 | Mientras Rikka pelea con el traje rojo, «Mirar cómo se le sube el traje» | Borrador |
| `bad_cap02_abrazo` | Abrazo de metal | 2 | Cuando Cami entra en modo berserk, «Abrazarla para que se calme» | Borrador |
| `bad_cap02_jefe` | Reunión de seguimiento | 2 | Cuando Cami entra en modo berserk, «Darle órdenes como un jefe» | Borrador |
| `bad_cap02_delete` | WHERE nombre = 'Jair' | 2 | Ante la guardia del Rey, «Atacar con la espada DELETE» | Borrador |
| `bad_cap02_vacio` | Valor nulo | 2 | Al bajar la torre, «Saltar al vacío del centro de la torre» | Borrador |
| `bad_cap02_soborno` | Fondos insuficientes | 2 | Al bajar la torre, «Ofrecerle tus ahorros al guardia» | Borrador |
| `bad_cap02_muerto` | Zarigüeya | 2 | Al bajar la torre, «Hacerte el muerto» | Borrador |

Los nombres son propuestas por confirmar. El Capítulo 2 tiene 10: dos en la taberna y el desayuno de la resaca, cuatro en la pelea del almacén del molino (la trampa, Rikka con el traje rojo y el modo berserk) y cuatro en la captura de la torre del Oráculo.

Pelear contra el primer monstruo o contra los soldados no es un bad end: Jair lo intenta, sale mal, Cami lo salva y la historia sigue por el camino de siempre. Las opciones de pelear ya no se muestran tachadas.

## Finales tempranos — aparte de los 12 `[CANON]`

No son bad ends: no le pasa nada malo a Jair. Simplemente la historia no empieza. Se muestran en la galería junto a los finales, con una pantalla de final sobria (sin rojo ni glitch).

| ID | Nombre | Capítulo | Decisión que lo dispara | Estado |
| --- | --- | --- | --- | --- |
| `final_cap01_sin_bar` | Una noche normal | 1 | «Decir que estás cansado» a Nikki: no hay bar; sobrio, borra el correo de GRAVITY | Borrador |
| `final_cap01_anormal` | Una noche anormal | 1 | Escena secreta del bar: ganarle la pelea a Nikki bajándole la mitad de la vida (muy difícil). Ella se va llorando, a Jair lo echan del bar por pegarle a una mujer y en casa borra el correo sin abrirlo. En la pantalla del final, «normal» cambia a «anormal» con un glitch. **Opcional: no hace falta para el 100 %** (`opcional` en el registro). Premio: el caramelo rancio (+10 niveles) | Borrador |
| `final_cap01_rechazo` | La única vez que dijo que no | 1 | Apartar a Nikki cuando pide el beso y «Dejar que ella pida su taxi»: se va del bar; en casa Jair borra el correo de GRAVITY. Si en cambio elige «Pedirle el taxi», Jair empieza a pedirlo, se arrepiente, cancela el viaje y le pide que se quede; ella acepta un cóctel caro y la noche sigue normal | Borrador |
| `final_cap01_correo` | Spam | 1 | Frente al correo de GRAVITY, «Eliminar el correo» | Borrador |

## La noche que crea el juego `[CANON]`

La noche del bar con Nikki es lo que lleva a Jair a instalar GRAVITY y crear el videojuego. Si esa noche no ocurre (no va al bar), si la rechaza, o si borra el correo de GRAVITY, el juego nunca se crea y la historia jamás ocurre. Los tres son finales tempranos (`final_cap01_sin_bar`, `final_cap01_rechazo`, `final_cap01_correo`). Variable `noche`: `normal`, `sin_bar`, `rechazo` o `anormal` (la guarda la pelea con Nikki al ganarla, `premio.vars`).

Los finales de la tabla principal (canon, alternativos, Génesis++ y Génesis#) son del juego completo. Mientras no estén escritos no se muestran en la galería; el Capítulo 1 solo tiene bad ends y finales tempranos.

## Reglas

- Los dos finales canon ocurren en **dos líneas temporales diferentes**.
- Los alternativos y los de Génesis++ no son canon: no afectan a los canon ni se leen entre sí. Basta una variable `ruta` por pieza; no hay registro global de finales.
- Cada final debe tener condiciones explícitas y probadas por `npm run test:routes`.

## `final_canon_1` — El Malo, "La Jaula Voluntaria"

**Cómo se llega (borrador del autor; detalle en `docs/CANON.md`, «Capítulos 4 a 7»):** al principio del Capítulo 6, según cómo responde Jair sobre la verdad de Cami y Rikka. Rikka rompe la computadora de Jair y borra la restauración del mundo; ellas no desaparecen porque viven en los servidores de Noodle. Solo el Rey Malvado alcanzó a materializarse (sin la computadora no puede unir las dos realidades) e intenta llegar a los servidores de Noodle para retomar el control de la IA. Jair, Cami y Rikka lo detienen, pero pelean pésimo como equipo por la fragmentación emocional entre ellos y casi mueren. Noodle lo borra de sus servidores porque consume demasiada caché y, por el acuerdo legal que Jair aceptó, no puede borrar a Cami y Rikka: Jair paga una suscripción de 20 dólares al mes (con acceso anticipado a NoodleOS) para que sigan viviendo, inmortales, como humanas generadas por IA. Después viene el salto de un año y lo que sigue. **Génesis#** es su segundo epílogo.

Cami se encuentra con Jair. Se acerca de forma sumisa y tímida y dice que lo extrañaba; después de pasear lo besa, pide quedarse y promete no volver a irse. Jair cuenta que ahora le va mejor y que arregló sus cosas con Nikki: son solo amigos. En realidad Nikki tiene 4 meses de embarazo y el bebé es de Jair. Cami se va a vivir con él y tienen relaciones; no puede quedar embarazada porque no tiene órganos. Cami le pregunta si es la mejor creación de las dos y Jair dice que sí, aunque siempre le gustó más la versión real de Rikka. Aquí acaba la historia.

Escena final (borrador aprobado como "más simple"):

- —¿Estás pensando en el bebé?
- —No. Trato de no pensar en nada.
- —De todo lo que programaste... ¿fui yo tu mejor creación?
- —Sí. Eres mi obra maestra.

## `final_canon_2` — El Bueno, "The AnothergIrl"

Borrador del autor (reemplaza el resumen anterior; detalle en `docs/CANON.md`, «Capítulos 4 a 7»):

- **Qué lo dispara:** al principio del Capítulo 6, cómo responde Jair sobre la verdad de Cami y Rikka. La computadora de Jair no se apaga ni se destruye, y el Rey Malvado logra unir la realidad con el mundo de la IA.
- Noodle no puede hacer nada: sus servidores están cifrados y perdieron el acceso («debimos hacerle caso al tipo del foro de Remmit»).
- La única salida es la superllave: Cami y Rikka se fusionan en **AnothergIrl**, la llave completa, y Jair la activa. Nikki también ayuda.
- Derrotan al Rey Malvado y salvan la realidad, pero Jair borra todo lo generado por GENESIS, incluidos los datos de Cami y Rikka: esta vez no olvida el WHERE, y la realidad sobrevive.
- **Cierre:** pasa el tiempo. Jair es desarrollador web y hace un videojuego indie que pega un poco; Nikki es enfermera. Arreglaron sus problemas como amigos, se empiezan a frecuentar y forman una nueva relación.

## Alternativos del juego base (candidatos, no canon)

Variaciones temporales aisladas. Propuestas por confirmar:

- `alt_1` Ocho años: Jair y Nikki convierten la ambigüedad en relación; exige honestidad, límites y que Nikki afronte sus problemas sin delegarlos.
- `alt_2` La fantasía: Jair elige a Cami; ¿puede ella querer algo que él no previó?
- `alt_3` La autonomía: Jair elige a Rikka; su paciencia no debe ser obligación de soportar abusos.
- `alt_4` Ruptura: prioriza la verdad y la independencia de las heroínas.
- `alt_5` Responsabilidad: no elige a nadie, arregla su vida y apaga GRAVITY.
- `alt_6` Libre.

Puntos de bifurcación propuestos: capítulos 5 a 8, según decisiones previas.
