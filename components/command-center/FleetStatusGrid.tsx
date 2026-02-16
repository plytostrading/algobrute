'use client';

import { useSelector, useDispatch } from 'react-redux';
import { Pause, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import TerminalLabel from '@/components/common/TerminalLabel';
import PLText from '@/components/common/PLText';
import type { RootState } from '@/store/store';
import { pauseDeployment, resumeDeployment } from '@/store/slices/deploymentsSlice';
import { formatCurrency } from '@/utils/formatters';
import type { DeploymentStatus } from '@/types';

const statusBadge: Record<DeploymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'LIVE', variant: 'default' },
  paused: { label: 'PAUSED', variant: 'destructive' },
  stopped: { label: 'STOPPED', variant: 'secondary' },
  idle: { label: 'IDLE', variant: 'outline' },
};

export default function FleetStatusGrid() {
  const deployments = useSelector((state: RootState) => state.deployments.list);
  const dispatch = useDispatch();

  return (
    <Card>
      <CardContent className="p-4">
        <TerminalLabel icon="⊞" className="mb-3">YOUR_BOTS</TerminalLabel>
        <div className="flex flex-col gap-2">
          {deployments.map((dep) => {
            const badge = statusBadge[dep.status];
            return (
              <div key={dep.id} className="rounded-md border bg-background p-3 hover:border-primary transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${dep.status === 'active' ? 'bg-success' : dep.status === 'paused' ? 'bg-warning' : 'bg-muted-foreground'}`} />
                    <span className="text-sm font-semibold">{dep.name}</span>
                    <Badge variant={badge.variant} className="text-[10px]">{badge.label}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <PLText value={dep.totalPL} showPercent percent={dep.totalPLPercent} size="sm" />
                    <span className="numeric-data text-xs text-muted-foreground">{formatCurrency(dep.capitalAllocated)}</span>
                    {dep.status === 'active' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dispatch(pauseDeployment(dep.id))}>
                            <Pause className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Pause</p></TooltipContent>
                      </Tooltip>
                    )}
                    {dep.status === 'paused' && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => dispatch(resumeDeployment(dep.id))}>
                            <Play className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent><p>Resume</p></TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{dep.narrative}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
