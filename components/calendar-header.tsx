export function CalendarHeader() {
  const textColor = 'text-[#1a1a1a]';
  const mutedColor = 'text-gray-600';
  
  // Get current year in Malaysia timezone (UTC+8)
  const currentYear = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"})).getFullYear();

  return (
    <div suppressHydrationWarning>
      {/* Year label */}
      <div className={`mb-2 text-sm ${mutedColor}`} suppressHydrationWarning>{currentYear}</div>

      {/* Main heading with custom typography */}
      <h1 className={`mb-6 font-semibold leading-[2.5rem] tracking-tight text-5xl ${textColor}`} suppressHydrationWarning>
        Bila <span className="text-[#8b5cf6]">UiTM</span> Cuti?
      </h1>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm" role="list" aria-label="Activity type legend" suppressHydrationWarning>
        <div className="flex items-center gap-2" role="listitem">
          <div className="h-2 w-2 rounded-full bg-[#d1d5db]" aria-hidden="true" />
          <span className={mutedColor} suppressHydrationWarning>Registration</span>
        </div>
        <div className="flex items-center gap-2" role="listitem">
          <div className="h-2 w-2 rounded-full bg-[#8b5cf6]" aria-hidden="true" />
          <span className={mutedColor} suppressHydrationWarning>Lecture</span>
        </div>
        <div className="flex items-center gap-2" role="listitem">
          <div className="h-2 w-2 rounded-full bg-[#dc2626]" aria-hidden="true" />
          <span className={mutedColor} suppressHydrationWarning>Examination</span>
        </div>
        <div className="flex items-center gap-2" role="listitem">
          <div className="h-2 w-2 rounded-full bg-[#10b981]" aria-hidden="true" />
          <span className={mutedColor} suppressHydrationWarning>Break</span>
        </div>
      </div>
    </div>
  );
}
