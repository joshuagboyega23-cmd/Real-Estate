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
  const [activeSection, setActiveSection] = React.useState("home");

  React.useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 24);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    const sectionIds = ["home", "properties", "about", "services", "testimonials", "contact"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibleSections[0]) setActiveSection(visibleSections[0].target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: 0 },
    );
    for (const id of sectionIds) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    return () => {
      window.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, []);

  const navLinks = showTestimonials
    ? [...links, { label: "Testimonials", href: "#testimonials" }, { label: "Contact", href: "#contact" }]
    : [...links, { label: "Contact", href: "#contact" }];
  const headerStyle = scrolled
    ? "h-16 border-border/80 bg-white/90 text-navy shadow-sm backdrop-blur-md"
    : "bg-transparent text-white";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? headerStyle
          : "h-[4.5rem] border-transparent bg-transparent text-white"
      }`}
    >
      <div className={`mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 ${scrolled ? "h-16" : "h-[4.5rem]"}`}>
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
          <House className="size-6 fill-current" />
          <span>{brand}</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
          {navLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={activeSection === item.href.slice(1) ? "location" : undefined}
              className={`relative py-2 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-current after:transition-transform after:duration-300 ${
                activeSection === item.href.slice(1)
                  ? `${scrolled ? "text-primary" : "text-white"} after:scale-x-100`
                  : "text-inherit after:scale-x-0 hover:after:scale-x-100"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition-colors hover:bg-sky/70"
            >
              <Phone className="size-4" />
              <span>{phone}</span>
            </a>
          )}
          <Button
            asChild
            size="sm"
            variant={scrolled ? "default" : "secondary"}
            className={!scrolled ? "bg-white text-navy shadow-sm hover:bg-sky" : "shadow-sm"}
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
              className={`md:hidden transition-colors ${scrolled ? "text-navy" : "text-white hover:bg-white/15 hover:text-white"}`}
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
