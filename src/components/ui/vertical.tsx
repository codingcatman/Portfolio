import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, type PanInfo } from "framer-motion";

export type StackImage = {
  src: string;
  alt: string;
};

export type StackCardInfo = {
  isCurrent: boolean;
  /** Resolved card size for this viewport, px — match custom card content to it. */
  width: number;
  height: number;
  /** Bring this card to the front. */
  goTo: () => void;
  /** True if the pointer that triggered this click also dragged the stack. */
  wasDragged: () => boolean;
};

export type VerticalCarouselProps<T extends StackImage> = {
  images: T[];
  /** Card brought to front on mount. Default 0. */
  initialIndex?: number;
  /** Replaces the default <img> card body with custom content (e.g. a link wrapper). */
  renderCard?: (image: T, index: number, info: StackCardInfo) => ReactNode;
  /** Card width never grows past this, px. Default 280. */
  maxCardWidth?: number;
  /** Card width never shrinks below this on short viewports, px. Default 200. */
  minCardWidth?: number;
  /** Reserved space below the stack, between its bottom and the viewport's bottom edge, px. Default 24. */
  bottomGap?: number;
  /** Width / height. Default 2/3. */
  aspectRatio?: number;
  cornerRadius?: number;
  showDots?: boolean;
  showCounter?: boolean;
  showHint?: boolean;
  /** Fires when a card is brought to the front (drag, wheel, or dot). */
  onSelect?: (index: number) => void;
  className?: string;
  style?: CSSProperties;
};

