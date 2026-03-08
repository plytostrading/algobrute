/**
 * Authenticated API client for AlgoBrute.
 *
 * Access token is stored in a module-level variable (never in localStorage).
 * On 401, the client automatically calls /auth/refresh (which uses the httpOnly
 * refresh_token cookie) to get a new access token, then retries once.
 */

// ---------------------------------------------------------------------------
// Module-level token store — set by AuthContext, read by apiFetch
// ---------------------------------------------------------------------------

let _accessToken: string | null = null;

// ---------------------------------------------------------------------------
// Auth-expired event — dispatched when a 401 cannot be recovered by refresh.
// AuthExpiryWatcher (in the app layout) listens and redirects to /login.
//
// _authExpiredDispatched prevents duplicate dispatches when multiple concurrent
// requests all hit a 401 in the same window. Resets after 5 s so a user who
// re-authenticates in the same tab can expire again later.
// ---------------------------------------------------------------------------

let _authExpiredDispatched = false;

function dispatchAuthExpired(): void {
  if (typeof window !== 'undefined' && !_authExpiredDispatched) {
    _authExpiredDispatched = true;
    window.dispatchEvent(new Event('auth:expired'));
    setTimeout(() => {
      _authExpiredDispatched = false;
    }, 5_000);
  }
}

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// ---------------------------------------------------------------------------
// Silent refresh helper
// ---------------------------------------------------------------------------

async function doSilentRefresh(): Promise<string | null> {
  try {
    const res = await fetch("/auth/refresh", {
      method: "POST",
      credentials: "include", // sends the httpOnly refresh_token cookie
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string };
    setAccessToken(data.access_token);
    return data.access_token;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// apiFetch — drop-in replacement for fetch() for authenticated backend calls
// ---------------------------------------------------------------------------

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (_accessToken) {
    headers.set("Authorization", `Bearer ${_accessToken}`);
  }

  const res = await fetch(path, { ...options, headers, credentials: "include" });

  // On 401, attempt a silent token refresh and retry the original request once.
  if (res.status === 401) {
    const newToken = await doSilentRefresh();
    if (!newToken) {
      // Refresh failed — session is permanently expired.
      dispatchAuthExpired();
      return res;
    }

    const retryHeaders = new Headers(options.headers);
    retryHeaders.set("Authorization", `Bearer ${newToken}`);
    const retryRes = await fetch(path, {
      ...options,
      headers: retryHeaders,
      credentials: "include",
    });

    if (retryRes.status === 401) {
      // New token also rejected — dispatch expiry.
      dispatchAuthExpired();
    }

    return retryRes;
  }

  return res;
}

// ---------------------------------------------------------------------------
// parseApiError — safely extract a human-readable error message from any
// failed response, guarding against non-JSON bodies (plain text, HTML, etc.).
//
// Usage:
//   if (!res.ok) {
//     const detail = await parseApiError(res, 'Operation failed');
//     throw new Error(detail);
//   }
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// HttpError — an Error subclass that preserves the HTTP status code, enabling
// callers (e.g. SectionInsightCard) to distinguish between failure modes
// rather than treating all errors identically.
//
// Usage:
//   throw new HttpError(res.status, detail);
//   if (error instanceof HttpError && error.status === 503) { ... }
// ---------------------------------------------------------------------------

export class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function parseApiError(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const ct = res.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      const body = (await res.json()) as { detail?: string; message?: string };
      return body.detail ?? body.message ?? fallback;
    }
    const text = (await res.text()).trim();
    return text || fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// parseApiJson — safely parse a JSON success body, surfacing a clear error
// when the server returns an unexpected non-JSON payload (e.g. a CDN error
// page or a proxy 502 with an HTML body).
//
// Usage:
//   return parseApiJson<MyType>(res);
// ---------------------------------------------------------------------------

export async function parseApiJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error(
      `Server returned an unexpected non-JSON response (status ${res.status})`,
    );
  }
}

