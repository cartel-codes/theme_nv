import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="font-serif text-4xl font-light tracking-[0.2em] text-[#e8e4df] uppercase">
        404
      </h1>
      <p className="mt-4 text-sm tracking-[0.08em] text-[#6b6560] uppercase">
        Page not found
      </p>
      <Link
        href="/"
        className="mt-8 border border-[rgba(201,169,110,0.4)] px-8 py-3 text-xs font-light tracking-[0.2em] text-[#c9a96e] uppercase transition-colors hover:bg-[rgba(201,169,110,0.08)]"
      >
        Return home
      </Link>
    </div>
  );
}
