/**
 * E2E coverage for the Command Center new-user onboarding empty-state
 * (Phase Q Wave 1.C — F.3).
 *
 * Behavioural contracts under test:
 *   1. New user (mocked empty fleet) lands on / and sees the EmptyState
 *      component instead of the regular Command Center widgets.
 *   2. Existing user (mocked fleet with one bot) lands on / and sees the
 *      regular Command Center (HeroZone heading present, empty-state absent).
 *   3. Clicking the "Originate via dialogue" CTA navigates to /originate.
 *   4. Clicking the "Build from parameters" CTA navigates to /workbench
 *      (where the Build & Test tab is the default active tab).
 *   5. When Alpaca paper credentials are not connected, the "Set up Alpaca
 *      first" callout is rendered with a link to /settings.
 *
 * Patterns mirror smoke.spec.ts / settings-alpaca.spec.ts:
 *   - `logged_in` cookie for protected routes.
 *   - `page.route('**\/api/**')` for deterministic API mocks.
 *   - Catch-all `{}` fallback for endpoints the empty-state branch doesn't
 *     care about.
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

function connectedAlpacaStatus(): AlpacaStatus {
  return {
    connected: true,
    account_id: 'PA-PAPER-1',
    is_paper: true,
    status_message: 'Paper account connected.',
    paper_connected: true,
    paper_account_id: 'PA-PAPER-1',
    live_connected: false,
    live_account_id: null,
  };
}

function disconnectedAlpacaStatus(): AlpacaStatus {
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

function emptyFleetState() {
  return {
    user_id: '11111111-1111-1111-1111-111111111111',
    timestamp: '2026-05-11T00:00:00Z',
    total_capital: 50000,
    cash_pct: 1.0,
    n_bots: 0,
    bot_snapshots: [],
  };
}

function populatedFleetState() {
  return {
    user_id: '11111111-1111-1111-1111-111111111111',
    timestamp: '2026-05-11T00:00:00Z',
    total_capital: 50000,
    cash_pct: 0.5,
    n_bots: 1,
    bot_snapshots: [
      {
        bot_id: 'bot-1',
        timestamp: '2026-05-11T00:00:00Z',
        state: 'active',
        current_capital: 25000,
        unrealized_pnl: 125.5,
        n_open_trades: 1,
        n_closed_trades: 4,
        sharpe_realized: 0.85,
        drift_detected: false,
        rediscovery_recommended: false,
        strategy_id: 'breakout_momentum',
        ticker: 'SPY',
      },
    ],
  };
}

function defaultFleetWeather() {
  return {
    user_id: '11111111-1111-1111-1111-111111111111',
    timestamp: '2026-05-11T00:00:00Z',
    fleet_capital: 50000,
    cash_pct: 0.5,
    n_active_bots: 1,
    weather_label: 'partly_cloudy',
    weather_score: 65,
    fleet_var_95_dollar: 1500,
    fleet_var_99_dollar: 2500,
    current_regime: 1,
    diversification_cliff_magnitude: 0.1,
    top_recommendation_summary: 'Fleet is operating within bounds.',
  };
}

interface OnboardingMockState {
  fleetState: ReturnType<typeof emptyFleetState> | ReturnType<typeof populatedFleetState>;
  alpacaStatus: AlpacaStatus;
  bots: ReturnType<typeof populatedFleetState>['bot_snapshots'];
}

async function installMocks(page: Page, state: OnboardingMockState) {
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path === '/api/user/profile') {
      return fulfillJson(route, defaultProfile());
    }
    if (path === '/api/user/alpaca/status') {
      return fulfillJson(route, state.alpacaStatus);
    }
    if (path === '/api/fleet/state') {
      return fulfillJson(route, state.fleetState);
    }
    if (path === '/api/bots') {
      return fulfillJson(route, state.bots);
    }
    if (path === '/api/fleet/weather') {
      return fulfillJson(route, defaultFleetWeather());
    }
    if (path === '/api/fleet/weather/history') {
      return fulfillJson(route, []);
    }
    if (path === '/api/fleet/narrative') {
      return fulfillJson(route, {
        headline: 'Fleet steady',
        briefing: 'No issues detected.',
        urgency: 'low',
        next_step: null,
        timestamp: '2026-05-11T00:00:00Z',
      });
    }
    if (path === '/api/fleet/recommendations') {
      return fulfillJson(route, []);
    }
    if (path.startsWith('/api/fleet/benchmark')) {
      return fulfillJson(route, {
        benchmark: 'SPY',
        fleet_return_pct: 0,
        benchmark_return_pct: 0,
        alpha: 0,
        beta: 0,
        information_ratio: 0,
      });
    }
    // BacktestJobNotifier (mounted globally in the (app) layout) iterates
    // this list — it MUST be an array, not `{}`.
    if (path === '/api/backtest' || path === '/api/backtests') {
      return fulfillJson(route, []);
    }
    if (path === '/api/strategies') {
      return fulfillJson(route, []);
    }
    // Catch-all — every other panel hook the Command Center may call gets a
    // permissive empty payload. Status 200 keeps React Query out of error state.
    return fulfillJson(route, {});
  });
}

test.describe('Onboarding empty-state — Wave 1.C (F.3)', () => {
  test('new user with empty fleet sees the EmptyState component', async ({ page }) => {
    await setupAuthCookie(page);
    await installMocks(page, {
      fleetState: emptyFleetState(),
      alpacaStatus: connectedAlpacaStatus(),
      bots: [],
    });

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    await expect(page.getByTestId('onboarding-empty-state')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Welcome to AlgoBrute', level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Let's create your first trading bot.")).toBeVisible();

    // Both CTA cards present.
    await expect(page.getByTestId('onboarding-cta-originate')).toBeVisible();
    await expect(page.getByTestId('onboarding-cta-workbench')).toBeVisible();

    // Value-prop list present with all four bullets.
    await expect(page.getByTestId('onboarding-value-list')).toBeVisible();
    await expect(page.getByText(/Regime-aware backtests across CPCV/)).toBeVisible();
    await expect(page.getByText(/Class-conditional verdicts/)).toBeVisible();
    await expect(page.getByText(/Paper-trade deployment with real Alpaca/)).toBeVisible();
    await expect(page.getByText(/Live monitoring with regime weather/)).toBeVisible();
  });

  test('existing user with at least one bot sees the normal Command Center', async ({ page }) => {
    await setupAuthCookie(page);
    await installMocks(page, {
      fleetState: populatedFleetState(),
      alpacaStatus: connectedAlpacaStatus(),
      bots: populatedFleetState().bot_snapshots,
    });

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Empty-state must NOT render when bots exist.
    await expect(page.getByTestId('onboarding-empty-state')).toHaveCount(0);
    // The Command Center page title is set by AppHeader.
    await expect(
      page.getByRole('heading', { name: 'Command Center' }),
    ).toBeVisible();
  });

  test('clicking "Start a dialogue" navigates to /originate', async ({ page }) => {
    await setupAuthCookie(page);
    await installMocks(page, {
      fleetState: emptyFleetState(),
      alpacaStatus: connectedAlpacaStatus(),
      bots: [],
    });

    await page.goto('/');
    await expect(page.getByTestId('onboarding-empty-state')).toBeVisible();

    await page.getByTestId('onboarding-originate-button').click();
    await expect(page).toHaveURL(/\/originate$/);
    await expect(
      page.getByRole('heading', { name: 'Originate', level: 2 }),
    ).toBeVisible();
  });

  test('clicking "Open the Workbench" navigates to /workbench with Build tab default', async ({ page }) => {
    await setupAuthCookie(page);
    await installMocks(page, {
      fleetState: emptyFleetState(),
      alpacaStatus: connectedAlpacaStatus(),
      bots: [],
    });

    await page.goto('/');
    await expect(page.getByTestId('onboarding-empty-state')).toBeVisible();

    await page.getByTestId('onboarding-workbench-button').click();
    await expect(page).toHaveURL(/\/workbench$/);
    // Workbench defaults to the Build & Test tab — the trigger has aria-selected="true".
    await expect(
      page.getByRole('tab', { name: /Build & Test/ }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  test('Alpaca-not-connected callout renders with link to /settings when paper is disconnected', async ({ page }) => {
    await setupAuthCookie(page);
    await installMocks(page, {
      fleetState: emptyFleetState(),
      alpacaStatus: disconnectedAlpacaStatus(),
      bots: [],
    });

    await page.goto('/');
    await expect(page.getByTestId('onboarding-empty-state')).toBeVisible();
    await expect(page.getByTestId('onboarding-alpaca-callout')).toBeVisible();
    await expect(page.getByText('Set up Alpaca first')).toBeVisible();

    const link = page.getByTestId('onboarding-alpaca-link');
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/settings$/);
  });

  test('Alpaca callout is hidden when paper account is already connected', async ({ page }) => {
    await setupAuthCookie(page);
    await installMocks(page, {
      fleetState: emptyFleetState(),
      alpacaStatus: connectedAlpacaStatus(),
      bots: [],
    });

    await page.goto('/');
    await expect(page.getByTestId('onboarding-empty-state')).toBeVisible();
    await expect(page.getByTestId('onboarding-alpaca-callout')).toHaveCount(0);
  });
});
