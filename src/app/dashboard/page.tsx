import Dashboard from "@/app/components/Dashboard";
import AppBackground from "@/components/ui/AppBackground";
import { ProtectedRoute } from "@/components/auth/AuthGate";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppBackground>
        <Dashboard />
      </AppBackground>
    </ProtectedRoute>
  );
}
