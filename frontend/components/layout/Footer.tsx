// components/layout/Footer.tsx — Public footer (server component).

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { SITE } from '@/lib/site';

export default function Footer() {
  const nav = useTranslations('Site.nav');
  const f = useTranslations('Site.footer');
  const footer = useTranslations('Footer');
  const contact = useTranslations('Contact.card');
  const locale = useLocale();
  const home = `/${locale}`;

  const links = [
    { href: `${home}#services`, label: nav('services') },
    { href: `${home}#menu`, label: nav('menu') },
    { href: `${home}#howItWorks`, label: nav('process') },
    { href: `${home}#pricing`, label: nav('pricing') },
    { href: `${home}/gallery`, label: nav('gallery') },
    { href: `${home}#contact`, label: nav('contact') },
    { href: `${home}/track`, label: nav('track') },
  ];

  return (
    <footer className="s-dark pb-10 pt-20 md:pt-28">
      <div className="s-container">
        <div className="grid gap-14 lg:grid-cols-[1.3fr_0.7fr_1fr]">
          <div>
            <Link href={home} className="s-serif block text-[clamp(2.4rem,6vw,4.2rem)] font-semibold leading-[1.1]" lang="ta">
              ஸ்ரீ கணபதி மெஸ்
            </Link>
            <p className="mt-6 max-w-[46ch] text-[1rem] leading-relaxed text-[var(--site-on-dark-soft)]">
              {footer('tagline')}
            </p>
          </div>

          <nav aria-label={f('explore')}>
            <h2 className="text-[0.85rem] font-semibold text-[var(--site-brass-light)]">{f('explore')}</h2>
            <ul className="mt-5 space-y-2.5">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-[1.02rem] transition-colors hover:text-[var(--site-brass-light)]">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-[0.85rem] font-semibold text-[var(--site-brass-light)]">{f('reach')}</h2>
            <ul className="mt-5 space-y-2.5 text-[1.02rem]">
              <li><a href={SITE.phoneTel} className="transition-colors hover:text-[var(--site-brass-light)]">{SITE.phoneDisplay}</a></li>
              <li>
                <a href={SITE.whatsappUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--site-brass-light)]">
                  WhatsApp
                </a>
              </li>
              <li className="whitespace-pre-line pt-2 leading-relaxed text-[var(--site-on-dark-soft)]">{contact('addressText')}</li>
              <li className="whitespace-pre-line leading-relaxed text-[var(--site-on-dark-soft)]">{contact('hoursText')}</li>
            </ul>
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-3 text-[0.88rem] text-[var(--site-on-dark-soft)] md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Shri Ganapathi Mess. {footer('rights')}</p>
          <p>{f('cooked')}</p>
        </div>
      </div>
    </footer>
  );
}
