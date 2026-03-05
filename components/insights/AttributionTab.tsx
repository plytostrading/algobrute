'use client';
import Link from 'next/link';
import { useMemo } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import { useBacktestExport } from '@/hooks/useBacktestWorkflow';
import SectionInsightCard from '@/components/insights/SectionInsightCard';
import { REGIME_STRING_HEX } from '@/lib/colors';

const REGIME_NAMES: Record<string, string> = {
  '0': 'Low Vol', '1': 'Normal', '2': 'Elevated Vol', '3': 'Crisis',
  LOW_VOL: 'Low Vol', NORMAL: 'Normal', ELEVATED_VOL: 'Elevated Vol', CRISIS: 'Crisis',
};

// Normalize avg_return_in_regime (in %) to [0, 100] using tanh-squash:
// 0% → 50, +2% → ~88, -2% → ~12.  Captures sign and magnitude while
// keeping all regimes visually comparable on the same radar axis.
function normalizeAvgReturn(r: number): number {
  return Math.round(50 + 50 * Math.tanh(r / 2));
}

// Anti-drawdown score: 1 + max_drawdown_in_regime (drawdown is expressed as a
// negative fraction e.g. -0.15 means -15%).  Multiply by 100 to get [0, 100].
// -50% DD → 50, 0% DD → 100.
function normalizeAntiDrawdown(dd: number): number {
  return Math.round(Math.max(0, Math.min(100, (1 + dd) * 100)));
}

// Bootstrap CI quality score: how far ci_lower is above zero relative to the
// observed Sharpe.  If ci_lower > 0 the strategy has positive edge with 95%
// confidence; the ratio ci_lower / observed_sharpe calibrates how strong.
function bootstrapQualityScore(
  ciLower: number,
  observedSharpe: number,
  ciExcludesZero: boolean,
): number {
  if (!ciExcludesZero || observedSharpe <= 0) {
    // Partial credit: scale negative ci_lower from 0 to 50
    return Math.max(0, Math.round(50 + (ciLower / Math.max(0.1, Math.abs(observedSharpe))) * 50));
  }
  return Math.min(100, Math.round((ciLower / observedSharpe) * 100));
}

interface AttributionTabProps {
  jobId: string | null;
}

