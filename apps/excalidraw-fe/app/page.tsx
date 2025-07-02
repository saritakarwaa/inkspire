import { HeroSection } from "@/components/hero-section";
import { Navbar } from "@/components/navbar";
import './globals.css';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
    </div>
  );
}
