'use client';

/**
 * FleetSensitivityPanel  (F2)
 *
 * Shows the result of portfolio what-if analysis:
 *   1. Baseline metrics banner — Sharpe (with SE), Vol, MaxDD, VaR-95, ENIB, T
 *   2. Removal impacts table   — what happens if each deployed bot is removed
 *
 * Each table row is expandable to reveal delta bar charts for all 5 metrics.
 * Significance is flagged at the 2-SE (≈95% confidence) level.
 * Sorted exactly as the backend delivers: removal = ascending delta_sharpe (worst first).
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Info, AlertTriangle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useFleetSensitivity } from '@/hooks/useFleetSensitivity';
import { formatPercent } from '@/utils/formatters';
import FleetPanelInsightCard from '@/components/insights/FleetPanelInsightCard';
import type { BotSensitivityResult, BotSensitivityMetrics } from '@/types/api';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function fmtPct(v: number | null): string {
  if (v === null) return 'N/A';
  return formatPercent(v * 100);
}

function fmtDelta(v: number | null, scale: number = 1, fixed: number = 2): string {
  if (v === null) return '—';
  const scaled = v * scale;
  return `${scaled >= 0 ? '+' : ''}${scaled.toFixed(fixed)}`;
}

function deltaClass(v: number | null, positiveIsGood = true): string {
  if (v === null) return 'text-muted-foreground';
  const good = positiveIsGood ? v > 0 : v < 0;
  const bad = positiveIsGood ? v < 0 : v > 0;
  if (good) return 'text-success';
  if (bad) return 'text-destructive';
  return 'text-muted-foreground';
}

// ---------------------------------------------------------------------------
// Baseline banner
// ---------------------------------------------------------------------------

interface MetricTileProps {
  label: string;
  value: string;
  tooltip?: string;
}

function MetricTile({ label, value, tooltip }: MetricTileProps) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2 text-center" title={tooltip}>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="font-mono-data text-sm font-bold leading-tight">{value}</p>
    </div>
  );
}

interface SharpeWithSETileProps {
  sharpe: number | null;
  sharpe_se: number | null;
}

function SharpeWithSETile({ sharpe, sharpe_se }: SharpeWithSETileProps) {
  const seStr = sharpe_se !== null ? `±${sharpe_se.toFixed(2)}` : '';
  const tooltip =
    sharpe_se !== null
      ? `Annualized Sharpe (RF=4%). SE=${sharpe_se.toFixed(3)} — a ΔSharpe is significant at ~95% when |Δ| > ${(2 * sharpe_se).toFixed(3)}`
      : 'Annualized Sharpe ratio of current fleet (RF = 4%)';
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2 text-center" title={tooltip}>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        Sharpe
      </p>
      <p className="font-mono-data text-sm font-bold leading-tight">
        {sharpe !== null ? sharpe.toFixed(2) : 'N/A'}
      </p>
      {seStr && (
        <p className="font-mono-data text-[9px] text-muted-foreground/70 leading-none mt-0.5">
          {seStr}
        </p>
      )}
    </div>
  );
}

interface BaselineBannerProps {
  metrics: BotSensitivityMetrics;
  analyticsSource: string;
}

function BaselineBanner({ metrics, analyticsSource }: BaselineBannerProps) {
  if (metrics.data_insufficient) {
    return (
      <div className="rounded-lg bg-muted/30 border border-border px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
        <Info className="h-4 w-4 shrink-0 opacity-60" />
        Insufficient trade history to compute fleet baseline metrics (need ≥ 100 observations
        {metrics.n_observations !== null ? `; current T = ${metrics.n_observations}` : ''}).
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Current Fleet Baseline
        </p>
        <div className="flex items-center gap-1.5">
          {metrics.n_observations !== null && (
            <span
              className="text-[9px] text-muted-foreground/60"
              title="Number of daily observations used to compute metrics (T). More observations → smaller standard error → more reliable significance test."
            >
              T&nbsp;=&nbsp;{metrics.n_observations}
            </span>
          )}
          <Badge variant="outline" className="text-[9px] h-4">
            Source: {analyticsSource}
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2">
        <SharpeWithSETile sharpe={metrics.sharpe_ratio} sharpe_se={metrics.sharpe_se} />
        <MetricTile
          label="Ann. Vol"
          value={fmtPct(metrics.annualized_volatility)}
          tooltip="Annualized volatility of fleet daily returns"
        />
        <MetricTile
          label="Max DD"
          value={fmtPct(metrics.max_drawdown)}
          tooltip="Maximum peak-to-trough drawdown"
        />
        <MetricTile
          label="VaR 95%"
          value={fmtPct(metrics.var_95_pct)}
          tooltip="1-day 95% historical Value at Risk"
        />
        <MetricTile
          label="ENIB"
          value={fmtPct(metrics.enib)}
          tooltip="Equity Not Invested in Bots (idle cash fraction)"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Delta bar chart
// ---------------------------------------------------------------------------

interface DeltaBarProps {
  label: string;
  value: number | null;
  /** Scale to apply before rendering (e.g. ×100 to convert fraction→%) */
  scale?: number;
  unit?: string;
  /** True when a positive delta is good (e.g. Sharpe), false otherwise (Vol, DD, VaR) */
  positiveIsGood?: boolean;
}

