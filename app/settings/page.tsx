import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockUserProfile, mockCircuitBreaker } from '@/mock/mockData';
import { formatCurrency, formatPercent } from '@/utils/formatters';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure your risk profile and platform preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Profile</CardTitle>
            <CardDescription>Your trading risk parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Risk Comfort Level</span>
                <Badge variant="secondary" className="capitalize">{mockUserProfile.riskComfortLevel}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Capital Base</span>
                <span className="font-mono-data text-sm font-medium">{formatCurrency(mockUserProfile.capitalBase)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Max Drawdown Tolerance</span>
                <span className="font-mono-data text-sm font-medium">{mockUserProfile.maxDrawdownTolerance}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Daily Loss Limit</span>
                <span className="font-mono-data text-sm font-medium">{formatCurrency(mockUserProfile.dailyLossLimit)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Target Annual Return</span>
                <span className="font-mono-data text-sm font-medium">{mockUserProfile.targetAnnualReturn}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Circuit Breaker</CardTitle>
            <CardDescription>Automatic safety limits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant={mockCircuitBreaker.isTripped ? 'destructive' : 'default'}>
                  {mockCircuitBreaker.isTripped ? 'TRIPPED' : 'ARMED'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Daily Loss</span>
                <span className="font-mono-data text-sm">
                  {formatCurrency(mockCircuitBreaker.dailyLossConsumed)} / {formatCurrency(mockCircuitBreaker.dailyLossLimit)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Consecutive Losses</span>
                <span className="font-mono-data text-sm">
                  {mockCircuitBreaker.consecutiveLosses} / {mockCircuitBreaker.consecutiveLossLimit}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Max Drawdown</span>
                <span className="font-mono-data text-sm">
                  {formatPercent(mockCircuitBreaker.maxDrawdownConsumed)} / {formatPercent(mockCircuitBreaker.maxDrawdownLimit)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
