"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/app/providers/AuthProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import AppBackground from "@/components/ui/AppBackground";
import { DASHBOARD_PATH, LOGIN_PATH } from "@/lib/auth-routes";

export function AuthLoadingScreen() {
  const { theme } = useTheme();

  return (
    <AppBackground centered>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 flex flex-col items-center gap-5 px-4"
      >
        <div className="relative">
          <motion.div
            className="h-14 w-14 rounded-2xl border border-app-border"
            style={{
              backgroundColor: `${theme.primary}18`,
              boxShadow: `0 0 32px ${theme.glow}`,
            }}
            animate={{ rotate: [0, 180, 360] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-2 rounded-xl border-2 border-t-transparent"
            style={{ borderColor: theme.primary }}
            animate={{ rotate: [360, 180, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-app-fg">Time Since</p>
          <p className="mt-1 text-xs text-app-muted">Checking session...</p>
        </div>
      </motion.div>
    </AppBackground>
  );
}

type AuthGateProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(LOGIN_PATH);
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <AuthLoadingScreen />;
  }

  return children;
}

export function PublicRoute({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(DASHBOARD_PATH);
    }
  }, [loading, user, router]);

  if (loading || user) {
    return <AuthLoadingScreen />;
  }

  return children;
}
