"use client";

import useEmblaCarousel from "embla-carousel-react";

import { cn } from "@/lib/utils";

interface SuggestionCarouselProps {
  suggestions: string[];
  disabled: boolean;
  onSelect: (suggestion: string) => void;
  className?: string;
}

export function SuggestionCarousel({
  suggestions,
  disabled,
  onSelect,
  className,
}: SuggestionCarouselProps) {
  const [emblaRef] = useEmblaCarousel({ dragFree: true, containScroll: "trimSnaps", align: "center" });

  return (
    <div className={cn("suggestions-carousel relative -mx-4 md:mx-0 mb-2", className)}>
      <div className="suggestions-fade-left" />
      <div className="suggestions-fade-right" />
      <div className="suggestions-swipe overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex gap-2 px-6">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(suggestion)}
              className="embla__slide flex-none text-xs px-3 py-1.5 rounded-full border border-border bg-secondary/50 hover:bg-secondary dark:bg-[#2A2A2A] dark:hover:bg-[#333] text-foreground transition-colors whitespace-nowrap disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
