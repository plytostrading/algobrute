'use client';

import { usePathname, useRouter } from 'next/navigation';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useFleetRecommendations } from '@/hooks/useFleetRecommendations';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/store/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useColorMode } from '@/hooks/useColorMode';
import { getInitials } from '@/lib/user';

const pageTitles: Record<string, string> = {
  '/': 'Command Center',
  '/workbench': 'Workbench',
  '/operations': 'Operations',
  '/insights': 'Insights',
  '/settings': 'Settings',
};

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [colorMode, setColorMode] = useColorMode();
  const { data: recommendations } = useFleetRecommendations();
  const { data: profile } = useUserProfile();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const initials = profile ? getInitials(profile.email) : '…';

  // Alert count: high-priority recommendations
  const totalAlerts = (recommendations ?? []).filter((r) => r.priority === 'high').length;

  const pageTitle = pageTitles[pathname] || 'AlgoBrute';

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace('/login');
  };

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
              onClick={() => setColorMode(colorMode === 'light' ? 'dark' : 'light')}
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
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => void handleLogout()}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
