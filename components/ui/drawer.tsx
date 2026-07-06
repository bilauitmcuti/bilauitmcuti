"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"

import { useVisualViewportOffset } from "@/lib/use-visual-viewport-offset"
import { cn } from "@/lib/utils"

/** Shared dim + blur for modal drawer/dialog backdrops. */
export const overlayBackdropClassName =
  "fixed inset-0 isolate z-50 min-h-dvh bg-black/40 supports-backdrop-filter:backdrop-blur-sm supports-[-webkit-touch-callout:none]:absolute"

/** Shared shell: min 35dvh, max 80dvh (bottom); flex children use min-h-0 for inner scroll. */
export const drawerContentClassName =
  "flex min-h-[35dvh] flex-col overflow-x-hidden border-0 shadow-none ring-0"

/** Activity day list drawer — content height up to 60dvh (bottom); no min height. */
export const activityDrawerContentClassName = cn(
  "flex flex-col overflow-x-hidden border-0 shadow-none ring-0",
  "[--drawer-content-height:auto] [--drawer-height:unset]",
  "data-[swipe-direction=down]:h-auto data-[swipe-direction=down]:min-h-0 data-[swipe-direction=down]:max-h-[60dvh]"
)

/** Activity drawer body — no flex-1 stretch; grows when list zone overflows. */
export const activityDrawerBodyClassName =
  "flex min-h-0 flex-col has-[[data-overflows]]:flex-1 has-[[data-overflows]]:overflow-hidden"

/** Base layout for activity drawer list zone (overflow toggled by DrawerScrollRegion). */
export const activityDrawerScrollRegionClassName = "min-h-0 shrink overscroll-contain"

/** Drawer body column that fills the shell (use with a scroll region below a fixed header). */
export const drawerBodyFlexClassName = "flex min-h-0 flex-1 flex-col"

/** Scrollable drawer region (list/content only — keep titles/headers outside). */
export const drawerScrollRegionClassName =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain"

/** Bottom inset: safe-area + 28px (1.75rem) for PWA home indicator — use on drawer shell. */
export const DRAWER_SAFE_BOTTOM_PADDING =
  "calc(env(safe-area-inset-bottom) + 1.75rem)" as const

export const drawerSafeAreaBottomClassName =
  "pb-[calc(env(safe-area-inset-bottom)+1.75rem)]"

export const drawerBodyClassName =
  "flex w-full min-w-0 max-w-full flex-col border-0 bg-popover px-4 pt-0 text-left shadow-none outline-none ring-0 ring-offset-0"

/** Pure white in light theme (see `.responsive-shell-bg` in globals.css). */
export const responsiveShellBgClassName = "responsive-shell-bg"

/** Drawer shell for mention picker & engagement prompt (desktop dialog uses responsiveShellBg only). */
export const responsiveDrawerContentClassName = cn(
  drawerContentClassName,
  responsiveShellBgClassName
)

/** Responsive shell for drawers with text inputs (engagement prompt, mention picker). */
export const responsiveKeyboardDrawerContentClassName = cn(
  drawerContentClassName,
  responsiveShellBgClassName,
  "[--drawer-content-height:auto] [--drawer-height:unset] data-[swipe-direction=down]:!h-auto"
)

/** Pins bottom drawer to visible viewport above the mobile keyboard. */
export const keyboardAwareDrawerContentClassName =
  "data-[swipe-direction=down]:!bottom-[var(--vv-bottom-offset,0px)] data-[swipe-direction=down]:!max-h-[min(80dvh,calc(100dvh-var(--vv-bottom-offset,0px)))] data-[swipe-direction=down]:!h-auto"

/** Body layout for responsive drawer/dialog pairs (mention picker, engagement prompt). */
export const responsiveDrawerBodyClassName = cn(
  "gap-3 text-center md:text-left",
  responsiveShellBgClassName
)

/** Shared visible drawer heading — matches Program Selection drawer. */
export const drawerTitleClassName =
  "w-full border-0 text-center text-lg font-semibold leading-snug tracking-tight text-foreground shadow-none outline-none ring-0 ring-offset-0"

/** Dialog title/description typography aligned with drawer responsive pairs. */
export const responsiveDialogTitleClassName = drawerTitleClassName

export const responsiveDialogDescriptionClassName =
  "border-0 text-sm text-muted-foreground shadow-none text-center md:text-left"

