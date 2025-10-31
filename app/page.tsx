import dynamic from 'next/dynamic';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Committees from '@/components/Committees';
import Schedule from '@/components/Schedule';
import Registration from '@/components/Registration';
import Footer from '@/components/Footer';

const Navigation = dynamic(() => import('@/components/Navigation'), {
  ssr: true,
});

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <About />
      <Committees />
      <Schedule />
      <Registration />
      <Footer />
    </main>
  );
}
