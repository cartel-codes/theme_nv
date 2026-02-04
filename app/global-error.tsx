'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: '#0a0a0a', color: '#e8e4df', fontFamily: 'serif', padding: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Something went wrong
        </h1>
        <p style={{ marginTop: '1rem', color: '#6b6560', fontSize: '0.875rem' }}>
          A critical error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '2rem',
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            border: '1px solid rgba(201, 169, 110, 0.4)',
            color: '#c9a96e',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
