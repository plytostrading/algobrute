'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, RotateCcw } from 'lucide-react';
import { useStrategies, useStrategyDetail } from '@/hooks/useStrategies';
import StrategyDetailsContent from './StrategyDetailsContent';

export interface BacktestParams {
  ticker: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  profile: 'standard' | 'thorough';
  validationSimulationDays?: number;
}

interface StrategySelectorProps {
  selectedStrategyId: string | null;
  onStrategyChange: (id: string) => void;
  onSubmit: (params: BacktestParams) => void;
  isSubmitting: boolean;
  canReset: boolean;
  onReset: () => void;
}

export default function StrategySelector({
  selectedStrategyId,
  onStrategyChange,
  onSubmit,
  isSubmitting,
  canReset,
  onReset,
}: StrategySelectorProps) {
  const { data: strategies, isLoading } = useStrategies();
  const { data: strategy, isLoading: isStrategyLoading } = useStrategyDetail(selectedStrategyId);
  const [ticker, setTicker] = useState('SPY');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState('2024-12-31');
  const [capitalStr, setCapitalStr] = useState('100000');
  const [profile, setProfile] = useState<'standard' | 'thorough'>('standard');
  const [validationSimulationDays, setValidationSimulationDays] = useState<
    'none' | '30' | '60' | '90'
  >('none');

  const canSubmit =
    !!selectedStrategyId &&
    ticker.trim().length > 0 &&
    !!startDate &&
    !!endDate &&
    !isSubmitting;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Backtest Configuration</CardTitle>
        {canReset && (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-7 px-2 text-xs">
            <RotateCcw className="mr-1 h-3 w-3" />
            New
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="grid gap-1.5">
          <Label className="text-xs">Strategy</Label>
          {isLoading ? (
            <Skeleton className="h-9 w-full" />
          ) : (
            <Select
              value={selectedStrategyId ?? ''}
              onValueChange={onStrategyChange}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a strategy…" />
              </SelectTrigger>
              <SelectContent>
                {(strategies ?? [])
                  .filter((s) => s.is_active)
                  .map((s) => (
                    <SelectItem key={s.strategy_id} value={s.strategy_id}>
                      {s.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Ticker */}
        <div className="grid gap-1.5">
          <Label className="text-xs">Ticker</Label>
          <Input
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="e.g. SPY"
            className="font-mono-data"
            disabled={isSubmitting}
          />
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-2">
          <div className="grid gap-1.5">
            <Label className="text-xs">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="grid gap-1.5">
            <Label className="text-xs">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Capital */}
        <div className="grid gap-1.5">
          <Label className="text-xs">Initial Capital ($)</Label>
          <Input
            type="number"
            value={capitalStr}
            onChange={(e) => setCapitalStr(e.target.value)}
            placeholder="100000"
            className="font-mono-data"
            disabled={isSubmitting}
          />
        </div>

        {/* Profile */}
        <div className="grid gap-1.5">
          <Label className="text-xs">Analysis Depth</Label>
          <Select
            value={profile}
            onValueChange={(v) => setProfile(v as 'standard' | 'thorough')}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="thorough">Thorough</SelectItem>
            </SelectContent>
          </Select>
          {profile === 'thorough' && (
            <p className="text-[11px] text-muted-foreground">
              10× more simulations — typically 20–60 min
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label className="text-xs">Validation Holdout</Label>
          <Select
            value={validationSimulationDays}
            onValueChange={(value) =>
              setValidationSimulationDays(value as 'none' | '30' | '60' | '90')
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No holdout reservation</SelectItem>
              <SelectItem value="30">30 calendar days</SelectItem>
              <SelectItem value="60">60 calendar days</SelectItem>
              <SelectItem value="90">90 calendar days</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            Reserve the most recent window for out-of-sample validation.
          </p>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Strategy Snapshot
            </p>
          </div>
          {selectedStrategyId ? (
            <StrategyDetailsContent strategy={strategy} isLoading={isStrategyLoading} />
          ) : (
            <p className="text-xs text-muted-foreground">
              Select a strategy to inspect its description, parameters, and regime qualifications.
            </p>
          )}
        </div>

        <Button
          className="mt-auto w-full"
          onClick={() =>
            onSubmit({
              ticker,
              startDate,
              endDate,
              initialCapital: parseFloat(capitalStr) || 100_000,
              profile,
              validationSimulationDays:
                validationSimulationDays === 'none'
                  ? undefined
                  : Number.parseInt(validationSimulationDays, 10),
            })
          }
          disabled={!canSubmit}
        >
          <Play className="mr-2 h-4 w-4" />
          Run Backtest
        </Button>
      </CardContent>
    </Card>
  );
}
