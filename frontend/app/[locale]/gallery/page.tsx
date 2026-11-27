// app/[locale]/gallery/page.tsx — Day 12: Photo gallery
//
// Reads from the `gallery` table (seeded via admin / SQL). If the table is
// empty, falls back to the bundled placeholder photos in /public/images so the
// page is never blank. Images use next/image with lazy loading.
// (Query and fallback behaviour unchanged; layout redesigned.)

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { createPublicClient } from '@/lib/supabase/public';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';
import Reveal from '@/components/site/Reveal';

export const metadata: Metadata = {
  title: 'Gallery — Shri Ganapathi Mess',
  description:
    'Photos of weddings, bulk cooking, banana-leaf feasts and our kitchen from Shri Ganapathi Mess, Tiruppur.',
};

interface GalleryImage {
  id: string;
  title_en: string | null;
  title_ta: string | null;
  category: string | null;
  image_url: string;
  alt_en: string | null;
  alt_ta: string | null;
}

// Fallback images shipped in /public/images (used until real photos are
// uploaded to the gallery table).
const FALLBACK: GalleryImage[] = [
  { id: 'fb-1', title_en: 'Banana Leaf Feast', title_ta: 'வாழை இலை விருந்து', category: 'events', image_url: '/images/events/banana-leaf.jpg', alt_en: 'Traditional banana leaf meal', alt_ta: 'பாரம்பரிய வாழை இலை உணவு' },
  { id: 'fb-2', title_en: 'Bulk Cooking', title_ta: 'மொத்த சமையல்', category: 'events', image_url: '/images/events/bulk-cooking.jpg', alt_en: 'Large scale catering cooking', alt_ta: 'பெரிய அளவிலான சமையல்' },
  { id: 'fb-3', title_en: 'Country Chicken', title_ta: 'நாட்டு கோழி', category: 'food', image_url: '/images/food/special/country-chicken.jpg', alt_en: 'Spicy country chicken curry', alt_ta: 'கார நாட்டு கோழி கறி' },
  { id: 'fb-4', title_en: 'Idly Breakfast', title_ta: 'இட்லி காலை உணவு', category: 'food', image_url: '/images/food/breakfast/idly.jpg', alt_en: 'Idly with sambar', alt_ta: 'சாம்பாருடன் இட்லி' },
  { id: 'fb-5', title_en: 'Pongal', title_ta: 'பொங்கல்', category: 'food', image_url: '/images/food/breakfast/pongal.jpg', alt_en: 'Ven pongal breakfast', alt_ta: 'வெண் பொங்கல்' },
  { id: 'fb-6', title_en: 'Our Kitchen', title_ta: 'நமது சமையலறை', category: 'hotel', image_url: '/images/hotel/kitchen.jpg', alt_en: 'Clean hotel kitchen', alt_ta: 'சுத்தமான சமையலறை' },
];

// Varying shapes give the grid an editorial rhythm instead of identical tiles.
const SHAPES = ['s-arch aspect-[4/5]', 'rounded-[24px] aspect-square', 'rounded-[24px] aspect-[3/4]'];

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('Site.gallery');

  let images: GalleryImage[] = [];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('gallery')
      .select('id, title_en, title_ta, category, image_url, alt_en, alt_ta')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(60);
    images = (data ?? []) as GalleryImage[];
  } catch {
    images = [];
  }

  const useFallback = images.length === 0;
  const shown = useFallback ? FALLBACK : images;

  const titleFor = (img: GalleryImage) =>
    (locale === 'ta' ? img.title_ta || img.title_en : img.title_en || img.title_ta) || '';
  const altFor = (img: GalleryImage) =>
    (locale === 'ta' ? img.alt_ta || img.alt_en : img.alt_en || img.alt_ta) || titleFor(img);

  return (
    <>
      <Header />
      <main className="s-section pt-12 md:pt-16">
        <div className="s-container">
          <Link href={`/${locale}`} className="s-link text-[0.95rem] text-[var(--site-leaf)]">
            ← {t('back')}
          </Link>

          <div className="mt-10 max-w-[760px]">
            <h1 className="s-display text-[var(--site-leaf-deep)]">{t('title')}</h1>
            <p className="s-lead mt-6">{t('lead')}</p>
            {useFallback && (
              <p className="mt-4 text-[0.9rem] italic text-[var(--site-ink-muted)]">{t('sample')}</p>
            )}
          </div>

          <ul className="mt-16 columns-1 gap-6 sm:columns-2 lg:columns-3">
            {shown.map((img, i) => (
              <Reveal as="li" key={img.id} delay={(i % 3) * 80} className="mb-8 break-inside-avoid">
                <figure>
                  <div className={`relative overflow-hidden bg-[var(--site-paper-deep)] ${SHAPES[i % SHAPES.length]}`}>
                    <Image
                      src={img.image_url}
                      alt={altFor(img)}
                      fill
                      sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 380px"
                      className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                    />
                  </div>
                  {titleFor(img) && (
                    <figcaption className="s-serif mt-3 text-[1.15rem] font-medium text-[var(--site-ink)]">
                      {titleFor(img)}
                    </figcaption>
                  )}
                </figure>
              </Reveal>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
