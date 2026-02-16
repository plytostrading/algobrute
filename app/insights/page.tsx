'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, BarChart3, PieChart } from 'lucide-react';
import JournalTab from '@/components/insights/JournalTab';
import AnalyticsTab from '@/components/insights/AnalyticsTab';
import AttributionTab from '@/components/insights/AttributionTab';

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Insights</h2>
        <p className="text-sm text-muted-foreground">Trade journal, analytics, and performance attribution</p>
      </div>

      <Tabs defaultValue="journal" className="w-full">
        <TabsList>
          <TabsTrigger value="journal" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Journal
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="attribution" className="gap-2">
            <PieChart className="h-4 w-4" />
            Attribution
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="mt-6">
          <JournalTab />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab />
        </TabsContent>
        <TabsContent value="attribution" className="mt-6">
          <AttributionTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
