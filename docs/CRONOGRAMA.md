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

## Dónde estamos (2 de noviembre)

| Parte | Estado |
|---|---|
| Capítulo 1 | Completo y jugable; tiene el RPG (bar, Bastión, hangar). Diálogos sin pulir. Guion `docs/guion/cap01.md` desactualizado. |
| Capítulo 2 | Borrador avanzado en `cap02.json`, **sin enlazar** al Capítulo 1. Faltan sus peleas y arte. |
| Capítulo 3 | Canon escrito en `docs/CANON.md`; **no hay guion**. |
| Capítulo 4 | Borrador del autor (17 escenas) en `docs/CANON.md`; sin guion. |
| Capítulos 5 a 7 | Esquema en el canon. |
| RPG | 4 peleas, sistema completo. Faltan equiparse de verdad, quemado y congelado, olvidar ataques y la regla anti-farmeo. |
| Boringram y Boringplace | Completos para los Capítulos 1 y 2. |
| Robustez | Aprobada el 29 de octubre y nunca hecha: ErrorBoundary, guardado seguro, CI, ESLint. |

---

## Semana 1 (3–9 de noviembre): cerrar los Capítulos 1 y 2
- [ ] **Robustez** (medio día; protege a los jugadores de verdad): ErrorBoundary, guardado que nunca rompe el juego, CI y ESLint.
- [ ] **Resincronizar el guion del Capítulo 1** (necesita el permiso del autor para `guion:exportar -- --forzar`).
- [ ] **Pulir los diálogos del Capítulo 1:** el autor lee el guion y marca; Claude corrige con `docs/TONO.md`.
- [x] Título del Capítulo 2: «El viaje del héroe*», que al terminar pasa a «El viaje del antihéroe» (portada y pantalla de fin).
- [ ] **Terminar el Capítulo 2:** partes que falten del autor, revisión contra el canon y enlazarlo al final del Capítulo 1.
- [ ] *Liviana:* arte del Capítulo 2 que falte (`docs/guion/cap02_arte.md`): Rikka con traje rojo y espada, etc.

## Semana 2 (10–16 de noviembre): las peleas del Capítulo 2
- [ ] **Ordenar el RPG antes de sumar peleas:** una sola ficha por personaje (`personajes.json`), partir `Batalla.tsx` en piezas y simular el balance de todas las peleas.
- [ ] **Decidir y hacer las peleas del Capítulo 2:** la muralla (Rikka sola), el campamento, el molino con el cassette y Cami acorazada. El plan simplificado de la cuenta regresiva espera la confirmación del autor.
- [ ] *Pesada:* sprites del RPG de esas peleas, en tanda.
- [ ] **Pulir los diálogos del Capítulo 2.**
- [ ] *Media:* Boringram del Capítulo 2 completo (Jordan, Lady, las fotos del viaje).

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

**Títulos de los capítulos 3 a 7**
- «Dios ha muerto;» / «God Is Dead;» es el del Capítulo 6. Faltan el 3, el 4, el 5, el 7A y el 7B (con el chiste también en inglés).
- Propuestas en `docs/BITACORA.md` (sesión del 2 y 3 de noviembre); el 3 iba hacia «return 0;» o «Proceso terminado*».

**General**
- Las preguntas abiertas de Blueberries y Nikki.
- El clon del lado de los héroes.
- Cuánto tardó GENESIS en terminar el juego.
- `AnothergIrl`: si las mayúsculas forman «AI» a propósito.
- Las frases de confusión del RPG, para aprobar o corregir.
