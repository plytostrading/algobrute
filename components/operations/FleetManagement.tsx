'use client';

import { useSelector, useDispatch } from 'react-redux';
import { Pause, Play, Circle, MoreHorizontal, Eye, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RootState } from '@/store/store';
import { selectDeployment, pauseDeployment, resumeDeployment } from '@/store/slices/deploymentsSlice';
import { formatCurrency } from '@/utils/formatters';
import { mockLogEntries, mockCircuitBreaker } from '@/mock/mockData';
import type { DeploymentStatus } from '@/types';

const statusConfig: Record<DeploymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  active: { label: 'Active', variant: 'default', color: 'text-success' },
  paused: { label: 'Paused', variant: 'secondary', color: 'text-warning' },
  stopped: { label: 'Stopped', variant: 'destructive', color: 'text-destructive' },
  idle: { label: 'Idle', variant: 'outline', color: 'text-muted-foreground' },
};

export default function FleetManagement() {
  const deployments = useSelector((state: RootState) => state.deployments.list);
  const positions = useSelector((state: RootState) => state.deployments.positions);
  const selectedId = useSelector((state: RootState) => state.deployments.selectedId);
  const dispatch = useDispatch();
  const selectedDep = deployments.find((d) => d.id === selectedId);
  const selectedPositions = positions.filter((p) => p.deploymentId === selectedId);
  const cb = mockCircuitBreaker;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Deployment List */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Deployments</CardTitle>
          <CardDescription>{deployments.length} bots configured</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deployments.map((dep) => {
              const config = statusConfig[dep.status];
              const isSelected = dep.id === selectedId;
              const plPositive = dep.totalPL >= 0;

              return (
                <div
                  key={dep.id}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors hover:bg-muted/50 ${isSelected ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => dispatch(selectDeployment(dep.id))}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Circle className={`h-2 w-2 fill-current ${config.color}`} />
                      <span className="text-sm font-semibold">{dep.name}</span>
                      <Badge variant={config.variant} className="text-[10px] h-5">{config.label}</Badge>
                      {dep.isPaper && <Badge variant="outline" className="text-[10px] h-5">Paper</Badge>}
                    </div>
                    <div className="flex gap-1">
                      {dep.status === 'active' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); dispatch(pauseDeployment(dep.id)); }}>
                          <Pause className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {dep.status === 'paused' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); dispatch(resumeDeployment(dep.id)); }}>
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
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
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deployment Detail */}
      <div className="flex flex-col gap-6">
        {!selectedDep ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">Select a deployment to view details</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Detail Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedDep.name}
                  <Badge variant={statusConfig[selectedDep.status].variant} className="text-[10px]">
                    {statusConfig[selectedDep.status].label}
                  </Badge>
                </CardTitle>
                <CardDescription>Running {selectedDep.daysSinceStart} days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Capital</p>
                    <p className="font-mono-data text-lg font-bold">{formatCurrency(selectedDep.capitalAllocated)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Day P&L</p>
                    <p className={`font-mono-data text-lg font-bold ${selectedDep.dayPL >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {selectedDep.dayPL >= 0 ? '+' : ''}{formatCurrency(selectedDep.dayPL)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total P&L</p>
                    <p className={`font-mono-data text-lg font-bold ${selectedDep.totalPL >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {selectedDep.totalPL >= 0 ? '+' : ''}{formatCurrency(selectedDep.totalPL)}
                    </p>
                  </div>
                </div>
                {selectedDep.narrative && (
                  <div className="rounded-lg border-l-4 border-info bg-info/5 p-3">
                    <p className="text-xs font-semibold text-info mb-0.5">Insight</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedDep.narrative}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Decision Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" />
                  Decision Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`mb-4 rounded-lg px-4 py-2.5 text-center text-xs font-semibold ${selectedDep.isWithinExpected ? 'bg-success/10 text-success border border-success/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                  {selectedDep.isWithinExpected ? '✓ Within normal bounds — no action needed' : '⚠ Outside expected range — review recommended'}
                </div>
                <div className="space-y-3 mb-4">
                  {[
                    { label: 'Current Drawdown', current: selectedDep.currentDrawdown, limit: selectedDep.maxTestedDrawdown, unit: '%' },
                    { label: 'Daily Loss', current: cb.dailyLossConsumed, limit: cb.dailyLossLimit, unit: '$' },
                    { label: 'Consecutive Losses', current: cb.consecutiveLosses, limit: cb.consecutiveLossLimit, unit: '' },
                  ].map((meter) => {
                    const pct = Math.min((meter.current / meter.limit) * 100, 100);
                    const indicatorClass = pct > 75 ? '[&>[data-slot=progress-indicator]]:bg-destructive' : pct > 50 ? '[&>[data-slot=progress-indicator]]:bg-warning' : '[&>[data-slot=progress-indicator]]:bg-success';
                    return (
                      <div key={meter.label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-medium">{meter.label}</span>
                          <span className="font-mono-data text-xs text-muted-foreground">
                            {meter.current}{meter.unit} / {meter.limit}{meter.unit}
                          </span>
                        </div>
                        <Progress value={pct} className={`h-1.5 ${indicatorClass}`} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline">Pause Bot</Button>
                  <Button size="sm" variant="outline">Reduce Size 50%</Button>
                  <Button size="sm" variant="outline">Tighten Stops</Button>
                  <Button size="sm" variant="ghost" className="text-destructive">Kill Bot</Button>
                </div>
              </CardContent>
            </Card>

            {/* Open Positions */}
            {selectedPositions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Open Positions</CardTitle>
                  <CardDescription>{selectedPositions.length} active</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedPositions.map((pos) => (
                      <div key={pos.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-data text-sm font-bold">{pos.symbol}</span>
                          <Badge variant={pos.side === 'long' ? 'default' : 'destructive'} className="text-[10px]">{pos.side.toUpperCase()}</Badge>
                          <Badge variant="outline" className="text-[10px]">{pos.state}</Badge>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div>
                            <p className="text-[10px] text-muted-foreground">Qty</p>
                            <p className="font-mono-data text-xs font-medium">{pos.quantity}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Entry</p>
                            <p className="font-mono-data text-xs font-medium">{formatCurrency(pos.entryPrice)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">Current</p>
                            <p className="font-mono-data text-xs font-medium">{formatCurrency(pos.currentPrice)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground">P&L</p>
                            <p className={`font-mono-data text-xs font-bold ${pos.unrealizedPL >= 0 ? 'text-success' : 'text-destructive'}`}>
                              {pos.unrealizedPL >= 0 ? '+' : ''}{formatCurrency(pos.unrealizedPL)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* System Log */}
            <Card>
              <CardHeader>
                <CardTitle>System Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto rounded-lg bg-muted/50 p-3 font-mono text-xs space-y-1">
                  {mockLogEntries.map((entry, i) => (
                    <div key={i} className="flex gap-2">
                      <span className={`font-semibold ${entry.tag === 'RISK' ? 'text-warning' : entry.tag === 'ALGO' ? 'text-primary' : entry.tag === 'DATA' ? 'text-info' : 'text-muted-foreground'}`}>
                        [{entry.tag}]
                      </span>
                      <span className="text-foreground">{entry.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
