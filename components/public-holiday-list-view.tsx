"use client";

import { useMemo } from "react";
import type { PublicHolidayItem } from "@/lib/public-holiday-types";

interface PublicHolidayListViewProps {
  holidays: PublicHolidayItem[];
  stateLabelMap: Map<string, string>;
  initialCurrentDate: string;
  showCountdown: boolean;
}

export function PublicHolidayListView({
  holidays,
  stateLabelMap,
  initialCurrentDate,
  showCountdown,
}: PublicHolidayListViewProps) {
  const calendarYear = useMemo(() => {
    const fromHoliday = holidays[0]?.date ? Number(holidays[0].date.slice(0, 4)) : null;
    const fromCurrentDate = Number(initialCurrentDate.slice(0, 4));
    if (fromHoliday && Number.isFinite(fromHoliday)) return fromHoliday;
    if (Number.isFinite(fromCurrentDate)) return fromCurrentDate;
    return new Date().getFullYear();
  }, [holidays, initialCurrentDate]);

  const monthKeys = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-MY", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return Array.from({ length: 12 }, (_, index) =>
      formatter.format(new Date(Date.UTC(calendarYear, index, 1)))
    );
  }, [calendarYear]);

  const groupedByMonth = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("en-MY", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
    return holidays.reduce(
      (acc, item) => {
        const [year, month, day] = item.date.split("-").map(Number);
        const key = formatter.format(new Date(Date.UTC(year, month - 1, day)));
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, PublicHolidayItem[]>
    );
  }, [holidays]);

  return (
    <div className="space-y-8">
      {monthKeys.map((monthKey) => {
        const monthHolidays = groupedByMonth[monthKey] ?? [];
        if (!monthHolidays.length) return null;

        return (
          <div key={monthKey}>
            <div className="pb-4 pt-3">
              <h3 className="text-xl font-semibold text-foreground">{monthKey}</h3>
            </div>
            <div className="space-y-4">
              {monthHolidays.map((holiday) => {
              const [year, month, day] = holiday.date.split("-").map(Number);
              const dateObj = new Date(Date.UTC(year, month - 1, day));
              const dayName = dateObj.toLocaleString("en-US", {
                weekday: "short",
                timeZone: "UTC",
              });
              const monthShort = dateObj.toLocaleString("en-US", {
                month: "short",
                timeZone: "UTC",
              });
              const isCurrentDate = holiday.date === initialCurrentDate;
              const statesLabel = holiday.states
                .map((state) => stateLabelMap.get(state) ?? state)
                .join(", ");
              const scopeLabel =
                holiday.scope === "federal"
                  ? "Faderal"
                  : holiday.scope === "both"
                    ? statesLabel
                      ? `Faderal, ${statesLabel}`
                      : "Faderal"
                    : statesLabel;
              const countdownText = (() => {
                if (!showCountdown) return null;
                const holidayDate = new Date(`${holiday.date}T00:00:00Z`);
                const todayDate = new Date(`${initialCurrentDate}T00:00:00Z`);
                const diffDays = Math.floor((holidayDate.getTime() - todayDate.getTime()) / 86400000);
                if (diffDays <= 0) return null;
                return diffDays === 1 ? "In 1 day" : `In ${diffDays} days`;
              })();

              return (
                <div
                  key={holiday.id}
                  className={`flex gap-4 rounded-lg p-3 px-0 ${
                    isCurrentDate ? "bg-green-50 dark:bg-green-950/20" : ""
                  }`}
                >
                  <div className="flex w-20 flex-col items-start text-xs text-muted-foreground">
                    <div>{dayName}</div>
                    <div className="text-sm font-medium text-foreground">
                      {day} {monthShort}
                    </div>
                    {countdownText ? <div className="mt-0.5 text-xs">{countdownText}</div> : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="mb-1 flex items-start gap-2">
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#10b981]" />
                      <div className="min-w-0">
                        <h3 className="text-base font-medium leading-6 text-foreground">
                          {holiday.name}
                        </h3>
                        {scopeLabel ? (
                          <p className="mt-1 text-sm leading-5 text-muted-foreground">
                            {scopeLabel}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
