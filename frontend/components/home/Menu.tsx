'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

type Category = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'special';
type FoodType = 'all' | 'veg' | 'nonveg';

interface MenuItem {
  id: number;
  nameEn: string;
  nameTa: string;
  category: Category;
  foodType: 'veg' | 'egg' | 'nonveg';
  isSignature?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  // Breakfast
  { id: 1,  nameEn: 'Idly',                    nameTa: 'இட்லி',                    category: 'breakfast', foodType: 'veg' },
  { id: 2,  nameEn: 'Poori',                   nameTa: 'பூரி',                     category: 'breakfast', foodType: 'veg' },
  { id: 3,  nameEn: 'Pongal',                  nameTa: 'பொங்கல்',                  category: 'breakfast', foodType: 'veg' },
  { id: 4,  nameEn: 'Ghee Dosa',               nameTa: 'நெய் தோசை',                category: 'breakfast', foodType: 'veg' },
  { id: 5,  nameEn: 'Garlic Dosa',             nameTa: 'பூண்டு தோசை',              category: 'breakfast', foodType: 'veg' },
  { id: 6,  nameEn: 'Roast Dosa',              nameTa: 'ரோஸ்ட் தோசை',             category: 'breakfast', foodType: 'veg' },
  { id: 7,  nameEn: 'Masala Roast',            nameTa: 'மசாலா ரோஸ்ட்',            category: 'breakfast', foodType: 'veg' },
  { id: 8,  nameEn: 'Podi Roast',              nameTa: 'பொடி ரோஸ்ட்',             category: 'breakfast', foodType: 'veg' },
  { id: 9,  nameEn: 'Onion Uthappam',          nameTa: 'வெங்காய உத்தப்பம்',        category: 'breakfast', foodType: 'veg' },
  { id: 10, nameEn: 'Plain Uthappam',          nameTa: 'சாதா உத்தப்பம்',           category: 'breakfast', foodType: 'veg' },
  { id: 11, nameEn: 'Podi Uthappam',           nameTa: 'பொடி உத்தப்பம்',           category: 'breakfast', foodType: 'veg' },
  { id: 12, nameEn: 'Wheat Uppuma',            nameTa: 'கோதுமை உப்புமா',           category: 'breakfast', foodType: 'veg' },
  { id: 13, nameEn: 'Paruppu Sadham',          nameTa: 'பருப்பு சாதம்',             category: 'breakfast', foodType: 'veg' },
  { id: 14, nameEn: 'Omelette',                nameTa: 'ஆம்லெட்',                  category: 'breakfast', foodType: 'egg' },
  { id: 15, nameEn: 'Boiled Egg',              nameTa: 'வேக வைத்த முட்டை',         category: 'breakfast', foodType: 'egg' },
  // Lunch
  { id: 16, nameEn: 'White Rice',              nameTa: 'வெள்ளை சாதம்',             category: 'lunch', foodType: 'veg' },
  { id: 17, nameEn: 'Sambar',                  nameTa: 'சாம்பார்',                  category: 'lunch', foodType: 'veg' },
  { id: 18, nameEn: 'Puli Kolambu',            nameTa: 'புளி குழம்பு',              category: 'lunch', foodType: 'veg' },
  { id: 19, nameEn: 'Rasam',                   nameTa: 'ரசம்',                      category: 'lunch', foodType: 'veg' },
  { id: 20, nameEn: 'Fish Kolambu',            nameTa: 'மீன் குழம்பு',              category: 'lunch', foodType: 'nonveg' },
  { id: 21, nameEn: 'Chicken Kolambu',         nameTa: 'கோழி குழம்பு',              category: 'lunch', foodType: 'nonveg' },
  { id: 22, nameEn: 'Poriyal',                 nameTa: 'பொரியல்',                   category: 'lunch', foodType: 'veg' },
  { id: 23, nameEn: 'Vadam & Vadai',           nameTa: 'வடாம் & வடை',              category: 'lunch', foodType: 'veg' },
  { id: 24, nameEn: 'Appalam',                 nameTa: 'அப்பளம்',                   category: 'lunch', foodType: 'veg' },
  { id: 25, nameEn: 'Curd',                    nameTa: 'தயிர்',                     category: 'lunch', foodType: 'veg' },
  { id: 26, nameEn: 'Payasam',                 nameTa: 'பாயாசம்',                  category: 'lunch', foodType: 'veg' },
  // Dinner
  { id: 27, nameEn: 'Idly',                    nameTa: 'இட்லி',                    category: 'dinner', foodType: 'veg' },
  { id: 28, nameEn: 'Roast Dosa',              nameTa: 'ரோஸ்ட் தோசை',             category: 'dinner', foodType: 'veg' },
  { id: 29, nameEn: 'Onion Dosa',              nameTa: 'வெங்காய தோசை',             category: 'dinner', foodType: 'veg' },
  { id: 30, nameEn: 'Garlic Dosa',             nameTa: 'பூண்டு தோசை',              category: 'dinner', foodType: 'veg' },
  { id: 31, nameEn: 'Ghee Dosa',               nameTa: 'நெய் தோசை',                category: 'dinner', foodType: 'veg' },
  { id: 32, nameEn: 'Chapathi',                nameTa: 'சப்பாத்தி',                 category: 'dinner', foodType: 'veg' },
  { id: 33, nameEn: 'Parotta',                 nameTa: 'பரோட்டா',                   category: 'dinner', foodType: 'veg' },
  { id: 34, nameEn: 'Veechu Parotta',          nameTa: 'வீச்சு பரோட்டா',           category: 'dinner', foodType: 'veg' },
  { id: 35, nameEn: 'Omelette',                nameTa: 'ஆம்லெட்',                  category: 'dinner', foodType: 'egg' },
  // Snacks
  { id: 36, nameEn: 'Bajji',                   nameTa: 'பஜ்ஜி',                    category: 'snacks', foodType: 'veg' },
  { id: 37, nameEn: 'Bonda',                   nameTa: 'போண்டா',                   category: 'snacks', foodType: 'veg' },
  { id: 38, nameEn: 'Vadai',                   nameTa: 'வடை',                      category: 'snacks', foodType: 'veg' },
  { id: 39, nameEn: 'Sundal',                  nameTa: 'சுண்டல்',                  category: 'snacks', foodType: 'veg' },
  // Special Non-Veg
  { id: 40, nameEn: 'Country Chicken Curry',   nameTa: 'நாட்டுக்கோழி குழம்பு',    category: 'special', foodType: 'nonveg', isSignature: true },
  { id: 41, nameEn: 'Country Chicken Gravy',   nameTa: 'நாட்டுக்கோழி கிரேவி',     category: 'special', foodType: 'nonveg', isSignature: true },
  { id: 42, nameEn: 'Chettinad Chicken Gravy', nameTa: 'சிந்தாமணி கிரேவி',        category: 'special', foodType: 'nonveg', isSignature: true },
];

