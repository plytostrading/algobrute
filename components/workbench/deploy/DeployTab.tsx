'use client';

import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import TerminalLabel from '@/components/common/TerminalLabel';

export default function DeployTab() {
  const [brokerage, setBrokerage] = useState('alpaca');
  const [capital, setCapital] = useState('50000');
  const [maxPosition, setMaxPosition] = useState(30);
  const [stopLoss, setStopLoss] = useState('2.1');
  const [takeProfit, setTakeProfit] = useState('5.3');
  const [maxHolding, setMaxHolding] = useState('50');
  const [trailingStop, setTrailingStop] = useState(true);
  const [timeDecay, setTimeDecay] = useState(false);

  return (
    <Card className="max-w-[600px]">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Deployment Config */}
          <TerminalLabel icon="⊞">DEPLOYMENT_CONFIG</TerminalLabel>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Brokerage</label>
              <select value={brokerage} onChange={(e) => setBrokerage(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="alpaca">Alpaca (Paper)</option>
                <option value="ib">Interactive Brokers</option>
                <option value="td">TD Ameritrade</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Capital Allocation ($)</label>
              <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm numeric-data focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-muted-foreground">MAX POSITION SIZE</label>
                <span className="numeric-data text-xs font-bold">{maxPosition}%</span>
              </div>
              <input type="range" min={5} max={100} value={maxPosition} onChange={(e) => setMaxPosition(Number(e.target.value))} className="w-full accent-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>5%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Exit Rules */}
          <TerminalLabel icon="⊞">EXIT_RULES</TerminalLabel>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Stop Loss (%)</label>
              <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm numeric-data focus:outline-none focus:ring-2 focus:ring-primary" step="0.1" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Take Profit (%)</label>
              <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm numeric-data focus:outline-none focus:ring-2 focus:ring-primary" step="0.1" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Max Holding Period (bars)</label>
              <input type="number" value={maxHolding} onChange={(e) => setMaxHolding(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm numeric-data focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Trailing stop (ATR-based)</span>
              <button onClick={() => setTrailingStop(!trailingStop)} className={`h-6 w-11 rounded-full transition-colors ${trailingStop ? 'bg-primary' : 'bg-muted'}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${trailingStop ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">Time-decay exit</span>
              <button onClick={() => setTimeDecay(!timeDecay)} className={`h-6 w-11 rounded-full transition-colors ${timeDecay ? 'bg-primary' : 'bg-muted'}`}>
                <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${timeDecay ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <Separator />

          <Button size="lg" className="w-full bg-success text-white hover:bg-success/90">
            <Rocket className="mr-2 h-4 w-4" />
            LAUNCH DEPLOYMENT
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
