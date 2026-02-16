'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import TerminalLabel from '@/components/common/TerminalLabel';

export type ParseStatus = 'empty' | 'typing' | 'parsing' | 'parsed' | 'error';

interface StrategyInputProps {
  onParse?: (text: string) => void;
  parseStatus?: ParseStatus;
}

const examplePrompts = [
  'Buy SPY when RSI(14) < 30 and price > 200 SMA. Sell when RSI > 70. Use 2% trailing stop.',
  'Go long QQQ on MACD crossover above signal line. Exit on 3 consecutive red bars. 1.5% stop loss.',
  'Mean reversion on TLT: buy when Bollinger Band %B < 0.2, sell when %B > 0.8. ATR-based stop.',
];

export default function StrategyInput({ onParse, parseStatus = 'empty' }: StrategyInputProps) {
  const [text, setText] = useState('');

  const handleGenerate = useCallback(() => {
    if (text.trim() && onParse) {
      onParse(text.trim());
    }
  }, [text, onParse]);

  const handleExample = useCallback((example: string) => {
    setText(example);
  }, []);

  const statusBadge = parseStatus === 'parsed' ? (
    <Badge variant="default" className="gap-1">
      <CheckCircle className="h-3 w-3" />
      <span className="numeric-data text-[10px]">PARSED</span>
    </Badge>
  ) : parseStatus === 'parsing' ? (
    <Badge variant="secondary" className="gap-1">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span className="numeric-data text-[10px]">PARSING...</span>
    </Badge>
  ) : null;

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex items-center justify-between">
          <TerminalLabel icon=">_">STRATEGY_INPUT</TerminalLabel>
          {statusBadge}
        </div>

        <textarea
          className="numeric-data flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your strategy in natural language..."
        />

        {/* Quick examples */}
        {!text && (
          <div className="my-3 space-y-1">
            <p className="text-[10px] text-muted-foreground">Try an example:</p>
            {examplePrompts.map((ex, i) => (
              <p
                key={i}
                className="numeric-data cursor-pointer border-l-2 border-border pl-2 text-[11px] leading-relaxed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                onClick={() => handleExample(ex)}
              >
                {ex.length > 80 ? ex.slice(0, 80) + '…' : ex}
              </p>
            ))}
          </div>
        )}

        <Button
          className="mt-3 w-full"
          onClick={handleGenerate}
          disabled={!text.trim() || parseStatus === 'parsing'}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          GENERATE STRATEGY
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
