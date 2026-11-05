# Capítulo 3, «Sin DÓNDE ir» / «NoWHERE»: plan antes del guion

Reúne lo que el canon ya define para el Capítulo 3 y lo que falta decidir. **Todavía no hay guion.** Fuentes:
`docs/CANON.md` («Capítulo 3: la espada DELETE»), `docs/BATALLA_FINAL.md` y `docs/FINALES.md`. Si algo de aquí contradice
al canon, manda el canon.

## Lo que ya está decidido

**De dónde viene:** el Capítulo 2 termina en la torre del Oráculo. Jair toma la espada DELETE, la guardia del Rey se los
lleva y la pantalla del Oráculo queda con la línea «Sesión activa. No cierre esta ventana.» (`cap02_fin_010`).

| Orden | Qué pasa | Dónde está |
|---|---|---|
| 1 | Jair, Cami y Rikka llegan ante el Rey Malvado. Quiere gobernar todas las dimensiones y para eso necesita a Jair y a Cami, la llave. | CANON |
| 2 | La pelea, solo contra **THE KING**, en su forma normal (la gigante queda para el Capítulo 6; decisión del autor del 5 de noviembre). **La cara, oculta:** se revela en el Capítulo 6. | BATALLA_FINAL |
| 3 | Jair usa la espada contra el Rey. Al atravesar a alguien, la espada escribe y ejecuta una sentencia parecida a SQL. **Jair olvida el `WHERE`.** | CANON |
| 4 | El borrado alcanza toda la tabla del Rey: él y todas las dimensiones que conquistó. El universo del juego queda borrado. | CANON |
| 5 | Cami y Rikka sobreviven: sin saberlo, Jair migró sus entidades a su propia tabla (nunca se dice en voz alta hasta que llega la notificación). | CANON |
| 6 | Se revela el nombre **THE NEXUS**, casi al final del capítulo. Ya se puede decir la palabra «nexus». | CANON |
| 7 | Jair logra activar a Cami a voluntad. **Decisión:** volver solo o volver con las dos. | CANON |
| 7a | **Volver solo:** final `alt_1`, «Cancelar» (nombre provisional). GENESIS ofrece restaurar el juego y Jair pone «Cancelar». Es un final normal, no un bad end. | FINALES |
| 7b | **Volver con las dos** (camino canon): sin «OVERRIDE» gritado ni comando explícito; es consecuencia de la migración. | CANON |
| 8 | **Final:** Jair despierta frente a la computadora, cree que fue un sueño y ve que va tarde al trabajo. Al voltearse, Cami y Rikka están en su cuarto. | CANON |

**Duración:** de 2 h 30 min a 3 h. **No va en este capítulo:** la restauración (8.112 años o 6 meses), el asombro de ellas ante
el departamento y que Rikka entienda que Jair es el Gran Ingeniero: todo eso es del Capítulo 4.

## Lo que decidió el autor (5 de noviembre de 2026)

Con esto se escribió el borrador (`src/data/chapters/cap03.json`, guion legible en `docs/guion/cap03.md`):

- **Las casi 3 horas se llenan con peleas:** es uno de los capítulos más RPG del juego (hordas de soldados, capitanes, sombras y enemigos nuevos que el autor va a crear). Hoy son peleas de relleno con los enemigos que ya existen.
- **La espada:** se la quitan y la recuperan en el arsenal del piso 5.
- **Dónde:** la fortaleza del Rey, piso por piso. **Estructura:** escape del calabozo y ascenso hasta el trono.
- **El DELETE:** la sentencia se escribe sola. **El olvido:** la presión del momento (el Rey alza la espada sobre Cami y Rikka).
- **La cara:** un yelmo cerrado. **THE NEXUS:** lo dice el Rey, en la sala del trono.
- **Bad ends:** perder contra el Rey, perder en los pisos y malas decisiones del escape (8 en el borrador).
- **Decidido por Claude, siguiendo el canon:** la notificación de la migración llega en la última escena, al despertar; `alt_1` se llama «Cancelar» (nombre provisional).

## Lo que quedaba por decidir (antes de las respuestas)

Ordenado de lo que más frena el guion a lo que menos. La primera es la más importante.

1. **¿Con qué se llenan las 2 h 30 min a 3 h?** Lo que está decidido cuenta una pelea y su consecuencia; escrito, da mucho menos. ¿Hay más camino antes de llegar al Rey (la prisión, una fuga, su fortaleza), o se reduce la duración?
2. **¿Qué pasa con la espada cuando la guardia se los lleva?** (`TODO(canon)` del final del Capítulo 2). Si se la quitan, hay que recuperarla; si no, ¿por qué no? Por ejemplo: el Rey quiere que la traiga, o la espada no se puede quitar a quien la liberó.
3. **¿Dónde está el Rey?** El canon no dice dónde los llevan.
4. **¿Cómo se oculta la cara del Rey?** Yelmo, máscara o sombra (`[PENDIENTE]`). Además, ¿qué pasa con la versión gigante?
5. **¿Cómo es la pelea?** Quién pelea; si hay una o varias partes antes de usar la espada; y qué la permite usar. ¿Se usa desde el menú como un especial, o se corta la pelea y sigue la novela?
6. **El momento del DELETE, el corazón del capítulo:** ¿el jugador escribe la sentencia, como en el minijuego de Coffee, o la ve escribirse sola? Si la escribe, puede «olvidar» el `WHERE` él mismo, o el juego puede no ofrecérselo. ¿Se ve la sentencia en pantalla?
7. **¿Por qué lo olvida Jair?** ¿Apuro, pánico, que el Rey lo presiona? El eco con sus prácticas del Capítulo 2 ya está.
8. **¿Cómo se revela THE NEXUS?** ¿Quién lo dice: el Rey, la Voz o GENESIS?
9. **¿Cómo activa Jair a Cami a voluntad?** ¿Qué aprendió o qué cambia? ¿Dónde están parados, si el universo se borró?
10. **¿Cuándo llega la notificación de la migración?** El canon dice «al volver al mundo real». ¿Es en la última escena del Capítulo 3, o ya en el Capítulo 4?
11. **¿Hay bad ends?** El Capítulo 2 tiene 10. ¿Perder contra el Rey es uno? ¿Hay otros?
12. **La línea del Oráculo** («Sesión activa. No cierre esta ventana.»): ¿tiene consecuencia en este capítulo?
13. **El nombre de `alt_1`:** «Cancelar» es provisional.

## Lo que necesita fuera de la historia

- **RPG:** el sprite de THE KING (el autor todavía no lo tiene) y su ficha.
- **Novela:** fondos y CG del lugar del Rey, de la nada después del borrado y del cuarto de Jair.
- **Celular:** la notificación de la migración.
