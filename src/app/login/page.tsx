import { Suspense } from "react";
import ECGLine from "@/app/components/ECGLine";
import LoginForm from "@/components/auth/LoginForm";
import { PublicRoute, AuthLoadingScreen } from "@/components/auth/AuthGate";

export default function LoginPage() {
  return (
    <PublicRoute>
      <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-black px-4 text-white">
        <ECGLine />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,255,136,0.08),transparent_55%)]" />
        <div className="relative z-10 w-full flex justify-center">
          <Suspense fallback={<AuthLoadingScreen />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </PublicRoute>
  );
}
