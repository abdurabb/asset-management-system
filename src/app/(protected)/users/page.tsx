import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchUsers } from "@/lib/server/prefetch";
import type { AppSearchParams } from "@/lib/server/searchParams";

import UsersScreen from "./UsersScreen";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const state = await prefetchUsers(await searchParams);

  return (
    <HydrationBoundary state={state}>
      <UsersScreen />
    </HydrationBoundary>
  );
}
