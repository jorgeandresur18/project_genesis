// Exportar e importar partidas (docs/PRUEBAS_EN_CASA.md, punto 5c): la prueba importante es exportar en un navegador,
// importar en otro y seguir jugando con lo mismo. Aquí «otro navegador» es otro contexto de Playwright, que no comparte
// el localStorage. También: un archivo cualquiera da un aviso y un espacio ocupado pregunta antes de reemplazar.
import { expect, test, type Browser, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';

type Store = {
  getState: () => {
    game: { sceneId: string; vars: Record<string, unknown> } | null;
    saves: unknown[];
    cambiarVars: (f: (v: Record<string, unknown>) => Record<string, unknown>) => boolean;
  };
};
const estado = (page: Page) =>
  page.evaluate(() => {
    const s = (window as unknown as { __genesis: Store }).__genesis.getState();
    return { escena: s.game?.sceneId, vars: s.game?.vars ?? {}, saves: s.saves.filter(Boolean).length };
  });

/** Un navegador nuevo, con la advertencia aceptada y el juego listo. Con `escena`, empieza una partida ahí. */
async function abrir(browser: Browser, escena?: string) {
  const ctx = await browser.newContext({ acceptDownloads: true, locale: 'es-EC', viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  await page.goto(escena ? `/?escena=${escena}&ir` : '/');
  const ok = page.getByRole('button', { name: /mayor de edad/i });
  if (await ok.isVisible({ timeout: 8000 }).catch(() => false)) await ok.click();
  await page.waitForFunction((e) => !!(window as unknown as { __genesis?: Store }).__genesis && (!e || !!(window as unknown as { __genesis: Store }).__genesis.getState().game), escena, { timeout: 30_000 });
  return { ctx, page, errores };
}
const espacio = (page: Page, n: number) => page.locator('.slot').nth(n);

test('exportar en un navegador e importar en otro: sigue la misma partida', async ({ browser }, info) => {
  // Navegador A: una partida con algo propio (nivel, mochila, ropa) guardada en el espacio 1.
  const a = await abrir(browser, 'cap01_019');
  await a.page.evaluate(() =>
    (window as unknown as { __genesis: Store }).__genesis
      .getState()
      .cambiarVars((v) => ({ ...v, nivel_jair: 17, mochila_vida: 4, mochila_chaqueta_jean: 1, puesto_jair_traje: 'chaqueta_cuero' })),
  );
  const antes = await estado(a.page);
  await a.page.getByRole('button', { name: 'Guardar', exact: true }).first().click();
  await espacio(a.page, 0).getByRole('button', { name: 'Guardar' }).click();
  await espacio(a.page, 0).locator('input').fill('La de prueba');
  await espacio(a.page, 0).getByRole('button', { name: 'Guardar' }).click();
  const bajada = a.page.waitForEvent('download');
  await espacio(a.page, 0).getByRole('button', { name: 'Exportar' }).click();
  const archivo = info.outputPath('partida.json');
  await (await bajada).saveAs(archivo);
  await expect(a.page.getByRole('status')).toContainText('descargas');
  expect(a.errores).toEqual([]);
  await a.ctx.close();

  // Navegador B: sin partidas; se importa en el espacio 2 y se carga.
  const b = await abrir(browser);
  expect((await estado(b.page)).saves).toBe(0);
  await b.page.getByRole('button', { name: /Cargar/i }).first().click();
  const [elegir] = await Promise.all([b.page.waitForEvent('filechooser'), espacio(b.page, 1).getByRole('button', { name: 'Importar' }).click()]);
  await elegir.setFiles(archivo);
  await expect(b.page.getByRole('status')).toHaveText('Partida importada.');
  await expect(espacio(b.page, 1)).toContainText('La de prueba');
  await espacio(b.page, 1).getByRole('button', { name: 'Cargar' }).click();
  await b.page.waitForFunction(() => !!(window as unknown as { __genesis: Store }).__genesis.getState().game);
  const despues = await estado(b.page);
  expect(despues.escena).toBe(antes.escena);
  expect(despues.vars).toEqual(antes.vars);
  expect(b.errores).toEqual([]);
  await b.ctx.close();
});

test('un archivo que no es una partida da un aviso y no rompe nada', async ({ browser }, info) => {
  const b = await abrir(browser);
  await b.page.getByRole('button', { name: /Cargar/i }).first().click();
  const basura = info.outputPath('foto.json');
  writeFileSync(basura, 'esto no es una partida');
  const [elegir] = await Promise.all([b.page.waitForEvent('filechooser'), espacio(b.page, 0).getByRole('button', { name: 'Importar' }).click()]);
  await elegir.setFiles(basura);
  await expect(b.page.getByRole('status')).toHaveText('Ese archivo no es una partida de Project Genesis.');
  expect((await estado(b.page)).saves).toBe(0);
  expect(b.errores).toEqual([]);
  await b.ctx.close();
});

test('importar en un espacio ocupado pregunta antes de reemplazar', async ({ browser }, info) => {
  const a = await abrir(browser, 'cap01_019');
  await a.page.getByRole('button', { name: 'Guardar', exact: true }).first().click();
  for (const n of [0, 1]) {
    await espacio(a.page, n).getByRole('button', { name: 'Guardar' }).click();
    await espacio(a.page, n).locator('input').fill(`Partida ${n + 1}`);
    await espacio(a.page, n).getByRole('button', { name: 'Guardar' }).click();
  }
  const bajada = a.page.waitForEvent('download');
  await espacio(a.page, 1).getByRole('button', { name: 'Exportar' }).click();
  const archivo = info.outputPath('partida.json');
  await (await bajada).saveAs(archivo);
  const [elegir] = await Promise.all([a.page.waitForEvent('filechooser'), espacio(a.page, 0).getByRole('button', { name: 'Importar' }).click()]);
  await elegir.setFiles(archivo);
  await expect(a.page.getByText('¿Reemplazar la partida?')).toBeVisible();
  // Cancelar no toca nada; confirmar la reemplaza.
  await a.page.getByRole('button', { name: 'Cancelar' }).click();
  await expect(espacio(a.page, 0)).toContainText('Partida 1');
  const [otra] = await Promise.all([a.page.waitForEvent('filechooser'), espacio(a.page, 0).getByRole('button', { name: 'Importar' }).click()]);
  await otra.setFiles(archivo);
  await a.page.getByRole('dialog').getByRole('button', { name: 'Importar' }).click();
  await expect(espacio(a.page, 0)).toContainText('Partida 2');
  expect(a.errores).toEqual([]);
  await a.ctx.close();
});
