# Biblia del RPG — PROJECT GENESIS

Las reglas de las batallas por turnos. **Todas las peleas siguen estas reglas** salvo que la pelea diga otra cosa en
sus datos: esas excepciones son **eventos** y se anotan en la sección 12. Si una regla de aquí cambia, se cambia
aquí primero (y en el código y las pruebas en el mismo cambio).

- Datos de cada pelea: `src/data/batallas/<id>.json`. Reglas en código: `src/engine/batalla.ts` (cuentas),
  `src/engine/turnos.ts` (la lógica de turnos sin dibujo: el estado inicial, qué decide cada enemigo, los cebos y el
  fin del turno) y `src/components/Batalla.tsx` (la pelea en pantalla).
- Pruebas: `tests/batallas.test.ts` (datos completos y reglas), `tests/turnos.test.ts` (la lógica de turnos) y
  `tests/balance.test.ts` (miles de peleas simuladas).
- Para probar: `?batalla=<id>` en la dirección (ver `LINKS_PRUEBAS.txt`). Sprites: `?sprites`.
- Detalle técnico de cada función: `docs/SPEC.md` (sección «Batalla por turnos»). Esta biblia es el resumen de
  diseño: qué pasa y por qué.

---

## 1. Personajes y estadísticas

Cada luchador tiene cuatro estadísticas:

| Sigla | Qué es | Para qué sirve |
|---|---|---|
| PS | Puntos de vida | Con 0, cae. Un jefe nunca llega a 0: se retira (ver 8). |
| ATQ | Ataque | Cuánto daño hace. |
| DEF | Defensa | Cuánto daño quita al recibir. |
| VEL | Velocidad | Hoy no decide nada. Pendiente: que el más rápido actúe primero (ver 14). |

- Cada personaje tiene sus estadísticas en el nivel 1 (`base`) y cuánto sube cada una por nivel (`crece`).
  En el nivel N: `base + crece × (N − 1)`.
- **Movimientos que se aprenden** (`aprende`): al llegar a un nivel, el héroe aprende un ataque nuevo (sale el aviso). Jair, en el nivel 6: **Cebo**, una copia suya en blanco y negro, inerte (un solo cuadro, sin animación), que no hace nada; los golpes a uno solo pueden ir a ella en vez de a un héroe según cuánto cae en el cebo quien ataca (`cae_en_cebo`: los tontos o débiles, mucho; los listos, poco; si no se dice, 55 %; los de efecto nunca), y se deshace al primer golpe. Si nadie le pega, se evapora a los 3 turnos (`CEBO_TURNOS`). Uno a la vez: mientras haya un cebo en pie, la opción sale apagada y no se puede poner otro. Hoy: soldados 85 %, monstruo de sombras 35 %, Nikki 10 % (conoce a Jair). «El movimiento más básico de cualquier peleador, e inútil; sirve para escaparse del trabajo si el jefe no se da cuenta».
- **Experiencia:** cada enemigo que cae da `nivel del enemigo × 3` de experiencia a cada héroe de pie. Para pasar
  del nivel N al siguiente hacen falta `N × 10`. Al subir, las estadísticas pasan a las del nivel nuevo y los PS
  suben lo mismo que el máximo.
- **Se guarda en la partida al ganar** (o huir): nivel y experiencia de cada héroe (`nivel_<héroe>`, `xp_<héroe>`)
  y la mochila (`mochila_<objeto>`).
- **Al terminar una pelea, todos se curan** (decisión del autor, 2026-11-02): la vida no pasa de una pelea a otra y
  cada pelea empieza con todos curados. Entre peleas pasa la historia y se recuperan fuera de cámara; así ninguna
  pelea importante empieza injusta y cada una se equilibra por separado. Las curas sirven dentro de la pelea.
  Excepción posible, si la historia lo pide: una pelea puede empezar con alguien herido (un dato de esa pelea). Nivel 0 en la partida significa «todavía no peleó»: se usa el del .json.

Estadísticas de hoy (aproximadas, en el nivel con que aparecen):

| Quién | Nivel | PS | ATQ | DEF | VEL | Notas |
|---|---|---|---|---|---|---|
| Jair | 5 | 54 | 9 | 5 | 10 | Actúa todos los turnos. Pelea cuerpo a cuerpo. |
| Cami | 15 | 90 | 21 | 11 | 18 | Pega fuerte; descansa después de atacar (tobillo). Dispara de lejos. |
| Rikka (solo en la demo) | 10 | 77 | 15 | 9 | 14 | Espada. |
| Soldado enmascarado | 4 / 8 | 38 / 62 | 7 / 9 | 5 / 7 | 8 / 10 | La horda del Bastión. |
| Monstruo de sombras | 12 | 128 | 16 | 15 | 8 | Jefe del Bastión. Se retira al 30 % de sus PS. |
| Nikki | 20 | 102 | 19 | 4 | 15 | Jefa del bar. Se retira al 50 %. |

---

## 2. El turno

1. **Eligen los héroes** que pueden actuar, uno después del otro (Escape o «◀ Volver» vuelve al anterior).
2. **Actúan los héroes**, en ese orden.
3. **Actúan los enemigos**, en el orden en que aparecieron.
4. **Fin del turno:** se descuentan las parálisis, los clones pierden un turno (y se evaporan si llegan a cero), el
   juego puede ayudar (ver 9) y se para el que descansaba.

**Comandos** (al lado del menú, un cuadro dice qué hace cada opción):

Al elegir a quién atacar, el elegido brilla, tiene un anillo dorado a los pies y una flecha grande que rebota.

| Comando | Qué hace |
|---|---|
| Atacar | Un ataque y a quién; o el especial, si la barra está llena (★). |
| Hablar | El héroe le dice algo al rival. Un soldado puede distraerse (40 %) y perder su próximo ataque; al jefe no se lo distrae. Excepción: Nikki (ver 12). Según su estado, la frase sale distinta (solo cambia cómo se ve; funciona igual): **confundido**, incoherente y graciosa (`hablar_confundido` del personaje y `perdon.pide_confundido`; si no tiene, se le revuelven las palabras), con las letras chuecas pero legibles; **envenenado** o **quemado**, la misma frase cortada con quejidos (¡Arg!, ¡Ay!); **congelado**, solo «…». Quemado y congelado, cuando existan. |
| Esquivar | Ese turno cada golpe normal que le tiren puede fallar (50 % de base; los especiales le hacen la mitad, según el nivel y el estado: ver 3). El menú muestra la probabilidad real contra el rival de más nivel. |
| Objetos | Algo de la mochila, en él o en un compañero (revivir: en un caído). |
| Huir | Termina la pelea, si la pelea lo permite (`huir`). En el Bastión y en el bar, no. No gasta el turno. |

---

## 3. Daño, azar y críticos

- **Daño de un golpe:** `ATQ × poder / 10 − DEF del que recibe / 2`, por un azar de ±10 %. Mínimo 1.
- **Crítico:** 8 % de las veces, × 1,5 (sale «¡Golpe crítico!»). Si el juego está ayudando, más (ver 9).
- **Fallo:** un ataque normal falla solo, de los dos lados (el rival lo esquiva o el golpe no entra). Los especiales
  no fallan. Base 6 % (`fallo` de la pelea), y además (`PUNTERIA` en `src/engine/batalla.ts`):
  - **Nivel:** +1 punto por cada nivel que el que recibe le lleva al que ataca (cuenta hasta 10 niveles) y −1 por
    cada nivel de menos (hasta 5).
  - **Estado del que ataca:** confundido +10, envenenado +5.
  - **Contra un paralizado** (no se mueve) nunca se falla.
  - Queda entre 2 % y 30 %.
- **Los especiales no se esquivan:** siempre pegan, pero al que eligió esquivar ese turno le hacen **la mitad del daño**
  (salta igual y sale «¡A medias!»). Si el especial deja un estado (el veneno de la Mega Bola), le dura un turno menos.
  Así Esquivar sirve para algo claro: ver la barra del rival llena y protegerse. La cachetada de remate de la traición
  en el bar sigue sin poder esquivarse ni a medias.
