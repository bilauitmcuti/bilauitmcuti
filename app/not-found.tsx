'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Theme } from '@/app/page';

export default function NotFound() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Apply initial theme class immediately for FCP
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Load theme from localStorage (non-blocking)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    }
    setIsLoaded(true);
  }, []);

  // Apply theme to document when theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const bgClass = theme === 'dark' ? 'bg-[#1a1a1a] text-white' : 'bg-white text-[#1a1a1a]';
  const textClass = theme === 'dark' ? 'text-white' : 'text-[#1a1a1a]';
  const mutedClass = theme === 'dark' ? 'text-muted-foreground' : 'text-gray-600';

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgClass}`}>
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6 -ml-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* 404 Content */}
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          {/* 404 Number */}
          <h1 className={`text-8xl sm:text-9xl font-bold mb-4 ${textClass}`}>
            404
          </h1>

          {/* Title */}
          <h2 className={`text-2xl sm:text-3xl font-semibold mb-3 ${textClass}`}>
            Page Not Found
          </h2>

          {/* Description */}
          <p className={`text-base sm:text-lg mb-8 max-w-md ${mutedClass}`}>
            The page you're looking for doesn't exist or has been moved.
          </p>

          {/* Action Button */}
          <Button
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
