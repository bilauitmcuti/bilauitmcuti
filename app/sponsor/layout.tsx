import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sponsor - Bila UiTM Cuti',
  description:
    'Support Bila UiTM Cuti. View the payment QR and submit your sponsorship details and proof of payment.',
  robots: { index: false, follow: true },
  alternates: {
    canonical: 'https://bilauitmcuti.com/sponsor',
  },
  openGraph: {
    siteName: 'Bila UiTM Cuti',
    title: 'Sponsor - Bila UiTM Cuti',
    description:
      'Thank supporters of bilauitmcuti.com — submit sponsorship details after payment.',
    type: 'website',
    url: 'https://bilauitmcuti.com/sponsor',
    locale: 'ms_MY',
    images: [{ url: 'https://bilauitmcuti.com/all-cover.png', width: 1200, height: 630, alt: 'Bila UiTM Cuti' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sponsor - Bila UiTM Cuti',
    description:
      'Thank supporters of bilauitmcuti.com — submit sponsorship details after payment.',
    images: ['https://bilauitmcuti.com/all-cover.png'],
  },
};

const sponsorBreadcrumbJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://bilauitmcuti.com' },
    { '@type': 'ListItem', position: 2, name: 'Sponsor', item: 'https://bilauitmcuti.com/sponsor' },
  ],
});

export default function SponsorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: sponsorBreadcrumbJsonLd }} />
      {children}
    </>
  );
}
