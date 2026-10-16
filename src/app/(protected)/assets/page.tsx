"use client";

import { Suspense, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Package,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  X,
} from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchField from "@/components/ui/SearchField";
import {
  useAssetQr,
  useCategories,
  useCreateAsset,
  useDeleteAsset,
  useUpdateAsset,
} from "@/hooks/useDomain";
import { useConfirm } from "@/hooks/useConfirm";
import { useOffices } from "@/hooks/useOffice";
import { LIST_PAGE_SIZE, usePagedList } from "@/hooks/usePagedList";
import { useDebouncedSearch, useUrlFilters } from "@/hooks/useUrlFilters";
import {
  iconButton,
  modalFooter,
  modalOverlay,
  modalPanel,
  pageWrap,
  primaryButton,
  secondaryButton,
  selectClass,
} from "@/lib/ui";
import type { RootState } from "@/redux/store";
import type { Asset } from "@/types/asset";

function AssetActions({
  onEdit,
  onQr,
  onRetire,
}: {
  onEdit: () => void;
  onQr: () => void;
  onRetire: () => void;
}) {
  return (
    <>
      <button onClick={onEdit} className={`${iconButton} hover:bg-blue-50 hover:text-blue-600`} aria-label="Edit asset">
        <Pencil size={17} />
      </button>
      <button onClick={onQr} className={`${iconButton} hover:bg-blue-50 hover:text-blue-600`} aria-label="Print QR">
        <QrCode size={17} />
      </button>
      <button onClick={onRetire} className={`${iconButton} hover:bg-red-50 hover:text-red-600`} aria-label="Retire asset">
        <Trash2 size={17} />
      </button>
    </>
  );
}

const statusColor: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  ASSIGNED: "bg-blue-50 text-blue-700",
  MAINTENANCE: "bg-amber-50 text-amber-700",
  RETIRED: "bg-slate-100 text-slate-800",
};

const emptyForm = {
  name: "",
  assetTag: "",
  serialNumber: "",
  description: "",
  location: "",
  officeId: "",
  categoryId: "",
  purchaseCost: "",
};

export default function AssetsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-slate-800">Loading assets...</div>
      }
    >
      <AssetsPageContent />
    </Suspense>
  );
}

