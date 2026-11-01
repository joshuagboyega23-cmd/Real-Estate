"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, House, Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface LandingHeaderProps {
  brand: string;
  phone: string;
  dashboardHref: string;
  isLoggedIn: boolean;
  showTestimonials: boolean;
}

const links = [
  { label: "Home", href: "#home" },
  { label: "Properties", href: "#properties" },
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
];

export function LandingHeader({
  brand,
  phone,
  dashboardHref,
  isLoggedIn,
  showTestimonials,
}: LandingHeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 24);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  const navLinks = showTestimonials
    ? [...links, { label: "Testimonials", href: "#testimonials" }, { label: "Contact", href: "#contact" }]
    : [...links, { label: "Contact", href: "#contact" }];
  const headerStyle = scrolled
    ? "bg-white/95 text-navy shadow-md backdrop-blur-md"
    : "bg-transparent text-white";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-transparent transition-colors ${headerStyle} ${
        scrolled ? "border-border/80" : ""
      }`}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
          <House className="size-6" />
          <span>{brand}</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium opacity-90 transition-opacity hover:opacity-100"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <Phone className="size-4" />
              <span>{phone}</span>
            </a>
          )}
          <Button
            asChild
            size="sm"
            variant={scrolled ? "default" : "secondary"}
            className={!scrolled ? "bg-white text-navy hover:bg-sky" : ""}
          >
            <Link href={isLoggedIn ? dashboardHref : "/login"}>
              {isLoggedIn ? "Dashboard" : "Sign in"}
            </Link>
          </Button>
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden ${scrolled ? "text-navy" : "text-white hover:bg-white/15 hover:text-white"}`}
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(20rem,85vw)] bg-white p-0 text-navy">
            <SheetHeader className="border-b border-border p-5 text-left">
              <SheetTitle className="flex items-center gap-2 text-navy">
                <Building2 className="size-5 text-primary" />
                {brand}
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
              {navLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-sky"
                >
                  {item.label}
                </a>
              ))}
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold text-primary"
                >
                  <Phone className="size-4" />
                  {phone}
                </a>
              )}
              <Button asChild className="mt-3">
                <Link
                  href={isLoggedIn ? dashboardHref : "/login"}
                  onClick={() => setMenuOpen(false)}
                >
                  {isLoggedIn ? "Dashboard" : "Sign in"}
                </Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