- **Esquivar** (los ataques normales): golpe por golpe. Base 50 % (`esquivar` de la pelea), y además:
  - **Nivel:** ±2 puntos por nivel de diferencia con el que ataca (hasta 10 niveles).
  - **Estado del que esquiva:** confundido −20, envenenado −10. Quemado y congelado también restarán, cuando existan.
  - Queda entre 5 % y 80 %.
  - Ejemplo, el bar: Jair (nivel 5) contra Nikki (nivel 20) esquiva el 30 % y sus golpes fallan el 16 %.

---

## 4. La barra de especial

- Se llena (0 a 100) al **atacar (+22)**, **recibir un golpe (+12)**, **hablar (+12)**, **esquivar (+10)** y, los
  enemigos, **en cada turno suyo (+18)**. Un héroe la llena más o menos cada cuatro o cinco turnos.
- Con la barra llena, en Atacar aparece el especial. Sale un **aviso** de casi 2 segundos (una franja con líneas de
  velocidad del color del personaje, sus ojos en grande y el nombre del especial), un fogonazo y el especial.
- **Un especial dura 5 segundos**, con sus golpes repartidos en ese tiempo, y vacía la barra.
  Excepción: el de la sombra dura lo que su animación (unos 10,6 s).
- Cada especial dice `poder`, `golpes`, a quién va (`uno` o `todos`) y dónde se pone: junto a su objetivo o en el
  medio de la pantalla.

| Especial | De quién | Golpes × poder | Cómo |
|---|---|---|---|
| Ráfaga de puños | Jair | 6 × 7, a uno | Se acerca y pega muy rápido. |
| Lluvia de plasma | Cami | 8 × 5, a todos | Va al medio y dispara ráfagas desde cada pistola; las balas no tienen fin: siguen hasta salir de la vista. |
| Tajo de primavera | Rikka | 3 × 10, a uno | Lluvia de cortes. |
| Embestida de acero | Soldado | 5 × 8, a uno | Repite su ataque muchísimas veces. |
| Desgarro sombrío | Sombra | ver 8 | Vórtice que viaja, levanta por el aire y vuelve. |
| Ráfaga de cachetadas infinitas | Nikki | 10 × 6, a uno | Cachetadas de fuego. |
| Clon de sombra | Nikki | — | Segundo especial (ver 8). |

---

## 5. Estados

| Estado | Qué pasa | Cómo se ve |
|---|---|---|
| **Descanso** (Cami, por el tobillo; **solo en el Capítulo 1**: después se recupera) | Después de **atacar** (ataque o especial) no actúa el turno siguiente. Hablar, esquivar o usar un objeto no la cansan. | Se agacha apenas ataca («Cami necesita recuperarse de su dolor») y se para al terminar el turno en que descansó («Cami ya puede pararse»). |
| **Paralizado** | Pierde su turno, de 2 a 4 turnos (ver sección 19). **No se suma al descanso**: si Cami atacó y después la paralizan, al liberarse ya puede atacar. | Quieto en la pose de golpeado, temblando, con un brillo morado. |
| **En el aire** | Mientras dura el especial que lo levantó. | Arriba, en la pose de golpeado; al terminar cae con su sprite de derrotado y, si sigue vivo, se levanta. |
| **Caído** | 0 PS. No actúa. Se puede revivir. | Su fila «derrotado» (tirado, respirando) o, si no la tiene, la pose de golpeado. |
| **Confundido** (el beso de Nikki) | Durante 3 turnos, al atacar (ataque o especial) puede pegarse a sí mismo: 40 % el primer turno, 30 % el segundo y 20 % el tercero (`CONFUSION`). Hablar, esquivar y los objetos funcionan normal. Se le va al caer. | Tres corazones chicos que dan vueltas alrededor de la cabeza como un carrusel (delante, más grandes y nítidos; detrás, más chicos y tenues; desaparecen al caer); «confusión» en su tarjeta. |
| **Envenenado** | Pierde PS al final de cada turno, unos turnos (un jefe nunca baja de 1). El primer daño llega al final del turno siguiente al que lo envenenaron (decisión del autor, 2026-11-04). | Humo morado que le sale del cuerpo y sube; «veneno» en su tarjeta. |
| **Protegido** | Los próximos golpes (según el objeto) no le hacen daño: «BLOQUEA». | Un aura celeste suave alrededor del cuerpo, que respira; «protegido» en su tarjeta. |
| **Distraído** (por Hablar) | Pierde su próximo ataque. | — |

Cuando **sube una estadística** (un potenciador, un caramelo, subir de nivel) sale un aura verde que sube un instante; cuando **baja**, la misma, roja y hacia abajo.

---

## 6. Reglas de animación (todas las peleas)

1. **Quien recibe un ataque** (normal o especial) se queda con el sprite de golpeado **mientras dura el ataque**,
   hasta que el rival vuelve a su lugar. Nunca vuelve a la pose base con el rival al lado.
2. **En un especial**, los blancos se ven golpeados desde que empieza hasta que termina. Si esquivan un golpe, saltan
   y vuelven a la pose de golpeado.
3. **Quien cae por un especial** sigue golpeado hasta que termina la animación del especial del rival; recién ahí
   pasa a derrotado (y el enemigo se va).
4. **El último héroe derrotado** se queda golpeado hasta que el rival casi termina su ataque y **cae lento** (se
   inclina y se hunde); después queda con su sprite de derrotado. Sin zoom ni filtros.
5. **Un enemigo que aparece** entra con un fogonazo, como un portal.
6. **Esquivar** es un salto. **Pestañeo** en reposo, cada 2 a 6 segundos (fila `pestaneo`).
7. Cada golpe ilumina a quien lo recibe (destello del color del ataque).

---

## 7. Objetos (la mochila)

| Objeto | Qué hace | De dónde sale |
|---|---|---|
| Lata de agua | +30 PS | Botín (pesa doble) y la ayuda del juego. |
| Potenciador de ataque | ATQ +3 hasta el final de la pelea | Botín. |
| Potenciador de defensa | DEF +3 hasta el final de la pelea | Botín. |
| Recargador de especial | Llena la barra | Botín. |
| Revivir | Levanta a un caído con la mitad de su vida | El Bastión empieza con uno; a veces en el botín. |
| Caramelo rancio | Sube 10 niveles de golpe | Premio por ganarle a Nikki (ver 12). |
| Veneno para ratas (táctico, contra un rival) | Pierde 6 PS al final de cada turno durante 3 turnos | Por ahora solo en la demo; llega con la tienda. |
| Condón (táctico, a un compañero) | Protección: el próximo golpe no le hace daño | Por ahora solo en la demo; llega con la tienda. |

Cada objeto tiene su **tipo** (curación, mejora, permanente, táctico, equipo, colección) y **a quién se aplica** (a ti, a un compañero, a todo el equipo, a un rival o a todos los rivales); en la pelea, «Objetos» muestra solo los que sirven en pelea, y al elegir uno pide a quién solo si hace falta.

- **Botín:** cuando cae un enemigo, con 60 % de probabilidad suelta un objeto al azar de la lista `botin.objetos`
  (repetir un objeto en la lista lo hace más probable).
- Lo que no se usa **queda para las peleas siguientes** (se guarda en la partida).

---

## 8. Enemigos y su inteligencia

- **Ataque normal:** uno al azar de sus `ataques`, según su `peso` (si no tiene, 1), a un héroe al azar (o a todos, si el ataque es `todos`). Los de efecto (paralizar, confundir) solo van contra quien todavía no lo tiene.
- **Especial:** lo usa apenas tiene la barra llena, contra un héroe al azar.
- **Remate** (`remata`): si a un héroe le queda poca vida, usa su especial contra él aunque la barra no esté llena
  (Nikki: héroe con menos del 30 %, barra desde 60 %).
- **Ataque que paraliza** (`paraliza`, la «Parálisis de pesadilla» de la sombra): no hace daño; paraliza al blanco
  2 turnos. Solo va contra los que todavía se mueven: si nadie se mueve, ataca de otra forma.
