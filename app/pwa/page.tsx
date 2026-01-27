'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function PWAPage() {
  const router = useRouter();
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if already installed as PWA
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    const isInFullScreenMode = document.fullscreenElement !== null;
    const isInMinimalUIMode = (window.navigator as any).standalone === true;
    
    if (isInStandaloneMode || isInFullScreenMode || isInMinimalUIMode) {
      setIsInstalled(true);
    }
  }, []);

  const textClass = 'text-foreground';
  const bgClass = 'bg-background text-foreground';
  const mutedClass = 'text-muted-foreground';

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

        {/* Main Content */}
        <div className="space-y-8">
          {/* Title */}
          <div>
            <h1 className={`text-4xl font-bold mb-2 ${textClass}`}>
              Install <span className="text-[#8b5cf6]">Cuti UiTM</span>
            </h1>
            <p className={mutedClass}>
              Get offline access and install the app on your device
            </p>
          </div>

          {/* Installation Instructions */}
          <div className="space-y-6">
            {/* Desktop */}
            <div>
              <h2 className={`text-xl font-semibold mb-4 ${textClass}`}>
                Desktop & Laptop
              </h2>
              <div className={`space-y-3 ${mutedClass} text-sm`}>
                <p>
                  <strong>Chrome:</strong> Click the install icon in the address bar or go to Settings &gt; More &gt; Install app.
                </p>
                <p>
                  <strong>Edge:</strong> Click the install icon in the address bar or go to Settings &gt; Apps &gt; Install this site as an app.
                </p>
                <p>
                  <strong>Safari:</strong> Share &gt; Add to Dock (macOS) or Share &gt; Add to Home Screen (iOS).
                </p>
              </div>
            </div>

            {/* iOS */}
            <div>
              <h2 className={`text-xl font-semibold mb-4 ${textClass}`}>
                iPhone & iPad (iOS)
              </h2>
              <div className={`space-y-3 ${mutedClass} text-sm`}>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Open Safari browser</li>
                  <li>Go to the Cuti UiTM website</li>
                  <li>Tap the Share button (arrow pointing up)</li>
                  <li>Select "Add to Home Screen"</li>
                  <li>Tap "Add" to confirm</li>
                </ol>
              </div>
            </div>

            {/* Android */}
            <div>
              <h2 className={`text-xl font-semibold mb-4 ${textClass}`}>
                Android Devices
              </h2>
              <div className={`space-y-3 ${mutedClass} text-sm`}>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Open Chrome or any browser</li>
                  <li>Go to the Cuti UiTM website</li>
                  <li>Tap the menu icon (three dots)</li>
                  <li>Select "Install app" or "Add to Home Screen"</li>
                  <li>Confirm the installation</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Features</h3>
            <ul className={`space-y-2 ${mutedClass} text-sm`}>
              <li>✓ Offline access to academic calendar</li>
              <li>✓ Installable as native app</li>
              <li>✓ Fast loading and responsive design</li>
              <li>✓ Light theme</li>
              <li>✓ Regional schedule variations (KKT states)</li>
              <li>✓ Group-specific calendars (Group A & B)</li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className={`text-lg font-semibold mb-3 ${textClass}`}>Disclaimer</h3>
            <p className={`${mutedClass} text-sm leading-relaxed`}>
              This app is <strong>not affiliated with UiTM</strong> (Universiti Teknologi MARA). This project is created for educational and informational purposes only. The calendar data is sourced from publicly available HEA UiTM academic calendar information. Please verify important dates directly with official UiTM sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
