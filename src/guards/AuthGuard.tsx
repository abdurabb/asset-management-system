"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAppSelector } from "@/redux/hooks";

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const rehydrated = useAppSelector((state) => {
    const persist = (state.auth as { _persist?: { rehydrated?: boolean } })._persist;
    return Boolean(persist?.rehydrated);
  });

  useEffect(() => {
    if (rehydrated && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, rehydrated, router]);

  if (rehydrated && !isAuthenticated) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50">
        <p className="text-sm font-semibold text-slate-800">Redirecting to login...</p>
      </main>
    );
  }

  return <>{children}</>;
}
