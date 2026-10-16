import { HomeLink, StatusCard } from "@/components/status/RouteStatus";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50">
      <StatusCard
        code="404"
        title="Page not found"
        description="That address does not match a page in AssetFlow."
        action={<HomeLink href="/" label="Go to login" />}
      />
    </main>
  );
}
