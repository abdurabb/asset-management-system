import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchCategories } from "@/lib/server/prefetch";
import type { AppSearchParams } from "@/lib/server/searchParams";

import CategoriesScreen from "./CategoriesScreen";

export const dynamic = "force-dynamic";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const state = await prefetchCategories(await searchParams);

  return (
    <HydrationBoundary state={state}>
      <CategoriesScreen />
    </HydrationBoundary>
  );
}
