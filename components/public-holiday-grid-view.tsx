"use client";

import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PublicHolidayItem } from "@/lib/public-holiday-types";

interface PublicHolidayGridViewProps {
  holidays: PublicHolidayItem[];
  stateLabelMap: Map<string, string>;
  initialCurrentDate: string;
  weekendMode: "sun" | "mon";
  showCountdown: boolean;
}

function getYearForCalendar(holidays: PublicHolidayItem[], initialCurrentDate: string): number {
  const firstHolidayDate = holidays[0]?.date;
  const parsed = firstHolidayDate ? Number(firstHolidayDate.slice(0, 4)) : Number(initialCurrentDate.slice(0, 4));
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return new Date().getFullYear();
}

function getMonthsForYear(year: number): Array<{ month: number; year: number }> {
  return Array.from({ length: 12 }, (_, index) => ({
    year,
    month: index + 1,
  }));
}

export function PublicHolidayGridView({
  holidays,
  stateLabelMap,
  initialCurrentDate,
  weekendMode,
  showCountdown,
}: PublicHolidayGridViewProps) {
  const calendarYear = useMemo(
    () => getYearForCalendar(holidays, initialCurrentDate),
    [holidays, initialCurrentDate]
  );
  const months = useMemo(
    () => getMonthsForYear(calendarYear),
    [calendarYear]
  );

  const holidayDateMap = useMemo(() => {
    const map = new Map<string, PublicHolidayItem[]>();
    holidays.forEach((holiday) => {
      const existing = map.get(holiday.date) ?? [];
      existing.push(holiday);
      map.set(holiday.date, existing);
    });
    return map;
  }, [holidays]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {months.map(({ month, year }) => {
          const daysInMonth = new Date(year, month, 0).getDate();
          const firstDay = new Date(year, month - 1, 1).getDay();
          const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
          const cells: Array<number | null> = [];
          for (let i = 0; i < adjustedFirstDay; i += 1) cells.push(null);
          for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

          return (
            <div key={`${year}-${month}`}>
              <div className="pb-4 pt-3">
                <h3 className="text-xl font-semibold text-foreground">
                  {monthNames[month - 1]} {year}
                </h3>
              </div>
              <div className="mb-1 grid grid-cols-7 gap-0.5 text-center text-xs font-semibold text-muted-foreground">
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((day, index) => {
                  if (!day) return <div key={index} className="h-12" />;
                  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayHolidays = holidayDateMap.get(dateStr) ?? [];
                  const isHoliday = dayHolidays.length > 0;
                  const isCurrentDate = dateStr === initialCurrentDate;
                  const dayOfWeek = new Date(year, month - 1, day).getDay();
                  const isWeekend =
                    weekendMode === "mon"
                      ? dayOfWeek === 5 || dayOfWeek === 6
                      : dayOfWeek === 0 || dayOfWeek === 6;
                  const cellClassName = `flex h-12 cursor-default flex-col items-center justify-center rounded-lg border text-sm font-semibold ${
                    isHoliday
                      ? "bg-green-100 dark:bg-green-900/30"
                      : isWeekend
                        ? "bg-gray-100 dark:bg-gray-900/40"
                        : "bg-transparent"
                  } ${
                    isCurrentDate
                      ? "border-[#10b981]"
                      : isHoliday
                        ? "border-transparent"
                        : "border-transparent"
                  }`;

                  const cellInner = (
                    <>
                      <span className="text-foreground">{day}</span>
                      {isHoliday ? (
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                      ) : null}
                    </>
                  );

                  if (!isHoliday) {
                    return (
                      <div key={index} className={cellClassName}>
                        {cellInner}
                      </div>
                    );
                  }

                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <div className={cellClassName}>{cellInner}</div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={6}
                        className="max-w-[min(calc(100vw-2rem),320px)] border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md"
                      >
                        <div className="space-y-2">
                          {dayHolidays.map((item) => {
                            const statesText = item.states
                              .map((s) => stateLabelMap.get(s) ?? s)
                              .join(", ");
                            const scopeText =
                              item.scope === "federal"
                                ? "Faderal"
                                : item.scope === "both"
                                  ? statesText
                                    ? `Faderal, ${statesText}`
                                    : "Faderal"
                                  : statesText;
                            const countdownText = (() => {
                              if (!showCountdown) return null;
                              const holidayDate = new Date(`${item.date}T00:00:00Z`);
                              const todayDate = new Date(`${initialCurrentDate}T00:00:00Z`);
                              const diffDays = Math.floor(
                                (holidayDate.getTime() - todayDate.getTime()) / 86400000
                              );
                              if (diffDays <= 0) return null;
                              return diffDays === 1 ? "In 1 day" : `In ${diffDays} days`;
                            })();
                            return (
                              <div key={item.id} className="pb-1">
                                <p className="font-medium leading-snug">{item.name}</p>
                                {scopeText ? (
                                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    {scopeText}
                                  </p>
                                ) : null}
                                {countdownText ? (
                                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                    {countdownText}
                                  </p>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </TooltipProvider>
  );
}
