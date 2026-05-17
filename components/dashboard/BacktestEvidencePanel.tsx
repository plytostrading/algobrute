'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  Rocket,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useBacktestEvidence,
  useSeedDemoFleet,
  useSeedFleet,
  type BacktestEvidenceCard,
} from '@/hooks/useDashboard';

type SortKey =
  | 'created_at'
  | 'strategy_id'
  | 'ticker'
  | 'sharpe_mean'
  | 'n_trades'
  | 'pbo'
  | 'psr'
  | 'dsr'
  | 'approved';

interface SortState {
  key: SortKey;
  direction: 'asc' | 'desc';
}

export function BacktestEvidencePanel({ limit = 50 }: { limit?: number }) {
  const { data, isLoading, isError, error } = useBacktestEvidence(limit);
  const [sort, setSort] = useState<SortState>({ key: 'created_at', direction: 'desc' });
  const [showUnapproved, setShowUnapproved] = useState(true);

  const approvedCount = data?.summary.n_deployment_approved ?? 0;
  const completeCount = data?.summary.n_complete ?? 0;

  const visibleRows = useMemo(() => {
    if (!data) return [];
    const filtered = showUnapproved
      ? data.cards
      : data.cards.filter((c) => c.deployment_approved);
    return sortRows(filtered, sort);
  }, [data, sort, showUnapproved]);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <BookOpenCheck className="h-5 w-5" />
            Backtest evidence
          </CardTitle>
          <CardDescription>
            Research log — each row is one completed backtest with its
            deployment-readiness gates. Sort any column. Filter to just
            approved candidates to shortlist for live deployment.
          </CardDescription>
        </div>
        <div className="flex flex-col items-end gap-2">
          {approvedCount > 0 && <SeedFleetAction approvedCount={approvedCount} />}
          {completeCount > 0 && approvedCount < completeCount && (
            <SeedDemoFleetAction
              completeCount={completeCount}
              approvedCount={approvedCount}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : isError ? (
          <p className="text-sm text-destructive">
            {(error as Error)?.message ?? 'Failed to load backtest evidence.'}
          </p>
        ) : !data || data.summary.n_complete === 0 ? (
          <EmptyEvidence />
        ) : (
          <>
            <div className="flex flex-col gap-2 text-xs md:flex-row md:items-center md:justify-between">
              <div className="text-muted-foreground">
                <span className="font-medium text-foreground">{completeCount}</span> completed ·{' '}
                <span className="font-medium text-foreground">{approvedCount}</span> approved ·{' '}
                <span className="font-medium text-foreground">
                  {data.summary.distinct_strategies}
                </span>{' '}
                strategies ·{' '}
                <span className="font-medium text-foreground">
                  {data.summary.distinct_tickers}
                </span>{' '}
                tickers
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowUnapproved((v) => !v)}
              >
                {showUnapproved ? 'Filter: approved only' : 'Filter: show all'}
              </Button>
            </div>
            <EvidenceTable rows={visibleRows} sort={sort} onSort={setSort} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── Table ───────────────────────────────────────────────────────────

function EvidenceTable({
  rows,
  sort,
  onSort,
}: {
  rows: BacktestEvidenceCard[];
  sort: SortState;
  onSort: (s: SortState) => void;
}) {
  const toggleSort = (key: SortKey) => {
    if (sort.key === key) {
      onSort({ key, direction: sort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      onSort({ key, direction: 'desc' });
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <SortableTh label="Strategy / Ticker" sortKey="strategy_id" sort={sort} onClick={toggleSort} />
            <SortableTh label="Sharpe" sortKey="sharpe_mean" sort={sort} onClick={toggleSort} align="right" />
            <SortableTh label="Trades" sortKey="n_trades" sort={sort} onClick={toggleSort} align="right" />
            <SortableTh
              label="PBO"
              sortKey="pbo"
              sort={sort}
              onClick={toggleSort}
              align="right"
              hint="Probability of Backtest Overfitting — lower is better"
            />
            <SortableTh
              label="PSR"
              sortKey="psr"
              sort={sort}
              onClick={toggleSort}
              align="right"
              hint="Probabilistic Sharpe Ratio"
            />
            <SortableTh
              label="DSR"
              sortKey="dsr"
              sort={sort}
              onClick={toggleSort}
              align="right"
              hint="Deflated Sharpe Ratio"
            />
            <th className="px-3 py-2 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              Gates
            </th>
            <SortableTh label="Status" sortKey="approved" sort={sort} onClick={toggleSort} />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <EvidenceRow key={r.job_id} row={r} />
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No backtests match the current filter.
        </div>
      )}
    </div>
  );
}

function SortableTh({
  label,
  sortKey,
  sort,
  onClick,
  align = 'left',
  hint,
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onClick: (k: SortKey) => void;
  align?: 'left' | 'right';
  hint?: string;
}) {
  const active = sort.key === sortKey;
  const Icon = active ? (sort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  const button = (
    <button
      type="button"
      onClick={() => onClick(sortKey)}
      className={`inline-flex items-center gap-1 hover:text-foreground ${
        active ? 'text-foreground' : ''
      } ${align === 'right' ? 'justify-end' : ''}`}
    >
      <span>{label}</span>
      <Icon className="h-3 w-3" />
    </button>
  );
  return (
    <th className={`px-3 py-2 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {hint ? (
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>{hint}</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}
    </th>
  );
}

function EvidenceRow({ row: r }: { row: BacktestEvidenceCard }) {
  const sharpeText = formatSharpe(r);
  const approvedClass = r.deployment_approved
    ? 'border-l-4 border-l-green-500/70'
    : r.reliability_passed === false || r.regime_degraded
      ? 'border-l-4 border-l-destructive/60'
      : 'border-l-4 border-l-transparent';
  return (
    <tr className={`border-b last:border-b-0 ${approvedClass} hover:bg-muted/30`}>
      <td className="px-3 py-2">
        <div className="font-medium">{prettyStrategy(r.strategy_id)}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{r.ticker}</span>
          {r.data_start_date && r.data_end_date && (
            <>
              <span>·</span>
              <span>
                {fmt(r.data_start_date)}→{fmt(r.data_end_date)}
              </span>
            </>
          )}
        </div>
      </td>
      <td className="px-3 py-2 text-right font-mono text-xs">
        <span
          className={
            r.sharpe_mean > 1
              ? 'text-green-600'
              : r.sharpe_mean > 0
                ? 'text-foreground'
                : 'text-destructive'
          }
        >
          {sharpeText}
        </span>
      </td>
      <td
        className={`px-3 py-2 text-right font-mono text-xs ${
          r.n_trades < 10 ? 'text-destructive' : r.n_trades < 30 ? 'text-amber-600' : 'text-foreground'
        }`}
      >
        {r.n_trades}
      </td>
      <td className="px-3 py-2 text-right font-mono text-xs">{fmtPct(r.pbo, 0)}</td>
      <td className="px-3 py-2 text-right font-mono text-xs">{fmtPct(r.psr, 0)}</td>
      <td className="px-3 py-2 text-right font-mono text-xs">{fmtPct(r.dsr, 0)}</td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {r.reliability_passed === true && (
            <GateBadge tone="good" label="Reliability" />
          )}
          {r.reliability_passed === false && (
            <GateBadge tone="bad" label="Reliability" />
          )}
          {r.regime_degraded && <GateBadge tone="warn" label="Regime-degraded" />}
          {r.qualified_regime_coverage_health &&
            r.qualified_regime_coverage_health !== 'adequate' && (
              <GateBadge tone="warn" label={`Cov: ${r.qualified_regime_coverage_health}`} />
            )}
          {r.sizing_health && r.sizing_health !== 'adequate' && (
            <GateBadge tone="warn" label={`Size: ${r.sizing_health}`} />
          )}
          {r.breakeven_slippage_bps !== null && r.breakeven_slippage_bps > 0 && (
            <GateBadge tone="neutral" label={`BE ${r.breakeven_slippage_bps.toFixed(0)}bps`} />
          )}
        </div>
      </td>
      <td className="px-3 py-2">
        {r.deployment_approved ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="gap-1 bg-green-500/15 text-green-700 hover:bg-green-500/20 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3" />
                Approved
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Passed all deployment gates — eligible to deploy as a live bot.
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1 border-muted-foreground/40 text-muted-foreground">
                <XCircle className="h-3 w-3" />
                Research
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              {r.deployment_notes || 'One or more deployment gates failed. Inspect in Workbench.'}
            </TooltipContent>
          </Tooltip>
        )}
      </td>
    </tr>
  );
}

function GateBadge({
  tone,
  label,
}: {
  tone: 'good' | 'bad' | 'warn' | 'neutral';
  label: string;
}) {
  const cls =
    tone === 'good'
      ? 'border-green-500/50 text-green-600'
      : tone === 'bad'
        ? 'border-destructive/60 text-destructive'
        : tone === 'warn'
          ? 'border-amber-500/60 text-amber-600'
          : 'border-muted-foreground/40 text-muted-foreground';
  return (
    <Badge variant="outline" className={`text-[10px] ${cls}`}>
      {label}
    </Badge>
  );
}

// ── Seed actions ────────────────────────────────────────────────────

function SeedFleetAction({ approvedCount }: { approvedCount: number }) {
  const [confirming, setConfirming] = useState(false);
  const seed = useSeedFleet();

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 4000);
      return;
    }
    setConfirming(false);
    seed.mutate(
      { max_bots: 10, initial_capital_per_bot: 10_000, capital_allocation_pct: 0.05 },
      {
        onSuccess: (data) => {
          toast.success(
            `Seeded fleet: ${data.deployed} deployed, ${data.skipped} skipped, ${data.errored} errored.`,
          );
        },
        onError: (err) => toast.error(err.message || 'Seed fleet failed'),
      },
    );
  };

  return (
    <div className="flex items-center gap-2">
      {seed.data && (
        <span className="text-xs text-muted-foreground">
          last: {seed.data.deployed} deployed
        </span>
      )}
      <Button
        size="sm"
        variant={confirming ? 'destructive' : 'default'}
        className="gap-1"
        onClick={handleClick}
        disabled={seed.isPending}
      >
        <Rocket className="h-3.5 w-3.5" />
        {seed.isPending
          ? 'Deploying…'
          : confirming
            ? `Click to confirm · ${approvedCount} bots`
            : `Deploy approved (${approvedCount})`}
      </Button>
    </div>
  );
}

function SeedDemoFleetAction({
  completeCount,
  approvedCount,
}: {
  completeCount: number;
  approvedCount: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const seed = useSeedDemoFleet();
  const effective = Math.min(completeCount, 8);
  const noApproved = approvedCount === 0;

  const handleClick = () => {
    if (!confirming) {
      setConfirming(true);
      window.setTimeout(() => setConfirming(false), 4000);
      return;
    }
    setConfirming(false);
    seed.mutate(
      { max_bots: 8, initial_capital_per_bot: 10_000, capital_allocation_pct: 0.05 },
      {
        onSuccess: (data) => {
          toast.success(
            `Demo fleet: ${data.deployed} created, ${data.skipped} skipped, ${data.errored} errored.`,
          );
        },
        onError: (err) => toast.error(err.message || 'Demo seed failed'),
      },
    );
  };

  return (
    <div className="flex items-center gap-2">
      {seed.data && (
        <span className="text-xs text-muted-foreground">
          last: {seed.data.deployed} demo bots
        </span>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={confirming ? 'destructive' : 'outline'}
            className="gap-1"
            onClick={handleClick}
            disabled={seed.isPending}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            {seed.isPending
              ? 'Creating…'
              : confirming
                ? `Click to confirm · ${effective} demo bots`
                : noApproved
                  ? `Seed ${effective} demo bots (unapproved)`
                  : `Seed ${effective} demo bots (bypass gates)`}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          Creates research-grade paper bots from completed backtests without the
          deployment-admission gates. Bots appear in Portfolio and populate the
          dashboard, but have no passport linkage and won&apos;t auto-route live
          signals until you assign an approved passport. Intended for demo / UI
          inspection, not for capital deployment.
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

function EmptyEvidence() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center">
      <BookOpenCheck className="h-6 w-6 text-muted-foreground" />
      <div className="text-sm font-medium">No completed backtests yet</div>
      <div className="max-w-sm text-xs text-muted-foreground">
        Head to the Workbench to run a strategy discovery. Completed runs
        will show up here with their deployment-readiness gates.
      </div>
    </div>
  );
}

// ── Sorting + formatting ────────────────────────────────────────────

function sortRows(rows: BacktestEvidenceCard[], sort: SortState): BacktestEvidenceCard[] {
  const copy = [...rows];
  const dir = sort.direction === 'asc' ? 1 : -1;
  copy.sort((a, b) => {
    let av: unknown;
    let bv: unknown;
    switch (sort.key) {
      case 'created_at':
        av = a.created_at;
        bv = b.created_at;
        break;
      case 'strategy_id':
        av = `${a.strategy_id}-${a.ticker}`;
        bv = `${b.strategy_id}-${b.ticker}`;
        break;
      case 'ticker':
        av = a.ticker;
        bv = b.ticker;
        break;
      case 'sharpe_mean':
        av = a.sharpe_mean;
        bv = b.sharpe_mean;
        break;
      case 'n_trades':
        av = a.n_trades;
        bv = b.n_trades;
        break;
      case 'pbo':
        av = a.pbo ?? 1;
        bv = b.pbo ?? 1;
        break;
      case 'psr':
        av = a.psr ?? 0;
        bv = b.psr ?? 0;
        break;
      case 'dsr':
        av = a.dsr ?? 0;
        bv = b.dsr ?? 0;
        break;
      case 'approved':
        av = a.deployment_approved ? 1 : 0;
        bv = b.deployment_approved ? 1 : 0;
        break;
    }
    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * dir;
    }
    return String(av).localeCompare(String(bv)) * dir;
  });
  return copy;
}

function formatSharpe(row: BacktestEvidenceCard): string {
  const mean = row.sharpe_mean.toFixed(2);
  if (row.sharpe_ci_lower !== null && row.sharpe_ci_upper !== null) {
    return `${mean} [${row.sharpe_ci_lower.toFixed(2)}, ${row.sharpe_ci_upper.toFixed(2)}]`;
  }
  if (row.sharpe_std > 0) {
    return `${mean} ±${row.sharpe_std.toFixed(2)}`;
  }
  return mean;
}

function fmtPct(v: number | null, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  return `${(v * 100).toFixed(digits)}%`;
}

function fmt(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function prettyStrategy(id: string): string {
  return id
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}
