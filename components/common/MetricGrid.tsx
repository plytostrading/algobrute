import { formatMetric } from '@/utils/formatters';
import type { BacktestMetric } from '@/types';

interface MetricGridProps {
  metrics: BacktestMetric[];
  columns?: number;
}

export default function MetricGrid({ metrics, columns = 5 }: MetricGridProps) {
  const gridCols = columns === 3 ? 'grid-cols-3' : columns === 4 ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className={`grid ${gridCols} gap-3`}>
      {metrics.map((m) => (
        <div key={m.label} className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {m.label}
          </span>
          <span className="numeric-data text-base font-bold">
            {formatMetric(m.value, m.format)}
          </span>
        </div>
      ))}
    </div>
  );
}
