// Los tokens de la partida pasan a PayFoe al terminar cada capítulo (decisión del autor, 2026-11-06): en la pantalla de
// fin de capítulo hay un botón para transferirlos; a mitad de capítulo no se puede.
import { expect, test, type Page } from '@playwright/test';
import { empezar } from './historia';

type G = {
  getState: () => {
    game: { vars: Record<string, unknown>; finished?: string | null } | null;
    payfoe: { saldo: number };
    advance: () => void;
    transferirAPayfoe: (n: number) => number;
  };
  setState: (x: object) => void;
};
const conTokens = (page: Page, n: number) =>
  page.evaluate((n) => {
    const g = (window as unknown as { __genesis: G }).__genesis;
    const game = g.getState().game!;
    g.setState({ game: { ...game, vars: { ...game.vars, monedas: n, tokens_ganados: n } } });
  }, n);

test('al terminar el capítulo se transfieren los tokens a PayFoe; antes, no', async ({ page }) => {
  const errores = await empezar(page, 'cap01_g8_072');
  await conTokens(page, 120);
  // A mitad del capítulo: no se puede.
  const antes = await page.evaluate(() => (window as unknown as { __genesis: G }).__genesis.getState().transferirAPayfoe(120));
  expect(antes).toBe(0);
  // Fin del capítulo: el botón de PayFoe.
  await page.evaluate(() => (window as unknown as { __genesis: G }).__genesis.getState().advance());
  await expect(page.getByText(/Quieres pasar tus tokens a PayFoe/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/no vuelven a la partida/)).toBeVisible();
  // Elegir cuántos: menos de todos (se puede guardar una parte para la historia).
  await page.getByRole('button', { name: 'Menos' }).click();
  await page.getByRole('button', { name: /Pasar 110 tokens/ }).click();
  await expect(page.getByText(/110 tokens en PayFoe/)).toBeVisible();
  const saldo = await page.evaluate(() => (window as unknown as { __genesis: G }).__genesis.getState().payfoe.saldo);
  expect(saldo).toBe(110);
  expect(errores).toEqual([]);
});

test('al terminar el capítulo se pasan objetos a la mochila del torneo, con tope; no vuelven', async ({ page }) => {
  const errores = await empezar(page, 'cap01_g8_072');
  await page.evaluate(() => {
    const g = (window as unknown as { __genesis: G }).__genesis;
    const game = g.getState().game!;
    g.setState({ game: { ...game, vars: { ...game.vars, partida_id: 'prueba', mochila_vida: 3, mochila_traje_rojo: 1 } } });
    g.getState().advance();
  });
  await expect(page.getByText(/pasar objetos a la mochila del torneo/)).toBeVisible({ timeout: 15_000 });
  // Solo lo que se gasta: el agua sí, la ropa no.
  const fila = page.locator('.chapter-end-payfoe-cantidad', { hasText: 'Agua sin gas' });
  await expect(fila).toBeVisible();
  await expect(page.locator('.chapter-end-payfoe-cantidad', { hasText: 'Traje de combate rojo' })).toHaveCount(0);
  await fila.getByRole('button', { name: 'Más' }).click();
  await fila.getByRole('button', { name: 'Más' }).click();
  await page.getByRole('button', { name: /Pasar 2 objetos/ }).click();
  await expect(page.getByText(/2 objetos en la mochila del torneo/)).toBeVisible();
  const r = await page.evaluate(() => {
    const st = (window as unknown as { __genesis: { getState: () => { torneo: { mochila?: Record<string, number> }; game: { vars: Record<string, unknown> } } } }).__genesis.getState();
    return { torneo: st.torneo.mochila?.vida, partida: st.game.vars.mochila_vida };
  });
  expect(r).toEqual({ torneo: 2, partida: 1 });
  expect(errores).toEqual([]);
});
