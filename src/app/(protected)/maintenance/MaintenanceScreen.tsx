"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Plus, Wrench, X } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchField from "@/components/ui/SearchField";
import {
  useAssets,
  useCreateMaintenance,
  useMaintenance,
  useUpdateMaintenance,
} from "@/hooks/useDomain";
import { LIST_PAGE_SIZE, usePagedList } from "@/hooks/usePagedList";
import { useDebouncedSearch, useUrlFilters } from "@/hooks/useUrlFilters";
import { MAINTENANCE_STATUSES } from "@/lib/constants/roles";
import {
  iconButton,
  modalOverlay,
  modalPanel,
  pageWrap,
  primaryButton,
  selectClass,
} from "@/lib/ui";
import type { MaintenanceRecord } from "@/types/asset";

const STATUS_OPTIONS = [
  {
    value: "SCHEDULED",
    label: "Scheduled",
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-800 ring-sky-200",
    active: "border-sky-300 bg-sky-50 text-sky-900",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-900 ring-amber-200",
    active: "border-amber-300 bg-amber-50 text-amber-950",
  },
  {
    value: "COMPLETED",
    label: "Completed",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    active: "border-emerald-300 bg-emerald-50 text-emerald-950",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
    dot: "bg-slate-400",
    chip: "bg-slate-100 text-slate-700 ring-slate-200",
    active: "border-slate-300 bg-slate-100 text-slate-900",
  },
] as const;

type MaintenanceStatus = (typeof MAINTENANCE_STATUSES)[number];
type StatusFilter = "ALL" | MaintenanceStatus;

const emptyForm = {
  assetId: "",
  title: "",
  description: "",
  performedBy: "",
};

function statusOption(value: string) {
  return STATUS_OPTIONS.find((option) => option.value === value) ?? STATUS_OPTIONS[0];
}

