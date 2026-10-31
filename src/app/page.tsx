import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { roleHomeMap } from "@/lib/permissions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building,
  Building2,
  Search,
  DoorOpen,
  ArrowRight,
  ShieldCheck,
  FileText,
  CreditCard,
  Compass,
  CheckCircle2,
  KeyRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modern Real Estate & Property Management",
  description:
    "Streamline your rental portfolio: list properties, invite caretakers and tenants, track units, and manage maintenance seamlessly.",
};

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  const userDashboardUrl = user?.activeRole ? roleHomeMap[user.activeRole] : "/login";

  // Check if hero image exists locally
  const heroPath = path.join(process.cwd(), "public", "images", "hero.jpg");
  const hasHeroImage = fs.existsSync(heroPath);

  // Fetch up to 6 latest published properties with units
  const featuredProperties = await prisma.property.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      units: {
        select: {
          id: true,
          rentAmount: true,
          status: true,
        },
      },
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* ─── Sticky Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Building className="size-6 text-primary" />
            <span className="tracking-tight">RealEstate Pro</span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/properties"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Browse Properties
            </Link>

            {user ? (
              <Button asChild size="sm">
                <Link href={userDashboardUrl}>
                  Dashboard
                  <ArrowRight className="size-4 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/properties">Find a Home</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────── */}
      <section className="relative min-h-[580px] sm:min-h-[640px] flex items-center justify-center overflow-hidden border-b">
        {hasHeroImage ? (
          <div className="absolute inset-0 -z-10">
            <Image
              src="/images/hero.jpg"
              alt="Luxury residence architecture"
              fill
              priority
              className="object-cover brightness-[0.38]"
              sizes="100vw"
            />
          </div>
        ) : (
          /* High-end vector architectural gradient fallback */
          <div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/15 via-background to-background">
            <svg
              className="absolute bottom-0 left-0 right-0 w-full h-64 text-muted/20 opacity-40 pointer-events-none"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
              fill="currentColor"
            >
              <path d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,202.7C840,192,960,128,1080,122.7C1200,117,1320,171,1380,197.3L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
              <rect x="120" y="80" width="80" height="240" rx="4" />
              <rect x="230" y="120" width="60" height="200" rx="4" />
              <rect x="320" y="40" width="100" height="280" rx="4" />
              <rect x="450" y="90" width="70" height="230" rx="4" />
              <rect x="550" y="140" width="80" height="180" rx="4" />
              <rect x="660" y="60" width="90" height="260" rx="4" />
              <rect x="780" y="110" width="75" height="210" rx="4" />
              <rect x="880" y="50" width="85" height="270" rx="4" />
              <rect x="990" y="130" width="70" height="190" rx="4" />
              <rect x="1090" y="70" width="90" height="250" rx="4" />
              <rect x="1210" y="100" width="80" height="220" rx="4" />
            </svg>
          </div>
        )}

        <div className="container mx-auto px-4 sm:px-6 py-16 text-center max-w-4xl relative z-10">
          <Badge
            variant="outline"
            className="mb-4 bg-background/80 backdrop-blur border-primary/30 text-primary py-1 px-3 text-xs tracking-wide"
          >
            INTELLIGENT PROPERTY & LEASE MANAGEMENT
          </Badge>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-balance leading-tight">
            Seamless Living & Smart Property Oversight
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-muted-foreground text-balance max-w-2xl mx-auto leading-relaxed">
            Manage units, onboard verified tenants, coordinate on-site caretakers, and discover
            curated residential spaces — all in one modern platform.
          </p>

          {/* Search Box */}
          <form
            action="/properties"
            method="GET"
            className="mt-8 sm:mt-10 p-2 sm:p-3 rounded-2xl bg-card/95 backdrop-blur border shadow-xl max-w-2xl mx-auto flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                name="city"
                placeholder="Search city, district, or state..."
                className="pl-10 h-11 border-0 bg-transparent focus-visible:ring-0 shadow-none text-sm"
              />
            </div>

            <div className="w-full sm:w-44">
              <select
                name="bedrooms"
                defaultValue=""
                className="w-full h-11 px-3 rounded-md bg-transparent border-0 sm:border-l text-sm text-foreground focus:outline-hidden"
              >
                <option value="" className="bg-popover text-popover-foreground">
                  Any Bedrooms
                </option>
                <option value="1" className="bg-popover text-popover-foreground">
                  1+ Bedrooms
                </option>
                <option value="2" className="bg-popover text-popover-foreground">
                  2+ Bedrooms
                </option>
                <option value="3" className="bg-popover text-popover-foreground">
                  3+ Bedrooms
                </option>
                <option value="4" className="bg-popover text-popover-foreground">
                  4+ Bedrooms
                </option>
              </select>
            </div>

            <Button type="submit" className="h-11 px-6 font-semibold shadow-sm">
              Explore
            </Button>
          </form>
        </div>
      </section>

      {/* ─── Benefits Strip ───────────────────────────────────────────── */}
      <section className="border-b bg-muted/30 py-6">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="flex flex-col items-center gap-1.5 p-2">
              <Compass className="size-5 text-primary" />
              <span className="text-sm font-semibold">Monitor Remotely</span>
              <span className="text-xs text-muted-foreground">Anytime portfolio analytics</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2">
              <ShieldCheck className="size-5 text-primary" />
              <span className="text-sm font-semibold">Caretaker Approvals</span>
              <span className="text-xs text-muted-foreground">On-site verified maintenance</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2">
              <FileText className="size-5 text-primary" />
              <span className="text-sm font-semibold">Full Activity Audit</span>
              <span className="text-xs text-muted-foreground">Immutable operations history</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2">
              <div className="flex items-center gap-1">
                <CreditCard className="size-5 text-primary" />
                <Badge variant="outline" className="text-[10px] px-1 py-0">Soon</Badge>
              </div>
              <span className="text-sm font-semibold">Online Rent Collections</span>
              <span className="text-xs text-muted-foreground">Automated receipts & payouts</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Featured Properties ──────────────────────────────────────── */}
      <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <Badge variant="secondary" className="mb-2">EXPLORE LISTINGS</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Featured Residences</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Hand-picked, high-quality residences available for immediate occupancy.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/properties">
              View All Properties
              <ArrowRight className="size-4 ml-1.5" />
            </Link>
          </Button>
        </div>

        {featuredProperties.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed bg-muted/20">
            <Building2 className="size-12 text-muted-foreground/60 mx-auto mb-3" />
            <h3 className="text-lg font-semibold">New listings are coming soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
              Our verified property owners are currently preparing new residential listings.
              Check back shortly or contact our team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((p) => {
              const coverImg = p.images.length > 0 ? p.images[0] : null;
              const vacantUnits = p.units.filter((u) => u.status === "VACANT");
              const minRent =
                vacantUnits.length > 0
                  ? Math.min(...vacantUnits.map((u) => u.rentAmount))
                  : p.units.length > 0
                  ? Math.min(...p.units.map((u) => u.rentAmount))
                  : null;

              return (
                <Link key={p.id} href={`/properties/${p.slug}`} className="group">
                  <Card className="overflow-hidden h-full hover:shadow-lg transition-all duration-200">
                    <div className="relative aspect-16/10 bg-muted overflow-hidden">
                      {coverImg ? (
                        <Image
                          src={coverImg}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Building2 className="size-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-background/90 text-foreground backdrop-blur text-xs shadow-sm">
                          {vacantUnits.length} Vacant
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-5">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {p.city}{p.state ? `, ${p.state}` : ""}, {p.country}
                      </p>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div>
                          <span className="text-xs text-muted-foreground block">Rent starting</span>
                          <span className="text-base font-bold text-primary">
                            {minRent !== null
                              ? `${formatMoney(minRent, p.currency)}`
                              : "Inquire"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <DoorOpen className="size-3.5" />
                          {p.units.length} units
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 border-t bg-muted/20">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-2">SIMPLE WORKFLOWS</Badge>
            <h2 className="text-3xl font-bold tracking-tight">How RealEstate Pro Works</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Designed for effortless cooperation between property owners, caretakers, and tenants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* For Owners */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-lg">For Property Owners</h3>
                  <p className="text-xs text-muted-foreground">Manage your portfolio with absolute clarity</p>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-foreground/90">
                <li className="flex gap-3">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Register properties & units:</strong> Catalog specifications, pricing, and amenities.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Assign caretakers & invite tenants:</strong> Secure token-based invitation links.</span>
                </li>
                <li className="flex gap-3">
                  <CheckCircle2 className="size-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Real-time portfolio oversight:</strong> Monitor vacancies, leases, and operations.</span>
                </li>
              </ul>
            </Card>

            {/* For Tenants */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-lg">For Tenants</h3>
                  <p className="text-xs text-muted-foreground">Transparent living and modern convenience</p>
                </div>
              </div>
              <ul className="space-y-4 text-sm text-foreground/90">
                <li className="flex gap-3">
                  <KeyRound className="size-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Browse verified listings:</strong> Detailed photos, room dimensions, and clear rates.</span>
                </li>
                <li className="flex gap-3">
                  <KeyRound className="size-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>1-Click invitation onboarding:</strong> Seamlessly activate your lease dashboard.</span>
                </li>
                <li className="flex gap-3">
                  <KeyRound className="size-5 text-primary shrink-0 mt-0.5" />
                  <span><strong>Online rent & maintenance:</strong> Submit repair requests with photo uploads.</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Call to Action ───────────────────────────────────────────── */}
      <section className="py-16 md:py-20 border-t bg-card text-center">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
            Ready to upgrade your real estate operations?
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Experience reliable, transparent property management designed for the modern web.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="w-full sm:w-auto font-semibold">
              <Link href="/properties">
                Browse Properties
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/login">Account Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t bg-background py-12 text-sm text-muted-foreground">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <Building className="size-5 text-primary" />
            <span>RealEstate Pro</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
            <Link href="/properties" className="hover:text-foreground transition-colors">
              Properties
            </Link>
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/register" className="hover:text-foreground transition-colors">
              Owner Registration
            </Link>
            <Link href="/accept-invite" className="hover:text-foreground transition-colors">
              Accept Invite
            </Link>
          </div>

          <p className="text-xs">
            © {new Date().getFullYear()} RealEstate Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
