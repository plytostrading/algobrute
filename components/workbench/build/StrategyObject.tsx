'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Rocket, Circle, Edit, Check, X, RefreshCw } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import TerminalLabel from '@/components/common/TerminalLabel';
import type { ParseStatus } from './StrategyInput';

interface StrategyRule {
  indicator: string;
  period: number | string;
  operator: string;
  value: number | string;
}

interface StrategyObjectProps {
  parseStatus?: ParseStatus;
}

const mockStrategy = {
  asset: 'SPY',
  type: 'MEAN_REVERSION',
  name: 'SPY Mean Reversion',
  entryRules: [
    { indicator: 'RSI', period: 14, operator: '<', value: 30 },
    { indicator: 'Price', period: 200, operator: '>', value: '200_SMA' },
  ] as StrategyRule[],
  exitRules: [
    { indicator: 'RSI', period: 14, operator: '>', value: 70 },
  ] as StrategyRule[],
  riskEngine: {
    stopLoss: '2.1%',
    takeProfit: '5.3%',
    mode: 'TRAILING_ATR',
    isLiveUpdating: true,
  },
};

function EditableRule({
  rule,
  color,
  onSave,
}: {
  rule: StrategyRule;
  color: string;
  onSave?: (updated: StrategyRule) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(rule.value));

  const ruleText = `${rule.indicator}(${rule.period}) ${rule.operator} ${rule.value}`;

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Circle className="h-2 w-2 fill-current" style={{ color }} />
        <span className="numeric-data text-sm text-muted-foreground">
          {rule.indicator}({rule.period}) {rule.operator}
        </span>
        <input
          className="w-16 rounded border border-input bg-background px-2 py-0.5 text-sm numeric-data focus:outline-none focus:ring-1 focus:ring-ring"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSave?.({ ...rule, value: isNaN(Number(editValue)) ? editValue : Number(editValue) });
              setEditing(false);
            }
            if (e.key === 'Escape') setEditing(false);
          }}
          autoFocus
        />
        <button
          className="p-0.5 text-success hover:bg-success/10 rounded"
          onClick={() => {
            onSave?.({ ...rule, value: isNaN(Number(editValue)) ? editValue : Number(editValue) });
            setEditing(false);
          }}
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button className="p-0.5 text-muted-foreground hover:bg-muted rounded" onClick={() => setEditing(false)}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className="group -mx-1 flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-muted"
      onClick={() => setEditing(true)}
    >
      <Circle className="h-2 w-2 fill-current" style={{ color }} />
      <span className="numeric-data flex-1 text-sm">{ruleText}</span>
      <Edit className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

export default function StrategyObject({ parseStatus = 'empty' }: StrategyObjectProps) {
  const s = mockStrategy;
  const [modified, setModified] = useState(false);

  const isEmpty = parseStatus === 'empty';

  const statusLabel = modified
    ? 'MODIFIED'
    : parseStatus === 'parsed'
      ? 'GENERATED'
      : parseStatus === 'parsing'
        ? 'UPDATING...'
        : null;

  const statusVariant = modified ? 'secondary' : 'default';

  return (
    <Card
      className={`flex h-full flex-col transition-all ${parseStatus === 'parsed' ? 'border-primary' : ''}`}
    >
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between">
          <TerminalLabel icon="⊞">STRATEGY_OBJECT</TerminalLabel>
          <div className="flex items-center gap-1.5">
            {statusLabel && (
              <Badge variant={statusVariant} className="h-5 text-[10px] numeric-data">
                {statusLabel}
              </Badge>
            )}
            {modified && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Re-sync from input</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <div className={`flex flex-1 flex-col gap-3 transition-opacity ${isEmpty ? 'opacity-45' : ''}`}>
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{s.asset}</Badge>
            <Badge variant="outline">{s.type}</Badge>
            <span className="text-xs text-muted-foreground">{s.name}</span>
          </div>

          {/* Entry Rules */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              ENTRY RULES
            </p>
            <div className="space-y-0.5">
              {s.entryRules.map((rule, i) => (
                <EditableRule
                  key={i}
                  rule={rule}
                  color="#22C55E"
                  onSave={() => setModified(true)}
                />
              ))}
            </div>
          </div>

          {/* Exit Rules */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              EXIT RULES
            </p>
            <div className="space-y-0.5">
              {s.exitRules.map((rule, i) => (
                <EditableRule
                  key={i}
                  rule={rule}
                  color="#EF4444"
                  onSave={() => setModified(true)}
                />
              ))}
            </div>
          </div>

          <Separator />

          {/* Risk Engine */}
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              RISK ENGINE
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">STOP_LOSS</span>
                <span className="numeric-data font-bold">{s.riskEngine.stopLoss}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TAKE_PROFIT</span>
                <span className="numeric-data font-bold">{s.riskEngine.takeProfit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MODE</span>
                <span className="numeric-data text-[10px] font-bold">{s.riskEngine.mode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">LIVE_UPDATE</span>
                <Badge variant={s.riskEngine.isLiveUpdating ? 'default' : 'secondary'} className="h-4 text-[10px]">
                  {s.riskEngine.isLiveUpdating ? 'YES' : 'NO'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <Button className="mt-3 w-full bg-success hover:bg-success/90" disabled={isEmpty}>
          <Rocket className="mr-2 h-4 w-4" />
          DEPLOY TO PAPER
        </Button>
      </CardContent>
    </Card>
  );
}
