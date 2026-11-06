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
  const boton = page.getByRole('button', { name: /Transferir 120 tokens/ });
  await expect(boton).toBeVisible({ timeout: 15_000 });
  await boton.click();
  await expect(page.getByText(/120 tokens en PayFoe/)).toBeVisible();
  const saldo = await page.evaluate(() => (window as unknown as { __genesis: G }).__genesis.getState().payfoe.saldo);
  expect(saldo).toBe(120);
  expect(errores).toEqual([]);
});
