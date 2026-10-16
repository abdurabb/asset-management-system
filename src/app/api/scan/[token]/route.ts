import { NextRequest } from "next/server";
import { getAssetByQrTokenController } from "@/lib/backend/controller/assetController";

type RouteContext = { params: Promise<{ token: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  const { token } = await context.params;
  return getAssetByQrTokenController(req, {
    params: Promise.resolve({ id: token }),
  });
}
