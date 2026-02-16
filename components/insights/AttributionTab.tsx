'use client';

import { Card, CardContent } from '@/components/ui/card';
import TerminalLabel from '@/components/common/TerminalLabel';
import ProgressBar from '@/components/common/ProgressBar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const factorData = [
  { factor: 'Momentum', exposure: 0.45, contribution: 2.1 },
  { factor: 'Value', exposure: -0.12, contribution: -0.4 },
  { factor: 'Vol', exposure: 0.28, contribution: 1.2 },
  { factor: 'Size', exposure: 0.08, contribution: 0.2 },
  { factor: 'Quality', exposure: 0.32, contribution: 1.5 },
];

export default function AttributionTab() {
  const skillScore = 72;
  const luckScore = 28;

  return (
    <div className="flex flex-col gap-3">
      {/* Factor Analysis */}
      <Card>
        <CardContent className="p-4">
          <TerminalLabel icon="⊞" className="mb-3">FACTOR_ANALYSIS</TerminalLabel>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="factor" tick={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, borderRadius: 6 }} />
                  <Legend />
                  <Bar dataKey="exposure" fill="#2563eb" name="Exposure" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={factorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="factor" tick={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }} stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, borderRadius: 6 }} />
                  <Legend />
                  <Bar dataKey="contribution" fill="#10b981" name="Contribution (%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill vs Luck */}
      <Card>
        <CardContent className="p-4">
          <TerminalLabel icon="✦" className="mb-3">SKILL_VS_LUCK</TerminalLabel>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-sm">Skill Component</span>
                <span className="numeric-data text-sm font-bold text-success">{skillScore}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-success transition-all" style={{ width: `${skillScore}%` }} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-sm">Luck Component</span>
                <span className="numeric-data text-sm font-bold text-info">{luckScore}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-info transition-all" style={{ width: `${luckScore}%` }} />
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-[13px] text-muted-foreground">
                Based on t-statistic analysis of 186 trades over 12 months. Your information ratio of 1.82 suggests
                statistically significant alpha generation (p &lt; 0.01).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
