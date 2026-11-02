
const { test, expect } = require('@playwright/test');

test.describe('Inscripción - Validación del nombre del cuarteto', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('index.html');
  });

  test('No permite continuar con el nombre vacío', async ({ page }) => {
    const boton = page.locator('#btnGuardarNombre');

    await expect(boton).toBeDisabled();
  });

  test('Muestra un mensaje si el nombre tiene menos de 3 caracteres', async ({ page }) => {
    await page.locator('#nombreCuarteto').fill('AB');

    await expect(page.locator('#nombreFeedback'))
      .toContainText('Mínimo 3 caracteres');

    await expect(page.locator('#btnGuardarNombre')).toBeDisabled();
  });

  test('Rechaza un nombre de cuarteto duplicado', async ({ page }) => {
    await page.locator('#nombreCuarteto').fill('Arpeggio Quartet');

    await expect(page.locator('#nombreFeedback'))
      .toContainText('El nombre del cuarteto ya se encuentra registrado');

    await expect(page.locator('#btnGuardarNombre')).toBeDisabled();
  });

  test('Acepta un nombre nuevo y permite continuar', async ({ page }) => {
    await page.locator('#nombreCuarteto').fill('Nuevo Cuarteto QA');

    await expect(page.locator('#nombreFeedback'))
      .toContainText('Nombre disponible');

    await expect(page.locator('#btnGuardarNombre')).toBeEnabled();

    await page.locator('#btnGuardarNombre').click();

    await expect(page.locator('#view-integrantes')).toBeVisible();
  });

});
