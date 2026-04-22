import { HeroSection } from "@/components/hero/HeroSection";
import { StorytellingSection } from "@/components/storytelling/StorytellingSection";
import { FoodGallery } from "@/components/gallery/FoodGallery";
import { AmbientSection } from "@/components/home/AmbientSection";
import { ReserveCTA } from "@/components/home/ReserveCTA";
import { LocationSection } from "@/components/home/LocationSection";

export default function HomePage() {
  return (
    <div className="relative -mt-16 overflow-hidden bg-xalisco-black text-xalisco-cream lg:-mt-20">
      <HeroSection />
      <StorytellingSection />
      <FoodGallery />
      <AmbientSection />
      <ReserveCTA />
      <LocationSection />
    </div>
  );
}