export default function AttributionTab({ jobId }: AttributionTabProps) {
  const { data: report, isLoading, isError, error } = useBacktestExport(jobId, !!jobId);

  if (!jobId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16">
          <p className="text-sm text-muted-foreground">Select a completed backtest above to view attribution.</p>
          <Link href="/workbench" className="text-xs text-primary underline-offset-4 hover:underline">
            Run a backtest in the Workbench →
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <p className="text-sm text-destructive">{error?.message ?? 'Failed to load attribution data.'}</p>
          <p className="text-xs text-muted-foreground">
            Choose another completed backtest or rerun this one to regenerate attribution outputs.
          </p>
          <Link href="/workbench" className="text-xs text-primary underline-offset-4 hover:underline">
            Open Workbench →
          </Link>
        </CardContent>
      </Card>
    );
  }

  const passport = report?.passport;
  const cpcv = report?.cpcv_analysis;
  const bootstrap = report?.bootstrap_analysis;
  const ta = report?.trade_analytics;

  // ── Skill vs Luck Radar data ─────────────────────────────────────────────
  // 6-axis overall radar: PSR, DSR, Path Consistency, Anti-Overfit (1-PBO),
  // Reliability, Bootstrap CI Quality.  All axes normalised to [0, 100].
  const overallRadarData = useMemo(() => {
    if (!passport && !cpcv && !bootstrap) return null;
    const psr    = passport?.psr    != null ? Math.round(passport.psr    * 100) : null;
    const dsr    = passport?.dsr    != null ? Math.round(passport.dsr    * 100) : null;
    const path   = cpcv?.path_consistency  != null ? Math.round(cpcv.path_consistency  * 100) : null;
    const anti   = cpcv?.pbo_probability   != null ? Math.round((1 - cpcv.pbo_probability) * 100) : null;
    const rel    = passport?.reliability_overall != null ? Math.round(passport.reliability_overall * 100) :
                   report?.executive_summary.reliability_score != null ? Math.round(report.executive_summary.reliability_score * 100) : null;
    const bootQ  = bootstrap != null
      ? bootstrapQualityScore(bootstrap.ci_lower, bootstrap.observed_sharpe, bootstrap.ci_excludes_zero)
      : null;
    // Only render if we have at least 3 axes
    const filled = [psr, dsr, path, anti, rel, bootQ].filter(v => v != null).length;
    if (filled < 3) return null;
    return [
      { metric: 'PSR',           value: psr   ?? 0, fullMark: 100 },
      { metric: 'DSR',           value: dsr   ?? 0, fullMark: 100 },
      { metric: 'Path Cons.',    value: path  ?? 0, fullMark: 100 },
      { metric: 'Anti-Overfit',  value: anti  ?? 0, fullMark: 100 },
      { metric: 'Reliability',   value: rel   ?? 0, fullMark: 100 },
      { metric: 'Boot CI',       value: bootQ ?? 0, fullMark: 100 },
    ];
  }, [passport, cpcv, bootstrap, report]);

  // ── Per-regime multi-series radar ─────────────────────────────────────────
  // 4 axes: Win Rate, Avg Return (tanh-normalised), Anti-Drawdown, Kelly.
  // Each regime is a separate Radar series overlaid on the same chart.
  const riskRules = report?.risk_rules_by_regime;
  const regimeRadarAxes = ['Win Rate', 'Avg Return', 'Anti-DD', 'Kelly'];
  const regimeRadarData = useMemo(() => {
    if (!riskRules || Object.keys(riskRules).length === 0) return null;
    // Build rows where each row is one axis, and each regime is a column.
    return regimeRadarAxes.map((axisLabel) => {
      const row: Record<string, string | number> = { axis: axisLabel };
      for (const [rName, rr] of Object.entries(riskRules)) {
        const label = REGIME_NAMES[rName] ?? rName;
        if (axisLabel === 'Win Rate')    row[label] = Math.round(rr.win_rate_in_regime * 100);
        if (axisLabel === 'Avg Return')  row[label] = normalizeAvgReturn(rr.avg_return_in_regime);
        if (axisLabel === 'Anti-DD')     row[label] = normalizeAntiDrawdown(rr.max_drawdown_in_regime);
        if (axisLabel === 'Kelly')       row[label] = Math.min(100, Math.round(rr.kelly_fraction * 4 * 100));
      }
      return row;
    });
  }, [riskRules]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Per-regime performance table ──────────────────────────────────────────
  type RegimeRow = Record<string, number | boolean | string>;
  const regimeRows: RegimeRow[] = ta?.by_regime
    ? Object.entries(ta.by_regime).map(([regime, metrics]) => ({ regime, ...metrics } as RegimeRow))
    : [];

  const regimeChartData = regimeRows.map((r) => ({
    name: REGIME_NAMES[String(r.regime)] ?? String(r.regime),
    win_rate: typeof r.win_rate === 'number' ? parseFloat(((r.win_rate as number) * 100).toFixed(1)) : null,
    sharpe: typeof r.sharpe === 'number' ? parseFloat((r.sharpe as number).toFixed(2)) : null,
    n_trades: typeof r.n_trades === 'number' ? r.n_trades : null,
  }));

  // Regime keys for iterating per-regime radar series
  const regimeSeriesKeys = useMemo(() => {
    if (!riskRules) return [];
    return Object.keys(riskRules).map((k) => REGIME_NAMES[k] ?? k);
  }, [riskRules]);

  const tooltipStyle = {
    backgroundColor: 'var(--color-popover)',
    borderColor: 'var(--color-border)',
    borderRadius: '8px',
    fontSize: '12px',
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Skill vs Luck — Overall Radar */}
      <Card>
        <CardHeader>
          <CardTitle>Skill vs Luck Decomposition</CardTitle>
          <CardDescription>
            {passport
              ? `PSR / DSR / Path Consistency / Anti-Overfit / Reliability / Bootstrap CI — all axes [0–100]. ${passport.n_regime_states} regime states, ${passport.data_start_date.slice(0, 10)} to ${passport.data_end_date.slice(0, 10)}.`
              : 'Multi-dimensional skill signal quality assessment.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectionInsightCard jobId={jobId} sectionKey="skill_vs_luck" className="mb-4" />
          {isLoading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : overallRadarData ? (
            <div className="flex flex-col gap-4">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={overallRadarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                    <PolarGrid stroke="var(--color-border)" strokeOpacity={0.6} />
                    <PolarAngleAxis
                      dataKey="metric"
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                      tickCount={4}
                    />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="var(--color-chart-2)"
                      fill="var(--color-chart-2)"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number, _: string) => [`${v}/100`, 'Score']}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {/* Score legend */}
              <div className="rounded-md border p-3 grid grid-cols-3 gap-x-6 gap-y-1">
                {overallRadarData.map((d) => (
                  <div key={d.metric} className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{d.metric}</span>
                    <span className={`font-mono-data text-xs font-bold ${
                      d.value >= 75 ? 'text-success' : d.value >= 50 ? 'text-warning' : 'text-destructive'
                    }`}>{d.value}/100</span>
                  </div>
                ))}
              </div>
              {passport?.deployment_notes && (
                <p className="text-xs text-muted-foreground leading-relaxed border-t pt-2">{passport.deployment_notes}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Skill decomposition data not available.</p>
          )}
        </CardContent>
      </Card>

      {/* Per-Regime Skill Decomposition Radar */}
      {regimeRadarData && regimeSeriesKeys.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skill vs Luck — Per Regime</CardTitle>
            <CardDescription>
              Win Rate, Avg Return (tanh-normalised, 50=zero edge), Anti-Drawdown (100=no DD),
              Kelly fraction (scaled 25%=100). Each regime is an overlaid polygon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[260px] w-full" />
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={regimeRadarData} margin={{ top: 10, right: 40, left: 40, bottom: 10 }}>
                    <PolarGrid stroke="var(--color-border)" strokeOpacity={0.6} />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
                    />
                    <PolarRadiusAxis
                      angle={90}
                      domain={[0, 100]}
                      tick={{ fontSize: 9, fill: 'var(--color-muted-foreground)' }}
                      tickCount={4}
                    />
                    {regimeSeriesKeys.map((regime) => {
                      // Map display name back to regime key for color lookup
                      const colorKey = Object.entries(REGIME_NAMES).find(([, v]) => v === regime)?.[0] ?? regime;
                      const color = REGIME_STRING_HEX[colorKey] ?? REGIME_STRING_HEX[regime] ?? '#94a3b8';
                      return (
                        <Radar
                          key={regime}
                          name={regime}
                          dataKey={regime}
                          stroke={color}
                          fill={color}
                          fillOpacity={0.12}
                          strokeWidth={1.8}
                        />
                      );
                    })}
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number, name: string) => [`${v}/100`, name]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Per-Regime Performance */}
      {regimeRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Per-Regime Performance</CardTitle>
            <CardDescription>Win rate and trade count by market regime</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Win Rate by Regime (%)</p>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regimeChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--color-popover)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '13px' }} formatter={(v: number) => [`${v}%`, 'Win Rate']} />
                      <Bar dataKey="win_rate" radius={[4, 4, 0, 0]}>
                        {regimeChartData.map((r, i) => (
                          <Cell key={i} fill={(r.win_rate ?? 0) >= 50 ? 'var(--color-success)' : 'var(--color-destructive)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="overflow-x-auto rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Regime</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Trades</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Win Rate</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sharpe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regimeRows.map((r) => (
                      <tr key={String(r.regime)} className="border-b last:border-b-0 hover:bg-muted/20">
                        <td className="px-3 py-2 text-xs">{REGIME_NAMES[String(r.regime)] ?? String(r.regime)}</td>
                        <td className="px-3 py-2 text-right font-mono-data text-xs">{typeof r.n_trades === 'number' ? r.n_trades : '\u2014'}</td>
                        <td className={`px-3 py-2 text-right font-mono-data text-xs font-semibold ${typeof r.win_rate === 'number' && (r.win_rate as number) >= 0.5 ? 'text-success' : 'text-destructive'}`}>
                          {typeof r.win_rate === 'number' ? `${((r.win_rate as number) * 100).toFixed(1)}%` : '\u2014'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono-data text-xs">{typeof r.sharpe === 'number' ? (r.sharpe as number).toFixed(2) : '\u2014'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bootstrap CI */}
      {bootstrap && (
        <Card>
          <CardHeader>
            <CardTitle>Bootstrap Sharpe CI</CardTitle>
            <CardDescription>
              Stationary bootstrap {(bootstrap.confidence_level * 100).toFixed(0)}% BCa confidence interval
              ({bootstrap.n_replicates.toLocaleString()} replicates, optimal block = {bootstrap.optimal_block_length.toFixed(1)} periods).
              Bias = observed − bootstrap mean; positive bias may indicate overfitting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SectionInsightCard jobId={jobId} sectionKey="bootstrap_ci" className="mb-4" />
            <div className="grid grid-cols-4 gap-4 text-sm mb-4">
              <div>
                <span className="text-muted-foreground block text-xs">Observed Sharpe</span>
                <span className={`font-mono-data text-xl font-bold ${
                  bootstrap.observed_sharpe >= 1 ? 'text-success' : bootstrap.observed_sharpe >= 0 ? '' : 'text-destructive'
                }`}>{bootstrap.observed_sharpe.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">{(bootstrap.confidence_level * 100).toFixed(0)}% CI</span>
                <span className="font-mono-data text-xl font-bold">[{bootstrap.ci_lower.toFixed(3)}, {bootstrap.ci_upper.toFixed(3)}]</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">CI Excludes Zero</span>
                <span className={`font-mono-data text-xl font-bold ${bootstrap.ci_excludes_zero ? 'text-success' : 'text-warning'}`}>
                  {bootstrap.ci_excludes_zero ? '\u2713 Yes' : '\u2717 No'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">Bias</span>
                {(() => {
                  const bias = parseFloat((bootstrap.observed_sharpe - bootstrap.bootstrap_mean).toFixed(3));
                  return (
                    <span className={`font-mono-data text-xl font-bold ${
                      Math.abs(bias) < 0.05 ? 'text-success' : bias > 0.1 ? 'text-warning' : ''
                    }`}>{bias >= 0 ? '+' : ''}{bias.toFixed(3)}</span>
                  );
                })()}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 rounded-md border p-3">
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Boot. Mean</span>
                <span className="font-mono-data text-sm font-bold">{bootstrap.bootstrap_mean.toFixed(3)}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Boot. Std</span>
                <span className="font-mono-data text-sm font-bold">{bootstrap.bootstrap_std.toFixed(3)}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">CI Width</span>
                <span className={`font-mono-data text-sm font-bold ${
                  bootstrap.ci_width < 0.5 ? 'text-success' : bootstrap.ci_width < 1.0 ? 'text-warning' : 'text-destructive'
                }`}>{bootstrap.ci_width.toFixed(3)}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Block Length</span>
                <span className="font-mono-data text-sm font-bold">{bootstrap.optimal_block_length.toFixed(1)} bars</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
