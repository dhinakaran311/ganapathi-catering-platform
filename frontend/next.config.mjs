import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
   allowedDevOrigins: [
    'https://silk-identity-basket-refinance.trycloudflare.com',
    'silk-identity-basket-refinance.trycloudflare.com',
  ],
};

export default withNextIntl(nextConfig);
