"use client";

import { Suspense } from "react";

import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchField from "@/components/ui/SearchField";
import { LIST_PAGE_SIZE, usePagedList } from "@/hooks/usePagedList";
import { useDebouncedSearch, useUrlFilters } from "@/hooks/useUrlFilters";
import { pageWrap } from "@/lib/ui";
import type { AuditLogItem } from "@/types/asset";

export default function AuditLogsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-800">Loading audit logs...</div>}>
      <AuditLogsContent />
    </Suspense>
  );
}

function AuditLogsContent() {
  const { get, page, setFilters } = useUrlFilters();
  const { value: search, setValue: setSearch } = useDebouncedSearch();
  const { data, isLoading, isError } = usePagedList<AuditLogItem>("audit-logs", "/audit-logs", {
    search: get("search") || undefined,
    page,
    limit: LIST_PAGE_SIZE,
  });
  const logs = data?.items ?? [];

  return (
    <div className={pageWrap}>
      <PageHeader
        title="Audit Logs"
        description="Track important changes across the system."
      />

      <div className="mb-4">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search by record id or details..."
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading && <p className="px-5 py-8 text-center text-sm text-slate-800">Loading...</p>}
        {isError && (
          <p className="px-5 py-8 text-center text-sm text-red-600">Failed to load audit logs.</p>
        )}
        {!isLoading && !isError && logs.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-800">No audit logs found.</p>
        )}

        {logs.length > 0 && (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {logs.map((log) => (
                <article key={log.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">{log.action}</p>
                  <p className="mt-1 text-sm text-slate-800">
                    {log.entityType}
                    <span className="ml-2 font-mono text-xs">{log.entityId.slice(0, 8)}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-700">
                    <span>{log.user?.name || "System"}</span>
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px]">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Action</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Entity</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">User</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-5 py-4 text-sm font-medium text-slate-800">{log.action}</td>
                      <td className="px-5 py-4 text-sm text-slate-800">
                        {log.entityType}
                        <span className="ml-2 font-mono text-xs text-slate-800">
                          {log.entityId.slice(0, 8)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-800">{log.user?.name || "System"}</td>
                      <td className="px-5 py-4 text-sm text-slate-800">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <Pagination
          pagination={data?.pagination}
          onPage={(next) => setFilters({ page: next <= 1 ? null : next })}
        />
      </div>
    </div>
  );
}
