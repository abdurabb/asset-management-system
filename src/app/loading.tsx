import { ContentSkeleton } from "@/components/status/RouteStatus";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-3xl">
        <ContentSkeleton />
      </div>
    </main>
  );
}
