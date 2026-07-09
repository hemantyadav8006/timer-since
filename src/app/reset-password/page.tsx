import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import AuthLayout from "@/components/auth/AuthLayout";
import { PublicRoute } from "@/components/auth/AuthGate";

export default function ResetPasswordPage() {
  return (
    <PublicRoute>
      <AuthLayout>
        <ResetPasswordForm />
      </AuthLayout>
    </PublicRoute>
  );
}
