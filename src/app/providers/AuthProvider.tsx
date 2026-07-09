"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { UserItem } from "@/types/timer";
import * as authApi from "@/lib/api/auth";
import { AUTH_SESSION_EXPIRED_EVENT } from "@/lib/auth-events";
import { LOGIN_PATH } from "@/lib/auth-routes";
import { useTheme } from "@/app/providers/ThemeProvider";
import { registerNotificationServiceWorker } from "@/lib/notifications";

type AuthContextValue = {
  user: UserItem | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<authApi.RegisterResult>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => ({ type: "needsVerification", email: "" }),
  verifyEmail: async () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { applyUserPreferences } = useTheme();
  const [user, setUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
  }, []);

  const applyUser = useCallback(
    (u: UserItem | null) => {
      setUser(u);
      if (u?.preferences) applyUserPreferences(u.preferences);
    },
    [applyUserPreferences],
  );

  useEffect(() => {
    registerNotificationServiceWorker();
    authApi
      .checkAuth()
      .then(applyUser)
      .finally(() => setLoading(false));
  }, [applyUser]);

  useEffect(() => {
    function onSessionExpired() {
      clearSession();
      router.replace(LOGIN_PATH);
    }

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired);
    return () =>
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, onSessionExpired);
  }, [clearSession, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const u = await authApi.login(email, password);
      applyUser(u);
    },
    [applyUser],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const result = await authApi.register(email, password, name);
      if (result.type === "verified") {
        applyUser(result.user);
      }
      return result;
    },
    [applyUser],
  );

  const verifyEmail = useCallback(
    async (email: string, code: string) => {
      const u = await authApi.verifyEmail(email, code);
      applyUser(u);
    },
    [applyUser],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    clearSession();
    router.replace(LOGIN_PATH);
  }, [clearSession, router]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, verifyEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
