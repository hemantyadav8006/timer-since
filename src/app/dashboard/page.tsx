import ECGLine from "@/app/components/ECGLine";
import Dashboard from "@/app/components/Dashboard";
import { ProtectedRoute } from "@/components/auth/AuthGate";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="relative flex min-h-dvh flex-col overflow-hidden bg-app-bg text-app-fg">
        <ECGLine />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 20%, var(--app-accent-glow), transparent 55%)",
          }}
        />
        <Dashboard />
      </div>
    </ProtectedRoute>
  );
}
