import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchDocuments } from "@/lib/server/prefetch";
import type { AppSearchParams } from "@/lib/server/searchParams";

import DocumentsScreen from "./DocumentsScreen";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<AppSearchParams>;
}) {
  const state = await prefetchDocuments(await searchParams);

  return (
    <HydrationBoundary state={state}>
      <DocumentsScreen />
    </HydrationBoundary>
  );
}
