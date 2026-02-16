'use client';

import { useSelector, useDispatch } from 'react-redux';
import { Pause, Play, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import TerminalLabel from '@/components/common/TerminalLabel';
import PLText from '@/components/common/PLText';
import InsightNarrative from '@/components/common/InsightNarrative';
import RiskComfortMeter from '@/components/common/RiskComfortMeter';
import type { RootState } from '@/store/store';
import { selectDeployment, pauseDeployment, resumeDeployment } from '@/store/slices/deploymentsSlice';
import { formatCurrency, formatDate } from '@/utils/formatters';
import { mockLogEntries, mockCircuitBreaker, generateExpectedBehaviorData } from '@/mock/mockData';
import type { DeploymentStatus } from '@/types';

const statusBadge: Record<DeploymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'LIVE_TRADING', variant: 'default' },
  paused: { label: 'PAUSED', variant: 'destructive' },
  stopped: { label: 'STOPPED', variant: 'secondary' },
  idle: { label: 'IDLE', variant: 'outline' },
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
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {/* Deployment List */}
      <Card>
        <CardContent className="p-4">
          <TerminalLabel icon="⊞" className="mb-3">FLEET_DEPLOYMENTS</TerminalLabel>
          <div className="flex flex-col gap-2">
            {deployments.map((dep) => {
              const badge = statusBadge[dep.status];
              const isSelected = dep.id === selectedId;
              return (
                <div
                  key={dep.id}
                  className={`cursor-pointer rounded-md border p-3 transition-colors hover:border-primary ${isSelected ? 'border-primary bg-primary/5' : 'bg-background'}`}
                  onClick={() => dispatch(selectDeployment(dep.id))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{dep.name}</span>
                      <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                      {dep.isPaper && <span className="text-[10px] text-info">PAPER</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">CAPITAL</span>
                        <span className="numeric-data text-xs font-semibold">{formatCurrency(dep.capitalAllocated)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground block">TOTAL P&L</span>
                        <PLText value={dep.totalPL} showPercent percent={dep.totalPLPercent} size="sm" />
                      </div>
                      <div className="flex gap-0.5">
                        {dep.status === 'active' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); dispatch(pauseDeployment(dep.id)); }}>
                                <Pause className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Pause</p></TooltipContent>
                          </Tooltip>
                        )}
                        {dep.status === 'paused' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); dispatch(resumeDeployment(dep.id)); }}>
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Resume</p></TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deployment Detail */}
      <div className="flex flex-col gap-3">
        {!selectedDep ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-sm text-muted-foreground">Select a deployment to view details</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Header */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TerminalLabel icon=">_">{selectedDep.name.toUpperCase().replace(/ /g, '_')}</TerminalLabel>
                    <Badge variant={statusBadge[selectedDep.status].variant} className="text-[10px]">{statusBadge[selectedDep.status].label}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">Running {selectedDep.daysSinceStart} days</span>
                </div>
                <div className="flex gap-6 mb-3">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">CAPITAL</span>
                    <span className="numeric-data text-sm font-semibold">{formatCurrency(selectedDep.capitalAllocated)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">DAY P&L</span>
                    <PLText value={selectedDep.dayPL} />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">TOTAL P&L</span>
                    <PLText value={selectedDep.totalPL} showPercent percent={selectedDep.totalPLPercent} />
                  </div>
                </div>
                <InsightNarrative compact>{selectedDep.narrative}</InsightNarrative>
              </CardContent>
            </Card>

            {/* Decision Panel */}
            <Card>
              <CardContent className="p-4">
                <TerminalLabel icon="⊕" className="mb-3">DECISION_PANEL</TerminalLabel>
                <div className={`mb-3 rounded-md px-3 py-2 text-center text-xs font-bold uppercase ${selectedDep.isWithinExpected ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                  {selectedDep.isWithinExpected ? '✓ WITHIN NORMAL BOUNDS — no action needed' : '⚠ OUTSIDE EXPECTED RANGE — review recommended'}
                </div>
                <div className="flex flex-col gap-2 mb-3">
                  <RiskComfortMeter label="Current Drawdown" current={selectedDep.currentDrawdown} limit={selectedDep.maxTestedDrawdown} unit="%" />
                  <RiskComfortMeter label="Daily Loss" current={cb.dailyLossConsumed} limit={cb.dailyLossLimit} unit="$" />
                  <RiskComfortMeter label="Consec. Losses" current={cb.consecutiveLosses} limit={cb.consecutiveLossLimit} unit="" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs">Pause Bot</Button>
                  <Button size="sm" variant="outline" className="text-xs">Reduce Size 50%</Button>
                  <Button size="sm" variant="outline" className="text-xs">Tighten Stops</Button>
                  <Button size="sm" variant="ghost" className="text-xs text-destructive">Kill Bot</Button>
                </div>
              </CardContent>
            </Card>

            {/* Open Positions */}
            {selectedPositions.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <TerminalLabel icon="⊞" className="mb-3">OPEN_POSITIONS</TerminalLabel>
                  <div className="flex flex-col gap-2">
                    {selectedPositions.map((pos) => (
                      <div key={pos.id} className="flex items-center justify-between rounded-md border bg-background p-2.5">
                        <div className="flex items-center gap-2">
                          <span className="numeric-data text-sm font-bold">{pos.symbol}</span>
                          <Badge variant={pos.side === 'long' ? 'default' : 'destructive'} className="text-[10px]">{pos.side.toUpperCase()}</Badge>
                          <Badge variant="outline" className="text-[10px]">{pos.state}</Badge>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div><span className="text-[10px] text-muted-foreground block">QTY</span><span className="numeric-data text-xs font-semibold">{pos.quantity}</span></div>
                          <div><span className="text-[10px] text-muted-foreground block">ENTRY</span><span className="numeric-data text-xs font-semibold">{formatCurrency(pos.entryPrice)}</span></div>
                          <div><span className="text-[10px] text-muted-foreground block">CURRENT</span><span className="numeric-data text-xs font-semibold">{formatCurrency(pos.currentPrice)}</span></div>
                          <div><span className="text-[10px] text-muted-foreground block">P&L</span><PLText value={pos.unrealizedPL} showPercent percent={pos.unrealizedPLPercent} size="sm" /></div>
                          <div><span className="text-[10px] text-muted-foreground block">BARS</span><span className="numeric-data text-xs font-semibold">{pos.barsHeld}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Log Stream */}
            <Card>
              <CardContent className="p-4">
                <TerminalLabel icon="⊕" className="mb-3">SYSTEM_LOGIC_STREAM</TerminalLabel>
                <div className="max-h-40 overflow-y-auto rounded-md bg-background p-2 font-mono text-xs">
                  {mockLogEntries.map((entry, i) => (
                    <div key={i} className="flex gap-2 py-0.5">
                      <span className={`font-bold ${entry.tag === 'RISK' ? 'text-warning' : entry.tag === 'ALGO' ? 'text-primary' : entry.tag === 'DATA' ? 'text-info' : 'text-muted-foreground'}`}>[{entry.tag}]</span>
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
