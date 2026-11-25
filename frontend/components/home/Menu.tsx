'use client';

// components/home/Menu.tsx — Full menu (#menu) as a carousel.
// Same dishes and the same veg / non-veg filter as before. Each meal is a slide
// (photo + bilingual two-column dish list with the standard Indian veg / egg /
// non-veg marks). Meal tabs jump to their slide and follow the scroll;
// arrows, swipe, trackpad and keyboard scrolling all work (native scroll-snap).

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { track } from '@/lib/analytics/track';
import { SITE } from '@/lib/site';
import { WhatsAppIcon } from '@/components/site/icons';
import Reveal from '@/components/site/Reveal';

type Category = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'special';
type FoodFilter = 'all' | 'veg' | 'nonveg';
type MealCategory = Exclude<Category, 'all'>;

interface MenuItem {
  id: number;
  nameEn: string;
  nameTa: string;
  category: Exclude<Category, 'all'>;
  foodType: 'veg' | 'egg' | 'nonveg';
  isSignature?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  // Breakfast
  { id: 1,  nameEn: 'Idly',                    nameTa: 'இட்லி',                   category: 'breakfast', foodType: 'veg' },
  { id: 2,  nameEn: 'Poori',                   nameTa: 'பூரி',                    category: 'breakfast', foodType: 'veg' },
  { id: 3,  nameEn: 'Pongal',                  nameTa: 'பொங்கல்',                 category: 'breakfast', foodType: 'veg' },
  { id: 4,  nameEn: 'Ghee Dosa',               nameTa: 'நெய் தோசை',               category: 'breakfast', foodType: 'veg' },
  { id: 5,  nameEn: 'Garlic Dosa',             nameTa: 'பூண்டு தோசை',             category: 'breakfast', foodType: 'veg' },
  { id: 6,  nameEn: 'Roast Dosa',              nameTa: 'ரோஸ்ட் தோசை',            category: 'breakfast', foodType: 'veg' },
  { id: 7,  nameEn: 'Masala Roast',            nameTa: 'மசாலா ரோஸ்ட்',           category: 'breakfast', foodType: 'veg' },
  { id: 8,  nameEn: 'Podi Roast',              nameTa: 'பொடி ரோஸ்ட்',            category: 'breakfast', foodType: 'veg' },
  { id: 9,  nameEn: 'Onion Uthappam',          nameTa: 'வெங்காய உத்தப்பம்',       category: 'breakfast', foodType: 'veg' },
  { id: 10, nameEn: 'Plain Uthappam',          nameTa: 'சாதா உத்தப்பம்',          category: 'breakfast', foodType: 'veg' },
  { id: 11, nameEn: 'Podi Uthappam',           nameTa: 'பொடி உத்தப்பம்',          category: 'breakfast', foodType: 'veg' },
  { id: 12, nameEn: 'Wheat Uppuma',            nameTa: 'கோதுமை உப்புமா',          category: 'breakfast', foodType: 'veg' },
  { id: 13, nameEn: 'Paruppu Sadham',          nameTa: 'பருப்பு சாதம்',            category: 'breakfast', foodType: 'veg' },
  { id: 14, nameEn: 'Omelette',                nameTa: 'ஆம்லெட்',                 category: 'breakfast', foodType: 'egg' },
  { id: 15, nameEn: 'Boiled Egg',              nameTa: 'வேக வைத்த முட்டை',        category: 'breakfast', foodType: 'egg' },
  // Lunch
  { id: 16, nameEn: 'White Rice',              nameTa: 'வெள்ளை சாதம்',            category: 'lunch', foodType: 'veg' },
  { id: 17, nameEn: 'Sambar',                  nameTa: 'சாம்பார்',                 category: 'lunch', foodType: 'veg' },
  { id: 18, nameEn: 'Puli Kolambu',            nameTa: 'புளி குழம்பு',             category: 'lunch', foodType: 'veg' },
  { id: 19, nameEn: 'Rasam',                   nameTa: 'ரசம்',                     category: 'lunch', foodType: 'veg' },
  { id: 20, nameEn: 'Fish Kolambu',            nameTa: 'மீன் குழம்பு',             category: 'lunch', foodType: 'nonveg' },
  { id: 21, nameEn: 'Chicken Kolambu',         nameTa: 'கோழி குழம்பு',             category: 'lunch', foodType: 'nonveg' },
  { id: 22, nameEn: 'Poriyal',                 nameTa: 'பொரியல்',                  category: 'lunch', foodType: 'veg' },
  { id: 23, nameEn: 'Vadam & Vadai',           nameTa: 'வடாம் & வடை',             category: 'lunch', foodType: 'veg' },
  { id: 24, nameEn: 'Appalam',                 nameTa: 'அப்பளம்',                  category: 'lunch', foodType: 'veg' },
  { id: 25, nameEn: 'Curd',                    nameTa: 'தயிர்',                    category: 'lunch', foodType: 'veg' },
  { id: 26, nameEn: 'Payasam',                 nameTa: 'பாயாசம்',                 category: 'lunch', foodType: 'veg' },
  // Dinner
  { id: 27, nameEn: 'Idly',                    nameTa: 'இட்லி',                   category: 'dinner', foodType: 'veg' },
  { id: 28, nameEn: 'Roast Dosa',              nameTa: 'ரோஸ்ட் தோசை',            category: 'dinner', foodType: 'veg' },
  { id: 29, nameEn: 'Onion Dosa',              nameTa: 'வெங்காய தோசை',            category: 'dinner', foodType: 'veg' },
  { id: 30, nameEn: 'Garlic Dosa',             nameTa: 'பூண்டு தோசை',             category: 'dinner', foodType: 'veg' },
  { id: 31, nameEn: 'Ghee Dosa',               nameTa: 'நெய் தோசை',               category: 'dinner', foodType: 'veg' },
  { id: 32, nameEn: 'Chapathi',                nameTa: 'சப்பாத்தி',                category: 'dinner', foodType: 'veg' },
  { id: 33, nameEn: 'Parotta',                 nameTa: 'பரோட்டா',                  category: 'dinner', foodType: 'veg' },
  { id: 34, nameEn: 'Veechu Parotta',          nameTa: 'வீச்சு பரோட்டா',          category: 'dinner', foodType: 'veg' },
  { id: 35, nameEn: 'Omelette',                nameTa: 'ஆம்லெட்',                 category: 'dinner', foodType: 'egg' },
  // Snacks
  { id: 36, nameEn: 'Bajji',                   nameTa: 'பஜ்ஜி',                   category: 'snacks', foodType: 'veg' },
  { id: 37, nameEn: 'Bonda',                   nameTa: 'போண்டா',                  category: 'snacks', foodType: 'veg' },
  { id: 38, nameEn: 'Vadai',                   nameTa: 'வடை',                     category: 'snacks', foodType: 'veg' },
  { id: 39, nameEn: 'Sundal',                  nameTa: 'சுண்டல்',                 category: 'snacks', foodType: 'veg' },
  // Special Non-Veg
  { id: 40, nameEn: 'Country Chicken Curry',   nameTa: 'நாட்டுக்கோழி குழம்பு',   category: 'special', foodType: 'nonveg', isSignature: true },
  { id: 41, nameEn: 'Country Chicken Gravy',   nameTa: 'நாட்டுக்கோழி கிரேவி',    category: 'special', foodType: 'nonveg', isSignature: true },
  { id: 42, nameEn: 'Chettinad Chicken Gravy', nameTa: 'செட்டிநாடு சிக்கன் கிரேவி', category: 'special', foodType: 'nonveg', isSignature: true },
];