const NAV_COOLDOWN_MS = 400;
// Extra width on each side of the clipped stage so a card's box-shadow
// has room to fade out before the clip edge cuts it off flush.
const SHADOW_PAD = 50;
// How far (as a fraction of card height) the nearest peeking neighbour
// sits above/below the current card. Also drives how much taller the
// stage is than a single card, so it's the one place to tune both.
const STAGE_PAD_RATIO = 0.38;

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function VerticalCarousel<T extends StackImage>({
  images,
  initialIndex = 0,
  renderCard,
  maxCardWidth = 280,
  minCardWidth = 200,
  bottomGap = 24,
  aspectRatio = 2 / 3,
  cornerRadius = 24,
  showDots = true,
  showCounter = true,
  showHint = false,
  onSelect,
  className,
  style,
}: VerticalCarouselProps<T>) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(Math.max(initialIndex, 0), Math.max(images.length - 1, 0))
  );
  const lastNavigationTime = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggedRef = useRef(false);

  // Different mobile browsers report different visible viewport heights
  // (address bar / toolbar chrome eats into it by varying amounts), so
  // the card is sized off the real remaining space — window height minus
  // wherever this component actually starts — rather than a fixed px
  // value. That's measured, not guessed at with a fixed percentage,
  // since it also has to account for whatever sits above the carousel
  // on the page (header, rule, etc.), which this component has no way
  // to know about otherwise.
  const [availableHeight, setAvailableHeight] = useState(() =>
    typeof window === "undefined" ? 800 : window.innerHeight
  );
  useIsoLayoutEffect(() => {
    const measure = () => {
      const top = containerRef.current?.getBoundingClientRect().top ?? 0;
      setAvailableHeight(Math.max(160, window.innerHeight - top - bottomGap));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [bottomGap]);

  const navigate = useCallback(
    (direction: number) => {
      const now = Date.now();
      if (now - lastNavigationTime.current < NAV_COOLDOWN_MS) return;
      lastNavigationTime.current = now;

      setCurrentIndex((prev) => {
        if (direction > 0) return prev === images.length - 1 ? 0 : prev + 1;
        return prev === 0 ? images.length - 1 : prev - 1;
      });
    },
    [images.length]
  );

  const goTo = useCallback((index: number) => setCurrentIndex(index), []);

  const lastReported = useRef(-1);
  useEffect(() => {
    if (onSelect && currentIndex !== lastReported.current) {
      lastReported.current = currentIndex;
      onSelect(currentIndex);
    }
  }, [currentIndex, onSelect]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (Math.abs(info.offset.y) > 6) {
      draggedRef.current = true;
      window.setTimeout(() => {
        draggedRef.current = false;
      }, 60);
    }
    const threshold = 50;
    if (info.offset.y < -threshold) navigate(1);
    else if (info.offset.y > threshold) navigate(-1);
  };

  // Scoped to the carousel's own footprint, not window, so scrolling the
  // rest of the page is untouched — only a wheel gesture starting over the
  // stack itself advances it.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= 30) return;
      e.preventDefault();
      navigate(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [navigate]);

  // Resolve the card size for this viewport: fill the measured available
  // height, but never exceed maxCardWidth (derived the other way via
  // aspectRatio) or shrink past minCardWidth.
  const stackFactor = 1 + 2 * STAGE_PAD_RATIO;
  const heightCappedHeight = availableHeight / stackFactor;
  const widthCappedHeight = maxCardWidth / aspectRatio;
  const rawCardHeight = Math.min(heightCappedHeight, widthCappedHeight);
  const cardWidth = Math.max(minCardWidth, Math.round(rawCardHeight * aspectRatio));
  const cardHeight = Math.round(cardWidth / aspectRatio);

  const getCardStyle = (index: number) => {
    const total = images.length;
    let diff = index - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;

    const near = cardHeight * (STAGE_PAD_RATIO * 0.58);
    const far = cardHeight * STAGE_PAD_RATIO;
    const gone = cardHeight * (STAGE_PAD_RATIO * 1.53);

    if (diff === 0) return { y: 0, scale: 1, opacity: 1, zIndex: 5, rotateX: 0 };
    if (diff === -1) return { y: -near, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: 8 };
    if (diff === -2) return { y: -far, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: 15 };
    if (diff === 1) return { y: near, scale: 0.82, opacity: 0.6, zIndex: 4, rotateX: -8 };
    if (diff === 2) return { y: far, scale: 0.7, opacity: 0.3, zIndex: 3, rotateX: -15 };
    return { y: diff > 0 ? gone : -gone, scale: 0.6, opacity: 0, zIndex: 0, rotateX: diff > 0 ? -20 : 20 };
  };

  const isVisible = (index: number) => {
    const total = images.length;
    let diff = index - currentIndex;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return Math.abs(diff) <= 2;
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        touchAction: "pan-x",
        // This box is taller/wider than the visible card (padding for
        // shadow bleed, peeking neighbours, dots gutter) and can end up
        // overlapping page content above it (e.g. a negative-margin
        // wrapper pulling the carousel up toward a header). Only the
        // actual interactive pieces re-enable pointer events below, so
        // empty space here doesn't swallow clicks meant for whatever's
        // underneath.
        pointerEvents: "none",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          // Wider than the card itself so its box-shadow has room to
          // fade out before hitting the clip edge (overflow-x: visible
          // paired with overflow-y: hidden doesn't work — per the CSS
          // overflow spec, a non-'visible' pair forces 'visible' to
          // compute as 'auto', which still clips).
          width: cardWidth + SHADOW_PAD * 2,
          height: cardHeight * stackFactor,
          flexShrink: 0,
          overflow: "hidden",
          perspective: 1200,
        }}
      >
        {images.map((image, index) => {
          if (!isVisible(index)) return null;
          const s = getCardStyle(index);
          const isCurrent = index === currentIndex;

          return (
            <motion.div
              key={image.src + index}
              className="cursor-grab active:cursor-grabbing"
              animate={{
                y: s.y,
                scale: s.scale,
                opacity: s.opacity,
                rotateX: s.rotateX,
                zIndex: s.zIndex,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30, mass: 1 }}
              drag={isCurrent ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                marginTop: -cardHeight / 2,
                marginLeft: -cardWidth / 2,
                transformStyle: "preserve-3d",
                zIndex: s.zIndex,
                touchAction: isCurrent ? "none" : undefined,
                pointerEvents: "auto",
              }}
            >
              {renderCard ? (
                renderCard(image, index, {
                  isCurrent,
                  width: cardWidth,
                  height: cardHeight,
                  goTo: () => goTo(index),
                  wasDragged: () => draggedRef.current,
                })
              ) : (
                <div
                  style={{
                    position: "relative",
                    width: cardWidth,
                    height: cardHeight,
                    overflow: "hidden",
                    borderRadius: cornerRadius,
                    background: "var(--paper-2)",
                    boxShadow: isCurrent
                      ? "0 25px 50px -12px rgba(0,0,0,0.4)"
                      : "0 10px 30px -10px rgba(0,0,0,0.3)",
                  }}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    draggable={false}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {showDots && (
        <div
          style={{
            position: "absolute",
            // Anchored to the card's own right edge (the stage is centered
            // at 50% of this container) rather than the container's edge,
            // so the dots sit close to the card regardless of how much
            // gutter the container has around it.
            left: `calc(50% + ${cardWidth / 2 + 16}px)`,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            pointerEvents: "auto",
          }}
        >
          {images.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => index !== currentIndex && setCurrentIndex(index)}
              aria-label={`Go to image ${index + 1}`}
              style={{
                width: 8,
                height: index === currentIndex ? 24 : 8,
                borderRadius: 999,
                border: "none",
                padding: 0,
                cursor: "pointer",
                background:
                  index === currentIndex ? "var(--ink)" : "rgba(243,238,230,0.3)",
                transition: "all 300ms ease",
              }}
            />
          ))}
        </div>
      )}

      {showCounter && (
        <div
          style={{
            position: "absolute",
            left: 8,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: "var(--ink)",
          }}
        >
          <span style={{ fontSize: "1.5rem", fontWeight: 300 }}>
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
          <div style={{ width: 24, height: 1, margin: "8px 0", background: "rgba(243,238,230,0.2)" }} />
          <span style={{ fontSize: "0.8rem", color: "var(--ink-soft)" }}>
            {String(images.length).padStart(2, "0")}
          </span>
        </div>
      )}

      {showHint && (
        <div
          style={{
            position: "absolute",
            bottom: -32,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: "0.7rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--ink-soft)",
          }}
        >
          Scroll or drag
        </div>
      )}
    </div>
  );
}
