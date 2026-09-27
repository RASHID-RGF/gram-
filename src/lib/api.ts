import type { TokenPair } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, "");

const ACCESS_KEY = "gram.access_token";
const REFRESH_KEY = "gram.refresh_token";

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function loadTokens(): void {
  if (typeof window === "undefined") return;
  accessToken = window.localStorage.getItem(ACCESS_KEY);
  refreshToken = window.localStorage.getItem(REFRESH_KEY);
}

export function saveTokens(tokens: TokenPair): void {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACCESS_KEY, tokens.access_token);
    window.localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  }
}

export function clearTokens(): void {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  }
}

export function hasToken(): boolean {
  if (accessToken) return true;
  if (typeof window === "undefined") return false;
  accessToken = window.localStorage.getItem(ACCESS_KEY);
  return Boolean(accessToken);
}

export function getAccessToken(): string | null {
  return accessToken;
}

/** Turn backend-relative media paths (`/uploads/...`) into absolute URLs. */
export function mediaUrl(path?: string | null): string {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  return `${API_ORIGIN}${path}`;
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function extractError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.detail === "string") return data.detail;
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((d: { msg?: string; loc?: unknown[] }) => d.msg ?? JSON.stringify(d))
        .join(", ");
    }
    return JSON.stringify(data);
  } catch {
    return response.statusText || `HTTP ${response.status}`;
  }
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!response.ok) {
      clearTokens();
      return false;
    }
    const tokens = (await response.json()) as TokenPair;
    saveTokens(tokens);
    return true;
  } catch {
    return false;
  }
}

type FetchOptions = RequestInit & { auth?: boolean; retried?: boolean };

export async function api<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { auth = true, retried = false, headers, ...rest } = options;

  if (typeof window !== "undefined" && !accessToken) loadTokens();

  const requestHeaders = new Headers(headers);
  if (!(rest.body instanceof FormData) && rest.body && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (auth && accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const response = await fetch(url, { ...rest, headers: requestHeaders });

  if (response.status === 401 && auth && !retried && refreshToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return api<T>(path, { ...options, retried: true });
    }
    clearTokens();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, await extractError(response));
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export function queryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const out = search.toString();
  return out ? `?${out}` : "";
}
