'use client';

import { TrendingUp, TrendingDown, Bot, ShieldAlert, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PortfolioSnapshot, FleetHealthStatus } from '@/types';
import { formatCurrency, formatPercent } from '@/utils/formatters';

interface KPICardsProps {
  portfolio: PortfolioSnapshot;
  fleetStatus: FleetHealthStatus;
  drawdownPercent: number;
  drawdownTolerance: number;
}

export default function KPICards({ portfolio, fleetStatus, drawdownPercent, drawdownTolerance }: KPICardsProps) {
  const plPositive = portfolio.dayPL >= 0;
  const drawdownUsed = Math.round((drawdownPercent / drawdownTolerance) * 100);

  const cards = [
    {
      title: 'Portfolio Equity',
      value: formatCurrency(portfolio.equity),
      subtitle: `${formatCurrency(portfolio.cash)} cash available`,
      icon: DollarSign,
      trend: null,
    },
    {
      title: 'Day P&L',
      value: `${plPositive ? '+' : ''}${formatCurrency(portfolio.dayPL)}`,
      subtitle: `${formatPercent(portfolio.dayPLPercent, true)} today`,
      icon: plPositive ? TrendingUp : TrendingDown,
      trend: plPositive ? 'up' as const : 'down' as const,
    },
    {
      title: 'Active Bots',
      value: String(portfolio.activeDeployments),
      subtitle: `${formatCurrency(portfolio.unrealizedPL)} unrealized`,
      icon: Bot,
      trend: null,
    },
    {
      title: 'Drawdown',
      value: `${drawdownPercent.toFixed(1)}%`,
      subtitle: `${drawdownUsed}% of ${drawdownTolerance}% limit used`,
      icon: ShieldAlert,
      trend: drawdownUsed > 50 ? 'down' as const : 'up' as const,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="gap-2 py-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.trend === 'up' ? 'text-success' : card.trend === 'down' ? 'text-destructive' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`font-mono-data text-2xl font-bold ${card.trend === 'up' ? 'text-success' : card.trend === 'down' ? 'text-destructive' : ''}`}>
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
