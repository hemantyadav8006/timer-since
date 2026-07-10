export const AUTH_SESSION_EXPIRED_EVENT = "auth:session-expired";

export function dispatchSessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT));
  }
}
