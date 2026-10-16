import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchAuditLogs } from "@/lib/server/prefetch";
import type { AppSearchParams } from "@/lib/server/searchParams";

import AuditLogsScreen from "./AuditLogsScreen";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const state = await prefetchAuditLogs(await searchParams);

  return (
    <HydrationBoundary state={state}>
      <AuditLogsScreen />
    </HydrationBoundary>
  );
}
