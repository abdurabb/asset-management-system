import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchAssignments } from "@/lib/server/prefetch";
import type { AppSearchParams } from "@/lib/server/searchParams";

import AssignmentsScreen from "./AssignmentsScreen";

export const dynamic = "force-dynamic";

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const state = await prefetchAssignments(await searchParams);

  return (
    <HydrationBoundary state={state}>
      <AssignmentsScreen />
    </HydrationBoundary>
  );
}
