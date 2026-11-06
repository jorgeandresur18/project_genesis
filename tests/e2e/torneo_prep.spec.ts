// La preparación del torneo (decisión del autor, 2026-11-06): antes de la primera ronda se equipa a los peleadores y se
// arma la mochila de combate, que sale de la principal (con tope) y es lo único que se usa en las rondas.
import { expect, test } from '@playwright/test';

type G = { getState: () => { torneo: { mochila?: Record<string, number>; combate?: Record<string, number> } }; setState: (x: object) => void };

test('preparación: mochila de combate desde la principal, y la pelea arranca con ella', async ({ page }) => {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto('/?galeria=todo');
  const ok = page.getByRole('button', { name: /mayor de edad/i });
  if (await ok.isVisible({ timeout: 8000 }).catch(() => false)) await ok.click();
  await page.waitForFunction(() => !!(window as unknown as { __genesis?: unknown }).__genesis);
  await page.evaluate(() => {
    const g = (window as unknown as { __genesis: G }).__genesis;
    g.setState({ torneo: { ...g.getState().torneo, mochila: { vida: 3, revivir: 1 }, combate: {} } });
  });
  await page.getByRole('button', { name: /Extras/i }).first().click();
  await page.getByText(/Torneo Genesis/).first().click();
  await page.getByRole('button', { name: /Copa Bronce/ }).click();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await expect(page.getByText('Preparación')).toBeVisible();
  await expect(page.getByText(/Mochila de combate: 0 de 4/)).toBeVisible();
  const agua = page.locator('.torneo-combate', { hasText: 'Agua sin gas' });
  await agua.getByRole('button', { name: 'Más' }).click();
  await agua.getByRole('button', { name: 'Más' }).click();
  await expect(page.getByText(/Mochila de combate: 2 de 4/)).toBeVisible();
  await page.getByRole('button', { name: '¡A pelear!' }).click();
  await expect(page.locator('.batalla-menu')).toBeAttached({ timeout: 30_000 });
  const t = await page.evaluate(() => (window as unknown as { __genesis: G }).__genesis.getState().torneo);
  expect(t.combate).toEqual({ vida: 2 });
  expect(t.mochila).toEqual({ vida: 1, revivir: 1 });
  expect(errores).toEqual([]);
});
