import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Parallax } from "@/components/landing/motion";

interface HeroProps {
  city: string;
  tagline: string;
  imageSrc: string;
}

export function Hero({ city, tagline, imageSrc }: HeroProps) {
  return (
    <section
      id="home"
      className="relative flex min-h-[680px] flex-col justify-center overflow-hidden bg-navy md:min-h-svh"
    >
      <Parallax
        speed={0.15}
        className="absolute inset-x-0 -top-[8%] h-[116%]"
      >
        <div className="hero-zoom absolute inset-0">
          <Image
            src={imageSrc}
            alt="Modern family home in a landscaped tropical setting"
            fill
            priority
            quality={80}
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </Parallax>
      <div
        className="absolute inset-0 bg-linear-to-r from-[#0B2545]/80 via-[#0B2545]/55 to-[#0B2545]/10"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-linear-to-b from-[#0B2545]/35 via-transparent to-white"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-24 pt-28 text-white sm:px-6 sm:pb-28 sm:pt-32">
        <div className="max-w-3xl">
          <p className="hero-enter mb-5 text-xs font-bold uppercase tracking-[0.2em] text-sky-100 [--hero-delay:0ms] sm:text-sm">
            Find a place to belong
          </p>
          <h1 className="hero-enter max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white [--hero-delay:100ms] [text-shadow:0_2px_18px_rgb(11_37_69_/_55%)] sm:text-6xl lg:text-7xl">
            Find your next home in {city}
          </h1>
          <p className="hero-enter mt-6 max-w-xl text-base leading-relaxed text-white [--hero-delay:180ms] [text-shadow:0_1px_10px_rgb(11_37_69_/_65%)] sm:text-lg">
            {tagline}
          </p>
          <div className="hero-enter mt-8 flex flex-col gap-3 [--hero-delay:260ms] sm:flex-row">
            <Button asChild size="lg" className="font-semibold shadow-lg">
              <a href="#properties">
                Browse properties <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/75 bg-white/10 font-semibold text-white hover:bg-white hover:text-navy"
            >
              <Link href="/login">List with us</Link>
            </Button>
          </div>
          <ul className="hero-enter mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-white [--hero-delay:340ms] [text-shadow:0_1px_8px_rgb(11_37_69_/_65%)] sm:text-sm">
            <li>Published listings</li>
            <li>Remote owner dashboard</li>
            <li>Caretaker coordination</li>
          </ul>
        </div>

        <form
          action="/properties"
          method="GET"
          className="hero-enter mx-auto mt-10 grid w-full max-w-5xl gap-3 rounded-2xl border border-white/70 bg-white/95 p-4 text-navy shadow-[0_20px_65px_rgb(11_37_69_/_24%)] backdrop-blur-md [--hero-delay:420ms] sm:mt-12 sm:grid-cols-[1fr_220px_auto] sm:items-end sm:p-5"
        >
          <div>
            <label
              htmlFor="hero-city"
              className="mb-2 block text-xs font-semibold text-muted-foreground"
            >
              Area or neighbourhood
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="hero-city"
                name="city"
                placeholder="City, district, or property"
                className="h-12 border-border bg-white pl-10 focus-visible:ring-2"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="hero-bedrooms"
              className="mb-2 block text-xs font-semibold text-muted-foreground"
            >
              Bedrooms
            </label>
            <select
              id="hero-bedrooms"
              name="bedrooms"
              defaultValue=""
              className="h-12 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Any bedrooms</option>
              <option value="1">1+ bedrooms</option>
              <option value="2">2+ bedrooms</option>
              <option value="3">3+ bedrooms</option>
              <option value="4">4+ bedrooms</option>
            </select>
          </div>
          <Button type="submit" className="h-12 px-7 font-semibold">
            Search
          </Button>
        </form>
      </div>
      <a
        href="#properties"
        aria-label="Scroll to properties"
        className="absolute bottom-5 left-1/2 z-10 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-white/40 bg-navy/20 text-white backdrop-blur-sm"
      >
        <ChevronDown className="size-5 scroll-cue" />
      </a>
    </section>
  );
}
