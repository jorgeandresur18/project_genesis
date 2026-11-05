// Cebos (docs/PRUEBAS_EN_CASA.md, sección 9): poner un cebo con otro en pie no tiene que trabar la pelea. El menú avisa
// («Ya hay un cebo…»), sigue respondiendo y, eligiendo otra cosa, la pelea avanza.
import { expect, test, type Page } from '@playwright/test';
import { abrirPelea, elegir, hastaElMenu, mensaje, turnoDe } from './ayudantes';

const VARS = { nivel_jair: 6, cassette_cebo_sueno: 1, ataques_jair: 'Cebo sueño|Puñetazo' };

/** Mientras el turno no sea de Jair, el héroe que elige esquiva (así solo actúa Jair). */
async function hastaJair(page: Page) {
  for (let i = 0; i < 8; i++) {
    await hastaElMenu(page);
    if (/jair/i.test((await turnoDe(page)) ?? '')) return;
    await elegir(page, 'Esquivar');
  }
  throw new Error('Nunca le tocó a Jair');
}

test('con un cebo en pie, no deja poner otro y la pelea sigue', async ({ page }) => {
  test.setTimeout(240_000);
  const errores = await abrirPelea(page, 'demo', VARS);

  // Cada turno de Jair: intentar el cebo. Si se pone, sigue la pelea; si ya hay uno, tiene que salir el aviso.
  let aviso = false;
  for (let turno = 0; turno < 8 && !aviso; turno++) {
    await hastaJair(page);
    await elegir(page, 'Atacar');
    await elegir(page, 'Cebo sueño');
    // Si lo rechaza, el menú de ataques se queda abierto (sigue el Puñetazo a la vista) y el aviso se escribe letra
    // por letra: hay que esperarlo. Si lo acepta, el menú se apaga y sigue el turno.
    await page.waitForTimeout(400);
    const sigueAbierto = await page.locator('.batalla-menu:not(.apagado) button', { hasText: 'Puñetazo' }).isVisible();
    if (sigueAbierto) {
      await expect.poll(() => mensaje(page), { timeout: 8_000 }).toMatch(/ya hay un cebo/i);
      aviso = true;
    }
  }
  expect(aviso, 'en 8 turnos nunca quedó el cebo en pie para intentar otro').toBe(true);

  // Con el aviso, el menú sigue respondiendo: el Puñetazo y su blanco.
  await elegir(page, 'Puñetazo');
  await page.locator('.batalla-menu:not(.apagado) button').first().click();
  // La pelea avanza hasta el turno siguiente de Jair, sin trabarse.
  await hastaJair(page);
  expect(errores, errores.join('\n')).toEqual([]);
});
