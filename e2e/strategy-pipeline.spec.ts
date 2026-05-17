import { expect, test, type Page, type Route } from '@playwright/test';

/**
 * /strategy/[passport_id] — Phase Q Wave 1.C F.2 smokes.
 *
 * Drives the strategy-lifecycle timeline view through every reachable
 * stage state by stubbing GET /api/origination/strategies/{id}/lifecycle
 * with hand-crafted payloads.  Mutation tests (Run Deep Validation,
 * Deploy as Paper Bot) verify the CTA wires to the engine endpoint
 * with the expected request body.
 */

const PASSPORT_ID = '11111111-2222-3333-4444-555555555555';
const SESSION_ID = '66666666-7777-8888-9999-aaaaaaaaaaaa';
const DEEP_JOB_ID = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
const DEEP_PASSPORT_ID = '00000000-1111-2222-3333-444444444444';
const BOT_ID = '99999999-8888-7777-6666-555555555555';

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function withAuth(page: Page) {
  await page.context().addCookies([
    {
      name: 'logged_in',
      value: 'true',
      url: 'http://localhost:5173',
    },
  ]);
  await page.route('**/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ access_token: 'stub-bearer-token' }),
    });
  });
  // Default profile / Alpaca status — most tests don't care; the deploy
  // test overrides Alpaca to mark paper as connected.
  await page.route('**/api/user/profile', async (route) => {
    await fulfillJson(route, {
      user_id: 'u1',
      email: 'tester@plytos.com',
      expertise_level: 'advanced',
      subscription_tier: 'pro',
      is_active: true,
      created_at: '2026-01-01T00:00:00Z',
      capital_base: null,
      max_drawdown_tolerance_pct: null,
      daily_loss_limit: null,
      risk_comfort_level: null,
      target_annual_return_pct: null,
    });
  });
  await page.route('**/api/user/alpaca/status', async (route) => {
    await fulfillJson(route, {
      connected: false,
      account_id: null,
      is_paper: true,
      status_message: 'no creds',
      paper_connected: false,
      paper_account_id: null,
      live_connected: false,
      live_account_id: null,
    });
  });
}

/**
 * Factory — produce a lifecycle envelope at any state of the pipeline.
 * Use the `with*` helpers below to layer on stage-specific fields.
 */
interface LifecycleStub {
  light_passport_id: string;
  session_id: string;
  strategy_class: string;
  ticker: string;
  originated_at: string;
  dialogue_turn_count: number;
  dialogue_completed_phases: string[];
  light_verdict: string;
  light_metrics: Record<string, number | null>;
  light_trade_count: number;
  light_disclosures: Record<string, unknown>;
  deep_promotion_job_id: string | null;
  deep_promoted_at: string | null;
  deep_job_status: string | null;
  deep_job_progress_phase: string | null;
  deep_passport_id: string | null;
  deep_passport_deployment_approved: boolean | null;
  deep_passport_sharpe: number | null;
  deep_passport_max_drawdown: number | null;
  deep_passport_total_return: number | null;
  deep_passport_blocking_reasons: string[] | null;
  bot_id: string | null;
  bot_state: string | null;
  bot_trading_mode: string | null;
  bot_capital_allocation_pct: number | null;
  bot_initial_capital: number | null;
  bot_deployed_at: string | null;
  live_total_pnl_usd: number | null;
  live_total_pnl_pct: number | null;
  live_closed_trade_count: number | null;
  live_open_position_count: number | null;
  live_last_updated_at: string | null;
}

