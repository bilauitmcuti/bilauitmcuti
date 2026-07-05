import React, { Suspense } from "react"
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeShortcut } from '@/components/theme-shortcut'
import { VersionBanner } from '@/components/version-banner'
import { EngagementPromptRoot } from '@/components/engagement-prompt'
import { ZarazPageView } from '@/components/zaraz-page-view'
import './globals.css'
import { Geist, Geist_Mono } from "next/font/google"
import { cn } from "@/lib/utils"
import { buildSiteNavigationSchemaElements, HOMEPAGE_SEO_DESCRIPTION } from '@/lib/page-seo'
import { getCalendarFilterBootstrapScript } from '@/lib/cookie-utils'

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL('https://bilauitmcuti.com'),
  title: {
    default: 'Bila UiTM Cuti',
    template: '%s',
  },
  applicationName: 'Bila UiTM Cuti',
  other: {
    'site_name': 'Bila UiTM Cuti',
  },
  description: HOMEPAGE_SEO_DESCRIPTION,
  keywords: ['UiTM', 'academic calendar', 'registration', 'examination', 'lectures', 'holidays', 'Malaysia', 'Universiti Teknologi MARA', 'UiTM student app', 'Bila UiTM Cuti', 'Cuti UiTM', 'Jadual UiTM', 'Kalendar UiTM', 'Kalendar Akademik UiTM', 'Academic Calendar UiTM', 'jadual akademik UiTM', 'cuti semester UiTM', 'tarikh peperiksaan UiTM', 'tarikh pendaftaran UiTM', 'kuliah UiTM', 'uitm cuti', 'uitm cuti bila', 'bila cuti uitm', 'cuti uitm 2026', 'cuti uitm 2027', 'kalendar cuti uitm'],
  generator: 'Next.js',
  manifest: '/manifest.json',
  authors: [
    {
      name: 'Bila UiTM Cuti',
      url: 'https://bilauitmcuti.com',
    },
  ],
  creator: 'Bila UiTM Cuti',
  category: 'education',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://bilauitmcuti.com',
  },
  openGraph: {
    siteName: 'Bila UiTM Cuti',
    title: 'Bila UiTM Cuti',
    description: HOMEPAGE_SEO_DESCRIPTION,
    type: 'website',
    url: 'https://bilauitmcuti.com',
    locale: 'ms_MY',
    images: [
      {
        url: 'https://bilauitmcuti.com/all-cover.png',
        width: 1200,
        height: 630,
        alt: 'Bila UiTM Cuti - Academic Calendar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bila UiTM Cuti',
    description: HOMEPAGE_SEO_DESCRIPTION,
    images: ['https://bilauitmcuti.com/all-cover.png'],
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
  interactiveWidget: 'resizes-content',
  // Single themeColor - updated dynamically by theme-toggle when user changes theme (PWA status bar sync)
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const filterBootstrapScript = getCalendarFilterBootstrapScript(
    process.env.NODE_ENV === "production"
  );

  return (
    <html lang="en" className={cn(geistSans.variable, geistMono.variable, "font-sans")} suppressHydrationWarning>
      <head>
        <meta name="app-build-id" content={process.env.NEXT_PUBLIC_BUILD_ID ?? ""} />
        <meta name="theme-color" content="#ffffff" />
        <meta name="application-name" content="Bila UiTM Cuti" />
        <meta property="og:site_name" content="Bila UiTM Cuti" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Bila UiTM Cuti" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://bilauitmcuti.com/#organization',
                  name: 'Bila UiTM Cuti',
                  url: 'https://bilauitmcuti.com',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://bilauitmcuti.com/android-chrome-512x512.png',
                  },
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://bilauitmcuti.com/#website',
                  url: 'https://bilauitmcuti.com',
                  name: 'Bila UiTM Cuti',
                  alternateName: ['Bila UiTM Cuti', 'Cuti UiTM', 'Kalendar Akademik UiTM'],
                  publisher: {
                    '@id': 'https://bilauitmcuti.com/#organization',
                  },
                  inLanguage: ['ms-MY', 'en'],
                  hasPart: buildSiteNavigationSchemaElements(),
                },
              ],
            }),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const isDev = ${process.env.NODE_ENV === 'development'};
                // Sync theme from localStorage before React hydration to prevent flash
                try {
                  let theme = 'light';
                  try {
                    theme = localStorage.getItem('theme') || 'light';
                  } catch (storageError) {
                    if (isDev) console.warn('localStorage access failed, using default theme:', storageError);
                  }
                  
                  // Validate theme value - only accept 'light' or 'dark'
                  const validTheme = (theme === 'dark' || theme === 'light') ? theme : 'light';
                  
                  // Apply theme class - always remove both classes first to ensure clean state
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(validTheme);
                  
                  // Update theme-color meta tag
                  try {
                    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
                    if (metaThemeColor) {
                      metaThemeColor.setAttribute('content', validTheme === 'dark' ? '#1a1a1a' : '#ffffff');
                    }
                  } catch (metaError) {
                    if (isDev) console.warn('Failed to update theme-color meta tag:', metaError);
                  }
                } catch (e) {
                  // Comprehensive fallback - ensure light theme is always applied
                  if (isDev) console.warn('Theme sync failed, applying fallback:', e);
                  try {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
                    if (metaThemeColor) {
                      metaThemeColor.setAttribute('content', '#ffffff');
                    }
                  } catch (fallbackError) {
                    // Last resort - just add light class
                    document.documentElement.classList.add('light');
                  }
                }
                
                // Store filter states in data attributes for synchronous access
                // This prevents flicker when filters are applied - MUST run before React hydration
                ${filterBootstrapScript}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.className} antialiased`} suppressHydrationWarning>
        <VersionBanner />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="theme"
          disableTransitionOnChange={false}
        >
          <ThemeShortcut />
          <EngagementPromptRoot>{children}</EngagementPromptRoot>
        </ThemeProvider>
        <Suspense fallback={null}>
          <ZarazPageView />
        </Suspense>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const isDev = ${process.env.NODE_ENV === 'development'};
                const buildId = ${JSON.stringify(process.env.NEXT_PUBLIC_BUILD_ID ?? "")};
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    const swUrl = buildId ? ('/sw.js?v=' + encodeURIComponent(buildId)) : '/sw.js';
                    navigator.serviceWorker.register(swUrl).catch(function(err) {
                      if (isDev) console.log('SW registration failed:', err);
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
