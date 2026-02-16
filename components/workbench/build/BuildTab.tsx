'use client';

import { useState, useCallback } from 'react';
import StrategyInput, { ParseStatus } from './StrategyInput';
import StrategyObject from './StrategyObject';
import BacktestVerdict from './BacktestVerdict';
import BacktestResultsTabs from './BacktestResultsTabs';
import { mockBacktestResult } from '@/mock/mockData';

export default function BuildTab() {
  const [parseStatus, setParseStatus] = useState<ParseStatus>('parsed');

  const handleParse = useCallback((_text: string) => {
    setParseStatus('parsing');
    setTimeout(() => setParseStatus('parsed'), 1200);
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {/* Row 1: Strategy Input → Strategy Object */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
        <div className="md:col-span-5">
          <StrategyInput onParse={handleParse} parseStatus={parseStatus} />
        </div>
        <div className="md:col-span-7">
          <StrategyObject parseStatus={parseStatus} />
        </div>
      </div>

      {/* Row 2: Backtest Verdict */}
      <BacktestVerdict verdict={mockBacktestResult.verdict} />

      {/* Row 3: Backtest Results — tabbed pane */}
      <BacktestResultsTabs />
    </div>
  );
}
