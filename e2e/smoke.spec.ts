import { expect, test, type Page, type Route } from '@playwright/test';

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(payload),
  });
}

async function seedWorkbenchState(page: Page, jobId: string) {
  await page.addInitScript((seedJobId) => {
    window.localStorage.setItem(
      'algobrute:bg_jobs',
      JSON.stringify([
        {
          jobId: seedJobId,
          strategyId: 'breakout_momentum',
          ticker: 'SPY',
          submittedAt: '2026-03-07T12:00:00.000Z',
        },
      ]),
    );
  }, jobId);
}

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

  test('launches validation playback and hydrates comparison artifacts', async ({
    context,
    page,
  }) => {
    const jobId = 'job-validation-launch';
    const runId = 'run-validation-launch';
    const validationWindow = {
      days: 30,
      discovery_end_date: '2025-12-02',
      validation_start_date: '2025-12-03',
      validation_end_date: '2026-01-01',
    };
    let launchState: 'idle' | 'running' | 'complete' = 'idle';
    let launchedOverviewCount = 0;

    await context.addCookies([
      {
        name: 'logged_in',
        value: 'true',
        url: 'http://localhost:5173',
      },
    ]);
    await seedWorkbenchState(page, jobId);

    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;

      if (path === '/api/strategies') {
        await fulfillJson(route, [
          {
            strategy_id: 'breakout_momentum',
            name: 'Breakout Momentum',
            description: 'Momentum breakout strategy.',
            is_active: true,
          },
        ]);
        return;
      }

      if (path === '/api/backtest') {
        await fulfillJson(route, []);
        return;
      }

      if (path === `/api/backtest/${jobId}`) {
        await fulfillJson(route, {
          job_id: jobId,
          status: 'running',
          progress_pct: 42,
          progress_phase: 'monte_carlo',
          error_message: null,
          validation_window: validationWindow,
          validation_ready: true,
        });
        return;
      }

      if (
        path === `/api/backtest/${jobId}/validation-simulation` &&
        request.method() === 'POST'
      ) {
        launchState = 'running';
        await fulfillJson(
          route,
          {
            run_id: runId,
            backtest_job_id: jobId,
            strategy_id: 'breakout_momentum',
            ticker: 'SPY',
            status: 'pending',
            validation_window: validationWindow,
            progress_phase: 'queued',
            error_message: null,
            content_hash: 'launch-run-hash',
            timeline_available: false,
            comparison_available: false,
            latest_event_sequence: null,
            created_at: 'launch-run',
            updated_at: 'launch-run',
          },
          202,
        );
        return;
      }

      if (path === `/api/backtest/${jobId}/validation-simulation`) {
        if (launchState !== 'idle') {
          launchedOverviewCount += 1;
          if (launchState === 'running' && launchedOverviewCount >= 2) {
            launchState = 'complete';
          }
        }

        await fulfillJson(route, {
          backtest_job_id: jobId,
          strategy_id: 'breakout_momentum',
          ticker: 'SPY',
          validation_window: validationWindow,
          validation_ready: true,
          latest_run:
            launchState === 'idle'
              ? null
              : {
                  run_id: runId,
                  backtest_job_id: jobId,
                  strategy_id: 'breakout_momentum',
                  ticker: 'SPY',
                  status: launchState,
                  validation_window: validationWindow,
                  progress_phase: launchState === 'running' ? 'simulating' : null,
                  error_message: null,
                  content_hash: 'launch-run-hash',
                  timeline_available: true,
                  comparison_available: launchState === 'complete',
                  latest_event_sequence: launchState === 'running' ? 1 : 2,
                  created_at: 'launch-run',
                  updated_at: 'launch-run',
                },
        });
        return;
      }

      if (path === `/api/backtest/${jobId}/validation-simulation/runs`) {
        await fulfillJson(route, {
          backtest_job_id: jobId,
          runs:
            launchState === 'idle'
              ? []
              : [
                  {
                    run_id: runId,
                    backtest_job_id: jobId,
                    strategy_id: 'breakout_momentum',
                    ticker: 'SPY',
                    status: launchState,
                    validation_window: validationWindow,
                    progress_phase: launchState === 'running' ? 'simulating' : null,
                    error_message: null,
                    content_hash: 'launch-run-hash',
                    timeline_available: true,
                    comparison_available: launchState === 'complete',
                    latest_event_sequence: launchState === 'running' ? 1 : 2,
                    created_at: 'launch-run',
                    updated_at: 'launch-run',
                  },
                ],
        });
        return;
      }

      if (
        path ===
        `/api/backtest/${jobId}/validation-simulation/runs/${runId}/timeline`
      ) {
        await fulfillJson(route, {
          run_id: runId,
          status: launchState,
          result:
            launchState === 'complete'
              ? {
                  run_id: runId,
                  fill_policy: 'next_open_fill',
                  n_events: 2,
                  n_trades: 1,
                  n_closed_trades: 1,
                  realized_pnl: 155,
                  realized_return_pct: 0.155,
                  final_cash: 100155,
                  final_portfolio_value: 100155,
                  gross_exposure: 0,
                  n_open_positions: 0,
                  total_return_pct: 0.155,
                }
              : null,
          latest_risk_state: {
            qualification_active: true,
            signal_strength: 0.92,
            kelly_fraction: 0.14,
            position_size_pct: 5,
            initial_stop_pct: 3.5,
            target_price: 494.5,
            additional_state: {
              regime: 'NORMAL',
              bot_state: launchState === 'complete' ? 'active' : 'ramping',
              cash: 100155,
              portfolio_value: 100155,
              gross_exposure: 0,
              n_open_positions: 0,
            },
          },
          timeline_points: [
            {
              sequence_no: 1,
              event_type: 'order_filled',
              event_time: '2026-01-03T14:30:00.000Z',
              trade_id: 'trade-launch',
              ticker: 'SPY',
              price: 479,
              payload: { action: 'buy' },
              risk_state: {
                qualification_active: true,
                signal_strength: 0.92,
                kelly_fraction: 0.14,
                position_size_pct: 5,
                initial_stop_pct: 3.5,
                target_price: 494.5,
                additional_state: {
                  regime: 'NORMAL',
                  bot_state: 'ramping',
                  active_position: {
                    quantity: 10,
                    current_stop_price: 462.235,
                    target_price: 494.5,
                    unrealized_pct: 0,
                    position_size_pct: 5,
                  },
                },
              },
            },
            {
              sequence_no: 2,
              event_type: 'trade_closed',
              event_time: '2026-01-06T21:00:00.000Z',
              trade_id: 'trade-launch',
              ticker: 'SPY',
              price: 494.5,
              payload: { exit_reason: 'target_hit' },
              risk_state: {
                qualification_active: true,
                signal_strength: 0.92,
                kelly_fraction: 0.14,
                position_size_pct: 5,
                initial_stop_pct: 3.5,
                target_price: 494.5,
                additional_state: {
                  regime: 'NORMAL',
                  bot_state: 'active',
                  cash: 100155,
                  portfolio_value: 100155,
                  gross_exposure: 0,
                  n_open_positions: 0,
                },
              },
            },
          ],
          trade_markers: [
            {
              trade_id: 'trade-launch',
              marker_type: 'entry',
              ticker: 'SPY',
              side: 'long',
              trade_date: '2026-01-03',
              price: 479,
            },
            {
              trade_id: 'trade-launch',
              marker_type: 'exit',
              ticker: 'SPY',
              side: 'long',
              trade_date: '2026-01-06',
              price: 494.5,
              realized_pnl_pct: 3.24,
            },
          ],
          regime_transitions: [],
          day_summaries: [
            {
              trade_date: '2026-01-03',
              sequence_no: 1,
              event_time: '2026-01-03T21:00:00.000Z',
              regime: 'NORMAL',
              close_price: 482,
              cash: 95190,
              portfolio_value: 100010,
              gross_exposure: 4820,
              n_open_positions: 1,
              risk_state: null,
            },
            {
              trade_date: '2026-01-06',
              sequence_no: 2,
              event_time: '2026-01-06T21:00:00.000Z',
              regime: 'NORMAL',
              close_price: 494.5,
              cash: 100155,
              portfolio_value: 100155,
              gross_exposure: 0,
              n_open_positions: 0,
              risk_state: null,
            },
          ],
        });
        return;
      }

      if (
        path ===
        `/api/backtest/${jobId}/validation-simulation/runs/${runId}/trades`
      ) {
        await fulfillJson(route, [
          {
            trade_id: 'trade-launch',
            ticker: 'SPY',
            side: 'long',
            entry_date: '2026-01-03',
            exit_date: '2026-01-06',
            entry_price: 479,
            exit_price: 494.5,
            quantity: 10,
            entry_regime: 'NORMAL',
            exit_regime: 'NORMAL',
            realized_pnl: 155,
            realized_pnl_pct: 3.24,
            mfe_pct: 3.9,
            mae_pct: -0.3,
            holding_bars: 2,
            exit_reason: 'target_hit',
            signal_strength: 0.92,
          },
        ]);
        return;
      }

      if (
        path ===
        `/api/backtest/${jobId}/validation-simulation/runs/${runId}/compare`
      ) {
        await fulfillJson(route, {
          run_id: runId,
          baseline_metrics: { total_return_pct: 12.5 },
          validation_metrics: { total_return_pct: 0.155 },
          headline_metrics: {
            baseline_total_return_pct: 12.5,
            validation_total_return_pct: 0.155,
            validation_fill_policy: 'next_open_fill',
          },
          metric_deltas: {
            total_return_pct_delta: -12.345,
            sharpe_ratio_delta: -0.2,
            n_trades_delta: -1,
          },
          narrative_drivers: {
            trade_flow: 'Playback hydrated from the completed validation run.',
          },
        });
        return;
      }

      const insightMatch = path.match(
        new RegExp(
          `^/api/backtest/${jobId}/validation-simulation/runs/${runId}/insight/([^/]+)$`,
        ),
      );
      if (insightMatch) {
        const [, sectionKey] = insightMatch;
        const payloadBySection: Record<string, { summary: string; sentiment: string }> = {
          playback_overview: {
            summary:
              'The holdout run stayed profitable, and the playback confirms the realized edge was preserved end to end.',
            sentiment: 'positive',
          },
          decision_state: {
            summary:
              'Decision-state telemetry shows the strategy stayed qualified and risk controls remained coherent during the run.',
            sentiment: 'neutral',
          },
          comparison: {
            summary:
              'The out-of-sample run lagged the discovery backtest, but the degradation was controlled rather than catastrophic.',
            sentiment: 'caution',
          },
        };
        await fulfillJson(route, {
          ...payloadBySection[sectionKey]!,
          cached: true,
        });
        return;
      }

      if (
        path ===
          `/api/backtest/${jobId}/validation-simulation/runs/${runId}/question` &&
        request.method() === 'POST'
      ) {
        await fulfillJson(route, {
          headline: 'Validation preserved the edge with some degradation',
          explanation:
            'The holdout run remained profitable, but it underperformed discovery, so the edge looks real but weaker than the in-sample result.',
          action:
            'Review whether the reduced out-of-sample strength still clears your deployment threshold.',
          severity: 'WARNING',
          additional_sections: {
            confidence: 'moderate',
          },
          cached: true,
        });
        return;
      }


      await route.fulfill({ status: 404, body: `Unhandled API route: ${path}` });
    });

    const response = await page.goto('/workbench');
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole('button', { name: 'Launch Validation Run' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Launch Validation Run' }).click();

    await expect(page.getByText('Live Validation Telemetry')).toBeVisible();
    await expect(
      page.getByText('Validation run is actively emitting telemetry'),
    ).toBeVisible();

    await page.waitForTimeout(3_500);

    await expect(page.getByText('Discovery vs Holdout Comparison')).toBeVisible();
    await expect(
      page.getByText('Playback hydrated from the completed validation run.'),
    ).toBeVisible();
    await expect(
      page.getByText(
        'The holdout run stayed profitable, and the playback confirms the realized edge was preserved end to end.',
      ),
    ).toBeVisible();
    await page
      .getByPlaceholder('Ask a question about this validation run…')
      .fill('Did the validation run confirm the backtest edge?');
    await page.getByRole('button', { name: 'Ask' }).click();
    await expect(
      page.getByText('Validation preserved the edge with some degradation'),
    ).toBeVisible();
    await expect(page.getByText('confidence')).toBeVisible();
  });

  test('pins validation playback to the selected historical run', async ({
    context,
    page,
  }) => {
    const jobId = 'job-validation-pin';
    const latestRunId = 'run-latest';
    const olderRunId = 'run-older';
    const validationWindow = {
      days: 30,
      discovery_end_date: '2025-12-02',
      validation_start_date: '2025-12-03',
      validation_end_date: '2026-01-01',
    };

    await context.addCookies([
      {
        name: 'logged_in',
        value: 'true',
        url: 'http://localhost:5173',
      },
    ]);
    await seedWorkbenchState(page, jobId);

    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;

      if (path === '/api/strategies') {
        await fulfillJson(route, [
          {
            strategy_id: 'breakout_momentum',
            name: 'Breakout Momentum',
            description: 'Momentum breakout strategy.',
            is_active: true,
          },
        ]);
        return;
      }

      if (path === '/api/backtest') {
        await fulfillJson(route, []);
        return;
      }

      if (path === `/api/backtest/${jobId}`) {
        await fulfillJson(route, {
          job_id: jobId,
          status: 'running',
          progress_pct: 50,
          progress_phase: 'bootstrap',
          error_message: null,
          validation_window: validationWindow,
          validation_ready: true,
        });
        return;
      }

      if (path === `/api/backtest/${jobId}/validation-simulation`) {
        await fulfillJson(route, {
          backtest_job_id: jobId,
          strategy_id: 'breakout_momentum',
          ticker: 'SPY',
          validation_window: validationWindow,
          validation_ready: true,
          latest_run: {
            run_id: latestRunId,
            backtest_job_id: jobId,
            strategy_id: 'breakout_momentum',
            ticker: 'SPY',
            status: 'complete',
            validation_window: validationWindow,
            progress_phase: null,
            error_message: null,
            content_hash: 'latest-run-hash',
            timeline_available: true,
            comparison_available: true,
            latest_event_sequence: 2,
            created_at: 'latest-run',
            updated_at: 'latest-run',
          },
        });
        return;
      }

      if (path === `/api/backtest/${jobId}/validation-simulation/runs`) {
        await fulfillJson(route, {
          backtest_job_id: jobId,
          runs: [
            {
              run_id: latestRunId,
              backtest_job_id: jobId,
              strategy_id: 'breakout_momentum',
              ticker: 'SPY',
              status: 'complete',
              validation_window: validationWindow,
              progress_phase: null,
              error_message: null,
              content_hash: 'latest-run-hash',
              timeline_available: true,
              comparison_available: true,
              latest_event_sequence: 2,
              created_at: 'latest-run',
              updated_at: 'latest-run',
            },
            {
              run_id: olderRunId,
              backtest_job_id: jobId,
              strategy_id: 'breakout_momentum',
              ticker: 'SPY',
              status: 'complete',
              validation_window: validationWindow,
              progress_phase: null,
              error_message: null,
              content_hash: 'older-run-hash',
              timeline_available: true,
              comparison_available: true,
              latest_event_sequence: 2,
              created_at: 'older-run',
              updated_at: 'older-run',
            },
          ],
        });
        return;
      }

      const runArtifactMatch = path.match(
        new RegExp(
          `^/api/backtest/${jobId}/validation-simulation/runs/([^/]+)/(timeline|trades|compare)$`,
        ),
      );
      if (runArtifactMatch) {
        const [, runId, artifact] = runArtifactMatch;
        const isLatest = runId === latestRunId;

        if (artifact === 'timeline') {
          await fulfillJson(route, {
            run_id: runId,
            status: 'complete',
            result: {
              run_id: runId,
              fill_policy: 'next_open_fill',
              n_events: 2,
              n_trades: 1,
              n_closed_trades: 1,
              realized_pnl: isLatest ? 155 : 42.5,
              realized_return_pct: isLatest ? 0.155 : 0.0425,
              final_cash: isLatest ? 100155 : 100042.5,
              final_portfolio_value: isLatest ? 100155 : 100042.5,
              gross_exposure: 0,
              n_open_positions: 0,
              total_return_pct: isLatest ? 0.155 : 0.0425,
            },
            latest_risk_state: {
              qualification_active: true,
              signal_strength: isLatest ? 0.92 : 0.81,
              additional_state: {
                regime: 'NORMAL',
                bot_state: isLatest ? 'active' : 'ramping',
              },
            },
            timeline_points: [],
            trade_markers: [],
            regime_transitions: [],
            day_summaries: [
              {
                trade_date: '2026-01-06',
                sequence_no: 2,
                event_time: '2026-01-06T21:00:00.000Z',
                regime: 'NORMAL',
                close_price: isLatest ? 494.5 : 482.5,
                cash: isLatest ? 100155 : 100042.5,
                portfolio_value: isLatest ? 100155 : 100042.5,
                gross_exposure: 0,
                n_open_positions: 0,
                risk_state: null,
              },
            ],
          });
          return;
        }

        if (artifact === 'trades') {
          await fulfillJson(route, [
            {
              trade_id: isLatest ? 'trade-latest' : 'trade-older',
              ticker: 'SPY',
              side: 'long',
              entry_date: '2026-01-03',
              exit_date: '2026-01-06',
              entry_price: isLatest ? 479 : 478.25,
              exit_price: isLatest ? 494.5 : 482.5,
              quantity: 10,
              entry_regime: 'NORMAL',
              exit_regime: 'NORMAL',
              realized_pnl: isLatest ? 155 : 42.5,
              realized_pnl_pct: isLatest ? 3.24 : 0.89,
              mfe_pct: isLatest ? 3.9 : 1.2,
              mae_pct: isLatest ? -0.3 : -0.4,
              holding_bars: 2,
              exit_reason: 'target_hit',
              signal_strength: isLatest ? 0.92 : 0.81,
            },
          ]);
          return;
        }

        await fulfillJson(route, {
          run_id: runId,
          baseline_metrics: { total_return_pct: 12.5 },
          validation_metrics: { total_return_pct: isLatest ? 0.155 : 0.0425 },
          headline_metrics: {
            baseline_total_return_pct: 12.5,
            validation_total_return_pct: isLatest ? 0.155 : 0.0425,
            validation_fill_policy: 'next_open_fill',
          },
          metric_deltas: {
            total_return_pct_delta: isLatest ? -12.345 : -12.4575,
            sharpe_ratio_delta: isLatest ? -0.2 : -0.35,
            n_trades_delta: -1,
          },
          narrative_drivers: {
            trade_flow: isLatest ? 'latest narrative' : 'older narrative',
          },
        });
        return;
      }

      const insightMatch = path.match(
        new RegExp(
          `^/api/backtest/${jobId}/validation-simulation/runs/([^/]+)/insight/([^/]+)$`,
        ),
      );
      if (insightMatch) {
        const [, runId, sectionKey] = insightMatch;
        const isLatest = runId === latestRunId;
        const summaries: Record<string, string> = {
          playback_overview: isLatest
            ? 'latest overview insight'
            : 'older overview insight',
          decision_state: isLatest
            ? 'latest decision insight'
            : 'older decision insight',
          comparison: isLatest ? 'latest comparison insight' : 'older comparison insight',
        };
        await fulfillJson(route, {
          summary: summaries[sectionKey] ?? 'unknown insight',
          sentiment: isLatest ? 'neutral' : 'caution',
          cached: true,
        });
        return;
      }

      await route.fulfill({ status: 404, body: `Unhandled API route: ${path}` });
    });

    const response = await page.goto('/workbench');
    expect(response?.status()).toBe(200);

    await expect(page.getByText('latest narrative')).toBeVisible();
    await expect(page.getByText('latest comparison insight')).toBeVisible();

    await page.getByRole('combobox').last().click();
    await page.getByRole('option', { name: /older-run/ }).click();

    await expect(page.getByText('older narrative')).toBeVisible();
    await expect(page.getByText('older comparison insight')).toBeVisible();
    await expect(page.getByText('latest narrative')).not.toBeVisible();
    await expect(page.getByText('latest comparison insight')).not.toBeVisible();
  });
});
