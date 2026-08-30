import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import { AdmitOneTicket, TICKET_REF_WIDTH } from "@/components/ui/AdmitOneTicket";

function Ticket() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(TICKET_REF_WIDTH);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.min(TICKET_REF_WIDTH, entry.contentRect.width));
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <AdmitOneTicket
        artwork="images/202422.png"
        artworkFit="cover"
        bare
        width={width}
        style={{ filter: "drop-shadow(0 18px 34px rgba(0, 0, 0, 0.35))" }}
      />
    </div>
  );
}

const el = document.getElementById("admit-one-ticket-root");
if (el) {
  createRoot(el).render(<Ticket />);
}
