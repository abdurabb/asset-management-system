import { HydrationBoundary } from "@tanstack/react-query";

import { prefetchSettings } from "@/lib/server/prefetch";

import SettingsScreen from "./SettingsScreen";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const state = await prefetchSettings();

  return (
    <HydrationBoundary state={state}>
      <SettingsScreen />
    </HydrationBoundary>
  );
}
