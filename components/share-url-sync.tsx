"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { syncPageShareUrl } from "@/lib/share-url";

/** Sync canonical/share (clean path) and og:url (with session/filter query when in the address bar). */
export function ShareUrlSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    syncPageShareUrl();

    const handlePopState = () => syncPageShareUrl();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [pathname, searchKey]);

  return null;
}
