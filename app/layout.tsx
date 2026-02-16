import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '@/store/StoreProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import RailNav from '@/components/layout/RailNav';
import TopMetricsBar from '@/components/layout/TopMetricsBar';

export const metadata: Metadata = {
  title: 'AlgoBrute - Trading Platform',
  description: 'Advanced algorithmic trading platform for retail traders',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="antialiased">
        <StoreProvider>
          <TooltipProvider>
            <div className="flex h-screen overflow-hidden">
              <RailNav />
              <div className="flex flex-1 flex-col overflow-hidden">
                <TopMetricsBar />
                <main className="flex-1 overflow-y-auto p-4">
                  {children}
                </main>
              </div>
            </div>
          </TooltipProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
