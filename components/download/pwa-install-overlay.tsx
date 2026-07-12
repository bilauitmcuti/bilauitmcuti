"use client";

import { useMemo, type ReactNode } from "react";
import { Share } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ResponsiveOverlayShell } from "@/components/ui/responsive-overlay-shell";
import {
  drawerOutlineButtonClassName,
  drawerPrimaryButtonClassName,
} from "@/components/ui/drawer";
import { usePwaInstalled } from "@/hooks/use-pwa-installed";
import { isIosSafari, isIpad } from "@/lib/pwa-platform";
import { cn } from "@/lib/utils";

interface PwaInstallOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ShareButtonLabel() {
  return (
    <div className="inline-flex items-center gap-1 align-middle font-semibold leading-none">
      <Share className="size-3.5 shrink-0" aria-hidden />
      <span>Share</span>
    </div>
  );
}

function InstallSteps({ steps }: { steps: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-3 text-left">
      {steps.map((body, index) => (
        <li key={index} className="flex gap-3">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground"
            aria-hidden
          >
            {index + 1}
          </span>
          <span className="min-w-0 pt-0.5 text-sm leading-relaxed text-foreground">{body}</span>
        </li>
      ))}
    </ol>
  );
}

const iosSafariSteps: ReactNode[] = [
  <>
    Tap the <ShareButtonLabel /> button in Safari.
  </>,
  <>
    Select <strong className="font-semibold">Add to Home Screen</strong>.
  </>,
  <>
    Tap <strong className="font-semibold">Add</strong> to finish.
  </>,
];

const iosNonSafariSteps: ReactNode[] = [
  <>
    Open this page in <strong className="font-semibold">Safari</strong>.
  </>,
  <>
    Tap the <ShareButtonLabel /> button.
  </>,
  <>
    Select <strong className="font-semibold">Add to Home Screen</strong>.
  </>,
  <>
    Tap <strong className="font-semibold">Add</strong>.
  </>,
];

/**
 * iOS install help: drawer on iPhone, dialog on iPad.
 * Windows/Android (including Android tablets) use the native browser prompt only.
 */
export function PwaInstallOverlay({ open, onOpenChange }: PwaInstallOverlayProps) {
  const isInstalled = usePwaInstalled();
  const safari = isIosSafari();
  const useDrawer = !isIpad();

  const content = useMemo(() => {
    if (isInstalled) {
      return {
        title: "Already installed",
        description: "Bila UiTM Cuti is already installed on this device.",
        body: null as ReactNode,
        primaryLabel: "Close",
        secondaryLabel: null as string | null,
      };
    }

    if (!safari) {
      return {
        title: "Open in Safari to install",
        description:
          "To add Bila UiTM Cuti to your Home Screen, open this page in Safari first.",
        body: <InstallSteps steps={iosNonSafariSteps} />,
        primaryLabel: "Got it",
        secondaryLabel: null,
      };
    }

    return {
      title: "Install Bila UiTM Cuti",
      description: "Add Bila UiTM Cuti to your Home Screen for quicker access.",
      body: <InstallSteps steps={iosSafariSteps} />,
      primaryLabel: "Got it",
      secondaryLabel: "Not now",
    };
  }, [isInstalled, safari]);

  const actions = useDrawer ? (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        size="sm"
        variant="default"
        className={drawerPrimaryButtonClassName}
        onClick={() => onOpenChange(false)}
      >
        {content.primaryLabel}
      </Button>
      {content.secondaryLabel ? (
        <Button
          type="button"
          variant="outline"
          className={drawerOutlineButtonClassName}
          onClick={() => onOpenChange(false)}
        >
          {content.secondaryLabel}
        </Button>
      ) : null}
    </div>
  ) : (
    <DialogFooter
      className={cn(
        content.secondaryLabel ? "flex-row sm:flex-row" : "flex-col sm:flex-col",
        "gap-2"
      )}
    >
      {content.secondaryLabel ? (
        <Button
          type="button"
          variant="outline"
          className={cn(drawerOutlineButtonClassName, "sm:flex-1")}
          onClick={() => onOpenChange(false)}
        >
          {content.secondaryLabel}
        </Button>
      ) : null}
      <Button
        type="button"
        size="sm"
        variant="default"
        className={cn(
          drawerPrimaryButtonClassName,
          content.secondaryLabel ? "sm:flex-1" : "w-full"
        )}
        onClick={() => onOpenChange(false)}
      >
        {content.primaryLabel}
      </Button>
    </DialogFooter>
  );

  return (
    <ResponsiveOverlayShell
      open={open}
      onOpenChange={onOpenChange}
      isMobile={useDrawer}
      title={content.title}
      description={content.description}
    >
      <div className="flex w-full flex-col gap-5">
        {content.body}
        {actions}
      </div>
    </ResponsiveOverlayShell>
  );
}
