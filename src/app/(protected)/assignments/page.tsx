"use client";

import { Suspense, useState } from "react";
import { useSelector } from "react-redux";
import { Plus, Undo2, X } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchField from "@/components/ui/SearchField";
import {
  useAssets,
  useCreateAssignment,
  useReturnAssignment,
  useUsers,
} from "@/hooks/useDomain";
import { useConfirm } from "@/hooks/useConfirm";
import { LIST_PAGE_SIZE, usePagedList } from "@/hooks/usePagedList";
import { useDebouncedSearch, useUrlFilters } from "@/hooks/useUrlFilters";
import {
  iconButton,
  modalOverlay,
  modalPanel,
  pageWrap,
  primaryButton,
  selectClass,
} from "@/lib/ui";
import type { RootState } from "@/redux/store";
import type { Assignment } from "@/types/asset";

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-800">Loading assignments...</div>}>
      <AssignmentsContent />
    </Suspense>
  );
}

function AssignmentsContent() {
  const { get, page, setFilters } = useUrlFilters();
  const { value: search, setValue: setSearch } = useDebouncedSearch();
  const active = get("active");
  const role = useSelector((state: RootState) => state.auth.role);
  const canManage = role === "SUPER_ADMIN" || role === "MANAGER" || role === "ADMIN";
  const { data, isLoading } = usePagedList<Assignment>("assignments", "/assignments", {
    search: get("search") || undefined,
    isActive: active === "" ? undefined : active === "true",
    page,
    limit: LIST_PAGE_SIZE,
  });
  const { data: assets } = useAssets({ status: "AVAILABLE", limit: 100 });
  const { data: users } = useUsers(canManage ? { limit: 100, role: "USER" } : undefined);
  const createAssignment = useCreateAssignment();
  const returnAssignment = useReturnAssignment();
  const { confirm, dialog } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ assetId: "", userId: "", notes: "" });
  const assignments = data?.items ?? [];

  const returnAsset = (item: Assignment) => {
    void confirm({
      title: "Return this asset?",
      description: `${item.asset?.name || "This asset"} will be checked back in and marked available.`,
      confirmLabel: "Return asset",
      tone: "primary",
      action: () => returnAssignment.mutateAsync(item.id),
    });
  };

  return (
    <div className={pageWrap}>
      <PageHeader
        title="Assignments"
        description="Check assets in and out to employees."
        action={
          canManage ? (
            <button onClick={() => setShowForm(true)} className={primaryButton}>
              <Plus size={18} />
              Assign Asset
            </button>
          ) : undefined
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search asset, tag, or employee..."
        />
        <select
          value={active}
          onChange={(event) => setFilters({ active: event.target.value })}
          className={selectClass}
          aria-label="Filter by assignment status"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Returned</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading && (
          <p className="px-5 py-8 text-center text-sm text-slate-800">Loading...</p>
        )}
        {!isLoading && assignments.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-slate-800">No assignments yet.</p>
        )}

        {assignments.length > 0 && (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {assignments.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.asset?.name}</p>
                      <p className="font-mono text-xs text-slate-700">{item.asset?.assetTag}</p>
                    </div>
                    <StatusPill active={item.isActive} />
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-slate-600">Employee</dt>
                      <dd className="mt-0.5 text-slate-800">{item.user?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-600">Assigned</dt>
                      <dd className="mt-0.5 text-slate-800">
                        {new Date(item.assignedAt).toLocaleDateString()}
                      </dd>
                    </div>
                  </dl>
                  {canManage && item.isActive && (
                    <button
                      onClick={() => returnAsset(item)}
                      className="mt-3 inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm text-slate-800 hover:bg-slate-100"
                    >
                      <Undo2 size={15} />
                      Return
                    </button>
                  )}
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[680px]">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Asset</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Assigned</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Status</th>
                    {canManage && (
                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-800">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">{item.asset?.name}</p>
                        <p className="font-mono text-xs text-slate-800">{item.asset?.assetTag}</p>
                      </td>
                      <td className="px-5 py-4 text-sm">{item.user?.name}</td>
                      <td className="px-5 py-4 text-sm text-slate-800">
                        {new Date(item.assignedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <StatusPill active={item.isActive} />
                      </td>
                      {canManage && (
                        <td className="px-5 py-4 text-right">
                          {item.isActive && (
                            <button
                              onClick={() => returnAsset(item)}
                              className="inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm text-slate-800 hover:bg-slate-100"
                            >
                              <Undo2 size={15} />
                              Return
                            </button>
                          )}
                        </td>
                      )}
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

      {showForm && (
        <div className={modalOverlay}>
          <div className={`${modalPanel} p-5 sm:max-w-md sm:p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Assign Asset</h2>
              <button onClick={() => setShowForm(false)} className={iconButton} aria-label="Close">
                <X size={19} />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await createAssignment.mutateAsync(form);
                setShowForm(false);
              }}
            >
              <select
                required
                value={form.assetId}
                onChange={(event) => setForm({ ...form, assetId: event.target.value })}
                className={selectClass}
                aria-label="Asset"
              >
                <option value="">Select available asset</option>
                {assets?.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.assetTag})
                  </option>
                ))}
              </select>
              <select
                required
                value={form.userId}
                onChange={(event) => setForm({ ...form, userId: event.target.value })}
                className={selectClass}
                aria-label="Employee"
              >
                <option value="">Select employee</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="Notes"
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                rows={3}
              />
              <button type="submit" className={`${primaryButton} w-full sm:w-full`}>
                Assign
              </button>
            </form>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-800"
      }`}
    >
      {active ? "Active" : "Returned"}
    </span>
  );
}
