import { HomeLink, StatusCard } from "@/components/status/RouteStatus";

export default function ProtectedNotFound() {
  return (
    <StatusCard
      code="404"
      title="Page not found"
      description="That page is not part of the asset workspace."
      action={<HomeLink />}
    />
  );
}
