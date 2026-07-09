"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/app/providers/ThemeProvider";
import { AuthApiError, resetPassword } from "@/lib/api/auth";
import { AuthCard } from "@/components/auth/AuthLayout";
import OtpInput from "@/components/auth/OtpInput";
import ErrorBanner from "@/components/ui/ErrorBanner";

export default function ResetPasswordForm() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, code, password);
      setSuccess(true);
      setTimeout(() => router.replace("/login"), 2000);
    } catch (err) {
      if (err instanceof AuthApiError && err.attemptsLeft !== undefined) {
        setError(`${err.message} (${err.attemptsLeft} attempts left)`);
      } else {
        setError(err instanceof Error ? err.message : "Failed to reset password.");
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthCard>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
            className="mx-auto mb-4 text-5xl"
          >
            ✅
          </motion.div>
          <h1 className="mb-2 text-xl font-bold text-app-fg">
            Password updated!
          </h1>
          <p className="text-sm text-app-muted">Redirecting to login...</p>
        </motion.div>
      </AuthCard>
    );
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
            🔒
          </motion.div>
          <h1 className="mb-1 text-xl font-bold text-app-fg md:text-2xl">
            Reset password
          </h1>
          <p className="text-sm text-app-muted">
            Enter the code from your email and a new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-app-muted">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="auth-input"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-2 block text-center text-xs text-app-muted">
              Reset code
            </label>
            <OtpInput value={code} onChange={setCode} disabled={loading} />
          </div>

          <div>
            <label className="mb-1 block text-xs text-app-muted">
              New password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="auth-input"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-app-muted">
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="auth-input"
              autoComplete="new-password"
            />
          </div>

          <ErrorBanner message={error} onDismiss={() => setError(null)} />

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-black transition disabled:opacity-50"
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 0 20px ${theme.glow}`,
            }}
          >
            {loading ? "Updating..." : "Update password"}
          </motion.button>
        </form>

        <div className="mt-5 flex flex-col items-center gap-2 text-center">
          <Link
            href="/forgot-password"
            className="text-xs text-app-muted transition hover:text-app-fg"
          >
            Request a new code
          </Link>
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