const CATEGORY_ORDER: MealCategory[] = ['breakfast', 'lunch', 'dinner', 'snacks', 'special'];

// One photo per meal slide (all bundled in /public/images).
const CATEGORY_PHOTO: Record<MealCategory, string> = {
  breakfast: '/images/food/breakfast/idly.jpg',
  lunch: '/images/events/banana-leaf.jpg',
  dinner: '/images/menu-tiffin.png',
  snacks: '/images/food/breakfast/pongal.jpg',
  special: '/images/food/special/country-chicken.jpg',
};

export default function Menu() {
  const t = useTranslations('Menu');
  const s = useTranslations('Site.menu');
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState<MealCategory>('breakfast');
  const [activeFood, setActiveFood] = useState<FoodFilter>('all');
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const tabRowRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Partial<Record<MealCategory, HTMLElement | null>>>({});

  // Keep the active meal tab visible in the (horizontally scrollable) tab
  // row on phones. Scrolls the row only — never the page.
  useEffect(() => {
    const row = tabRowRef.current;
    const tab = row?.querySelector<HTMLElement>(`[aria-controls="menu-slide-${activeCategory}"]`);
    if (!row || !tab) return;
    const left = tab.offsetLeft; // row is position:relative → offset is row-relative
    if (left < row.scrollLeft || left + tab.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' });
    }
  }, [activeCategory]);

  const foodFilters: { key: FoodFilter; label: string }[] = [
    { key: 'all', label: s('filterAll') },
    { key: 'veg', label: s('filterVeg') },
    { key: 'nonveg', label: s('filterNonveg') },
  ];

  const filtered = MENU_ITEMS.filter(
    (item) =>
      activeFood === 'all' ||
      (activeFood === 'veg' && item.foodType === 'veg') ||
      (activeFood === 'nonveg' && item.foodType === 'nonveg')
  );

  const grouped = CATEGORY_ORDER
    .map((key) => ({ key, items: filtered.filter((i) => i.category === key) }))
    .filter((g) => g.items.length > 0);

  const markLabel = { veg: s('veg'), egg: s('egg'), nonveg: s('nonveg') };

  // ── Carousel state: which slide is in view + whether arrows are usable ──
  const syncFromScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const atEndNow = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(atEndNow);

    const present = CATEGORY_ORDER.filter((key) => slideRefs.current[key]?.isConnected);
    if (present.length === 0) return;

    // Fully scrolled to the end: the last slide can't reach the snap start,
    // so treat it as the active one.
    if (atEndNow && el.scrollLeft > 4) {
      setActiveCategory(present[present.length - 1]);
      return;
    }

    // Otherwise the slide whose left edge is nearest the snap start is active.
    const start = el.getBoundingClientRect().left + parseFloat(getComputedStyle(el).scrollPaddingLeft || '0');
    let best: MealCategory = present[0];
    let bestDist = Infinity;
    for (const key of present) {
      const d = Math.abs(slideRefs.current[key]!.getBoundingClientRect().left - start);
      if (d < bestDist) { bestDist = d; best = key; }
    }
    setActiveCategory(best);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(syncFromScroll);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [syncFromScroll, activeFood]);

  const reducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scrollToSlide = (key: MealCategory) => {
    const el = trackRef.current;
    const slide = slideRefs.current[key];
    if (!el || !slide) return;
    const pad = parseFloat(getComputedStyle(el).scrollPaddingLeft || '0');
    el.scrollTo({ left: slide.offsetLeft - pad, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  const goToCategory = (key: MealCategory) => {
    setActiveCategory(key);
    scrollToSlide(key);
    track({ event: 'menu_filter', metadata: { category: key } });
  };

  const step = (dir: 1 | -1) => {
    const keys = grouped.map((g) => g.key);
    const i = Math.max(0, keys.indexOf(activeCategory));
    const next = keys[Math.min(keys.length - 1, Math.max(0, i + dir))];
    if (next) scrollToSlide(next);
  };

  const pickFood = (value: FoodFilter) => {
    setActiveFood(value);
    track({ event: 'menu_filter', metadata: { food: value } });
    // A filter can remove slides — return to the first one.
    requestAnimationFrame(() => trackRef.current?.scrollTo({ left: 0 }));
  };

  const textBtn = (active: boolean) =>
    `min-h-[44px] whitespace-nowrap px-1 text-[1rem] font-semibold transition-colors underline-offset-[10px] decoration-[3px] ${
      active
        ? 'text-[var(--site-leaf-deep)] underline decoration-[var(--site-brass)]'
        : 'text-[var(--site-ink-muted)] hover:text-[var(--site-leaf-deep)]'
    }`;

  const arrowBtn =
    'grid h-12 w-12 flex-none place-items-center rounded-full bg-[var(--site-leaf)] text-[var(--site-on-dark)] transition-colors hover:bg-[var(--site-leaf-deep)] disabled:bg-[var(--site-paper-deep)] disabled:text-[var(--site-ink-muted)] disabled:cursor-not-allowed';

  return (
    <section id="menu" aria-labelledby="menu-title" className="s-section overflow-hidden">
      <div className="s-container">
        {/* Heading + food-type filter */}
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <Reveal>
            <h2 id="menu-title" className="s-h2 whitespace-pre-line text-[var(--site-leaf-deep)]">
              {t('heading')}
            </h2>
            <p className="s-lead mt-5">{t('subheading')}</p>
          </Reveal>

          <div className="space-y-3">
            <div role="group" aria-label={s('filterLabel')} className="flex flex-wrap gap-x-5">
              {foodFilters.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={activeFood === key}
                  onClick={() => pickFood(key)}
                  className={textBtn(activeFood === key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[0.88rem] text-[var(--site-ink-soft)]">
              {(['veg', 'egg', 'nonveg'] as const).map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <span className={`s-mark s-mark-${k}`} aria-hidden="true" />
                  {markLabel[k]}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Meal tabs (jump to slide) + arrows */}
        <div className="mt-10 flex items-center justify-between gap-6">
          <div
            ref={tabRowRef}
            role="group"
            aria-label={s('categoriesLabel')}
            className="relative -mx-1 flex gap-x-5 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {grouped.map(({ key }) => (
              <button
                key={key}
                type="button"
                aria-pressed={activeCategory === key}
                aria-controls={`menu-slide-${key}`}
                onClick={() => goToCategory(key)}
                className={textBtn(activeCategory === key)}
              >
                {s(key)}
              </button>
            ))}
          </div>
          <div className="hidden flex-none gap-3 sm:flex">
            <button type="button" onClick={() => step(-1)} disabled={atStart} aria-label={s('prev')} className={arrowBtn}>
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => step(1)} disabled={atEnd} aria-label={s('next')} className={arrowBtn}>
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* The carousel: starts aligned with the content column and bleeds to
          the right edge of the screen. Native scroll-snap = swipe on touch,
          trackpad/shift-wheel on desktop, arrows/tabs for everyone. */}
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={s('carouselLabel')}
        tabIndex={0}
        className="mt-8 flex items-start snap-x snap-mandatory gap-5 overflow-x-auto pb-4 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:gap-6"
        style={{
          paddingInline: 'max(var(--site-gutter), calc((100vw - var(--site-max)) / 2))',
          scrollPaddingInline: 'max(var(--site-gutter), calc((100vw - var(--site-max)) / 2))',
        }}
      >
        {grouped.length === 0 && (
          <p className="text-[1.05rem] text-[var(--site-ink-soft)]">{s('empty')}</p>
        )}

        {grouped.map(({ key, items }) => (
          <article
            key={key}
            id={`menu-slide-${key}`}
            ref={(el) => { slideRefs.current[key] = el; }}
            role="group"
            aria-roledescription="slide"
            aria-label={t(`categories.${key}`)}
            className="flex w-[82vw] max-w-[680px] flex-none snap-start flex-col overflow-hidden rounded-[28px] bg-[var(--site-paper-deep)] sm:w-[540px] lg:w-[660px]"
          >
            <div className="relative aspect-[16/9] w-full sm:aspect-[21/9] lg:aspect-[3/1]">
              <Image
                src={CATEGORY_PHOTO[key]}
                alt={s(`photo.${key}`)}
                fill
                sizes="(max-width: 640px) 82vw, 660px"
                className="object-cover"
              />
            </div>

            <div className="flex flex-1 flex-col p-6 md:px-8 md:py-7">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="s-h3 text-[var(--site-leaf-deep)]">{t(`categories.${key}`)}</h3>
                <span className="flex-none text-[0.88rem] font-semibold text-[var(--site-brass-text)]">
                  {s('dishes', { count: items.length })}
                </span>
              </div>

              <ul className="mt-4 grid grid-cols-2 gap-x-5 lg:grid-cols-3">
                {items.map((item) => {
                  const primary = locale === 'ta' ? item.nameTa : item.nameEn;
                  const secondary = locale === 'ta' ? item.nameEn : item.nameTa;
                  return (
                    <li key={item.id} className="flex items-start gap-2.5 py-2">
                      <span
                        className={`s-mark s-mark-${item.foodType} mt-[0.38em]`}
                        role="img"
                        aria-label={markLabel[item.foodType]}
                      />
                      <span className="min-w-0">
                        <span className="s-serif block text-[1.05rem] font-medium leading-snug text-[var(--site-ink)]">
                          {primary}
                        </span>
                        <span className="block text-[0.82rem] text-[var(--site-ink-muted)]" lang={locale === 'ta' ? 'en' : 'ta'}>
                          {secondary}
                        </span>
                        {item.isSignature && (
                          <span className="mt-0.5 block text-[0.78rem] font-semibold italic text-[var(--site-chilli)]">
                            {s('signature')}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </article>
        ))}
      </div>

      {/* Full menu CTA */}
      <div className="s-container">
        <div className="mt-10 flex flex-col gap-6 rounded-[28px] bg-[var(--site-leaf-deep)] p-7 md:flex-row md:items-center md:justify-between md:p-9">
          <div>
            <p className="s-serif text-[1.3rem] font-medium leading-snug text-[var(--site-on-dark)]">
              {t('fullMenuText')}
            </p>
            <p className="mt-2 text-[0.95rem] text-[var(--site-on-dark-soft)]">{t('pricingNote')}</p>
          </div>
          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track({ event: 'whatsapp_open', metadata: { source: 'menu' } })}
            className="s-btn s-btn-brass flex-none"
          >
            <WhatsAppIcon size={19} />
            {t('fullMenuBtn')}
          </a>
        </div>
      </div>
    </section>
  );
}
