"use client";

import { Suspense, type ReactNode } from "react";
import { motion } from "framer-motion";
import ECGLine from "@/app/components/ECGLine";
import { AuthLoadingScreen } from "@/components/auth/AuthGate";

type AuthLayoutProps = {
  children: ReactNode;
};

function AuthLayoutInner({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-app-bg px-4 text-app-fg">
      <ECGLine />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 20%, var(--app-accent-glow), transparent 55%)",
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex w-full max-w-md justify-center"
      >
        {children}
      </motion.div>
    </div>
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
      className={`w-full rounded-2xl border border-app-border bg-app-surface/90 p-5 shadow-2xl shadow-black/20 backdrop-blur-md md:p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
}