export const responsiveDrawerDescriptionClassName =
  responsiveDialogDescriptionClassName

/** Full-width primary action — 38px tall (settings shell, drawers). */
export const drawerPrimaryButtonClassName =
  "w-full !h-[38px] justify-center border-border text-center transition-none"

/** Full-width outline action — 38px tall (settings shell, drawers). */
export const drawerOutlineButtonClassName =
  "w-full h-[38px] justify-center border-border bg-background text-black shadow-xs transition-all hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50"

type DrawerContextProps = {
  hasSnapPoints: boolean
  modal: DrawerPrimitive.Root.Props["modal"]
  showSwipeHandle: boolean
  swipeDirection: NonNullable<DrawerPrimitive.Root.Props["swipeDirection"]>
}

const DrawerContext = React.createContext<DrawerContextProps | null>(null)

function useDrawer() {
  const context = React.useContext(DrawerContext)

  if (!context) {
    throw new Error("useDrawer must be used within a Drawer.")
  }

  return context
}

function Drawer({
  modal = true,
  showSwipeHandle = true,
  snapPoints,
  swipeDirection = "down",
  ...props
}: DrawerPrimitive.Root.Props & {
  showSwipeHandle?: boolean
}) {
  const hasSnapPoints = snapPoints != null && snapPoints.length > 0
  const contextValue = React.useMemo(
    () => ({
      hasSnapPoints,
      modal,
      showSwipeHandle,
      swipeDirection,
    }),
    [hasSnapPoints, modal, showSwipeHandle, swipeDirection]
  )

  return (
    <DrawerContext.Provider value={contextValue}>
      <DrawerPrimitive.Root
        data-slot="drawer"
        modal={modal}
        snapPoints={snapPoints}
        swipeDirection={swipeDirection}
        {...props}
      />
    </DrawerContext.Provider>
  )
}

function KeyboardAwareDrawer({
  open,
  ...props
}: DrawerPrimitive.Root.Props & {
  showSwipeHandle?: boolean
}) {
  useVisualViewportOffset(open === true)

  return (
    <Drawer open={open} swipeDirection="down" {...props} />
  )
}

function DrawerTrigger({ ...props }: DrawerPrimitive.Trigger.Props) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

function DrawerPortal({ ...props }: DrawerPrimitive.Portal.Props) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({ ...props }: DrawerPrimitive.Close.Props) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: DrawerPrimitive.Backdrop.Props) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        overlayBackdropClassName,
        "opacity-[max(var(--drawer-overlay-min-opacity,0),calc(1-var(--drawer-swipe-progress)))] transition-opacity duration-450 ease-[cubic-bezier(0.32,0.72,0,1)] select-none data-ending-style:pointer-events-none data-ending-style:opacity-0 data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-snap-points:[--drawer-overlay-min-opacity:0.5] data-starting-style:opacity-0 data-swiping:duration-0",
        className
      )}
      {...props}
    />
  )
}

function DrawerSwipeHandle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-swipe-handle"
      aria-hidden="true"
      className={cn(
        "relative z-10 mx-auto mt-4 flex shrink-0 cursor-grab transition-opacity duration-200 group-data-nested-drawer-open/drawer-popup:opacity-0 group-data-nested-drawer-swiping/drawer-popup:opacity-100 group-data-[swipe-axis=x]/drawer-popup:h-full group-data-[swipe-axis=x]/drawer-popup:w-3 group-data-[swipe-axis=x]/drawer-popup:items-center group-data-[swipe-axis=y]/drawer-popup:h-3 group-data-[swipe-axis=y]/drawer-popup:w-full group-data-[swipe-axis=y]/drawer-popup:justify-center group-data-[swipe-direction=down]/drawer-popup:items-end group-data-[swipe-direction=left]/drawer-popup:order-last group-data-[swipe-direction=left]/drawer-popup:justify-start group-data-[swipe-direction=right]/drawer-popup:justify-end group-data-[swipe-direction=up]/drawer-popup:order-last group-data-[swipe-direction=up]/drawer-popup:items-start after:block after:h-1.5 after:w-[100px] after:shrink-0 after:rounded-full after:bg-muted group-data-[swipe-axis=x]/drawer-popup:after:h-[100px] group-data-[swipe-axis=x]/drawer-popup:after:w-1.5 group-data-[swipe-axis=y]/drawer-popup:after:h-1.5 group-data-[swipe-axis=y]/drawer-popup:after:w-[100px] active:cursor-grabbing",
        className
      )}
      {...props}
    />
  )
}

