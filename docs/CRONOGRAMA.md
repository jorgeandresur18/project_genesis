# CRONOGRAMA — PROJECT GENESIS

Plan de trabajo por semanas. Es una guía, no un contrato: se ajusta cuando el autor cambia prioridades. Lo hecho
se marca con [x] y se anota en `docs/BITACORA.md`.

## Cómo se organiza

**La historia manda.** El juego base se juega en orden: un capítulo sin terminar frena todo lo que viene después.
El RPG, Boringram y el arte se hacen **para el capítulo que toca**, no por adelantado.

**Cada semana tiene un foco y tareas livianas alrededor.** Según el costo:

| Tipo | Costo | Quién | Ejemplos |
|---|---|---|---|
| Liviana | Bajo | El autor (Gemini, Photoshop, Upscayl) y Claude solo la integra | Sprites de la novela, fondos, CG |
| Media | Medio | Claude con revisión del autor | Escribir y enlazar escenas, Boringram, pulir diálogos |
| Pesada | Alto (muchos tokens) | Claude | Sprites del RPG (hojas, animaciones, efectos), mecánicas nuevas |

**Reglas para gastar menos:**
1. **Los sprites del RPG se hacen en tanda,** todos los de una pelea en la misma sesión, y solo cuando la historia necesita esa pelea.
2. **El RPG queda congelado en mecánicas.** Mientras no llegue una pelea que lo pida, no se agregan estados, objetos ni sistemas: solo arreglos y lo que cada pelea nueva necesita.
3. **Los diálogos se pulen por capítulo,** cuando el capítulo ya está enlazado y se juega de corrido.
4. **Cada sesión cierra con una entrada en la bitácora** y commits chicos (nada de otro «cap1»).

---

## Dónde estamos (4 de noviembre, mediodía)

| Parte | Estado |
|---|---|
| Capítulo 1 | **Lógica cerrada** (2026-11-03). Completo y jugable; tiene el RPG (bar, Bastión, hangar). Diálogos y arte, al final. |
| Capítulo 2 | Borrador avanzado en `cap02.json`, **enlazado** al Capítulo 1 (2026-11-03: «Continuar» en la pantalla de fin). Coherencia revisada. Faltan la historia de sus peleas y el arte. |
| Capítulo 3 | Canon escrito en `docs/CANON.md`; **no hay guion**. |
| Capítulo 4 | Borrador del autor (17 escenas) en `docs/CANON.md`; sin guion. |
| Capítulos 5 a 7 | Esquema en el canon. |
| RPG | Ficha única por personaje, varios especiales, ataques intercambiables con cassettes, ataques nuevos y sueltos, Torneo Genesis y PayFoe (de relleno). Faltan: quemado y congelado, olvidar ataques, la regla anti-farmeo y sacar de `Batalla.tsx` los turnos de los héroes (los de los enemigos ya están en `engine/turnos.ts`). |
| Boringram y Boringplace | Completos para los Capítulos 1 y 2. |
| Robustez | Hecha el 3 de noviembre: pantalla de error, guardado seguro, ESLint y CI. |

---

## Semana 1 (3–9 de noviembre): cerrar los Capítulos 1 y 2
- [x] **Robustez** (hecha el 2026-11-03): pantalla de error dentro del juego (`src/components/Robustez.tsx`), guardado seguro (`src/engine/guardado.ts`), ESLint (`npm run lint`) y CI en GitHub Actions (`.github/workflows/ci.yml`).
- [x] **Resincronizar el guion del Capítulo 1** (hecho el 2026-11-03; también el del Capítulo 2).
- [x] **Cerrar la lógica del Capítulo 1** (2026-11-03): revisión de coherencia contra el canon, regla en `CLAUDE.md` y etiqueta `cap01-logica-cerrada`.
- [ ] **Pulir los diálogos del Capítulo 1:** el autor lee el guion y marca; Claude corrige con `docs/TONO.md`. *Pasa al final* (decisión del autor del 2026-11-03: diálogos y arte después de la lógica).
- [x] Título del Capítulo 2: «El viaje del héroe*», que al terminar pasa a «El viaje del antihéroe» (portada y pantalla de fin).
- [x] **Terminar el Capítulo 2 (lo que no depende del autor):** revisión de coherencia contra el canon y enlazado al Capítulo 1 (2026-11-03). Falta del autor: la historia de las peleas de la muralla y el campamento y sus bad ends.
- [ ] *Liviana:* arte del Capítulo 2 que falte (`docs/guion/cap02_arte.md`): Rikka con traje rojo y espada, etc.

## Semana 2 (10–16 de noviembre): las peleas del Capítulo 2
- [x] **Ordenar el RPG antes de sumar peleas** (2026-11-03): una sola ficha por personaje, `Batalla.tsx` partido (etapa 1: el dibujo), varios especiales y balance simulado del Bastión, el bar, el hangar y el torneo. Etapa 2 (2026-11-04, segunda computadora): la lógica de turnos sin dibujo en `src/engine/turnos.ts` (estado inicial, decisión de los enemigos, cebos, fin del turno). Queda para después: los turnos de los héroes y el bucle de la pelea, y que la simulación del balance use `turnos.ts`.
- [ ] **Decidir y hacer las peleas del Capítulo 2:** la muralla (Rikka sola), el campamento, el molino con el cassette y Cami acorazada. **Plantillas de relleno ya enganchadas** (2026-11-03; ver `BIBLIA_RPG.md`, sección 12): falta la historia de cada una. El plan simplificado de la cuenta regresiva espera la confirmación del autor.
- [ ] *Pesada:* sprites del RPG de esas peleas, en tanda.
- [ ] **Pulir los diálogos del Capítulo 2.**
- [ ] *Media:* Boringram del Capítulo 2 completo (Jordan, Lady, las fotos del viaje).

