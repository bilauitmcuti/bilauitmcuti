export function PublicHolidayHeader() {
  return (
    <div className="flex flex-col items-start gap-[2px] transition-none">
      <span className="mb-2 whitespace-nowrap rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-foreground">
        Malaysia
      </span>
      <h1 className="mb-2 text-4xl font-semibold leading-[2.5rem] tracking-tight text-foreground sm:text-5xl">
        Public <span className="text-[#10b981]">Holiday</span>
      </h1>
      <div
        className="flex flex-wrap gap-2 text-sm"
        role="list"
        aria-label="Public holiday legend"
      >
        <div className="flex items-center gap-2" role="listitem">
          <div className="h-2 w-2 rounded-full bg-[#10b981]" aria-hidden="true" />
          <span className="text-muted-foreground">Public Holiday</span>
        </div>
        <div className="flex items-center gap-2" role="listitem">
          <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
          <span className="text-muted-foreground">Weekend</span>
        </div>
      </div>
    </div>
  );
}
