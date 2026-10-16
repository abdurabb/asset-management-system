import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchDashboard } from "@/lib/server/prefetch";

import DashboardScreen from "./DashboardScreen";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const state = await prefetchDashboard();

  return (
    <HydrationBoundary state={state}>
      <DashboardScreen />
    </HydrationBoundary>
  );
}
