import { ChevronLeft, ChevronRight } from "lucide-react";

import type { PaginationMeta } from "@/hooks/usePagedList";

function pageWindow(page: number, totalPages: number) {
  const pages: number[] = [];
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  const end = Math.min(totalPages, start + 2);
  for (let current = Math.max(1, end - 2); current <= end; current += 1) {
    pages.push(current);
  }
  return pages;
}

export default function Pagination({
  pagination,
  onPage,
}: {
  pagination?: PaginationMeta;
  onPage: (page: number) => void;
}) {
  if (!pagination || pagination.total === 0) return null;

  const { page, totalPages, total, limit } = pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  const pages = pageWindow(page, Math.max(totalPages, 1));

  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-700">
        {from}–{to} of {total}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Previous</span>
          </button>
          {pages.map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => onPage(number)}
              className={`h-10 w-10 rounded-lg text-sm font-medium ${
                number === page
                  ? "bg-blue-600 text-white"
                  : "text-slate-800 hover:bg-slate-100"
              }`}
              aria-current={number === page ? "page" : undefined}
            >
              {number}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPage(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex h-10 items-center gap-1 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
