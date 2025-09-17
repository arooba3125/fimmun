import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Committees from '@/components/Committees';
import Schedule from '@/components/Schedule';
import Registration from '@/components/Registration';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <About />
      <Committees />
      <Schedule />
      <Registration />
      <Testimonials />
      <Footer />
    </main>
  );
}
