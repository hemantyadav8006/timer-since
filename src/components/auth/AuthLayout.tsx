"use client";

import { Suspense, type ReactNode } from "react";
import { motion } from "framer-motion";
import AppBackground from "@/components/ui/AppBackground";
import { AuthLoadingScreen } from "@/components/auth/AuthGate";

type AuthLayoutProps = {
  children: ReactNode;
};

function AuthLayoutInner({ children }: AuthLayoutProps) {
  return (
    <AppBackground centered className="px-4">
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex w-full max-w-md justify-center py-8"
      >
        {children}
      </motion.div>
    </AppBackground>
  );
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Suspense fallback={<AuthLoadingScreen />}>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Suspense>
  );
}

export function AuthCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      layout
      className={`auth-card-glow w-full rounded-2xl border border-app-border/80 bg-app-surface/85 p-5 backdrop-blur-xl md:p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}
