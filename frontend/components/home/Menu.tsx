'use client';

// components/home/Menu.tsx — Full menu (#menu).
// Same dishes and the same meal / veg filters as before, presented as a
// printed bilingual menu: the visitor's language first, the other beneath,
// with the standard Indian veg / egg / non-veg marks.

import { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { track } from '@/lib/analytics/track';
import { SITE } from '@/lib/site';
import { WhatsAppIcon } from '@/components/site/icons';
import Reveal from '@/components/site/Reveal';

type Category = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'special';
type FoodFilter = 'all' | 'veg' | 'nonveg';

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

const CATEGORY_ORDER: Exclude<Category, 'all'>[] = ['breakfast', 'lunch', 'dinner', 'snacks', 'special'];

export default function Menu() {
  const t = useTranslations('Menu');
  const s = useTranslations('Site.menu');
  const locale = useLocale();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [activeFood, setActiveFood] = useState<FoodFilter>('all');

  const categories: { key: Category; label: string }[] = [
    { key: 'all', label: s('all') },
    ...CATEGORY_ORDER.map((key) => ({ key, label: s(key) })),
  ];
  const foodFilters: { key: FoodFilter; label: string }[] = [
    { key: 'all', label: s('filterAll') },
    { key: 'veg', label: s('filterVeg') },
    { key: 'nonveg', label: s('filterNonveg') },
  ];

  const filtered = MENU_ITEMS.filter((item) => {
    const catMatch = activeCategory === 'all' || item.category === activeCategory;
    const typeMatch =
      activeFood === 'all' ||
      (activeFood === 'veg' && item.foodType === 'veg') ||
      (activeFood === 'nonveg' && item.foodType === 'nonveg');
    return catMatch && typeMatch;
  });

  const grouped = CATEGORY_ORDER
    .map((key) => ({ key, items: filtered.filter((i) => i.category === key) }))
    .filter((g) => g.items.length > 0);

  const pick = <T extends string>(setter: (v: T) => void, value: T, kind: string) => {
    setter(value);
    track({ event: 'menu_filter', metadata: { [kind]: value } });
  };

  const markLabel = { veg: s('veg'), egg: s('egg'), nonveg: s('nonveg') };

  const filterBtn = (active: boolean) =>
    `min-h-[44px] px-1 text-[1rem] font-semibold transition-colors underline-offset-[10px] decoration-[3px] ${
      active
        ? 'text-[var(--site-leaf-deep)] underline decoration-[var(--site-brass)]'
        : 'text-[var(--site-ink-muted)] hover:text-[var(--site-leaf-deep)]'
    }`;

  return (
    <section id="menu" aria-labelledby="menu-title" className="s-section">
      <div className="s-container">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          {/* Left: title, filters, photos */}
          <div className="lg:sticky lg:top-[calc(var(--site-header)+32px)] lg:self-start">
            <Reveal>
              <h2 id="menu-title" className="s-h2 whitespace-pre-line text-[var(--site-leaf-deep)]">
                {t('heading')}
              </h2>
              <p className="s-lead mt-5">{t('subheading')}</p>
            </Reveal>

            <div className="mt-9 space-y-5">
              <div role="group" aria-label={s('categoriesLabel')} className="flex flex-wrap gap-x-5 gap-y-1">
                {categories.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={activeCategory === key}
                    onClick={() => pick(setActiveCategory, key, 'category')}
                    className={filterBtn(activeCategory === key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div role="group" aria-label={s('filterLabel')} className="flex flex-wrap gap-x-5 gap-y-1">
                {foodFilters.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={activeFood === key}
                    onClick={() => pick(setActiveFood, key, 'food')}
                    className={filterBtn(activeFood === key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-[0.9rem] text-[var(--site-ink-soft)]">
              {(['veg', 'egg', 'nonveg'] as const).map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <span className={`s-mark s-mark-${k}`} aria-hidden="true" />
                  {markLabel[k]}
                </li>
              ))}
            </ul>

            <div className="mt-10 hidden grid-cols-2 gap-4 lg:grid">
              <div className="s-arch relative aspect-[3/4]">
                <Image src="/images/menu-tiffin.png" alt={s('photoTiffin')} fill sizes="240px" className="object-cover" />
              </div>
              <div className="s-arch relative mt-10 aspect-[3/4]">
                <Image src="/images/food/special/country-chicken.jpg" alt={s('photoSpecial')} fill sizes="240px" className="object-cover" />
              </div>
            </div>
          </div>

          {/* Right: the printed menu */}
          <div aria-live="polite">
            {grouped.length === 0 && (
              <p className="text-[1.05rem] text-[var(--site-ink-soft)]">{s('empty')}</p>
            )}

            <div className="space-y-14">
              {grouped.map(({ key, items }) => (
                <div key={key}>
                  <h3 className="s-h3 text-[var(--site-brass-text)]">{t(`categories.${key}`)}</h3>
                  <ul className="mt-5 grid grid-cols-2 gap-x-5 sm:gap-x-10">
                    {items.map((item) => {
                      const primary = locale === 'ta' ? item.nameTa : item.nameEn;
                      const secondary = locale === 'ta' ? item.nameEn : item.nameTa;
                      return (
                        <li key={item.id} className="flex items-start gap-2.5 py-2.5 sm:gap-3.5 sm:py-3">
                          <span
                            className={`s-mark s-mark-${item.foodType} mt-[0.42em]`}
                            role="img"
                            aria-label={markLabel[item.foodType]}
                          />
                          <span className="min-w-0">
                            <span className="s-serif block text-[1.05rem] font-medium leading-snug sm:text-[1.22rem] text-[var(--site-ink)]">
                              {primary}
                              {item.isSignature && (
                                <span className="ml-2 align-middle text-[0.8rem] font-semibold italic text-[var(--site-chilli)]">
                                  {s('signature')}
                                </span>
                              )}
                            </span>
                            <span className="block text-[0.88rem] text-[var(--site-ink-muted)]" lang={locale === 'ta' ? 'en' : 'ta'}>
                              {secondary}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-16 rounded-3xl bg-[var(--site-paper-deep)] p-7 md:p-9">
              <p className="s-serif text-[1.35rem] font-medium leading-snug text-[var(--site-leaf-deep)]">
                {t('fullMenuText')}
              </p>
              <p className="mt-2 text-[0.95rem] text-[var(--site-ink-soft)]">{t('pricingNote')}</p>
              <a
                href={SITE.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track({ event: 'whatsapp_open', metadata: { source: 'menu' } })}
                className="s-btn s-btn-primary mt-6"
              >
                <WhatsAppIcon size={19} />
                {t('fullMenuBtn')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
