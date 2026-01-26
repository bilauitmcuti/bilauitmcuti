'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CalendarHeader } from '@/components/calendar-header';
import { CalendarControls } from '@/components/calendar-controls';
import { ListView } from '@/components/list-view';
import { GridView } from '@/components/grid-view';
import { getProgramFromRoute } from '@/lib/route-utils';
import type { ViewMode } from '@/app/page';

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
  // IMPORTANT: Server and client MUST use the same initial values to prevent hydration mismatch
  // CRITICAL: Client MUST use defaults on first render, then sync from localStorage AFTER hydration
  const getInitialFilterState = () => {
    // Use consistent defaults for both server and client initial render
    // This ensures server HTML matches client's first render exactly
    // Filters will be synced from localStorage AFTER hydration completes
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
  };

  const initialFilters = getInitialFilterState();

  // State management for settings
  // Initialize with values from DOM/data attributes to prevent flicker on first render
  // All values are read synchronously before React's first render
  const [showKKT, setShowKKT] = useState(initialFilters.showKKT);
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


  // Mark as loaded after initial render and sync filters from localStorage
  // CRITICAL: This runs AFTER hydration completes to prevent hydration mismatch
  // The initial render uses defaults to match server HTML exactly
  useEffect(() => {
    // Use requestAnimationFrame to ensure this runs after React hydration completes
    requestAnimationFrame(() => {
      setIsLoaded(true);
      
      // After hydration, sync filters from localStorage/data-filters to match user's saved preferences
      try {
        const filtersAttr = document.documentElement.getAttribute('data-filters');
        if (filtersAttr) {
          const filters = JSON.parse(filtersAttr);
          setShowKKT(JSON.parse(filters.showKKT));
          setShowRegistration(JSON.parse(filters.showRegistration));
          setShowLecture(JSON.parse(filters.showLecture));
          setShowSemesterPendek(JSON.parse(filters.showSemesterPendek));
          setShowKuliahIntersesi(JSON.parse(filters.showKuliahIntersesi));
          setShowExamination(JSON.parse(filters.showExamination));
          setShowOthersExams(JSON.parse(filters.showOthersExams));
          setShowBreak(JSON.parse(filters.showBreak));
        }
      } catch (e) {
        // If data attribute parsing fails, try localStorage directly
        try {
          setShowKKT(JSON.parse(localStorage.getItem('showKKT') || 'false'));
          setShowRegistration(JSON.parse(localStorage.getItem('showRegistration') || 'false'));
          setShowLecture(JSON.parse(localStorage.getItem('showLecture') || 'true'));
          setShowSemesterPendek(JSON.parse(localStorage.getItem('showSemesterPendek') || 'false'));
          setShowKuliahIntersesi(JSON.parse(localStorage.getItem('showKuliahIntersesi') || 'false'));
          setShowExamination(JSON.parse(localStorage.getItem('showExamination') || 'true'));
          setShowOthersExams(JSON.parse(localStorage.getItem('showOthersExams') || 'false'));
          setShowBreak(JSON.parse(localStorage.getItem('showBreak') || 'true'));
        } catch {
          // Keep defaults if all else fails
        }
      }
    });
  }, []);

  // Save all preferences to localStorage synchronously to prevent loss during navigation
  useEffect(() => {
    if (!isLoaded) return;
    
    // Save all settings in one go
    try {
      localStorage.setItem('showKKT', JSON.stringify(showKKT));
      localStorage.setItem('showRegistration', JSON.stringify(showRegistration));
      localStorage.setItem('showLecture', JSON.stringify(showLecture));
      localStorage.setItem('showSemesterPendek', JSON.stringify(showSemesterPendek));
      localStorage.setItem('showKuliahIntersesi', JSON.stringify(showKuliahIntersesi));
      localStorage.setItem('showExamination', JSON.stringify(showExamination));
      localStorage.setItem('showOthersExams', JSON.stringify(showOthersExams));
      localStorage.setItem('showBreak', JSON.stringify(showBreak));
      
      // Update data-filters attribute immediately for next component mount
      const filters = {
        showKKT: JSON.stringify(showKKT),
        showRegistration: JSON.stringify(showRegistration),
        showLecture: JSON.stringify(showLecture),
        showSemesterPendek: JSON.stringify(showSemesterPendek),
        showKuliahIntersesi: JSON.stringify(showKuliahIntersesi),
        showExamination: JSON.stringify(showExamination),
        showOthersExams: JSON.stringify(showOthersExams),
        showBreak: JSON.stringify(showBreak),
      };
      document.documentElement.setAttribute('data-filters', JSON.stringify(filters));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
    
    // Sync showKKT with selectedStates
    if (showKKT) {
      setSelectedStates(['Kedah', 'Kelantan', 'Terengganu']);
    } else {
      setSelectedStates([]);
    }
  }, [showKKT, showRegistration, showLecture, showSemesterPendek, showKuliahIntersesi, showExamination, showOthersExams, showBreak, isLoaded]);

  // Always use light theme - no theme switching
  const bgClass = 'bg-white text-[#1a1a1a]';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-4">
        {/* Header */}
        <CalendarHeader />

        {/* Controls */}
        <CalendarControls
          selectedProgram={selectedProgram}
          viewMode={viewMode}
          showKKT={showKKT}
          onShowKKTChange={setShowKKT}
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
