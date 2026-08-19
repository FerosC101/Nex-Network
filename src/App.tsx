import { Hero } from '@/components/Hero';
import { WhyNex } from '@/components/WhyNex';
import { RegistrationSection } from '@/components/registration/RegistrationSection';
import { Footer } from '@/components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-void">
      <main>
        <Hero />
        <WhyNex />
        <RegistrationSection />
      </main>
      <Footer />
    </div>
  );
}
