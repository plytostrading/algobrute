'use client';

import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const mockAlerts = [
  { id: 1, symbol: 'AAPL', signal: 'RSI Oversold', direction: 'long' as const, confidence: 87 },
  { id: 2, symbol: 'TSLA', signal: 'MACD Crossover', direction: 'long' as const, confidence: 72 },
  { id: 3, symbol: 'NVDA', signal: 'Support Bounce', direction: 'long' as const, confidence: 65 },
  { id: 4, symbol: 'META', signal: 'Resistance Rejection', direction: 'short' as const, confidence: 58 },
];

const mockIdeas = [
  { id: 1, title: 'SPY Mean Reversion on RSI Dip', description: 'RSI(14) dropped below 30 while price holds above 200 SMA. Historical win rate: 62%.', asset: 'SPY' },
  { id: 2, title: 'QQQ Momentum Breakout', description: 'Price breaking above 20-period high with volume surge. MACD positive divergence.', asset: 'QQQ' },
  { id: 3, title: 'TLT Range Trade Setup', description: 'TLT oscillating between $88-$94 support/resistance. Bollinger squeeze forming.', asset: 'TLT' },
];

export default function DiscoverTab() {
  const onSwitchToBuild = () => {};
  const [ticker, setTicker] = useState('');

  return (
    <div className="flex flex-col gap-3">
      {/* Ticker Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search ticker (SPY, QQQ, AAPL...)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="pl-10 font-mono-data"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Scanner Alerts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Scanner Alerts</CardTitle>
            <CardDescription>{mockAlerts.length} active signals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {mockAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between rounded-md border bg-background p-2.5 cursor-pointer hover:border-primary transition-colors" onClick={onSwitchToBuild}>
                  <div className="flex items-center gap-2.5">
                    {alert.direction === 'long' ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                    <span className="font-mono-data text-sm font-bold">{alert.symbol}</span>
                    <span className="text-xs text-muted-foreground">{alert.signal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.confidence > 70 ? 'default' : 'outline'} className="text-[10px]">{alert.confidence}%</Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Use in strategy</p></TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* LLM Trade Ideas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Trade Ideas</CardTitle>
            <CardDescription>AI-generated strategy suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {mockIdeas.map((idea) => (
                <div key={idea.id} className="rounded-md border bg-background p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="h-4 w-4 text-warning" />
                    <span className="text-sm font-semibold">{idea.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{idea.description}</p>
                  <Button size="sm" variant="outline" className="text-xs" onClick={onSwitchToBuild}>Build Strategy →</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