const FOOD_TYPE_DOT: Record<string, string> = {
  veg:    'bg-green-500',
  egg:    'bg-yellow-500',
  nonveg: 'bg-red-500',
};

const FOOD_TYPE_BG: Record<string, string> = {
  veg:    'bg-green-50 text-green-700 border-green-200',
  egg:    'bg-yellow-50 text-yellow-700 border-yellow-200',
  nonveg: 'bg-red-50 text-red-700 border-red-200',
};

const FOOD_TYPE_LABEL: Record<string, string> = {
  veg:    'Veg',
  egg:    'Egg',
  nonveg: 'Non-Veg',
};

const CATEGORY_ICON: Record<string, string> = {
  breakfast: 'Morning Tiffin',
  lunch:     'Full Meals',
  dinner:    'Dinner',
  snacks:    'Snacks',
  special:   'Special Non-Veg',
};

export default function Menu() {
  const t = useTranslations('Menu');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [activeFoodType, setActiveFoodType] = useState<FoodType>('all');

  const categories: { key: Category; label: string }[] = [
    { key: 'all',       label: 'All Items' },
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch',     label: 'Lunch' },
    { key: 'dinner',    label: 'Dinner' },
    { key: 'snacks',    label: 'Snacks' },
    { key: 'special',   label: 'Special Non-Veg' },
  ];

  const foodFilters: { key: FoodType; label: string }[] = [
    { key: 'all',    label: 'All' },
    { key: 'veg',    label: 'Veg Only' },
    { key: 'nonveg', label: 'Non-Veg' },
  ];

  const filtered = MENU_ITEMS.filter((item) => {
    const catMatch = activeCategory === 'all' || item.category === activeCategory;
    const typeMatch =
      activeFoodType === 'all' ||
      (activeFoodType === 'veg' && item.foodType === 'veg') ||
      (activeFoodType === 'nonveg' && item.foodType === 'nonveg');
    return catMatch && typeMatch;
  });

  // Group by category for the list view
  const grouped = categories
    .filter((c) => c.key !== 'all')
    .map((c) => ({
      ...c,
      items: filtered.filter((item) => item.category === c.key),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <section id="menu" className="py-16 md:py-24 bg-white">
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12">

        {/* Header */}
        <div className="text-center max-w-[680px] mx-auto mb-10 md:mb-14">
          <span className="inline-flex items-center gap-2 font-body text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-gold-700)] mb-4">
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
            {t('label')}
            <span className="w-6 h-px bg-[var(--color-gold-700)]"></span>
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--color-brown-900)] leading-[1.15] whitespace-pre-line mb-3">
            {t('heading')}
          </h2>
          <p className="font-body text-base md:text-lg text-[var(--color-brown-600)] italic">
            {t('subheading')}
          </p>
        </div>

        {/* Category Tabs — horizontal scroll on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {categories.map(({ key, label }) => (
            <button
              key={key}
              id={`menu-tab-${key}`}
              onClick={() => setActiveCategory(key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-body text-sm font-semibold transition-all whitespace-nowrap ${
                activeCategory === key
                  ? 'bg-[var(--color-green-800)] text-white shadow-md'
                  : 'bg-[var(--color-ivory-200)] text-[var(--color-brown-700)] hover:bg-[var(--color-ivory-300)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Veg / Non-Veg Filter */}
        <div className="flex items-center gap-2 mb-8">
          <span className="font-body text-xs text-[var(--color-brown-500)] font-medium">Filter:</span>
          {foodFilters.map(({ key, label }) => (
            <button
              key={key}
              id={`menu-filter-${key}`}
              onClick={() => setActiveFoodType(key)}
              className={`px-3 py-1.5 rounded-md font-body text-xs font-semibold border transition-all ${
                activeFoodType === key
                  ? 'bg-[var(--color-brown-900)] text-white border-[var(--color-brown-900)]'
                  : 'bg-white text-[var(--color-brown-700)] border-[var(--color-ivory-300)] hover:border-[var(--color-brown-400)]'
              }`}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto font-body text-xs text-[var(--color-brown-400)]">
            {filtered.length} items
          </span>
        </div>

        {/* Menu List — grouped by category */}
        <div className="space-y-8 mb-12">
          {grouped.map(({ key, label, items }) => (
            <div key={key}>
              {/* Category heading */}
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-display text-lg md:text-xl font-bold text-[var(--color-brown-900)]">
                  {CATEGORY_ICON[key]}
                </h3>
                <div className="flex-1 h-px bg-[var(--color-ivory-300)]" />
                <span className="font-body text-xs text-[var(--color-brown-400)]">{items.length} items</span>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`relative flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
                      item.isSignature
                        ? 'bg-[var(--color-ivory-100)] border-[var(--color-gold-300)] hover:border-[var(--color-gold-500)]'
                        : 'bg-[var(--color-ivory-100)] border-[var(--color-ivory-300)] hover:border-[var(--color-gold-300)]'
                    }`}
                  >
                    {/* Food type dot */}
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-3 h-3 rounded-sm border-2 border-white ring-1 ring-gray-200 ${FOOD_TYPE_DOT[item.foodType]}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className="font-body text-sm font-semibold text-[var(--color-brown-900)] leading-tight">
                          {item.nameEn}
                        </p>
                        {item.isSignature && (
                          <span className="flex-shrink-0 text-[var(--color-gold-600)] text-xs">★</span>
                        )}
                      </div>
                      <p className="font-body text-xs text-[var(--color-brown-500)] mt-0.5">
                        {item.nameTa}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="font-body text-[var(--color-brown-400)]">No items match your filter.</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-8 px-4 py-3 bg-[var(--color-ivory-100)] rounded-xl border border-[var(--color-ivory-300)]">
          {(['veg', 'egg', 'nonveg'] as const).map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${FOOD_TYPE_DOT[type]}`} />
              <span className="font-body text-xs text-[var(--color-brown-600)]">{FOOD_TYPE_LABEL[type]}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--color-gold-600)] text-xs">★</span>
            <span className="font-body text-xs text-[var(--color-brown-600)]">Signature Dish</span>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { price: '₹90', label: 'per person', desc: 'Simple meal package', accent: false },
            { price: '₹130', label: 'per person', desc: 'Full meals package', accent: true },
            { price: 'Custom', label: 'pricing', desc: 'For special menus & non-veg', accent: false },
          ].map(({ price, label, desc, accent }) => (
            <div
              key={price}
              className={`rounded-xl p-5 text-center border transition-all ${
                accent
                  ? 'bg-[var(--color-green-900)] border-[var(--color-green-800)] text-white shadow-md'
                  : 'bg-[var(--color-ivory-100)] border-[var(--color-ivory-300)]'
              }`}
            >
              <div className={`font-display text-3xl font-bold mb-0.5 ${accent ? 'text-[var(--color-gold-300)]' : 'text-[var(--color-gold-600)]'}`}>
                {price}
              </div>
              <div className={`font-body text-xs font-semibold mb-2 ${accent ? 'text-white/70' : 'text-[var(--color-brown-500)]'}`}>
                {label}
              </div>
              <div className={`font-body text-sm ${accent ? 'text-white/90' : 'text-[var(--color-brown-700)]'}`}>
                {desc}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-[var(--color-ivory-200)] rounded-2xl p-6 md:p-8 border border-[var(--color-ivory-300)]">
          <p className="font-body text-sm md:text-base text-[var(--color-brown-600)] mb-2">
            Min. 100 persons per order · Max 500 persons
          </p>
          <p className="font-body text-sm text-[var(--color-brown-500)] mb-5">
            {t('fullMenuText')}
          </p>
          <a
            href="https://wa.me/919942351280"
            target="_blank"
            rel="noopener noreferrer"
            id="menu-whatsapp-cta"
            className="inline-flex items-center justify-center gap-2 px-8 h-14 rounded-md font-body text-base font-semibold bg-[var(--color-green-800)] text-white transition-all hover:bg-[var(--color-green-900)] hover:-translate-y-px shadow-sm hover:shadow-md w-full sm:w-auto"
          >
            Get Full Menu on WhatsApp
          </a>
        </div>

      </div>
    </section>
  );
}