function baseLifecycle(overrides: Partial<LifecycleStub> = {}): LifecycleStub {
  return {
    light_passport_id: PASSPORT_ID,
    session_id: SESSION_ID,
    strategy_class: 'momentum',
    ticker: 'AAPL',
    originated_at: '2026-04-01T12:00:00Z',
    dialogue_turn_count: 5,
    dialogue_completed_phases: [
      'entry',
      'extraction',
      'exploration',
      'validation',
      'deployment_decision',
    ],
    light_verdict: 'looks_promising',
    light_metrics: {
      sharpe: 1.42,
      max_drawdown: -0.08,
      win_rate: 0.58,
      total_return: 0.34,
    },
    light_trade_count: 62,
    light_disclosures: {
      biases_not_controlled: ['survivorship', 'transaction_cost'],
      sample_caveats: ['Window: 3y; ~62 trades'],
      next_step: 'Run the thorough backtest with multi-ticker walk-forward.',
    },
    deep_promotion_job_id: null,
    deep_promoted_at: null,
    deep_job_status: null,
    deep_job_progress_phase: null,
    deep_passport_id: null,
    deep_passport_deployment_approved: null,
    deep_passport_sharpe: null,
    deep_passport_max_drawdown: null,
    deep_passport_total_return: null,
    deep_passport_blocking_reasons: null,
    bot_id: null,
    bot_state: null,
    bot_trading_mode: null,
    bot_capital_allocation_pct: null,
    bot_initial_capital: null,
    bot_deployed_at: null,
    live_total_pnl_usd: null,
    live_total_pnl_pct: null,
    live_closed_trade_count: null,
    live_open_position_count: null,
    live_last_updated_at: null,
    ...overrides,
  };
}

function withDeepRunning(stub: LifecycleStub): LifecycleStub {
  return {
    ...stub,
    deep_promotion_job_id: DEEP_JOB_ID,
    deep_promoted_at: '2026-04-15T12:00:00Z',
    deep_job_status: 'running',
    deep_job_progress_phase: 'cpcv_combinatorial_split',
  };
}

function withDeepApproved(stub: LifecycleStub): LifecycleStub {
  return {
    ...stub,
    deep_promotion_job_id: DEEP_JOB_ID,
    deep_promoted_at: '2026-04-15T12:00:00Z',
    deep_job_status: 'complete',
    deep_job_progress_phase: 'complete',
    deep_passport_id: DEEP_PASSPORT_ID,
    deep_passport_deployment_approved: true,
    deep_passport_sharpe: 1.65,
    deep_passport_max_drawdown: -0.07,
    deep_passport_total_return: 0.42,
    deep_passport_blocking_reasons: [],
  };
}

function withDeepBlocked(stub: LifecycleStub): LifecycleStub {
  return {
    ...stub,
    deep_promotion_job_id: DEEP_JOB_ID,
    deep_promoted_at: '2026-04-15T12:00:00Z',
    deep_job_status: 'complete',
    deep_job_progress_phase: 'complete',
    deep_passport_id: DEEP_PASSPORT_ID,
    deep_passport_deployment_approved: false,
    deep_passport_sharpe: 0.45,
    deep_passport_max_drawdown: -0.22,
    deep_passport_total_return: 0.08,
    deep_passport_blocking_reasons: [
      'health_sharpe_below_threshold',
      'health_max_drawdown_exceeded',
    ],
  };
}

function withDeployed(stub: LifecycleStub): LifecycleStub {
  return {
    ...stub,
    bot_id: BOT_ID,
    bot_state: 'ramping',
    bot_trading_mode: 'paper',
    bot_capital_allocation_pct: 0.05,
    bot_initial_capital: 10_000,
    bot_deployed_at: '2026-05-01T14:00:00Z',
    live_closed_trade_count: 0,
    live_open_position_count: 1,
    live_total_pnl_usd: null,
    live_total_pnl_pct: null,
    live_last_updated_at: '2026-05-02T10:00:00Z',
  };
}

function withLiveActive(stub: LifecycleStub): LifecycleStub {
  return {
    ...withDeployed(stub),
    bot_state: 'active',
    live_closed_trade_count: 5,
    live_open_position_count: 1,
    live_total_pnl_usd: 320.5,
    live_total_pnl_pct: 0.032,
    live_last_updated_at: '2026-05-10T15:00:00Z',
  };
}

/**
 * Helper — register a single GET lifecycle stub for the canonical
 * passport id.  Tests override by re-registering before navigating.
 */
async function stubLifecycle(page: Page, payload: LifecycleStub) {
  await page.route(
    `**/api/origination/strategies/${PASSPORT_ID}/lifecycle`,
    async (route) => {
      await fulfillJson(route, payload);
    },
  );
}

/**
 * Helper — register a GET monitoring-report stub for the canonical
 * bot id.  The strategy-detail page fetches this only when the live
 * stage has closed-trade evidence (task #365).
 */
