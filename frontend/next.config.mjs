import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
   allowedDevOrigins: [
     "https://evanescence-subsidiary-functions-reconstruction.trycloudflare.com",
     "evanescence-subsidiary-functions-reconstruction.trycloudflare.com"
  ],
};

export default withNextIntl(nextConfig);
