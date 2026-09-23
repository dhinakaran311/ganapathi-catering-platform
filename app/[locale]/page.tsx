import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNav from '@/components/layout/MobileNav';

import Hero from '@/components/home/Hero';
import Services from '@/components/home/Services';
import Story from '@/components/home/Story';
import Menu from '@/components/home/Menu';
import HowItWorks from '@/components/home/HowItWorks';
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
        <Contact />
      </main>
      <Footer />
      <MobileNav />
    </>
  );
}