function DeltaBar({ label, value, scale = 1, unit = '', positiveIsGood = true }: DeltaBarProps) {
  if (value === null) return null;

  const scaled = value * scale;
  const isPositive = scaled >= 0;
  const barColor = (positiveIsGood ? isPositive : !isPositive) ? '#22c55e' : '#ef4444';
  const barWidth = Math.min(Math.abs(scaled) * 4, 100); // clamp to 100% visual
  const formatted = `${isPositive ? '+' : ''}${scaled.toFixed(2)}${unit}`;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <div className="flex-1 flex items-center gap-1">
        {/* Zero line + bar */}
        <div className="flex-1 relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute top-0 h-full rounded-full transition-all"
            style={{
              width: `${barWidth / 2}%`,
              left: isPositive ? '50%' : `calc(50% - ${barWidth / 2}%)`,
              background: barColor,
            }}
          />
          {/* Zero line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border" />
        </div>
        <span
          className={`font-mono-data w-16 text-right shrink-0 ${
            (positiveIsGood ? isPositive : !isPositive) ? 'text-success' : 'text-destructive'
          }`}
        >
          {formatted}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sensitivity row (removal only)
// ---------------------------------------------------------------------------

interface SensitivityRowProps {
  result: BotSensitivityResult;
}

function SensitivityRow({ result }: SensitivityRowProps) {
  const [open, setOpen] = useState(false);

  const deltaSharpeClass = deltaClass(result.delta_sharpe, true);
  const capitalPct = (result.capital_fraction * 100).toFixed(1);

  // Statistical significance: |delta_sharpe| > 2 × SE(baseline Sharpe) ≈ 95% confidence
  const se = result.baseline_metrics.sharpe_se;
  const ds = result.delta_sharpe;
  const hasSeInfo = se !== null && se !== undefined && ds !== null;
  const isInsignificant = hasSeInfo && Math.abs(ds!) <= 2 * se!;
  const isSignificant = hasSeInfo && Math.abs(ds!) > 2 * se!;

  return (
    <div className="rounded-lg border">
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/30 transition-colors rounded-lg"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium truncate">{result.bot_name}</span>
            {result.ticker && (
              <span className="text-[11px] text-muted-foreground">{result.ticker}</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Capital {capitalPct}% of fleet
          </p>
        </div>

        {/* ΔSharpe with significance label */}
        <div
          className="text-right shrink-0"
          title={
            se !== null && se !== undefined
              ? `2×SE threshold: ±${(2 * se).toFixed(3)} — deltas within this band are not statistically distinguishable from noise at ~95% confidence`
              : undefined
          }
        >
          <p className="text-[10px] text-muted-foreground">ΔSharpe</p>
          <p className={`font-mono-data text-sm font-semibold ${deltaSharpeClass}`}>
            {fmtDelta(result.delta_sharpe)}
          </p>
          {isInsignificant && (
            <p className="text-[9px] text-muted-foreground/70 mt-0.5">not significant</p>
          )}
          {isSignificant && (
            <p
              className={`text-[9px] mt-0.5 ${
                (result.delta_sharpe ?? 0) > 0 ? 'text-success/80' : 'text-destructive/80'
              }`}
            >
              significant
            </p>
          )}
        </div>

        {/* ΔVol + ΔDD secondary */}
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[10px] text-muted-foreground">ΔVol / ΔMaxDD</p>
          <p className="font-mono-data text-xs">
            <span className={deltaClass(result.delta_volatility, false)}>
              {fmtDelta(result.delta_volatility, 100, 2)}%
            </span>
            {' / '}
            <span className={deltaClass(result.delta_max_drawdown, false)}>
              {fmtDelta(result.delta_max_drawdown, 100, 2)}%
            </span>
          </p>
        </div>

        {/* Chevron */}
        <div className="shrink-0 text-muted-foreground">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded: delta charts */}
      {open && (
        <div className="border-t px-3 py-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Impact if Removed — Delta vs. Baseline
          </p>
          <DeltaBar label="Sharpe" value={result.delta_sharpe} positiveIsGood={true} />
          <DeltaBar
            label="Ann. Vol"
            value={result.delta_volatility}
            scale={100}
            unit="%"
            positiveIsGood={false}
          />
          <DeltaBar
            label="Max DD"
            value={result.delta_max_drawdown}
            scale={100}
            unit="%"
            positiveIsGood={false}
          />
          <DeltaBar
            label="VaR 95%"
            value={
              result.simulated_metrics.var_95_pct !== null &&
              result.baseline_metrics.var_95_pct !== null
                ? result.simulated_metrics.var_95_pct - result.baseline_metrics.var_95_pct
                : null
            }
            scale={100}
            unit="%"
            positiveIsGood={false}
          />
          <DeltaBar
            label="ENIB"
            value={result.delta_enib}
            scale={100}
            unit="%"
            positiveIsGood={true}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export default function FleetSensitivityPanel() {
  const { data, isLoading, isError } = useFleetSensitivity();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Portfolio Sensitivity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            Portfolio Sensitivity Analysis
            <Badge variant="outline" className="text-[9px] h-4">F2</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border px-4 py-3 text-sm text-muted-foreground">
            <AlertTriangle className="h-4 w-4 shrink-0 opacity-60" />
            Unable to load sensitivity analysis. Data will appear once sufficient trade history
            is available.
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasRemovals = data.removal_impacts.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          Portfolio Sensitivity Analysis
          <Badge variant="outline" className="text-[9px] h-4">
            F2
          </Badge>
        </CardTitle>
        <CardDescription className="text-[11px]">
          What-if impact of removing each deployed strategy on fleet Sharpe, volatility, and
          drawdown
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* AI Insight */}
        <FleetPanelInsightCard panelKey="sensitivity" />

        {/* Baseline metrics */}
        <BaselineBanner
          metrics={data.baseline_metrics}
          analyticsSource={data.analytics_source}
        />

        {/* Removal impacts */}
        {hasRemovals && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Removal Impact — Sorted by Worst Sharpe Delta
            </p>
            <div className="space-y-1.5">
              {data.removal_impacts.map((r) => (
                <SensitivityRow key={r.bot_id ?? r.bot_name} result={r} />
              ))}
            </div>
          </div>
        )}

        {!hasRemovals && (
          <p className="text-sm text-muted-foreground text-center py-6">
            No removal data available. Deploy at least one bot with sufficient trade history
            to enable sensitivity analysis.
          </p>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-1.5 rounded-md bg-muted/30 px-2.5 py-2 text-[10px] text-muted-foreground">
          <Info className="h-3 w-3 shrink-0 mt-0.5 opacity-60" />
          <span>
            Sensitivity metrics are estimated from realized closed-trade P&amp;L and do not
            capture unrealized mark-to-market movements. Results should be interpreted as
            directional signals, not precise forecasts.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
