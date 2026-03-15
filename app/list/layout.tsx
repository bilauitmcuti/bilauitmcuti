import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bila UiTM Cuti? - Academic Calendar',
  description: 'Interactive UiTM academic calendar. View registration dates, lecture schedules, examination periods, and breaks. Includes regional schedule variations for Kedah, Kelantan, and Terengganu. Supports dark/light themes and offline access.',
  alternates: {
    canonical: 'https://cutiuitm.xyz/list',
  },
  openGraph: {
    siteName: 'Bila UiTM Cuti?',
    title: 'Bila UiTM Cuti? - Academic Calendar',
    description: 'Interactive calendar showing UiTM academic schedules, registration dates, lecture periods, and examination dates.',
    type: 'website',
    url: 'https://cutiuitm.xyz/list',
    locale: 'ms_MY',
    images: [
      {
        url: 'https://cutiuitm.xyz/list-cover.png',
        width: 1200,
        height: 630,
        alt: 'Bila UiTM Cuti? - Academic Calendar',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bila UiTM Cuti? - Academic Calendar',
    description: 'Interactive UiTM academic calendar with support for all program groups and regional variations.',
    images: ['https://cutiuitm.xyz/list-cover.png'],
  },
};

const listBreadcrumbJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://cutiuitm.xyz" },
    { "@type": "ListItem", "position": 2, "name": "List View", "item": "https://cutiuitm.xyz/list" },
  ],
});

export default function ListLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: listBreadcrumbJsonLd }} />
      {children}
    </>
  );
}
