"use client";

import { useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useTheme } from "@/app/providers/ThemeProvider";
import ModalBackdrop from "@/components/ui/ModalBackdrop";
import ErrorBanner from "@/components/ui/ErrorBanner";

type AuthModalProps = { open: boolean; onClose: () => void };

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const { theme } = useTheme();
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
      onClose();
      setEmail(""); setPassword(""); setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally { setLoading(false); }
  }

  return (
    <ModalBackdrop open={open} onClose={onClose} maxWidth="max-w-sm">
      <h2 className="mb-5 text-center text-lg font-bold text-white/90">
        {isLogin ? "Log In" : "Create Account"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label className="mb-1 block text-xs text-white/50">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required={!isLogin} className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25" autoComplete="name" />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-white/50">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25" autoComplete="email" />
        </div>
        <div>
          <label className="mb-1 block text-xs text-white/50">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white outline-none focus:border-white/25" autoComplete={isLogin ? "current-password" : "new-password"} />
        </div>
        <ErrorBanner message={error} onDismiss={() => setError(null)} />
        <button type="submit" disabled={loading} className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-black transition disabled:opacity-50" style={{ backgroundColor: theme.primary, boxShadow: `0 0 20px ${theme.glow}` }}>
          {loading ? "..." : isLogin ? "Log In" : "Sign Up"}
        </button>
      </form>
      <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }} className="mt-4 w-full text-center text-xs text-white/45 hover:text-white/70">
        {isLogin ? "Don't have an account?" : "Already have an account?"}
      </button>
    </ModalBackdrop>
  );
}
