'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Gauge,
  ShieldCheck,
  ShieldAlert,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { useCalibration, type BotCalibrationRow } from '@/hooks/useDashboard';

export function CalibrationPanel() {
  const { data, isLoading, isError, error } = useCalibration(10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Calibration &amp; trust
        </CardTitle>
        <CardDescription>
          How well the backtest passport&apos;s predictions match what your
          bots actually delivered. Empty until bots have closed ≥10 live
          trades; before that, we show passport expectations only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : isError ? (
          <p className="text-sm text-destructive">
            {(error as Error)?.message ?? 'Failed to load calibration.'}
          </p>
        ) : !data || data.n_bots === 0 ? (
          <Empty />
        ) : (
          <Body data={data} />
        )}
      </CardContent>
    </Card>
  );
}

function Body({
  data,
}: {
  data: NonNullable<ReturnType<typeof useCalibration>['data']>;
}) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Bots" value={`${data.n_bots}`} sub="tracked" />
        <Stat
          label="With passport"
          value={`${data.n_with_passport}`}
          sub={
            data.n_with_passport === data.n_bots
              ? 'all bots linked'
              : `${data.n_bots - data.n_with_passport} demo bots (no passport)`
          }
        />
        <Stat
          label="With evidence"
          value={`${data.n_with_evidence}`}
          sub="≥10 closed trades"
          tone={data.n_with_evidence > 0 ? 'good' : 'neutral'}
        />
        <Stat
          label="Drifted"
          value={`${data.n_drifted}`}
          sub="realised − predicted Sharpe < −0.5"
          tone={data.n_drifted > 0 ? 'bad' : 'neutral'}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-2 py-2 text-left font-medium">Bot</th>
              <th className="px-2 py-2 text-left font-medium">Trust</th>
              <th className="px-2 py-2 text-right font-medium">Trades</th>
              <th className="px-2 py-2 text-right font-medium">Pred. Sharpe</th>
              <th className="px-2 py-2 text-right font-medium">Realized</th>
              <th className="px-2 py-2 text-right font-medium">Δ Sharpe</th>
              <th className="px-2 py-2 text-right font-medium">Pred. win %</th>
              <th className="px-2 py-2 text-right font-medium">Realized win %</th>
              <th className="px-2 py-2 text-right font-medium">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1">
                      Slip. (bps) <HelpCircle className="h-3 w-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    Mean realised slippage (|entry_price − entry_target| /
                    entry_target × 10000). Compared to passport&apos;s
                    breakeven_slippage_bps — beyond that, edge is lost to
                    friction.
                  </TooltipContent>
                </Tooltip>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <Row key={r.bot_id} row={r} />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Row({ row: r }: { row: BotCalibrationRow }) {
  const drift = r.sharpe_delta !== null && r.sharpe_delta < -0.5;
  return (
    <tr className="border-b last:border-0">
      <td className="px-2 py-2">
        <div className="font-mono text-xs">{r.ticker}</div>
        <div className="text-[10px] text-muted-foreground">{r.strategy_id}</div>
      </td>
      <td className="px-2 py-2">
        <TrustBadge band={r.trust_band} />
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs">
        {r.n_live_trades_closed}
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs">
        {fmt(r.predicted_sharpe, 2)}
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs">
        {fmt(r.realized_sharpe, 2)}
      </td>
      <td
        className={`px-2 py-2 text-right font-mono text-xs ${
          r.sharpe_delta === null
            ? 'text-muted-foreground'
            : drift
              ? 'text-destructive'
              : r.sharpe_delta >= 0
                ? 'text-green-600'
                : 'text-foreground'
        }`}
      >
        {r.sharpe_delta === null
          ? '—'
          : `${r.sharpe_delta >= 0 ? '+' : ''}${r.sharpe_delta.toFixed(2)}`}
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs">
        {fmtPct(r.predicted_win_rate)}
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs">
        {fmtPct(r.realized_win_rate)}
      </td>
      <td className="px-2 py-2 text-right font-mono text-xs">
        {r.realized_slippage_bps_mean !== null
          ? r.realized_slippage_bps_mean.toFixed(1)
          : '—'}
        {r.breakeven_slippage_bps !== null && (
          <span className="ml-1 text-[10px] text-muted-foreground">
            / be {r.breakeven_slippage_bps.toFixed(0)}
          </span>
        )}
      </td>
    </tr>
  );
}

function TrustBadge({ band }: { band: BotCalibrationRow['trust_band'] }) {
  if (band === 'calibrated') {
    return (
      <Badge variant="outline" className="gap-1 border-green-500/60 text-[10px] text-green-600">
        <ShieldCheck className="h-3 w-3" />
        Calibrated
      </Badge>
    );
  }
  if (band === 'drift') {
    return (
      <Badge variant="outline" className="gap-1 border-destructive/60 text-[10px] text-destructive">
        <ShieldAlert className="h-3 w-3" />
        Drifted
      </Badge>
    );
  }
  if (band === 'accumulating') {
    return (
      <Badge variant="outline" className="gap-1 border-amber-500/60 text-[10px] text-amber-600">
        <Clock className="h-3 w-3" />
        Accumulating
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
      <Clock className="h-3 w-3" />
      No evidence
    </Badge>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'good' | 'bad' | 'neutral';
}) {
  const toneClass =
    tone === 'good'
      ? 'text-green-600'
      : tone === 'bad'
        ? 'text-destructive'
        : 'text-foreground';
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${toneClass}`}>{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-10 text-center">
      <Gauge className="h-6 w-6 text-muted-foreground" />
      <div className="text-sm font-medium">No bots tracked yet</div>
      <div className="max-w-sm text-xs text-muted-foreground">
        Once you deploy bots — demo or passport-backed — this panel will
        disclose how their live performance tracks against the predictions
        in their backtest passports.
      </div>
    </div>
  );
}

function fmt(v: number | null, digits = 2): string {
  return v === null || Number.isNaN(v) ? '—' : v.toFixed(digits);
}

function fmtPct(v: number | null): string {
  return v === null ? '—' : `${(v * 100).toFixed(0)}%`;
}
