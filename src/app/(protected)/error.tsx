"use client";

import { useEffect } from "react";

import { HomeLink, StatusCard } from "@/components/status/RouteStatus";

export default function ProtectedError({
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
    <StatusCard
      code="Error"
      title="This page failed to load"
      description="The data for this screen could not be read. Retry the request, or return to the dashboard."
      action={
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => retry()}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Try again
          </button>
          <HomeLink />
        </div>
      }
    />
  );
}
