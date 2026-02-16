'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const factorData = [
  { factor: 'Momentum', exposure: 0.45, contribution: 2.1 },
  { factor: 'Value', exposure: -0.12, contribution: -0.4 },
  { factor: 'Volatility', exposure: 0.28, contribution: 1.2 },
  { factor: 'Size', exposure: 0.08, contribution: 0.2 },
  { factor: 'Quality', exposure: 0.32, contribution: 1.5 },
];

export default function AttributionTab() {
  const skillScore = 72;
  const luckScore = 28;

  return (
    <div className="flex flex-col gap-6">
      {/* Factor Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Factor Analysis</CardTitle>
          <CardDescription>How different market factors contribute to your returns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Factor Exposure</p>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={factorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                    <XAxis dataKey="factor" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-popover)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '13px' }} />
                    <Bar dataKey="exposure" fill="var(--color-chart-1)" name="Exposure" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Return Contribution (%)</p>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={factorData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
                    <XAxis dataKey="factor" tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-popover)', borderColor: 'var(--color-border)', borderRadius: '8px', fontSize: '13px' }} />
                    <Bar dataKey="contribution" fill="var(--color-chart-2)" name="Contribution (%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill vs Luck */}
      <Card>
        <CardHeader>
          <CardTitle>Skill vs Luck Decomposition</CardTitle>
          <CardDescription>Based on t-statistic analysis of 186 trades over 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium">Skill Component</span>
                <span className="font-mono-data text-sm font-bold text-success">{skillScore}%</span>
              </div>
              <Progress value={skillScore} className="h-3 [&>[data-slot=progress-indicator]]:bg-success" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-medium">Luck Component</span>
                <span className="font-mono-data text-sm font-bold text-info">{luckScore}%</span>
              </div>
              <Progress value={luckScore} className="h-3 [&>[data-slot=progress-indicator]]:bg-info" />
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your information ratio of 1.82 suggests statistically significant alpha generation (p &lt; 0.01).
                This means your returns are primarily driven by skill rather than favorable market conditions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
