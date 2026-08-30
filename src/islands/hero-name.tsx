import { createRoot } from "react-dom/client";
import { AnimatedText } from "@/components/ui/animated_text";
import "@/styles/tailwind.css";

const el = document.getElementById("hero-name-root");
if (el) {
  createRoot(el).render(
    <div className="flex justify-center items-baseline gap-[-2.2em]">
      <AnimatedText
        text="ADAM"
        gradientColors="linear-gradient(90deg, #C69C72, #F3EEE6, #C69C72)"
        gradientAnimationDuration={2}
        className="py-0"
        textClassName="text-[clamp(3.6rem,15.84vw,10.8rem)] sm:text-[clamp(3.3rem,14.52vw,9.9rem)] md:text-[clamp(3.3rem,14.52vw,9.9rem)] lg:text-[clamp(3.3rem,14.52vw,9.9rem)] xl:text-[clamp(3.3rem,14.52vw,9.9rem)] font-['Special_Gothic_Condensed_One'] tracking-tight pl-[0.15em]"
      />
      <AnimatedText
        text="BANCK"
        solidColor="#4A4846"
        outline
        outlineWidth="0.5px"
        animate={false}
        className="py-0"
        textClassName="text-[clamp(3.6rem,15.84vw,10.8rem)] sm:text-[clamp(3.3rem,14.52vw,9.9rem)] md:text-[clamp(3.3rem,14.52vw,9.9rem)] lg:text-[clamp(3.3rem,14.52vw,9.9rem)] xl:text-[clamp(3.3rem,14.52vw,9.9rem)] font-['Special_Gothic_Condensed_One'] tracking-tight pr-[0.15em]"
      />
    </div>
  );
}