- **Beso confusión** (`confunde`, Nikki): no hace daño. Su animación del beso y, cuando lo suelta, un corazón vuela derecho hacia el blanco, lo pasa y sigue hasta salir de la pantalla (`proyectiles` en su hoja). Al que alcanza (si no lo esquiva) lo deja confundido 3 turnos.
- **Ataque de lejos** (`proyectil` en su hoja): no se acerca. La media luna de la sombra sale de su brazo, vuela
  hacia el blanco, le pega al pasar y sigue hasta salir de la pantalla.
- **Especial que viaja y levanta** (la sombra): la pantalla se oscurece, se hunde en un vórtice que viaja hasta su
  blanco, sale junto a él y lo **levanta por el aire**, salta, golpea al aterrizar y vuelve hecha vórtice.
- **Clon de sombra** (`clon`, Nikki): desde media barra, pero muy pocas veces (el 8 % de las veces que puede; en el bar lo más común es el beso). Primero junta energía (un aura de su color que crece y late), después un destello corto y sale el clon. Le cuesta el 25 % de su
  vida máxima y el clon, hecho de sombra, tiene la mitad de su fuerza. El clon no usa especiales, no escucha, no da
  experiencia ni botín y se evapora a los 3 turnos. Solo hace uno a la vez, y nunca si gastar esa vida la deja al
  borde de retirarse. Al aparecer, Jair reacciona. Sale pegado detrás de ella (un poco más atrás en el piso y al
  costado), un 10 % más chico; si lo envenenan sigue hecho de sombra (el aura morada se suma). No se retira como el
  jefe: si le bajan la vida, cae.
- **Horda:** empiezan `al_inicio` enemigos; cada vez que cae uno, llega el siguiente hasta completar `niveles`.
  Después sale el **jefe**.
- **El jefe no muere: se retira** cuando le queda `huye_a` de sus PS, y ahí se gana. Puede retirarse con otra
  animación (Nikki llora; la sombra se hunde hecha vórtice y retrocede hasta salir de la pantalla).

---

## 9. La ayuda del juego (si van perdiendo)

Solo en las peleas que la piden (`ayuda`; hoy, el Bastión). Si la vida de todos los héroes, en promedio, baja del
35 %:

- al final de cada turno, el 30 % de las veces **cae del techo una lata de agua** a la mochila;
- sus golpes son **críticos un 10 % más seguido**.

---

## 10. Presentación

- **Fondo** de pixel art por pelea (`fondo`), un poco más oscuro para que los personajes se despeguen, con contorno,
  halo y sombra en el piso. Los enemigos se paran más atrás que los héroes (`enemigos_atras`: 1 en un pasillo con
  profundidad, 0 en el mismo piso).
- **Música** (`musica`, `musica_jefe`): la de la pelea manda mientras dura, en bucle con fundido; al terminar vuelve
  la de la escena. Hoy, «Battle Arcade» (créditos en `docs/CREDITOS.md`), comprimida para que suene a 16 bits.
- **Sonidos** de 8 bits sintetizados: cada personaje suena distinto al pegar (`sonido`: puño, cachetada, espada,
  disparo, media luna), y hay sonidos para el vórtice, la parálisis, revivir, salir volando, menús y escritura.
- **Textos:** la narración arriba; lo que dice alguien, abajo, con su retrato. Se escriben letra por letra con el
  sonido de escritura de la novela. Los números van con la letra de 8 bits (en la otra el 9 y el 4 se confunden), y
  la letra pixelada va sin ligaduras.
- **Entrada:** «¡X bloquea el paso!» o, en las peleas con `intro: "versus"`, la presentación del enfrentamiento
  (dos destellos, pantalla partida en diagonal con el color de cada uno, sus sprites, «VS» y un zoom).
- **Salida:** al terminar cualquier pelea, un destello y la pantalla a negro; la novela aparece desde negro.

---

## 11. Equilibrio (las metas)

Se miden con `tests/balance.test.ts`, que simula miles de peleas. Si un cambio saca una pelea de su rango, la prueba
falla.

| Pelea | Jugador | Meta | Hoy |
|---|---|---|---|
| Bastión | Descuidado (solo ataca, nunca usa la mochila) | Gana entre 10 % y 55 % | ~33 % |
| Bastión | Atento (cura al que baja del 40 %, usa potenciadores) | Gana 75 % o más, terminando con menos de la mitad de la vida | ~98 %, con ~35 % de vida |
| Hangar | Descuidado | Gana menos de 45 % | ~32 % |
| Hangar | Atento | Gana entre 55 % y 90 % | ~73 % (con Jair en nivel 5, el de su ficha) |
| Bar (Nikki) | Solo ataca | Gana entre 2 % y 15 % | ~5 % |
| Bar (Nikki) | Pide perdón desde el primer turno | (no tiene meta en la prueba) | ~99,7 % |

---

## 12. Eventos: peleas con reglas propias

Lo que cada pelea cambia respecto de estas reglas. Una pelea «normal» (las del Capítulo 2 en adelante) no debería
necesitar nada de esto.

### El Bastión (Capítulo 1, `bastion`)

- Jair (nivel 5) y Cami (nivel 15). **Cami descansa después de atacar** (`seguido: false`), por el tobillo vendado.
  Es lo único que la limita; desde el Capítulo 2 actúa todos los turnos.
- **No se puede huir:** Cami lo llama cobarde.
- Horda de 6 soldados (niveles 4, 4, 4, 8, 4, 8), de a dos; después el **monstruo de sombras** (nivel 12), con su
  música.
- **La ayuda del juego** está activa (ver 9). La mochila empieza con un **Revivir**.

### El bar (Capítulo 1, `nikki`)

- Sale con «Propasarte» cuando Nikki pide el beso (desde la primera partida). Presentación «VS».
- **Jair solo** (nivel 5) contra **Nikki nivel 20**, que pega fuerte y casi no recibe daño. No se puede huir.
  Nikki y Jair se paran en el mismo piso.
- **Hablar es pedir perdón:** tres turnos **seguidos** hablándole y la pelea termina (`perdon`). Hacer otra cosa en
  el medio (o hablarle al clon) vuelve a empezar la cuenta.
- **Ataques de Nikki:** cachetada (la más común), cachetada de revés y **beso confusión** (casi tan común como la cachetada). **Remata** con su especial y, muy de vez en cuando, hace el **Clon de sombra** (ver 8).
- **Tres finales de la pelea:**
  - Perdón: vuelve a la novela, cervezas fuertes, la noche sigue.
  - Pierde Jair: Nikki llora; imagen desbloqueable y bad end «Cachetadas infinitas».
  - Gana Jair (le baja la mitad): Nikki llora y se va, lo echan del bar y sale «Una noche anormal» (opcional para el
    100 %; premio: el caramelo rancio).

### El hangar (Capítulo 1, camino alternativo, `hangar`)

- Se llega con «Probar la nave grande» en el hangar (enciende la alarma). Jair y Cami (con el tobillo: descansa como en el Bastión).
- Horda: empiezan 2 soldados y llegan otros hasta ser 4 (niveles 6, 6, 8, 8); después sale el **Capitán de la Federación** (nivel 10; era 14 y después 12: el 2026-11-04, ya contando los 9 golpes del cañón, en nivel 12 el jugador atento ganaba solo ~32 %), que se retira al 35 % de su vida. No se puede huir. Perder: bad end `bad_cap01_hangar`.
- **El Capitán de la Federación:** ataca de lejos: cada ataque es una **ráfaga de 3 a 5 balas rojas** que salen de la punta del fusil, una por fogonazo de su animación (si son más de 3, la repite), hacia su blanco («Ráfaga de blaster», 4 por bala, 20 usos) o repartidas entre todos («Barrido rojo», 3 por bala, 10 usos); cada bala puede fallar o esquivarse. Su especial, el **Cañón de blaster**, se juega tal cual su sprite: hinca una rodilla y carga, suelta un rayo horizontal que sigue, ondulado, hasta el borde de la pantalla (golpe fuerte, 24, a su blanco) y después se vuelve loco y lo agita arriba y abajo (cada barrido le puede dar a cualquiera, 4). Cae poco en el cebo (0,3). Sprite: `public/batalla/capitan` (del HTML del autor; en el ataque se borran los rayos dibujados y el juego dispara balas desde la punta; en el especial, `rayo` dice dónde sale el rayo del cuadro para seguirlo).
- Fondo: el pasillo de instalación (`batalla/fondos/bastion`, con la ventana al hangar).

