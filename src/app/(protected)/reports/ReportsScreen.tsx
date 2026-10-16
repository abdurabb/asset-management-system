"use client";

import { useReports } from "@/hooks/useDomain";

export default function ReportsPage() {
  const { data, isLoading, isError } = useReports();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Reports</h1>
        <p className="mt-1 text-sm text-slate-800">
          Asset distribution by status, office, and category.
        </p>
      </div>

      {isLoading && <p className="text-sm text-slate-800">Loading reports...</p>}
      {isError && <p className="text-sm text-red-600">Failed to load reports.</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ReportCard title="By Status" rows={data?.byStatus?.map((r: any) => ({
          label: r.status,
          count: r.count,
        }))} />
        <ReportCard title="By Office" rows={data?.byOffice?.map((r: any) => ({
          label: r.office?.name || r.officeId,
          count: r.count,
        }))} />
        <ReportCard title="By Category" rows={data?.byCategory?.map((r: any) => ({
          label: r.category?.name || "Uncategorized",
          count: r.count,
        }))} />
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">Recent assignments</h2>
        <div className="space-y-3">
          {data?.recentAssignments?.map((item: any) => (
            <div
              key={item.id}
              className="flex flex-col gap-1 border-b border-slate-100 pb-3 text-sm last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-slate-800">
                  {item.asset?.name} → {item.user?.name}
                </p>
                <p className="text-xs text-slate-800">{item.office?.name}</p>
              </div>
              <p className="text-xs text-slate-800">
                {new Date(item.assignedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
          {!data?.recentAssignments?.length && (
            <p className="text-sm text-slate-800">No assignments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  title,
  rows,
}: {
  title: string;
  rows?: Array<{ label: string; count: number }>;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-800">{title}</h2>
      <div className="space-y-3">
        {rows?.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-sm">
            <span className="text-slate-800">{row.label}</span>
            <span className="font-semibold text-slate-900">{row.count}</span>
          </div>
        ))}
        {!rows?.length && <p className="text-sm text-slate-800">No data</p>}
      </div>
    </div>
  );
}
