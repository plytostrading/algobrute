import FleetHealthHero from '@/components/command-center/FleetHealthHero';
import FleetStatusGrid from '@/components/command-center/FleetStatusGrid';
import ActionCuesPanel from '@/components/command-center/ActionCuesPanel';
import PortfolioImpact from '@/components/command-center/PortfolioImpact';
import { mockPortfolio, mockFleetHealth, mockUserProfile } from '@/mock/mockData';

export default function CommandCenter() {
  return (
    <div className="flex flex-col gap-3">
      {/* Fleet Health Hero */}
      <FleetHealthHero
        status={mockFleetHealth.status}
        equity={mockPortfolio.equity}
        dayPL={mockPortfolio.dayPL}
        dayPLPercent={mockPortfolio.dayPLPercent}
        activeBots={mockPortfolio.activeDeployments}
        drawdownPercent={mockFleetHealth.drawdownPercent}
        drawdownTolerance={mockUserProfile.maxDrawdownTolerance}
        narrative={mockFleetHealth.narrative}
      />

      {/* Action Cues */}
      <ActionCuesPanel />

      {/* Fleet + Portfolio Impact side by side */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <FleetStatusGrid />
        <PortfolioImpact />
      </div>
    </div>
  );
}
