import { Package } from "lucide-react";
import { NextRequest } from "next/server";

import { getAssetByQrTokenController } from "@/lib/backend/controller/assetController";
import type { Asset } from "@/types/asset";

export const dynamic = "force-dynamic";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const response = await getAssetByQrTokenController(
    new NextRequest("http://assetflow.internal/api/scan/" + token),
    { params: Promise.resolve({ id: token }) },
  );
  const json = (await response.json()) as {
    success?: boolean;
    data?: Asset;
  };
  const data = response.ok && json.success ? json.data : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Package size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">AssetFlow</p>
            <p className="text-xs text-slate-800">Asset scan result</p>
          </div>
        </div>

        {!data && (
          <p className="text-sm text-red-600">
            Asset not found or QR code is invalid.
          </p>
        )}

        {data && (
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{data.name}</h1>
              <p className="mt-1 font-mono text-sm text-slate-800">{data.assetTag}</p>
            </div>
            <dl className="grid grid-cols-1 gap-4 text-sm min-[420px]:grid-cols-2">
              <div>
                <dt className="text-slate-800">Status</dt>
                <dd className="font-medium text-slate-800">{data.status}</dd>
              </div>
              <div>
                <dt className="text-slate-800">Office</dt>
                <dd className="font-medium text-slate-800">{data.office?.name || "-"}</dd>
              </div>
              <div>
                <dt className="text-slate-800">Category</dt>
                <dd className="font-medium text-slate-800">
                  {data.category?.name || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-800">Location</dt>
                <dd className="font-medium text-slate-800">{data.location || "-"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-800">Assigned to</dt>
                <dd className="font-medium text-slate-800">
                  {data.assignments?.[0]?.user?.name || "Not assigned"}
                </dd>
              </div>
              {data.description && (
                <div className="col-span-2">
                  <dt className="text-slate-800">Description</dt>
                  <dd className="font-medium text-slate-800">{data.description}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </main>
  );
}
