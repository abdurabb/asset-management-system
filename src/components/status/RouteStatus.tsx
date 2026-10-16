import type { ReactNode } from "react";
import Link from "next/link";

export function ContentSkeleton() {
  return (
    <div className="p-4 sm:p-6" aria-busy="true" aria-live="polite">
      <div className="mb-2 h-7 w-40 animate-pulse rounded-lg bg-slate-200" />
      <div className="mb-6 h-4 w-72 max-w-full animate-pulse rounded bg-slate-200" />
      <div className="mb-4 h-11 w-full animate-pulse rounded-lg bg-white ring-1 ring-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl bg-white ring-1 ring-slate-200"
          />
        ))}
      </div>
    </div>
  );
}

export function StatusCard({
  code,
  title,
  description,
  action,
}: {
  code: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold tracking-wide text-blue-600">{code}</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-700">{description}</p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export function HomeLink({ href = "/dashboard", label = "Back to dashboard" }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700"
    >
      {label}
    </Link>
  );
}
