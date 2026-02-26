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
    if (!newToken) return res; // still unauthorised — caller handles it

    const retryHeaders = new Headers(options.headers);
    retryHeaders.set("Authorization", `Bearer ${newToken}`);
    return fetch(path, {
      ...options,
      headers: retryHeaders,
      credentials: "include",
    });
  }

  return res;
}

