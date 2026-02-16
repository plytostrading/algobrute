import { TrendingUp } from 'lucide-react';
import { ReactNode } from 'react';

interface InsightNarrativeProps {
  children: ReactNode;
  compact?: boolean;
}

export default function InsightNarrative({ children, compact }: InsightNarrativeProps) {
  return (
    <div className="rounded-md border-l-4 border-primary bg-primary/5 p-3">
      <div className="flex items-start gap-2">
        <TrendingUp className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-primary mt-0.5 flex-shrink-0`} />
        <div className="flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-primary">INSIGHT</p>
          <p className={`${compact ? 'text-xs' : 'text-sm'} leading-relaxed text-foreground mt-0.5`}>{children}</p>
        </div>
      </div>
    </div>
  );
}
