'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h2 className="font-serif text-xl font-light tracking-[0.2em] text-[#e8e4df] uppercase">
        Something went wrong
      </h2>
      <p className="mt-4 text-sm text-[#6b6560]">
        We encountered an error. Please try again.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="border border-[rgba(201,169,110,0.4)] px-6 py-3 text-xs font-light tracking-[0.2em] text-[#c9a96e] uppercase transition-colors hover:bg-[rgba(201,169,110,0.08)]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-[rgba(201,169,110,0.4)] px-6 py-3 text-xs font-light tracking-[0.2em] text-[#c9a96e] uppercase transition-colors hover:bg-[rgba(201,169,110,0.08)]"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
