'use client';

import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { CalendarHeader } from '@/components/calendar-header';
import { CalendarControls } from '@/components/calendar-controls';
import { ListView } from '@/components/list-view';
import { GridView } from '@/components/grid-view';
import { getProgramFromRoute } from '@/lib/route-utils';
import type { ViewMode, Theme } from '@/app/page';

interface SharedCalendarLayoutProps {
  children?: React.ReactNode;
  viewMode: ViewMode;
  programFromRoute: string;
}

export function SharedCalendarLayout({ 
  viewMode, 
  programFromRoute 
}: SharedCalendarLayoutProps) {
  const pathname = usePathname();
  
  // Determine program from route
  // For homepage (/) or /list, use programFromRoute (which should be "All")
  // For /[program] or /[program]/list, extract the program segment
  let routeSegment: string | null = null;
  if (pathname) {
    const segments = pathname.split('/').filter(Boolean);
    // If first segment is "list", it's /list (All programs)
    // Otherwise, first segment is the program route
    if (segments.length > 0 && segments[0] !== 'list') {
      routeSegment = segments[0];
    }
  }
  
  // Use routeSegment if available, otherwise fall back to programFromRoute
  // programFromRoute is passed from the page component and should be the program slug
  const selectedProgram = getProgramFromRoute(routeSegment || (programFromRoute && programFromRoute !== 'All' ? programFromRoute : null));
  
  // Initialize filter states synchronously from DOM data attribute (set by layout.tsx script)
  // This MUST run synchronously during component initialization, before first render
  // The blocking script in layout.tsx sets data-filters attribute before React hydration
  const getInitialFilterState = () => {
    if (typeof window === 'undefined') {
      // Server-side: return defaults (will be overridden on client)
      return {
        showKKT: false,
        showRegistration: false,
        showLecture: true,
        showSemesterPendek: false,
        showKuliahIntersesi: false,
        showExamination: true,
        showOthersExams: false,
        showBreak: true,
      };
    }
    
    // Client-side: Read from data attribute set by blocking script in layout.tsx
    // This attribute is set BEFORE React hydration, ensuring correct values on first render
    try {
      const filtersAttr = document.documentElement.getAttribute('data-filters');
      if (filtersAttr) {
        const filters = JSON.parse(filtersAttr);
        // Parse each filter value (they're stored as JSON strings)
        return {
          showKKT: JSON.parse(filters.showKKT),
          showRegistration: JSON.parse(filters.showRegistration),
          showLecture: JSON.parse(filters.showLecture),
          showSemesterPendek: JSON.parse(filters.showSemesterPendek),
          showKuliahIntersesi: JSON.parse(filters.showKuliahIntersesi),
          showExamination: JSON.parse(filters.showExamination),
          showOthersExams: JSON.parse(filters.showOthersExams),
          showBreak: JSON.parse(filters.showBreak),
        };
      }
    } catch (e) {
      // If data attribute parsing fails, fall through to localStorage fallback
    }
    
    // Fallback to localStorage (shouldn't be needed if script runs correctly)
    try {
      return {
        showKKT: JSON.parse(localStorage.getItem('showKKT') || 'false'),
        showRegistration: JSON.parse(localStorage.getItem('showRegistration') || 'false'),
        showLecture: JSON.parse(localStorage.getItem('showLecture') || 'true'),
        showSemesterPendek: JSON.parse(localStorage.getItem('showSemesterPendek') || 'false'),
        showKuliahIntersesi: JSON.parse(localStorage.getItem('showKuliahIntersesi') || 'false'),
        showExamination: JSON.parse(localStorage.getItem('showExamination') || 'true'),
        showOthersExams: JSON.parse(localStorage.getItem('showOthersExams') || 'false'),
        showBreak: JSON.parse(localStorage.getItem('showBreak') || 'true'),
      };
    } catch {
      // Final fallback: return defaults
      return {
        showKKT: false,
        showRegistration: false,
        showLecture: true,
        showSemesterPendek: false,
        showKuliahIntersesi: false,
        showExamination: true,
        showOthersExams: false,
        showBreak: true,
      };
    }
  };

  const initialFilters = getInitialFilterState();
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:103',message:'initialFilters on client',data:initialFilters,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  }
  // #endregion

  // Get initial theme synchronously from DOM (set by layout.tsx script before React hydration)
  // CRITICAL: Server and client MUST use the same logic to prevent hydration mismatch
  // Server always returns 'dark' (default), client reads from DOM class set by blocking script
  const getInitialTheme = (): Theme => {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:117',message:'getInitialTheme entry',data:{isServer:typeof window==='undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    }
    // #endregion
    
    if (typeof window === 'undefined') {
      // Server-side: Always return 'dark' as default to match blocking script default
      // The blocking script will set the correct theme class before hydration
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:125',message:'getInitialTheme server return dark',data:{returnValue:'dark'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      return 'dark';
    }
    
    // Client-side: Read from DOM class FIRST (set by blocking script before React hydration)
    // This ensures server and client render with the same theme on first render
    const htmlElement = document.documentElement;
    const hasLight = htmlElement.classList.contains('light');
    const hasDark = htmlElement.classList.contains('dark');
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:135',message:'getInitialTheme DOM class check',data:{hasLight,hasDark,className:htmlElement.className},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    if (hasLight) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:140',message:'getInitialTheme return light from DOM',data:{returnValue:'light'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
      // #endregion
      return 'light';
    }
    
    // Default to dark (matches server default and blocking script default)
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:147',message:'getInitialTheme return dark default',data:{returnValue:'dark'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    return 'dark';
  };

  const initialTheme = getInitialTheme();
  
  // #region agent log
  if (typeof window !== 'undefined') {
    const domTheme = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:151',message:'initialTheme value',data:{initialTheme,domTheme,matches:initialTheme===domTheme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  }
  // #endregion
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:118',message:'initialTheme on client',data:{initialTheme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
  }
  // #endregion

  // State management for settings
  // Initialize with values from DOM/data attributes to prevent flicker on first render
  // All values are read synchronously before React's first render
  const [showKKT, setShowKKT] = useState(initialFilters.showKKT);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:177',message:'theme state initialized',data:{initialTheme,themeState:theme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
  }
  // #endregion
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:155',message:'theme state initialized',data:{theme,initialTheme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  }
  // #endregion
  const [showRegistration, setShowRegistration] = useState(initialFilters.showRegistration);
  const [showLecture, setShowLecture] = useState(initialFilters.showLecture);
  const [showSemesterPendek, setShowSemesterPendek] = useState(initialFilters.showSemesterPendek);
  const [showKuliahIntersesi, setShowKuliahIntersesi] = useState(initialFilters.showKuliahIntersesi);
  const [showExamination, setShowExamination] = useState(initialFilters.showExamination);
  const [showOthersExams, setShowOthersExams] = useState(initialFilters.showOthersExams);
  const [showBreak, setShowBreak] = useState(initialFilters.showBreak);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('Academic Calendar');
  const [selectedStates, setSelectedStates] = useState<string[]>(initialFilters.showKKT ? ['Kedah', 'Kelantan', 'Terengganu'] : []);

  // Verify theme sync on mount - ensure DOM and state match localStorage
  // CRITICAL: This runs AFTER first render, so it should NOT change theme state
  // to prevent hydration mismatch. Only sync DOM if needed.
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:206',message:'useLayoutEffect theme sync entry',data:{currentTheme:theme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    
    // Read theme from localStorage (source of truth)
    try {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:212',message:'useLayoutEffect localStorage read',data:{savedTheme,currentTheme:theme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        // Ensure DOM matches localStorage IMMEDIATELY (blocking script should have done this, but double-check)
        const htmlElement = document.documentElement;
        const currentDomTheme = htmlElement.classList.contains('light') ? 'light' : 'dark';
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:220',message:'useLayoutEffect DOM theme check',data:{savedTheme,currentTheme:theme,currentDomTheme,needsUpdate:currentDomTheme!==savedTheme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
        
        if (currentDomTheme !== savedTheme) {
          // DOM doesn't match localStorage - update DOM (blocking script might have failed)
          htmlElement.classList.remove('dark', 'light');
          htmlElement.classList.add(savedTheme);
          
          // Set inline styles as backup to prevent flash
          if (savedTheme === 'light') {
            htmlElement.style.backgroundColor = '#ffffff';
            htmlElement.style.color = '#1a1a1a';
          } else {
            htmlElement.style.backgroundColor = '#1a1a1a';
            htmlElement.style.color = '#ffffff';
          }
        }
        
        // CRITICAL: Only update state if it's different AND we're sure it's safe
        // Don't update during initial render to prevent hydration mismatch
        // The state should already match from getInitialTheme() which reads from DOM
        if (theme !== savedTheme && savedTheme === initialTheme) {
          // Only update if savedTheme matches what we initialized with (from DOM)
          // This means blocking script set it correctly, and we just need to sync state
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:238',message:'useLayoutEffect setTheme called',data:{oldTheme:theme,newTheme:savedTheme,initialTheme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
          // #endregion
          setTheme(savedTheme);
        }
      } else {
        // No saved theme, ensure dark theme is applied (matches server default)
        const htmlElement = document.documentElement;
        if (!htmlElement.classList.contains('dark')) {
          htmlElement.classList.remove('light');
          htmlElement.classList.add('dark');
          htmlElement.style.backgroundColor = '#1a1a1a';
          htmlElement.style.color = '#ffffff';
        }
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:250',message:'useLayoutEffect no saved theme, default dark',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion
      }
    } catch (e) {
      // If localStorage fails, ensure DOM and state are consistent with dark theme
      const htmlElement = document.documentElement;
      if (!htmlElement.classList.contains('dark')) {
        htmlElement.classList.remove('light');
        htmlElement.classList.add('dark');
        htmlElement.style.backgroundColor = '#1a1a1a';
        htmlElement.style.color = '#ffffff';
      }
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:260',message:'useLayoutEffect localStorage error',data:{error:String(e)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
    }
  }, []);

  // Mark as loaded after initial render (filters already initialized synchronously)
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Save preferences to localStorage and update HTML class
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('showKKT', JSON.stringify(showKKT));
    }
    // Sync showKKT with selectedStates
    if (showKKT) {
      setSelectedStates(['Kedah', 'Kelantan', 'Terengganu']);
    } else {
      setSelectedStates([]);
    }
  }, [showKKT, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      // Apply theme instantly without transition for immediate visual feedback
      // Save to localStorage first (source of truth)
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {
        // localStorage might not be available (e.g., private browsing)
        console.warn('Failed to save theme to localStorage:', e);
      }
      
      // Apply theme to DOM immediately
      const htmlEl = document.documentElement;
      htmlEl.classList.remove('dark', 'light');
      htmlEl.classList.add(theme);
    }
  }, [theme, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('showRegistration', JSON.stringify(showRegistration));
    }
  }, [showRegistration, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('showLecture', JSON.stringify(showLecture));
    }
  }, [showLecture, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('showSemesterPendek', JSON.stringify(showSemesterPendek));
    }
  }, [showSemesterPendek, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('showKuliahIntersesi', JSON.stringify(showKuliahIntersesi));
    }
  }, [showKuliahIntersesi, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('showExamination', JSON.stringify(showExamination));
    }
  }, [showExamination, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('showOthersExams', JSON.stringify(showOthersExams));
    }
  }, [showOthersExams, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('showBreak', JSON.stringify(showBreak));
    }
  }, [showBreak, isLoaded]);

  const bgClass = theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-[#1a1a1a]';

  // Optimized theme change handler - instant update without transition delay
  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  return (
    <div 
      className={`min-h-screen ${bgClass}`} 
      suppressHydrationWarning
      style={{
        // Inline style to prevent flash during hydration
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
      }}
    >
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-4">
        {/* Header */}
        <CalendarHeader theme={theme} />

        {/* Controls */}
        {/* #region agent log */}
        {typeof window !== 'undefined' && fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'shared-calendar-layout.tsx:374',message:'CalendarControls theme prop',data:{theme},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{}) && null}
        {/* #endregion */}
        <CalendarControls
          selectedProgram={selectedProgram}
          viewMode={viewMode}
          showKKT={showKKT}
          onShowKKTChange={setShowKKT}
          theme={theme}
          onThemeChange={handleThemeChange}
          showRegistration={showRegistration}
          onShowRegistrationChange={setShowRegistration}
          showLecture={showLecture}
          onShowLectureChange={setShowLecture}
          showSemesterPendek={showSemesterPendek}
          onShowSemesterPendekChange={setShowSemesterPendek}
          showKuliahIntersesi={showKuliahIntersesi}
          onShowKuliahIntersesiChange={setShowKuliahIntersesi}
          showExamination={showExamination}
          onShowExaminationChange={setShowExamination}
          showOthersExams={showOthersExams}
          onShowOthersExamsChange={setShowOthersExams}
          showBreak={showBreak}
          onShowBreakChange={setShowBreak}
          currentMonth={currentMonth}
        />

        {/* Views - Use key to maintain component identity during route transitions */}
        <div className="mt-0 min-h-[400px]">
          {viewMode === 'list' ? (
            <ListView 
              key={`list-${selectedProgram}`}
              selectedProgram={selectedProgram} 
              showKKT={showKKT}
              theme={theme}
              showRegistration={showRegistration}
              showLecture={showLecture}
              showSemesterPendek={showSemesterPendek}
              showKuliahIntersesi={showKuliahIntersesi}
              showExamination={showExamination}
              showOthersExams={showOthersExams}
              showBreak={showBreak}
              onMonthChange={setCurrentMonth}
              selectedStates={selectedStates}
            />
          ) : (
            <GridView 
              key={`grid-${selectedProgram}`}
              selectedProgram={selectedProgram} 
              showKKT={showKKT}
              theme={theme}
              showRegistration={showRegistration}
              showLecture={showLecture}
              showSemesterPendek={showSemesterPendek}
              showKuliahIntersesi={showKuliahIntersesi}
              showExamination={showExamination}
              showOthersExams={showOthersExams}
              onMonthChange={setCurrentMonth}
              showBreak={showBreak}
              selectedStates={selectedStates}
            />
          )}
        </div>
      </div>
    </div>
  );
}
