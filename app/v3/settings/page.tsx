'use client';

/**
 * v3 Settings — visual restyle of the wired W7 settings page.
 *
 * IMPORTANT: This is the v3 visual variant of Settings. The canonical wired
 * Settings page at `app/(app)/settings/page.tsx` remains the source of truth
 * for backend integration logic (PATCH /api/user/profile, GET / POST / DELETE
 * /api/user/alpaca/*). This file mirrors that wiring 1-for-1 while rendering
 * with v3's infographic visual language (theme.css, .v3-card, .settings-grid,
 * Instrument Serif type, etc.).
 *
 * All API calls, query keys, and mutation flows are identical to the wired
 * page — only the JSX shell and styling differ. This means the live backend
 * keeps working through `/v3/settings`.
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch, parseApiError, parseApiJson } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { SectionHeader, Pill } from '@/components/v3/atoms';
import type { UserProfile, AlpacaConnectionStatus, AlpacaMode } from '@/types/api';

// ---------------------------------------------------------------------------
// Fetchers — identical to the wired Settings page
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

async function connectAlpaca(
  apiKey: string,
  secretKey: string,
  mode: AlpacaMode,
): Promise<AlpacaConnectionStatus> {
  const res = await apiFetch('/api/user/alpaca/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, secret_key: secretKey, mode }),
  });
  if (!res.ok) {
    const detail = await parseApiError(res, 'Failed to connect Alpaca account');
    throw new Error(detail);
  }
  return parseApiJson<AlpacaConnectionStatus>(res);
}

async function disconnectAlpaca(mode: AlpacaMode): Promise<void> {
  const res = await apiFetch('/api/user/alpaca/disconnect', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) {
    const detail = await parseApiError(res, 'Failed to disconnect Alpaca account');
    throw new Error(detail);
  }
}

// ---------------------------------------------------------------------------
// Risk Profile Card — v3 visual, wired to PATCH /api/user/profile
// ---------------------------------------------------------------------------

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
    mutationFn: () =>
      patchProfile({
        expertise_level: form.expertise_level as UserProfile['expertise_level'],
        capital_base: form.capital_base ? parseFloat(form.capital_base) : null,
        max_drawdown_tolerance_pct: form.max_drawdown_tolerance_pct
          ? parseFloat(form.max_drawdown_tolerance_pct)
          : null,
        daily_loss_limit: form.daily_loss_limit ? parseFloat(form.daily_loss_limit) : null,
        risk_comfort_level: form.risk_comfort_level || null,
        target_annual_return_pct: form.target_annual_return_pct
          ? parseFloat(form.target_annual_return_pct)
          : null,
      }),
    onSuccess: () => {
      toast.success('Profile saved');
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.profile });
      setEditing(false);
    },
  });

  const fmtCurrency = (n: number | null | undefined) =>
    n == null ? '—' : '$' + n.toLocaleString();

  return (
    <div className="v3-card">
      <header className="v3-card-head">
        <div>
          <div className="eyebrow">01 — Account</div>
          <div className="card-title" style={{ fontSize: 20 }}>
            Risk Profile
          </div>
        </div>
        {!editing && (
          <button className="v3-btn-ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
        )}
      </header>
      <div className="v3-card-body">
        {editing ? (
          <div className="settings-form">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="settings-field">
                <div className="settings-label">Expertise level</div>
                <select
                  className="settings-select"
                  value={form.expertise_level}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      expertise_level: e.target.value as UserProfile['expertise_level'],
                    }))
                  }
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="settings-field">
                <div className="settings-label">Risk comfort level</div>
                <select
                  className="settings-select"
                  value={form.risk_comfort_level}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, risk_comfort_level: e.target.value }))
                  }
                >
                  <option value="">Select…</option>
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
              <div className="settings-field">
                <div className="settings-label">Capital base ($)</div>
                <input
                  type="number"
                  className="settings-input"
                  value={form.capital_base}
                  onChange={(e) => setForm((f) => ({ ...f, capital_base: e.target.value }))}
                  placeholder="e.g. 50000"
                />
              </div>
              <div className="settings-field">
                <div className="settings-label">Max drawdown tolerance (%)</div>
                <input
                  type="number"
                  className="settings-input"
                  value={form.max_drawdown_tolerance_pct}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, max_drawdown_tolerance_pct: e.target.value }))
                  }
                  placeholder="e.g. 15"
                />
              </div>
              <div className="settings-field">
                <div className="settings-label">Daily loss limit ($)</div>
                <input
                  type="number"
                  className="settings-input"
                  value={form.daily_loss_limit}
                  onChange={(e) => setForm((f) => ({ ...f, daily_loss_limit: e.target.value }))}
                  placeholder="e.g. 500"
                />
              </div>
              <div className="settings-field">
                <div className="settings-label">Target annual return (%)</div>
                <input
                  type="number"
                  className="settings-input"
                  value={form.target_annual_return_pct}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, target_annual_return_pct: e.target.value }))
                  }
                  placeholder="e.g. 20"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                className="v3-btn-primary"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button className="v3-btn-ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
            {mutation.isError && (
              <p style={{ color: 'var(--alert)', fontSize: 12, marginTop: 4 }}>
                {(mutation.error as Error).message}
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="settings-row">
              <span className="key">Email</span>
              <span className="val">{profile.email}</span>
            </div>
            <div className="settings-row">
              <span className="key">Expertise</span>
              <span className="val" style={{ textTransform: 'capitalize' }}>
                {profile.expertise_level}
              </span>
            </div>
            <div className="settings-row">
              <span className="key">Risk comfort</span>
              <span className="val" style={{ textTransform: 'capitalize' }}>
                {profile.risk_comfort_level ?? '—'}
              </span>
            </div>
            <div className="settings-row">
              <span className="key">Capital base</span>
              <span className="val">{fmtCurrency(profile.capital_base)}</span>
            </div>
            <div className="settings-row">
              <span className="key">Max drawdown tolerance</span>
              <span className="val">
                {profile.max_drawdown_tolerance_pct != null
                  ? `${profile.max_drawdown_tolerance_pct}%`
                  : '—'}
              </span>
            </div>
            <div className="settings-row">
              <span className="key">Daily loss limit</span>
              <span className="val">{fmtCurrency(profile.daily_loss_limit)}</span>
            </div>
            <div className="settings-row">
              <span className="key">Target annual return</span>
              <span className="val">
                {profile.target_annual_return_pct != null
                  ? `${profile.target_annual_return_pct}%`
                  : '—'}
              </span>
            </div>
            {profile.capital_base == null && profile.risk_comfort_level == null && (
              <div
                style={{
                  marginTop: 12,
                  fontFamily: 'var(--f-mono)',
                  fontSize: 11,
                  color: 'var(--text-3)',
                  fontStyle: 'italic',
                }}
              >
                Risk parameters not yet configured. Click Edit to set your capital base and risk
                limits.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Alpaca panel — v3 visual, mode-aware (paper / live)
// ---------------------------------------------------------------------------

function AlpacaPanel({
  mode,
  connected,
  accountId,
}: {
  mode: AlpacaMode;
  connected: boolean;
  accountId: string | null;
}) {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const modeLabel = mode === 'paper' ? 'Paper' : 'Live';

  const connectMutation = useMutation({
    mutationFn: () => connectAlpaca(apiKey, secretKey, mode),
    onSuccess: () => {
      toast.success(`Alpaca ${modeLabel.toLowerCase()} credentials saved`);
      setApiKey('');
      setSecretKey('');
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.alpacaStatus });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => disconnectAlpaca(mode),
    onSuccess: () => {
      toast.success(`Alpaca ${modeLabel.toLowerCase()} credentials removed`);
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.alpacaStatus });
      setConfirmDisconnect(false);
    },
    onError: (err: Error) => toast.error(`Disconnect failed: ${err.message}`),
  });

  if (connected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="alpaca-status connected">● Connected</span>
          {accountId && (
            <span
              style={{ fontFamily: 'var(--f-mono)', fontSize: 11, color: 'var(--text-3)' }}
            >
              Account: {accountId} · {modeLabel.toLowerCase()} mode
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: 'var(--f-mono)',
            fontSize: 11,
            color: 'var(--text-2)',
            lineHeight: 1.5,
          }}
        >
          {mode === 'paper'
            ? 'Your paper trading account is connected. Trades are simulated; no real capital is at risk.'
            : 'Live credentials are stored. Live trading is disabled during closed beta; no live orders will be placed until the platform enables it.'}
        </div>
        <div>
          <button
            className="v3-btn-alert"
            onClick={() => setConfirmDisconnect(true)}
            disabled={disconnectMutation.isPending}
          >
            {disconnectMutation.isPending ? 'Disconnecting…' : 'Disconnect'}
          </button>
        </div>

        {confirmDisconnect && (
          <div className="confirm-overlay" onClick={() => setConfirmDisconnect(false)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <h4>Disconnect Alpaca {modeLabel.toLowerCase()} credentials?</h4>
              <p>
                This will remove your {modeLabel.toLowerCase()}-mode Alpaca API credentials. Your{' '}
                {mode === 'paper' ? 'live' : 'paper'}-mode credentials will be left intact. Any
                running {modeLabel.toLowerCase()} bots may lose their brokerage connection. You can
                reconnect at any time.
              </p>
              <div className="confirm-actions">
                <button className="v3-btn-ghost" onClick={() => setConfirmDisconnect(false)}>
                  Cancel
                </button>
                <button
                  className="v3-btn-alert"
                  onClick={() => disconnectMutation.mutate()}
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="alpaca-status disconnected">○ Not connected</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="settings-field">
          <div className="settings-label">API Key</div>
          <input
            className="settings-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={mode === 'paper' ? 'PKTEST…' : 'AK…'}
          />
        </div>
        <div className="settings-field">
          <div className="settings-label">Secret Key</div>
          <input
            type="password"
            className="settings-input"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>
      <div>
        <button
          className="v3-btn-primary"
          onClick={() => connectMutation.mutate()}
          disabled={!apiKey || !secretKey || connectMutation.isPending}
          style={{ opacity: !apiKey || !secretKey ? 0.5 : 1 }}
        >
          {connectMutation.isPending
            ? 'Connecting…'
            : mode === 'paper'
              ? 'Connect Paper Account'
              : 'Save Live Credentials'}
        </button>
      </div>
      {connectMutation.isError && (
        <p style={{ color: 'var(--alert)', fontSize: 12 }}>
          {(connectMutation.error as Error).message}
        </p>
      )}
      <div
        style={{
          fontFamily: 'var(--f-mono)',
          fontSize: 10,
          color: 'var(--text-3)',
          lineHeight: 1.5,
        }}
      >
        Credentials are stored encrypted server-side.{' '}
        {mode === 'paper'
          ? 'Paper keys are sandboxed — they cannot affect your live Alpaca account.'
          : 'Live trading is currently disabled during closed beta.'}
      </div>
    </div>
  );
}

function AlpacaCard() {
  const { data: status, isLoading } = useQuery({
    queryKey: queryKeys.user.alpacaStatus,
    queryFn: fetchAlpacaStatus,
  });
  const [tab, setTab] = useState<AlpacaMode>('paper');

  return (
    <div className="v3-card">
      <header className="v3-card-head">
        <div>
          <div className="eyebrow">02 — Brokerage</div>
          <div className="card-title" style={{ fontSize: 20 }}>
            Alpaca Connection
          </div>
          <div className="card-sub">
            Connect your personal Alpaca brokerage account. Paper and live credentials are stored
            independently.
          </div>
        </div>
      </header>
      <div className="v3-card-body">
        {isLoading || !status ? (
          <div className="micro" style={{ padding: '20px 0' }}>
            Loading…
          </div>
        ) : (
          <>
            <div className="v3-tabs" style={{ marginBottom: 16 }}>
              <button
                className={'tab ' + (tab === 'paper' ? 'on' : '')}
                onClick={() => setTab('paper')}
              >
                Paper{' '}
                {status.paper_connected && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: 'var(--mint)',
                      marginLeft: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                )}
              </button>
              <button
                className={'tab ' + (tab === 'live' ? 'on' : '')}
                onClick={() => setTab('live')}
              >
                Live{' '}
                {status.live_connected && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: 'var(--mint)',
                      marginLeft: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                )}
              </button>
            </div>
            {tab === 'paper' ? (
              <AlpacaPanel
                mode="paper"
                connected={status.paper_connected}
                accountId={status.paper_account_id}
              />
            ) : (
              <AlpacaPanel
                mode="live"
                connected={status.live_connected}
                accountId={status.live_account_id}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function V3SettingsPage() {
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: queryKeys.user.profile,
    queryFn: fetchProfile,
  });

  return (
    <div className="v3-page">
      <SectionHeader
        eyebrow="07 — Settings"
        title="Risk profile, brokerage & autonomy."
        sub="Configure how the platform trades on your behalf"
        right={<Pill tone="mint">v3 · live-wired</Pill>}
      />

      {isError && (
        <div className="v3-card">
          <div className="v3-card-body" style={{ color: 'var(--alert)' }}>
            Failed to load profile. Please refresh.
          </div>
        </div>
      )}

      <div className="settings-grid">
        {isLoading || !profile ? (
          <>
            <div className="v3-card">
              <div className="v3-card-body">
                <div className="micro" style={{ padding: '20px 0' }}>
                  Loading risk profile…
                </div>
              </div>
            </div>
            <div className="v3-card">
              <div className="v3-card-body">
                <div className="micro" style={{ padding: '20px 0' }}>
                  Loading Alpaca status…
                </div>
              </div>
            </div>
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
