// app/[locale]/gallery/page.tsx — Day 12: Photo gallery
//
// Reads from the `gallery` table (seeded via admin / SQL). If the table is
// empty, falls back to the bundled placeholder photos in /public/images so the
// page is never blank. Images use next/image with lazy loading.

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

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

function titleFor(img: GalleryImage): string {
  return img.title_en || img.title_ta || 'Gallery';
}
function altFor(img: GalleryImage): string {
  return img.alt_en || img.alt_ta || titleFor(img);
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  let images: GalleryImage[] = [];
  try {
    const supabase = await createClient();
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

  return (
    <main className="min-h-screen bg-[var(--color-ivory-200)] py-12 md:py-16">
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12">

        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 font-body text-sm text-[var(--color-brown-500)] hover:text-[var(--color-brown-900)] mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="text-center max-w-[680px] mx-auto mb-10">
          <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gold-700)] mb-4">
            <span className="w-6 h-px bg-[var(--color-gold-700)]" />
            Gallery
            <span className="w-6 h-px bg-[var(--color-gold-700)]" />
          </span>
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-brown-900)] leading-[1.15] mb-3">
            {locale === 'ta' ? 'எங்கள் படங்கள்' : 'Moments we served'}
          </h1>
          <p className="font-body text-base md:text-lg text-[var(--color-brown-600)]">
            {locale === 'ta'
              ? 'திருமணம், மொத்த சமையல் மற்றும் வாழை இலை விருந்து படங்கள்.'
              : 'Weddings, bulk cooking and banana-leaf feasts from our kitchen.'}
          </p>
        </div>

        {useFallback && (
          <p className="text-center font-body text-xs text-[var(--color-brown-400)] italic mb-6">
            Showing sample photos — real photos coming soon.
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {shown.map((img) => (
            <figure
              key={img.id}
              className="relative group overflow-hidden rounded-2xl border border-[var(--color-ivory-300)] bg-white aspect-[4/3]"
            >
              <Image
                src={img.image_url}
                alt={altFor(img)}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <span className="font-body text-xs font-semibold text-white">
                  {titleFor(img)}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </main>
  );
}
