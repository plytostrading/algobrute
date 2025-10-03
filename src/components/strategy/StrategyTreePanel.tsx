"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  GitBranch, 
  Play, 
  Square, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  Settings,
  Maximize2,
  Circle,
  Diamond
} from "lucide-react";

interface StrategyNode {
  id: string;
  type: 'condition' | 'action' | 'indicator';
  label: string;
  children?: StrategyNode[];
  value?: string | number;
  operator?: 'greater' | 'less' | 'equals' | 'crosses_above' | 'crosses_below';
}

const mockStrategyTree: StrategyNode = {
  id: '1',
  type: 'condition',
  label: 'SMA Crossover Strategy',
  children: [
    {
      id: '2',
      type: 'condition',
      label: 'Buy Condition',
      children: [
        {
          id: '3',
          type: 'indicator',
          label: 'SMA(20)',
          value: 173.2
        },
        {
          id: '4',
          type: 'condition',
          label: 'crosses above',
          operator: 'crosses_above'
        },
        {
          id: '5',
          type: 'indicator',
          label: 'SMA(50)',
          value: 168.8
        },
        {
          id: '6',
          type: 'action',
          label: 'BUY',
        }
      ]
    },
    {
      id: '7',
      type: 'condition',
      label: 'Sell Condition',
      children: [
        {
          id: '8',
          type: 'indicator',
          label: 'SMA(20)',
          value: 173.2
        },
        {
          id: '9',
          type: 'condition',
          label: 'crosses below',
          operator: 'crosses_below'
        },
        {
          id: '10',
          type: 'indicator',
          label: 'SMA(50)',
          value: 168.8
        },
        {
          id: '11',
          type: 'action',
          label: 'SELL',
        }
      ]
    }
  ]
};

function StrategyNodeComponent({ node, level = 0 }: { node: StrategyNode; level?: number }) {
  const getNodeIcon = () => {
    switch (node.type) {
      case 'condition':
        return <Diamond className="h-3 w-3" />;
      case 'action':
        if (node.label === 'BUY') return <TrendingUp className="h-3 w-3 text-trading-success" />;
        if (node.label === 'SELL') return <TrendingDown className="h-3 w-3 text-trading-danger" />;
        return <Play className="h-3 w-3" />;
      case 'indicator':
        return <Circle className="h-3 w-3" />;
      default:
        return <Square className="h-3 w-3" />;
    }
  };

  const getNodeColor = () => {
    switch (node.type) {
      case 'condition':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'action':
        if (node.label === 'BUY') return 'bg-trading-success/10 text-trading-success border-trading-success/20';
        if (node.label === 'SELL') return 'bg-trading-danger/10 text-trading-danger border-trading-danger/20';
        return 'bg-primary/10 text-primary border-primary/20';
      case 'indicator':
        return 'bg-muted text-muted-foreground border-muted-foreground/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        {level > 0 && (
          <div className="flex items-center">
            <div className="w-4 h-px bg-border"></div>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
        
        <div className={`
          flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium
          ${getNodeColor()}
        `}>
          {getNodeIcon()}
          <span>{node.label}</span>
          {node.value && (
            <Badge variant="secondary" className="text-xs numeric">
              {node.value}
            </Badge>
          )}
        </div>
      </div>
      
      {node.children && (
        <div className="ml-6 mt-2 space-y-2">
          {node.children.map((child) => (
            <StrategyNodeComponent key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function StrategyTreePanel() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-none">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Strategy Logic Tree
            <Badge variant="outline" className="ml-2">
              Moving Average Crossover
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full px-6 py-4">
          <div className="space-y-4">
            <StrategyNodeComponent node={mockStrategyTree} />
            
            {/* Strategy Performance Summary */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Total Rules</div>
                  <div className="text-lg font-bold">2</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Conditions</div>
                  <div className="text-lg font-bold">4</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Indicators</div>
                  <div className="text-lg font-bold">2</div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Complexity</div>
                  <div className="text-lg font-bold text-green-400">Low</div>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Quick Modifications</div>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => alert('🛡 Adding Stop Loss\n\nThis would add:\n• 2% stop loss rule\n• Risk management node\n• Updated strategy complexity: Medium')}
                >
                  Add Stop Loss
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => alert('⚙️ Modify Periods\n\nThis would open a dialog to:\n• Change SMA(20) period\n• Change SMA(50) period\n• Test different combinations')}
                >
                  Modify Periods
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => alert('📈 Add Volume Filter\n\nThis would add:\n• Volume > 1M shares condition\n• Volume confirmation for signals\n• Improved signal quality')}
                >
                  Add Volume Filter
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => alert('⏰ Time Restrictions\n\nThis would add:\n• Market hours only (9:30-16:00 EST)\n• No trading in first/last 30min\n• Weekend restrictions')}
                >
                  Time Restrictions
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}