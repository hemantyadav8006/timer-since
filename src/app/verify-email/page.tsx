import VerifyEmailForm from "@/components/auth/VerifyEmailForm";
import AuthLayout from "@/components/auth/AuthLayout";
import { PublicRoute } from "@/components/auth/AuthGate";

export default function VerifyEmailPage() {
  return (
    <PublicRoute>
      <AuthLayout>
        <VerifyEmailForm />
      </AuthLayout>
    </PublicRoute>
  );
}
