"use client";

import { useEffect } from "react";

import { HomeLink, StatusCard } from "@/components/status/RouteStatus";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-50">
      <StatusCard
        code="Error"
        title="Something went wrong"
        description="The page could not be loaded. Try again, or go back and continue from the dashboard."
        action={
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Try again
            </button>
            <HomeLink href="/" label="Go to login" />
          </div>
        }
      />
    </main>
  );
}
