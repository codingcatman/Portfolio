import * as React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  gradientColors?: string;
  gradientAnimationDuration?: number;
  hoverEffect?: boolean;
  animate?: boolean;
  solidColor?: string;
  outline?: boolean;
  outlineWidth?: string;
  className?: string;
  textClassName?: string;
}

const AnimatedText = React.forwardRef<HTMLDivElement, AnimatedTextProps>(
  (
    {
      text,
      gradientColors = "linear-gradient(90deg, #000, #fff, #000)",
      gradientAnimationDuration = 1,
      hoverEffect = false,
      animate = true,
      solidColor,
      outline = false,
      outlineWidth = "1.5px",
      className,
      textClassName,
      ...props
    },
    ref
  ) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const textVariants: Variants = {
      initial: {
        backgroundPosition: "0 0",
      },
      animate: {
        backgroundPosition: "100% 0",
        transition: {
          duration: gradientAnimationDuration,
          repeat: Infinity,
          repeatType: "reverse" as const,
        },
      },
    };

    const textStyle = solidColor
      ? outline
        ? {
            color: "transparent",
            WebkitTextFillColor: "transparent",
            WebkitTextStroke: `${outlineWidth} ${solidColor}`,
            textShadow: isHovered ? "0 0 8px rgba(255,255,255,0.3)" : "none",
          }
        : {
            color: solidColor,
            textShadow: isHovered ? "0 0 8px rgba(255,255,255,0.3)" : "none",
          }
      : {
          background: gradientColors,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: isHovered ? "0 0 8px rgba(255,255,255,0.3)" : "none",
        };

    const textClassNameFull = cn(
      "text-[2.5rem] sm:text-[3.5rem] md:text-[4rem] lg:text-[5rem] xl:text-[6rem] leading-normal",
      textClassName
    );

    return (
      <div
        ref={ref}
        className={cn("flex justify-center items-center py-8", className)}
        {...props}
      >
        {animate ? (
          <motion.h1
            className={textClassNameFull}
            style={textStyle}
            variants={textVariants}
            initial="initial"
            animate="animate"
            onHoverStart={() => hoverEffect && setIsHovered(true)}
            onHoverEnd={() => hoverEffect && setIsHovered(false)}
          >
            {text}
          </motion.h1>
        ) : (
          <h1 className={textClassNameFull} style={textStyle}>
            {text}
          </h1>
        )}
      </div>
    );
  }
);

AnimatedText.displayName = "AnimatedText";

export { AnimatedText };