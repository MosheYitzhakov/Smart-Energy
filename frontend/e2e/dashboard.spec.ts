import { test, expect } from './fixtures/auth.fixture';

test.describe('Dashboard', () => {
  test('shows dashboard after login', async ({ authenticatedPage: page }) => {
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.getByTestId('current-watts')).toBeVisible();
  });

  test('displays daily cost card', async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId('daily-cost')).toBeVisible();
  });

  test('shows energy chart', async ({ authenticatedPage: page }) => {
    await expect(page.getByTestId('energy-chart')).toBeVisible();
  });

  test('shows reconnecting banner when ws is stale', async ({ authenticatedPage: page }) => {
    // Banner should NOT be visible initially
    await expect(page.getByTestId('stale-banner')).not.toBeVisible();
  });
});
