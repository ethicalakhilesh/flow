"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * Next.js renders this automatically whenever a Server Component in the app
 * throws — e.g. an Airtable table that doesn't exist yet, a bad field name,
 * a missing env var. Without this file, production shows a bare "server-side
 * exception... Digest: XXXX" page with no way to tell what actually broke.
 * This shows the real error message instead.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-expense/10 text-expense">
        <AlertTriangle size={22} />
      </div>
      <h1 className="mb-1 font-display text-lg font-bold text-ink">Something went wrong</h1>
      <p className="mb-4 whitespace-pre-wrap break-words text-sm text-muted">
        {error.message || "An unexpected error occurred."}
      </p>
      {error.digest && (
        <p className="mb-4 font-mono text-xs text-muted">Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="flex items-center gap-1.5 rounded-xl2 bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-card"
      >
        <RotateCcw size={15} />
        Try again
      </button>
    </div>
  );
}
