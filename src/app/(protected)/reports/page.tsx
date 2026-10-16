import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchReports } from "@/lib/server/prefetch";

import ReportsScreen from "./ReportsScreen";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const state = await prefetchReports();

  return (
    <HydrationBoundary state={state}>
      <ReportsScreen />
    </HydrationBoundary>
  );
}
