"use client";

import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <main className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-blue-600">Error</p>
            <h1 className="mt-2 text-2xl font-bold">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-700">
              AssetFlow hit an unexpected error
              {error.digest ? ` (${error.digest})` : ""}. You can try loading the
              app again.
            </p>
            <button
              type="button"
              onClick={() => retry()}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
