// Ayudantes para jugar una pelea desde Playwright como lo haría una persona: si el menú espera una elección, se elige
// por nombre; si no, Enter pasa los mensajes. Se detiene si la pelea deja de avanzar (eso es lo que hay que detectar).
import { expect, type Page } from '@playwright/test';

/** Abre una pelea de prueba con variables de una partida (ver `?vars` en src/app/titulo.tsx). */
export async function abrirPelea(page: Page, id: string, vars: Record<string, unknown> = {}) {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text());
  });
  const q = new URLSearchParams({ batalla: id, vars: JSON.stringify(vars) });
  await page.goto(`/?${q}`);
  // Un navegador nuevo ve primero la advertencia de contenido: se acepta, como lo haría una persona.
  const aceptar = page.getByRole('button', { name: /mayor de edad/i });
  if (await aceptar.isVisible({ timeout: 8_000 }).catch(() => false)) await aceptar.click();
  await expect(page.locator('.batalla-menu')).toBeAttached({ timeout: 30_000 });
  return errores;
}

const menuActivo = (page: Page) => page.locator('.batalla-menu:not(.apagado) button');

/** De quién es el turno de elegir («Turno de …»), o null si no hay menú. */
export async function turnoDe(page: Page): Promise<string | null> {
  if ((await menuActivo(page).count()) === 0) return null;
  const t = page.locator('.batalla-turno');
  return (await t.count()) ? (await t.innerText()).replace(/\s+/g, ' ').trim() : '';
}

/** Pasa mensajes con Enter hasta que el menú pida elegir. Falla si en `ms` no pasa nada. */
export async function hastaElMenu(page: Page, ms = 30_000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    if ((await menuActivo(page).count()) > 0) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
  }
  throw new Error(`La pelea no volvió al menú en ${ms / 1000} s`);
}

/** Elige en el menú la opción que empieza con ese texto (sin importar mayúsculas ni el «★»). */
export async function elegir(page: Page, texto: string) {
  // `hasText` con un texto busca sin importar mayúsculas y aunque tenga algo antes (el «★» de los especiales).
  const opcion = menuActivo(page).filter({ hasText: texto }).first();
  await expect(opcion, `opción «${texto}»`).toBeVisible({ timeout: 10_000 });
  await opcion.click();
  await page.waitForTimeout(120);
}

/** El texto del mensaje de abajo (narración o aviso). */
export const mensaje = async (page: Page) => (await page.locator('.batalla-mensaje').innerText()).trim();
