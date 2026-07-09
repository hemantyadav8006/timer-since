"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/providers/AuthProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import { DASHBOARD_PATH } from "@/lib/auth-routes";
import { AuthApiError, resendVerification } from "@/lib/api/auth";
import { AuthCard } from "@/components/auth/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";
import ErrorBanner from "@/components/ui/ErrorBanner";

function safeRedirectPath(from: string | null): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return DASHBOARD_PATH;
  }
  if (from === "/login") return DASHBOARD_PATH;
  return from;
}

export default function VerifyEmailForm() {
  const { verifyEmail } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";

  const [email] = useState(emailParam);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = useCallback(async () => {
    if (!email || resendCooldown > 0) return;
    setError(null);
    try {
      await resendVerification(email);
      setResent(true);
      setResendCooldown(60);
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    }
  }, [email, resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Email is missing. Please sign up again.");
      return;
    }
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await verifyEmail(email, code);
      const destination = safeRedirectPath(searchParams.get("from"));
      router.replace(destination);
    } catch (err) {
      if (err instanceof AuthApiError && err.attemptsLeft !== undefined) {
        setError(`${err.message} (${err.attemptsLeft} attempts left)`);
      } else {
        setError(err instanceof Error ? err.message : "Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="mb-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.15 }}
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl"
            style={{
              backgroundColor: `${theme.primary}22`,
              boxShadow: `0 0 24px ${theme.glow}`,
            }}
          >
            ✉️
          </motion.div>
          <h1 className="mb-1 text-xl font-bold text-app-fg md:text-2xl">
            Check your email
          </h1>
          <p className="text-sm text-app-muted">
            We sent a 6-digit code to
          </p>
          {email && (
            <p className="mt-1 text-sm font-medium text-app-fg">{email}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <OtpInput value={code} onChange={setCode} disabled={loading} />

          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          <AnimatePresence>
            {resent && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-center text-xs text-emerald-400"
              >
                New code sent!
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading || code.length !== 6}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-black transition disabled:opacity-50"
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 0 20px ${theme.glow}`,
            }}
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </motion.button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2 text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || !email}
            className="text-xs text-app-muted transition hover:text-app-fg disabled:opacity-50"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Didn't get it? Resend code"}
          </button>
          <Link
            href="/login"
            className="text-xs text-app-muted transition hover:text-app-fg"
          >
            Back to login
          </Link>
        </div>
      </motion.div>
    </AuthCard>
  );
}
