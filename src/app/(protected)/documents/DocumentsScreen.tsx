"use client";

import { Suspense, useState } from "react";
import { useSelector } from "react-redux";
import { Plus, Trash2, X } from "lucide-react";

import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchField from "@/components/ui/SearchField";
import { useCreateDocument, useDeleteDocument } from "@/hooks/useDomain";
import { useConfirm } from "@/hooks/useConfirm";
import { LIST_PAGE_SIZE, usePagedList } from "@/hooks/usePagedList";
import { useDebouncedSearch, useUrlFilters } from "@/hooks/useUrlFilters";
import {
  iconButton,
  modalOverlay,
  modalPanel,
  pageWrap,
  primaryButton,
} from "@/lib/ui";
import type { RootState } from "@/redux/store";
import type { DocumentItem } from "@/types/asset";

export default function DocumentsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-800">Loading documents...</div>}>
      <DocumentsContent />
    </Suspense>
  );
}

function DocumentsContent() {
  const { get, page, setFilters } = useUrlFilters();
  const { value: search, setValue: setSearch } = useDebouncedSearch();
  const role = useSelector((state: RootState) => state.auth.role);
  const canManage = role === "SUPER_ADMIN" || role === "MANAGER" || role === "ADMIN";
  const { data, isLoading } = usePagedList<DocumentItem>("documents", "/documents", {
    search: get("search") || undefined,
    page,
    limit: LIST_PAGE_SIZE,
  });
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const { confirm, dialog } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    fileUrl: "",
    fileType: "",
  });
  const documents = data?.items ?? [];

  return (
    <div className={pageWrap}>
      <PageHeader
        title="Documents"
        description="Store links to manuals, invoices, and policies."
        action={
          canManage ? (
            <button onClick={() => setShowForm(true)} className={primaryButton}>
              <Plus size={18} />
              Add Document
            </button>
          ) : undefined
        }
      />

      <div className="mb-4">
        <SearchField
          value={search}
          onChange={setSearch}
          placeholder="Search documents..."
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {isLoading && <p className="p-6 text-sm text-slate-800">Loading...</p>}
        {!isLoading && documents.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-800">No documents yet.</p>
        )}
        {documents.length > 0 && (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{doc.title}</p>
                  <p className="text-sm text-slate-800">{doc.description || "No description"}</p>
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block max-w-full truncate text-xs text-blue-600 hover:underline"
                    >
                      Open link
                    </a>
                  )}
                </div>
                {canManage && (
                  <button
                    onClick={() => {
                      void confirm({
                        title: "Remove this document?",
                        description: `${doc.title} will be removed from the library.`,
                        confirmLabel: "Remove document",
                        action: () => deleteDocument.mutateAsync(doc.id),
                      });
                    }}
                    className={`${iconButton} self-end hover:bg-red-50 hover:text-red-600 sm:self-auto`}
                    aria-label={`Remove ${doc.title}`}
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            ))}
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
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Document</h2>
              <button onClick={() => setShowForm(false)} className={iconButton} aria-label="Close">
                <X size={19} />
              </button>
            </div>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await createDocument.mutateAsync(form);
                setShowForm(false);
              }}
            >
              <input
                required
                placeholder="Title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="h-11 w-full rounded-lg border px-3"
              />
              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full rounded-lg border px-3 py-2"
                rows={3}
              />
              <input
                placeholder="File URL"
                value={form.fileUrl}
                onChange={(event) => setForm({ ...form, fileUrl: event.target.value })}
                className="h-11 w-full rounded-lg border px-3"
              />
              <input
                placeholder="File type (pdf, doc...)"
                value={form.fileType}
                onChange={(event) => setForm({ ...form, fileType: event.target.value })}
                className="h-11 w-full rounded-lg border px-3"
              />
              <button type="submit" className={`${primaryButton} w-full sm:w-full`}>
                Save
              </button>
            </form>
          </div>
        </div>
      )}
      {dialog}
    </div>
  );
}
