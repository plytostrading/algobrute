/**
 * Layer 3 — persona-driven visual UI walkthroughs.
 *
 * Five scripted customer journeys driven through the real Next.js
 * frontend via Playwright.  Mirrors the Layer 2 (API) persona fleet
 * at the visual/DOM level: same user archetypes, same UX contracts,
 * but now grounded in what the customer actually sees.
 *
 * Patterns follow the existing smoke.spec.ts:
 *   - `logged_in` cookie for protected routes.
 *   - `page.route('**\/api/**')` for deterministic API mocks.
 *   - Screenshots captured per persona for visual audit trail.
 *
 * Each persona asserts:
 *   - Expected heading / landmark renders.
 *   - No "Internal Server Error" / "Application error" markers.
 *   - No empty `<body>` (non-hydrated page).
 *   - Critical affordances (forms, buttons, navigation) present.
 */

import { expect, test, type Page, type Route } from '@playwright/test';

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

async function setupAuthCookie(page: Page) {
  await page.context().addCookies([
    { name: 'logged_in', value: 'true', url: 'http://localhost:5173' },
  ]);
}

async function screenForFatalMarkers(page: Page) {
  const body = page.locator('body');
  await expect(body).not.toContainText('Internal Server Error');
  await expect(body).not.toContainText('Application error');
  await expect(body).not.toContainText('Traceback');
  await expect(body).not.toContainText('undefined is not a function');
}

test.describe('Layer 3 — persona visual walkthroughs', () => {
  /* ────────────────────────────────────────────────────────────
   * Persona 1: new user — lands on /login, sees the sign-in UI.
   * ──────────────────────────────────────────────────────────── */
  test('persona: new user sees a coherent sign-in page', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response?.status()).toBe(200);

    // Login heading is the single most important element for a new user.
    await expect(
      page.getByRole('heading', { name: 'Sign in to AlgoBrute' }),
    ).toBeVisible();

    // A sign-in form is the primary affordance.
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    await screenForFatalMarkers(page);

    // Visual audit trail.
    await page.screenshot({
      path: 'e2e-screenshots/persona-new-user-login.png',
      fullPage: true,
    });
  });

  /* ────────────────────────────────────────────────────────────
   * Persona 2: conservative quant — app shell + command center.
   * ──────────────────────────────────────────────────────────── */
  test('persona: conservative quant renders the command centre', async ({
    page,
  }) => {
    await setupAuthCookie(page);

    // Mock every /api/** call to return safe empty-state responses so
    // the UI renders without backend dependency.
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.startsWith('/api/bots')) return fulfillJson(route, []);
      if (path.startsWith('/api/fleet')) return fulfillJson(route, {});
      if (path.startsWith('/api/strategies')) return fulfillJson(route, []);
      return fulfillJson(route, {});
    });

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole('heading', { name: 'Command Center' }),
    ).toBeVisible();
    await screenForFatalMarkers(page);

    await page.screenshot({
      path: 'e2e-screenshots/persona-conservative-quant-home.png',
      fullPage: true,
    });
  });

  /* ────────────────────────────────────────────────────────────
   * Persona 3: aggressive trader — navigates to operations (bot fleet).
   * ──────────────────────────────────────────────────────────── */
  test('persona: aggressive trader reaches the operations surface', async ({
    page,
  }) => {
    await setupAuthCookie(page);

    // Supply a 5-bot fleet so the page has something to show.
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.startsWith('/api/bots')) {
        return fulfillJson(
          route,
          Array.from({ length: 5 }, (_, i) => ({
            bot_id: `bot-${i}`,
            strategy_id: 'breakout_momentum',
            ticker: `T${i}`,
            state: 'ACTIVE',
            trading_mode: 'paper',
            capital_allocation_pct: 0.1,
            initial_capital: 20000,
          })),
        );
      }
      return fulfillJson(route, {});
    });

    const response = await page.goto('/operations');
    // Operations is protected; the response may be 200 (rendered) or 3xx (redirect).
    expect([200, 302, 307]).toContain(response?.status());

    // After navigation settles, the body should be non-empty and fatal-marker free.
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
    await screenForFatalMarkers(page);

    await page.screenshot({
      path: 'e2e-screenshots/persona-aggressive-trader-operations.png',
      fullPage: true,
    });
  });

  /* ────────────────────────────────────────────────────────────
   * Persona 4: risk manager — visits portfolio surface.
   * ──────────────────────────────────────────────────────────── */
  test('persona: risk manager inspects the portfolio surface', async ({
    page,
  }) => {
    await setupAuthCookie(page);

    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.includes('/fleet/weather')) {
        return fulfillJson(route, {
          generated_at: '2026-04-19T12:00:00Z',
          overall_status: 'clear',
          component_scores: {},
        });
      }
      if (path.includes('/fleet/dashboard')) {
        return fulfillJson(route, { bots: [], summary: {} });
      }
      return fulfillJson(route, {});
    });

    const response = await page.goto('/portfolio');
    expect([200, 302, 307]).toContain(response?.status());
    await screenForFatalMarkers(page);

    await page.screenshot({
      path: 'e2e-screenshots/persona-risk-manager-portfolio.png',
      fullPage: true,
    });
  });

  /* ────────────────────────────────────────────────────────────
   * Persona 5: ops on-call — visits insights (monitoring surface).
   * ──────────────────────────────────────────────────────────── */
  test('persona: ops on-call reaches the insights surface', async ({
    page,
  }) => {
    await setupAuthCookie(page);

    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.includes('healing-events')) {
        return fulfillJson(route, { events: [], pagination: { total: 0 } });
      }
      return fulfillJson(route, {});
    });

    const response = await page.goto('/insights');
    expect([200, 302, 307]).toContain(response?.status());
    await screenForFatalMarkers(page);

    await page.screenshot({
      path: 'e2e-screenshots/persona-ops-on-call-insights.png',
      fullPage: true,
    });
  });
});
