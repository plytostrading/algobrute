import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import AutonomySettingsCard from '../AutonomySettingsCard';

// ---------------------------------------------------------------------------
// Mock apiFetch — drives the network shape used by the autonomy hooks.
// We mock at the `lib/api` boundary because the hooks under test go
// through it for both the policy GET and the policy POST.
// ---------------------------------------------------------------------------

interface MockResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  headers: { get: (k: string) => string | null };
  text: () => Promise<string>;
}

const apiFetchMock = vi.fn<(path: string, init?: RequestInit) => Promise<MockResponse>>();

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api');
  return {
    ...actual,
    apiFetch: (path: string, init?: RequestInit) => apiFetchMock(path, init),
  };
});

// Helper to build a successful JSON response.
function ok<T>(body: T): MockResponse {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    headers: { get: () => 'application/json' },
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

function fail(status: number, detail: string): MockResponse {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({ detail }),
    headers: { get: () => 'application/json' },
    text: () => Promise.resolve(detail),
  };
}

const POLICY_PAYLOAD = {
  policy_id: '00000000-0000-0000-0000-000000000001',
  mode: 'supervised',
  allowed_actions: {
    reduce_fleet_exposure: 'allowed',
    restore_fleet_exposure: 'blocked',
    trigger_fleet_rebalance: 'blocked',
  },
  posterior_aware_sizer_canary_opt_in: false,
};

// Each test gets a fresh client so cached results never bleed across
// the suite — TanStack Query holds query state on the client instance.
function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => {
  apiFetchMock.mockReset();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AutonomySettingsCard', () => {
  it('renders toggle and Beta badge once policy resolves', async () => {
    apiFetchMock.mockResolvedValueOnce(ok(POLICY_PAYLOAD));

    renderWithClient(<AutonomySettingsCard />);

    expect(await screen.findByRole('switch')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByLabelText(/posterior-aware sizer/i)).toBeInTheDocument();
  });

  it('shows loading skeleton before the policy resolves', () => {
    // Pending promise — never resolves during the assertion so the
    // skeleton path is observable.
    apiFetchMock.mockImplementationOnce(() => new Promise(() => {}));

    const { container } = renderWithClient(<AutonomySettingsCard />);

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    // Skeleton primitive renders a div with data-slot="skeleton".
    expect(container.querySelector('[data-slot="skeleton"]')).not.toBeNull();
  });

  it('toggling the switch fires a POST mutation against /autonomy/policy', async () => {
    const user = userEvent.setup();
    apiFetchMock.mockResolvedValueOnce(ok(POLICY_PAYLOAD));
    apiFetchMock.mockResolvedValueOnce(
      ok({ ...POLICY_PAYLOAD, posterior_aware_sizer_canary_opt_in: true }),
    );
    // onSettled triggers an invalidation refetch — answer with the
    // post-mutation policy so we don't end with an unhandled call.
    apiFetchMock.mockResolvedValue(
      ok({ ...POLICY_PAYLOAD, posterior_aware_sizer_canary_opt_in: true }),
    );

    renderWithClient(<AutonomySettingsCard />);

    const toggle = await screen.findByRole('switch');
    await user.click(toggle);

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/fleet-control/autonomy/policy',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    const [, init] = apiFetchMock.mock.calls.find(
      ([path]) => path === '/api/fleet-control/autonomy/policy',
    ) as [string, RequestInit];
    const body = JSON.parse(init.body as string) as Record<string, unknown>;
    expect(body.mode).toBe('supervised');
    expect(body.posterior_aware_sizer_canary_opt_in).toBe(true);
    // Inherit-on-omit: action overrides should not be in the body.
    expect(body.allow_reduce_fleet_exposure).toBeUndefined();
  });

  it('renders an error banner when the initial policy fetch fails', async () => {
    apiFetchMock.mockResolvedValueOnce(fail(500, 'backend offline'));

    renderWithClient(<AutonomySettingsCard />);

    expect(
      await screen.findByText(/failed to load autonomy preferences/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/backend offline/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders an error banner when the save mutation fails', async () => {
    const user = userEvent.setup();
    apiFetchMock.mockResolvedValueOnce(ok(POLICY_PAYLOAD));
    apiFetchMock.mockResolvedValueOnce(fail(503, 'arbiter unavailable'));
    // Subsequent invalidation refetch — keep the GET fresh so the
    // component does not flip into a loading state.
    apiFetchMock.mockResolvedValue(ok(POLICY_PAYLOAD));

    renderWithClient(<AutonomySettingsCard />);

    const toggle = await screen.findByRole('switch');
    await user.click(toggle);

    expect(
      await screen.findByText(/failed to save autonomy preferences/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/arbiter unavailable/i)).toBeInTheDocument();
  });
});
