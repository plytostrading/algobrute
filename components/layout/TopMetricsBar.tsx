'use client';

import { useSelector, useDispatch } from 'react-redux';
import { Bell, Moon, Sun, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { RootState } from '@/store/store';
import { toggleColorMode } from '@/store/slices/uiSlice';
import { formatCurrency, formatPercent, getPLColor } from '@/utils/formatters';

function MetricDisplay({
  label,
  value,
  color,
  mono = false,
}: {
  label: string;
  value: string;
  color?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-sm font-bold ${mono ? 'numeric-data' : ''}`}
        style={color ? { color } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export default function TopMetricsBar() {
  const dispatch = useDispatch();
  const portfolio = useSelector((state: RootState) => state.portfolio.snapshot);
  const actionCues = useSelector((state: RootState) => state.portfolio.actionCues);
  const colorMode = useSelector((state: RootState) => state.ui.colorMode);
  const criticalCues = actionCues.filter((c) => c.severity === 'critical').length;

  return (
    <div className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-6">
        <MetricDisplay
          label="Equity"
          value={formatCurrency(portfolio.equity)}
          mono
        />
        <Separator orientation="vertical" className="h-6" />
        <MetricDisplay
          label="Day P&L"
          value={`${formatCurrency(portfolio.dayPL)} ${formatPercent(portfolio.dayPLPercent, true)}`}
          color={getPLColor(portfolio.dayPL)}
          mono
        />
        <Separator orientation="vertical" className="h-6" />
        <MetricDisplay
          label="Unrealized"
          value={formatCurrency(portfolio.unrealizedPL)}
          color={getPLColor(portfolio.unrealizedPL)}
          mono
        />
        <Separator orientation="vertical" className="h-6" />
        <MetricDisplay
          label="Active"
          value={`${portfolio.activeDeployments} bots`}
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {criticalCues > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px]"
                >
                  {criticalCues}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => dispatch(toggleColorMode())}
            >
              {colorMode === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch to {colorMode === 'light' ? 'dark' : 'light'} mode</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <User className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Profile</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
