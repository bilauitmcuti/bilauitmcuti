'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace('/');
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [router]);

  const bgClass = 'bg-background text-foreground';
  const textClass = 'text-foreground text-base font-normal';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgClass}`}>
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <span className={textClass}>
            404
          </span>

          <span className={textClass}>
            Page Not Found
          </span>

          <span className={textClass}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </span>
          <span className={textClass}>
            Redirecting to homepage...
          </span>
        </div>
      </div>
    </div>
  );
}
