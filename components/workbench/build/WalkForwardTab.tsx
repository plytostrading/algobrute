'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';
import { mockBacktestResult } from '@/mock/mockData';
import { formatPercent } from '@/utils/formatters';
import type { RegimeAssessment, RegimeType } from '@/types';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const assessmentConfig: Record<RegimeAssessment, { label: string; className: string }> = {
  strong:   { label: 'Strong',   className: 'text-success' },
  survived: { label: 'Survived', className: 'text-info' },
  weak:     { label: 'Weak',     className: 'text-warning' },
  failed:   { label: 'Failed',   className: 'text-destructive' },
};

const regimeLabels: Record<RegimeType, string> = {
  LOW_VOL: 'Low Vol',
  NORMAL: 'Normal',
  HIGH_VOL: 'High Vol',
  CRISIS: 'Crisis',
};

export default function WalkForwardTab() {
  const wf = mockBacktestResult.walkForward;
  const oosWindows = wf.windows.filter((w) => w.windowType === 'out_of_sample');
  const profitableCount = oosWindows.filter((w) => w.performance.totalReturn > 0).length;

  const { chartData, regimeBoundaries } = useMemo(() => {
    const dateMap = new Map<string, Record<string, number | undefined>>();

    for (const win of oosWindows) {
      const key = `oos${win.windowId}`;
      for (const pt of win.equityCurve) {
        const existing = dateMap.get(pt.date) || {};
        existing[key] = pt.equity;
        dateMap.set(pt.date, existing);
      }
    }

    for (const bp of wf.benchmarkCurve) {
      const existing = dateMap.get(bp.date) || {};
      existing.benchmark = bp.spy;
      dateMap.set(bp.date, existing);
    }

    const sorted = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));

    const boundaries = oosWindows.slice(0, -1).map((win) => ({
      date: win.endDate,
    }));

    return { chartData: sorted, regimeBoundaries: boundaries };
  }, [wf, oosWindows]);

  const narrative = `Validated across ${oosWindows.length} consecutive out-of-sample periods (${oosWindows[0].startDate.slice(0, 4)}–${oosWindows[oosWindows.length - 1].endDate.slice(0, 4)}). Profitable in ${profitableCount}/${oosWindows.length} windows. Each segment used parameters optimized on preceding in-sample data — this is the closest simulation to real-world forward performance.`;

  return (
    <div className="flex flex-col gap-3">
      {/* Narrative */}
      <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
        <Lightbulb className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed text-foreground">{narrative}</p>
      </div>

      {/* Regime span bar above chart */}
      <div className="flex px-12">
        {oosWindows.map((win) => (
          <div
            key={win.windowId}
            className="flex-1 border-b-[3px] pb-1 text-center"
            style={{ borderBottomColor: win.color }}
          >
            <span className="font-mono-data text-[10px] text-muted-foreground">
              {regimeLabels[win.regimeLabel]}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(d: string) => {
                const dt = new Date(d);
                return dt.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
              }}
              interval={Math.floor(chartData.length / 7)}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              domain={['auto', 'auto']}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-popover)',
                borderColor: 'var(--color-border)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              labelFormatter={(l: string) => new Date(l).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              formatter={(v: number, name: string) => {
                if (name === 'benchmark') return [`$${(v / 1000).toFixed(1)}k`, 'SPY Buy & Hold'];
                const winId = parseInt(name.replace('oos', ''), 10);
                const win = oosWindows.find((w) => w.windowId === winId);
                const label = win ? `OOS ${winId} (${regimeLabels[win.regimeLabel]})` : name;
                return [`$${(v / 1000).toFixed(1)}k`, label];
              }}
            />

            {/* Vertical regime boundary lines */}
            {regimeBoundaries.map((b, i) => (
              <ReferenceLine
                key={i}
                x={b.date}
                stroke="var(--color-muted-foreground)"
                strokeDasharray="4 4"
                strokeWidth={0.75}
                strokeOpacity={0.5}
              />
            ))}

            {/* Benchmark — dashed orange line */}
            <Line
              type="natural"
              dataKey="benchmark"
              stroke="#F97316"
              strokeDasharray="8 4"
              dot={false}
              strokeWidth={2}
              connectNulls
            />

            {/* One colored line per OOS window */}
            {oosWindows.map((win) => (
              <Line
                key={win.windowId}
                type="natural"
                dataKey={`oos${win.windowId}`}
                stroke={win.color}
                dot={false}
                strokeWidth={2.5}
                connectNulls={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart legend */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        {oosWindows.map((win) => (
          <div key={win.windowId} className="flex items-center gap-1.5">
            <div className="h-[3px] w-4 rounded-sm" style={{ backgroundColor: win.color }} />
            <span className="text-[10px] text-muted-foreground">
              OOS {win.windowId} ({regimeLabels[win.regimeLabel]})
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-4 border-t-2 border-dashed border-[#F97316]" />
          <span className="text-[10px] text-muted-foreground">SPY Buy & Hold</span>
        </div>
      </div>

      {/* Performance Table */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="font-mono-data px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Period</th>
              <th className="font-mono-data px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Regime</th>
              <th className="font-mono-data px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Return</th>
              <th className="font-mono-data px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sharpe</th>
              <th className="font-mono-data px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Max DD</th>
              <th className="font-mono-data px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Win Rate</th>
              <th className="font-mono-data px-3 py-2 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">P. Factor</th>
              <th className="font-mono-data px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Grade</th>
            </tr>
          </thead>
          <tbody>
            {oosWindows.map((win) => {
              const ac = assessmentConfig[win.assessment];
              return (
                <tr key={win.windowId} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                  <td className="font-mono-data px-3 py-2 text-xs text-muted-foreground">
                    {win.startDate.slice(0, 7)} → {win.endDate.slice(0, 7)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: win.color }} />
                      <span className="text-xs">{win.regimeLabel}</span>
                    </div>
                  </td>
                  <td className={`font-mono-data px-3 py-2 text-right text-xs font-semibold ${win.performance.totalReturn >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {win.performance.totalReturn > 0 ? '+' : ''}{formatPercent(win.performance.totalReturn)}
                  </td>
                  <td className="font-mono-data px-3 py-2 text-right text-xs font-semibold">
                    {win.performance.sharpe.toFixed(2)}
                  </td>
                  <td className="font-mono-data px-3 py-2 text-right text-xs text-destructive">
                    {formatPercent(win.risk.maxDrawdown)}
                  </td>
                  <td className="font-mono-data px-3 py-2 text-right text-xs">
                    {win.tradeStats.winRate}%
                  </td>
                  <td className="font-mono-data px-3 py-2 text-right text-xs">
                    {win.tradeStats.profitFactor.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant="outline" className={`font-mono-data text-[10px] font-semibold ${ac.className} border-current/20`}>
                      {ac.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Aggregate stats footer */}
      <p className="px-1 text-[11px] italic text-muted-foreground">
        Mean OOS Sharpe <span className="font-mono-data font-semibold">{wf.meanOosSharpe.toFixed(2)}</span> ·{' '}
        <span className="font-mono-data font-semibold">{wf.oosConsistency}%</span> profitable ·{' '}
        <span className="font-mono-data font-semibold">{wf.oosDegradation}%</span> IS→OOS degradation
      </p>
    </div>
  );
}
