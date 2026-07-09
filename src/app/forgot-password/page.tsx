import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import AuthLayout from "@/components/auth/AuthLayout";
import { PublicRoute } from "@/components/auth/AuthGate";

export default function ForgotPasswordPage() {
  return (
    <PublicRoute>
      <AuthLayout>
        <ForgotPasswordForm />
      </AuthLayout>
    </PublicRoute>
  );
}
