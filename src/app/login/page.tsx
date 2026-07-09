import { Suspense } from "react";
import ECGLine from "@/app/components/ECGLine";
import LoginForm from "@/components/auth/LoginForm";
import { PublicRoute, AuthLoadingScreen } from "@/components/auth/AuthGate";

export default function LoginPage() {
  return (
    <PublicRoute>
      <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-app-bg px-4 text-app-fg">
        <ECGLine />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 20%, var(--app-accent-glow), transparent 55%)",
          }}
        />
        <div className="relative z-10 flex w-full max-w-md justify-center">
          <Suspense fallback={<AuthLoadingScreen />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </PublicRoute>
  );
}
