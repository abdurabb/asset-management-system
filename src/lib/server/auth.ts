import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";

import { ACCESS_COOKIE } from "@/lib/backend/cookies";
import { verifyToken } from "@/lib/backend/handlers/jwt";
import { authenticateToken } from "@/lib/backend/middleware/auth";
import type { User } from "@/types/user";

export const getServerAuth = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const result = await authenticateToken(token);
  return result.ok ? result.auth : null;
});

export const getServerRole = cache(async (): Promise<string | null> => {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = verifyToken(token) as { role?: string };
    return payload.role || null;
  } catch {
    return null;
  }
});
