'use client';

/**
 * StrategyDNA
 *
 * A compact "fund fact sheet" for a strategy, showing:
 *   - Deployment approval + reliability score
 *   - Per-regime performance breakdown (from backend by_regime)
 *   - PSR, bootstrap CI, fragile parameters
 *   - LLM key concerns / strengths
 *   - Compact regime timeline chart
 *
 * DATA: BacktestExportReport.passport + trade_analytics.by_regime +
 *       llm_context. All data from the backend — no frontend inference.
 */

import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useBacktestExport, useBacktestTrades } from '@/hooks/useBacktestWorkflow';
import RegimeTimelineChart from '@/components/portfolio/RegimeTimelineChart';

// ---------------------------------------------------------------------------
// Regime display helpers (keys in by_regime are backend Regime.name strings)
// ---------------------------------------------------------------------------

const REGIME_NAME_LABELS: Record<string, string> = {
  LOW_VOL: 'Low Vol',
  NORMAL: 'Normal',
  ELEVATED_VOL: 'Elev. Vol',
  CRISIS: 'Crisis',
};

const REGIME_DOT_COLORS: Record<string, string> = {
  LOW_VOL: 'bg-blue-400',
  NORMAL: 'bg-green-400',
  ELEVATED_VOL: 'bg-amber-400',
  CRISIS: 'bg-red-400',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCell({ label, value, cls = '' }: { label: string; value: string; cls?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-mono-data text-sm font-semibold mt-0.5 ${cls}`}>{value}</p>
    </div>
  );
}

function ReliabilityBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 70 ? 'bg-success' : pct >= 40 ? 'bg-warning' : 'bg-destructive';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`font-mono-data text-xs font-bold ${pct >= 70 ? 'text-success' : pct >= 40 ? 'text-warning' : 'text-destructive'}`}>
        {pct}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface StrategyDNAProps {
  jobId: string | null;
  /** When true, collapses non-essential sections by default */
  compact?: boolean;
}

export default function StrategyDNA({ jobId, compact = false }: StrategyDNAProps) {
  const [expanded, setExpanded] = useState(!compact);

  const {
    data: report,
    isLoading: reportLoading,
  } = useBacktestExport(jobId, !!jobId);

  const {
    data: trades = [],
  } = useBacktestTrades(jobId, !!jobId);

  if (!jobId) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center">
        <p className="text-xs text-muted-foreground">
          No backtest linked — run a backtest in the Workbench to see Strategy DNA.
        </p>
      </div>
    );
  }

  if (reportLoading) {
    return (
      <div className="space-y-2 rounded-md border p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center">
        <p className="text-xs text-muted-foreground">Strategy DNA unavailable.</p>
      </div>
    );
  }

  const passport = report.passport;
  const ta = report.trade_analytics;
  const llm = report.llm_context;
  const summary = report.executive_summary;
  const isApproved = passport?.deployment_approved === true;
  const isExplicitlyRejected = passport?.deployment_approved === false;

  // Per-regime rows — from backend by_regime dict
  const regimeRows = ta?.by_regime
    ? Object.entries(ta.by_regime)
        .filter(([, stats]) => typeof stats.n_trades === 'number' && (stats.n_trades as number) > 0)
        .sort(([a], [b]) => {
          const order = ['LOW_VOL', 'NORMAL', 'ELEVATED_VOL', 'CRISIS'];
          return order.indexOf(a) - order.indexOf(b);
        })
    : [];

  return (
    <div className="rounded-md border bg-muted/20">
      {/* Header row — always visible */}
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isApproved ? (
            <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
          ) : isExplicitlyRejected ? (
            <ShieldX className="h-4 w-4 shrink-0 text-destructive" />
          ) : (
            <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
          )}
          <span className="text-sm font-semibold">Strategy DNA</span>
          {passport && (
            <Badge
              variant="outline"
              className={`text-[10px] h-5 shrink-0 ${
                isApproved
                  ? 'border-success/30 text-success'
                  : isExplicitlyRejected
                    ? 'border-destructive/30 text-destructive'
                    : 'border-warning/30 text-warning'
              }`}
            >
              {isApproved ? 'Approved' : isExplicitlyRejected ? 'Not Approved' : 'Unreviewed'}
            </Badge>
          )}
          {passport && (
            <span className="text-[10px] font-mono-data text-muted-foreground truncate">
              {report.metadata.strategy_id} · {report.metadata.ticker}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-4">
          {/* ── Core passport metrics ── */}
          {passport && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Reliability
              </p>
              <ReliabilityBar score={passport.reliability_overall} />
              <div className="grid grid-cols-3 gap-3 pt-1">
                <StatCell label="PSR" value={passport.psr.toFixed(3)} cls={passport.psr >= 0.9 ? 'text-success' : passport.psr >= 0.5 ? '' : 'text-destructive'} />
                <StatCell
                  label="Sharpe CI"
                  value={`${passport.bootstrap_sharpe_ci_lower.toFixed(2)} – ${passport.bootstrap_sharpe_ci_upper.toFixed(2)}`}
                  cls={passport.bootstrap_sharpe_ci_lower > 0 ? 'text-success' : 'text-destructive'}
                />
                <StatCell
                  label="Total Return"
                  value={summary.total_return_pct != null ? `${summary.total_return_pct >= 0 ? '+' : ''}${summary.total_return_pct.toFixed(1)}%` : '—'}
                  cls={summary.total_return_pct != null && summary.total_return_pct >= 0 ? 'text-success' : 'text-destructive'}
                />
              </div>
            </div>
          )}

          {/* ── Per-regime breakdown ── */}
          {regimeRows.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Regime Breakdown
              </p>
              <div className="rounded-md border divide-y">
                {regimeRows.map(([regime, stats]) => {
                  const nTrades = stats.n_trades as number;
                  const winRate = stats.win_rate as number | undefined;
                  const sharpe = stats.sharpe_ratio as number | undefined ?? stats.sharpe as number | undefined;
                  const avgRet = stats.avg_return_pct as number | undefined;
                  return (
                    <div key={regime} className="grid grid-cols-4 gap-2 px-3 py-2">
                      <div className="flex items-center gap-1.5 col-span-1">
                        <div className={`h-2 w-2 rounded-full shrink-0 ${REGIME_DOT_COLORS[regime] ?? 'bg-muted-foreground'}`} />
                        <span className="text-[11px] font-medium">{REGIME_NAME_LABELS[regime] ?? regime}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">Trades</span>
                        <span className="font-mono-data text-xs">{nTrades}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">Win %</span>
                        <span className={`font-mono-data text-xs ${winRate != null && winRate >= 0.5 ? 'text-success' : 'text-destructive'}`}>
                          {winRate != null ? `${(winRate * 100).toFixed(0)}%` : '—'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">
                          {sharpe != null ? 'Sharpe' : 'Avg Ret'}
                        </span>
                        <span className={`font-mono-data text-xs ${(sharpe ?? avgRet ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                          {sharpe != null
                            ? sharpe.toFixed(2)
                            : avgRet != null
                              ? `${avgRet >= 0 ? '+' : ''}${avgRet.toFixed(2)}%`
                              : '—'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Regime timeline ── */}
          {trades.length >= 2 && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Return Timeline
              </p>
              <RegimeTimelineChart trades={trades} compact />
            </div>
          )}

          {/* ── LLM key concerns ── */}
          {llm && llm.key_concerns.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Key Concerns
              </p>
              <ul className="space-y-1">
                {llm.key_concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="text-destructive mt-0.5 shrink-0">·</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── LLM deployment recommendation ── */}
          {llm?.deployment_recommendation && (
            <p className="text-xs leading-relaxed text-muted-foreground border-l-2 border-muted pl-3">
              {llm.deployment_recommendation}
            </p>
          )}

          {/* ── Fragile parameters ── */}
          {passport && passport.fragile_parameters.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                Fragile Parameters
              </p>
              <div className="flex flex-wrap gap-1.5">
                {passport.fragile_parameters.map((p) => (
                  <Badge
                    key={p}
                    variant="outline"
                    className="text-[10px] border-destructive/30 text-destructive"
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reliability hard failures */}
          {passport && passport.reliability_hard_failures.length > 0 && (
            <div className="space-y-1 rounded-md bg-destructive/5 px-3 py-2">
              {passport.reliability_hard_failures.map((f) => (
                <p key={f} className="text-[10px] text-destructive">✕ {f}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
