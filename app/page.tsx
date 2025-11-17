import Hero from '@/components/Hero';
import NavigationLoader from '@/components/NavigationLoader';
import About from '@/components/About';
import Committees from '@/components/Committees';
import Schedule from '@/components/Schedule';
import Registration from '@/components/Registration';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen">
      <NavigationLoader />
      <Hero />
      <About />
      <Committees />
      <Schedule />
      <Registration />
      <Footer />
    </main>
  );
}