function AssetsPageContent() {
  const { get, page, setFilters } = useUrlFilters();
  const { value: search, setValue: setSearch } = useDebouncedSearch();
  const status = get("status");
  const officeFilter = get("office");
  const role = useSelector((state: RootState) => state.auth.role);
  const officeId = useSelector((state: RootState) => state.auth.officeId);
  const canManage = role === "SUPER_ADMIN" || role === "MANAGER" || role === "ADMIN";
  const isGlobal = role === "SUPER_ADMIN" || role === "MANAGER";

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [qrAssetId, setQrAssetId] = useState<string | null>(null);

  const { data, isLoading, isError } = usePagedList<Asset>("assets", "/assets", {
    search: get("search") || undefined,
    status: status || undefined,
    officeId: officeFilter || undefined,
    page,
    limit: LIST_PAGE_SIZE,
  });
  const { data: offices } = useOffices();
  const { data: categories } = useCategories({ isActive: true });
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const { confirm, dialog } = useConfirm();

  const [form, setForm] = useState({
    ...emptyForm,
    officeId: officeId || "",
  });

  const filtered = data?.items ?? [];

  const categoryOptions = useMemo(() => {
    const active = (categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      isActive: category.isActive,
    }));
    if (!editing?.categoryId || !editing.category) return active;
    if (active.some((category) => category.id === editing.categoryId)) return active;
    return [
      ...active,
      {
        id: editing.category.id,
        name: editing.category.name,
        isActive: false,
      },
    ];
  }, [categories, editing]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, officeId: officeId || "" });
    setShowForm(true);
  };

  const openEdit = (asset: Asset) => {
    setEditing(asset);
    setForm({
      name: asset.name,
      assetTag: asset.assetTag,
      serialNumber: asset.serialNumber || "",
      description: asset.description || "",
      location: asset.location || "",
      officeId: asset.officeId,
      categoryId: asset.categoryId || "",
      purchaseCost: asset.purchaseCost != null ? String(asset.purchaseCost) : "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      serialNumber: form.serialNumber || undefined,
      description: form.description || undefined,
      location: form.location || undefined,
      officeId: form.officeId,
      categoryId: form.categoryId || undefined,
      purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : undefined,
    };

    if (editing) {
      await updateAsset.mutateAsync({ id: editing.id, data: payload });
    } else {
      await createAsset.mutateAsync({
        ...payload,
        assetTag: form.assetTag || undefined,
      });
    }

    setShowForm(false);
    setEditing(null);
    setForm({ ...emptyForm, officeId: officeId || "" });
  };

  const saving = createAsset.isPending || updateAsset.isPending;

  return (
    <div className={pageWrap}>
      <PageHeader
        title="Assets"
        description="Track inventory across offices. Generate printable QR labels."
        action={
          canManage ? (
            <button onClick={openCreate} className={primaryButton}>
              <Plus size={18} />
              Add Asset
            </button>
          ) : undefined
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="sm:col-span-2">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search by name, tag, or serial..."
          />
        </div>
        <select
          value={status}
          onChange={(e) => setFilters({ status: e.target.value })}
          className={selectClass}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="RETIRED">Retired</option>
        </select>
        {isGlobal && (
          <select
            value={officeFilter}
            onChange={(e) => setFilters({ office: e.target.value })}
            className={selectClass}
            aria-label="Filter by office"
          >
            <option value="">All offices</option>
            {offices?.map((office) => (
              <option key={office.id} value={office.id}>
                {office.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-800">
          Loading assets...
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">
          Failed to load assets.
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Package size={40} className="mx-auto text-slate-500" />
          <h3 className="mt-4 text-sm font-semibold text-slate-800">No assets found</h3>
          <p className="mt-1 text-sm text-slate-800">
            Create your first asset to get started.
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="space-y-3 p-3 md:hidden">
            {filtered.map((asset) => (
              <article key={asset.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{asset.name}</p>
                    <p className="text-xs text-slate-700">
                      {asset.category?.name || "Uncategorized"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      statusColor[asset.status] || statusColor.AVAILABLE
                    }`}
                  >
                    {asset.status}
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-600">Tag</dt>
                    <dd className="mt-0.5 font-mono text-xs text-slate-900">{asset.assetTag}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-600">Office</dt>
                    <dd className="mt-0.5 truncate text-slate-800">{asset.office?.name || "-"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-600">Assigned to</dt>
                    <dd className="mt-0.5 text-slate-800">
                      {asset.assignments?.[0]?.user?.name || "-"}
                    </dd>
                  </div>
                </dl>
                {canManage && (
                  <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-3">
                    <AssetActions
                      onEdit={() => openEdit(asset)}
                      onQr={() => setQrAssetId(asset.id)}
                      onRetire={() => {
                        void confirm({
                          title: "Retire this asset?",
                          description: `${asset.name} (${asset.assetTag}) will be marked retired and taken out of active use.`,
                          confirmLabel: "Retire asset",
                          action: () => deleteAsset.mutateAsync(asset.id),
                        });
                      }}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Asset
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Tag
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Office
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-800">
                    Assigned To
                  </th>
                  {canManage && (
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-800">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((asset: Asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-slate-800">{asset.name}</p>
                      <p className="text-xs text-slate-800">
                        {asset.category?.name || "Uncategorized"}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-800">
                        {asset.assetTag}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-800">
                      {asset.office?.name || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusColor[asset.status] || statusColor.AVAILABLE
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-800">
                      {asset.assignments?.[0]?.user?.name || "-"}
                    </td>
                    {canManage && (
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <AssetActions
                            onEdit={() => openEdit(asset)}
                            onQr={() => setQrAssetId(asset.id)}
                            onRetire={() => {
                              void confirm({
                                title: "Retire this asset?",
                                description: `${asset.name} (${asset.assetTag}) will be marked retired and taken out of active use.`,
                                confirmLabel: "Retire asset",
                                action: () => deleteAsset.mutateAsync(asset.id),
                              });
                            }}
                          />
                        </div>
                      </td>
                    )}
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

      {showForm && (
        <div className={modalOverlay}>
          <div className={`${modalPanel} sm:max-w-xl`}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? "Edit Asset" : "Create Asset"}
              </h2>
              <button onClick={() => setShowForm(false)} className={iconButton} aria-label="Close">
                <X size={19} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">Asset Tag</label>
                  <input
                    value={form.assetTag}
                    onChange={(e) => setForm({ ...form, assetTag: e.target.value })}
                    placeholder="Auto if empty"
                    disabled={Boolean(editing)}
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 uppercase outline-none focus:border-blue-500 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">Serial</label>
                  <input
                    value={form.serialNumber}
                    onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">Office</label>
                  <select
                    required
                    value={form.officeId}
                    onChange={(e) => setForm({ ...form, officeId: e.target.value })}
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                  >
                    <option value="">Select office</option>
                    {offices?.map((office) => (
                      <option key={office.id} value={office.id}>
                        {office.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">Category</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                  >
                    <option value="">None</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.isActive ? category.name : `${category.name} (inactive)`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">Cost</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.purchaseCost}
                    onChange={(e) => setForm({ ...form, purchaseCost: e.target.value })}
                    className="h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-800">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className={modalFooter}>
                <button type="button" onClick={() => setShowForm(false)} className={secondaryButton}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={primaryButton}
                >
                  {saving ? "Saving..." : editing ? "Save Changes" : "Create Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrAssetId && <QrModal assetId={qrAssetId} onClose={() => setQrAssetId(null)} />}
      {dialog}
    </div>
  );
}

function printQrCode(qrDataUrl: string) {
  const root = document.createElement("div");
  root.id = "qr-print-root";
  const image = document.createElement("img");
  image.alt = "QR code";
  image.src = qrDataUrl;
  root.appendChild(image);
  document.body.appendChild(root);
  document.body.classList.add("printing-qr");

  const media = window.matchMedia("print");
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    window.removeEventListener("afterprint", cleanup);
    media.removeEventListener("change", onPrintChange);
    document.body.classList.remove("printing-qr");
    root.remove();
  };

  const onPrintChange = (event: MediaQueryListEvent) => {
    if (!event.matches) cleanup();
  };

  const startPrint = () => {
    window.addEventListener("afterprint", cleanup);
    media.addEventListener("change", onPrintChange);
    window.print();
  };

  if (image.complete) {
    startPrint();
  } else {
    image.onload = startPrint;
    image.onerror = cleanup;
  }
}

function QrModal({ assetId, onClose }: { assetId: string; onClose: () => void }) {
  const { data, isLoading } = useAssetQr(assetId);

  const handlePrint = () => {
    if (!data?.qrDataUrl) return;
    printQrCode(data.qrDataUrl);
  };

  return (
    <div className={modalOverlay}>
      <div className={`${modalPanel} p-5 sm:max-w-md sm:p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Asset QR Label</h2>
          <button onClick={onClose} className={iconButton} aria-label="Close">
            <X size={19} />
          </button>
        </div>

        {isLoading && <p className="text-sm text-slate-800">Generating QR...</p>}

        {data && (
          <div className="text-center">
            <img
              src={data.qrDataUrl}
              alt={`QR for ${data.assetTag}`}
              className="mx-auto h-56 w-56"
            />
            <p className="mt-4 text-lg font-bold text-slate-900">{data.name}</p>
            <p className="mt-1 font-mono text-sm text-slate-800">{data.assetTag}</p>
            <p className="mt-2 break-all text-xs text-slate-800">{data.scanUrl}</p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <button
                onClick={onClose}
                className={secondaryButton}
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className={primaryButton}
              >
                Print Label
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