### Capítulo 2: plantillas de relleno (pedidas por el autor el 2026-11-03)

Están enganchadas para probar el flujo; **todo es provisorio** (niveles, enemigos, diálogos `[Relleno]`, fondos `PLACEHOLDER`). Perder **repite la pelea** (escena `cap02_pelea_<id>_derrota`) hasta que haya bad ends. Cami actúa todos los turnos. `TODO(canon)`: cada una.

| Batalla | Dónde sale | Quiénes | Rivales |
|---|---|---|---|
| `cap02_muralla` | `cap02_143` (Rikka cuenta que salió por la muralla) | Rikka sola (12) | 4 soldados (8–10), capitán 14 |
| `cap02_campamento` | `cap02_183` (la noche de guardia) | Jair 7, Cami 16, Rikka 12 | 5 soldados (8–10), capitán 16 |
| `cap02_molino` | `cap02_p2_071r07` (detrás de Rikka) | Jair 8, Rikka 13, Cami 17 | 6 soldados (10–12), capitán 16 |
| `cap02_molino_armored` | `cap02_p2_082` («un level up»), antes del berserk | Cami armored (20; usa el sprite de Cami), con el especial Armored | 4 soldados (10–12), capitán 18; **premio: el especial Armored** |

**El cassette del molino** (decidido por el autor el 2026-11-03) no es una pelea: es el cassette del especial **Armored** de Cami, que se gana al ganar la pelea de Cami armored. Es un **especial normal** (no un «especial+»): ocupa su segundo hueco de especial, comparte la barra, y al usarlo Cami se cubre con la armadura, entra en berserk, golpea a todos y vuelve a su traje. Al salir del molino, la Voz avisa (`cap02_p2_084v`, de relleno). Motor: `especiales_extra` en la ficha (se desbloquea con la variable `especial_cami_armored`). Falta el arte: el sprite de Cami armored y el berserk (por ahora usa su animación de especial).

### La demo (`demo`, solo para probar)

- Jair, Cami y Rikka contra la horda y la sombra. Se puede huir. Cami actúa todos los turnos (sin lo del tobillo). La mochila empieza con objetos para probar (revivir, veneno, condón, potenciador).

---

## 13. Cómo armar una pelea nueva

**Una sola ficha por personaje** (desde el 2026-11-03): cada héroe, cada enemigo, cada objeto y cada retrato está una
sola vez en `src/data/rpg/personajes.json`. Cada pelea (`src/data/batallas/<id>.json`) dice solo quién pelea, en qué
nivel y lo que cambia en esa pelea; `src/engine/batallas.ts` las junta (todo el juego y las pruebas leen de ahí).
Cambiar el especial de Cami, por ejemplo, se hace una vez en la ficha y vale para todas las peleas.

1. Copiar una pelea parecida en `src/data/batallas/<id>.json`.
2. **Los personajes:** `"personajes": { "jair": { "nivel": 5 }, "cami": { "nivel": 15, "seguido": false } }`. El nivel
   va siempre; lo demás, solo si cambia en esa pelea (en el ejemplo, la Cami del tobillo del Capítulo 1).
3. **Los enemigos y los objetos, por nombre:** `"enemigos": ["soldado", "capitan"]`, `"objetos": ["vida", "atq", …]`.
   Un personaje, enemigo u objeto nuevo se agrega primero a la ficha.
4. **Obligatorio en la pelea:** `titulo`, `fondo`, `heroes`, `horda`, `jefe`, `botin`, `esquivar`, `hablar`, `huir` y
   los `dialogos` de cada momento (inicio, refuerzos, jefe, jefe_huye, victoria, derrota, huir_no, huir, descanso,
   cae_jair, hablar_ok, hablar_no, esquiva_ok, botin). Los retratos salen de la ficha (`retratos` en la pelea solo
   para agregar uno propio).
5. **Opcional:** música, ayuda, mochila inicial, premio, presentación «VS», descripciones propias, `enemigos_atras`.
6. En la escena de la historia: `"batalla": "<id>"`, `"batalla_derrota": "<escena>"` y, si hay perdón,
   `"batalla_perdon": "<escena>"`.
7. Los sprites van en `public/batalla/<personaje>.png` y `.json`, exportados con
   `python -I tools/batalla_sprites.py "<html del autor>"`.
8. Correr `npm run test:routes` y `npm test`. Si es una pelea importante, agregarla a `tests/balance.test.ts` con su
   meta.
9. Si la pelea cambia alguna regla, anotarla en la sección 12 de esta biblia.

---

## 14. Tienda, monedas, objetos y equipo (diseño aprobado por el autor, 2026-11-02; por construir)

**La moneda del juego se llama tokens** (decidido por el autor el 2026-11-03): así se muestra en la interfaz, en los dos idiomas. En el código y en la partida la variable sigue siendo `monedas`.

**Tipos de objeto** (`tipo` en sus datos: decide dónde aparece y cómo se usa). Los objetos son snacks, bebidas y
cosas raras; los chistes van en las descripciones.

| Tipo | Qué hace | Ejemplos | Se gasta |
|---|---|---|---|
| Curación | Devuelve vida o saca de un estado | Agua (+PS), Revivir, algo que quite la confusión o la parálisis | Sí |
| Mejora temporal | Sube algo hasta el final de la pelea o por unos turnos | Snack de +ATQ, bebida de +DEF, energizante de +VEL, algo de +crítico | Sí |
| Mejora permanente | Cambia al personaje para siempre | Caramelo dulce (+1 nivel), ácido (−1), rancio (+10); suplementos que suben una estadística | Sí |
| Táctico | Un efecto sobre un rival o el equipo | Envenenar (daño cada turno, N turnos), confundir, paralizar, cebo; **protección**: a uno o a todos, el próximo golpe no les hace daño (p. ej. el condón: se le da a un compañero) | Sí |
| Equipo | Se equipa, no se gasta: estadísticas fijas y a veces un efecto pasivo | Ropa, armaduras, accesorios raros (+10 % de crítico, inmune a la confusión…) | No |
| Colección | No es de pelea | Imágenes inéditas: van a la galería | — |

- **A quién se aplica:** cada objeto lo dice (a ti, a un aliado, a todo el equipo, a un rival, a todos los rivales).
- **Equipo:** tres espacios por personaje: **cabeza** (un gorro…), **traje** (ropa, armadura, un vestido: no se separan pantalones) y **amuleto**.
- **Estados nuevos:** envenenado y protegido.
- **Monedas** (**hecho**): cada enemigo que cae da `nivel × 2` monedas (junto con la experiencia), y hacer retirar al
  jefe da `nivel × 5`. Los clones y los cebos no dan nada. Se guardan en la partida (`monedas`, como los niveles y la
  mochila; perder la pelea no las guarda) y se ven en el panel de Equipo. Hoy el Bastión da unas 124.
- **Boringplace es la tienda:** cada publicación es un objeto con su precio y «Comprar». «Tus artículos» es lo que
  tienes (mochila y equipo que no llevas puesto), para **vender a la mitad** de lo que cuesta. Los artículos que hay
  hoy son placeholders.
- **Dentro del juego** se compra y se vende para la partida en curso. **Desde el título**, para una partida guardada:
  arriba dice «Comprando para: …» (por defecto la más reciente; se puede elegir otra o la de «Continuar»); sin
  partidas guardadas, solo se mira. Así se puede terminar un capítulo, guardar, gastar desde el título y entrar al
  siguiente ya equipado. Cada partida tiene su propio dinero.
- **Botón «Equipo»** en la barra del juego (**hecho**, sin equipo todavía): pestaña Personajes (una ficha por
  personaje con su sprite, nivel, PS, ATQ, DEF, VEL, XP, ataques y los tres espacios de equipo) y pestaña Mochila (lo
  que tienes, con su tipo y descripción). **Hecho (2026-11-04):** ponerse y quitarse la ropa y usar fuera de pelea los permanentes (caramelos;
  los suplementos no tienen datos todavía): `src/engine/equipo.ts`. Las curas no se usan fuera de pelea: al terminar una pelea ya se curan.
