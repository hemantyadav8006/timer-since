"use client";

import { type ReactNode } from "react";
import ECGLine from "@/app/components/ECGLine";
// import FloatingGeometricShapes from "@/components/ui/FloatingGeometricShapes";

type AppBackgroundProps = {
  children: ReactNode;
  className?: string;
  showEcg?: boolean;
  showShapes?: boolean;
  centered?: boolean;
};

export default function AppBackground({
  children,
  className = "",
  showEcg = true,
  // showShapes = true,
  centered = false,
}: AppBackgroundProps) {
  // const [mounted, setMounted] = useState(false);

  // useEffect(() => {
  //   setMounted(true);
  // }, []);

  return (
    <div
      className={`relative min-h-dvh overflow-hidden bg-app-bg text-app-fg ${
        centered
          ? "flex flex-col items-center justify-center"
          : "flex flex-col"
      } ${className}`}
    >
      {showEcg && <ECGLine />}
      {/* {showShapes && <FloatingGeometricShapes mounted={mounted} />} */}
      <div className="pointer-events-none absolute inset-0 bg-auth-mesh" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 18%, var(--app-accent-glow), transparent 58%)",
        }}
      />
      {children}
    </div>
  );
}