async function stubMonitoringReport(
  page: Page,
  overrides: Partial<MonitoringReportStub> = {},
) {
  const payload: MonitoringReportStub = {
    bot_id: BOT_ID,
    timestamp: '2026-05-10T15:00:00Z',
    sprt_win_rate_decision: 'reject_h0',
    sprt_win_rate_n_obs: 40,
    sprt_win_rate_llr: 3.1,
    sprt_payoff_decision: 'continue',
    sprt_payoff_n_obs: 40,
    sprt_payoff_llr: 0.4,
    cusum_status: 'stable',
    cusum_sum: 0.12,
    win_rate_posterior_mean: 0.58,
    win_rate_posterior_ci_lower: 0.51,
    win_rate_posterior_ci_upper: 0.65,
    pnl_posterior_mean: 64.1,
    pnl_posterior_ci_lower: 12.0,
    pnl_posterior_ci_upper: 116.2,
    alerts: [],
    passport_id: PASSPORT_ID,
    passport_version: 1,
    ...overrides,
  };
  await page.route(
    `**/api/monitoring/bots/${BOT_ID}/report`,
    async (route) => {
      await fulfillJson(route, payload);
    },
  );
}

interface MonitoringReportStub {
  bot_id: string;
  timestamp: string;
  sprt_win_rate_decision: string;
  sprt_win_rate_n_obs: number;
  sprt_win_rate_llr: number;
  sprt_payoff_decision: string;
  sprt_payoff_n_obs: number;
  sprt_payoff_llr: number;
  cusum_status: string;
  cusum_sum: number;
  win_rate_posterior_mean: number;
  win_rate_posterior_ci_lower: number;
  win_rate_posterior_ci_upper: number;
  pnl_posterior_mean: number;
  pnl_posterior_ci_lower: number;
  pnl_posterior_ci_upper: number;
  alerts: string[];
  passport_id: string | null;
  passport_version: number | null;
}

