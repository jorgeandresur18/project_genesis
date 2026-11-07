// El equipo y la ropa fuera de las peleas (docs/PRUEBAS_EN_CASA.md, puntos 4 y 5): ponerse una prenda desde la mochila,
// que suban los números, quitarla, y comerse un caramelo. Se juega con los botones, como una persona.
import { expect, test, type Page } from '@playwright/test';

type Store = { getState: () => { game: { vars: Record<string, unknown> } | null; cambiarVars: (f: (v: Record<string, unknown>) => Record<string, unknown>) => boolean } };
const vars = (page: Page) => page.evaluate(() => (window as unknown as { __genesis: Store }).__genesis.getState().game!.vars);

/** Empieza una partida nueva (en desarrollo, `?escena=…&ir`) con estas cosas en la mochila. */
async function partidaCon(page: Page, mochila: Record<string, number>) {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto('/?escena=cap01_001&ir');
  const ok = page.getByRole('button', { name: /mayor de edad/i });
  if (await ok.isVisible({ timeout: 8000 }).catch(() => false)) await ok.click();
  await page.waitForFunction(() => !!(window as unknown as { __genesis: Store }).__genesis?.getState().game, null, { timeout: 30_000 });
  await page.evaluate((m) => {
    const g = (window as unknown as { __genesis: Store }).__genesis;
    g.getState().cambiarVars((v) => ({ ...v, ...Object.fromEntries(Object.entries(m).map(([k, n]) => [`mochila_${k}`, n])) }));
  }, mochila);
  await page.getByRole('button', { name: 'Equipo', exact: true }).click();
  return errores;
}
const ficha = (page: Page, nombre: string) => page.locator('.equipo-ficha', { has: page.locator('h3', { hasText: nombre }) });
const stat = async (page: Page, nombre: string, cual: string) =>
  Number(await ficha(page, nombre).locator(`.equipo-stats dt:text-is("${cual}") + dd`).innerText());

test('una prenda: se pone desde la mochila, suben sus números y se quita', async ({ page }) => {
  const errores = await partidaCon(page, { chaqueta_jean: 1 });
  const def = await stat(page, 'Jair', 'DEF');
  const vel = await stat(page, 'Jair', 'VEL');

  await page.getByRole('tab', { name: 'Mochila' }).click();
  const chaqueta = page.locator('.equipo-objeto', { hasText: 'Chaqueta jean' });
  await chaqueta.getByRole('button', { name: 'Poner a Jair' }).click();
  // Sale de la mochila.
  await expect(chaqueta).toHaveCount(0);

  await page.getByRole('tab', { name: 'Personajes' }).click();
  await expect(ficha(page, 'Jair').locator('.equipo-puesto', { hasText: 'Chaqueta jean' })).toBeVisible();
  expect(await stat(page, 'Jair', 'DEF')).toBe(def + 2);
  expect(await stat(page, 'Jair', 'VEL')).toBe(vel + 2);

  // Jair ya lleva sus lentes: se quita solo la chaqueta.
  const puesta = ficha(page, 'Jair').locator('.equipo-puesto', { hasText: 'Chaqueta jean' });
  await puesta.getByRole('button', { name: 'Quitar' }).click();
  await expect(puesta).toHaveCount(0);
  expect(await stat(page, 'Jair', 'DEF')).toBe(def);
  expect((await vars(page)).mochila_chaqueta_jean).toBe(1);
  expect(errores).toEqual([]);
});

test('poner otra prenda en el mismo espacio devuelve la anterior a la mochila', async ({ page }) => {
  const errores = await partidaCon(page, { chaqueta_jean: 1, chaqueta_cuero: 1 });
  await page.getByRole('tab', { name: 'Mochila' }).click();
  await page.locator('.equipo-objeto', { hasText: 'Chaqueta jean' }).getByRole('button', { name: 'Poner a Jair' }).click();
  await page.locator('.equipo-objeto', { hasText: 'Chaqueta de cuero' }).getByRole('button', { name: 'Poner a Jair' }).click();
  await expect(page.locator('.equipo-objeto', { hasText: 'Chaqueta jean' })).toBeVisible();
  const v = await vars(page);
  expect([v.mochila_chaqueta_jean, v.mochila_chaqueta_cuero]).toEqual([1, 0]);
  expect(errores).toEqual([]);
});

test('el caramelo rancio: sube 10 niveles, la experiencia vuelve a 0 y se gasta', async ({ page }) => {
  const errores = await partidaCon(page, { caramelo_rancio: 1 });
  const nivel = Number((await ficha(page, 'Jair').locator('h3 small').innerText()).match(/\d+/)![0]);
  await page.getByRole('tab', { name: 'Mochila' }).click();
  await page.locator('.equipo-objeto', { hasText: 'Caramelo rancio' }).getByRole('button', { name: 'Usar en Jair' }).click();
  await expect(page.locator('.equipo-objeto', { hasText: 'Caramelo rancio' })).toHaveCount(0);
  await page.getByRole('tab', { name: 'Personajes' }).click();
  await expect(ficha(page, 'Jair').locator('h3 small')).toContainText(String(nivel + 10));
  const v = await vars(page);
  expect([v.nivel_jair, v.xp_jair, v.mochila_caramelo_rancio]).toEqual([nivel + 10, 0, 0]);
  expect(errores).toEqual([]);
});
