'use client';

import { useSelector, useDispatch } from 'react-redux';
import { usePathname } from 'next/navigation';
import { Bell, Moon, Sun, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { RootState } from '@/store/store';
import { toggleColorMode } from '@/store/slices/uiSlice';

const pageTitles: Record<string, string> = {
  '/': 'Command Center',
  '/workbench': 'Workbench',
  '/operations': 'Operations',
  '/insights': 'Insights',
  '/settings': 'Settings',
};

export default function AppHeader() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const actionCues = useSelector((state: RootState) => state.portfolio.actionCues);
  const colorMode = useSelector((state: RootState) => state.ui.colorMode);
  const criticalCues = actionCues.filter((c) => c.severity === 'critical').length;
  const warningCues = actionCues.filter((c) => c.severity === 'warning').length;
  const totalAlerts = criticalCues + warningCues;

  const pageTitle = pageTitles[pathname] || 'AlgoBrute';

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <h1 className="text-sm font-semibold">{pageTitle}</h1>

      <div className="ml-auto flex items-center gap-1">
        {/* Search trigger */}
        <Button variant="outline" size="sm" className="hidden h-8 w-64 justify-start gap-2 text-muted-foreground md:flex">
          <Search className="h-3.5 w-3.5" />
          <span className="text-xs">Search...</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>

        <Separator orientation="vertical" className="mx-2 hidden h-4 md:block" />

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              {totalAlerts > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-4 min-w-4 px-1 text-[10px] leading-none"
                >
                  {totalAlerts}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => dispatch(toggleColorMode())}
            >
              {colorMode === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>

        {/* User avatar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">SM</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
