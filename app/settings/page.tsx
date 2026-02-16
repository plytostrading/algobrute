'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import TerminalLabel from '@/components/common/TerminalLabel';
import RiskComfortMeter from '@/components/common/RiskComfortMeter';
import { Settings as SettingsIcon, Bell, Shield, Database, Save } from 'lucide-react';
import { mockUserProfile } from '@/mock/mockData';

export default function SettingsPage() {
  const [maxDD, setMaxDD] = useState(mockUserProfile.maxDrawdownTolerance.toString());
  const [dailyLimit, setDailyLimit] = useState(mockUserProfile.dailyLossLimit.toString());
  const [riskLevel, setRiskLevel] = useState(mockUserProfile.riskComfortLevel);
  const [annualTarget, setAnnualTarget] = useState(mockUserProfile.targetAnnualReturn.toString());
  const [tradeAlerts, setTradeAlerts] = useState(true);
  const [riskAlerts, setRiskAlerts] = useState(true);
  const [regimeAlerts, setRegimeAlerts] = useState(true);

  return (
    <div className="flex flex-col gap-3">
      <TerminalLabel icon="⚙">SETTINGS</TerminalLabel>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Risk Profile */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              Risk Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Risk Comfort Level</label>
                <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value as typeof riskLevel)} className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Max Drawdown Tolerance (%)</label>
                <input type="number" value={maxDD} onChange={(e) => setMaxDD(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm numeric-data focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Daily Loss Limit ($)</label>
                <input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm numeric-data focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Target Annual Return (%)</label>
                <input type="number" value={annualTarget} onChange={(e) => setAnnualTarget(e.target.value)} className="rounded-md border bg-background px-3 py-2 text-sm numeric-data focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Financial Goal</label>
                <textarea defaultValue={mockUserProfile.financialGoal} className="rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none h-16" />
              </div>
              <Button size="sm" className="self-start mt-1">
                <Save className="mr-1.5 h-3.5 w-3.5" /> Save Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Bell className="h-4 w-4" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Trade Alerts', desc: 'Get notified on entries, exits, and fills', value: tradeAlerts, set: setTradeAlerts },
                  { label: 'Risk Alerts', desc: 'Circuit breaker warnings and drawdown alerts', value: riskAlerts, set: setRiskAlerts },
                  { label: 'Regime Change Alerts', desc: 'Notified when market regime shifts', value: regimeAlerts, set: setRegimeAlerts },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <button onClick={() => item.set(!item.value)} className={`h-6 w-11 rounded-full transition-colors ${item.value ? 'bg-primary' : 'bg-muted'}`}>
                      <div className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${item.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Broker Connection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Database className="h-4 w-4" />
                Broker Connection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="default">Connected</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider</span>
                  <span className="font-medium">Alpaca</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account</span>
                  <span className="numeric-data text-xs">****7890</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <Badge variant="outline" className="text-[10px]">PAPER</Badge>
                </div>
                <Separator className="my-1" />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs">Test Connection</Button>
                  <Button size="sm" variant="ghost" className="text-xs text-destructive">Disconnect</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Risk Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Current Risk Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <RiskComfortMeter label="Capital Deployed" current={82} limit={100} unit="%" />
                <RiskComfortMeter label="Drawdown" current={2.1} limit={Number(maxDD) || 15} unit="%" showPercentOfLimit />
                <RiskComfortMeter label="Daily Loss" current={125} limit={Number(dailyLimit) || 500} unit="$" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
