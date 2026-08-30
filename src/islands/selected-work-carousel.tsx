import { createRoot } from "react-dom/client";
import type { CSSProperties, ReactNode } from "react";
import RingCarousel, { type RingImage } from "@/components/ui/ring-carousel";

type CategoryItem = RingImage & { href: string; icon: ReactNode };

const categories: CategoryItem[] = [
  {
    alt: "Product Design",
    href: "work/product-design/index.html",
    icon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" stroke="currentColor" fill="none" strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d="M55,7 L13,49" />
        <path d="M13,49 L6,58 L18,53 Z" fill="currentColor" stroke="none" />
        <path d="M8,57 C 14,63 22,57 28,59 C 35,61 41,55 47,57" />
      </svg>
    ),
  },
  {
    alt: "CAD Models",
    href: "work/cad-models/index.html",
    icon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" stroke="currentColor" fill="none" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d="M32,4 L56,18 L56,46 L32,60 L8,46 L8,18 Z" />
        <path d="M32,4 L32,32 M32,32 L56,46 M32,32 L8,46" />
        <path d="M32,32 L56,18 M32,32 L8,18 M32,32 L32,60" strokeDasharray="2.5 3.5" />
      </svg>
    ),
  },
  {
    alt: "Projects",
    href: "work/projects/index.html",
    icon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" stroke="currentColor" fill="none" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <path d="M8,18 C8,16 10,14 12,14 L26,14 L30,20 L52,20 C54,20 56,22 56,24 L56,48 C56,50 54,52 52,52 L12,52 C10,52 8,50 8,48 Z" />
      </svg>
    ),
  },
  {
    alt: "Photography",
    href: "work/photography/index.html",
    icon: (
      <svg viewBox="0 0 64 64" width="100%" height="100%" stroke="currentColor" fill="none" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
        <rect x={24} y={12} width={16} height={9} rx={2} />
        <rect x={8} y={19} width={48} height={33} rx={4} />
        <circle cx={32} cy={37} r={10} />
        <circle cx={47} cy={27} r={1.4} fill="currentColor" stroke="none" />
      </svg>
    ),
  },
];

const el = document.getElementById("selected-work-carousel-root");
if (el) {
  createRoot(el).render(
    <RingCarousel
      images={categories}
      aspectRatio={1}
      autoRotate={false}
      showDots
      dotsGap={16}
      snapOnRelease
      tone="ink"
      viewportWidthRatio={0.72 * 0.6}
      minCardWidth={120}
      style={
        {
          background: "transparent",
          "--color-accent": "#90C2E7", // Sky Blue, matches --accent in assets/site.css
        } as CSSProperties
      }
      renderCard={(img, _i, { width, cardHeight, k, goTo, wasDragged }) => {
        const item = img as CategoryItem;
        const isFront = k > 0.9;
        return (
          <a
            href={item.href}
            aria-label={item.alt}
            onClick={(e) => {
              if (wasDragged()) {
                e.preventDefault();
                return;
              }
              if (!isFront) {
                e.preventDefault();
                goTo();
              }
            }}
            style={{
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              width,
              height: cardHeight,
              padding: 12,
              border: "1px solid var(--line, rgba(243,238,230,0.18))",
              borderRadius: 12,
              backgroundColor: "#8A8377",
              color: "var(--ink, #F3EEE6)",
              textDecoration: "none",
              opacity: 0.55 + 0.45 * k,
            }}
          >
            <span
              aria-hidden
              style={{
                width: "clamp(30px, 14vw, 46px)",
                height: "clamp(30px, 14vw, 46px)",
                display: "block",
              }}
            >
              {item.icon}
            </span>
            <span
              style={{
                fontFamily: '"Marcellus", Georgia, "Times New Roman", serif',
                fontSize: "0.78rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              {item.alt}
            </span>
          </a>
        );
      }}
    />
  );
}
