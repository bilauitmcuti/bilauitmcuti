'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { changelogData } from '@/lib/changelog-data';

export default function ChangelogPage() {
  const router = useRouter();

  // Group changelog entries by month/year
  const groupedByMonth = changelogData.reduce((acc, entry) => {
    const date = new Date(entry.date);
    const monthKey = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(entry);
    return acc;
  }, {} as Record<string, ChangelogEntry[]>);

  // Sort months in descending order (newest first)
  const monthOrder = ['January 2026', 'February 2026', 'March 2026', 'April 2026', 'May 2026', 'June 2026', 'July 2026', 'August 2026', 'September 2026', 'October 2026', 'November 2026', 'December 2026', 'January 2025', 'February 2025', 'March 2025', 'April 2025', 'May 2025', 'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025', 'November 2025', 'December 2025'];
  const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => {
    const indexA = monthOrder.indexOf(a);
    const indexB = monthOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexB - indexA; // Descending order
  });

  // Sort entries within each month by date (newest first)
  sortedMonths.forEach(month => {
    groupedByMonth[month].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  });

  const bgClass = 'bg-white text-[#1a1a1a]';
  const textClass = 'text-[#1a1a1a]';
  const mutedClass = 'text-gray-600';

  const handleBack = () => {
    router.push('/');
  };

  // Get day name (e.g., "Fri", "Sat")
  const getDayName = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { weekday: 'short' });
  };

  // Format date to "DD Mon" format (e.g., "24 Jan", "23 Jan")
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month}`;
  };

  // Check if text contains a URL and split it
  const splitTextAndUrl = (text: string): { parts: Array<{ type: 'text' | 'url'; content: string }> } => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts: Array<{ type: 'text' | 'url'; content: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before URL
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      // Add URL
      parts.push({ type: 'url', content: match[0] });
      lastIndex = urlRegex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    // If no URL found, return original text
    if (parts.length === 0) {
      parts.push({ type: 'text', content: text });
    }

    return { parts };
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

        {/* Header */}
        <h1 className={`mb-2 font-semibold leading-[2.5rem] tracking-tight text-5xl ${textClass}`}>
          Changelog
        </h1>
        <p className={`mb-8 text-sm ${mutedClass}`}>
          List of updates and improvements for this web app.
        </p>

        {/* Changelog entries grouped by month */}
        <div className={`space-y-8 transition-colors duration-300 ${bgClass}`}>
          {sortedMonths.map((month) => {
            return (
              <div key={month}>
                <div className="-mx-3 pb-4 pt-3">
                  <h3 className={`font-semibold text-xl leading-7 text-left ${textClass} px-3`}>{month}</h3>
                </div>
                
                <div className="space-y-4">
                  {groupedByMonth[month].map((entry, index) => (
                    <div key={`${entry.date}-${index}`} className="flex gap-3 sm:gap-4 p-3 rounded-lg px-0">
                      {/* Date column */}
                      <div className={`flex w-16 sm:w-20 flex-col items-start text-xs shrink-0 ${mutedClass}`}>
                        <div>{getDayName(entry.date)}</div>
                        <div className={`text-sm font-medium ${textClass}`}>{formatDate(entry.date)}</div>
                      </div>
                      
                      {/* Content column */}
                      <div className="flex flex-1 min-w-0">
                        <div className="w-full">
                          <h3 className={`font-medium text-base leading-6 break-words ${textClass}`}>
                            {entry.title}
                          </h3>
                          <ul className={`mt-1 text-sm leading-5 break-words ${mutedClass} list-disc list-inside space-y-1`}>
                            {entry.details.map((detail, detailIndex) => {
                              const { parts } = splitTextAndUrl(detail);
                              return (
                                <li key={detailIndex}>
                                  {parts.map((part, partIndex) => {
                                    if (part.type === 'url') {
                                      return (
                                        <a
                                          key={partIndex}
                                          href={part.content}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-500 hover:text-blue-400 underline break-all"
                                        >
                                          {part.content}
                                        </a>
                                      );
                                    }
                                    return <span key={partIndex}>{part.content}</span>;
                                  })}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
