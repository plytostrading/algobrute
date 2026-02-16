'use client';

import { useState } from 'react';
import { Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DeployTab() {
  const [brokerage, setBrokerage] = useState('alpaca');
  const [capital, setCapital] = useState('50000');
  const [maxPosition, setMaxPosition] = useState([30]);
  const [stopLoss, setStopLoss] = useState('2.1');
  const [takeProfit, setTakeProfit] = useState('5.3');
  const [maxHolding, setMaxHolding] = useState('50');
  const [trailingStop, setTrailingStop] = useState(true);
  const [timeDecay, setTimeDecay] = useState(false);

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Deployment Configuration</CardTitle>
          <CardDescription>Configure brokerage, capital, and risk parameters before launch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Brokerage & Capital */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brokerage">Brokerage</Label>
              <Select value={brokerage} onValueChange={setBrokerage}>
                <SelectTrigger id="brokerage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpaca">Alpaca (Paper)</SelectItem>
                  <SelectItem value="ib">Interactive Brokers</SelectItem>
                  <SelectItem value="td">TD Ameritrade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capital">Capital Allocation ($)</Label>
              <Input
                id="capital"
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="font-mono-data"
              />
            </div>
          </div>

          {/* Position Size */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Max Position Size</Label>
              <Badge variant="secondary" className="font-mono-data">{maxPosition[0]}%</Badge>
            </div>
            <Slider
              value={maxPosition}
              onValueChange={setMaxPosition}
              min={5}
              max={100}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5%</span><span>50%</span><span>100%</span>
            </div>
          </div>

          <Separator />

          {/* Exit Rules */}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">Exit Rules</h4>
            <p className="text-xs text-muted-foreground">Define stop-loss, take-profit, and holding parameters</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sl">Stop Loss (%)</Label>
              <Input
                id="sl"
                type="number"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                step="0.1"
                className="font-mono-data"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tp">Take Profit (%)</Label>
              <Input
                id="tp"
                type="number"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                step="0.1"
                className="font-mono-data"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mhp">Max Holding (bars)</Label>
              <Input
                id="mhp"
                type="number"
                value={maxHolding}
                onChange={(e) => setMaxHolding(e.target.value)}
                className="font-mono-data"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="trailing-stop">Trailing Stop (ATR-based)</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Dynamically adjust stop based on volatility</p>
              </div>
              <Switch
                id="trailing-stop"
                checked={trailingStop}
                onCheckedChange={setTrailingStop}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="time-decay">Time-Decay Exit</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Close position when holding period erodes edge</p>
              </div>
              <Switch
                id="time-decay"
                checked={timeDecay}
                onCheckedChange={setTimeDecay}
              />
            </div>
          </div>

          <Separator />

          <Button size="lg" className="w-full bg-success text-white hover:bg-success/90">
            <Rocket className="mr-2 h-4 w-4" />
            Launch Deployment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
