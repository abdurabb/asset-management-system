"use client";

import { useEffect, useRef } from "react";

import { useAppSelector } from "@/redux/hooks";

export default function SessionBridge() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const refreshToken = useAppSelector((state) => state.auth.refreshToken);
  const synced = useRef<string | null>(null);

  useEffect(() => {
    if (!accessToken || synced.current === accessToken) return;
    synced.current = accessToken;

    void fetch("/api/auth/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  }, [accessToken, refreshToken]);

  return null;
}
