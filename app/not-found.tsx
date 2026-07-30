import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Bila UiTM Cuti",
  description: "The page you are looking for does not exist on Bila UiTM Cuti.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
      <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold text-foreground">
            Looks like you&apos;re lost
          </h1>
          <p className="text-muted-foreground">
            It looks like this page isn&apos;t here anymore. Let&apos;s get you
            back to the academic calendar.
          </p>
        </div>

        <Button render={<Link href="/" />} nativeButton={false}>
          Back to Home
        </Button>
      </div>
    </main>
  );
}
