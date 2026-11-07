// Los especiales con dibujo propio (decisiones y sprites del autor, 2026-11-07): la sombra de roca (la lluvia de
// meteoritos y el modo bola) y Cami armored (el Armored que la transforma, el Blaster+ y el Berserk, que la devuelve a
// su forma base). Se fuerzan con `window.__pelea` (solo en desarrollo) y se juega con los botones.
import { expect, test, type Page } from '@playwright/test';

type Pelea = {
  estado: { heroes: Record<string, unknown>[]; enemigos: Record<string, unknown>[] };
  datos: { personajes: Record<string, { sprite: string }>; enemigos: Record<string, Record<string, unknown>> };
};
/** Corre `f` en la página con la pelea de `window.__pelea` (la función se pasa como texto: no puede usar nada de afuera). */
const pelea = <T,>(page: Page, f: (p: Pelea) => T): Promise<T> => page.evaluate(`(${f.toString()})(window.__pelea)`);

async function abrir(page: Page, id: string) {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(`/?batalla=${id}`);
  const ok = page.getByRole('button', { name: /mayor de edad/i });
  if (await ok.isVisible({ timeout: 8000 }).catch(() => false)) await ok.click();
  await page.waitForFunction(() => !!(window as unknown as { __pelea?: unknown }).__pelea, null, { timeout: 30_000 });
  return errores;
}
const menu = (page: Page) => page.locator('.batalla-menu:not(.apagado) button');
/** Pasa mensajes con Enter hasta que se pueda elegir (si `de`, hasta que sea el turno de ese héroe). */
async function hastaElegir(page: Page, de?: RegExp, ms = 60_000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if ((await menu(page).count()) > 0) {
      const turno = await page.locator('.batalla-turno').innerText().catch(() => '');
      if (!de || de.test(turno)) return;
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
  throw new Error(`No llegó el turno${de ? ` de ${de}` : ''}`);
}
async function elegir(page: Page, ...opciones: (string | RegExp)[]) {
  for (const o of opciones) {
    await menu(page).filter({ hasText: o }).first().click();
    await page.waitForTimeout(150);
  }
}
/** Pasa mensajes hasta que se cumpla algo en la página. */
async function hasta(page: Page, cond: () => Promise<boolean>, ms = 60_000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if (await cond()) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(120);
  }
  throw new Error('No pasó a tiempo');
}

test.describe('la sombra de roca', () => {
  test('la lluvia de meteoritos: el cielo morado, los meteoritos y sus estallidos', async ({ page }) => {
    const errores = await abrir(page, 'sombra_roca');
    await hastaElegir(page);
    await pelea(page, (p) => {
      const r = p.datos.enemigos.sombra_roca as { especiales: unknown[] };
      r.especiales = [];
      (p.estado.enemigos[0] as { carga: number }).carga = 100;
    });
    for (let k = 0; k < 2; k++) {
      await hastaElegir(page);
      await elegir(page, 'Esquivar');
    }
    await hasta(page, async () => (await page.locator('.batalla-meteorito').count()) > 20);
    await expect(page.locator('.batalla-cielo-roca.activo')).toHaveCount(1);
    await hasta(page, async () => (await page.locator('.batalla-estallido').count()) > 0);
    expect(errores).toEqual([]);
  });

  test('la bola de espinas: se arma, se queda bola, no carga la barra y solo rueda', async ({ page }) => {
    const errores = await abrir(page, 'sombra_roca');
    await hastaElegir(page);
    await pelea(page, (p) => {
      const r = p.datos.enemigos.sombra_roca as { especial: unknown; especiales: { espinas?: unknown }[] };
      r.especial = r.especiales.find((x) => x.espinas);
      r.especiales = [];
      (p.estado.enemigos[0] as { carga: number }).carga = 100;
    });
    for (let k = 0; k < 2; k++) {
      await hastaElegir(page);
      await elegir(page, 'Esquivar');
    }
    // Arrodillado mientras le llegan los pedruscos; después, bola.
    await hasta(page, async () => (await page.locator('.batalla-pedrusco').count()) > 0);
    await expect(page.locator('.batalla-figura.enemigo.anim-agachado')).toHaveCount(1);
    await hastaElegir(page);
    await expect(page.locator('.batalla-figura.enemigo.anim-bola')).toHaveCount(1);
    const roca = await pelea(page, (p) => p.estado.enemigos[0] as { espinas?: { turnos: number }; carga: number });
    expect(roca.espinas?.turnos).toBeGreaterThanOrEqual(3);
    expect(roca.carga).toBe(0);
    expect(errores).toEqual([]);
  });
});

test.describe('Cami armored', () => {
  test('el Armored la transforma (gasta el turno); Blaster+ y BERSERK; el Berserk la devuelve a Cami, descansa y no se repite', async ({ page }) => {
    test.setTimeout(240_000);
    const errores = await abrir(page, 'prueba_armored');
    await hastaElegir(page, /CAMI/i);
    await pelea(page, (p) => ((p.estado.heroes.find((h) => h.clave === 'cami') as { carga: number }).carga = 100));
    await elegir(page, 'Atacar', /Armored/);
    for (let k = 0; k < 2; k++) {
      await hastaElegir(page);
      await elegir(page, 'Esquivar');
    }
    // El turno siguiente ya es la otra forma: solo el Blaster+ y el botón BERSERK, sin números.
    await hastaElegir(page, /CAMI/i);
    expect(await pelea(page, (p) => p.datos.personajes.cami.sprite)).toBe('batalla/cami_armored');
    await elegir(page, 'Atacar');
    await expect(menu(page)).toHaveText(['Blaster+', 'BERSERK', /Volver/]);
    await expect(page.locator('.batalla-menu button.berserk')).toHaveCount(1);
    // El Berserk: el casco (otra hoja), los suyos agachados y la espiral de balas y misiles.
    await elegir(page, 'BERSERK');
    for (let k = 0; k < 2; k++) {
      await hastaElegir(page);
      await elegir(page, 'Esquivar');
    }
    await hasta(page, async () => (await page.locator('.batalla-bala-espiral').count()) > 50, 90_000);
    await expect(page.locator('.batalla-figura.heroe.agachado-berserk')).toHaveCount(2);
    // Al terminar: vuelve a ser Cami, descansa un turno y el Armored ya no está (un especial+ por pelea).
    await hasta(page, async () => (await pelea(page, (p) => p.datos.personajes.cami.sprite)) === 'batalla/cami', 90_000);
    // El descanso se marca al final, después de los mensajes del berserk.
    await hasta(page, async () => (await pelea(page, (p) => (p.estado.heroes.find((h) => h.clave === 'cami') as { agotado?: number }).agotado ?? 0)) === 1);
    expect(await pelea(page, (p) => (p.estado.heroes.find((h) => h.clave === 'cami') as { especialMas?: boolean }).especialMas)).toBe(true);
    // Su próximo turno (después de descansar): el Armored ya no aparece.
    await pelea(page, (p) => ((p.estado.heroes.find((h) => h.clave === 'cami') as { carga: number }).carga = 100));
    await hastaElegir(page, /CAMI/i, 120_000);
    await elegir(page, 'Atacar');
    await expect(menu(page).filter({ hasText: /Armored/ })).toHaveCount(0);
    await expect(menu(page).filter({ hasText: /Lluvia de plasma/ })).toHaveCount(1);
    expect(errores).toEqual([]);
  });
});
