/**
 * AdmitOneTicket.tsx
 *
 * Ticket card renderer, typed. Port of the runtime used in this project's
 * `admit-one-ticket.jsx`, with the additions made here:
 *   - `artwork` / `artworkFit` — drop a PDF page or image onto the ticket face
 *   - `bare`  — blank card: no perforation, stub, watermark, type or scrim
 *   - `flat`  — no shader texture, just the solid `texture.colorBack` ground
 *
 * The two shader primitives stay where they already live. Point this import at
 * the inlined runtime from the original component file, or at the package it
 * came from (`@paper-design/shaders-react`).
 */
import * as React from 'react';
import { Dithering, ImageDithering } from './paper-shaders';

export const TICKET_REF_WIDTH = 741;
const REF = TICKET_REF_WIDTH;

export interface TicketGeometry {
  /** width / height */
  aspect: number;
  /** fractions of width */
  cornerRadius: number;
  notchRadius: number;
  perforation: number;
}

export interface TicketLayout {
  /** all sizes and offsets are fractions of width unless noted */
  padding: number;
  labelTop: number;
  labelSize: number;
  labelLead: number;
  /** em */
  labelTracking: number;
  nameTop: number;
  nameSize: number;
  nameLead: number;
  nameTracking: number;
  footerTop: number;
  footerSize: number;
  footerTracking: number;
  stubSize: number;
  stubTracking: number;
  stubOpacity: number;
  watermarkSize: number;
  watermarkOpacity: number;
  watermarkColor: string;
  inkColor: string;
}

export type TextureEngine = 'generative' | 'image';
export type DitherShape = 'simplex' | 'warp' | 'dots' | 'wave' | 'ripple' | 'swirl' | 'sphere';
export type DitherType = 'random' | '2x2' | '4x4' | '8x8';

export interface TicketTexture {
  engine: TextureEngine;
  colorBack: string;
  colorFront: string;
  colorHighlight: string;
  shape: DitherShape;
  type: DitherType;
  size: number;
  colorSteps: number;
  originalColors: boolean;
  scale: number;
  rotation: number;
  offsetX: number;
  offsetY: number;
  speed: number;
  /** image engine only: use this source instead of the generated gradient */
  imageSrc?: string;
}

export interface TicketGradient {
  centreX: number;
  centreY: number;
  radius: number;
  midStop: number;
  colorLight: string;
  colorMid: string;
  colorDark: string;
}

export interface TicketStyle {
  texture: TicketTexture;
  gradient: TicketGradient;
}

export interface TiltOptions {
  maxTilt?: number;
  scale?: number;
  glare?: number;
}

