import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/backend/cookies";

export async function POST() {
  return clearAuthCookies(NextResponse.json({ success: true }));
}
