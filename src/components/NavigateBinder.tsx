"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { setNavigate } from "@/lib/navigation";

export default function NavigateBinder() {
  const router = useRouter();

  useEffect(() => {
    setNavigate((path) => router.push(path));
  }, [router]);

  return null;
}
