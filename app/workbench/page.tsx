'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlaskConical, Rocket, Search } from 'lucide-react';
import BuildTab from '@/components/workbench/build/BuildTab';
import DeployTab from '@/components/workbench/deploy/DeployTab';
import DiscoverTab from '@/components/workbench/discover/DiscoverTab';

export default function WorkbenchPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Strategy Workbench</h2>
        <p className="text-sm text-muted-foreground">Discover, build, test, and deploy trading strategies</p>
      </div>

      <Tabs defaultValue="build" className="w-full">
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
          <DiscoverTab />
        </TabsContent>
        <TabsContent value="build" className="mt-6">
          <BuildTab />
        </TabsContent>
        <TabsContent value="deploy" className="mt-6">
          <DeployTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
