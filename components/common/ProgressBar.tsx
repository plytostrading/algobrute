interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  color?: 'success' | 'warning' | 'destructive' | 'primary' | 'info';
  showValue?: boolean;
  unit?: string;
}

const colorMap = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  primary: 'bg-primary',
  info: 'bg-info',
};

export default function ProgressBar({ label, value, max = 100, color = 'primary', showValue = true, unit = '%' }: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {showValue && (
          <span className="numeric-data text-xs font-bold">{value}{unit}</span>
        )}
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorMap[color]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
