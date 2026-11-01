import Link from "next/link";
import { House, Mail, MapPin, Phone } from "lucide-react";

interface PublicFooterProps {
  siteName: string;
  tagline: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
}

export function PublicFooter({
  siteName,
  tagline,
  phone,
  email,
  whatsapp,
  address,
}: PublicFooterProps) {
  return (
    <footer className="bg-navy px-4 py-10 text-white sm:px-6">
      <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2 font-bold text-white">
            <House className="size-5 fill-current" />
            {siteName}
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">{tagline}</p>
        </div>
        <div>
          <h2 className="font-bold text-white">Quick links</h2>
          <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/85">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/properties" className="hover:text-white">Properties</Link>
            <Link href="/login" className="hover:text-white">Sign in</Link>
          </div>
        </div>
        {(phone || email || whatsapp || address) && (
          <div>
            <h2 className="font-bold text-white">Contact</h2>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/85">
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-white">
                  <Phone className="size-4" /> {phone}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-white">
                  <Mail className="size-4" /> {email}
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white"
                >
                  <Phone className="size-4" /> WhatsApp
                </a>
              )}
              {address && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  {address}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-white/25 pt-4 text-xs text-white/80">
        © {new Date().getFullYear()} {siteName}. All rights reserved.
      </div>
    </footer>
  );
}
