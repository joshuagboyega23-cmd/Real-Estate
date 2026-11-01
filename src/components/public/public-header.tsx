"use client";

import * as React from "react";
import Link from "next/link";
import { House, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface PublicHeaderProps {
  siteName: string;
  dashboardHref: string;
  isLoggedIn: boolean;
}

export function PublicHeader({
  siteName,
  dashboardHref,
  isLoggedIn,
}: PublicHeaderProps) {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 8);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? "border-border bg-white/95 shadow-sm backdrop-blur-md"
          : "border-border/80 bg-white/95 backdrop-blur"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <House className="size-6 fill-primary text-primary" />
          <span>{siteName}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          <Link className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary" href="/">
            Home
          </Link>
          <Link className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary" href="/properties">
            Properties
          </Link>
        </nav>

        <div className="hidden md:block">
          <Button asChild className="rounded-xl shadow-sm">
            <Link href={isLoggedIn ? dashboardHref : "/login"}>
              {isLoggedIn ? "Dashboard" : "Sign in"}
            </Link>
          </Button>
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(20rem,85vw)] bg-white p-0 text-navy">
            <SheetHeader className="border-b border-border p-5 text-left">
              <SheetTitle className="flex items-center gap-2 text-navy">
                <House className="size-5 fill-primary text-primary" />
                {siteName}
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
              {[
                { label: "Home", href: "/" },
                { label: "Properties", href: "/properties" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-semibold hover:bg-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild className="mt-3 rounded-xl">
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
