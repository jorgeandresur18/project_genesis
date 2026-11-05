// El Multicebo (cassette de especial de Boringplace): con la barra llena, deja un cebo delante de cada héroe en pie.
import { expect, test, type Page } from '@playwright/test';
import { abrirPelea, elegir, hastaElMenu, turnoDe } from './ayudantes';

const VARS = { nivel_jair: 8, cassette_multicebo: 1, especiales_jair: 'Multicebo' };

/** Mientras el turno no sea de Jair, el héroe que elige esquiva (así solo actúa Jair). */
async function hastaJair(page: Page) {
  for (let i = 0; i < 8; i++) {
    await hastaElMenu(page);
    if (/jair/i.test((await turnoDe(page)) ?? '')) return;
    await elegir(page, 'Esquivar');
  }
  throw new Error('Nunca le tocó a Jair');
}

test('el Multicebo pone un cebo delante de cada héroe en pie', async ({ page }) => {
  test.setTimeout(300_000);
  const errores = await abrirPelea(page, 'demo', VARS);
  for (let turno = 0; turno < 30; turno++) {
    await hastaJair(page);
    await elegir(page, 'Atacar');
    const especial = page.locator('.batalla-menu:not(.apagado) button', { hasText: 'Multicebo' });
    if (/LISTO/i.test((await especial.innerText().catch(() => '')) ?? '')) {
      await especial.click();
      const enPie = await page.locator('.batalla-figura.heroe:not(.ko)').count();
      // Las acciones corren cuando eligieron todos: los demás esquivan; los mensajes se pasan con Enter.
      const fin = Date.now() + 30_000;
      while ((await page.locator('.batalla-cebo').count()) < enPie && Date.now() < fin) {
        const esquivar = page.locator('.batalla-menu:not(.apagado) button', { hasText: 'Esquivar' });
        if (await esquivar.isVisible().catch(() => false)) await esquivar.click();
        else await page.keyboard.press('Enter');
        await page.waitForTimeout(120);
      }
      expect(await page.locator('.batalla-cebo').count()).toBe(enPie);
      expect(errores, errores.join('\n')).toEqual([]);
      return;
    }
    // Sin la barra llena: el golpe de siempre, al primero.
    await elegir(page, 'Puñetazo');
    await page.locator('.batalla-menu:not(.apagado) button').first().click();
  }
  throw new Error('En 30 turnos nunca se llenó la barra de Jair');
});