test.describe('/strategy/[passport_id] — F.2 timeline smokes', () => {
  test('renders the timeline with auth and origination + light-backtest stages always populated', async ({
    page,
  }) => {
    await withAuth(page);
    await stubLifecycle(page, baseLifecycle());

    const response = await page.goto(`/strategy/${PASSPORT_ID}`);
    expect(response?.status()).toBe(200);

    await expect(page.getByTestId('strategy-page')).toBeVisible();
    await expect(page.getByTestId('strategy-class')).toContainText('Momentum');
    await expect(page.getByTestId('current-stage-chip')).toContainText(
      'Light backtest complete',
    );

    // Origination stage — always complete.
    await expect(page.getByTestId('stage-origination')).toBeVisible();
    await expect(page.getByTestId('origination-turn-count')).toContainText('5');
    await expect(page.getByTestId('origination-phases')).toContainText('DEPLOYMENT DECISION');
    await expect(page.getByTestId('origination-replay-link')).toHaveAttribute(
      'href',
      `/originate?session=${SESSION_ID}`,
    );

    // Light backtest — verdict + metrics + trade count.
    await expect(page.getByTestId('stage-light-backtest')).toBeVisible();
    await expect(page.getByTestId('light-verdict-badge')).toContainText('Looks promising');
    await expect(page.getByTestId('light-metric-sharpe')).toContainText('1.42');
    await expect(page.getByTestId('light-trade-count')).toContainText('62');
  });

  test('deep stage renders Run Deep Validation CTA when not promoted', async ({ page }) => {
    await withAuth(page);
    await stubLifecycle(page, baseLifecycle());
    await page.goto(`/strategy/${PASSPORT_ID}`);

    await expect(page.getByTestId('stage-deep-backtest')).toHaveAttribute(
      'data-stage-status',
      'pending',
    );
    await expect(page.getByTestId('deep-state-not-promoted')).toBeVisible();
    await expect(page.getByTestId('deep-promote-cta')).toBeEnabled();
    await expect(page.getByTestId('deep-promote-cta')).toContainText('Run Deep Validation');
  });

  test('deep stage shows running progress when job is in flight', async ({ page }) => {
    await withAuth(page);
    await stubLifecycle(page, withDeepRunning(baseLifecycle()));
    await page.goto(`/strategy/${PASSPORT_ID}`);

    await expect(page.getByTestId('stage-deep-backtest')).toHaveAttribute(
      'data-stage-status',
      'in_progress',
    );
    await expect(page.getByTestId('deep-state-running')).toBeVisible();
    await expect(page.getByTestId('deep-progress-phase')).toContainText('cpcv combinatorial split');
    await expect(page.getByTestId('current-stage-chip')).toContainText(
      'Deep validation running',
    );
  });

  test('deep stage shows approved metrics + deployment-ready CTA when approved', async ({
    page,
  }) => {
    await withAuth(page);
    await stubLifecycle(page, withDeepApproved(baseLifecycle()));
    await page.goto(`/strategy/${PASSPORT_ID}`);

    await expect(page.getByTestId('stage-deep-backtest')).toHaveAttribute(
      'data-stage-status',
      'complete',
    );
    await expect(page.getByTestId('deep-state-approved')).toBeVisible();
    await expect(page.getByTestId('deep-metric-sharpe')).toContainText('1.65');

    // Deployment unlocks.
    await expect(page.getByTestId('stage-deployment')).toBeVisible();
    await expect(page.getByTestId('deployment-state-ready')).toBeVisible();
    await expect(page.getByTestId('deployment-deploy-cta')).toBeEnabled();
  });

  test('deep stage shows blocking reasons + skipped deployment when not approved', async ({
    page,
  }) => {
    await withAuth(page);
    await stubLifecycle(page, withDeepBlocked(baseLifecycle()));
    await page.goto(`/strategy/${PASSPORT_ID}`);

    await expect(page.getByTestId('stage-deep-backtest')).toHaveAttribute(
      'data-stage-status',
      'failed',
    );
    await expect(page.getByTestId('deep-state-blocked')).toBeVisible();
    await expect(page.getByTestId('deep-blocking-reasons')).toContainText(
      'health sharpe below threshold',
    );
    await expect(page.getByTestId('deep-blocking-reasons')).toContainText(
      'health max drawdown exceeded',
    );

    // Deployment stays skipped.
    await expect(page.getByTestId('deployment-state-not-authorized')).toBeVisible();
  });

  test('deployed state surfaces bot details + view-bot link', async ({ page }) => {
    await withAuth(page);
    await stubLifecycle(page, withDeployed(withDeepApproved(baseLifecycle())));
    await page.goto(`/strategy/${PASSPORT_ID}`);

    await expect(page.getByTestId('stage-deployment')).toHaveAttribute(
      'data-stage-status',
      'complete',
    );
    await expect(page.getByTestId('deployment-state-deployed')).toBeVisible();
    await expect(page.getByTestId('deployment-bot-state')).toContainText('ramping');
    await expect(page.getByTestId('deployment-view-bot-link')).toHaveAttribute(
      'href',
      `/operations?bot=${BOT_ID}`,
    );

    // Live operation panel shows ramping because no closed trades yet.
    await expect(page.getByTestId('live-state-ramping')).toBeVisible();
  });

  test('live-active state surfaces total P&L + closed-trade counts', async ({ page }) => {
    await withAuth(page);
    await stubLifecycle(page, withLiveActive(withDeepApproved(baseLifecycle())));
    await stubMonitoringReport(page);
    await page.goto(`/strategy/${PASSPORT_ID}`);

    await expect(page.getByTestId('stage-live-operation')).toHaveAttribute(
      'data-stage-status',
      'complete',
    );
    await expect(page.getByTestId('live-state-active')).toBeVisible();
    await expect(page.getByTestId('live-total-pnl-usd')).toContainText('320.50');
    await expect(page.getByTestId('live-total-pnl-pct')).toContainText('3.20%');
    await expect(page.getByTestId('current-stage-chip')).toContainText('Live operating');
    await expect(page.getByTestId('live-view-performance-link')).toHaveAttribute(
      'href',
      `/operations?bot=${BOT_ID}`,
    );

    // Task #365 — behavioral monitoring section appears under the
    // active P&L block with plain-language SPRT/CUSUM/Bayesian
    // verdicts sourced from the monitoring-report endpoint.
    const monitoring = page.getByTestId('live-monitoring-section');
    await expect(monitoring).toBeVisible();
    await expect(monitoring).toContainText('Live behavior');
    await expect(monitoring).toContainText('SPRT Win Rate');
    await expect(monitoring).toContainText('Skill confirmed');
    await expect(monitoring).toContainText('Performance stable');
    await expect(monitoring).toContainText('58.0%');
  });

  test('live-ramping state does not render the monitoring section', async ({
    page,
  }) => {
    await withAuth(page);
    await stubLifecycle(page, withDeployed(withDeepApproved(baseLifecycle())));
    // No monitoring stub — if the hook fires we want the test to fail
    // loudly via an unhandled fetch rather than passing silently.
    await page.goto(`/strategy/${PASSPORT_ID}`);

    await expect(page.getByTestId('live-state-ramping')).toBeVisible();
    await expect(page.getByTestId('live-monitoring-section')).toHaveCount(0);
  });

  test('Run Deep Validation CTA POSTs to /promote-to-deep endpoint', async ({ page }) => {
    await withAuth(page);
    await stubLifecycle(page, baseLifecycle());

    let promoteCalled = false;
    let promoteBody: string | null = null;
    await page.route(
      `**/api/origination/strategies/${PASSPORT_ID}/promote-to-deep`,
      async (route) => {
        promoteCalled = true;
        promoteBody = route.request().postData() ?? '';
        await fulfillJson(
          route,
          {
            deep_job_id: DEEP_JOB_ID,
            submitted_at: '2026-05-11T12:00:00Z',
          },
          202,
        );
      },
    );

    await page.goto(`/strategy/${PASSPORT_ID}`);
    await expect(page.getByTestId('deep-promote-cta')).toBeEnabled();
    await page.getByTestId('deep-promote-cta').click();

    await expect.poll(() => promoteCalled).toBe(true);
    // Empty `{}` body honours the endpoint contract (default lookback).
    expect(promoteBody).toBe('{}');
  });

  test('Deploy as Paper Bot CTA opens modal + requires paper Alpaca', async ({ page }) => {
    await withAuth(page);
    await stubLifecycle(page, withDeepApproved(baseLifecycle()));
    await page.goto(`/strategy/${PASSPORT_ID}`);

    await page.getByTestId('deployment-deploy-cta').click();
    await expect(page.getByTestId('deploy-bot-modal')).toBeVisible();
    await expect(page.getByTestId('deploy-paper-required-notice')).toBeVisible();
    // Submit disabled until paper is connected.
    await expect(page.getByTestId('deploy-submit')).toBeDisabled();
  });

  test('Deploy as Paper Bot modal submits + invalidates the lifecycle (paper connected)', async ({
    page,
  }) => {
    await withAuth(page);

    // Override Alpaca status: paper connected.
    await page.route('**/api/user/alpaca/status', async (route) => {
      await fulfillJson(route, {
        connected: true,
        account_id: 'PAPER-XYZ',
        is_paper: true,
        status_message: 'paper ok',
        paper_connected: true,
        paper_account_id: 'PAPER-XYZ',
        live_connected: false,
        live_account_id: null,
      });
    });

    // Lifecycle: first response is approved + no bot; after deploy, returns deployed.
    let lifecycleCallCount = 0;
    const approvedNoBot = withDeepApproved(baseLifecycle());
    const deployedAfter = withDeployed(approvedNoBot);
    await page.route(
      `**/api/origination/strategies/${PASSPORT_ID}/lifecycle`,
      async (route) => {
        lifecycleCallCount += 1;
        const payload = lifecycleCallCount > 1 ? deployedAfter : approvedNoBot;
        await fulfillJson(route, payload);
      },
    );

    // Backtest export — needed for the deploy modal to resolve strategy_id.
    await page.route(`**/api/backtest/${DEEP_JOB_ID}/export`, async (route) => {
      await fulfillJson(route, {
        metadata: {
          report_version: '1.0',
          generated_at: '2026-04-15T13:00:00Z',
          job_id: DEEP_JOB_ID,
          strategy_id: 'breakout_momentum',
          ticker: 'AAPL',
          start_date: '2023-01-01',
          end_date: '2026-01-01',
          initial_capital: 10_000,
          status: 'complete',
          created_at: '2026-04-15T12:00:00Z',
          completed_at: '2026-04-15T13:00:00Z',
          validation_window: null,
          validation_ready: false,
        },
        executive_summary: {
          sharpe_ratio: 1.65,
          total_return_pct: 0.42,
          max_drawdown_pct: -0.07,
          n_trades: 80,
          win_rate: 0.62,
          payoff_ratio: 1.4,
          avg_return_pct: 0.5,
          return_std_pct: 1.1,
          profit_factor: 1.8,
          pbo_probability: 0.1,
          path_consistency: 0.9,
          mc_overall_p_value: 0.02,
          reliability_score: 0.85,
          reliability_passed: true,
          deployment_approved: true,
          sortino_ratio: 1.9,
          calmar_ratio: 2.1,
          omega_ratio: 1.6,
          cagr_pct: 0.18,
          expectancy_pct: 0.4,
          var_95_pct: -1.5,
          cvar_95_pct: -2.1,
        },
        cpcv_analysis: null,
        monte_carlo_analysis: null,
        bootstrap_analysis: null,
        risk_rules_by_regime: {},
        trade_analytics: null,
        passport: {
          passport_id: DEEP_PASSPORT_ID,
          passport_version: 1,
          strategy_id: 'breakout_momentum',
          strategy_class: 'momentum',
          ticker: 'AAPL',
          created_at: '2026-04-15T13:00:00Z',
          data_start_date: '2023-01-01',
          data_end_date: '2026-01-01',
          regime_model_version: 'v1',
          n_regime_states: 4,
          regime_names: {},
          regime_conviction_mean: 0.7,
          psr: 0.95,
          dsr: 0.92,
          mcs_included: true,
          bootstrap_sharpe_ci_lower: 1.2,
          bootstrap_sharpe_ci_upper: 2.1,
          reliability_overall: 0.85,
          reliability_passed: true,
          reliability_layer_scores: {},
          reliability_hard_failures: [],
          deployment_approved: true,
          deployment_notes: 'ok',
          sensitivity_overall_robustness: 0.8,
          fragile_parameters: [],
          robust_parameters: [],
          content_hash: 'abc',
        },
        llm_context: null,
      });
    });

    let deployBody: Record<string, unknown> | null = null;
    await page.route('**/api/bots/deploy', async (route) => {
      const data = route.request().postData();
      deployBody = data ? (JSON.parse(data) as Record<string, unknown>) : null;
      await fulfillJson(
        route,
        {
          bot_id: BOT_ID,
          strategy_id: 'breakout_momentum',
          ticker: 'AAPL',
          capital_allocation_pct: 0.05,
          initial_capital: 10_000,
          state: 'ramping',
          created_at: '2026-05-11T15:00:00Z',
          passport_id: DEEP_PASSPORT_ID,
          passport_version: 1,
          direction: 'long',
        },
        201,
      );
    });

    await page.goto(`/strategy/${PASSPORT_ID}`);
    await page.getByTestId('deployment-deploy-cta').click();
    await expect(page.getByTestId('deploy-bot-modal')).toBeVisible();
    // No paper-required notice when paper IS connected.
    await expect(page.getByTestId('deploy-paper-required-notice')).toHaveCount(0);
    await expect(page.getByTestId('deploy-ticker-input')).toHaveValue('AAPL');

    await expect(page.getByTestId('deploy-submit')).toBeEnabled();
    await page.getByTestId('deploy-submit').click();

    // After the mutation lands, the lifecycle refetches and the bot
    // appears in stage 4.
    await expect(page.getByTestId('deployment-state-deployed')).toBeVisible();

    expect(deployBody).not.toBeNull();
    expect(deployBody!.passport_id).toBe(DEEP_PASSPORT_ID);
    expect(deployBody!.strategy_id).toBe('breakout_momentum');
    expect(deployBody!.ticker).toBe('AAPL');
  });

  test('404 unknown passport shows graceful empty state', async ({ page }) => {
    await withAuth(page);
    await page.route(
      `**/api/origination/strategies/${PASSPORT_ID}/lifecycle`,
      async (route) => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Light-backtest passport not found.' }),
        });
      },
    );

    await page.goto(`/strategy/${PASSPORT_ID}`);
    await expect(page.getByTestId('strategy-page-empty')).toBeVisible();
    await expect(page.getByTestId('strategy-page-empty')).toContainText('Strategy not found');
    // Same empty UI for 403 — see next test.
  });

  test('403 cross-user passport shows the same not-found empty state (opaque)', async ({
    page,
  }) => {
    await withAuth(page);
    await page.route(
      `**/api/origination/strategies/${PASSPORT_ID}/lifecycle`,
      async (route) => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Forbidden.' }),
        });
      },
    );

    await page.goto(`/strategy/${PASSPORT_ID}`);
    // Frontend deliberately renders the same empty UI for 403 + 404 so
    // the wire surface doesn't disclose ownership.
    await expect(page.getByTestId('strategy-page-empty')).toBeVisible();
  });
});
