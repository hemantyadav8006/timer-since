import LoginForm from "@/components/auth/LoginForm";
import AuthLayout from "@/components/auth/AuthLayout";
import { PublicRoute } from "@/components/auth/AuthGate";

export default function LoginPage() {
  return (
    <PublicRoute>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </PublicRoute>
  );
}
