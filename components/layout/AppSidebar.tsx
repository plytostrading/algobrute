'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAlpacaStatus } from '@/hooks/useAlpacaStatus';
import { useAuth } from '@/store/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { getInitials, getDisplayName } from '@/lib/user';
import {
  Briefcase,
  LayoutDashboard,
  FlaskConical,
  Radio,
  LineChart,
  Settings,
  ChevronUp,
  Activity,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const mainNav = [
  { icon: Briefcase, label: 'Portfolio', path: '/portfolio' },
  { icon: LayoutDashboard, label: 'Command Center', path: '/' },
  { icon: FlaskConical, label: 'Workbench', path: '/workbench' },
  { icon: Radio, label: 'Operations', path: '/operations' },
  { icon: LineChart, label: 'Insights', path: '/insights' },
];

const settingsNav = [
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (path: string) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);
  const { data: profile } = useUserProfile();
  const { data: alpacaStatus } = useAlpacaStatus();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const initials = profile ? getInitials(profile.email) : '…';
  const displayName = profile ? getDisplayName(profile.email) : 'Loading…';
  const subtitle = profile
    ? `${profile.expertise_level}${alpacaStatus?.connected ? ' · Alpaca ✓' : ''}`
    : '…';

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.replace('/login');
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Activity className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">AlgoBrute</span>
                  <span className="truncate text-xs text-muted-foreground">Trading Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                    >
                      <Link href={item.path}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                    >
                      <Link href={item.path}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground capitalize">{subtitle}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
