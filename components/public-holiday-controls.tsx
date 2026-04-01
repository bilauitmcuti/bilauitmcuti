"use client";

import { useState } from "react";
import { Calendar, ChevronDown, ChevronUp, List, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PublicHolidayMeta, PublicHolidayRouteSelection } from "@/lib/public-holiday-types";
import type { PublicHolidayViewMode } from "@/lib/public-holiday-route-utils";
import { getSelectionLabel } from "@/lib/public-holiday-route-utils";

interface PublicHolidayControlsProps {
  viewMode: PublicHolidayViewMode;
  selected: PublicHolidayRouteSelection;
  meta: PublicHolidayMeta;
  onViewModeChange: (mode: PublicHolidayViewMode) => void;
  onSelectionChange: (selection: PublicHolidayRouteSelection) => void;
  showCountdown: boolean;
  onShowCountdownChange: (show: boolean) => void;
  weekendMode: "sun" | "mon";
  onWeekendModeChange: (mode: "sun" | "mon") => void;
}

export function PublicHolidayControls({
  viewMode,
  selected,
  meta,
  onViewModeChange,
  onSelectionChange,
  showCountdown,
  onShowCountdownChange,
  weekendMode,
  onWeekendModeChange,
}: PublicHolidayControlsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const iconInactiveClass = "text-muted-foreground [&_svg]:text-muted-foreground";
  const iconActiveClass = "text-foreground [&_svg]:text-foreground";
  const iconBaseClass =
    "nav-icon-btn bg-transparent hover:!bg-transparent dark:hover:!bg-transparent transition-none !h-[38px] !w-[38px] !min-h-[38px] !max-h-[38px] !p-0 flex items-center justify-center hover:!h-[38px] hover:!min-h-[38px] hover:!max-h-[38px] hover:!p-0 active:!h-[38px] active:!min-h-[38px] active:!max-h-[38px] active:!p-0 [&:hover]:!h-[38px] [&:hover]:!bg-transparent [&:active]:!h-[38px]";

  return (
    <div className="sticky top-0 z-40 bg-background -mx-4 sm:-mx-6 lg:-mx-4 px-4 sm:px-6 lg:px-4 transition-none overflow-visible calendar-controls-sticky">
      <div className="flex flex-row items-center justify-between gap-4 pt-8 w-full px-0 min-h-14 pb-1 bg-background transition-none">
        <div className="px-0">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-fit max-w-[180px] sm:max-w-[260px] md:max-w-[300px] min-w-0 overflow-hidden !h-[38px] !py-1 border bg-secondary dark:bg-[#2A2A2A] hover:!bg-secondary dark:hover:!bg-[#2A2A2A] active:!bg-secondary dark:active:!bg-[#2A2A2A] border-border dark:!border-zinc-600 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-foreground flex items-center justify-between gap-2 rounded-lg transition-none"
            >
              <span className="block min-w-0 flex-1 truncate text-left">
                {getSelectionLabel(selected, meta)}
              </span>
              {dropdownOpen ? (
                <ChevronUp className="h-6 w-6 shrink-0" strokeWidth={2} />
              ) : (
                <ChevronDown className="h-6 w-6 shrink-0" strokeWidth={2} />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="min-w-[220px] overflow-y-auto overscroll-contain touch-pan-y bg-popover p-3 dark:bg-[#2A2A2A] max-lg:max-h-[min(80vh,28rem)] lg:max-h-none lg:overflow-visible"
          >
            <DropdownMenuItem
              className="cursor-pointer bg-transparent font-medium data-[highlighted]:bg-transparent data-[highlighted]:text-foreground"
              onClick={() => onSelectionChange({ scope: "all", state: null })}
            >
              All
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer bg-transparent font-medium data-[highlighted]:bg-transparent data-[highlighted]:text-foreground"
              onClick={() => onSelectionChange({ scope: "federal", state: null })}
            >
              Federal
            </DropdownMenuItem>
            <div className="my-2 h-px w-[calc(100%+1.5rem)] -mx-3 bg-border" />
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">State</div>
            {meta.stateOptions.map((state) => (
              <DropdownMenuItem
                key={state.value}
                className="cursor-pointer bg-transparent font-medium data-[highlighted]:bg-transparent data-[highlighted]:text-foreground"
                onClick={() =>
                  onSelectionChange({
                    scope: "state",
                    state: state.value,
                  })
                }
              >
                {state.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        </div>

        <div className="px-0 flex items-center justify-center">
        <div className="flex items-center justify-center gap-0 rounded-lg p-1 w-fit border border-border bg-secondary dark:bg-[#2A2A2A] transition-none h-[38px]">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange("grid")}
            title="Grid View"
            className={`${iconBaseClass} ${viewMode === "grid" ? iconActiveClass : iconInactiveClass}`}
          >
            <Calendar className="h-6 w-6" strokeWidth={2} />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange("list")}
            title="List View"
            className={`${iconBaseClass} ${viewMode === "list" ? iconActiveClass : iconInactiveClass}`}
          >
            <List className="h-6 w-6" strokeWidth={2} />
          </Button>
          <div className="mx-1 h-full w-px bg-border" />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                title="Settings"
                className={`${iconBaseClass} ${iconInactiveClass}`}
              >
                <Settings className="h-6 w-6" strokeWidth={2} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] gap-3 p-3" align="end">
              <label className="flex cursor-pointer items-center justify-between py-0.5">
                <span className="text-sm font-medium text-foreground">Show Countdown</span>
                <div
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    showCountdown ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full shadow-sm ${
                      showCountdown ? "bg-background" : "bg-background dark:bg-foreground"
                    } ${showCountdown ? "translate-x-5" : "translate-x-[2px]"}`}
                  />
                  <input
                    type="checkbox"
                    checked={showCountdown}
                    onChange={(e) => onShowCountdownChange(e.target.checked)}
                    className="sr-only"
                    aria-label="Toggle countdown"
                  />
                </div>
              </label>
              <ThemeToggle />
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">Weekend Mode</p>
                <Tabs
                  value={weekendMode}
                  onValueChange={(value) => onWeekendModeChange(value as "sun" | "mon")}
                  className="gap-0"
                >
                  <TabsList className="h-[42px]">
                    <TabsTrigger value="sun">Sun</TabsTrigger>
                    <TabsTrigger value="mon">Mon</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        </div>
      </div>
      <div className="calendar-controls-fade" />
    </div>
  );
}
