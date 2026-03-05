import { expect, test } from '@playwright/test';

test.describe('frontend smoke', () => {
  test('renders login page', async ({ page }) => {
    const response = await page.goto('/login');

    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole('heading', { name: 'Sign in to AlgoBrute' }),
    ).toBeVisible();
  });

  test('redirects unauthenticated protected route to /login', async ({
    page,
  }) => {
    const response = await page.goto('/operations');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole('heading', { name: 'Sign in to AlgoBrute' }),
    ).toBeVisible();
  });

  test('renders protected app shell when logged_in cookie is present', async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: 'logged_in',
        value: 'true',
        url: 'http://localhost:5173',
      },
    ]);

    const response = await page.goto('/');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: 'Command Center' }),
    ).toBeVisible();

    const body = page.locator('body');
    await expect(body).not.toContainText('Internal Server Error');
    await expect(body).not.toContainText('Application error');
  });
});
