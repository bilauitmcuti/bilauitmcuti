'use client';

import { useEffect } from 'react';
import { purgeStaleOverlayPortals } from '@/lib/overlay-cleanup';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error:', error);
    }
    purgeStaleOverlayPortals();
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          A critical error occurred. Please refresh the page or try again later.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
