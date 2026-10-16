import { NextRequest, NextResponse } from "next/server";

import { applyAuthCookies } from "@/lib/backend/cookies";
import { withAuth } from "@/lib/backend/middleware/auth";

export const POST = withAuth(async (req: NextRequest) => {
  const header = req.headers.get("authorization") || "";
  const accessToken = header.startsWith("Bearer ") ? header.substring(7) : "";

  if (!accessToken) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    refresh_token?: string;
  };
  const refreshToken =
    typeof body.refresh_token === "string" ? body.refresh_token : undefined;

  return applyAuthCookies(
    NextResponse.json({ success: true }),
    accessToken,
    refreshToken,
  );
});
