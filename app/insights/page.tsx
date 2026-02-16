'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TerminalLabel from '@/components/common/TerminalLabel';
import JournalTab from '@/components/insights/JournalTab';
import AnalyticsTab from '@/components/insights/AnalyticsTab';
import AttributionTab from '@/components/insights/AttributionTab';

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState('journal');

  return (
    <div className="flex flex-col gap-3">
      <TerminalLabel icon="📊">INSIGHTS</TerminalLabel>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="journal">Journal</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="attribution">Attribution</TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="mt-3">
          <JournalTab />
        </TabsContent>

        <TabsContent value="analytics" className="mt-3">
          <AnalyticsTab />
        </TabsContent>

        <TabsContent value="attribution" className="mt-3">
          <AttributionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
