import { createRoot } from "react-dom/client";
import VerticalCarousel, {
  type StackImage,
} from "@/components/ui/vertical";

type WorkItem = StackImage & { href: string };

const items: WorkItem[] = [
  {
    src: "the-dome/dome_ab.png",
    alt: "The Dome",
    href: "the-dome/index.html",
  },
  {
    src: "the-diamond/lamp_ab.png",
    alt: "The Diamond",
    href: "the-diamond/index.html",
  },
  {
    src: "trophy/trophy_ab.png",
    alt: "Trophy",
    href: "trophy/index.html",
  },
];

const MAX_CARD_WIDTH = 340;
const ASPECT_RATIO = 4 / 5;

const STORAGE_KEY = "product-design-carousel-index";

function readInitialIndex(): number {
  try {
    const stored = Number(sessionStorage.getItem(STORAGE_KEY));
    return Number.isInteger(stored) && stored >= 0 && stored < items.length
      ? stored
      : 0;
  } catch {
    return 0;
  }
}

const el = document.getElementById("product-design-carousel-root");
if (el) {
  createRoot(el).render(
    <VerticalCarousel
      images={items}
      initialIndex={readInitialIndex()}
      onSelect={(i) => {
        try {
          sessionStorage.setItem(STORAGE_KEY, String(i));
        } catch {
          // sessionStorage unavailable (e.g. private mode) — not fatal.
        }
      }}
      maxCardWidth={MAX_CARD_WIDTH}
      aspectRatio={ASPECT_RATIO}
      cornerRadius={10}
      showDots
      showCounter={false}
      renderCard={(item, _i, { isCurrent, width, height, goTo, wasDragged }) => (
        <a
          href={item.href}
          aria-label={item.alt}
          onClick={(e) => {
            if (wasDragged()) {
              e.preventDefault();
              return;
            }
            if (!isCurrent) {
              e.preventDefault();
              goTo();
            }
          }}
          style={{
            position: "relative",
            display: "block",
            width,
            height,
            borderRadius: 10,
            overflow: "hidden",
            boxShadow: isCurrent
              ? "0 25px 50px -12px rgba(0,0,0,0.4)"
              : "0 10px 30px -10px rgba(0,0,0,0.3)",
          }}
        >
          <img
            src={item.src}
            alt=""
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background: isCurrent ? "transparent" : "rgba(12,11,8,0.35)",
            }}
          />
        </a>
      )}
    />
  );
}