export interface TicketCardProps {
  name?: string;
  presenter?: string;
  event?: string;
  venue?: string;
  dates?: string;
  stubText?: string;
  watermark?: string;
  /** every dimension derives from this */
  width?: number;
  geometry?: TicketGeometry;
  layout?: TicketLayout;
  texture?: TicketTexture;
  gradient?: TicketGradient;
  /** image or data URL painted across the whole ticket face */
  artwork?: string;
  artworkFit?: React.CSSProperties['objectFit'];
  /** blank card: drop the perforation, stub, watermark, type and scrim */
  bare?: boolean;
  /** skip the shader texture, leaving the solid colorBack ground */
  flat?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export interface AdmitOneTicketProps extends TicketCardProps {
  tilt?: false | TiltOptions;
}

export const TICKET_GEOMETRY: TicketGeometry = {
  aspect: 741 / 425,
  cornerRadius: 25 / REF,
  notchRadius: 21 / REF,
  perforation: 562 / REF,
};

export const TICKET_LAYOUT: TicketLayout = {
  padding: 57 / REF,
  labelTop: 58 / REF,
  labelSize: 19.72 / REF,
  labelLead: 28 / REF,
  labelTracking: 0.016,
  nameTop: 185 / REF,
  nameSize: 64.79 / REF,
  nameLead: 65 / REF,
  nameTracking: -0.01,
  footerTop: 348 / REF,
  footerSize: 19.72 / REF,
  footerTracking: 0.016,
  stubSize: 67.61 / REF,
  stubTracking: 0,
  stubOpacity: 0.88,
  watermarkSize: 144 / REF,
  watermarkOpacity: 0.6,
  watermarkColor: '#ffdcbe',
  inkColor: '#5a3520',
};

export const TICKET_TEXTURE: TicketTexture = {
  engine: 'generative',
  colorBack: '#ef671c',
  colorFront: '#ffc691',
  colorHighlight: '#fe9046',
  shape: 'warp',
  type: 'random',
  size: 0.5,
  colorSteps: 4,
  originalColors: true,
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  speed: 0.4,
};

export const TICKET_GRADIENT: TicketGradient = {
  centreX: 0.62,
  centreY: 0.3,
  radius: 0.58,
  midStop: 0.45,
  colorLight: '#ffc691',
  colorMid: '#fe9046',
  colorDark: '#ef671c',
};

export const TICKET_STYLE: TicketStyle = { texture: TICKET_TEXTURE, gradient: TICKET_GRADIENT };

export const SHAPES: DitherShape[] = ['simplex', 'warp', 'dots', 'wave', 'ripple', 'swirl', 'sphere'];
export const TYPES: DitherType[] = ['random', '2x2', '4x4', '8x8'];

export function ticketClipPath(width: number, height: number, geometry: TicketGeometry = TICKET_GEOMETRY): string {
  const r = geometry.cornerRadius * width;
  const n = geometry.notchRadius * width;
  const p = geometry.perforation * width;
  return [
    `M ${r} 0`,
    `L ${p - n} 0`,
    `A ${n} ${n} 0 0 0 ${p + n} 0`,
    `L ${width - r} 0`,
    `A ${r} ${r} 0 0 0 ${width} ${r}`,
    `L ${width} ${height - r}`,
    `A ${r} ${r} 0 0 0 ${width - r} ${height}`,
    `L ${p + n} ${height}`,
    `A ${n} ${n} 0 0 0 ${p - n} ${height}`,
    `L ${r} ${height}`,
    `A ${r} ${r} 0 0 0 0 ${height - r}`,
    `L 0 ${r}`,
    `A ${r} ${r} 0 0 0 ${r} 0`,
    'Z',
  ].join(' ');
}

function splitName(name: string | undefined, max = 3): string[] {
  const clean = String(name ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
  if (!clean) return [];
  const lines: string[] = [];
  for (const word of clean.split(' ')) {
    if (lines.length < max) lines.push(word);
    else lines[lines.length - 1] = `${lines[lines.length - 1]} ${word}`;
  }
  return lines;
}

interface FitOptions {
  availableWidth: number;
  availableHeight: number;
  fontSize: number;
  lineHeight: number;
  tracking: number;
}

function fitScale(lines: string[], opts: FitOptions): number {
  if (lines.length === 0) return 1;
  const { availableWidth, availableHeight, fontSize, lineHeight, tracking } = opts;
  if (fontSize <= 0 || availableWidth <= 0) return 1;
  const longest = Math.max(...lines.map((l) => l.length));
  const charWidth = (0.6 + tracking) * fontSize;
  const block = lines.length * lineHeight;
  return Math.max(0.05, Math.min(
    1,
    charWidth > 0 ? availableWidth / (longest * charWidth) : 1,
    block > 0 && availableHeight > 0 ? availableHeight / block : 1
  ));
}

const MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(MOTION_QUERY);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(MOTION_QUERY).matches,
    () => false
  );
}

function useDrift(speed: number): { x: number; y: number } {
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const reduced = usePrefersReducedMotion();
  const active = speed > 0 && !reduced;
  React.useEffect(() => {
    if (!active) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = ((now - start) / 1e3) * speed;
      setOffset({ x: 0.06 * Math.sin(0.37 * t), y: 0.045 * Math.cos(0.23 * t) });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, speed]);
  return active ? offset : { x: 0, y: 0 };
}

function gradientDataUrl(g: TicketGradient, aspect: number): string {
  const w = 512;
  const h = Math.max(1, Math.round(w / aspect));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.fillStyle = g.colorDark;
  ctx.fillRect(0, 0, w, h);
  const radial = ctx.createRadialGradient(
    w * g.centreX, h * g.centreY, 0,
    w * g.centreX, h * g.centreY, Math.max(1, w * g.radius)
  );
  radial.addColorStop(0, g.colorLight);
  radial.addColorStop(Math.min(0.99, Math.max(0.01, g.midStop)), g.colorMid);
  radial.addColorStop(1, g.colorDark);
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);
  return canvas.toDataURL('image/png');
}

