import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchMaintenance } from "@/lib/server/prefetch";
import type { AppSearchParams } from "@/lib/server/searchParams";

import MaintenanceScreen from "./MaintenanceScreen";

export const dynamic = "force-dynamic";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const state = await prefetchMaintenance(await searchParams);

  return (
    <HydrationBoundary state={state}>
      <MaintenanceScreen />
    </HydrationBoundary>
  );
}
