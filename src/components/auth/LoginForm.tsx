"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import { DASHBOARD_PATH } from "@/lib/auth-routes";
import ErrorBanner from "@/components/ui/ErrorBanner";

function safeRedirectPath(from: string | null): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return DASHBOARD_PATH;
  }
  if (from === "/login") return DASHBOARD_PATH;
  return from;
}

export default function LoginForm() {
  const { login, register } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isLogin) await login(email, password);
      else await register(email, password, name);
      const destination = safeRedirectPath(searchParams.get("from"));
      router.replace(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-md sm:p-8">
      <h1 className="mb-1 text-center text-2xl font-bold text-white/90">
        Time Since
      </h1>
      <p className="mb-6 text-center text-sm text-white/45">
        {isLogin ? "Sign in to manage your timers" : "Create your account"}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="mb-1 block text-xs text-white/50">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={!isLogin}
              className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25"
              autoComplete="name"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-white/50">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25"
            autoComplete="email"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25"
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </div>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-black transition disabled:opacity-50"
          style={{
            backgroundColor: theme.primary,
            boxShadow: `0 0 20px ${theme.glow}`,
          }}
        >
          {loading ? "..." : isLogin ? "Log In" : "Sign Up"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setIsLogin(!isLogin);
          setError(null);
        }}
        className="mt-4 w-full text-center text-xs text-white/45 hover:text-white/70"
      >
        {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