- **En la pelea**, «Objetos» muestra solo lo que se usa en pelea.
- **Qué es de cada partida y qué no:** el dinero, la mochila, el equipo y los niveles son de cada partida (una
  partida nueva empieza vacía; no se pasa nada de una a otra). Lo desbloqueado en Boringram (fotos, pensamientos,
  historias, mensajes, notificaciones), la galería, los finales y el 100 % son de todo el juego y quedan siempre.
- **Boringplace abierto** (decisión del autor, 2026-11-02; reemplaza lo de «desde el Capítulo 2»): antes de ganar la pelea del Bastión dice que todavía nadie vende nada; al ganarla (`cap01_n06`) baja en la novela el aviso «Hay nuevos productos en Boringplace» y desde ahí se compra y se vende. **Hecho:** la pestaña «Tienda» (los objetos de las peleas con su dibujo, su precio en monedas y «Comprar»; precios en `src/data/boringplace.json`, «tienda»: propuesta de Claude) y, en «Tus artículos», lo de la mochila se vende a la mitad. Se compra dentro de una partida o, desde el título, para una partida guardada (arriba, «Comprando para:»; hecho el 2026-11-04).
- **Saltar con el mapa de escenas** conserva el dinero, la mochila, el equipo y los niveles de ahora (no los de la
  primera vez que se pasó por ahí).
- **Stock limitado (hecho, 2026-11-04):** lo permanente se vende de a poco por capítulo: un caramelo dulce (250 tokens) y
  un caramelo rancio (1.500) por capítulo (precios propuestos por Claude). Vender a la mitad impide ganar plata comprando y vendiendo.
- **Orden de construcción:** 1) tipos de objeto y estados nuevos (**hecho**); 2) monedas (**hecho**); 3) comprar y vender en Boringplace
  (**hecho**, en el juego y desde el título); 4) el panel de Equipo.

## 15. Repertorio, estados nuevos, colores y los objetos del autor (decisiones del 2026-11-02; por construir)

**Repertorio (aprobado):** cada personaje sabe como máximo **3 ataques** (normales o con efecto) y **2 especiales**:
5 en total. Hoy nadie se pasa (Nikki está justo en el máximo: 3 ataques, la ráfaga y el clon). Se pueden aprender
más: subiendo de nivel o **comprándolos en Boringplace** (pocos). Si ya tiene 3 (o 2 especiales), sale «Jair quiere
aprender X, pero ya sabe 3 ataques. ¿Olvida uno?» y el jugador elige cuál olvidar (o no aprenderlo). Los enemigos se
diseñan ya con 5 o menos.

**Caramelo premium (aprobado, por construir):** objeto mítico, ultra raro; también se vende en Boringplace por una cantidad enorme de monedas. Al comerlo, el personaje gana **un espacio más de especial**: su repertorio pasa a 6 (3 ataques y 3 especiales). Nikki es hasta ahora la única con los 6, porque se comió un caramelo premium que encontró en el bar, en una borrachera (canon del autor, 2026-11-04). Sus 6: Cachetada, Cachetada de revés y Beso confusión; Ráfaga de cachetadas, Clon de sombra y Mega Bola Tóxica.

**Mega Bola Tóxica (hecho, `bola_toxica` de Nikki):** su tercer especial. Animación «aura» de su hoja (levanta la mano en el cuadro 65 y la baja en el 120) y el sprite aparte `bola_toxica` (aparecer, flamas, explotar). Mientras carga, el escenario se tiñe de morado. La bola de energía tóxica nace chica en la palma, crece de más y, al bajar la mano, sale disparada y explota sobre los rivales con un destello blanco, una onda de luz morada y un temblor; los golpeados quedan tirados y se levantan: les pega a todos y **envenena a todos**, también a sus aliados (salpicados), menos a ella. **En la pelea del bar** solo la usa si le pidieron perdón y después la atacaron: al que la atacó lo deja con 2 PS y un veneno de 1 por turno que **no lo mata** (lo deja en 1), y en su próximo turno lo remata con una cachetada que **no falla**, aunque esquive (el final de esa traición es caer). **En una pelea normal** (la arena) sale al azar con la barra llena (peso 0,3) y pega fuerte (26 a cada uno, veneno de 6 por 3 turnos). Se ve igual en el probador y en la galería.

**Curación de Rikka (aprobado):** un **ataque básico** (no un especial) con el que **solo se cura a sí misma**: carga
y la rodea un aura del color de la curación. Cura el 35 % de su vida (propuesta). Animación: su hoja no tiene una
fila de curación; mientras tanto, su pose base con el aura.

**Usos de cada ataque (aprobado):** cada ataque puede tener un límite de veces por pelea (`usos`), que se ve en el
menú como «5/5». La curación de Rikka: 5/5. Sin `usos`, no tiene límite. Los usos se recuperan al terminar la pelea
(como la vida). El autor va a hacer objetos que los recuperan. **Hecho:** los ataques básicos de daño, 20 usos (los que pegan más, 15: Estocada, Ola de petróleo, Cachetada de revés); los de efecto, 5 (Parálisis de pesadilla, Beso confusión, el Cebo); la curación de Rikka, 5 (cura el 35 %, con el aura verde). Los enemigos solo eligen ataques a los que les quedan usos. Los textos de los ataques nombran a quien atacan (`{objetivo}`), no a Jair fijo.

**Los estados no se acumulan (hecho):** al que ya está paralizado, confundido o envenenado no se lo puede volver a poner en ese estado: sale «ya está…»; con un ataque se pierde el turno pero no el uso, y con un objeto el objeto vuelve a la mochila. Al salir de una parálisis, un turno de respiro: ese turno no se lo puede volver a paralizar (así nadie queda bloqueado toda la pelea). Los enemigos ya no eligen esos ataques contra quien no puede recibirlos. Cuando existan quemado y congelado, igual.

**La pelea del bar es la vida real (hecho, `vida_real`):** Jair todavía no entró a GENESIS, así que no cuentan los niveles ni la mochila del juego: pelea con el nivel del .json (5) y la mochila vacía («No tienes nada. Esto es la vida real: acá no hay mochila»), y al terminar no se guarda nada de eso, salvo el premio (los caramelos rancios). Así nadie llega «chetado» al bar, tampoco con una futura Nueva partida+.

**Pausa y guardado automático (hecho).** En la pelea, el botón ☰ (arriba a la derecha) abre la pausa: Seguir, Equipo (se mira, no se cambia: en una pelea no se equipa ni desequipa), Opciones y Salir al título (con aviso: la pelea se pierde). Al llegar a una pelea de la historia, el juego guarda solo («Antes de la pelea») **si y solo si hay un espacio vacío** (o en el del guardado automático anterior); nunca pisa un guardado del jugador. **Equipo:** cuatro espacios, en este orden: cabeza, traje, pies y amuleto; el panel muestra las fichas del grupo lado a lado (los lugares sin nadie, vacíos).