function StatusMenu({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (status: MaintenanceStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{
    top: number;
    left: number;
    transform?: string;
  }>({ top: 0, left: 0 });
  const current = statusOption(value);

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 188;
      const height = 176;
      const openUp = window.innerHeight - rect.bottom < height + 12 && rect.top > height;
      setMenuStyle({
        top: openUp ? rect.top - 8 : rect.bottom + 6,
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
        transform: openUp ? "translateY(-100%)" : undefined,
      });
    };

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    place();
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className={`inline-flex h-10 w-full min-w-[148px] items-center justify-between gap-2 rounded-lg px-3 text-sm font-medium ring-1 transition hover:brightness-95 disabled:cursor-wait disabled:opacity-60 sm:w-auto ${current.chip}`}
      >
        <span className="inline-flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${current.dot}`} />
          {current.label}
        </span>
        <ChevronDown size={15} className={`shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: "fixed",
            top: menuStyle.top,
            left: menuStyle.left,
            transform: menuStyle.transform,
            width: 188,
            zIndex: 60,
          }}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {STATUS_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setOpen(false);
                  if (!selected) onChange(option.value);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-slate-50"
              >
                <span className={`h-2 w-2 rounded-full ${option.dot}`} />
                <span className="flex-1 font-medium">{option.label}</span>
                {selected && <Check size={15} className="text-slate-500" />}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-800">Loading maintenance...</div>}>
      <MaintenanceContent />
    </Suspense>
  );
}

function MaintenanceContent() {
  const { get, page, setFilters } = useUrlFilters();
  const { value: search, setValue: setSearch } = useDebouncedSearch();
  const statusFilter = (get("status") || "ALL") as StatusFilter;
  const { data: summary } = useMaintenance({
    limit: 100,
    search: get("search") || undefined,
  });
  const { data, isLoading, isError } = usePagedList<MaintenanceRecord>(
    "maintenance",
    "/maintenance",
    {
      search: get("search") || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
      page,
      limit: LIST_PAGE_SIZE,
    },
  );
  const { data: assets } = useAssets({ limit: 100 });
  const createMaintenance = useCreateMaintenance();
  const updateMaintenance = useUpdateMaintenance();
  const [showForm, setShowForm] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const visible = data?.items ?? [];

  const counts = useMemo(() => {
    const list = summary ?? [];
    return {
      ALL: list.length,
      SCHEDULED: list.filter((record) => record.status === "SCHEDULED").length,
      IN_PROGRESS: list.filter((record) => record.status === "IN_PROGRESS").length,
      COMPLETED: list.filter((record) => record.status === "COMPLETED").length,
      CANCELLED: list.filter((record) => record.status === "CANCELLED").length,
    };
  }, [summary]);

  const changeStatus = async (id: string, status: MaintenanceStatus) => {
    setPendingId(id);
    try {
      await updateMaintenance.mutateAsync({ id, data: { status } });
    } finally {
      setPendingId(null);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
  };

  return (
    <div className={pageWrap}>
      <PageHeader
        title="Maintenance"
        description="Move each job through scheduled, in progress, and completed."
        action={
          <button onClick={() => setShowForm(true)} className={primaryButton}>
            <Plus size={18} />
            New Record
          </button>
        }
      />

      <div className="mb-4">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search title, asset, or technician..."
        />
      </div>

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilters({ status: null })}
          className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium ${
            statusFilter === "ALL"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
          }`}
        >
          All
          <span className="ml-2 text-xs opacity-80">{counts.ALL}</span>
        </button>
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilters({ status: option.value })}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
              statusFilter === option.value
                ? option.active
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${option.dot}`} />
            {option.label}
            <span className="text-xs opacity-80">{counts[option.value]}</span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {visible.length > 0 && (
          <div className="space-y-3 p-3 md:hidden">
            {visible.map((record) => (
              <article key={record.id} className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-slate-900">{record.title}</p>
                {record.description && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-700">{record.description}</p>
                )}
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-600">Asset</dt>
                    <dd className="mt-0.5 font-medium text-slate-900">{record.asset?.name || "Unknown asset"}</dd>
                    <dd className="text-xs text-slate-600">{record.asset?.assetTag}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-600">Performed by</dt>
                    <dd className="mt-0.5 text-slate-800">{record.performedBy || "—"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-600">Created</dt>
                    <dd className="mt-0.5 text-slate-800">{new Date(record.createdAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <StatusMenu
                    value={record.status}
                    disabled={pendingId === record.id}
                    onChange={(status) => changeStatus(record.id, status)}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px]">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Title</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Asset</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Performed by</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-800">Created</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-800">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-800">
                  Loading maintenance records...
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-red-600">
                  Could not load maintenance records.
                </td>
              </tr>
            )}
            {!isLoading && !isError && visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                    <Wrench size={18} />
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-900">
                    {statusFilter === "ALL" ? "No maintenance records yet" : "Nothing in this status"}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {statusFilter === "ALL"
                      ? "Create a record, then update its status from the menu."
                      : "Try another status, or create a new record."}
                  </p>
                </td>
              </tr>
            )}
            {visible.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50/70">
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900">{record.title}</p>
                  {record.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-700">{record.description}</p>
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-slate-800">
                  <p className="font-medium text-slate-900">{record.asset?.name || "Unknown asset"}</p>
                  <p className="text-xs text-slate-600">{record.asset?.assetTag}</p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-800">
                  {record.performedBy || "—"}
                </td>
                <td className="px-5 py-4 text-sm text-slate-800">
                  {new Date(record.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <StatusMenu
                    value={record.status}
                    disabled={pendingId === record.id}
                    onChange={(status) => changeStatus(record.id, status)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {(isLoading || isError || visible.length === 0) && (
          <div className="px-5 py-12 text-center md:hidden">
            {isLoading && <p className="text-sm text-slate-800">Loading maintenance records...</p>}
            {isError && <p className="text-sm text-red-600">Could not load maintenance records.</p>}
            {!isLoading && !isError && (
              <>
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                  <Wrench size={18} />
                </div>
                <p className="mt-3 text-sm font-medium text-slate-900">
                  {statusFilter === "ALL" ? "No maintenance records yet" : "Nothing in this status"}
                </p>
              </>
            )}
          </div>
        )}
        <Pagination
          pagination={data?.pagination}
          onPage={(next) => setFilters({ page: next <= 1 ? null : next })}
        />
      </div>

      {showForm && (
        <div className={modalOverlay}>
          <div className={`${modalPanel} p-5 sm:max-w-md sm:p-6`}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">New Maintenance</h2>
                <p className="mt-0.5 text-sm text-slate-700">New records start as scheduled.</p>
              </div>
              <button
                type="button"
                onClick={closeForm}
                className={iconButton}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                await createMaintenance.mutateAsync({
                  assetId: form.assetId,
                  title: form.title,
                  description: form.description || undefined,
                  performedBy: form.performedBy || undefined,
                });
                closeForm();
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-800">Asset</span>
                <select
                  required
                  value={form.assetId}
                  onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Select asset</option>
                  {assets?.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.name} ({asset.assetTag})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-800">Title</span>
                <input
                  required
                  placeholder="Screen replacement"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-11 w-full rounded-lg border border-slate-300 px-3"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-800">Description</span>
                <textarea
                  placeholder="What needs to be done"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  rows={3}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-800">Performed by</span>
                <input
                  placeholder="Technician or vendor"
                  value={form.performedBy}
                  onChange={(e) => setForm({ ...form, performedBy: e.target.value })}
                  className="h-11 w-full rounded-lg border border-slate-300 px-3"
                />
              </label>
              <button
                type="submit"
                disabled={createMaintenance.isPending}
                className={`${primaryButton} w-full sm:w-full`}
              >
                {createMaintenance.isPending ? "Creating..." : "Create record"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
