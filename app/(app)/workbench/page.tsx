'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlaskConical, Rocket, Search } from 'lucide-react';
import BuildTab from '@/components/workbench/build/BuildTab';
import DeployTab from '@/components/workbench/deploy/DeployTab';
import DiscoverTab from '@/components/workbench/discover/DiscoverTab';
import BacktestJobQueue from '@/components/workbench/BacktestJobQueue';
import { useBacktestBackground } from '@/hooks/useBacktestBackground';

export default function WorkbenchPage() {
  const [activeTab, setActiveTab] = useState<'discover' | 'build' | 'deploy'>('build');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  // Restore the most recent background job from localStorage so navigating
  // away and back to the workbench resumes watching the in-flight job.
  const { latestActiveJob } = useBacktestBackground();
  const [activeJobId, setActiveJobId] = useState<string | null>(() => latestActiveJob);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Strategy Workbench</h2>
        <p className="text-sm text-muted-foreground">Discover, build, test, and deploy trading strategies</p>
      </div>

      <BacktestJobQueue />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
        <TabsList>
          <TabsTrigger value="discover" className="gap-2">
            <Search className="h-4 w-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="build" className="gap-2">
            <FlaskConical className="h-4 w-4" />
            Build & Test
          </TabsTrigger>
          <TabsTrigger value="deploy" className="gap-2">
            <Rocket className="h-4 w-4" />
            Deploy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-6">
          <DiscoverTab
            onSelectStrategy={(strategyId) => {
              setSelectedStrategyId(strategyId);
              setActiveTab('build');
            }}
          />
        </TabsContent>

        <TabsContent value="build" className="mt-6">
          <BuildTab
            selectedStrategyId={selectedStrategyId}
            onStrategyChange={(strategyId) => setSelectedStrategyId(strategyId)}
            onJobSubmitted={(jobId) => {
              setActiveJobId(jobId);
              // Stay on Build tab so polling continues (TabsContent unmounts inactive tabs)
            }}
            activeJobId={activeJobId}
            onReset={() => {
              setActiveJobId(null);
              setSelectedStrategyId(null);
            }}
          />
        </TabsContent>

        <TabsContent value="deploy" className="mt-6">
          <DeployTab selectedStrategyId={selectedStrategyId} activeJobId={activeJobId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
