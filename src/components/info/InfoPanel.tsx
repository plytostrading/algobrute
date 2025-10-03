"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Newspaper, 
  TrendingUp,
  RefreshCw,
  ExternalLink,
  DollarSign,
  Users,
  Calendar,
  AlertCircle
} from "lucide-react";

const mockCompanyData = {
  symbol: "AAPL",
  name: "Apple Inc.",
  sector: "Technology",
  marketCap: "2.89T",
  pe: 29.4,
  eps: 5.96,
  dividend: 0.94,
  beta: 1.24,
  volume: "52.1M",
  avgVolume: "57.3M"
};

const mockNews = [
  {
    id: 1,
    headline: "Apple Reports Strong Q4 Earnings, Revenue Beats Expectations",
    sentiment: "positive",
    source: "Reuters",
    timestamp: "2 hours ago",
    summary: "Apple posted better-than-expected revenue of $119.58B for Q4, driven by strong iPhone sales..."
  },
  {
    id: 2,
    headline: "iPhone 15 Sales Exceed Analyst Projections in Key Markets",
    sentiment: "positive", 
    source: "Bloomberg",
    timestamp: "4 hours ago",
    summary: "Early iPhone 15 sales data shows strong adoption rates in US and China markets..."
  },
  {
    id: 3,
    headline: "Supply Chain Concerns May Impact Q1 Production",
    sentiment: "negative",
    source: "CNBC",
    timestamp: "6 hours ago",
    summary: "Potential supply chain disruptions in Asia could affect production targets for early 2024..."
  }
];

function NewsSentimentBadge({ sentiment }: { sentiment: string }) {
  const colors = {
    positive: "bg-trading-success/10 text-trading-success border-trading-success/20",
    negative: "bg-trading-danger/10 text-trading-danger border-trading-danger/20",
    neutral: "bg-muted text-muted-foreground border-border"
  };

  return (
    <Badge variant="outline" className={`text-xs ${colors[sentiment as keyof typeof colors]}`}>
      {sentiment}
    </Badge>
  );
}

export function InfoPanel() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-none">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Market Intel
          </CardTitle>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <Tabs defaultValue="fundamentals" className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3 mx-6 mb-4">
            <TabsTrigger value="fundamentals">Company</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="fundamentals" className="h-full px-6 mt-0">
              <div className="space-y-4 h-full overflow-auto pb-4">
                {/* Company Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{mockCompanyData.name}</h3>
                    <Badge variant="secondary">{mockCompanyData.symbol}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{mockCompanyData.sector}</p>
                </div>
                
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Market Cap</span>
                    </div>
                    <div className="font-bold numeric">${mockCompanyData.marketCap}</div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">P/E Ratio</span>
                    </div>
                    <div className="font-bold numeric">{mockCompanyData.pe}</div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">EPS</span>
                    </div>
                    <div className="font-bold numeric">${mockCompanyData.eps}</div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Dividend</span>
                    </div>
                    <div className="font-bold numeric">${mockCompanyData.dividend}</div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Beta</span>
                    </div>
                    <div className="font-bold numeric">{mockCompanyData.beta}</div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Volume</span>
                    </div>
                    <div className="font-bold numeric">{mockCompanyData.volume}</div>
                  </div>
                </div>
                
                {/* Strategy Impact */}
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-sm">Strategy Impact</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Volatility</span>
                      <Badge variant="outline" className="text-yellow-400 border-yellow-400/20">
                        Moderate
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Trend Strength</span>
                      <Badge variant="outline" className="text-green-400 border-green-400/20">
                        Strong
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Liquidity</span>
                      <Badge variant="outline" className="text-green-400 border-green-400/20">
                        High
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="news" className="h-full px-6 mt-0">
              <div className="space-y-4 h-full overflow-auto pb-4">
                {mockNews.map((article) => (
                  <div key={article.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm leading-tight flex-1">
                        {article.headline}
                      </h4>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <NewsSentimentBadge sentiment={article.sentiment} />
                      <span className="text-xs text-muted-foreground">{article.source}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{article.timestamp}</span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {article.summary}
                    </p>
                  </div>
                ))}
                
                {/* Market Sentiment Summary */}
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-sm flex items-center gap-2">
                    <Newspaper className="h-4 w-4" />
                    Sentiment Analysis
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="text-trading-success font-bold">67%</div>
                      <div className="text-xs text-muted-foreground">Positive</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-bold">25%</div>
                      <div className="text-xs text-muted-foreground">Neutral</div>
                    </div>
                    <div>
                      <div className="text-trading-danger font-bold">8%</div>
                      <div className="text-xs text-muted-foreground">Negative</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analysis" className="h-full px-6 mt-0">
              <div className="space-y-4 h-full overflow-auto pb-4">
                {/* Technical Analysis */}
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-sm">Technical Indicators</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">RSI (14)</span>
                      <div className="flex items-center gap-2">
                        <span className="numeric text-sm">58.3</span>
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/20 text-xs">
                          Neutral
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">MACD</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-trading-success" />
                        <Badge variant="outline" className="text-green-400 border-green-400/20 text-xs">
                          Bullish
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Stochastic</span>
                      <div className="flex items-center gap-2">
                        <span className="numeric text-sm">73.2</span>
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/20 text-xs">
                          Overbought
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Strategy Recommendations */}
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-sm">AI Recommendations</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="text-xs font-medium">Consider RSI Filter</div>
                        <div className="text-xs text-muted-foreground">
                          Add RSI confirmation to reduce false signals
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="text-xs font-medium">Volume Confirmation</div>
                        <div className="text-xs text-muted-foreground">
                          High volume confirms trend direction
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="text-xs font-medium">Time Filter</div>
                        <div className="text-xs text-muted-foreground">
                          Avoid trading during first 30 minutes
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Risk Assessment */}
                <div className="bg-card border rounded-lg p-4">
                  <h4 className="font-medium mb-3 text-sm">Risk Assessment</h4>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-trading-success">68%</div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-trading-danger">-8.2%</div>
                      <div className="text-xs text-muted-foreground">Max Drawdown</div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}