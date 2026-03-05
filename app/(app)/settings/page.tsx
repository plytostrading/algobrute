'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { formatCurrency } from '@/utils/formatters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import type { UserProfile, AlpacaConnectionStatus } from '@/types/api';

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchProfile(): Promise<UserProfile> {
  const res = await apiFetch('/api/user/profile');
  if (!res.ok) throw new Error('Failed to load profile');
  return parseApiJson<UserProfile>(res);
}

async function patchProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const res = await apiFetch('/api/user/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const detail = await parseApiError(res, 'Failed to update profile');
    throw new Error(detail);
  }
  return parseApiJson<UserProfile>(res);
}

async function fetchAlpacaStatus(): Promise<AlpacaConnectionStatus> {
  const res = await apiFetch('/api/user/alpaca/status');
  if (!res.ok) throw new Error('Failed to load Alpaca status');
  return parseApiJson<AlpacaConnectionStatus>(res);
}

async function connectAlpaca(apiKey: string, secretKey: string): Promise<AlpacaConnectionStatus> {
  const res = await apiFetch('/api/user/alpaca/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, secret_key: secretKey }),
  });
  if (!res.ok) {
    const detail = await parseApiError(res, 'Failed to connect Alpaca account');
    throw new Error(detail);
  }
  return parseApiJson<AlpacaConnectionStatus>(res);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

