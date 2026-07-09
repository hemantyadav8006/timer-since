"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { DASHBOARD_PATH, LOGIN_PATH } from "@/lib/auth-routes";

export function AuthLoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-black text-white/50">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#00FF88]" />
        <p className="text-sm">Checking session...</p>
      </div>
    </div>
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
