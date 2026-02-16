'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TerminalLabel from '@/components/common/TerminalLabel';
import BuildTab from '@/components/workbench/build/BuildTab';
import DiscoverTab from '@/components/workbench/discover/DiscoverTab';
import DeployTab from '@/components/workbench/deploy/DeployTab';

export default function WorkbenchPage() {
  const [activeTab, setActiveTab] = useState('build');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <TerminalLabel icon=">_">WORKBENCH</TerminalLabel>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="build">Build & Test</TabsTrigger>
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-3">
          <DiscoverTab onSwitchToBuild={() => setActiveTab('build')} />
        </TabsContent>

        <TabsContent value="build" className="mt-3">
          <BuildTab />
        </TabsContent>

        <TabsContent value="deploy" className="mt-3">
          <DeployTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
