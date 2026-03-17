import { parseApiError } from "./errors";
import { apiFetch } from "./http";

export type AuthUser = {
  id: string;
  email: string;
  display_name: string;
  role: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  display_name: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export async function login(req: LoginRequest): Promise<AuthResponse> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) throw await parseApiError(res);
  return (await res.json()) as AuthResponse;
}

export async function register(req: RegisterRequest): Promise<AuthResponse> {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) throw await parseApiError(res);
  return (await res.json()) as AuthResponse;
}

export async function me(): Promise<AuthUser> {
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) throw await parseApiError(res);
  return (await res.json()) as AuthUser;
}