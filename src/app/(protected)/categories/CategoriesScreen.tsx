"use client";

import { Suspense, useState } from "react";
import { Plus, RotateCcw, Trash2, X } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchField from "@/components/ui/SearchField";
import {
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/hooks/useDomain";
import { useConfirm } from "@/hooks/useConfirm";
import { LIST_PAGE_SIZE, usePagedList } from "@/hooks/usePagedList";
import { useDebouncedSearch, useUrlFilters } from "@/hooks/useUrlFilters";
import { showToast } from "@/lib/toast";
import {
  iconButton,
  modalOverlay,
  modalPanel,
  pageWrap,
  primaryButton,
  selectClass,
} from "@/lib/ui";
import type { Category } from "@/types/asset";

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-800">Loading categories...</div>}>
      <CategoriesContent />
    </Suspense>
  );
}

function CategoriesContent() {
  const { get, page, setFilters } = useUrlFilters();
  const { value: search, setValue: setSearch } = useDebouncedSearch();
  const active = get("active");
  const { data, isLoading } = usePagedList<Category>("categories", "/categories", {
    search: get("search") || undefined,
    isActive: active === "" ? undefined : active === "true",
    page,
    limit: LIST_PAGE_SIZE,
  });
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategory = useUpdateCategory();
  const { confirm, dialog } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const categories = data?.items ?? [];

  return (
    <div className={pageWrap}>
      <PageHeader
        title="Categories"
        description="Organize assets by type across the company."
        action={
          <button onClick={() => setShowForm(true)} className={primaryButton}>
            <Plus size={18} />
            Add Category
          </button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search categories..."
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

      {isLoading && <p className="text-sm text-slate-800">Loading categories...</p>}

      {!isLoading && categories.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-800">
          No categories found.
        </p>
      )}

      {categories.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`rounded-xl border border-slate-200 p-4 ${
                  category.isActive ? "" : "opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{category.name}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          category.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-800">
                      {category.description || "No description"}
                    </p>
                    <p className="mt-3 text-xs text-slate-800">
                      {category._count?.assets ?? 0} assets
                    </p>
                  </div>
                  {category.isActive ? (
                    <button
                      onClick={() => {
                        void confirm({
                          title: "Deactivate this category?",
                          description: `${category.name} will be hidden from new assets. Assets already using it stay as they are.`,
                          confirmLabel: "Deactivate category",
                          action: () => deleteCategory.mutateAsync(category.id),
                        });
                      }}
                      className={`${iconButton} shrink-0 hover:bg-red-50 hover:text-red-600`}
                      aria-label={`Deactivate ${category.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        void confirm({
                          title: "Reactivate this category?",
                          description: `${category.name} will be available again when adding assets.`,
                          confirmLabel: "Reactivate category",
                          action: async () => {
                            await updateCategory.mutateAsync({
                              id: category.id,
                              data: { isActive: true },
                            });
                            showToast.success("Category reactivated");
                          },
                        });
                      }}
                      className={`${iconButton} shrink-0 hover:bg-emerald-50 hover:text-emerald-700`}
                      aria-label={`Reactivate ${category.name}`}
                    >
                      <RotateCcw size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Pagination
            pagination={data?.pagination}
            onPage={(next) => setFilters({ page: next <= 1 ? null : next })}
          />
        </div>
      )}

      {showForm && (
        <div className={modalOverlay}>
          <div className={`${modalPanel} p-5 sm:max-w-md sm:p-6`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Category</h2>
              <button onClick={() => setShowForm(false)} className={iconButton} aria-label="Close">
                <X size={19} />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await createCategory.mutateAsync(form);
                setShowForm(false);
                setForm({ name: "", description: "" });
              }}
            >
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="h-11 w-full rounded-lg border px-3"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                rows={3}
              />
              <button type="submit" className={`${primaryButton} w-full sm:w-full`}>
                Create
              </button>
            </form>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
