import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchAssets } from "@/lib/server/prefetch";
import type { AppSearchParams } from "@/lib/server/searchParams";

import AssetsScreen from "./AssetsScreen";

export const dynamic = "force-dynamic";

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const state = await prefetchAssets(await searchParams);

  return (
    <HydrationBoundary state={state}>
      <AssetsScreen />
    </HydrationBoundary>
  );
}