function RiskProfileCard({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    capital_base: profile.capital_base?.toString() ?? '',
    max_drawdown_tolerance_pct: profile.max_drawdown_tolerance_pct?.toString() ?? '',
    daily_loss_limit: profile.daily_loss_limit?.toString() ?? '',
    risk_comfort_level: profile.risk_comfort_level ?? '',
    target_annual_return_pct: profile.target_annual_return_pct?.toString() ?? '',
    expertise_level: profile.expertise_level,
  });

  const mutation = useMutation({
    mutationFn: () => patchProfile({
      expertise_level: form.expertise_level as UserProfile['expertise_level'],
      capital_base: form.capital_base ? parseFloat(form.capital_base) : null,
      max_drawdown_tolerance_pct: form.max_drawdown_tolerance_pct ? parseFloat(form.max_drawdown_tolerance_pct) : null,
      daily_loss_limit: form.daily_loss_limit ? parseFloat(form.daily_loss_limit) : null,
      risk_comfort_level: form.risk_comfort_level || null,
      target_annual_return_pct: form.target_annual_return_pct ? parseFloat(form.target_annual_return_pct) : null,
    }),
    onSuccess: () => {
      toast.success('Profile saved');
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      setEditing(false);
    },
    // Inline error panel below the form already surfaces this; no toast needed.
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Risk Profile</CardTitle>
          <CardDescription>Your account and trading risk parameters</CardDescription>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
        )}
      </CardHeader>
      <CardContent>
        {editing ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Expertise Level</Label>
              <Select value={form.expertise_level} onValueChange={(v) => setForm(f => ({ ...f, expertise_level: v as UserProfile['expertise_level'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Risk Comfort Level</Label>
              <Select value={form.risk_comfort_level} onValueChange={(v) => setForm(f => ({ ...f, risk_comfort_level: v }))}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="conservative">Conservative</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Capital Base ($)</Label>
              <Input type="number" value={form.capital_base} onChange={(e) => setForm(f => ({ ...f, capital_base: e.target.value }))} placeholder="e.g. 50000" />
            </div>
            <div className="grid gap-2">
              <Label>Max Drawdown Tolerance (%)</Label>
              <Input type="number" value={form.max_drawdown_tolerance_pct} onChange={(e) => setForm(f => ({ ...f, max_drawdown_tolerance_pct: e.target.value }))} placeholder="e.g. 15" />
            </div>
            <div className="grid gap-2">
              <Label>Daily Loss Limit ($)</Label>
              <Input type="number" value={form.daily_loss_limit} onChange={(e) => setForm(f => ({ ...f, daily_loss_limit: e.target.value }))} placeholder="e.g. 500" />
            </div>
            <div className="grid gap-2">
              <Label>Target Annual Return (%)</Label>
              <Input type="number" value={form.target_annual_return_pct} onChange={(e) => setForm(f => ({ ...f, target_annual_return_pct: e.target.value }))} placeholder="e.g. 20" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
            {mutation.isError && (
              <p className="text-sm text-destructive">{(mutation.error as Error).message}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Row label="Email" value={profile.email} />
            <Row label="Expertise" value={<Badge variant="secondary" className="capitalize">{profile.expertise_level}</Badge>} />
            <Row label="Risk Comfort" value={profile.risk_comfort_level ? <Badge variant="secondary" className="capitalize">{profile.risk_comfort_level}</Badge> : <span className="text-muted-foreground text-sm">—</span>} />
            <Row label="Capital Base" value={profile.capital_base != null ? formatCurrency(profile.capital_base) : '—'} />
            <Row label="Max Drawdown Tolerance" value={profile.max_drawdown_tolerance_pct != null ? `${profile.max_drawdown_tolerance_pct}%` : '—'} />
            <Row label="Daily Loss Limit" value={profile.daily_loss_limit != null ? formatCurrency(profile.daily_loss_limit) : '—'} />
            <Row label="Target Annual Return" value={profile.target_annual_return_pct != null ? `${profile.target_annual_return_pct}%` : '—'} />
            {profile.capital_base == null && profile.risk_comfort_level == null && (
              <p className="text-xs text-muted-foreground border-t pt-3">
                Risk parameters are not yet configured. Click <strong>Edit</strong> to set your capital base, drawdown tolerance, and loss limits.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function disconnectAlpaca(): Promise<void> {
  const res = await apiFetch('/api/user/alpaca/disconnect', { method: 'DELETE' });
  if (!res.ok) {
    const detail = await parseApiError(res, 'Failed to disconnect Alpaca account');
    throw new Error(detail);
  }
}

function AlpacaCard() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  const { data: status, isLoading } = useQuery({
    queryKey: queryKeys.user.alpacaStatus,
    queryFn: fetchAlpacaStatus,
  });

  const connectMutation = useMutation({
    mutationFn: () => connectAlpaca(apiKey, secretKey),
    onSuccess: () => {
      toast.success('Alpaca connected successfully');
      setApiKey('');
      setSecretKey('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.alpacaStatus });
    },
    // Inline error panel below the connect form already surfaces this; no toast needed.
  });

  const disconnectMutation = useMutation({
    mutationFn: disconnectAlpaca,
    onSuccess: () => {
      toast.success('Alpaca disconnected');
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.alpacaStatus });
    },
    onError: (err: Error) => toast.error(`Disconnect failed: ${err.message}`),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alpaca Connection</CardTitle>
        <CardDescription>Connect your personal Alpaca brokerage account</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ProfileSkeleton />
        ) : status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-600 text-white">Connected</Badge>
              {status.account_id && (
                <span className="text-sm text-muted-foreground">Account: {status.account_id}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{status.status_message}</p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect Alpaca account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove your Alpaca API credentials. Any running bots may lose their
                    brokerage connection. You can reconnect at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-white hover:bg-destructive/90"
                    onClick={() => disconnectMutation.mutate()}
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>API Key</Label>
              <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="PKTEST…" />
            </div>
            <div className="grid gap-2">
              <Label>Secret Key</Label>
              <Input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder="••••••••" />
            </div>
            <Button size="sm" onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending || !apiKey || !secretKey}>
              {connectMutation.isPending ? 'Connecting…' : 'Connect'}
            </Button>
            {connectMutation.isError && (
              <p className="text-sm text-destructive">{(connectMutation.error as Error).message}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: fetchProfile,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure your risk profile and platform preferences</p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Failed to load profile. Please refresh.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {isLoading || !profile ? (
          <>
            <Card><CardHeader><CardTitle>Risk Profile</CardTitle></CardHeader><CardContent><ProfileSkeleton /></CardContent></Card>
            <Card><CardHeader><CardTitle>Alpaca Connection</CardTitle></CardHeader><CardContent><ProfileSkeleton /></CardContent></Card>
          </>
        ) : (
          <>
            <RiskProfileCard profile={profile} />
            <AlpacaCard />
          </>
        )}
      </div>
    </div>
  );
}
