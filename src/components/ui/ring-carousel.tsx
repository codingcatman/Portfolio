import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";

export type RingImage = {
  /** Required unless renderCard supplies its own visuals. */
  src?: string;
  alt: string;
  /** Optional srcSet / sizes if you serve responsive images. */
  srcSet?: string;
  sizes?: string;
};

export type RingCardInfo = {
  width: number;
  cardHeight: number;
  /** 1 = frontmost card, 0 = directly behind the stage. */
  k: number;
  /** Bring this card to the front. */
  goTo: () => void;
  /** True if the pointer that triggered this click also dragged the ring. */
  wasDragged: () => boolean;
};

export type RingCarouselProps = {
  images: RingImage[];
  /** Card brought to the front on mount. Default 0. */
  initialIndex?: number;
  /** Replaces the default image-card rendering with custom content (e.g. an icon + label). */
  renderCard?: (image: RingImage, index: number, info: RingCardInfo) => ReactNode;
  /** Card width in px. Height is derived from aspectRatio. Default 440. */
  cardWidth?: number;
  /** Card width never shrinks below this on narrow viewports, px. Default 200. */
  minCardWidth?: number;
  /** Effective card width as a share of viewport width, before the cardWidth cap. Default 0.72. */
  viewportWidthRatio?: number;
  /** Width / height. Default 4/3. */
  aspectRatio?: number;
  /** Extra px of arc between neighbouring cards. Default 46. */
  gap?: number;
  /** Multiplier on the computed ring radius. >1 spreads the ring out. Default 1. */
  ringTightness?: number;
  /** Corner radius of each frame, px. Default 10. */
  cornerRadius?: number;
  /** Continuous spin, degrees per second. Default 9. Set 0 or autoRotate={false} to stop. */
  spinSpeed?: number;
  autoRotate?: boolean;
  /** Stage background. Default "cream". */
  tone?: "cream" | "ink";
  /** Stage height in px. Defaults to cardHeight + 110. */
  height?: number;
  /** Position dots under the ring. Default false. */
  showDots?: boolean;
  /** Vertical space between the ring and the dots row, px. Default 48. */
  dotsGap?: number;
  /** Snap to the nearest card as soon as a drag/swipe ends, instead of leaving it wherever released. Default false. */
  snapOnRelease?: boolean;
  /** Fires when a frame is brought to the front (click, drag-settle, or dot). */
  onSelect?: (index: number) => void;
  className?: string;
  style?: CSSProperties;
};

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function RingCarousel({
  images,
  initialIndex = 0,
  renderCard,
  cardWidth = 440,
  minCardWidth = 200,
  viewportWidthRatio = 0.72,
  aspectRatio = 4 / 3,
  gap = 46,
  ringTightness = 1,
  cornerRadius = 0,
  spinSpeed = 9,
  autoRotate = true,
  tone = "cream",
  height,
  showDots = false,
  dotsGap = 48,
  snapOnRelease = false,
  onSelect,
  className,
  style,
}: RingCarouselProps) {
  const n = images.length;

  // Cards are a fixed px size by design; on narrow viewports that overflows
  // the stage, so cap the effective width to a share of the viewport.
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? cardWidth : window.innerWidth
  );
  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const width = Math.min(
    cardWidth,
    Math.max(minCardWidth, viewportWidth * viewportWidthRatio)
  );

  const cardHeight = Math.round(width / aspectRatio);
  const step = n > 0 ? 360 / n : 360;
  // Degrees rotated per pixel dragged. A flat constant here makes carousels
  // with more cards (smaller `step`) feel far more sensitive, since the same
  // finger movement crosses a much bigger fraction of a card's arc. Scaling
  // by `step` keeps "how far you must swipe to advance one card" constant
  // across carousels — calibrated so a 5-card ring (72° step, the front-page
  // carousel) keeps its original 0.14°/px feel.
  const dragSensitivity = step * (0.14 / 72);
  const radius = useMemo(
    () =>
      (width / 2 + gap) / Math.tan(((step / 2) * Math.PI) / 180) *
      ringTightness,
    [width, gap, step, ringTightness]
  );

  const stageRef = useRef<HTMLDivElement | null>(null);
  const angleRef = useRef(-initialIndex * step);
  const targetRef = useRef<number | null>(null);
  const boostRef = useRef(0);
  const dragRef = useRef<{
    x: number;
    y: number;
    angle: number;
    moved: number;
    locked: "x" | "y" | null;
  } | null>(null);
  const movedRef = useRef(0);
  const [angle, setAngle] = useState(() => -initialIndex * step);
  const [dragging, setDragging] = useState(false);

  const index = useMemo(() => {
    if (!n) return 0;
    return ((Math.round(-angle / step) % n) + n) % n;
  }, [angle, step, n]);

  const lastReported = useRef(-1);
  useEffect(() => {
    if (onSelect && index !== lastReported.current) {
      lastReported.current = index;
      onSelect(index);
    }
  }, [index, onSelect]);

  // Continuous spin + eased snap + wheel momentum, all on one rAF clock.
  useEffect(() => {
    if (!n) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      let a = angleRef.current;
      let changed = false;

      if (targetRef.current !== null && !dragRef.current) {
        const d = targetRef.current - a;
        if (Math.abs(d) < 0.05) {
          a = targetRef.current;
          targetRef.current = null;
        } else {
          a += d * Math.min(1, dt * 7);
        }
        changed = true;
      } else if (!dragRef.current) {
        if (autoRotate && spinSpeed !== 0) {
          a -= spinSpeed * dt;
          changed = true;
        }
        if (Math.abs(boostRef.current) > 0.02) {
          a += boostRef.current * dt;
          boostRef.current *= Math.pow(0.02, dt); // exponential decay
          changed = true;
        } else {
          boostRef.current = 0;
        }
      }
      if (changed) {
        angleRef.current = a;
        setAngle(a);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate, spinSpeed, n]);

  // Wheel needs a non-passive native listener to preventDefault page scroll.
  // Only hijack genuinely horizontal scroll gestures (trackpad sideways
  // swipe, shift+wheel) — plain vertical scrolling passes through untouched
  // so the page still scrolls normally with the cursor over the carousel.
  useIsoLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      targetRef.current = null;
      boostRef.current = Math.max(
        -600,
        Math.min(600, boostRef.current - e.deltaX * 1.0)
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const t = -i * step;
      const k = Math.round((angleRef.current - t) / 360);
      targetRef.current = t + k * 360;
      boostRef.current = 0;
    },
    [step]
  );

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    // Don't capture or commit yet — a touch here might turn out to be a
    // vertical page scroll, which onPointerMove below sorts out first.
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      angle: angleRef.current,
      moved: 0,
      locked: null,
    };
    targetRef.current = null;
    boostRef.current = 0;
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;

    if (drag.locked === null) {
      // Wait for a small, unambiguous movement before picking an axis, so a
      // mostly-vertical touch scrolls the page instead of also spinning the
      // ring (and a mostly-horizontal one doesn't also scroll the page).
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.locked = "y";
        dragRef.current = null; // hand the gesture back to native scrolling
        return;
      }
      drag.locked = "x";
      e.currentTarget.setPointerCapture?.(e.pointerId);
      setDragging(true);
    }

    drag.moved = Math.max(drag.moved, Math.abs(dx));
    angleRef.current = drag.angle + dx * dragSensitivity;
    setAngle(angleRef.current);
  }, [dragSensitivity]);

  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    if (!drag) return;
    movedRef.current = drag.moved;
    dragRef.current = null;
    setDragging(false);
    window.setTimeout(() => {
      movedRef.current = 0;
    }, 60);

    if (snapOnRelease && n > 0 && drag.locked === "x") {
      // Angle moved during this drag. A short, deliberate swipe (past
      // ~18% of a step) always advances a full card, so a quick flick
      // never leaves the ring parked between two cards; anything past
      // that just rounds to the nearest card it ended up closest to.
      const angleMoved = angleRef.current - drag.angle;
      const stepsMoved = -angleMoved / step;
      const startIndex = Math.round(-drag.angle / step);
      const rounded = Math.round(stepsMoved);
      const targetIndex =
        Math.abs(stepsMoved) < 0.18
          ? startIndex
          : startIndex + (rounded === 0 ? Math.sign(stepsMoved) : rounded);
      goTo(targetIndex);
    }
  }, [snapOnRelease, n, step, goTo]);

  const ink = tone === "ink";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: dotsGap,
        background: ink ? "#17150f" : "var(--color-bg, #f5ead8)",
        overflow: "hidden",
        transition: "background 400ms ease",
        ...style,
      }}
    >
      <div
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: "relative",
          width: "100%",
          height: height ?? cardHeight + 110,
          perspective: 1500,
          perspectiveOrigin: "50% 46%",
          cursor: dragging ? "grabbing" : "grab",
          touchAction: "pan-y",
          userSelect: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(-${radius}px) rotateY(${angle}deg)`,
          }}
        >
          {images.map((img, i) => {
            const eff = ((((i * step + angle) % 360) + 540) % 360) - 180;
            const k = (Math.cos((eff * Math.PI) / 180) + 1) / 2; // 1 = front, 0 = back
            return (
              <div
                key={img.src + i}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  marginTop: -cardHeight / 2,
                  marginLeft: -width / 2,
                  transform: `rotateY(${i * step}deg) translateZ(${radius}px) scale(${
                    0.86 + 0.14 * k
                  })`,
                  opacity: 0.3 + 0.7 * k,
                  pointerEvents: k > 0.35 ? "auto" : "none",
                }}
              >
                {renderCard ? (
                  renderCard(img, i, {
                    width,
                    cardHeight,
                    k,
                    goTo: () => goTo(i),
                    wasDragged: () => !!movedRef.current,
                  })
                ) : (
                  <button
                    type="button"
                    aria-label={img.alt}
                    onClick={() => {
                      if (!movedRef.current) goTo(i);
                    }}
                    style={{
                      position: "relative",
                      display: "block",
                      padding: 0,
                      border: "none",
                      width,
                      height: cardHeight,
                      borderRadius: cornerRadius,
                      overflow: "hidden",
                      background: "var(--color-neutral-200, #e4d7c2)",
                      boxShadow: "0 18px 48px rgba(32,30,29,0.38)",
                      cursor: "pointer",
                    }}
                  >
                    <img
                      src={img.src}
                      srcSet={img.srcSet}
                      sizes={img.sizes}
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
                        pointerEvents: "none",
                        borderRadius: cornerRadius,
                        background: `rgba(12,11,8,${(0.4 * (1 - k)).toFixed(3)})`,
                      }}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showDots && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {images.map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              aria-label={`Show ${img.alt}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              style={{
                width: i === index ? 24 : 8,
                height: 8,
                borderRadius: 999,
                border: "none",
                padding: 0,
                cursor: "pointer",
                background:
                  i === index
                    ? ink
                      ? "rgba(247,239,225,1)"
                      : "rgba(32,30,29,0.85)"
                    : ink
                    ? "rgba(247,239,225,0.3)"
                    : "rgba(32,30,29,0.2)",
                transition: "all 300ms ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
