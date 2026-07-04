import ECGLine from "@/app/components/ECGLine";
import Dashboard from "@/app/components/Dashboard";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-black text-white">
      <ECGLine />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,255,136,0.08),transparent_55%)]" />
      <Dashboard />
    </div>
  );
}
