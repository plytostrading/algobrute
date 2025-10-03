"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Archive, 
  Settings, 
  Share,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Code
} from "lucide-react";

export function ActionBar() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side - Status indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-muted-foreground">Strategy Active</span>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-400" />
              <span>Validation: Passed</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-400" />
              <span>Last Updated: 2 min ago</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-400" />
              <span>Signals: 2 today</span>
            </div>
          </div>
        </div>
        
        {/* Center - Quick Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Expected Return</div>
            <div className="font-bold text-sm text-trading-success">+12.4%</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Win Rate</div>
            <div className="font-bold text-sm">68%</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Max Drawdown</div>
            <div className="font-bold text-sm text-trading-danger">-8.2%</div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Sharpe Ratio</div>
            <div className="font-bold text-sm">1.84</div>
          </div>
        </div>
        
        {/* Right side - Main actions */}
        <div className="flex items-center gap-3">
          {/* Secondary Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => alert('Strategy settings panel would open here')}
            >
              <Settings className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const shareUrl = window.location.href + '?strategy=moving_average_crossover';
                navigator.clipboard.writeText(shareUrl);
                alert('Strategy link copied to clipboard!');
              }}
            >
              <Share className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const confirmed = confirm('Are you sure you want to archive this strategy?');
                if (confirmed) {
                  alert('Strategy archived successfully! You can find it in your strategy library.');
                }
              }}
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-8" />
          
          {/* Primary Actions */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="lg" 
              className="relative bg-green-500/10 hover:bg-green-500/20 text-green-600 border-green-500/30 hover:border-green-500/50"
              onClick={() => {
                alert('🌲 Pine Script Interpreter\n\nPaste your TradingView Pine Script strategy here and I\'ll:\n• Extract the trading logic\n• Convert indicators and conditions\n• Generate starter strategy in the chat\n• Help you refine and optimize\n\nThis feature will be available soon!');
              }}
            >
              <Code className="h-4 w-4 mr-2" />
              Interpret Pine Script Strategy
            </Button>
            
            <Button 
              size="lg" 
              className="relative bg-primary hover:bg-primary/90"
              onClick={() => {
                alert('🚀 Running backtest...\n\nThis would execute a 30-day backtest using vectorBT:\n• Historical AAPL data\n• Moving average crossover signals\n• Performance metrics calculation\n\nResults would show in a new panel.');
              }}
            >
              <Play className="h-4 w-4 mr-2" />
              Run Backtest
              <Badge variant="secondary" className="ml-2 text-xs">
                30 days
              </Badge>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Risk Warning */}
      <div className="border-t border-border bg-muted/20 px-6 py-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3 text-yellow-400" />
          <span>
            <strong>Risk Notice:</strong> Past performance does not guarantee future results. 
            This strategy is for educational purposes and should be thoroughly tested before live trading.
          </span>
        </div>
      </div>
    </footer>
  );
}