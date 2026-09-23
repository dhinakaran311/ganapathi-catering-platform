import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
   allowedDevOrigins: [
    'extra-bicycle-calculators-mistress.trycloudflare.com',
  ],
};

export default withNextIntl(nextConfig);
