import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

import Hero from '@/components/home/Hero';
import Services from '@/components/home/Services';
import Story from '@/components/home/Story';
import Menu from '@/components/home/Menu';
import HowItWorks from '@/components/home/HowItWorks';
import Pricing from '@/components/home/Pricing';
import ReviewWidget from '@/components/home/ReviewWidget';
import ServiceAreaCheckerSection from '@/components/home/ServiceAreaCheckerSection';
import Contact from '@/components/home/Contact';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Story />
        <Menu />
        <HowItWorks />
        <Pricing />
        <ReviewWidget />
        <ServiceAreaCheckerSection />
        <Contact />
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
