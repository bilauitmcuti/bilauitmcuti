const listBreadcrumbJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://bilauitmcuti.com" },
    { "@type": "ListItem", "position": 2, "name": "List View", "item": "https://bilauitmcuti.com/list" },
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
