'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Lightbulb } from 'lucide-react';
import { formatBacktestComputeTime, getBacktestDisplayLabel } from '@/lib/backtestDisplay';
import type { BacktestExportReport } from '@/types/api';

type VerdictAssessment = 'promising' | 'mixed' | 'not_recommended';

const verdictConfig: Record<
  VerdictAssessment,
  { icon: typeof CheckCircle; label: string; borderColor: string; textColor: string; badgeClass: string }
> = {
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

function deriveAssessment(report: BacktestExportReport): VerdictAssessment {
  const s = report.executive_summary;
  if (s.deployment_approved === true) return 'promising';
  if (s.deployment_approved === false) return 'not_recommended';
  if (s.reliability_score !== null && s.reliability_score !== undefined) {
    if (s.reliability_score >= 0.7) return 'promising';
    if (s.reliability_score >= 0.4) return 'mixed';
    return 'not_recommended';
  }
  if (s.sharpe_ratio !== null && s.sharpe_ratio !== undefined) {
    if (s.sharpe_ratio >= 1.0) return 'promising';
    if (s.sharpe_ratio >= 0.5) return 'mixed';
    return 'not_recommended';
  }
  return 'mixed';
}

interface BacktestVerdictProps {
  report: BacktestExportReport;
}

export default function BacktestVerdict({ report }: BacktestVerdictProps) {
  const assessment = deriveAssessment(report);
  const config = verdictConfig[assessment];
  const Icon = config.icon;
  const s = report.executive_summary;
  const computeWall = formatBacktestComputeTime(report.metadata.compute_wall_seconds);
  const computeCpu = formatBacktestComputeTime(report.metadata.compute_cpu_seconds);

  const narrative =
    report.llm_context?.deployment_recommendation ??
    `Sharpe ${s.sharpe_ratio?.toFixed(2) ?? '\u2014'} \u00b7 Return ${s.total_return_pct?.toFixed(1) ?? '\u2014'}% \u00b7 Max DD ${s.max_drawdown_pct?.toFixed(1) ?? '\u2014'}%${s.reliability_score != null ? ` \u00b7 Reliability ${(s.reliability_score * 100).toFixed(0)}%` : ''}`;

  const pboRisk = report.cpcv_analysis?.pbo_probability;

  return (
    <Card className={`border-l-4 ${config.borderColor} py-0`}>
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Icon className={`h-4 w-4 ${config.textColor}`} />
          <Badge variant="outline" className={`font-mono-data text-[10px] font-bold ${config.badgeClass}`}>
            {config.label}
          </Badge>
        </div>
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-mono-data">{getBacktestDisplayLabel(report.metadata)}</span>
          {computeWall ? <span>Wall time {computeWall}</span> : null}
          {computeCpu ? <span>CPU time {computeCpu}</span> : null}
        </div>

        <div className="flex items-start gap-2 rounded-md bg-muted/50 p-3">
          <Lightbulb className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed text-foreground">{narrative}</p>
        </div>

        <div className="mt-3 flex flex-wrap gap-6">
          {s.sharpe_ratio != null && (
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sharpe</span>
              <span className={`font-mono-data text-sm font-bold ${s.sharpe_ratio >= 1 ? 'text-success' : s.sharpe_ratio >= 0 ? '' : 'text-destructive'}`}>
                {s.sharpe_ratio.toFixed(2)}
              </span>
            </div>
          )}
          {s.total_return_pct != null && (
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Total Return</span>
              <span className={`font-mono-data text-sm font-bold ${s.total_return_pct >= 0 ? 'text-success' : 'text-destructive'}`}>
                {s.total_return_pct >= 0 ? '+' : ''}{s.total_return_pct.toFixed(1)}%
              </span>
            </div>
          )}
          {s.max_drawdown_pct != null && (
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Max Drawdown</span>
              <span className="font-mono-data text-sm font-bold text-destructive">
                {s.max_drawdown_pct.toFixed(1)}%
              </span>
            </div>
          )}
          {pboRisk != null && (
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Overfit Risk (PBO)</span>
              <span className={`font-mono-data text-sm font-bold ${pboRisk < 0.3 ? 'text-success' : pboRisk < 0.5 ? 'text-warning' : 'text-destructive'}`}>
                {(pboRisk * 100).toFixed(0)}%
              </span>
            </div>
          )}
          {report.llm_context?.key_concerns && report.llm_context.key_concerns.length > 0 && (
            <div className="flex-1 min-w-[200px]">
              <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Key Concern</span>
              <span className="text-xs leading-relaxed text-warning">
                \u26a0 {report.llm_context.key_concerns[0]}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
