interface RiskComfortMeterProps {
  label: string;
  current: number;
  limit: number;
  unit: string;
  showPercentOfLimit?: boolean;
}

export default function RiskComfortMeter({ label, current, limit, unit, showPercentOfLimit }: RiskComfortMeterProps) {
  const pct = Math.min((current / limit) * 100, 100);
  const color = pct > 75 ? 'bg-destructive' : pct > 50 ? 'bg-warning' : 'bg-success';
  const textColor = pct > 75 ? 'text-destructive' : pct > 50 ? 'text-warning' : 'text-success';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`numeric-data text-xs font-bold ${textColor}`}>
          {current}{unit} / {limit}{unit}
          {showPercentOfLimit && (
            <span className="ml-1 text-[10px] text-muted-foreground">({pct.toFixed(0)}% used)</span>
          )}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
