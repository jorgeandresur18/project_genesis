# Biblia del RPG — PROJECT GENESIS

Las reglas de las batallas por turnos. **Todas las peleas siguen estas reglas** salvo que la pelea diga otra cosa en
sus datos: esas excepciones son **eventos** y se anotan en la sección 12. Si una regla de aquí cambia, se cambia
aquí primero (y en el código y las pruebas en el mismo cambio).

- Datos de cada pelea: `src/data/batallas/<id>.json`. Reglas en código: `src/engine/batalla.ts` (cuentas) y
  `src/components/Batalla.tsx` (la pelea en pantalla).
- Pruebas: `tests/batallas.test.ts` (datos completos y reglas) y `tests/balance.test.ts` (miles de peleas simuladas).
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
- **Movimientos que se aprenden** (`aprende`): al llegar a un nivel, el héroe aprende un ataque nuevo (sale el aviso). Jair, en el nivel 6: **Cebo**, una copia suya en blanco y negro, inerte (un solo cuadro, sin animación), que no hace nada; el 55 % de los golpes a uno solo van a ella en vez de a un héroe (`CEBO`; los de efecto, no), y se deshace al primer golpe. Uno a la vez. «El movimiento más básico de cualquier peleador, e inútil; sirve para escaparse del trabajo si el jefe no se da cuenta».
- **Experiencia:** cada enemigo que cae da `nivel del enemigo × 3` de experiencia a cada héroe de pie. Para pasar
  del nivel N al siguiente hacen falta `N × 10`. Al subir, las estadísticas pasan a las del nivel nuevo y los PS
  suben lo mismo que el máximo.
- **Se guarda en la partida al ganar** (o huir): nivel y experiencia de cada héroe (`nivel_<héroe>`, `xp_<héroe>`)
  y la mochila (`mochila_<objeto>`). Nivel 0 en la partida significa «todavía no peleó»: se usa el del .json.

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
| Hablar | El héroe le dice algo al rival. Un soldado puede distraerse (40 %) y perder su próximo ataque; al jefe no se lo distrae. Excepción: Nikki (ver 12). |
| Esquivar | Ese turno cada golpe que le tiren puede fallar (50 %). |
| Objetos | Algo de la mochila, en él o en un compañero (revivir: en un caído). |
| Huir | Termina la pelea, si la pelea lo permite (`huir`). En el Bastión y en el bar, no. No gasta el turno. |

---

## 3. Daño, azar y críticos

- **Daño de un golpe:** `ATQ × poder / 10 − DEF del que recibe / 2`, por un azar de ±10 %. Mínimo 1.
- **Crítico:** 8 % de las veces, × 1,5 (sale «¡Golpe crítico!»). Si el juego está ayudando, más (ver 9).
- **Fallo:** un ataque normal falla el 6 % de las veces, de los dos lados (el rival lo esquiva o el golpe no entra).
  Los especiales no fallan.
- **Esquivar:** funciona el 50 % de las veces, golpe por golpe (también contra los golpes de un especial).

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
| **Paralizado** | No actúa durante esos turnos. **No se suma al descanso**: si Cami atacó y después la paralizan, al liberarse ya puede atacar. | Quieto en la pose de golpeado, temblando, con un brillo morado. |
| **En el aire** | Mientras dura el especial que lo levantó. | Arriba, en la pose de golpeado; al terminar cae con su sprite de derrotado y, si sigue vivo, se levanta. |
| **Caído** | 0 PS. No actúa. Se puede revivir. | Su fila «derrotado» (tirado, respirando) o, si no la tiene, la pose de golpeado. |
| **Confundido** (el beso de Nikki) | Durante 3 turnos, al atacar (ataque o especial) puede pegarse a sí mismo: 40 % el primer turno, 30 % el segundo y 20 % el tercero (`CONFUSION`). Hablar, esquivar y los objetos funcionan normal. Se le va al caer. | Tres corazones chicos y tenues que giran despacio sobre la cabeza (desaparecen al caer); «confusión» en su tarjeta. |
| **Distraído** (por Hablar) | Pierde su próximo ataque. | — |

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
  borde de retirarse. Al aparecer, Jair reacciona.
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
| Bastión | Descuidado (solo ataca, nunca usa la mochila) | Gana entre 10 % y 55 % | ~38 % |
| Bastión | Atento (cura al que baja del 40 %, usa potenciadores) | Gana 75 % o más, terminando con menos de la mitad de la vida | ~99 %, con ~36 % de vida |
| Bar (Nikki) | Solo ataca | Gana entre 2 % y 15 % | ~6 % |
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

### La demo (`demo`, solo para probar)

- Jair, Cami y Rikka contra la horda y la sombra. Se puede huir.

---

## 13. Cómo armar una pelea nueva

1. Copiar una pelea parecida en `src/data/batallas/<id>.json`.
2. **Obligatorio:** `titulo`, `fondo`, `heroes`, `personajes`, `enemigos`, `horda`, `jefe`, `objetos`, `botin`,
   `esquivar`, `hablar`, `huir`, `retratos` y los `dialogos` de cada momento (inicio, refuerzos, jefe, jefe_huye,
   victoria, derrota, huir_no, huir, descanso, cae_jair, hablar_ok, hablar_no, esquiva_ok, botin).
3. **Opcional:** música, ayuda, mochila inicial, premio, presentación «VS», descripciones propias, `enemigos_atras`,
   y en los enemigos `remata`, `clon`, `perdon`, `al_retirarse`, `sale_atras`, `sonido`.
4. En la escena de la historia: `"batalla": "<id>"`, `"batalla_derrota": "<escena>"` y, si hay perdón,
   `"batalla_perdon": "<escena>"`.
5. Los sprites van en `public/batalla/<personaje>.png` y `.json`, exportados con
   `python -I tools/batalla_sprites.py "<html del autor>"`.
6. Correr `npm run test:routes` y `npx vitest run`. Si es una pelea importante, agregarla a `tests/balance.test.ts`
   con su meta.
7. Si la pelea cambia alguna regla, anotarla en la sección 12 de esta biblia.

---

## 14. Pendientes e ideas

| Tema | Estado |
|---|---|
| Que la **velocidad** decida quién actúa primero (héroes y enemigos mezclados) | Propuesto, sin aprobar. |
| **Monedas** al final de cada pelea, guardadas en la partida | Propuesto. |
| **Tienda en Boringplace** (el marketplace de Boringram; pociones, caramelo dulce +1 nivel, caramelo ácido −1, ropa con +ATQ/+DEF/+VEL, imágenes inéditas que van a la galería) | Boringplace ya existe (se abre en el Capítulo 2; por ahora solo se mira). Falta comprar: llega con las monedas. |
| Panel **«Stats e inventario»** en el menú del juego | Propuesto. |
| **Cami actúa todos los turnos** desde el Capítulo 2, con enemigos de más nivel | Decidido por el autor; falta armar esas peleas. |
| La fila **«dolor»** de Cami | Reservada para más adelante. |
| Retratos y sprite de batalla definitivos (hoy algunos son placeholders) | Esperando el arte del autor. |
| El Bastión, jugador atento: gana ~99 % (con la ayuda del juego). ¿Más difícil? | A decidir por el autor. |
