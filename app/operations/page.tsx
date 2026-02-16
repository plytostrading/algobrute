'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radio, ShieldAlert } from 'lucide-react';
import FleetManagement from '@/components/operations/FleetManagement';
import RiskDashboard from '@/components/operations/RiskDashboard';

export default function OperationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Operations</h2>
        <p className="text-sm text-muted-foreground">Monitor and manage your live trading fleet</p>
      </div>

      <Tabs defaultValue="fleet" className="w-full">
        <TabsList>
          <TabsTrigger value="fleet" className="gap-2">
            <Radio className="h-4 w-4" />
            Fleet Management
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            Risk Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="mt-6">
          <FleetManagement />
        </TabsContent>
        <TabsContent value="risk" className="mt-6">
          <RiskDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
