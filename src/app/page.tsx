import ECGLine from "@/app/components/ECGLine";
import TimeSinceTimer from "@/app/components/TimeSinceTimer";

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-black text-white">
      <ECGLine />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,255,136,0.08),transparent_55%)]" />
      <main className="relative z-10 flex w-full flex-1 items-center justify-center py-12">
        <TimeSinceTimer />
      </main>
    </div>
  );
}
