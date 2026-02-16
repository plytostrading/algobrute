'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Lightbulb } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';
import type { BacktestVerdictData, VerdictAssessment } from '@/types';

const verdictConfig: Record<VerdictAssessment, {
  icon: typeof CheckCircle;
  label: string;
  borderColor: string;
  textColor: string;
  badgeClass: string;
}> = {
  promising: {
    icon: CheckCircle,
    label: 'Strategy Looks Promising',
    borderColor: 'border-l-success',
    textColor: 'text-success',
    badgeClass: 'bg-success/10 text-success border-success/30',
  },
  mixed: {
    icon: AlertTriangle,
    label: 'Strategy Has Risks',
    borderColor: 'border-l-warning',
    textColor: 'text-warning',
    badgeClass: 'bg-warning/10 text-warning border-warning/30',
  },
  not_recommended: {
    icon: XCircle,
    label: 'Strategy Not Recommended',
    borderColor: 'border-l-destructive',
    textColor: 'text-destructive',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/30',
  },
};

interface BacktestVerdictProps {
  verdict: BacktestVerdictData;
}

export default function BacktestVerdict({ verdict }: BacktestVerdictProps) {
  const config = verdictConfig[verdict.assessment];
  const Icon = config.icon;

  return (
    <Card className={`border-l-4 ${config.borderColor} py-0`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.textColor}`} />
          <Badge variant="outline" className={`font-mono-data text-[10px] font-bold ${config.badgeClass}`}>
            {config.label}
          </Badge>
        </div>

        {/* Narrative — clean inline style replacing InsightNarrative */}
        <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
          <Lightbulb className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed text-foreground">{verdict.narrative}</p>
        </div>

        {/* Key metrics */}
        <div className="mt-3 flex flex-wrap gap-6">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Expected Annual
            </span>
            <span className="font-mono-data text-sm font-bold text-success">
              {formatCurrency(verdict.expectedAnnualReturnDollarRange[0])} – {formatCurrency(verdict.expectedAnnualReturnDollarRange[1])}
            </span>
          </div>
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Max Loss
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono-data text-sm font-bold text-destructive">
                {formatCurrency(verdict.maxLossScenarioDollar)}
              </span>
              <span className={`text-[10px] font-semibold ${verdict.withinTolerance ? 'text-success' : 'text-destructive'}`}>
                {verdict.withinTolerance ? '✓ Within tolerance' : '✗ Over tolerance'}
              </span>
            </div>
          </div>
          {verdict.regimeWarning && (
            <div className="flex-1 min-w-[200px]">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Regime Risk
              </span>
              <span className="text-xs leading-relaxed text-warning">
                ⚠ {verdict.regimeWarning}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
