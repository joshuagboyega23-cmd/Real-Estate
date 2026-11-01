"use client";

import * as React from "react";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PropertyContactActionsProps {
  phone: string;
  email: string;
  whatsapp: string;
  propertyName: string;
}

export function PropertyContactActions({
  phone,
  email,
  whatsapp,
  propertyName,
}: PropertyContactActionsProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 200);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  const mailto = `mailto:${email}?subject=Inquiry%20regarding%20${encodeURIComponent(propertyName)}`;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-3 pt-3 shadow-[0_-8px_24px_rgb(11_37_69_/_12%)] backdrop-blur transition-transform duration-300 lg:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-lg gap-2">
        {phone && (
          <Button
            asChild
            variant="outline"
            className="min-h-11 flex-1 rounded-xl"
            tabIndex={visible ? 0 : -1}
          >
            <a href={`tel:${phone}`} aria-label={`Call ${phone}`}>
              <Phone className="size-4" /> Call
            </a>
          </Button>
        )}
        {whatsapp && (
          <Button
            asChild
            className="min-h-11 flex-1 rounded-xl"
            tabIndex={visible ? 0 : -1}
          >
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Message us on WhatsApp"
            >
              <MessageCircle className="size-4" /> WhatsApp
            </a>
          </Button>
        )}
        {!phone && email && (
          <Button
            asChild
            variant={whatsapp ? "outline" : "default"}
            className="min-h-11 flex-1 rounded-xl"
            tabIndex={visible ? 0 : -1}
          >
            <a href={mailto} aria-label={`Email ${email}`}>
              <Mail className="size-4" /> Email
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
