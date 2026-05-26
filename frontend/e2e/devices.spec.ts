import { test, expect } from './fixtures/auth.fixture';

test.describe('Devices', () => {
  test.beforeEach(async ({ authenticatedPage: page }) => {
    await page.goto('/devices');
  });

  test('shows devices page', async ({ authenticatedPage: page }) => {
    await expect(page.getByRole('heading', { name: /devices/i })).toBeVisible();
  });

  test('shows empty state when no devices', async ({ authenticatedPage: page }) => {
    // Either a device list or an empty-state message should be visible
    const hasDevices = await page.getByTestId('device-card').count();
    if (hasDevices === 0) {
      await expect(page.getByTestId('empty-devices')).toBeVisible();
    }
  });

  test('opens add device dialog', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /add device/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel('Name')).toBeVisible();
    await expect(page.getByLabel(/type/i)).toBeVisible();
  });

  test('closes dialog on cancel', async ({ authenticatedPage: page }) => {
    await page.getByRole('button', { name: /add device/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('can create a device', async ({ authenticatedPage: page }) => {
    const before = await page.getByTestId('device-card').count();

    await page.getByRole('button', { name: /add device/i }).click();
    await page.getByLabel('Name').fill('Test AC Unit');
    await page.getByLabel(/type/i).selectOption('ac');
    await page.getByLabel(/power/i).fill('2400');
    await page.getByRole('button', { name: /save|create/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId('device-card')).toHaveCount(before + 1);
  });
});
