import React from "react"
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://cutiuitm.xyz'),
  title: 'Bila UiTM Cuti? - Academic Calendar 2026',
  description: 'Interactive UiTM academic calendar for 2026. View registration dates, lecture schedules, examination periods, and breaks. Includes regional schedule variations for Kedah, Kelantan, and Terengganu. Supports dark/light themes and offline access.',
  keywords: ['UiTM', 'academic calendar', '2026', 'registration', 'examination', 'lectures', 'holidays', 'Malaysia', 'Universiti Teknologi MARA', 'student app'],
  generator: 'v0.app',
  manifest: '/manifest.json',
  authors: [
    {
      name: 'Alumni UiTM',
      url: 'https://github.com',
    },
  ],
  creator: 'Alumni UiTM',
  openGraph: {
    title: 'Bila UiTM Cuti? - Academic Calendar 2026',
    description: 'Interactive calendar showing UiTM academic schedules, registration dates, lecture periods, and examination dates for 2026.',
    type: 'website',
    url: 'https://cutiuitm.xyz',
    locale: 'ms_MY',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Bila UiTM Cuti? - Academic Calendar 2026',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bila UiTM Cuti? - Academic Calendar 2026',
    description: 'Interactive UiTM academic calendar with support for all program groups and regional variations.',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        url: '/favicon-16x16.png',
        sizes: '16x16',
      },
      {
        rel: 'icon',
        url: '/favicon-32x32.png',
        sizes: '32x32',
      },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' }
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://cutiuitm.xyz" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Store filter states in data attributes for synchronous access
                // This prevents flicker when filters are applied - MUST run before React hydration
                try {
                  const filters = {
                    showRegistration: localStorage.getItem('showRegistration') || 'false',
                    showLecture: localStorage.getItem('showLecture') || 'true',
                    showSemesterPendek: localStorage.getItem('showSemesterPendek') || 'false',
                    showKuliahIntersesi: localStorage.getItem('showKuliahIntersesi') || 'false',
                    showExamination: localStorage.getItem('showExamination') || 'true',
                    showOthersExams: localStorage.getItem('showOthersExams') || 'false',
                    showBreak: localStorage.getItem('showBreak') || 'true',
                    showKKT: localStorage.getItem('showKKT') || 'false',
                  };
                  // Store as data attribute for synchronous access during component initialization
                  document.documentElement.setAttribute('data-filters', JSON.stringify(filters));
                } catch (e) {
                  // Fallback: set default values if localStorage fails
                  const defaultFilters = {
                    showRegistration: 'false',
                    showLecture: 'true',
                    showSemesterPendek: 'false',
                    showKuliahIntersesi: 'false',
                    showExamination: 'true',
                    showOthersExams: 'false',
                    showBreak: 'true',
                    showKKT: 'false',
                  };
                  document.documentElement.setAttribute('data-filters', JSON.stringify(defaultFilters));
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${geist.className} antialiased`} suppressHydrationWarning>
        {children}
        <Analytics />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').catch(function(err) {
                      console.log('SW registration failed:', err);
                    });
                  });
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  )
}
