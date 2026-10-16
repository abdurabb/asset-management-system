"use client";

import AuthGuard from "@/guards/AuthGuard";
import SessionBridge from "@/components/SessionBridge";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { useAppSelector } from "@/redux/hooks";

export default function ProtectedShell({
  children,
  initialRole,
}: {
  children: React.ReactNode;
  initialRole: string | null;
}) {
  const collapsed = useAppSelector((state) => state.layout.sidebarCollapsed);

  return (
    <AuthGuard>
      <SessionBridge />
      <div className="min-h-dvh bg-slate-50">
        <Sidebar initialRole={initialRole} />

        <div
          className={`min-w-0 transition-[margin] duration-300 ${
            collapsed ? "lg:ml-[76px]" : "lg:ml-64"
          }`}
        >
          <Navbar />

          <main className="min-h-[calc(100dvh-4rem)] pt-16 pb-[env(safe-area-inset-bottom)]">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
