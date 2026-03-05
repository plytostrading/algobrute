import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import QueryProvider from '@/store/QueryProvider';
import GoogleAuthProvider from '@/store/GoogleAuthProvider';
import { AuthProvider } from '@/store/AuthContext';
import { Toaster } from '@/components/ui/sonner';

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {/* Inline theme init: reads localStorage before first paint to prevent flash */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('color-mode');document.documentElement.classList.toggle('dark',m==='dark');document.documentElement.classList.toggle('light',m!=='dark');}catch(e){document.documentElement.classList.add('light');}})();`,
          }}
        />
        <GoogleAuthProvider>
          <AuthProvider>
            <QueryProvider>
              {children}
            </QueryProvider>
          </AuthProvider>
        </GoogleAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
