import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Public Holiday Calendar Malaysia 2026",
    template: "%s | Public Holiday | Bila UiTM Cuti",
  },
  description:
    "Malaysia public holiday calendar in grid and list views with All (Federal + States), Federal-only, and state-specific routes.",
  keywords: [
    "public holiday malaysia",
    "federal holiday malaysia",
    "state holiday malaysia",
    "uitm public holiday",
    "calendar malaysia 2026",
  ],
};

interface PublicHolidayRouteLayoutProps {
  children: ReactNode;
}

export default function PublicHolidayRouteLayout({
  children,
}: PublicHolidayRouteLayoutProps) {
  return children;
}
