/**
 * E2E coverage for the Settings page AlpacaCard refactor (Phase Q Wave 1.B
 * — task E.4.B).  The card was previously a single API-key/secret form
 * that addressed one credential row; it is now a Tabs component with
 * independent Paper and Live panels matching the engine's mode-aware
 * `/api/user/alpaca/*` endpoints.
 *
 * The tests below mock `/api/user/alpaca/status` + `connect` + `disconnect`
 * deterministically — they assert UI behaviour, not Alpaca itself.
 *
 * Patterns mirror `personas.spec.ts` and `smoke.spec.ts`:
 *   - `logged_in` cookie for protected routes.
 *   - `page.route('**\/api/**')` for deterministic API mocks.
 *   - Screenshots captured for visual audit trail.
 */

import { expect, test, type Page, type Route } from '@playwright/test';

type AlpacaStatus = {
  connected: boolean;
  account_id: string | null;
  is_paper: boolean;
  status_message: string;
  paper_connected: boolean;
  paper_account_id: string | null;
  live_connected: boolean;
  live_account_id: string | null;
};

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

function defaultProfile() {
  return {
    user_id: '11111111-1111-1111-1111-111111111111',
    email: 'beta-user@example.com',
    expertise_level: 'intermediate',
    subscription_tier: 'standard',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    capital_base: 50000,
    max_drawdown_tolerance_pct: 15,
    daily_loss_limit: 500,
    risk_comfort_level: 'moderate',
    target_annual_return_pct: 20,
  };
}

function disconnectedStatus(): AlpacaStatus {
  return {
    connected: false,
    account_id: null,
    is_paper: true,
    status_message: 'No Alpaca account connected.',
    paper_connected: false,
    paper_account_id: null,
    live_connected: false,
    live_account_id: null,
  };
}

/**
 * Wires deterministic mocks for the settings page.  The Alpaca status is
 * stateful — `paper`/`live` connect and disconnect requests mutate the
 * `current` reference so subsequent reads reflect the change.
 */
async function setupSettingsMocks(
  page: Page,
  options: {
    initialStatus?: AlpacaStatus;
    onConnect?: (mode: 'paper' | 'live', status: AlpacaStatus) => void;
    onDisconnect?: (mode: 'paper' | 'live', status: AlpacaStatus) => void;
  } = {},
) {
  const current: { value: AlpacaStatus } = {
    value: options.initialStatus ?? disconnectedStatus(),
  };
  const profile = defaultProfile();

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === '/api/user/profile' && method === 'GET') {
      return fulfillJson(route, profile);
    }
    if (path === '/api/user/alpaca/status' && method === 'GET') {
      return fulfillJson(route, current.value);
    }
    if (path === '/api/user/alpaca/connect' && method === 'POST') {
      const body = JSON.parse(request.postData() ?? '{}') as {
        api_key: string;
        secret_key: string;
        mode: 'paper' | 'live';
      };
      const accountId = body.mode === 'paper' ? 'PA-PAPER-1' : 'PA-LIVE-1';
      const next: AlpacaStatus = {
        ...current.value,
        ...(body.mode === 'paper'
          ? { paper_connected: true, paper_account_id: accountId }
          : { live_connected: true, live_account_id: accountId }),
      };
      const paperConnected = next.paper_connected;
      next.connected = paperConnected || next.live_connected;
      next.is_paper = paperConnected;
      next.account_id = paperConnected ? next.paper_account_id : next.live_account_id;
      next.status_message = paperConnected
        ? 'Alpaca paper account connected.'
        : next.live_connected
          ? 'Alpaca live account connected.'
          : 'No Alpaca account connected.';
      current.value = next;
      options.onConnect?.(body.mode, current.value);
      return fulfillJson(route, current.value);
    }
    if (path === '/api/user/alpaca/disconnect' && method === 'DELETE') {
      const body = JSON.parse(request.postData() ?? '{}') as {
        mode: 'paper' | 'live';
      };
      const next: AlpacaStatus = {
        ...current.value,
        ...(body.mode === 'paper'
          ? { paper_connected: false, paper_account_id: null }
          : { live_connected: false, live_account_id: null }),
      };
      const paperConnected = next.paper_connected;
      next.connected = paperConnected || next.live_connected;
      next.is_paper = paperConnected || !next.live_connected;
      next.account_id = paperConnected
        ? next.paper_account_id
        : next.live_connected
          ? next.live_account_id
          : null;
      next.status_message = paperConnected
        ? 'Alpaca paper account connected.'
        : next.live_connected
          ? 'Alpaca live account connected.'
          : 'No Alpaca account connected.';
      current.value = next;
      options.onDisconnect?.(body.mode, current.value);
      return route.fulfill({ status: 204, body: '' });
    }

    // Fall-through.  The settings page renders inside the app shell which
    // pulls list-shaped data (bots, backtest list, fleet recommendations)
    // from the sidebar / header.  Mock those as empty arrays so the page is
    // not blocked on data that isn't relevant to the AlpacaCard tests.
    if (
      method === 'GET' &&
      (path === '/api/backtest' ||
        path.startsWith('/api/bots') ||
        path === '/api/strategies' ||
        path.startsWith('/api/strategies/') ||
        path === '/api/fleet/recommendations')
    ) {
      return fulfillJson(route, []);
    }
    return fulfillJson(route, {});
  });

  return current;
}

