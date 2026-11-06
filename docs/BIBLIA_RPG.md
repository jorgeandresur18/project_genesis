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
| VEL | Velocidad | **Decide el orden del turno** (decisión del autor, 2026-11-05): primero esquivar, protegerse o potenciarse, los objetos y los cebos (en el orden en que se eligieron); después héroes y enemigos mezclados, del más rápido al más lento (la de su nivel más la de la ropa). Empate: el héroe. Los refuerzos que llegan en el turno actúan al final de ese turno. El que queda dormido, congelado o paralizado antes de actuar pierde la acción. En el bar, Nikki está ebria: más lenta que Jair (`enemigos_cambios` de `nikki.json`). |

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
  sacerdotisa y la flor de pureza. **Decidido (2026-11-05):** la flor de pureza es la flor azul del pelo de Rikka, y Rikka **empieza la
  partida con ella puesta** en el amuleto (`puesto_rikka_amuleto` en `variables.json`); se puede cambiar desde Equipo.
  También empiezan puestas las **prendas de sacerdotisa** de Rikka y el **traje de combate azul** y la **placa de piloto** (amuleto,
  +5 % de crítico) de Cami. **Jair empieza sin nada** («el único desnudo es Jair»). **En las termas (Capítulo 2)**, cuando
  Nail roba las prendas, desaparecen de la partida (de la mochila o de quien las lleve) y Rikka queda con el **traje de
  combate rojo** puesto (lo que tuviera en el traje vuelve a la mochila): lo hace la decisión de esa escena con `equipo`.
  Cuando Rikka vende el traje rojo y vuelve con su kimono (`cap02_p2_092`), se pone otra vez las prendas y el traje rojo
  desaparece; desde ahí lo **revenden en Boringplace** (160 tokens, precio propuesto; `desbloqueo` de la fila de la tienda).
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
| pastelillo herbal | Pastelillo herbal | curación | Cura toda la vida, pero confunde 3 turnos a quien se lo come (pedido del autor, 2026-11-05; precio propuesto: 90) |
| pastillas felices | Pastillas felices | táctico | A un rival: lo confunde 3 turnos (pedido del autor, 2026-11-05; precio propuesto: 45) |
| CeBiDol | CeBiDol | permanente | +2 ATQ y +2 DEF para siempre; se toma fuera de las peleas, desde Equipo (pedido del autor, 2026-11-05; precio propuesto: 400, uno por capítulo) |
| Café de máquina | Café de máquina | mejora | +15 de barra y despierta a un aliado (propuesta de Claude, agregada el 2026-11-05; precio propuesto: 35) |
| Botiquín de oficina | Botiquín de oficina | curación | +30 PS a todo el equipo (70) |
| Antídoto universal | Antídoto universal | curación | Saca todos los estados (60) |
| Proteína «Smart Flab» | Proteína «Smart Flab» | permanente | +2 ATQ para siempre, fuera de las peleas (400, una por capítulo) |
| Crema antiarrugas | Crema antiarrugas | permanente | +2 DEF para siempre, fuera de las peleas (400, una por capítulo) |
| Caramelo ácido | Caramelo ácido | permanente | −1 nivel para siempre (nunca del 1), fuera de las peleas (100, uno por capítulo) |
| Equipo nuevo | (8 prendas) | equipo | Cabeza: gorra de repartidor (+2 VEL, 70), casco de obra (+4 DEF −1 VEL, 90), lentes de lectura (+5 % crítico, 110), vincha de anime (+3 ATQ, 100). Traje: camisa de oficina con mancha de café (+2 ATQ +2 DEF, 85), delantal de Billy's Beef & Beer (+5 DEF −2 VEL, 120). Pies: chanclas (+4 VEL −2 DEF, 50), botas de seguridad (+3 DEF −1 VEL, 75). |
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
- **Transferir:** **al terminar cada capítulo** (decisión del autor, 2026-11-06), en la pantalla de fin de capítulo, se pueden pasar los tokens ganados en la partida a PayFoe (antes se podía en cualquier momento, desde la billetera). En la billetera, dentro de la partida, se ve cuánto se podrá pasar. **Nunca al revés** (lo farmeado no
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
  desbloqueó. **Decisiones del autor (2026-11-05):** se puede **repetir personaje** en el equipo (por ejemplo, tres
  Jair); los **8 jefes de los pisos de la torre del Capítulo 3** (la reina de los bichos, el jefe de bodega, el sargento,
  el chef, el maestro herrero, el alcaide, el intendente y el comandante) se pueden elegir como peleadores (al vencerlos
  en la torre; los enemigos comunes, no); **Maggie** es exclusiva del torneo. **Hecho (2026-11-05):** los jefes se vuelven peleadores del
  jugador con sus ataques y su especial (sin las ráfagas de balas, que son del dibujo de la máquina; `fichaPeleador` en
  `engine/torneo.ts`) y frases para «Hablar» (`hablar_jefes` en `torneo.json`, borrador de Claude); se desbloquean al
  ganar su pelea en la torre, en cualquier partida (`torneo.jefes` en el guardado). Los repetidos tienen
  identificadores distintos (`jair`, `jair#2`). Las esencias del torneo se sortean al empezar cada uno.
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
  título). En doble y triple los rivales son de más nivel y **los equipos son parejos** (pedido del autor, 2026-11-05):
  el jefe de la ronda sale de entrada con su equipo, tantos rivales como peleadores (2 contra 2, 3 contra 3; en simple,
  el jefe solo); los soldados de más de la semifinal y la final llegan de refuerzo cuando cae uno (`jefe_con_horda`).
  Mochila fija (2 aguas y un Elixit). Los premios van a PayFoe (que se prendió con el torneo). **Balance (jugador
  atento / descuidado, Copa Bronce; medido el 2026-11-05):** doble 100/100, 98/87, 67/29 y la final 19/8; triple
  100/100, 98/88, 90/66 y la final 28/17 (antes, con el jefe al final de la horda, la final en triple era ~99 %). Entre rondas la vida se recupera entera (pendiente: solo
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

**Multicebo** (genérico, especial; cassette de Boringplace, 150 tokens, propuesta): con la barra llena, en vez de golpear deja un cebo normal (sin efecto) delante de cada héroe en pie; cada uno reemplaza el que ese héroe tenía. Con un solo héroe en pie, pone un solo cebo: es un desperdicio a propósito (decisión del autor, 2026-11-04).

**Autodestrucción** (genérica; 200 tokens, 1 uso por pelea): el que la usa cae y todos los demás del campo (compañeros,
rivales y cebos) pierden el 50 % de su vida máxima (propuesta).

**Bomba del día del juicio** (especial genérico; cuesta la barra llena; no se vende): queda en medio del campo con la cuenta
regresiva y a los 5 turnos explota: todos los del campo pierden el 90 % de su vida máxima (propuesta). **No se desactiva.**
Una a la vez. Se gana en las peleas: cada enemigo que cae tiene un 2 % de soltarla (propuesta; no en la vida real ni en
la arena). **En el torneo** (decisión del autor): la primera vez que se gana cada copa; como el torneo está fuera de las partidas, el jugador elige a qué partida guardada va, y si no tiene ninguna, lo espera.

**El empate** (`resultado` en `turnos.ts`): si no queda ningún héroe y tampoco queda rival en pie, o el jefe, que nunca
cae, quedó por retirarse. **En la historia es perder:** lleva a la misma escena que la derrota, su bad end (decisión del
autor). En el torneo también cuenta como perder; en la arena, los caídos se levantan.

**El estado «desaparecido»** (pedido del autor, 2026-11-05): lo causa un ataque que **banea** al rival del juego por un rato, como la Tajada del abismo. Durante esos turnos no actúa y nadie lo puede elegir, golpear ni curar (tampoco lo alcanzan la bomba ni la autodestrucción); sus otros estados quedan en pausa. Vuelve solo, desde el turno siguiente al que desaparece. **Nunca hace desaparecer al último héroe en pie.** Pero si después caen todos los demás y solo queda alguien desaparecido, **se pierde**: queda encerrado en el abismo para siempre (decisión del autor, 2026-11-05). Vale en todas las peleas: la historia, el torneo (quedas eliminado) y la arena. En el código: `desterrado` (`desterrar` en `turnos.ts`, `enCampo` en `batalla.ts`).

**Los especiales del Rey Malvado** (decisión del autor, 2026-11-05; Capítulo 3, en `cap03_rey`; la ficha `rey_gigante` queda para el Capítulo 6), los dos con la barra llena, uno al azar:

- **Espada de las estaciones:** golpes fuertes y, a cada blanco que queda en pie, una estación al azar: primavera envenena, verano quema, otoño paraliza e invierno congela (sin acumular, y respetando el turno libre).
- **Tajada del abismo:** un corte que abre una grieta: un rival al azar queda **desaparecido** de 2 a 3 turnos. Es para peleas contra varios: si el rival tiene un solo héroe en pie, el Rey no la elige.

Los números (poder y golpes) son propuesta de Claude, sin balancear.

**Los jefes** (el autor lo dejó a criterio de Claude): la bomba y la autodestrucción no hacen retirar a un jefe por sí solas: lo dejan justo por encima de su límite y hay que darle el último golpe. Si la explosión se lleva a todos los héroes con el jefe en el campo, es empate.

## 20. Los amigos de Jair en el Capítulo 4 (propuesta de Claude, por aprobar; 2026-11-05)

Lo que contó el autor está en `docs/CANON.md` (Capítulo 4, punto 5). Esto es la propuesta de cómo pelean: números y
ataques de borrador. **Dónde pelean** (decidido por el autor el 2026-11-05): **Jordy**, como rival en peleas de
entrenamiento contra Jair; **Billy**, del lado de Jair (héroe), los dos solos contra una horda de influencers
aprovechados en su restaurante; **Maggie**, solo en el Torneo Genesis (exclusiva).
Comparados con Jair (`base` PS 30, ATQ 5, DEF 3, VEL 8; sube por nivel PS 6, ATQ 1, DEF 0,6, VEL 0,5).

| | PS | ATQ | DEF | VEL | Cómo se siente |
|---|---|---|---|---|---|
| **Jair** (para comparar) | 30 (+6) | 5 (+1) | 3 (+0,6) | 8 (+0,5) | — |
| **Jordy** | 28 (+5,5) | 7 (+1,2) | 2 (+0,4) | 11 (+0,6) | Pega más y antes que Jair, pero aguanta menos. |
| **Billy** | 25 (+6,8) | 4 (+1,06) | 3 (+0,77) | 4 (+0,2) | El tanque: aguanta mucho y pega fuerte con su cuchillo-espada gigante, pero casi siempre actúa último. |
| **Maggie** | 26 (+4,5) | 3 (+0,5) | 2 (+0,4) | 13 (+0,7) | Muy veloz, casi no golpea y es frágil: su fuerza son los estados (dormir y confundir). |

**Ataques (nombres y efectos de borrador):**

- **Jordy** (parecidos a los de Jair; su puño paraliza):
  - *Puñetazo eléctrico:* poder 14, como el de Jair, y a veces (25 %) **paraliza**.
  - *Combo de calle:* dos golpes rápidos de poder 8.
  - *Ctrl+Z de gimnasio:* se cura un poco (como el Ctrl+Z de Jair).
  - Especial *Ráfaga relámpago:* varios golpes como la Ráfaga de Jair; el último paraliza.
- **Billy** (carne, cerveza y su restaurante; pelea con una espada grande con forma de cuchillo de carnicero):
  - *Corte de carnicero:* poder 17, un tajo pesado con la espada.
  - *Panzazo:* poder 12, empuja con la panza.
  - *Brindis:* sube su ATQ hasta el final de la pelea (potenciarse).
  - *Pastelillo de la casa:* le da a un rival un pastelillo herbal «con extra de compuesto T»: lo **confunde** (el guiño al objeto de la tienda).
  - Especial *Parrillada Beef Boy:* a todos los rivales, con un poco de **quemadura**.
- **Maggie** (ondas psíquicas e hipnosis clínica):
  - *Onda psíquica:* poder 8 a un rival (casi no hace daño).
  - *Hipnosis clínica:* lo **duerme** (como el cebo sueño).
  - *Lectura del subconsciente:* lo **confunde**.
  - Especial *Sesión de grupo:* ondas a todos los rivales; cada uno puede quedar dormido o confundido.

**Hecho en el motor (2026-11-05):** `deja` en un ataque o un especial: si pega, con su probabilidad deja un estado
(paralizado, dormido, confundido o quemado; con una lista, uno al azar). `dejarEstado` en `engine/turnos.ts`.

**En el torneo (pedido del autor, 2026-11-05):** Jordy, Billy y Maggie ya pelean en el Torneo Genesis con estas fichas
(borrador, `heroes` de `personajes.json`), elegibles desde ya (`TODO(canon)`: cuándo se desbloquean Jordy y Billy). Sin
hoja propia: usan la de otro con un filtro de color (Jordy la de Jair, Billy la del soldado, Maggie la de Rikka). Nikki
también es peleadora, **desde el inicio** (pedido del autor). Como peleadora tiene **5 ataques**; la Nikki campeona del
torneo, 6 (`TODO`: hoy tiene 4: cachetada, revés, beso y la ráfaga; el quinto queda para mucho más adelante, anotado en el
cronograma, «Ideas anotadas»).

**El influencer y el otaku** (pedido del autor, 2026-11-05; los otakus son los de la convención del Capítulo 4):
también peleadores del torneo, desde ya (borrador; sprites prestados: la hoja de Nikki y la de Jair con filtro).
- **Influencer**: Selfie con flash (a veces paraliza), Unboxing violento, Colaboración pagada (se cura) y el especial
  *Transmisión en vivo* (a todos). **Seguidores** (`seguidores` en la ficha): cada vez que se luce (un crítico o
  derribar a alguien) gana uno, hasta 5, y cada uno le suma +2 de ataque; por cada turno sin lucirse pierde uno.
- **Otaku**: Foto sin permiso (a veces paraliza), Explicación del lore (a veces duerme), Abrazo de almohada (se
  protege) y el especial *Técnica prohibida del episodio 400* (a veces confunde).
- Simulación en simple (final, atento): los dos a la par de Jair (~32–73 %). **Simulación en simple (final, atento):**
Billy ~76–90 % (equilibrado el 2026-11-06: el autor quiere que haya peleadores un poco más fuertes, sin que se note tanto; Billy es uno, apenas por encima de Jordy y el que más aguanta), Jordy 63–76 %, Maggie y Nikki ~0 % (el simulador no usa dormir ni confundir:
las subestima).

**Arte que haría falta** (para la fase de arte): las hojas de pelea de Jordy, Billy y Maggie (reposo, ataque, daño,
especial, derrotado) y sus retratos para la caja de diálogo; mientras tanto, placeholders (como el Rey con el dibujo
del Capitán).

## 21. La esencia (idea del autor, diseño aprobado el 2026-11-05; **hecha** el mismo día)

**Hecho:** `src/engine/esencia.ts` (el sorteo con semilla), los efectos en `engine/batalla.ts` y `engine/turnos.ts` (temple: el estado dura un turno menos, a veces). La semilla: en la historia, `partida_id`; en el torneo, la del torneo; en una pelea suelta de prueba, una nueva. El simulador la usa (medido: mueve la probabilidad de ganar entre 0 y 4 puntos). En `npm run dev`, las esencias de los héroes salen en la consola del navegador.

Un rasgo **oculto** de cada personaje de las peleas: un **pequeño plus** que se suma a su base. **Nunca se muestra** en
el juego (ni en Equipo ni en las fichas); es un cálculo interno, por probabilidad.

**Decisiones del autor:**
- **Todos los personajes de las peleas** tienen esencia. En la historia, los **genéricos** (los de la horda) tienen una
  esencia **baja, que casi no se nota**; los **principales** (los héroes, los amigos del héroe y los jefes importantes,
  los que tienen `jefe`) tienen una esencia de verdad.
- **Una sola** esencia por personaje.
- **No hay esencias malas:** siempre suma.
- **En cada partida, esencias diferentes.** En el torneo, diferentes cada vez que empieza un torneo.
- No va al canon: es solo una mecánica.

**Los tipos** (cualquier personaje puede tener cualquiera; propuesta de Claude):

| Esencia | Plus |
|---|---|
| Fuerza | +3 a +8 % de ATQ |
| Firmeza | +3 a +8 % de DEF |
| Vitalidad | +4 a +10 % de PS |
| Rapidez | +3 a +8 % de VEL (decide el orden del turno) |
| Reflejos | +2 a +5 puntos de probabilidad de esquivar |
| Puntería | +2 a +4 puntos de crítico y un poco menos de fallar |
| Concentración | la barra del especial se llena entre 5 y 12 % más rápido |
| Temple | los estados le duran un poco menos (o una pequeña probabilidad de no recibirlos) |

**Cuánto** (propuesta): los principales sortean el escalón: **común** 70 % (la parte baja del rango), **rara** 25 % (la
media) y **excepcional** 5 % (la alta). Los genéricos, siempre la mitad del mínimo (casi no se nota). Los porcentajes se
aplican sobre los números de su nivel.

**Cómo se sortea** (propuesta): en la historia, con una semilla fija por partida y personaje (el número propio de cada
partida, el mismo que usa PayFoe): es la misma toda la partida aunque se guarde y se cargue, y otra partida da otra; las
partidas viejas la sacan la primera vez que pelean. Los enemigos, con la semilla de la partida, el enemigo y su lugar en
la pelea. En el torneo, una semilla nueva al empezar cada torneo, que dura hasta ganarlo o quedar eliminado.

**Pruebas:** el simulador la sortea igual que el juego, para medir el equilibrio con esencias reales (la meta: que mueva
la probabilidad de ganar a lo sumo unos 3 a 5 puntos). En `npm run dev` se puede ver, para probarla; en lo publicado, no.

## 22. Lady y la copia (decidido por el autor el 2026-11-06; **hecha** el mismo día)

- **Lady pelea** en el Capítulo 4, en la convención de KJ-pop, contra las hordas de **KJPopers** (las fans). Después se
  desbloquea para el torneo, como los demás (hoy, en desarrollo; su pelea de la historia todavía no existe).
- **Copia** («Copia de fan»): toma **el daño y el efecto del último ataque que le pegó el rival** (estado, veneno,
  parálisis, confusión, a uno o a todos), pero **la animación es siempre la misma: Lady golpeando**. El nombre, el texto
  y los usos son los suyos.
- **Si todavía nadie le pegó:** es un golpe simple y débil (poder 6).
- **Solo ataques, no especiales.**
- **Lo raro se copia como un golpe con el mismo daño:** la ráfaga de balas, con las balas de en medio juntas; la de la
  sombra, como una sola. Un cebo, una cura, algo sobre sí mismo o una autodestrucción no se copian (golpe simple).
- Si Lady es rival en el torneo, también copia lo último que le pegaron los héroes.
- Código: `ataqueCopiado` en `src/engine/batalla.ts`; lo último que le pegaron, en `Luchador.copiado`. Pruebas:
  `tests/lady.test.ts`. Su ficha (con la hoja de Jair y un filtro rosado, hasta que haya arte) en
  `src/data/rpg/personajes.json`: «Copia de fan», «Barra luminosa», «Canto de estadio» (a todos, para las hordas) y el
  especial «Fancam». Textos y números: borrador de Claude.

## 23. Objetos libres (decidido por el autor el 2026-11-06; por construir)

En la pelea, **cualquier objeto se puede usar en cualquier personaje**, aliado o rival, sin avisos ni confirmaciones:
curar al enemigo, darle un pastelillo herbal, subirle el ataque con una Furia Roja. El objeto hace **siempre lo mismo**,
sea quien sea el que lo recibe (el agua cura, el pastelillo confunde, el veneno envenena): si te equivocas o te pasas de
listo, la pelea te lo cobra sola (pedido del autor: más libre).

- **Las protecciones del equipo valen igual** cuando el estado viene de un objeto, lo use quien lo use: la **flor de
  pureza** impide la confusión (el pastelillo herbal o las pastillas felices no le hacen nada); las **prendas de
  sacerdotisa**, el veneno; y así con cada protección (no pasa nada y se gasta el objeto).
- Lo que el motor cuida solo (no le quita libertad al jugador): la experiencia cuenta una sola vez por rival aunque se
  lo reviva, y el jefe se retira cuando le toca aunque lo hayan curado antes.
- Extra opcional, para después: líneas propias para las combinaciones más graciosas o con historia (el agua a Nikki en
  el bar).
- Por decidir al construirlo: si en el torneo el rival también puede usar objetos en los peleadores del jugador.

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

- **Capítulo 3:** pelea contra el Rey solo en su forma **THE KING**, en su forma normal (la gigante queda para el Capítulo 6; decisión del autor, 2026-11-05), **con la cara oculta**. Termina con el DELETE sin WHERE.
- **Capítulo 6, rama que lleva al 7A (la batalla final del juego):** **cinco fases**, cada una con su sprite y su forma de pelear:
  THE KING → THE WATCHER → THE TRIAD → THE CATACLYSM → THE VOID.
- **Capítulo 6, rama que lleva al 7B:** THE KING, más fuerte que en el Capítulo 3; no se transforma. Rikka y Cami no logran fusionarse (conflicto de fusión), así que no hay AnothergIrl en esa pelea.
- **Por hacer:** las mecánicas de cada fase (ataques, especiales, cómo se pasa de una a otra, en qué fase entra
  AnothergIrl) `[PENDIENTE]`. Sprites: el autor pasa los borradores de las transformaciones; el de THE KING todavía
  no existe.

**La torre del Capítulo 3 sube de dificultad poco a poco** (decisión del autor, 2026-11-05): el jugador atento gana ~95 % en el calabozo y cada piso un poco menos, hasta ~60 % contra el Rey; el jefe de cada piso es algo más duro que sus peleas. Se ajusta con `tests/torre_ajuste.test.ts`.

**Los jefes de la torre en el torneo** (decisión del autor, 2026-11-06): conservan sus ataques y su especial, pero pelean con la vida, el ataque, la defensa y la velocidad de un héroe de su estilo, multiplicados por un factor (`estilo_jefes` en `src/data/rpg/torneo.json`): la reina, como Maggie; el jefe de bodega, como Jair; el sargento, como Jordy; el chef, como Rikka; el maestro herrero, el alcaide y el comandante, como Billy; el intendente, como Cami. Simulación (finales en simple, atento): los jefes ~40–45 %, el Comandante ~43 % (el jefe más fuerte), Billy ~80 % (el peleador más fuerte); tres Comandantes en triple ~34–71 % (antes 99 %).

**El torneo con equipo** (decisión del autor, 2026-11-06): en el torneo los peleadores **sí** llevan objetos y amuletos. Cada uno sale con su equipo armado por Claude según su estilo (`equipo_peleadores` en `src/data/rpg/torneo.json`; cuenta igual que el equipo de una partida): Jair, sus lentes de programador (+5 % de crítico y +1 DEF; prenda propia, como la placa de Cami: no se vende); Cami, placa de piloto; Rikka, flor de pureza; Jordy, zapatillas buenas; el influencer, gorro de navidad; el otaku, vincha de anime; Billy, nada (ya es el tanque: con su delantal arrasaba en las copas bajas); Maggie, sus cuatro objetos. Los jefes de la torre, nada (pelean con su factor).

**Los objetos de Maggie** (idea del autor, 2026-11-06): contra el rival dormido o confundido. **Péndulo de hipnosis** (amuleto): crítico casi seguro contra el que duerme (+85 %). **Libreta de sesiones** (cabeza): crítico casi seguro contra el confundido. **Bata de psicóloga** (traje): +2 DEF y +50 % de daño contra el que duerme. **Pantuflas del diván** (pies): +50 % de daño contra el confundido. Sirven a cualquiera (en la historia, con Rikka o con los cebos de sueño); se venden en Boringplace (precios propuestos: 220, 220, 180 y 160). Maggie, exclusiva del torneo, se subió un 41 % para que, con ellos, gane ~53 % de las finales en simple.

**El simulador** (2026-11-06): el jugador atento primero duerme, confunde o paraliza al rival que se mueve y le pega mientras no se mueve.

**Ropa de inicio y balance** (2026-11-06): Jair empieza cada partida con sus lentes de programador (decisión del autor), como Cami (traje azul y placa) y Rikka (prendas y flor). La ropa de inicio de Cami había dejado el Capítulo 1 demasiado fácil sin que las pruebas lo notaran (simulaban sin ropa: el Bastión, descuidado ~100 %). Ahora las pruebas simulan con la ropa de inicio (`conRopa` en `tests/simulador.ts`) y se reajustó: **Bastión** soldados +2 y la sombra de 12 a 15 (descuidado ~44 %, atento ~100 %); **hangar** soldados +1 y el Capitán de 10 a 11 (descuidado ~32 %, atento ~70 %, como lo aprobó el autor). La torre del Capítulo 3 se reajustó con la ropa (solo las hordas, como decidió el autor); el Rey (nivel 28 fijo, sin ajuste) quedó en ~72–75 % con el jugador atento.

**Estados, regla final de los jefes y del golpe** (recomendación de Claude, aprobada por el autor el 2026-11-06): a los **jefes**, dormido, congelado y paralizado les duran **la mitad** (mínimo 1 turno). **Un golpe despierta al dormido** (sale «¡DESPIERTA!»), con su turno libre, como cuando se despierta solo; al congelado y al paralizado, un golpe no los saca. Por eso los objetos de Maggie rinden en el primer golpe: duerme y remata.

**Cuándo se desbloquea cada peleador del torneo** (decisión del autor, 2026-11-06): **después de su pelea RPG en la historia** (`desbloqueo_peleadores` en `torneo.json`). Jair, desde el inicio; Cami, con el Bastión o el hangar; Rikka, con la muralla; Nikki, con la pelea del bar; Jordy, Billy, el influencer y el otaku, con sus peleas del Capítulo 4 (todavía no existen: cerrados); Maggie, exclusiva del torneo, libre (`TODO(canon)`); los jefes de la torre, al vencerlos. **El Rey Malvado** es peleador **al terminar el Capítulo 6**: solo THE KING, con sus ataques y la Espada de las estaciones, sin transformaciones (esas son de la historia). En desarrollo se ven todos.

**Nikki y el Rey en el torneo:** pelean como los jefes de la torre (sus ataques y su especial, con números de héroe: Nikki, como Rikka, con zapatos de plataforma; el Rey, como Billy). Simulación (finales en simple, atento): Nikki ~49 %, el Rey ~76 % (la recompensa del final, a la par de Billy). **La torre:** el Rey sube al nivel 30 (atento ~52 %).

**Pruebas de balance con semilla fija** (2026-11-06): `balance.test.ts` tira siempre los mismos dados; ya no falla por azar.

**Rivales variados en el torneo** (pedido del autor, 2026-11-06): cada ronda, salvo la gran final (Nikki campeona), sortea su rival y, en dobles y triples, sus compañeros (`rivales` en `torneo.json`): soldados, el soldado veterano, el Capitán o un personaje (Jair, Cami, Rikka, Jordy, Billy, Maggie, el influencer, el otaku, Nikki). Sale distinto en cada torneo (la semilla del torneo). Los personajes rivales pelean con su ficha de peleador (sin cebos, curas ni bomba) y salen un poco más bajos de nivel (×0,8, ×0,9 y ×1,1 por ronda; los compañeros, además ×0,75), así la dificultad sube como con las rondas de siempre. Sin semilla (las pruebas), las rondas de siempre.

**Las dos economías** (propuesta de Claude, aceptada por el autor el 2026-11-06): la **historia** (los tokens de cada partida, su mochila) y el **menú y el torneo** (PayFoe y la mochila del torneo, por construir). Lo de la historia puede salir hacia afuera (los tokens, al terminar cada capítulo); de afuera hacia la historia solo entran premios contados (la bomba del torneo; idea: un objeto por capítulo). Los objetos de pelea comprados en el Boringram del menú sirven solo para el torneo. **La moneda se llama «tokens»** (`monedas` es solo el nombre de la variable).

**La mochila del torneo** (decisiones del autor, 2026-11-06; `src/engine/mochilaTorneo.ts`):
- **Se llena** comprando en el Boringplace del menú con PayFoe (objetos de pelea y ropa; los permanentes siguen siendo para la partida guardada) y con objetos de las partidas, al terminar cada capítulo: solo los que se gastan, **hasta 5 por capítulo** (anotado fuera de la partida: cargar un guardado viejo no lo reinicia). Lo que pasa al torneo no vuelve.
- **Tope:** 9 de cada objeto que se gasta y 3 de cada prenda (puestas o no).
- **La preparación y la mochila de combate** (decisión del autor, 2026-11-06): al tocar «Empezar» sale un menú para equipar a cada peleador y armar la **mochila de combate**, que sale de la principal y tiene tope según la modalidad (propuesto por Claude: **simple 4, doble 6, triple 8**; `mochila_combate` en torneo.json). Se usa en las 4 rondas; lo que sobra vuelve a la principal al terminar (gane o pierda; si se cierra a la mitad, vuelve al abrir el torneo otra vez).
- **En cada ronda nadie regala nada** (decisión del autor, 2026-11-06): se pelea solo con lo de la mochila del torneo (antes se regalaban 2 aguas y un Elixit por ronda). Hay que ir preparado. Lo usado se descuenta al terminar, se gane o se pierda. Sin objetos, los factores de los jefes y del Rey se reajustaron (Rey ~78 %, jefes ~42–47 % de promedio; algunos desparejos entre copas, como el Alcaide en Bronce).
- **El equipo de los peleadores:** vienen equipados de fábrica; el jugador lo deja o lo cambia con ropa de su mochila. **Lo de fábrica que se saca no se lo queda el jugador** (ni prendas ni amuletos); lo comprado vuelve a la mochila. «Equipo de fábrica» lo devuelve como venía.

**La mochila de combate del rival** (decisión del autor, 2026-11-06): el equipo contrincante del torneo también lleva la suya, del mismo tamaño que la del jugador según la modalidad (4, 6 u 8), sorteada de lo que da cada copa (`mochila_rival` en torneo.json: Bronce, aguas y galletas clásicas; Leyenda, galletas brownie y red velvet). La usa **con cabeza** (pedido del autor, 2026-11-06), en este orden: le saca un estado a un compañero (veneno, quemadura, confusión); cura al que quedó bajo de vida (por debajo de un tercio; antes al jefe), con el objeto que mejor cubre lo que le falta (nunca el pastelillo herbal); llena su especial si lo tiene a medio cargar; y el jefe se potencia una vez por pelea. Cada cosa a veces y **solo si vale la pena** (una cura, al menos el 15 % de su vida; un potenciador, al menos el 10 % de su ataque o defensa): si no, gastaría el turno en nada. En Oro y Leyenda lleva también potenciadores y 4Low-Co.

**En el torneo no se gana experiencia ni caen tokens ni botín** (decisión del autor, 2026-11-06): los personajes no suben de nivel y el premio va por ronda a PayFoe (`torneo: true` en la pelea).

**Las curas devuelven una parte de la vida** (decisión del autor, 2026-11-06; campo `cura` de cada objeto): agua sin gas 30 %, galleta clásica 25 %, galleta arcoíris 20 % a todo el equipo, red velvet 40 %, brownie 55 %, botiquín de oficina 25 % a todo el equipo (antes, 30, 20, 20, 35, 50 y 30 PS fijos). El pastelillo herbal (todo) y los Elixit (reviven con la mitad o con todo) ya eran así. Así sirven igual en el Capítulo 1 que en la Copa Leyenda. El Bastión y el hangar siguen en su meta. **El rival lleva la mitad que el jugador** (2, 3 o 4): con curas por porcentaje, más lo aplastaba a los peleadores lentos. Torneo reajustado (Billy ~81 %, Jordy ~77 %, Nikki ~53 %, Maggie ~43 %, el Rey ~77 %, jefes 40–46 %).