export function TicketCard({
  name,
  presenter,
  event,
  venue,
  dates,
  stubText,
  watermark,
  width = REF,
  geometry = TICKET_GEOMETRY,
  layout = TICKET_LAYOUT,
  texture = TICKET_TEXTURE,
  gradient = TICKET_GRADIENT,
  artwork,
  artworkFit = 'cover',
  bare = false,
  flat = false,
  className,
  style,
}: TicketCardProps) {
  const height = width / geometry.aspect;
  const perfX = geometry.perforation * width;
  const reduced = usePrefersReducedMotion();
  const drift = useDrift(texture.engine === 'image' ? texture.speed : 0);
  const lines = splitName(name);
  const scale = fitScale(lines, {
    availableWidth: perfX - layout.padding * width - 0.03 * width,
    availableHeight: layout.footerTop * width - layout.nameTop * width - 0.02 * width,
    fontSize: layout.nameSize * width,
    lineHeight: layout.nameLead * width,
    tracking: layout.nameTracking,
  });
  const sourceImage = React.useMemo(
    () =>
      texture.engine === 'image'
        ? texture.imageSrc || gradientDataUrl(gradient, geometry.aspect)
        : '',
    [texture.engine, texture.imageSrc, gradient, geometry.aspect]
  );
  const shaderStyle: React.CSSProperties = { position: 'absolute', inset: 0, width, height };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        userSelect: 'none',
        width,
        height,
        clipPath: `path('${ticketClipPath(width, height, geometry)}')`,
        ...style,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: texture.colorBack }} />

      {artwork ? (
        <img
          src={artwork}
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: artworkFit }}
        />
      ) : flat ? null : texture.engine === 'image' && sourceImage ? (
        <ImageDithering
          image={sourceImage}
          colorBack={texture.colorBack}
          colorFront={texture.colorFront}
          colorHighlight={texture.colorHighlight}
          type={texture.type}
          size={texture.size}
          colorSteps={texture.colorSteps}
          originalColors={texture.originalColors}
          scale={texture.scale}
          rotation={texture.rotation}
          offsetX={texture.offsetX + drift.x}
          offsetY={texture.offsetY + drift.y}
          fit="cover"
          style={shaderStyle}
        />
      ) : (
        <Dithering
          colorBack={texture.colorBack}
          colorFront={texture.colorFront}
          shape={texture.shape}
          type={texture.type}
          size={texture.size}
          scale={texture.scale}
          rotation={texture.rotation}
          offsetX={texture.offsetX}
          offsetY={texture.offsetY}
          speed={reduced ? 0 : texture.speed}
          frame={reduced ? 2400 : 0}
          style={shaderStyle}
        />
      )}

      {/* scrim, so the ticket type stays legible over uploaded artwork */}
      {artwork && !bare ? (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `linear-gradient(100deg, ${texture.colorBack}f2 0%, ${texture.colorBack}e6 ${100 * geometry.perforation * 0.72}%, ${texture.colorBack}9e ${100 * geometry.perforation}%, ${texture.colorBack}c9 100%)`,
          }}
        />
      ) : null}

      {bare ? null : (
        <>
          {/* perforation */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: perfX,
              width: Math.max(1, 0.0022 * width),
              backgroundImage: `repeating-linear-gradient(to bottom, ${layout.inkColor}55 0 ${0.012 * width}px, transparent ${0.012 * width}px ${0.024 * width}px)`,
            }}
          />

          {/* stub watermark */}
          <div
            style={{
              position: 'absolute',
              left: perfX,
              top: 0,
              width: width - perfX,
              height,
              display: 'grid',
              placeItems: 'center',
              pointerEvents: 'none',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: layout.watermarkColor,
              opacity: layout.watermarkOpacity,
            }}
          >
            <span
              style={{
                writingMode: 'vertical-rl',
                fontSize: layout.watermarkSize * width,
                lineHeight: 1,
                letterSpacing: '-0.04em',
              }}
            >
              {watermark}
            </span>
          </div>

          <div style={{ position: 'absolute', inset: 0, color: layout.inkColor }}>
            <div
              style={{
                position: 'absolute',
                whiteSpace: 'pre',
                textTransform: 'uppercase',
                left: layout.padding * width,
                top: layout.labelTop * width,
                fontSize: layout.labelSize * width,
                lineHeight: `${layout.labelLead * width}px`,
                letterSpacing: `${layout.labelTracking}em`,
              }}
            >
              {presenter}
              {'\n'}
              {event}
            </div>

            <div
              style={{
                position: 'absolute',
                fontWeight: 500,
                left: layout.padding * width,
                top: layout.nameTop * width,
                fontSize: layout.nameSize * width * scale,
                lineHeight: `${layout.nameLead * width * scale}px`,
                letterSpacing: `${layout.nameTracking}em`,
              }}
            >
              {lines.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>

            <div
              style={{
                position: 'absolute',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                left: layout.padding * width,
                top: layout.footerTop * width,
                fontSize: layout.footerSize * width,
                letterSpacing: `${layout.footerTracking}em`,
              }}
            >
              {venue} · {dates}
            </div>

            <div
              style={{
                position: 'absolute',
                left: perfX,
                top: 0,
                width: width - perfX,
                height,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
                fontSize: layout.stubSize * width,
                letterSpacing: `${layout.stubTracking}em`,
                opacity: layout.stubOpacity,
              }}
            >
              <span style={{ writingMode: 'vertical-rl' }}>{stubText}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export interface TiltCardProps extends TiltOptions {
  children?: React.ReactNode;
  clipPath?: string;
  className?: string;
}

/** true on touch/coarse-pointer devices, where hover-driven tilt makes no sense */
function useIsTouchDevice(): boolean {
  const query = '(hover: none), (pointer: coarse)';
  return React.useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}

export function TiltCard({ children, clipPath, maxTilt = 9, scale = 1.02, glare = 0.16, className }: TiltCardProps) {
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const glareRef = React.useRef<HTMLDivElement | null>(null);
  const [hovering, setHovering] = React.useState(false);
  const isTouch = useIsTouchDevice();

  const applyTransform = React.useCallback(
    (dx: number, dy: number) => {
      const el = cardRef.current;
      if (!el) return;
      el.style.transform = `perspective(1200px) rotateX(${-(dy * 2) * maxTilt}deg) rotateY(${dx * 2 * maxTilt}deg) scale(${scale})`;
      if (glareRef.current) {
        glareRef.current.style.background = `radial-gradient(38% 55% at ${(dx + 0.5) * 100}% ${(dy + 0.5) * 100}%, rgba(255,255,255,${glare}) 0%, rgba(255,255,255,0) 70%)`;
      }
    },
    [maxTilt, scale, glare]
  );

  const onMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isTouch) return;
      const el = cardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      applyTransform((e.clientX - rect.left) / rect.width - 0.5, (e.clientY - rect.top) / rect.height - 0.5);
    },
    [isTouch, applyTransform]
  );

  const onLeave = React.useCallback(() => {
    if (isTouch) return;
    setHovering(false);
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)';
    }
    if (glareRef.current) glareRef.current.style.background = 'transparent';
  }, [isTouch]);

  return (
    <div
      ref={cardRef}
      onPointerEnter={() => !isTouch && setHovering(true)}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={className}
      style={{
        position: 'relative',
        width: 'fit-content',
        willChange: 'transform',
        transition: hovering ? 'none' : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
        transform: 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale(1)',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
      {glare > 0 && (
        <div
          ref={glareRef}
          aria-hidden={true}
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            clipPath,
            transition: hovering ? 'none' : 'background 420ms ease-out',
          }}
        />
      )}
    </div>
  );
}

export function AdmitOneTicket({ tilt, ...props }: AdmitOneTicketProps) {
  const width = props.width ?? REF;
  const geometry = props.geometry ?? TICKET_GEOMETRY;
  if (tilt === false) return <TicketCard {...props} />;
  return (
    <TiltCard clipPath={`path('${ticketClipPath(width, width / geometry.aspect, geometry)}')`} {...(tilt || {})}>
      <TicketCard {...props} />
    </TiltCard>
  );
}

export default AdmitOneTicket;
