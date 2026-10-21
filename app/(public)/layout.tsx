import React from 'react';
import { getPublicSiteSettings } from '@/lib/public-data';
import { PublicHeader } from '@/components/public/PublicHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getPublicSiteSettings();

  return (
    <div className="flex flex-col min-h-screen bg-salon-noir text-salon-ivory transition-colors duration-300 selection:bg-salon-gold/30 selection:text-white">
      <PublicHeader settings={settings} />
      <main className="flex-1 flex flex-col">{children}</main>
      <PublicFooter settings={settings} />
    </div>
  );
}