const DrawerScrollRegion = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function DrawerScrollRegion({ className, children, ...props }, forwardedRef) {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [overflows, setOverflows] = React.useState(false)

  const setRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node
      if (typeof forwardedRef === "function") forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef]
  )

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      if (el.scrollHeight > el.clientHeight + 1) {
        setOverflows(true)
        return
      }

      const popup = el.closest('[data-slot="drawer-popup"]') as HTMLElement | null
      if (!popup) {
        setOverflows(false)
        return
      }

      const header = el.previousElementSibling as HTMLElement | null
      const headerHeight = header?.offsetHeight ?? 0
      const shell = el.closest('[data-slot="drawer-body-shell"]') as HTMLElement | null
      const shellTop = shell?.offsetTop ?? 0
      const available = popup.clientHeight - headerHeight - shellTop
      setOverflows(el.scrollHeight > available + 1)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    for (const child of el.children) {
      ro.observe(child)
    }
    const popup = el.closest('[data-slot="drawer-popup"]')
    if (popup) ro.observe(popup)
    return () => ro.disconnect()
  }, [children])

  return (
    <div
      ref={setRef}
      data-overflows={overflows ? "" : undefined}
      className={cn(
        "min-h-0 shrink overscroll-contain",
        overflows && "flex-1 overflow-y-auto",
        !overflows && "overflow-y-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

function DrawerContent({
  className,
  children,
  keyboardAware = false,
  ...props
}: DrawerPrimitive.Popup.Props & {
  keyboardAware?: boolean
}) {
  const { hasSnapPoints, modal, showSwipeHandle, swipeDirection } = useDrawer()
  const swipeAxis =
    swipeDirection === "down" || swipeDirection === "up" ? "y" : "x"

  return (
    <DrawerPortal data-slot="drawer-portal">
      {modal === true && (
        <DrawerOverlay data-snap-points={hasSnapPoints ? "" : undefined} />
      )}
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        data-modal={modal}
        className="pointer-events-none fixed inset-0 z-50 select-none data-[modal=true]:pointer-events-auto"
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-popup"
          data-swipe-axis={swipeAxis}
          data-snap-points={hasSnapPoints ? "" : undefined}
          className={cn(
            "group/drawer-popup pointer-events-auto fixed z-50 m-(--drawer-inset,0px) flex h-(--drawer-content-height) max-h-(--drawer-content-max-height,none) min-h-0 w-(--drawer-content-width,auto) transform-[translate3d(var(--translate-x,0px),var(--translate-y,0px),0)_scale(var(--stack-scale))] flex-col border-0 bg-popover text-sm text-popover-foreground shadow-none ring-0 transition-[transform,height,opacity,filter] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform outline-none select-none [interpolate-size:allow-keywords] data-[swipe-direction=down]:rounded-t-xl data-[swipe-direction=left]:rounded-r-xl data-[swipe-direction=right]:rounded-l-xl data-[swipe-direction=up]:rounded-b-xl",
            "data-nested-drawer-open:overflow-hidden data-nested-drawer-open:brightness-95",
            "after:pointer-events-none after:absolute after:bg-(--drawer-bleed-background,var(--color-popover)) data-[swipe-axis=x]:after:inset-y-0 data-[swipe-axis=x]:after:w-(--bleed) data-[swipe-axis=y]:after:inset-x-0 data-[swipe-axis=y]:after:h-(--bleed) data-[swipe-direction=down]:after:top-full data-[swipe-direction=left]:after:right-full data-[swipe-direction=right]:after:left-full data-[swipe-direction=up]:after:bottom-full",
            "[--drawer-content-height:var(--drawer-height,auto)] data-[swipe-axis=x]:[--drawer-content-width:75%] data-[swipe-axis=y]:[--drawer-content-max-height:80dvh] data-[swipe-axis=y]:min-h-[30dvh] data-[swipe-axis=y]:data-snap-points:[--drawer-content-height:100dvh] data-[swipe-axis=x]:sm:[--drawer-content-width:24rem]",
            "[--bleed:3rem] [--peek:1rem] [--stack-height:var(--drawer-frontmost-height,var(--drawer-height,0px))] [--stack-peek-offset:max(0px,calc((var(--nested-drawers)-var(--stack-progress))*var(--peek)))] [--stack-progress:clamp(0,var(--drawer-swipe-progress),1)] [--stack-scale-base:max(0,calc(1-(var(--nested-drawers)*var(--stack-step))))] [--stack-scale:clamp(0,calc(var(--stack-scale-base)+(var(--stack-step)*var(--stack-progress))),1)] [--stack-shrink:calc(1-var(--stack-scale))] [--stack-step:0.05]",
            "data-ending-style:transform-(--closed-transform) data-ending-style:opacity-[0.9999] data-ending-style:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-nested-drawer-swiping:duration-0 data-ending-style:data-nested-drawer-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)] data-starting-style:transform-(--closed-transform) data-swiping:duration-0 data-ending-style:data-swiping:duration-[calc(var(--drawer-swipe-strength)*400ms)]",
            "data-[swipe-axis=y]:inset-x-0 data-[swipe-axis=y]:data-nested-drawer-open:h-(--stack-height)",
            "data-[swipe-axis=x]:inset-y-0 data-[swipe-axis=x]:flex-row",
            "data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:origin-bottom data-[swipe-direction=down]:[--closed-transform:translate3d(0,calc(100%+var(--drawer-inset,0px)+2px),0)] data-[swipe-direction=down]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)-var(--stack-peek-offset)-(var(--stack-shrink)*var(--stack-height)))]",
            "data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:origin-top data-[swipe-direction=up]:[--closed-transform:translate3d(0,calc(-100%-var(--drawer-inset,0px)-2px),0)] data-[swipe-direction=up]:[--translate-y:calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y)+var(--stack-peek-offset)+(var(--stack-shrink)*var(--stack-height)))]",
            "data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:origin-left data-[swipe-direction=left]:[--closed-transform:translate3d(calc(-100%-var(--drawer-inset,0px)-2px),0,0)] data-[swipe-direction=left]:[--translate-x:calc(var(--drawer-swipe-movement-x)+var(--stack-peek-offset)+(var(--stack-shrink)*100%))]",
            "data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:origin-right data-[swipe-direction=right]:[--closed-transform:translate3d(calc(100%+var(--drawer-inset,0px)+2px),0,0)] data-[swipe-direction=right]:[--translate-x:calc(var(--drawer-swipe-movement-x)-var(--stack-peek-offset)-(var(--stack-shrink)*100%))]",
            keyboardAware && keyboardAwareDrawerContentClassName,
            className
          )}
          {...props}
        >
          {showSwipeHandle && <DrawerSwipeHandle />}
          <DrawerPrimitive.Content
            data-slot="drawer-content"
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden overscroll-contain rounded-[inherit] transition-opacity duration-300 ease-[cubic-bezier(0.45,1.005,0,1.005)] select-text group-data-nested-drawer-open/drawer-popup:opacity-0 group-data-nested-drawer-swiping/drawer-popup:opacity-100 group-data-swiping/drawer-popup:select-none"
            )}
          >
            <div
              data-slot="drawer-body-shell"
              className={cn(
                "flex min-h-0 w-full flex-1 flex-col pt-3",
                drawerSafeAreaBottomClassName
              )}
            >
              {children}
            </div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex shrink-0 flex-col gap-0.5 border-0 border-b-0 p-4 pb-0 shadow-none outline-none ring-0 ring-offset-0 group-data-[swipe-direction=down]/drawer-popup:text-center group-data-[swipe-direction=up]/drawer-popup:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn(
        "mt-auto flex shrink-0 flex-col gap-2 border-0 border-t-0 p-4 pt-0 shadow-none outline-none ring-0 ring-offset-0",
        className
      )}
      {...props}
    />
  )
}

function DrawerTitle({ className, ...props }: DrawerPrimitive.Title.Props) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-heading", drawerTitleClassName, className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: DrawerPrimitive.Description.Props) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn(
        "border-0 text-sm text-balance text-muted-foreground shadow-none outline-none ring-0 ring-offset-0",
        className
      )}
      {...props}
    />
  )
}

export {
  Drawer,
  KeyboardAwareDrawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerSwipeHandle,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerScrollRegion,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
