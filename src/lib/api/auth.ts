import type {
  UserItem,
  UserApiResponse,
  AuthCheckResponse,
  RegisterApiResponse,
  LoginApiResponse,
  VerifyEmailApiResponse,
  MessageApiResponse,
  ResetPasswordApiResponse,
} from "@/types/timer";
import { dispatchSessionExpired } from "@/lib/auth-events";

export type RegisterResult =
  | { type: "verified"; user: UserItem }
  | { type: "needsVerification"; email: string };

export class AuthApiError extends Error {
  code?: string;
  email?: string;
  attemptsLeft?: number;

  constructor(
    message: string,
    opts?: { code?: string; email?: string; attemptsLeft?: number },
  ) {
    super(message);
    this.name = "AuthApiError";
    this.code = opts?.code;
    this.email = opts?.email;
    this.attemptsLeft = opts?.attemptsLeft;
  }
}

export async function register(
  email: string,
  password: string,
  name: string,
): Promise<RegisterResult> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = (await res.json()) as RegisterApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error("error" in data ? data.error : "Failed to register.");
  }
  if ("needsVerification" in data && data.needsVerification) {
    return { type: "needsVerification", email: data.email };
  }
  if ("user" in data) {
    return { type: "verified", user: data.user };
  }
  throw new Error("Failed to register.");
}

export async function login(
  email: string,
  password: string,
): Promise<UserItem> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = (await res.json()) as LoginApiResponse;
  if (!res.ok || "error" in data) {
    throw new AuthApiError("error" in data ? data.error : "Failed to log in.", {
      code: "code" in data ? data.code : undefined,
      email: "email" in data ? data.email : undefined,
    });
  }
  return data.user;
}

export async function verifyEmail(
  email: string,
  code: string,
): Promise<UserItem> {
  const res = await fetch("/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });
  const data = (await res.json()) as VerifyEmailApiResponse;
  if (!res.ok || "error" in data) {
    throw new AuthApiError(
      "error" in data ? data.error : "Failed to verify email.",
      { attemptsLeft: "attemptsLeft" in data ? data.attemptsLeft : undefined },
    );
  }
  return data.user;
}

export async function resendVerification(email: string): Promise<void> {
  const res = await fetch("/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = (await res.json()) as MessageApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error(
      "error" in data ? data.error : "Failed to resend verification code.",
    );
  }
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = (await res.json()) as MessageApiResponse;
  if (!res.ok || "error" in data) {
    throw new Error(
      "error" in data ? data.error : "Failed to send reset code.",
    );
  }
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword }),
  });
  const data = (await res.json()) as ResetPasswordApiResponse;
  if (!res.ok || "error" in data) {
    throw new AuthApiError(
      "error" in data ? data.error : "Failed to reset password.",
      { attemptsLeft: "attemptsLeft" in data ? data.attemptsLeft : undefined },
    );
  }
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST" });
}

export async function checkAuth(): Promise<UserItem | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (res.status === 401) {
      const data = (await res.json()) as { error?: string };
      if (data.error === "Session invalid.") {
        dispatchSessionExpired();
      }
      return null;
    }
    if (!res.ok) return null;
    const data = (await res.json()) as AuthCheckResponse;
    if ("error" in data) return null;
    return data.user;
  } catch {
    return null;
  }
}
