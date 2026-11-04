# Qué probar en la computadora de casa

Lista de lo que se hizo el 4 de noviembre de 2026 en la segunda computadora (`MARKETING1ICSH`), donde no se pudo jugar
ni ver nada en pantalla. Todo pasó las pruebas automáticas, pero **nadie lo vio funcionando**.

**Para Claude en la computadora de casa:** lee este archivo, guía al autor punto por punto, y tacha aquí lo que quede
confirmado. Si algo falla, primero mira `docs/BITACORA.md` (entrada del 4 de noviembre) y, para las peleas, la lógica
que se movió a `src/engine/turnos.ts`.

**Cómo pedírselo:** «Lee `docs/PRUEBAS_EN_CASA.md` y guíame para probar todo».

## 1. Antes de probar: juntar las dos computadoras

- [ ] En la carpeta del proyecto: `git checkout desarrollo` y `git status`.
- [ ] Revisar si quedó algo sin subir de la noche del 3 de noviembre: `git log --branches --not --remotes`. El autor
      recuerda cambios de cerca de las 23:00, pero en GitHub lo último de esa noche es de las 22:44.
- [ ] Si hay cambios sin guardar, hacer un commit con ellos.
- [ ] `git pull`. Si dice `CONFLICT`, Claude ayuda a elegir qué se queda (lo más probable: `BITACORA.md` y
      `CRONOGRAMA.md`). Nunca `push --force`.
- [ ] `npm install` y `npm test` (deben pasar todas) y `npm run dev`.

## 2. Las peleas (se cambió cómo está armado el código, no cómo se juega)

Tienen que jugarse **igual que antes**. Lo que más hay que mirar: que nada se trabe y que no aparezcan errores.

- [ ] `http://localhost:5173/?batalla=bastion`: los refuerzos llegan cuando cae un soldado, sale la sombra al final, su
      parálisis funciona y se gana cuando se retira.
- [ ] `http://localhost:5173/?batalla=nikki`:
  - [ ] El beso confunde y a veces Jair se pega a sí mismo.
  - [ ] Hablarle 3 turnos seguidos termina la pelea con el perdón.
  - [ ] **La traición:** hablarle y después atacarla. Tiene que salir la Mega Bola Tóxica contra Jair y, después, la
        cachetada que remata.
  - [ ] Cuando aparece, el clon de sombra le cuesta vida a Nikki y se evapora a los 3 turnos.
- [ ] `http://localhost:5173/?batalla=hangar`: ver el punto 3.
- [ ] `http://localhost:5173/?batalla=demo`: con Rikka; se puede huir y usar objetos (el condón protege, el veneno quita
      vida cada turno).

## 3. El hangar, ahora más fácil

El Capitán bajó de nivel 12 a 10, porque su cañón da 9 golpes y la simulación vieja contaba uno. Medido: un jugador
atento gana ~72 % y uno descuidado ~30 %.

- [ ] ¿Se siente justa la pelea? Más difícil que el Bastión, pero ganable.
- [ ] El cañón: un rayo fuerte a quien eligió y barridos flojos al otro.
- [ ] Si quedó muy fácil o muy difícil, las otras opciones medidas están en `docs/BITACORA.md`.

## 4. El equipo y la ropa (nuevo; la pantalla es lo que más hay que revisar)

Hay que jugar la historia (o usar `/all`) hasta ganar el Bastión, porque ahí se abre Boringplace.

- [ ] En Boringplace aparecen el gorro de navidad (120), la chaqueta jean (90) y las zapatillas buenas (80).
- [ ] Al comprar una prenda no sale el selector de cantidad y, después de comprarla, dice que ya es tuya.
- [ ] En Equipo › Mochila aparece la prenda con un botón por personaje («Poner a Jair»).
- [ ] Al ponerla: sale de la mochila, se ve en la ficha del personaje y suben sus números (DEF, VEL).
- [ ] «Quitar» la devuelve a la mochila. Poner otra en el mismo espacio devuelve la anterior.
- [ ] En una pelea, la tarjeta del personaje muestra «DEF +n»; en la pausa, el Equipo se mira pero no se cambia.
- [ ] Se guarda: guardar la partida, cargarla y que siga puesta.
- [ ] Lo que no se lleva puesto se vende a la mitad en «Tus artículos». Lo puesto no aparece para vender.
- [ ] El bar con Nikki **no** cuenta la ropa (es la vida real).
- [ ] ¿Los botones se ven bien? Se hicieron sin verlos, también en el celular.

## 5. Los caramelos fuera de las peleas (nuevo)

- [ ] Ganarle a Nikki (bajarle la mitad de la vida) da el caramelo rancio.
- [ ] En Equipo › Mochila, «Usar en Jair» sube 10 niveles, la experiencia vuelve a 0 y se gasta.
- [ ] Los números de la ficha suben, y en la siguiente pelea entra con ese nivel.

## 6. Limpieza (revisar que no se rompió nada)

- [ ] Se partieron `Boringram.tsx` y `App.tsx` en archivos más chicos. Boringram tiene que verse y andar igual: inicio,
      historias, mensajes, perfil, compartir, el panel de notificaciones y el tour.

## 7. Las mecánicas nuevas

Pedidas el 4 de noviembre; ver `docs/BIBLIA_RPG.md`, sección 19. Cuando estén hechas, se agrega aquí qué probar.