test.describe('Settings — AlpacaCard paper + live mode tabs (E.4.B)', () => {
  test('paper tab renders form, submits with mode=paper, then shows connected state', async ({
    page,
  }) => {
    await setupAuthCookie(page);
    let lastConnect: { mode: 'paper' | 'live' } | null = null;
    await setupSettingsMocks(page, {
      onConnect: (mode) => {
        lastConnect = { mode };
      },
    });

    const response = await page.goto('/settings');
    expect(response?.status()).toBe(200);

    // Tabs are visible — Paper is the default active tab.
    await expect(page.getByTestId('alpaca-tab-paper')).toBeVisible();
    await expect(page.getByTestId('alpaca-tab-live')).toBeVisible();

    // The hard-coded paper-mode trust copy is rendered.
    await expect(
      page.getByText(
        /Paper trading credentials connect to Alpaca's paper sandbox/i,
      ),
    ).toBeVisible();

    // Connect form is rendered in the paper panel.
    await expect(page.getByTestId('alpaca-api-key-paper')).toBeVisible();
    await expect(page.getByTestId('alpaca-secret-key-paper')).toBeVisible();

    // Submit the form.
    await page.getByTestId('alpaca-api-key-paper').fill('PKTEST_PAPER_KEY');
    await page.getByTestId('alpaca-secret-key-paper').fill('PAPER_SECRET');
    await page.getByTestId('alpaca-connect-paper').click();

    // After success we render the Connected state with the account ID.
    await expect(page.getByTestId('alpaca-status-paper')).toBeVisible();
    await expect(page.getByText('Account: PA-PAPER-1')).toBeVisible();

    expect(lastConnect).toEqual({ mode: 'paper' });

    await page.screenshot({
      path: 'e2e-screenshots/settings-alpaca-paper-connected.png',
      fullPage: true,
    });
  });

  test('live tab renders deferred-state copy and submits with mode=live', async ({
    page,
  }) => {
    await setupAuthCookie(page);
    let lastConnect: { mode: 'paper' | 'live' } | null = null;
    await setupSettingsMocks(page, {
      onConnect: (mode) => {
        lastConnect = { mode };
      },
    });

    const response = await page.goto('/settings');
    expect(response?.status()).toBe(200);

    // Switch to the Live tab.
    await page.getByTestId('alpaca-tab-live').click();

    // The deferred-state copy is rendered — trust-building moment.
    await expect(
      page.getByText(
        /Live trading is currently disabled during closed beta/i,
      ),
    ).toBeVisible();
    await expect(
      page.getByText(
        /no live orders will be placed until the platform enables live trading/i,
      ),
    ).toBeVisible();

    // Connect form is still rendered (we accept storage of live creds even
    // when live trading is disabled — the form is not disabled).
    await expect(page.getByTestId('alpaca-api-key-live')).toBeVisible();
    await expect(page.getByTestId('alpaca-secret-key-live')).toBeVisible();
    await expect(page.getByTestId('alpaca-connect-live')).toBeVisible();

    // Submit the form.
    await page.getByTestId('alpaca-api-key-live').fill('AK_LIVE_KEY');
    await page.getByTestId('alpaca-secret-key-live').fill('LIVE_SECRET');
    await page.getByTestId('alpaca-connect-live').click();

    // After success we render Connected for live.
    await expect(page.getByTestId('alpaca-status-live')).toBeVisible();
    await expect(page.getByText('Account: PA-LIVE-1')).toBeVisible();

    expect(lastConnect).toEqual({ mode: 'live' });

    await page.screenshot({
      path: 'e2e-screenshots/settings-alpaca-live-connected.png',
      fullPage: true,
    });
  });

  test('status reflects both modes independently', async ({ page }) => {
    await setupAuthCookie(page);
    await setupSettingsMocks(page, {
      initialStatus: {
        connected: true,
        account_id: 'PA-PAPER-1',
        is_paper: true,
        status_message: 'Alpaca paper account connected.',
        paper_connected: true,
        paper_account_id: 'PA-PAPER-1',
        live_connected: true,
        live_account_id: 'PA-LIVE-1',
      },
    });

    const response = await page.goto('/settings');
    expect(response?.status()).toBe(200);

    // Paper tab shows the connected state for paper.
    await expect(page.getByTestId('alpaca-tab-paper')).toBeVisible();
    await expect(page.getByTestId('alpaca-status-paper')).toBeVisible();
    await expect(page.getByText('Account: PA-PAPER-1')).toBeVisible();

    // Live tab shows the connected state for live — independently.
    await page.getByTestId('alpaca-tab-live').click();
    await expect(page.getByTestId('alpaca-status-live')).toBeVisible();
    await expect(page.getByText('Account: PA-LIVE-1')).toBeVisible();
  });

  test('disconnecting paper preserves live and vice versa', async ({ page }) => {
    await setupAuthCookie(page);
    const seen: Array<{ kind: 'connect' | 'disconnect'; mode: 'paper' | 'live' }> = [];
    await setupSettingsMocks(page, {
      initialStatus: {
        connected: true,
        account_id: 'PA-PAPER-1',
        is_paper: true,
        status_message: 'Alpaca paper account connected.',
        paper_connected: true,
        paper_account_id: 'PA-PAPER-1',
        live_connected: true,
        live_account_id: 'PA-LIVE-1',
      },
      onDisconnect: (mode) => {
        seen.push({ kind: 'disconnect', mode });
      },
    });

    const response = await page.goto('/settings');
    expect(response?.status()).toBe(200);

    // Disconnect paper.
    await expect(page.getByTestId('alpaca-disconnect-paper')).toBeVisible();
    await page.getByTestId('alpaca-disconnect-paper').click();
    // Confirm in the alert dialog.
    await page.getByRole('alertdialog').getByRole('button', { name: 'Disconnect' }).click();

    // Paper now shows the connect form again.
    await expect(page.getByTestId('alpaca-api-key-paper')).toBeVisible();

    // Switch to live — still connected.
    await page.getByTestId('alpaca-tab-live').click();
    await expect(page.getByTestId('alpaca-status-live')).toBeVisible();
    await expect(page.getByText('Account: PA-LIVE-1')).toBeVisible();

    // Now disconnect live.
    await page.getByTestId('alpaca-disconnect-live').click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Disconnect' }).click();

    // Live tab now shows the connect form.
    await expect(page.getByTestId('alpaca-api-key-live')).toBeVisible();

    // Switch back to paper — also still showing the connect form (was not
    // re-connected by the live disconnect).
    await page.getByTestId('alpaca-tab-paper').click();
    await expect(page.getByTestId('alpaca-api-key-paper')).toBeVisible();

    // Both modes were independently disconnected — order matters for the
    // assertion that paper-disconnect did not also clear live.
    expect(seen).toEqual([
      { kind: 'disconnect', mode: 'paper' },
      { kind: 'disconnect', mode: 'live' },
    ]);
  });
});
