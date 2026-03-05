import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import AuthExpiryWatcher from '@/components/auth/AuthExpiryWatcher';
import AskPortfolioFloat from '@/components/portfolio/AskPortfolioFloat';
import BacktestJobNotifier from '@/components/layout/BacktestJobNotifier';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AuthExpiryWatcher />
        {/* Global background-job notifier: fires toasts when backtest jobs complete */}
        <BacktestJobNotifier />
        <AppSidebar />
        <SidebarInset className="h-svh overflow-hidden">
          <AppHeader />
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </SidebarInset>
        {/* Fixed floater — self-guards via pathname check inside */}
        <AskPortfolioFloat />
      </SidebarProvider>
    </TooltipProvider>
  );
}
