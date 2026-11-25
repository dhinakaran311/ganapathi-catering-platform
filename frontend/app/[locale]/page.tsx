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

// Section order tells one story: who we are (hero) → what we cater for →
// whose cooking it is → what's on the menu → how ordering works → what it
// costs → what families say → whether we reach you → get in touch.
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
