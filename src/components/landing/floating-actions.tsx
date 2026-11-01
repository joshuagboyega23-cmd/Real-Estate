"use client";

import * as React from "react";
import { ArrowUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingActions({ whatsapp }: { whatsapp: string }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 400);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const scrollToTop = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact us on WhatsApp"
          className="flex size-12 items-center justify-center rounded-full bg-[#166534] text-white shadow-lg transition hover:bg-[#14532d]"
        >
          <MessageCircle className="size-5" />
        </a>
      )}
      {visible && (
        <Button
          type="button"
          size="icon"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="size-12 rounded-full bg-primary text-white shadow-lg hover:bg-bright-blue"
        >
          <ArrowUp className="size-5" />
        </Button>
      )}
    </div>
  );
}
