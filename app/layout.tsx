import type { Metadata } from 'next';
import './globals.css';
import StoreProvider from '@/store/StoreProvider';
import QueryProvider from '@/store/QueryProvider';
import GoogleAuthProvider from '@/store/GoogleAuthProvider';
import { AuthProvider } from '@/store/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';

export const metadata: Metadata = {
  title: 'AlgoBrute — Algorithmic Trading Platform',
  description: 'Risk-aware algorithmic trading platform for retail traders',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className="antialiased">
        <GoogleAuthProvider>
          <AuthProvider>
        <QueryProvider>
          <StoreProvider>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset className="h-svh overflow-hidden">
                <AppHeader />
                <div className="flex-1 overflow-y-auto">
                  <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                  </div>
                </div>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
          </StoreProvider>
        </QueryProvider>
          </AuthProvider>
        </GoogleAuthProvider>
      </body>
    </html>
  );
}
