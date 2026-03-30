'use client';

import { ReactLenis } from 'lenis/react';
import { usePathname } from 'next/navigation';

interface LenisProviderProps {
  children: React.ReactNode;
}

export function LenisProvider({ children }: LenisProviderProps) {
  const pathname = usePathname();
  /** Nested `overflow-y-auto` + full-height layouts need native touch scroll; Lenis root fights nested scrollers on mobile. */
  const useNativeScroll =
    pathname?.startsWith('/chat') ||
    pathname === '/contact' ||
    pathname === '/sponsor';

  if (useNativeScroll) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{ lerp: 0.1, duration: 1.2, smoothWheel: true, syncTouch: true }}
    >
      {children}
    </ReactLenis>
  );
}
