import KPICards from '@/components/command-center/KPICards';
import PortfolioChart from '@/components/command-center/PortfolioChart';
import FleetStatusGrid from '@/components/command-center/FleetStatusGrid';
import ActionCuesPanel from '@/components/command-center/ActionCuesPanel';
import RiskSummary from '@/components/command-center/RiskSummary';
import PortfolioImpact from '@/components/command-center/PortfolioImpact';
import {
  mockPortfolio,
  mockFleetHealth,
  mockUserProfile,
  mockBacktestResult,
  mockRiskIntelligence,
} from '@/mock/mockData';

export default function CommandCenter() {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI Summary Cards */}
      <KPICards
        portfolio={mockPortfolio}
        fleetStatus={mockFleetHealth.status}
        drawdownPercent={mockFleetHealth.drawdownPercent}
        drawdownTolerance={mockUserProfile.maxDrawdownTolerance}
      />

      {/* Action Cues — only shows if there are alerts */}
      <ActionCuesPanel />

      {/* Portfolio Chart */}
      <PortfolioChart equityCurve={mockBacktestResult.equityCurve} />

      {/* Risk Summary */}
      <RiskSummary risk={mockRiskIntelligence} />

      {/* Fleet + Portfolio Impact side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <FleetStatusGrid />
        <PortfolioImpact />
      </div>
    </div>
  );
}
