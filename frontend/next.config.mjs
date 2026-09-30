import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
   allowedDevOrigins: [
    'https://bearing-attachment-rewards-system.trycloudflare.com',
    'bearing-attachment-rewards-system.trycloudflare.com',
     "https://decent-lots-elliott-clip.trycloudflare.com",
     "decent-lots-elliott-clip.trycloudflare.com"
  ],
};

export default withNextIntl(nextConfig);
