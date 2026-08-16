/**
 * Single entry point for every call to the MERS Tassel API.
 *
 * Handles the response envelope, auth headers, and access-token refresh. Refresh is
 * single-flight: if several requests hit a 401 at once they all await one refresh call
 * rather than racing to rotate the token — with rotation enabled server-side, concurrent
 * refreshes would invalidate each other and sign the user out.
 */

/**
 * Origin of the API, e.g. `http://localhost:5080`.
 *
 * This project previously pointed at Django using a path suffix
 * (`NEXT_PUBLIC_API_URL=http://localhost:8000/api`). A carried-over value of that shape would
 * otherwise build `…/api/api/v1/products` and 404 every request — including every image, since
 * media resolves against the same base. Trim the known suffixes so an upgraded checkout keeps
 * working, and say so once in development rather than fixing it silently.
 */
function resolveApiBase(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5080').trim().replace(/\/+$/, '');
  const normalized = configured.replace(/\/api(\/v\d+)?$/i, '');

  if (normalized !== configured && process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    console.warn(
      `[api] NEXT_PUBLIC_API_URL should be the API origin, not a path. ` +
        `Using "${normalized}" instead of "${configured}".`,
    );
  }

  return normalized || 'http://localhost:5080';
}

export const API_BASE_URL = resolveApiBase();
export const API_URL = `${API_BASE_URL}/api/v1`;

/** Resolves a stored relative path (`/uploads/...`) to an absolute URL. */
export function mediaUrl(path?: string | null): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  code?: string;
};

export type Paged<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, code?: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  /** First message for a field, for inline form errors. */
  fieldError(field: string) {
    return this.errors?.[field]?.[0];
  }
}

// ── Token access ────────────────────────────────────────────────────────────
// Injected by the auth store at module load, so this layer stays free of a store import
// (the store itself needs the client, and the cycle would break server-side rendering).

type TokenBridge = {
  getAccess: () => string | null;
  getRefresh: () => string | null;
  onRefreshed: (access: string, refresh: string) => void;
  onSignedOut: () => void;
};

let bridge: TokenBridge | null = null;

export function connectAuthBridge(next: TokenBridge) {
  bridge = next;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  /** Sends FormData untouched; the browser sets the multipart boundary. */
  form?: FormData;
  auth?: boolean;
  signal?: AbortSignal;
  /** Bypasses the Next.js fetch cache for data that must be fresh. */
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
};

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!bridge) return null;

  // Collapse concurrent refreshes into one in-flight request.
  if (refreshInFlight) return refreshInFlight;

  const refresh = bridge.getRefresh();
  if (!refresh) {
    bridge.onSignedOut();
    return null;
  }

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      const envelope = (await response.json().catch(() => null)) as ApiEnvelope<{
        access: string;
        refresh: string;
      }> | null;

      if (!response.ok || !envelope?.success || !envelope.data) {
        bridge!.onSignedOut();
        return null;
      }

      bridge!.onRefreshed(envelope.data.access, envelope.data.refresh);
      return envelope.data.access;
    } catch {
      bridge!.onSignedOut();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function send<T>(path: string, options: RequestOptions, accessOverride?: string): Promise<T> {
  const { method = 'GET', body, form, auth = false, signal, cache, next } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (auth) {
    const access = accessOverride ?? bridge?.getAccess() ?? null;
    if (access) headers.Authorization = `Bearer ${access}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal,
      cache,
      next,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(
      'Could not reach the atelier service. Check that the API is running.',
      0,
      'network_error',
    );
  }

  if (response.status === 204) return undefined as T;

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !envelope?.success) {
    // No envelope at all means the body was not this API's JSON — almost always a
    // misconfigured base URL answering from some other server. Say that, rather than
    // reporting a bare status code that gives the reader nothing to act on.
    const message =
      envelope?.message ||
      (envelope === null
        ? `Unexpected ${response.status} from ${API_URL}. Check NEXT_PUBLIC_API_URL points at the API origin.`
        : `Request failed (${response.status}).`);

    throw new ApiError(message, response.status, envelope?.code, envelope?.errors);
  }

  return envelope.data as T;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await send<T>(path, options);
  } catch (error) {
    const unauthorized = error instanceof ApiError && error.status === 401;
    if (!unauthorized || !options.auth || !bridge) throw error;

    const access = await refreshAccessToken();
    if (!access) throw error;

    // One retry only: a second 401 means the new token is not the problem.
    return send<T>(path, options, access);
  }
}

export const api = {
  get: <T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    request<T>(path, { ...options, method: 'DELETE' }),

  /** Multipart upload. Content-Type is deliberately left to the browser. */
  postForm: <T>(path: string, form: FormData, options: Omit<RequestOptions, 'method' | 'form'> = {}) =>
    request<T>(path, { ...options, method: 'POST', form }),

  putForm: <T>(path: string, form: FormData, options: Omit<RequestOptions, 'method' | 'form'> = {}) =>
    request<T>(path, { ...options, method: 'PUT', form }),
};

/** Serializes query params, dropping empty values so URLs stay clean. */
export function queryString(params: Record<string, string | number | boolean | undefined | null>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.append(key, String(value));
  }

  const rendered = search.toString();
  return rendered ? `?${rendered}` : '';
}
