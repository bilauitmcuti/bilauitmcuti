'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { List, Settings, Sun, Moon, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { programOptions, allActivities } from '@/lib/data';
import { getRoutePath } from '@/lib/route-utils';
import type { ViewMode, Theme } from '@/app/page';
import type { ProgramValue } from '@/lib/route-utils';

interface CalendarControlsProps {
  selectedProgram: string;
  viewMode: ViewMode;
  showKKT: boolean;
  onShowKKTChange: (show: boolean) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  showRegistration: boolean;
  onShowRegistrationChange: (show: boolean) => void;
  showLecture: boolean;
  onShowLectureChange: (show: boolean) => void;
  showExamination: boolean;
  onShowExaminationChange: (show: boolean) => void;
  showOthersExams: boolean;
  onShowOthersExamsChange: (show: boolean) => void;
  showBreak: boolean;
  onShowBreakChange: (show: boolean) => void;
  showSemesterPendek: boolean;
  onShowSemesterPendekChange: (show: boolean) => void;
  showKuliahIntersesi: boolean;
  onShowKuliahIntersesiChange: (show: boolean) => void;
  currentMonth?: string;
}

export function CalendarControls({
  selectedProgram,
  viewMode,
  showKKT,
  onShowKKTChange,
  theme,
  onThemeChange,
  showRegistration,
  onShowRegistrationChange,
  showLecture,
  onShowLectureChange,
  showExamination,
  onShowExaminationChange,
  showOthersExams,
  onShowOthersExamsChange,
  showBreak,
  onShowBreakChange,
  showSemesterPendek,
  onShowSemesterPendekChange,
  showKuliahIntersesi,
  onShowKuliahIntersesiChange,
  currentMonth = 'Academic Calendar',
}: CalendarControlsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  // Prefetch routes on mount - only prefetch current view mode routes for faster switching
  useEffect(() => {
    // Prefetch all program routes for current view mode only (not both modes)
    programOptions.forEach((option) => {
      const currentPath = getRoutePath(option.value as ProgramValue, viewMode);
      router.prefetch(currentPath);
    });
  }, [router, viewMode]);

  // Handle program change - navigate instantly for smooth UX
  const handleProgramChange = useCallback((programValue: ProgramValue) => {
    const newPath = getRoutePath(programValue, viewMode);
    // Use replace instead of push for instant navigation without adding to history
    router.replace(newPath);
    setSelectOpen(false);
  }, [router, viewMode]);

  // Handle view mode change - navigate instantly for smooth UX
  const handleViewModeChange = useCallback((newViewMode: ViewMode) => {
    const programValue = selectedProgram as ProgramValue;
    const newPath = getRoutePath(programValue, newViewMode);
    // Use replace instead of push for instant navigation without adding to history
    router.replace(newPath);
  }, [router, selectedProgram]);

  // Check if app is installed as PWA
  useEffect(() => {
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isInFullScreenMode = document.fullscreenElement !== null;
    const isInMinimalUIMode = (window.navigator as any).standalone === true;
    
    if (isInStandaloneMode || isInFullScreenMode || isInMinimalUIMode) {
      setIsPWAInstalled(true);
    }
  }, []);

  const groupAOptions = programOptions.filter(p => p.group === 'A');
  const groupBOptions = programOptions.filter(p => p.group === 'B');
  
  // Get the current program label for display
  const currentProgramLabel = programOptions.find(p => p.value === selectedProgram)?.label || 'Foundation/Prof';
  const bgClass = theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-secondary bg-secondary/50' : 'border-gray-200 bg-gray-100';
  const textClass = theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]';
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'calendar-controls.tsx:119',message:'CalendarControls theme classes',data:{theme,bgClass,borderClass,textClass},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
  }
  // #endregion
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7244/ingest/256b6304-26dc-4efd-a8c7-f1d9375b8e0d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'calendar-controls.tsx:122',message:'CalendarControls theme prop received',data:{theme,borderClass,textClass},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
  }
  // #endregion

  // Determine current group based on selectedProgram
  const currentGroup = groupAOptions.some(p => p.value === selectedProgram) ? 'A' : 'B';

  // Check if certain activity types exist for the current group
  const hasSemesterPendek = allActivities.some(
    a => a.group === currentGroup && a.type === 'lecture' && a.name.includes('Semester Pendek')
  );
  const hasKuliahIntersesi = allActivities.some(
    a => a.group === currentGroup && a.type === 'lecture' && a.name.includes('Intersesi')
  );
  const hasOthersExams = allActivities.some(
    a => a.group === currentGroup && a.type === 'examination' && a.name.includes('Khas')
  );

  useEffect(() => {
    const handleScroll = () => {
      setScrolling(window.scrollY > 0);
      if (window.scrollY > 0) {
        setIsOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={`sticky top-0 z-40 ${bgClass} -mx-4 sm:-mx-6 lg:-mx-4 px-4 sm:px-6 lg:px-4`} 
      suppressHydrationWarning
      style={{
        // Inline style to prevent flash during hydration
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        color: theme === 'dark' ? '#ffffff' : '#1a1a1a',
      }}
    >
      <div 
        className={`flex flex-row items-center justify-between gap-4 pt-8 w-full px-0 min-h-14 pb-1 ${bgClass}`} 
        suppressHydrationWarning
        style={{
          // Inline style to prevent flash during hydration
          backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        }}
      >
        {/* Program selector - Left */}
        <div className="px-0">
          <Select value={selectedProgram} onValueChange={handleProgramChange} open={selectOpen} onOpenChange={setSelectOpen}>
            <SelectTrigger className={`w-[140px] !h-11 !py-1 border ${borderClass} ${textClass} truncate flex items-center justify-between [&>svg]:hidden rounded-lg`}>
              <span className="truncate text-left font-medium text-xs">
                {currentProgramLabel.substring(0, 12)}
              </span>
              <div className="flex-shrink-0 ml-2">
                {selectOpen ? (
                  <ChevronUp className="h-4 w-4 transition-transform duration-300" />
                ) : (
                  <ChevronDown className="h-4 w-4 transition-transform duration-300" />
                )}
              </div>
            </SelectTrigger>
            <SelectContent className={`min-w-[250px] pt-4 pb-4 pl-3 pr-3 ${theme === 'dark' ? 'bg-[#2a2a2a]' : 'bg-white'} border ${theme === 'dark' ? 'border-[#4a4a4a]' : 'border-gray-200'}`}>
              {/* Group A */}
              <div className="w-full">
                <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2`}>GROUP A</div>
                <div className="space-y-0">
                  {groupAOptions.map((option) => (
                    <div key={option.value} className="w-full py-0.5 cursor-pointer hover:bg-secondary/10 rounded-md transition-colors" onClick={() => {
                      handleProgramChange(option.value as ProgramValue);
                    }}>
                      <SelectItem value={option.value} className="w-full mb-0">
                        <div className={`font-medium text-sm ${textClass} truncate`}>{option.label}</div>
                      </SelectItem>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={`my-3 h-px ${theme === 'dark' ? 'bg-border' : 'bg-gray-200'}`} />
              
              {/* Group B */}
              <div className="w-full">
                <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-2`}>GROUP B</div>
                <div className="space-y-0">
                  {groupBOptions.map((option) => (
                    <div key={option.value} className="w-full py-0.5 cursor-pointer hover:bg-secondary/10 rounded-md transition-colors" onClick={() => {
                      handleProgramChange(option.value as ProgramValue);
                    }}>
                      <SelectItem value={option.value} className="w-full mb-0">
                        <div className={`font-medium text-sm ${textClass} truncate`}>{option.label}</div>
                      </SelectItem>
                    </div>
                  ))}
                </div>
              </div>
            </SelectContent>
          </Select>
        </div>
        {/* View controls and Settings combined - Right */}
        <div className="px-0">
          <div className={`flex gap-0 rounded-lg ${borderClass} p-1 w-fit`}>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleViewModeChange('grid')}
              className={`${viewMode === 'grid' ? (theme === 'dark' ? 'bg-secondary text-white' : 'bg-gray-200 text-[#1a1a1a]') : `bg-transparent ${theme === 'dark' ? 'text-muted-foreground hover:text-white' : 'text-gray-600 hover:text-[#1a1a1a]'}`}`}
              title="Grid View"
            >
              <Calendar className="h-5 w-5" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => handleViewModeChange('list')}
              className={`${viewMode === 'list' ? (theme === 'dark' ? 'bg-secondary text-white' : 'bg-gray-200 text-[#1a1a1a]') : `bg-transparent ${theme === 'dark' ? 'text-muted-foreground hover:text-white' : 'text-gray-600 hover:text-[#1a1a1a]'}`}`}
              title="List View"
            >
              <List className="h-5 w-5" />
            </Button>
            <div className={`mx-1 w-px ${theme === 'dark' ? 'bg-border' : 'bg-gray-300'}`} />
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`bg-transparent ${theme === 'dark' ? 'text-muted-foreground hover:text-white' : 'text-gray-600 hover:text-[#1a1a1a]'}`}
                  title="Settings"
                >
                  <Settings className="h-5 w-5 transition-colors duration-300" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className={`h-auto w-[300px] pt-4 pb-4 pl-4 z-50 border pr-4 ${theme === 'dark' ? 'border-[#4a4a4a] bg-[#2a2a2a]' : 'border-gray-200 bg-white'}`}
                side="bottom"
                align="end"
                sideOffset={12}
              >
                <div className="space-y-3">
                  {/* Activity Type Toggles */}
                  <div className="space-y-2">
                    <label className="flex items-center justify-between cursor-pointer py-0.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#d1d5db]" />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>Registration</span>
                      </div>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                        style={{backgroundColor: showRegistration ? '#2563eb' : (theme === 'dark' ? '#4a4a4a' : '#d1d5db')}}
                      >
                        <span
                          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                          style={{transform: showRegistration ? 'translateX(20px)' : 'translateX(2px)'}}
                        />
                        <input
                          type="checkbox"
                          checked={showRegistration}
                          onChange={(e) => onShowRegistrationChange(e.target.checked)}
                          className="sr-only"
                          aria-label="Toggle registration events"
                        />
                      </div>
                    </label>

                    <label className="flex items-center justify-between cursor-pointer py-0.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#8b5cf6]" />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>Lecture</span>
                      </div>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                        style={{backgroundColor: showLecture ? '#2563eb' : (theme === 'dark' ? '#4a4a4a' : '#d1d5db')}}
                      >
                        <span
                          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                          style={{transform: showLecture ? 'translateX(20px)' : 'translateX(2px)'}}
                        />
                        <input
                          type="checkbox"
                          checked={showLecture}
                          onChange={(e) => onShowLectureChange(e.target.checked)}
                          className="sr-only"
                          aria-label="Toggle lecture events"
                        />
                      </div>
                    </label>

                    {hasSemesterPendek && (
                    <label className="flex items-center justify-between cursor-pointer py-0.5 pl-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Semester Pendek</span>
                      </div>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                        style={{backgroundColor: showSemesterPendek ? '#2563eb' : (theme === 'dark' ? '#4a4a4a' : '#d1d5db')}}
                      >
                        <span
                          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                          style={{transform: showSemesterPendek ? 'translateX(20px)' : 'translateX(2px)'}}
                        />
                        <input
                          type="checkbox"
                          checked={showSemesterPendek}
                          onChange={(e) => onShowSemesterPendekChange(e.target.checked)}
                          className="sr-only"
                          aria-label="Toggle Semester Pendek events"
                        />
                      </div>
                    </label>
                    )}

                    {hasKuliahIntersesi && (
                    <label className="flex items-center justify-between cursor-pointer py-0.5 pl-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Kuliah Intersesi</span>
                      </div>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                        style={{backgroundColor: showKuliahIntersesi ? '#2563eb' : (theme === 'dark' ? '#4a4a4a' : '#d1d5db')}}
                      >
                        <span
                          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                          style={{transform: showKuliahIntersesi ? 'translateX(20px)' : 'translateX(2px)'}}
                        />
                        <input
                          type="checkbox"
                          checked={showKuliahIntersesi}
                          onChange={(e) => onShowKuliahIntersesiChange(e.target.checked)}
                          className="sr-only"
                          aria-label="Toggle Kuliah Intersesi events"
                        />
                      </div>
                    </label>
                    )}

                    <label className="flex items-center justify-between cursor-pointer py-0.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#dc2626]" />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>Examination</span>
                      </div>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                        style={{backgroundColor: showExamination ? '#2563eb' : (theme === 'dark' ? '#4a4a4a' : '#d1d5db')}}
                      >
                        <span
                          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                          style={{transform: showExamination ? 'translateX(20px)' : 'translateX(2px)'}}
                        />
                        <input
                          type="checkbox"
                          checked={showExamination}
                          onChange={(e) => onShowExaminationChange(e.target.checked)}
                          className="sr-only"
                          aria-label="Toggle examination events"
                        />
                      </div>
                    </label>

                    {hasOthersExams && (
                    <label className="flex items-center justify-between cursor-pointer py-0.5 pl-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Others Exams</span>
                      </div>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                        style={{backgroundColor: showOthersExams ? '#2563eb' : (theme === 'dark' ? '#4a4a4a' : '#d1d5db')}}
                      >
                        <span
                          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                          style={{transform: showOthersExams ? 'translateX(20px)' : 'translateX(2px)'}}
                        />
                        <input
                          type="checkbox"
                          checked={showOthersExams}
                          onChange={(e) => onShowOthersExamsChange(e.target.checked)}
                          className="sr-only"
                          aria-label="Toggle others exams events"
                        />
                      </div>
                    </label>
                    )}

                    <label className="flex items-center justify-between cursor-pointer py-0.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>Break</span>
                      </div>
                      <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                        style={{backgroundColor: showBreak ? '#2563eb' : (theme === 'dark' ? '#4a4a4a' : '#d1d5db')}}
                      >
                        <span
                          className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                          style={{transform: showBreak ? 'translateX(20px)' : 'translateX(2px)'}}
                        />
                        <input
                          type="checkbox"
                          checked={showBreak}
                          onChange={(e) => onShowBreakChange(e.target.checked)}
                          className="sr-only"
                          aria-label="Toggle break events"
                        />
                      </div>
                    </label>
                  </div>

                  <div className={`h-px ${theme === 'dark' ? 'bg-border' : 'bg-gray-200'}`} />

                  <label className="flex items-center justify-between cursor-pointer py-0.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>Show</span>
                      <div className="flex gap-1 pointer-events-none select-none">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src="/flags/kedah.png" alt="Kedah" draggable={false} />
                          <AvatarFallback>KD</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src="/flags/kelantan.png" alt="Kelantan" draggable={false} />
                          <AvatarFallback>KT</AvatarFallback>
                        </Avatar>
                        <Avatar className="h-5 w-5">
                          <AvatarImage src="/flags/terengganu.png" alt="Terengganu" draggable={false} />
                          <AvatarFallback>TG</AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <div className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{backgroundColor: showKKT ? '#2563eb' : (theme === 'dark' ? '#4a4a4a' : '#d1d5db')}}
                    >
                      <span
                        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm"
                        style={{transform: showKKT ? 'translateX(20px)' : 'translateX(2px)'}}
                      />
                      <input
                        type="checkbox"
                        checked={showKKT}
                        onChange={(e) => onShowKKTChange(e.target.checked)}
                        className="sr-only"
                        aria-label="Toggle Kedah, Kelantan, and Terengganu regional holidays"
                      />
                    </div>
                  </label>

                  <div className={`h-px ${theme === 'dark' ? 'bg-border' : 'bg-gray-200'}`} />

                  {/* Theme Toggle with Icons */}
                  <div className="flex items-center justify-between py-0.5">
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]'}`}>Theme</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={theme === 'light' ? 'secondary' : 'ghost'}
                        onClick={() => onThemeChange('light')}
                        className={`h-6 px-2 flex items-center gap-1 ${theme === 'light' ? (theme === 'dark' ? 'bg-secondary text-white' : 'bg-gray-200 text-[#1a1a1a]') : `bg-transparent ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}`}
                      >
                        <Sun className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={theme === 'dark' ? 'secondary' : 'ghost'}
                        onClick={() => onThemeChange('dark')}
                        className={`h-6 px-2 flex items-center gap-1 ${theme === 'dark' ? (theme === 'dark' ? 'bg-secondary text-white' : 'bg-gray-200 text-[#1a1a1a]') : `bg-transparent ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}`}
                      >
                        <Moon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className={`h-px ${theme === 'dark' ? 'bg-border' : 'bg-gray-200'}`} />

                  {/* Made By and Source + Share/PWA */}
                  <div className={`text-left text-xs pt-0.5 space-y-3 ${theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600'}`}>
                    {/* Buttons Container */}
                    <div className="flex flex-col gap-2 w-full">
                      {/* Submit Feedback Button */}
                      <a 
                        href="https://forms.gle/qw13g7PJJgzRD3zk8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <Button
                          size="sm"
                          className={`w-full justify-center text-center hover:bg-opacity-100 active:bg-opacity-100 ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-black'}`}
                        >
                          Feedback
                        </Button>
                      </a>

                      {/* Download PWA Button - Only show if not already installed */}
                      {!isPWAInstalled && (
                        <Button
                          size="sm"
                          onClick={() => {
                            window.location.href = '/pwa';
                          }}
                          className={`w-full justify-center text-center hover:bg-opacity-100 active:bg-opacity-100 ${theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-gray-100 text-black'}`}
                        >
                          Download as PWA
                        </Button>
                      )}
                    </div>

                    <div className="border-t pt-2 space-y-2">
                      <div>Built by a UiTM alumnus</div>
                      <div>Source from{' '}
                        <a
                          href="https://hea.uitm.edu.my/index.php/calendars/academic-calendar"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline transition-colors duration-300"
                          style={{color: '#2563eb'}}
                        >
                          HEA UiTM
                        </a>
                      </div>
                      <div>Inspired by{' '}
                        <a
                          href="https://bilacuti.my"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:underline transition-colors duration-300"
                          style={{color: '#2563eb'}}
                        >
                          bilacuti.my
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}
