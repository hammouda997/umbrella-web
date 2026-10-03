import type { AppRole } from "@/lib/roles";
import { USE_MOCK } from "@/lib/mock-mode";
import { MockHttpError, mockHandle } from "@/lib/mock-db";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3011";
const MOCK_LATENCY_MS = 80;

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  portal: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: AppRole;
    phone?: string | null;
    agencyId?: number | null;
  };
};

export type StatusCard = {
  key: string;
  label: string;
  tone: string;
  count: number;
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type TokenRefresher = () => Promise<string | null>;

let refresher: TokenRefresher | null = null;
let inFlightRefresh: Promise<string | null> | null = null;

/** Registered by the auth provider so expired access tokens are renewed transparently. */
export function setTokenRefresher(fn: TokenRefresher | null) {
  refresher = fn;
}

async function refreshToken(): Promise<string | null> {
  if (!refresher) return null;
  inFlightRefresh ??= refresher().finally(() => {
    inFlightRefresh = null;
  });
  return inFlightRefresh;
}

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "message" in body) {
    const msg = (body as { message: unknown }).message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.map(String).join(", ");
  }
  if (status === 401) return "Session expirée, reconnectez-vous";
  if (status === 403) return "Accès refusé";
  if (status === 404) return "Ressource introuvable";
  return `Erreur serveur (${status})`;
}

function parseBody(raw: BodyInit | null | undefined): unknown {
  if (typeof raw !== "string" || !raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

async function mockRequest<T>(method: string, path: string, body: unknown, token?: string) {
  await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));
  try {
    return mockHandle(method, path, body, token) as T;
  } catch (error) {
    if (error instanceof MockHttpError) throw new ApiError(error.status, error.message);
    throw error;
  }
}

async function httpRequest<T>(
  path: string,
  init: RequestInit,
  token: string | undefined,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Serveur injoignable — vérifiez que l'API est démarrée");
  }

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    throw new ApiError(res.status, errorMessage(body, res.status));
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...init } = options;
  const method = (init.method ?? "GET").toUpperCase();
  const send = (accessToken: string | undefined) =>
    USE_MOCK
      ? mockRequest<T>(method, path, parseBody(init.body), accessToken)
      : httpRequest<T>(path, { ...init, method }, accessToken);

  try {
    return await send(token);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401 || !token) throw error;
    const renewed = await refreshToken();
    if (!renewed) throw error;
    return send(renewed);
  }
}
