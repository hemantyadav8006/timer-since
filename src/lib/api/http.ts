import { dispatchSessionExpired } from "@/lib/auth-events";

export const SESSION_EXPIRED_MESSAGE =
  "Session expired. Please log in again.";

type ApiErrorBody = { error?: string };

export function isSessionExpiredError(err: unknown): boolean {
  return err instanceof Error && err.message === SESSION_EXPIRED_MESSAGE;
}

export function handleAuthFailure(res: Response) {
  if (res.status === 401) {
    dispatchSessionExpired();
    throw new Error(SESSION_EXPIRED_MESSAGE);
  }
}

export function assertSuccess<T>(
  res: Response,
  data: T,
  fallback: string,
) {
  handleAuthFailure(res);
  if (
    !res.ok ||
    (typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as ApiErrorBody).error === "string")
  ) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as ApiErrorBody).error === "string"
        ? (data as ApiErrorBody).error
        : fallback;
    throw new Error(message ?? fallback);
  }
}
