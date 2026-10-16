import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchOffices } from "@/lib/server/prefetch";
import type { AppSearchParams } from "@/lib/server/searchParams";

import OfficesScreen from "./OfficesScreen";

export const dynamic = "force-dynamic";

export default async function OfficesPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const state = await prefetchOffices(await searchParams);

  return (
    <HydrationBoundary state={state}>
      <OfficesScreen />
    </HydrationBoundary>
  );
}
