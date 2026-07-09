"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/app/providers/ThemeProvider";
import { forgotPassword } from "@/lib/api/auth";
import { AuthCard } from "@/components/auth/AuthLayout";
import ErrorBanner from "@/components/ui/ErrorBanner";

export default function ForgotPasswordForm() {
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code.");
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
            🔑
          </motion.div>
          <h1 className="mb-1 text-xl font-bold text-app-fg md:text-2xl">
            Forgot password?
          </h1>
          <p className="text-sm text-app-muted">
            Enter your email and we&apos;ll send a reset code
          </p>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-5 text-center"
            >
              <p className="text-sm text-app-muted">
                If an account exists for{" "}
                <span className="font-medium text-app-fg">{email}</span>, a
                6-digit code was sent.
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  router.push(
                    `/reset-password?email=${encodeURIComponent(email)}`,
                  )
                }
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-black"
                style={{
                  backgroundColor: theme.primary,
                  boxShadow: `0 0 20px ${theme.glow}`,
                }}
              >
                Enter reset code
              </motion.button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-xs text-app-muted">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="auth-input"
                  autoComplete="email"
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
                {loading ? "Sending..." : "Send reset code"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        <Link
          href="/login"
          className="mt-5 block text-center text-xs text-app-muted transition hover:text-app-fg"
        >
          Back to login
        </Link>
      </motion.div>
    </AuthCard>
  );
}