- [x] **Ataques intercambiables** (hecho el 2026-11-03; diseño en `BIBLIA_RPG.md`, sección 18): 3 ataques y 2 especiales equipados, el resto en la mochila; los originales vinculados a su personaje; los sueltos se compran, se venden y se ganan en el torneo. Falta probarlos en el navegador y los ataques del torneo.
- [ ] **PayFoe y el Torneo Genesis** (pedido del autor el 2026-11-03; diseño en `BIBLIA_RPG.md`, sección 17), en partes: (1) ~~PayFoe y la transferencia~~, (2) ~~el torneo y sus copas~~ y (3) ~~Nikki campeona~~ **hechos el 2026-11-03 (de relleno)**; falta (4): los desbloqueables a la venta y la versión sin censura de 1.000.000, y los seis ataques de Nikki.

## Semanas 3 y 4 (17–30 de noviembre): el Capítulo 3
- [ ] **Escribir el guion del Capítulo 3** desde el canon: la torre del Oráculo, el Rey Malvado, la espada DELETE, el DELETE sin WHERE, el regreso (`alt_1`: volver solo) y el despertar con Cami y Rikka en el cuarto.
- [ ] **Resolver antes de escribir:** las decisiones pendientes del Capítulo 3 (ver abajo).
- [ ] **La pelea contra el Rey Malvado del Capítulo 3:** solo THE KING (y su forma gigante), con la cara oculta, hasta el DELETE sin WHERE. *Pesada:* su sprite (el autor todavía no lo hizo). La batalla de las cinco manifestaciones es del Capítulo 6, rama del 7A (`docs/BATALLA_FINAL.md`).
- [ ] *Liviana:* fondos y CG del Capítulo 3.
- [ ] *Media:* la notificación de la migración en el celular de Jair.

## Semanas 5 y 6 (1–14 de diciembre): el Capítulo 4
- [ ] **Escribir el guion del Capítulo 4** desde el borrador del autor (escenas 1 a 9: del despertar a «conseguí trabajo en el centro»).
- [ ] **Pelea RPG con los otakus en la convención** (Cami). *Pesada:* sprites de los otakus. Es la primera pelea en el mundo real después del bar: ¿«vida real» como la de Nikki?
- [ ] *Liviana:* fondos del mundo real del Capítulo 4 (departamento de día, la convención, las calles donde buscan trabajo).
- [ ] *Liviana:* sprites nuevos: Lady (la compañera de tesis), Jordan, amigos de Jair y de Nikki, Cami con uniforme de Dulce Frío.
- [ ] *Media:* Boringram del Capítulo 4 (las fotos de la convención, lo que ven Lady, Jordan y Nikki).
- [ ] **Pendientes del RPG que el Capítulo 4 pide:** la tienda desde el título y equiparse de verdad, si la historia lo necesita.

## Después (desde el 15 de diciembre)
- Capítulo 5 (escenas 10 a 17 del borrador: Dulce Frío, el beso, el parque y el bar; el medio que falta; el descubrimiento). Fondos: Dulce Frío por dentro, el parque, el centro. Después, si el autor quiere, Génesis++.
- Capítulo 6 (la bifurcación y sus dos ramas: la cara del Rey; en la rama A, la fusión en AnothergIrl y la batalla de las cinco manifestaciones) y los epílogos 7A y 7B.
- Pendientes del RPG sin fecha: quemado y congelado, olvidar un ataque, regla anti-farmeo, `npm run escalar` con Upscayl.

---

## Decisiones pendientes del autor
Se responden cuando toque su semana; mientras, no se inventan.

**Capítulo 2**
- El plan de las peleas (la cuenta regresiva simplificada).
- Qué espiaba entre los arbustos en la escena secreta.
- El nombre del plato de la resaca.

**Capítulo 3**
- Qué pasa con la espada DELETE cuando la guardia se los lleva (final del Capítulo 2).
- Cómo es la pelea final.

**Capítulo 4**
- Los demás amigos nuevos (Lady y Jordan ya están).
- Cuál es el adelanto en la primera convención.

**Capítulo 5**
- Por qué Cami besa a Jair a propósito.
- Cómo sigue después de la cuenta del bar, y el medio hasta el descubrimiento.

**Modo Retro CRT**
- Rehacer el logo del televisor con letras propias (hoy imita el de una consola real).
- Retocar el fondo del cuarto (el robot parecido a Gundam y el control con forma de Super Nintendo).
- ¿Canales del televisor que muestran algo en ciertos capítulos? (idea de Claude, sin aprobar).

**Títulos de los capítulos 3 a 7 (resuelto el 2026-11-03; ya no está pendiente)**
- Elegidos: Capítulo 3, «Sin DÓNDE ir» / «NoWHERE»; Capítulo 4, «"Hola, mundo real"» / «"Hello, Real World"» (con las comillas); Capítulo 5, «Conflicto de dependencias» / «Dependency Hell»; Capítulo 6, «Dios ha muerto;» / «God Is Dead;». Epílogo 7B, «Mientras sea verdad» / «While It Holds True». Epílogo 7A, «Rompiendo lo escrito» / «Breaking from the Script». Están todos en `docs/CANON.md`.

**General**
- Las preguntas abiertas de Blueberries y Nikki.
- El clon del lado de los héroes.
- Cuánto tardó GENESIS en terminar el juego.
- `AnothergIrl`: si las mayúsculas forman «AI» a propósito.
- El conflicto de fusión del 7B (en el Capítulo 6): qué choca entre Rikka y Cami y si Jair ejecuta el comando.
- Las frases de confusión del RPG, para aprobar o corregir.
