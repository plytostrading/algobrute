'use client';

import { useSelector, useDispatch } from 'react-redux';
import { MoreHorizontal, Pause, Play, Eye, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RootState } from '@/store/store';
import { pauseDeployment, resumeDeployment } from '@/store/slices/deploymentsSlice';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import type { DeploymentStatus } from '@/types';

const statusConfig: Record<DeploymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  active: { label: 'Active', variant: 'default', color: 'text-success' },
  paused: { label: 'Paused', variant: 'secondary', color: 'text-warning' },
  stopped: { label: 'Stopped', variant: 'destructive', color: 'text-destructive' },
  idle: { label: 'Idle', variant: 'outline', color: 'text-muted-foreground' },
};

export default function FleetStatusGrid() {
  const dispatch = useDispatch();
  const deployments = useSelector((state: RootState) => state.deployments.list);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Status</CardTitle>
        <CardDescription>{deployments.length} bots deployed</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deployments.map((dep) => {
            const config = statusConfig[dep.status];
            const plPositive = dep.totalPL >= 0;
            const ddUsed = Math.round((dep.currentDrawdown / dep.maxTestedDrawdown) * 100);

            return (
              <div
                key={dep.id}
                className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                {/* Status dot + info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Circle className={`h-2 w-2 fill-current ${config.color}`} />
                    <span className="font-medium text-sm truncate">{dep.name}</span>
                    <Badge variant={config.variant} className="text-[10px] h-5">
                      {config.label}
                    </Badge>
                    {dep.isPaper && (
                      <Badge variant="outline" className="text-[10px] h-5">Paper</Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{dep.narrative}</p>

                  {/* Metrics row */}
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Capital</p>
                      <p className="font-mono-data text-sm font-medium">{formatCurrency(dep.capitalAllocated)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Day P&L</p>
                      <p className={`font-mono-data text-sm font-medium ${dep.dayPL >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {dep.dayPL >= 0 ? '+' : ''}{formatCurrency(dep.dayPL)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total P&L</p>
                      <p className={`font-mono-data text-sm font-medium ${plPositive ? 'text-success' : 'text-destructive'}`}>
                        {plPositive ? '+' : ''}{formatCurrency(dep.totalPL)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Drawdown</p>
                      <Progress
                        value={ddUsed}
                        className={`h-1.5 ${ddUsed > 60 ? '[&>[data-slot=progress-indicator]]:bg-destructive' : ddUsed > 40 ? '[&>[data-slot=progress-indicator]]:bg-warning' : '[&>[data-slot=progress-indicator]]:bg-success'}`}
                      />
                      <p className="text-[10px] text-muted-foreground mt-0.5">{dep.currentDrawdown}% / {dep.maxTestedDrawdown}%</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {dep.status === 'active' ? (
                      <DropdownMenuItem onClick={() => dispatch(pauseDeployment(dep.id))}>
                        <Pause className="mr-2 h-4 w-4" /> Pause
                      </DropdownMenuItem>
                    ) : dep.status === 'paused' ? (
                      <DropdownMenuItem onClick={() => dispatch(resumeDeployment(dep.id))}>
                        <Play className="mr-2 h-4 w-4" /> Resume
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" /> Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
