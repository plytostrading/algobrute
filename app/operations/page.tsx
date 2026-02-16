'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TerminalLabel from '@/components/common/TerminalLabel';
import FleetManagement from '@/components/operations/FleetManagement';
import RiskDashboard from '@/components/operations/RiskDashboard';

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState('fleet');

  return (
    <div className="flex flex-col gap-3">
      <TerminalLabel icon="⚡">OPERATIONS</TerminalLabel>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="fleet">Fleet Management</TabsTrigger>
          <TabsTrigger value="risk">Risk Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="mt-3">
          <FleetManagement />
        </TabsContent>

        <TabsContent value="risk" className="mt-3">
          <RiskDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