**Galería: Pixel art (hecho).** Una pestaña con los personajes del combate que ya aparecieron en una pelea. Cada acción (Ataque, Beso, Especial, Golpe, Derrotado) se desbloquea al verla en una pelea (`rpgVistos`: «hoja#acción»); la base, siempre. En el visor se ven los disparos, el beso, la media luna y el rayo como en la pelea, hasta el borde (el mismo componente que el probador: `src/components/EfectosSprite.tsx`). **Tamaños: la guía de estaturas** (`src/data/estaturas.json`): en el visor, el más alto (la sombra, 240 cm) llena el alto y los demás en proporción; en la pelea, `escala` = 1,08 × estatura / 165 (corregido por el alto de su cuerpo en el cuadro, `cuerpo` de la hoja).

**Ráfagas repartidas (hecho, `rafagas`):** la variante de la sombra («Ola de petróleo») suelta 3 medias lunas: con 3 rivales, una a cada uno; con 2, una a cada uno y la tercera al azar; con uno solo, las 3 a él. **El especial del Capitán es de selección:** el rayo horizontal le pega al elegido, y cuando lo agita arriba y abajo, los barridos les pegan a los otros (si está solo, a él). El rayo sale recto, como en el sprite, y sigue hasta el borde de la pantalla también cuando apunta arriba o abajo (en la pelea y en el probador).

**Ráfagas a todos (hecho):** los golpes de un especial «a todos» se reparten entre el equipo entero (contando a los caídos): si queda uno solo en pie, recibe su parte y nada más, no todos los golpes.

**Hablar según quién le habla a quién (hecho):** cada personaje le dice algo distinto a cada uno, según cómo se llevan, y el otro le contesta (si se distrae o no): `src/data/charlas_batalla.json` (por su hoja: jair, cami, rikka, nikki, soldado, sombra). Cami y Nikki se odian, Rikka y Nikki tienen media amistad (las Blueberries), Rikka y Cami se celan, Cami le dice cobarde a Jair; la sombra no habla (lo cuenta la Voz). **Pedirle perdón a Nikki es solo de Jair** (los demás le hablan a su manera). Si un par no tiene charla, se usa lo de siempre (`hablar` del héroe y `responde` del rival).

**Estados nuevos (aprobado):** quemado y congelado (además de los que ya hay):

| Estado | Qué pasa | Cómo se ve |
|---|---|---|
| **Quemado** | Pierde un poco de vida cada turno y pega a la mitad, 3 turnos. | Llamitas naranjas; el sprite, un poco rojizo. |
| **Congelado** | Igual que dormido y paralizado (decisión del autor, 2026-11-04; reemplaza lo de romper el hielo con un golpe): ver sección 19. | Azulado y quieto, con cristales. |

**Colores de cada acción y estado (aprobado):** cada cosa tiene su color, para que no se confundan.

| Qué | Color | Cómo se ve |
|---|---|---|
| Curación (agua, galletas, revivir, la de Rikka) | verde menta | aura que sube |
| Sube una estadística | dorado | líneas que suben |
| Baja una estadística | rojo | líneas que bajan |
| Daño | blanco y rojo | destello del golpe |
| Envenenado | morado | humo que sube |
| Paralizado | amarillo eléctrico | chispas y temblor |
| Confundido | rosa | corazones en carrusel |
| Protegido | blanco plateado | aura que respira |
| Quemado | naranja | llamitas |
| Congelado | azul hielo | cristales |
| Especial | el color de cada personaje | fogonazo y franja |

**En la tienda de Boringplace** (pedido del autor, 2026-11-03), la foto de cada objeto tiene el color de su tipo: curación, verde menta; mejora, dorado; para el rival, rojo; para un aliado (como el condón), plateado. Propuesta, sin aprobar: permanente (el caramelo), lila; equipo, azul; colección, gris.

**Equipo (aprobado):**
- **Hecho (2026-11-04):** las 9 prendas de la tabla (`src/data/rpg/personajes.json`), ponérselas y quitárselas desde Equipo (fuera de las peleas), sus efectos en la pelea y la compra de las 3 de la tienda (precios propuestos por Claude: gorro 120, jean 90, zapatillas 80; se compran una sola vez). ATQ y DEF van en `extra` y `extraDef`; VEL se ve y se guarda, pero hoy no decide nada. **Sin dueño todavía:** los trajes, la flor, la chaqueta de cuero y los zapatos no se consiguen en el juego hasta que el autor decida cómo. `TODO(canon)`: «resiste el veneno» se hizo como la mitad del daño (interpretación de Claude).
- Cuatro espacios: **cabeza, traje, amuleto y pies** (se suma pies a los tres de la sección 14).
- El equipo es **único**: no se compra (por ahora) y le pertenece a su personaje, aunque cualquiera puede ponérselo.
  Excepción: el **gorro de navidad**, que se compra en la tienda.
- **Jair empieza sin nada equipado.** **Nikki** lleva la chaqueta de cuero y los zapatos de plataforma.
- De quién es el resto (propuesta): Cami, el traje de combate azul; Rikka, el traje de combate rojo, las prendas de
  sacerdotisa y la flor de pureza.
- **Se compran en Boringplace:** el gorro de navidad, la chaqueta jean y las zapatillas buenas.

**Hecho (2026-11-04):** todos los consumibles de esta tabla (`src/data/rpg/personajes.json`), a la venta en Boringplace (precios propuestos por Claude). Se pueden usar en cualquier pelea. **Decisión del autor:** Hepatol quita solo el veneno; la galleta clásica solo sube vida; arcoíris, brownie y red velvet suben vida y quitan un estado (propuesta de Claude: el veneno, si no la quemadura y, si no, la confusión).

**Los objetos del autor** (sprites en `docs/sprites de prueba/objetos/`; nombres y efectos aprobados):

| Sprite | Nombre | Tipo | Qué hace |
|---|---|---|---|
| botella de agua | Agua sin gas | curación | +30 PS (reemplaza la lata de agua) |
| botella roja | Furia Roja | mejora | +3 ATQ en la pelea |
| pastillas azules | Pastillas azules | mejora | +3 DEF en la pelea |
| 4Low-Co | 4Low-Co | mejora | Llena el especial |
| caramelo rancio | Caramelo rancio | permanente | +10 niveles |
| caramelo dulce | Caramelo dulce | permanente | +1 nivel |
| Elixit | Elixit | curación | Revive con la mitad de la vida |
| Elixit++ | Elixit++ | curación | Revive con toda la vida |
| veneno para ratas | Veneno para ratas | táctico | Envenena a un rival |
| condón barato | Condón barato | táctico | Protege a un aliado de 1 golpe. Descripción: «Condón barato, sin marca». |
| condón Spartan | Condón Spartan | táctico | Protege a todo el equipo de 1 golpe |
| medicamento para el hígado | Hepatol | curación | Quita el veneno |
| galleta clásica | Galleta clásica | curación | +20 PS |
| galleta con grageas | Galleta arcoíris | curación | +20 PS a todo el equipo y quita un estado |
| galleta brownie | Galleta brownie | curación | +50 PS y quita un estado |
| galleta red velvet | Galleta red velvet | curación | +35 PS y quita un estado |
| flor de pureza | Flor de pureza | equipo (amuleto) | No se puede confundir |
| gorro de navidad | Gorro de navidad | equipo (cabeza) | +5 % de crítico; se compra |
| chaqueta de cuero | Chaqueta de cuero | equipo (traje) | +4 DEF |
| chaqueta jean | Chaqueta jean | equipo (traje) | +2 DEF, +2 VEL |
| suit azul | Traje de combate azul | equipo (traje) | +6 DEF |
| suit rojo | Traje de combate rojo | equipo (traje) | +4 DEF, +3 ATQ |
| traje de sacerdotisa | Prendas de sacerdotisa | equipo (traje) | +5 DEF, resiste el veneno |
| zapatillas | Zapatillas buenas | equipo (pies) | +3 VEL |
| zapatos de plataforma | Zapatos de plataforma | equipo (pies) | +2 DEF, −1 VEL |

---

## 17. PayFoe y el Torneo Genesis (decidido por el autor el 2026-11-03; por construir)

### Las dos billeteras

**Hoy PayFoe está escondida** (`payfoe_activo: false` en `src/data/juego.json`, decidido el 2026-11-03): el código y sus pruebas están, pero no se ve hasta que haya algo que comprar con ella (el torneo o los desbloqueables). Mientras, Boringplace usa solo los tokens de la partida.

| | Billetera de la partida (`monedas`) | **PayFoe** (del jugador, fuera de las partidas) |
|---|---|---|
| Se gana con | Las peleas de la historia (y vender lo de la mochila) | El Torneo Genesis y las transferencias desde las partidas |
| Compra | Objetos de pelea para esa partida | Desbloqueables (y la «versión sin censura») |
| Tope | — | **999.999 tokens** |
| Desde el menú | No se ve | Se ve y se usa |

- **PayFoe** es la parodia de PayPal (como Coffee de JavaScript y Oráculo de Oracle). La moneda son los **tokens**.
- **Transferir:** dentro de una partida, se pueden pasar tokens de la partida a PayFoe. **Nunca al revés** (lo farmeado no
  facilita la historia).
- **Contra la duplicación** (guardar, transferir, cargar el guardado viejo y volver a transferir): cada partida tiene un
  número (`partida_id`, al empezar) y un contador que solo sube, `tokens_ganados`. PayFoe anota cuánto recibió de cada
  partida y solo deja transferir lo ganado que no se transfirió todavía (y lo que haya en la billetera).
- **El tope y el chiste:** PayFoe no pasa de 999.999, pero **el jugador nunca lo sabe** (decidido por el autor el 2026-11-03): el número no aparece en ningún lado; al llegar sale solo «Límite de cuenta alcanzado. PayFoe lamenta tu éxito» y lo que sobra se pierde. La
  **legendaria versión sin censura** cuesta **1.000.000**: nunca se puede comprar y nunca muestra nada (al intentarlo:
  «Fondos insuficientes. Te falta 1 token»). Es solo un chiste; no hay contenido sin censura.

### El Torneo Genesis

- **Se desbloquea al terminar el Capítulo 1** y se va abriendo más a medida que avanza la historia (más copas, más
  peleadores).
- **Simple, doble y triple:** el tamaño de tu equipo (1, 2 o 3 peleadores). Los peleadores son los que la historia ya
  desbloqueó.
- **Cuatro rondas** hasta la final. Si pierdes, quedas eliminado pero te llevas los tokens de las rondas ganadas. Entre
  rondas se recupera parte de la vida.
- **Copas con dificultad creciente** (propuesta: Bronce → Plata → Oro → Leyenda); ganar una abre la siguiente y cada una
  paga más. En el torneo, **los niveles los fija la copa** (los tuyos y los de los rivales), así que no hace falta dar
  experiencia y no toca la historia. **Como en el competitivo de Pokémon** (decidido por el autor el 2026-11-03): en cada dificultad todos pelean **al mismo nivel**, alineados, sin importar cuánto subió cada uno en la historia; lo que cuenta es el equipo, los ataques y la mochila.
- **Los premios van a PayFoe.** Se puede repetir sin límite: es la forma de farmear desbloqueables.
- **Nikki es la campeona vigente** y está muy fuerte («chetada»): es la única con **seis ataques, tres normales y tres
  especiales**, y recarga sus especiales muy rápido. Cada vez que le ganas defiende el título más fuerte (más nivel,
  más objetos). En las copas siguientes van saliendo más personajes.
- **Hecho (2026-11-03, de relleno):** Extras › Torneo Genesis (`src/components/Torneo.tsx`, `src/engine/torneo.ts`,
  datos en `src/data/rpg/torneo.json`). Copas Bronce (nivel 10; se abre al terminar el Capítulo 1), Plata (20), Oro (35)
  y Leyenda (50), cada una al ganar la anterior. Cuatro rondas: cuartos (un «Soldado veterano» que se rinde), semifinal,
  final de llave (el Capitán) y la gran final contra **Nikki, la campeona** (sin el perdón del bar, se rinde recién con
  el 10 % de su vida, 70 % más de nivel que la copa, con escoltas según la modalidad, y +2 niveles por cada defensa del
  título). En doble y triple hay más rivales y de más nivel. Mochila fija (2 aguas y un Elixit). Los premios van a
  PayFoe (que se prendió con el torneo). **Balance (jugador atento, Copa Bronce; medido el 2026-11-04):** la final, ~32 % en simple, ~93 % en
  doble y ~99 % en triple (regalada, por balancear); las rondas anteriores, fáciles. Entre rondas la vida se recupera entera (pendiente: solo
  una parte).
- `TODO(canon)`: nombres de las copas, cuándo abre cada una, qué personajes salen en cada copa, los tres especiales de
  Nikki, los premios exactos.

---

## 18. Ataques intercambiables (decidido por el autor el 2026-11-03; por construir)

- **Cuántos se equipan:** **3 ataques y 2 especiales** por personaje (el autor todavía lo está pensando; propuesta
  inicial). El **caramelo premium** sube los especiales a **3**: es el premio más caro del juego, por ganarle a Nikki en
  la dificultad más alta del Torneo Genesis.
- **Los especiales comparten una sola barra** (decidido por el autor el 2026-11-03): cuando se llena, se elige cuál de
  los equipados usar.
- **Todo ataque tiene usos limitados por pelea** («5/5» en el menú; se recuperan al terminar), **menos los especiales**,
  que dependen solo de la barra.
- **Equiparse y desequiparse:** los ataques se pueden desequipar; si no hay espacio libre, van a la **mochila**. Solo
  **fuera de las peleas** (desde el panel de Equipo), nunca en medio de un combate.
- **Ataques propios y ataques sueltos:** los **originales** de cada personaje (los suyos de siempre: la Ráfaga de puños de
  Jair, el blaster de Cami, el Tajo de primavera de Rikka…) están **vinculados a su personaje**: solo los usa él y **no
  se pueden vender** («nadie te compra algo que solo puede usar un personaje»). **Solo algunos** ataques son sueltos:
  los puede usar cualquiera, se guardan en la mochila y se venden.
- **Los cassettes** (decidido por el autor el 2026-11-03; sprites del autor en proceso): cada ataque de la mochila es un
  cassette. **Solo los de los protagonistas tienen color**: Jair `#f0b54a` (acento `#ff8a1f`), Cami `#5ea8ff` (acento
  `#2f8cff`), Rikka `#ef4f5c` (acento `#ff4f8b`) y Nikki `#ff6fa5` (acento `#ff4f9a`), los de su caja de diálogo y su
  especial. **Los genéricos** (los sueltos)
  van en gris neutro `#c9ced6`.
- **De dónde salen:** se aprenden al **subir de nivel**; se compran en **Boringplace** o se ganan en el **Torneo Genesis**.
- **Vender:** los sueltos se venden en Boringplace y **se pueden volver a comprar**.
- **Hecho en el motor (2026-11-03):** cada héroe puede tener `especiales` (lista, hasta `MAX_ESPECIALES` = 2) además
  de su `especial` principal (el de su color y sus ojos); en el menú salen todos con la misma barra y se elige cuál.
  Para probarlo: la pelea demo (`?batalla=demo`), donde Jair tiene un segundo especial de relleno («Hotfix en
  producción»).
- **Hecho: el equipamiento (2026-11-03).** En el panel de Equipo, cada personaje muestra sus cassettes: los equipados
  (3 ataques y 2 especiales, con huecos libres) y los de la mochila (lo que conoce y no tiene equipado). Tocar uno lo
  equipa o lo guarda; siempre queda al menos un ataque; en una pelea solo se mira. Se guarda en la partida
  (`ataques_<héroe>` y `especiales_<héroe>`, los nombres separados por «|»; vacío: los primeros que conoce). La pelea
  usa lo equipado. Motor: `equipados` y `enMochila` en `src/engine/batalla.ts`; pruebas en `tests/equipo.test.ts`.
  **Los cassettes se ven** con un aura suave de su color; los de especiales, más brillo y un reflejo que los cruza
  (lujo); los de la mochila, más apagados (`src/components/Cassette.tsx`). Falta: comprar y vender los sueltos en
  Boringplace.
- **Hecho: los ataques nuevos (placeholder, 2026-11-03)** se aprenden al subir de nivel, por encima de lo que se alcanza
  en el Capítulo 1 (salvo con el caramelo rancio): Jair 7 Ctrl+Z (se cura 25 %), 8 Reunión que pudo ser un correo
  (paraliza 1 turno), 9 Excusa elaborada (confunde 2), 10 Commit a medianoche (26 de poder); Cami 16 Tiro certero
  (24), 18 Barrido de cobertura (9 a todos); Rikka 11 Pétalos al viento (8 a todos), 13 Postura de la guardiana (se
  protege). Todos con 3 a 6 usos. El motor de los héroes ahora sabe: golpear a todos (`objetivo: "todos"`, desde su
  lugar), aplicar un efecto como un objeto (`aplica`: veneno al blanco; con `alMismo`, protegerse o potenciarse) y
  confundir o paralizar.
- **Hecho: los cassettes sueltos (2026-11-03, placeholder).** En `sueltos` de `src/data/rpg/personajes.json`, con
  precio: Piedra (40 tokens; 9 de poder, 10 usos), Grito de guerra (60; ataque +3 a sí mismo, 2 usos), Botella rota
  (70; 6 de poder y envenena, 3 usos). Se compran en la tienda de Boringplace (grises, con su publicación y cuántos
  comprar) y se venden a la mitad en «Tus artículos» (los equipados no: primero se guardan); se pueden volver a
  comprar. Cuántos se tienen: `cassette_<id>` en la partida. Cualquier héroe se los equipa desde el panel de Equipo
  (aparecen en su mochila), pero **tantos a la vez como copias se tengan**. No se equipan solos: hay que elegirlos.
- **Ataques sin sprites nuevos (propuesta de Claude, placeholder):** usan la animación de ataque que ya tiene cada uno y
  los efectos que el motor ya sabe hacer. Jair: Ctrl+Z (se cura), Reunión que pudo ser un correo (paraliza 1 turno),
  Excusa elaborada (confunde), Commit a medianoche (golpe fuerte, 3 usos). Cami: Tiro certero, Barrido de cobertura
  (ráfaga a todos). Rikka: Pétalos al viento (a todos), Postura de la guardiana (se protege). Sueltos: Piedra, Grito de
  guerra (sube el ataque), Botella rota (envenena).
- `TODO(canon)`: la lista de ataques sueltos y de cada personaje, en qué nivel se aprende cada uno, sus precios, y si los
  especiales también pueden ser sueltos.

---

## 19. Mecánicas nuevas (pedidas por el autor el 2026-11-04; hechas el mismo día, con lo visual provisional)

Código: `src/engine/turnos.ts` y `src/engine/batalla.ts`; pruebas: `tests/mecanicas.test.ts`. La simulación del balance
no las usa (ni los cebos), porque ningún jugador simulado las elige.

**Dormido, congelado y paralizado** (la misma mecánica, decisión del autor; solo cambian el nombre y el color): **pierde su turno.** Dura de 2 a 4 turnos, al azar. Solo sale antes si **un compañero usa un objeto en él** (cualquiera que no sea para un rival); un golpe no lo saca. **Turno libre** (decisión del autor, 2026-11-04; antes era solo para la parálisis): al salir de cualquiera de los tres, sea porque se cumplieron los turnos o por un objeto, tiene un turno en que no se le puede poner ninguno de los tres, así que actúa seguro; y mientras tiene uno, no se le puede poner otro (no se pasa del sueño al hielo ni a la parálisis). Así nadie queda bloqueado toda la pelea, ni con los cebos. El número de `paraliza` en los datos ya no decide cuánto dura.

**En el 1 vs 1** (propuesta de Claude, a pedido del autor): sin un compañero de pie que lo saque, al héroe le dura de 1 a 2 turnos y se le pasa solo. Vale también si sus compañeros cayeron. A los rivales les dura siempre de 2 a 4.

**La Ráfaga de puños de Jair quema a veces** (pedido del autor, 2026-11-04): 10 % por cada uso del especial (una tirada, no una por golpe); «¡Los puños salieron en llamas!». Campo `quema` del especial.

**Quemado** (el de la sección 15, ya hecho): pierde el 5 % de su vida máxima cada turno y pega a la mitad, 3 turnos. Como el veneno, el primer daño llega al final del turno siguiente al que lo quemaron.

**Los cebos con efecto** (genéricos: cassettes grises en Boringplace, 5 usos). Funcionan como el Cebo, pero **al golpearlos
le causan el estado a quien los golpeó** (al terminar el ataque; si ya lo tiene, no se acumula). El sprite toma el color
del estado (provisional, con filtros):

| Cebo | Causa | Color | Precio (propuesta) |
|---|---|---|---|
| Cebo paralizante | Paralizado | Amarillo eléctrico | 80 |
| Cebo tóxico | Envenenado (6 PS, 3 turnos) | Morado | 80 |
| Cebo confuso | Confundido, 3 turnos | Rosa | 80 |
| Cebo caliente | Quemado | Naranja | 90 |
| Cebo frío | Congelado | Azul hielo | 90 |
| Cebo sueño | Dormido | Lila (propuesta) | 90 |
| Cebo explosivo | Le quita al que lo atacó el 25 % de su vida máxima y a su dueño el 10 % (calculado por Claude, por encargo del autor) | Rojo | 120 |

**Autodestrucción** (genérica; 200 tokens, 1 uso por pelea): el que la usa cae y todos los demás del campo (compañeros,
rivales y cebos) pierden el 50 % de su vida máxima (propuesta).

**Bomba del día del juicio** (especial genérico; cuesta la barra llena; no se vende): queda en medio del campo con la cuenta
regresiva y a los 5 turnos explota: todos los del campo pierden el 90 % de su vida máxima (propuesta). **No se desactiva.**
Una a la vez. Se gana en las peleas: cada enemigo que cae tiene un 2 % de soltarla (propuesta; no en la vida real ni en
la arena). **En el torneo** (decisión del autor): la primera vez que se gana cada copa; como el torneo está fuera de las partidas, el jugador elige a qué partida guardada va, y si no tiene ninguna, lo espera.

**El empate** (`resultado` en `turnos.ts`): si no queda ningún héroe y tampoco queda rival en pie, o el jefe, que nunca
cae, quedó por retirarse. **En la historia es perder:** lleva a la misma escena que la derrota, su bad end (decisión del
autor). En el torneo también cuenta como perder; en la arena, los caídos se levantan.

**Los jefes** (el autor lo dejó a criterio de Claude): la bomba y la autodestrucción no hacen retirar a un jefe por sí solas: lo dejan justo por encima de su límite y hay que darle el último golpe. Si la explosión se lleva a todos los héroes con el jefe en el campo, es empate.

## 16. Pendientes e ideas

| Tema | Estado |
|---|---|
| Que la **velocidad** decida quién actúa primero (héroes y enemigos mezclados) | Propuesto, sin aprobar. |
| **Monedas** al final de cada pelea, guardadas en la partida | Aprobado (ver 14). |
| **Tienda en Boringplace** | Aprobada (ver 14). Boringplace ya existe (se abre en el Capítulo 2; por ahora solo se mira). |
| Panel **«Equipo»** (estadísticas, equipo y mochila) en la barra del juego | Aprobado (ver 14). |
| **Cami actúa todos los turnos** desde el Capítulo 2, con enemigos de más nivel | Decidido por el autor; falta armar esas peleas. |
| La fila **«dolor»** de Cami | Reservada para más adelante. |
| **Pelea en el hangar** (camino alternativo del Capítulo 1) | **Hecha** (ver «El hangar» en la sección 12), con el sprite del Capitán del autor. |
| Retratos y sprite de batalla definitivos (hoy algunos son placeholders) | Esperando el arte del autor. |
| El Bastión, jugador atento: gana ~99 % (con la ayuda del juego). ¿Más difícil? | A decidir por el autor. |
| **Nueva partida+**: al terminar el juego, empezar de nuevo con los niveles y el equipo de la partida terminada, con los enemigos de más nivel para que siga habiendo desafío | Idea aprobada para más adelante (cuando el juego esté completo). |

---

## La batalla final y el Rey Malvado (decidido por el autor el 2026-11-03)

Detalle completo en `docs/BATALLA_FINAL.md`.

- **Capítulo 3:** pelea contra el Rey solo en su forma **THE KING** (en un momento crece y se vuelve gigante, sin ser
  otra fase), **con la cara oculta**. Termina con el DELETE sin WHERE.
- **Capítulo 6, rama que lleva al 7A (la batalla final del juego):** **cinco fases**, cada una con su sprite y su forma de pelear:
  THE KING → THE WATCHER → THE TRIAD → THE CATACLYSM → THE VOID.
- **Capítulo 6, rama que lleva al 7B:** THE KING, más fuerte que en el Capítulo 3; no se transforma. Rikka y Cami no logran fusionarse (conflicto de fusión), así que no hay AnothergIrl en esa pelea.
- **Por hacer:** las mecánicas de cada fase (ataques, especiales, cómo se pasa de una a otra, en qué fase entra
  AnothergIrl) `[PENDIENTE]`. Sprites: el autor pasa los borradores de las transformaciones; el de THE KING todavía
  no existe.

