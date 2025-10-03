"use client";

import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, BarChart3 } from "lucide-react";

export function StrategyHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              AlgoBrute
            </h1>
          </div>
          <Badge variant="secondary" className="text-xs">
            Strategy Workbench
          </Badge>
        </div>

        {/* Current Strategy Status */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Current Strategy: <span className="font-medium text-foreground">Moving Average Crossover</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">v1.0</span>
          </div>
        </div>
      </div>
      
      {/* Strategy Summary Banner */}
      <div className="bg-muted/50 px-4 py-2 border-t border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-foreground leading-relaxed">
              <span className="font-medium">Strategy Summary:</span> Buy when the 20-period SMA crosses above the 50-period SMA, 
              sell when it crosses below. This trend-following strategy aims to capture momentum in medium to long-term price movements.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}