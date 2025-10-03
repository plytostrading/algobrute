"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartPanel } from "@/components/chart/ChartPanel";
import { InfoPanel } from "@/components/info/InfoPanel";
import { StrategyTreePanel } from "@/components/strategy/StrategyTreePanel";
import { BarChart3, TrendingUp, Info, GitBranch } from "lucide-react";

export function TabbedInterface() {
  return (
    <Card className="h-full flex flex-col m-0">
      <Tabs defaultValue="chart" className="h-full flex flex-col">
        <div className="flex-shrink-0 border-b">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="chart" className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Candlestick Chart
            </TabsTrigger>
            <TabsTrigger value="intel" className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4" />
              Market Intel
            </TabsTrigger>
            <TabsTrigger value="strategy" className="flex items-center gap-2 text-sm">
              <GitBranch className="h-4 w-4" />
              Strategy Tree
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="chart" className="flex-1 m-0 p-0 min-h-0">
          <ChartPanel />
        </TabsContent>
        
        <TabsContent value="intel" className="flex-1 m-0 p-2 min-h-0">
          <InfoPanel />
        </TabsContent>
        
        <TabsContent value="strategy" className="flex-1 m-0 p-2 min-h-0">
          <StrategyTreePanel />
        </TabsContent>
      </Tabs>
    </Card>
  );
}