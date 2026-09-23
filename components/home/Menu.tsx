'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useState } from 'react';

export default function Menu() {
  const t = useTranslations('Menu');
  const [activeTab, setActiveTab] = useState<'all' | 'veg' | 'nonveg'>('all');

  const menuItems = [
    {
      key: 'bananaLeaf',
      image: '/images/hero-feast.png',
      category: 'veg'
    },
    {
      key: 'biryani',
      image: '/images/menu-biryani.png',
      category: 'nonveg'
    },
    {
      key: 'tiffin',
      image: '/images/menu-tiffin.png',
      category: 'veg'
    }
  ];

  const filteredItems = activeTab === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeTab);

  return (
    <section id="menu" className="py-16 md:py-24 bg-white">
      <div className="max-w-[1200px] w-full mx-auto px-5 md:px-8 lg:px-12">
        
        {/* Header */}
        <div className="text-center max-w-[680px] mx-auto mb-12 md:mb-16">
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

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {(['all', 'veg', 'nonveg'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-full font-body text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-[var(--color-green-800)] text-white shadow-md'
                  : 'bg-[var(--color-ivory-200)] text-[var(--color-brown-700)] hover:bg-[var(--color-ivory-300)]'
              }`}
            >
              {t(`tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
          {filteredItems.map(({ key, image }) => (
            <div
              key={key}
              className="group bg-[var(--color-ivory-100)] rounded-2xl overflow-hidden border border-[var(--color-ivory-300)] hover:border-[var(--color-gold-400)] hover:shadow-xl transition-all"
            >
              {/* Image */}
              <div className="relative w-full aspect-[4/3] bg-[var(--color-ivory-200)] overflow-hidden">
                <Image
                  src={image}
                  alt={t(`items.${key}.title`)}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <span className="inline-block font-body text-xs font-semibold text-[var(--color-gold-700)] mb-2">
                  {t(`items.${key}.tag`)}
                </span>
                
                <h3 className="font-display text-xl md:text-2xl font-bold text-[var(--color-brown-900)] mb-3">
                  {t(`items.${key}.title`)}
                </h3>
                
                <p className="font-body text-sm md:text-base text-[var(--color-brown-600)] leading-relaxed">
                  {t(`items.${key}.desc`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center bg-[var(--color-ivory-200)] rounded-2xl p-8 md:p-10 border border-[var(--color-ivory-300)]">
          <p className="font-body text-base md:text-lg text-[var(--color-brown-700)] mb-5">
            {t('fullMenuText')}
          </p>
          <a
            href="https://wa.me/919942351280"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-8 h-14 rounded-md font-body text-base font-semibold bg-[var(--color-green-800)] text-white transition-all hover:bg-[var(--color-green-900)] hover:-translate-y-px shadow-sm hover:shadow-md"
          >
            {t('fullMenuBtn')}
          </a>
        </div>

      </div>
    </section>
  );
}
