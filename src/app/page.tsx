"use client";

import { StrategyHeader } from "@/components/layout/StrategyHeader";
import { ConversationPanel } from "@/components/conversation/ConversationPanel";
import { TabbedInterface } from "@/components/layout/TabbedInterface";
import { ActionBar } from "@/components/layout/ActionBar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function Home() {
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Theme Toggle - Absolute Top Right */}
      <ThemeToggle />
      {/* Simplified Header */}
      <StrategyHeader />
      
      {/* Main content area - Tabbed Interface + Strategy Generator */}
      <div className="flex flex-1 gap-2 p-2 overflow-hidden">
        {/* Left Panel - Tabbed Interface (Chart + Market Intel + Strategy Tree) */}
        <div className="flex-1 min-w-0 min-h-0">
          <TabbedInterface />
        </div>
        
        {/* Right Panel - Strategy Generator (Increased Width by 48% + Vertical Scroll Only) */}
        <div className="w-[37rem] flex flex-col min-h-0"> {/* Increased from w-96 (24rem) to w-[37rem] (48% total increase) */}
          <div className="h-full overflow-y-auto overflow-x-hidden">
            <ConversationPanel />
          </div>
        </div>
      </div>
      
      {/* Bottom Action Bar */}
      <ActionBar />
    </div>
  );
}
