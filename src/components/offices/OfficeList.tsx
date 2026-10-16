"use client";

import { Suspense, useState } from "react";
import { Edit, MapPin, Trash2 } from "lucide-react";

import Pagination from "@/components/ui/Pagination";
import SearchField from "@/components/ui/SearchField";
import { useDeleteOffice, useOfficeDirectory } from "@/hooks/useOffice";
import { useConfirm } from "@/hooks/useConfirm";
import { LIST_PAGE_SIZE } from "@/hooks/usePagedList";
import { useDebouncedSearch, useUrlFilters } from "@/hooks/useUrlFilters";
import { iconButton, selectClass } from "@/lib/ui";

import OfficeForm from "./OfficeForm";

export default function OfficeList() {
  return (
    <Suspense
      fallback={
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-800">
          Loading offices...
        </div>
      }
    >
      <OfficeListContent />
    </Suspense>
  );
}

function OfficeListContent() {
  const { get, page, setFilters } = useUrlFilters();
  const { value: search, setValue: setSearch } = useDebouncedSearch();
  const active = get("active");
  const { data, isLoading, isError } = useOfficeDirectory({
    search: get("search") || undefined,
    page,
    limit: LIST_PAGE_SIZE,
    isActive: active === "" ? undefined : active === "true",
  });

  const deleteOffice = useDeleteOffice();
  const { confirm, dialog } = useConfirm();
  const [editingOffice, setEditingOffice] = useState<any>(null);
  const offices = data?.items ?? [];

  const handleDelete = (office: { id: string; name: string }) => {
    void confirm({
      title: "Delete this office?",
      description: `${office.name} will be marked inactive. Its records stay in place.`,
      confirmLabel: "Delete office",
      action: () => deleteOffice.mutateAsync(office.id),
    });
  };

  return (
    <>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search offices..."
        />
        <select
          value={active}
          onChange={(event) => setFilters({ active: event.target.value })}
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="">All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-800">
          Loading offices...
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">
          Failed to load offices.
        </div>
      )}

      {!isLoading && !isError && offices.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <MapPin size={40} className="mx-auto text-slate-500" />
          <h3 className="mt-4 text-sm font-semibold text-slate-800">No offices found</h3>
          <p className="mt-1 text-sm text-slate-800">
            Create your first office to get started.
          </p>
        </div>
      )}

      {offices.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="space-y-3 p-3 md:hidden">
            {offices.map((office) => (
              <article key={office.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{office.name}</p>
                    {office.phone && <p className="text-xs text-slate-700">{office.phone}</p>}
                  </div>
                  <OfficeStatus active={office.isActive} />
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-600">Code</dt>
                    <dd className="mt-0.5 font-mono text-xs text-slate-900">{office.code}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-600">Location</dt>
                    <dd className="mt-0.5 text-slate-800">
                      {[office.city, office.country].filter(Boolean).join(", ") || "-"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-3">
                  <OfficeActions
                    onEdit={() => setEditingOffice(office)}
                    onDelete={() => handleDelete(office)}
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[680px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Office
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Code
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Location
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offices.map((office) => (
                  <tr key={office.id} className="transition hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">{office.name}</p>
                      {office.phone && (
                        <p className="mt-0.5 text-xs text-slate-800">{office.phone}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-800">
                        {office.code}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-slate-800">
                        <MapPin size={15} className="shrink-0 text-slate-800" />
                        <span>
                          {[office.city, office.country].filter(Boolean).join(", ") || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <OfficeStatus active={office.isActive} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <OfficeActions
                          onEdit={() => setEditingOffice(office)}
                          onDelete={() => handleDelete(office)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            pagination={data?.pagination}
            onPage={(next) => setFilters({ page: next <= 1 ? null : next })}
          />
        </div>
      )}

      {editingOffice && (
        <OfficeForm office={editingOffice} onClose={() => setEditingOffice(null)} />
      )}
      {dialog}
    </>
  );
}

function OfficeStatus({ active }: { active: boolean }) {
  return active ? (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      Active
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
      Inactive
    </span>
  );
}

function OfficeActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <button
        onClick={onEdit}
        className={`${iconButton} hover:bg-blue-50 hover:text-blue-600`}
        aria-label="Edit office"
      >
        <Edit size={17} />
      </button>
      <button
        onClick={onDelete}
        className={`${iconButton} hover:bg-red-50 hover:text-red-600`}
        aria-label="Delete office"
      >
        <Trash2 size={17} />
      </button>
    </>
  );
}
