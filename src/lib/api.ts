import type { AppRole } from "@/lib/roles";
import { USE_MOCK } from "@/lib/mock-mode";
import { mockHandle } from "@/lib/mock-data";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3011";

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
  };
};

function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "message" in body) {
    const msg = (body as { message: unknown }).message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg.map(String).join(", ");
  }
  return `Request failed (${status})`;
}

function sessionFromToken(token?: string): { userId?: number; role?: AppRole } {
  if (!token?.startsWith("mock-access-")) return {};
  const id = Number(token.replace("mock-access-", ""));
  if (!Number.isFinite(id)) return {};
  const roleMap: Record<number, AppRole> = {
    1: "SUPER_ADMIN",
    2: "ADMIN",
    3: "EXPEDITEUR",
    4: "LIVREUR",
    5: "CLIENT",
    6: "LIVREUR",
  };
  return { userId: id, role: roleMap[id] };
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const method = (rest.method ?? "GET").toUpperCase();

  if (USE_MOCK) {
    let body: unknown;
    if (typeof rest.body === "string" && rest.body) {
      try {
        body = JSON.parse(rest.body);
      } catch {
        body = undefined;
      }
    }
    const { userId, role } = sessionFromToken(token);
    const result = mockHandle(method, path, body, userId, role);
    if (result === null && method === "GET" && /^\/parcels\/\d+$/.test(path.split("?")[0])) {
      throw new Error("Parcel not found");
    }
    if (result !== null) {
      await new Promise((r) => setTimeout(r, 80));
      return result as T;
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => ({}));
    throw new Error(errorMessage(body, res.status));
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type StatusCard = {
  key: string;
  label: string;
  tone: string;
  count: number;
};
