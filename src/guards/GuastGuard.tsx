"use client";

import { useAppSelector } from "@/redux/hooks";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const GUEST_ONLY_PATHS = ["/", "/login"];

export default function GuestGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated && GUEST_ONLY_PATHS.includes(pathname)) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, pathname, router]);

  return <>{children}</>;
}
