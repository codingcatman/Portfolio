import { createRoot } from "react-dom/client";
import { useEffect, useState, type CSSProperties } from "react";
import RingCarousel, { type RingImage } from "@/components/ui/ring-carousel";

const images: RingImage[] = [
  { src: "images/01.jpg", alt: "Bird" },
  { src: "images/02.jpg", alt: "Blue tit on a bird feeder" },
  { src: "images/03.jpg", alt: "Nuthatch on a bird feeder" },
  { src: "images/04.jpg", alt: "Nyhavn, Copenhagen" },
  { src: "images/05.jpg", alt: "Stars" },
  { src: "images/06.jpg", alt: "Fire" },
  { src: "images/07.jpg", alt: "Moon" },
  { src: "images/08.jpg", alt: "Skateboarding" },
  { src: "images/10.jpg", alt: "Antique piano" },
  { src: "images/11.jpg", alt: "Frog among lily pads" },
  { src: "images/12.jpg", alt: "Naval officer in a park" },
  { src: "images/13.jpg", alt: "Shore crab" },
];

// Matches the breakpoint this page already locks its viewport at (see the
// inline <style> in nikon-d750/index.html), so "mobile" means the same
// thing here as it does for the rest of the page's layout.
const MOBILE_BREAKPOINT = 640;

function PhotoCarousel() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= MOBILE_BREAKPOINT
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <RingCarousel
      images={images}
      showDots
      spinSpeed={4}
      autoRotate={!isMobile}
      snapOnRelease={isMobile}
      cardWidth={600}
      tone="ink"
      style={
        {
          background: "transparent",
          "--color-accent": "#90C2E7", // Sky Blue, matches --accent in assets/site.css
        } as CSSProperties
      }
    />
  );
}

const el = document.getElementById("photo-carousel-root");
if (el) {
  createRoot(el).render(<PhotoCarousel />);
}
