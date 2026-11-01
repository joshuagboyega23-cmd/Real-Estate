import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeroProps {
  city: string;
  tagline: string;
  imageSrc: string;
}

export function Hero({ city, tagline, imageSrc }: HeroProps) {
  return (
    <section
      id="home"
      className="relative flex min-h-[760px] items-center overflow-hidden bg-navy pb-24 pt-28 sm:min-h-[810px] sm:pt-32"
    >
      <Image
        src={imageSrc}
        alt="Modern family home in a landscaped tropical setting"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-r from-[#0B2545]/90 via-[#0B2545]/62 to-[#0B2545]/20" />
      <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#0B2545]/80 to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-white sm:px-6">
        <div className="max-w-3xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-sky-100 sm:text-sm">
            Find a place to belong
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Find your next home in {city}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
            {tagline}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="font-semibold">
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
        </div>

        <form
          action="/properties"
          method="GET"
          className="absolute -bottom-28 left-4 right-4 grid max-w-5xl gap-3 rounded-2xl bg-white p-4 text-navy shadow-2xl sm:left-6 sm:right-6 sm:mx-auto sm:grid-cols-[1fr_220px_auto] sm:items-end sm:p-5"
        >
          <div>
            <label htmlFor="hero-city" className="mb-2 block text-xs font-semibold text-muted-foreground">
              Area or neighbourhood
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="hero-city"
                name="city"
                placeholder="City, district, or property"
                className="h-12 border-border pl-10"
              />
            </div>
          </div>
          <div>
            <label htmlFor="hero-bedrooms" className="mb-2 block text-xs font-semibold text-muted-foreground">
              Bedrooms
            </label>
            <select
              id="hero-bedrooms"
              name="bedrooms"
              defaultValue=""
              className="h-12 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

        <a
          href="#properties"
          className="absolute bottom-[-10.5rem] left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs font-semibold text-white/80 sm:bottom-[-10rem]"
        >
          Scroll to explore <ArrowDown className="size-4" />
        </a>
      </div>
    </section>
  );
}
