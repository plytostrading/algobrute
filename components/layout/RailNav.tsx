'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FlaskConical, Zap, TrendingUp, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { icon: Home, label: 'Command Center', path: '/' },
  { icon: FlaskConical, label: 'Workbench', path: '/workbench' },
  { icon: Zap, label: 'Operations', path: '/operations' },
  { icon: TrendingUp, label: 'Insights', path: '/insights' },
];

const bottomItems = [{ icon: Settings, label: 'Settings', path: '/settings' }];

// Compact sidebar navigation with shadcn
export default function RailNav() {
  const pathname = usePathname();
  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <div className="flex h-full w-14 flex-col border-r bg-card">
      <div className="flex flex-1 flex-col items-center gap-2 py-3">
        {/* Logo */}
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          AB
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <Button
                  variant={active ? 'secondary' : 'ghost'}
                  size="icon"
                  className={`h-10 w-10 ${active ? 'bg-secondary' : ''}`}
                  asChild
                >
                  <Link href={item.path}>
                    <Icon className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2 pb-3">
        <Separator className="w-8" />
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <Button
                  variant={active ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-10 w-10"
                  asChild
                >
                  <Link href={item.path}>
                    <Icon className="h-5 w-5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
