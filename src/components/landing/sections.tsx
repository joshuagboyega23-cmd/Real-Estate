import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  CreditCard,
  Headset,
  Home,
  KeyRound,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  UsersRound,
  Wrench,
} from "lucide-react";
import { formatMoney } from "@/lib/money";
import { site } from "@/config/site";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CountUp, Parallax, Reveal } from "@/components/landing/motion";

export interface FeaturedProperty {
  id: string;
  slug: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  currency: string;
  coverImage: string | null;
  rentFrom: number | null;
  vacantUnits: number;
  totalUnits: number;
  isNew: boolean;
}

interface LandingSectionsProps {
  properties: FeaturedProperty[];
  publishedCount: number;
  vacantUnits: number;
  aboutImage: string;
  ctaImage: string;
}

const serviceCards = [
  {
    title: "Property management",
    description: "Keep property details, units, and daily operations organized.",
    icon: Building2,
  },
  {
    title: "Tenant onboarding",
    description: "Invite tenants securely and give them a clear path to get started.",
    icon: UsersRound,
  },
  {
    title: "Online rent payments",
    description: "Payment tools are being prepared for a simpler rent experience.",
    icon: CreditCard,
    comingSoon: true,
  },
  {
    title: "Maintenance tracking",
    description: "Keep maintenance requests and follow-up work in one place.",
    icon: Wrench,
  },
  {
    title: "Caretaker coordination",
    description: "Coordinate on-site property support with your trusted team.",
    icon: Headset,
  },
  {
    title: "Remote owner dashboard",
    description: "See your portfolio and vacancy information from anywhere.",
    icon: ClipboardCheck,
  },
];

const ownerSteps = [
  "Add your properties and the units you manage.",
  "Invite caretakers and tenants to the right property.",
  "Review vacancies and operations from your dashboard.",
];
const tenantSteps = [
  "Browse published homes and compare available units.",
  "Accept your invitation and set up your tenant account.",
  "Use your portal to keep your rental details close at hand.",
];

function SectionTitle({
  eyebrow,
  title,
  description,
  descriptionOnSky = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  descriptionOnSky?: boolean;
}) {
  return (
    <Reveal className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
        {eyebrow}
      </p>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p
        className={`mt-4 leading-relaxed ${
          descriptionOnSky ? "text-muted-on-sky" : "text-muted-foreground"
        }`}
      >
        {description}
      </p>
    </Reveal>
  );
}

function ContactLink({
  href,
  icon: Icon,
  title,
  children,
}: {
  href: string;
  icon: typeof Phone;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-sky text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        <Icon className="size-5" />
      </span>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 break-words text-sm text-muted-foreground">{children}</p>
    </a>
  );
}

export function LandingSections({
  properties,
  publishedCount,
  vacantUnits,
  aboutImage,
  ctaImage,
}: LandingSectionsProps) {
  const firstContact = site.phone
    ? { href: `tel:${site.phone}`, label: "Call our team" }
    : site.whatsapp
      ? { href: `https://wa.me/${site.whatsapp}`, label: "Message on WhatsApp" }
      : site.email
        ? { href: `mailto:${site.email}`, label: "Email our team" }
        : { href: "/properties", label: "Browse properties" };

  const secondContact = site.whatsapp && firstContact.href !== `https://wa.me/${site.whatsapp}`
    ? { href: `https://wa.me/${site.whatsapp}`, label: "Chat on WhatsApp" }
    : site.email && firstContact.href !== `mailto:${site.email}`
      ? { href: `mailto:${site.email}`, label: "Email our team" }
      : { href: "/login", label: "List with us" };

  return (
    <main>
      <section id="properties" className="relative scroll-mt-24 overflow-hidden px-4 py-20 sm:px-6 lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-36 top-8 size-96 rounded-full bg-sky/70 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <Reveal>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Explore listings
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Featured properties
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Explore published homes and apartments from property owners in {site.city}.
              </p>
            </Reveal>
            <Reveal delay={80}>
              <Button asChild variant="outline" className="rounded-xl">
                <Link href="/properties">
                  View all properties <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            </Reveal>
          </div>
          {properties.length === 0 ? (
            <Reveal className="rounded-2xl border border-dashed bg-sky/50 px-6 py-16 text-center shadow-sm">
              <Building2 className="mx-auto size-11 text-primary/70" />
              <h3 className="mt-4 text-xl font-bold">New homes are on the way</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-on-sky">
                There are no published properties to show right now. Please check back soon.
              </p>
            </Reveal>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property, index) => (
                <Reveal key={property.id} delay={index * 80}>
                  <Link
                    href={`/properties/${property.slug}`}
                    className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
                  >
                    <Card className="h-full overflow-hidden rounded-2xl border-border/80 shadow-[0_8px_24px_rgb(31_95_191_/_7%)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/25 group-hover:shadow-[0_18px_42px_rgb(31_95_191_/_16%)]">
                      <div className="relative aspect-[16/10] overflow-hidden bg-sky">
                        {property.coverImage ? (
                          <Image
                            src={property.coverImage}
                            alt={`${property.name} exterior`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center">
                            <Building2 className="size-12 text-primary/30" />
                          </div>
                        )}
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0B2545]/70 to-transparent"
                        />
                        {property.isNew && (
                          <Badge className="marketing-badge absolute left-4 top-4 border-0 font-bold">
                            New
                          </Badge>
                        )}
                        <Badge className="absolute right-4 top-4 border-0 bg-white/95 text-navy shadow-sm">
                          {property.vacantUnits} vacant
                        </Badge>
                        <span className="absolute bottom-4 left-4 rounded-lg bg-white px-3 py-1.5 text-sm font-bold text-primary shadow-md">
                          {property.rentFrom === null
                            ? "Inquire"
                            : `From ${formatMoney(property.rentFrom, property.currency)}`}
                        </span>
                        <span className="absolute bottom-4 right-4 flex translate-x-2 items-center gap-1 text-xs font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                          View details <ArrowRight className="size-4" />
                        </span>
                      </div>
                      <CardContent className="p-5">
                        <h3 className="line-clamp-1 text-lg font-bold transition-colors group-hover:text-primary">
                          {property.name}
                        </h3>
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="size-3.5 shrink-0" />
                          {property.city}
                          {property.state ? `, ${property.state}` : ""}
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">
                          {property.totalUnits} {property.totalUnits === 1 ? "unit" : "units"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-primary px-4 py-12 text-white sm:px-6 lg:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3 sm:items-center">
          <Reveal className="text-center sm:text-left">
            <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              <CountUp value={publishedCount} />
            </p>
            <p className="mt-2 text-sm font-medium text-white/90">Published properties</p>
          </Reveal>
          <Reveal delay={80} className="text-center">
            <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              <CountUp value={vacantUnits} />
            </p>
            <p className="mt-2 text-sm font-medium text-white/90">Vacant units available</p>
          </Reveal>
          <Reveal delay={160} className="text-center sm:text-right">
            <p className="text-4xl font-bold tracking-tight text-white sm:text-5xl">{site.city}</p>
            <p className="mt-2 text-sm font-medium text-white/90">Our home base</p>
          </Reveal>
        </div>
      </section>

      <section id="about" className="relative scroll-mt-24 overflow-hidden bg-sky/55 px-4 py-20 sm:px-6 lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-36 bottom-0 size-96 rounded-full bg-white/80 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <Reveal variant="left" className="relative mx-2 mb-5 sm:mx-4 sm:mb-8">
            <div
              aria-hidden="true"
              className="absolute -bottom-5 -left-5 size-full rounded-3xl bg-primary/15"
            />
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-xl">
              <Parallax speed={0.08} className="absolute inset-x-0 -top-[8%] h-[116%]">
                <Image
                  src={aboutImage}
                  alt="Bright modern living room with a sofa and large windows"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </Parallax>
            </div>
            <div className="absolute -bottom-5 right-4 rounded-xl border border-border bg-white px-4 py-3 shadow-lg sm:-right-5 sm:px-5">
              <p className="text-sm font-bold text-navy">Remote monitoring</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Local care, wherever you are</p>
            </div>
          </Reveal>
          <Reveal variant="right">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              About {site.name}
            </p>
            <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
              Better property experiences, built around people.
            </h2>
            <p className="mt-5 leading-relaxed text-muted-on-sky">
              {site.tagline} We bring property owners, tenants, and caretakers together with clear
              tools for everyday rental management.
            </p>
            <Button asChild variant="outline" className="mt-6 rounded-xl border-primary/25 bg-white">
              <Link href="/properties">
                Explore homes <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </Reveal>
        </div>
      </section>

      <section id="services" className="relative scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-1/4 size-72 rounded-full bg-sky/70 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Our services"
            title="Everything you need to manage with confidence"
            description="Practical tools for the people who make every rental property work."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {serviceCards.map(({ title, description, icon: Icon, comingSoon }, index) => (
              <Reveal key={title} delay={index * 60}>
                <Card className="group h-full rounded-2xl border-border/80 p-6 shadow-[0_8px_24px_rgb(31_95_191_/_6%)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_rgb(31_95_191_/_14%)]">
                  <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-sky text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white">
                    <Icon className="size-6" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{title}</h3>
                    {comingSoon && (
                      <Badge variant="secondary" className="text-[10px] font-semibold">
                        Coming soon
                      </Badge>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-sky/55 px-4 py-20 sm:px-6 lg:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-0 size-80 rounded-full bg-white/80 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl">
          <SectionTitle
            eyebrow="Simple workflows"
            title="How it works"
            description="Clear steps to find a home or take care of your property portfolio."
            descriptionOnSky
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {[
              { title: "For tenants", icon: KeyRound, steps: tenantSteps },
              { title: "For property owners", icon: Home, steps: ownerSteps },
            ].map(({ title, icon: Icon, steps }, cardIndex) => (
              <Reveal key={title} delay={cardIndex * 100}>
                <Card className="h-full rounded-2xl border-border/80 p-6 shadow-[0_8px_24px_rgb(31_95_191_/_7%)] sm:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-sky text-primary">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="text-xl font-bold">{title}</h3>
                  </div>
                  <ol className="steps-list relative space-y-5 before:absolute before:bottom-4 before:left-[13px] before:top-4 before:w-px before:bg-primary/25">
                    {steps.map((step, index) => (
                      <li key={step} className="relative flex items-start gap-4">
                        <span className="z-10 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white ring-4 ring-white">
                          {index + 1}
                        </span>
                        <span className="pt-1 text-sm leading-relaxed text-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {site.testimonials.length > 0 && (
        <section id="testimonials" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <SectionTitle
              eyebrow="Testimonials"
              title="Trusted by our community"
              description="Hear from people who use the platform."
            />
            <div className="grid gap-5 md:grid-cols-3">
              {site.testimonials.map((testimonial, index) => (
                <Reveal key={`${testimonial.name}-${testimonial.role}`} delay={index * 80}>
                  <Card className="h-full rounded-2xl border-border/80 p-6 shadow-sm">
                    <div className="mb-4 flex gap-1 text-primary" aria-label="5 out of 5 stars">
                      {Array.from({ length: 5 }, (_, starIndex) => (
                        <Star key={starIndex} className="size-4 fill-current" />
                      ))}
                    </div>
                    <p className="leading-relaxed text-foreground">
                      &ldquo;{testimonial.quote}&rdquo;
                    </p>
                    <p className="mt-5 font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative isolate overflow-hidden px-4 py-20 sm:px-6 lg:py-28">
        <Parallax speed={0.08} className="absolute inset-x-0 -top-[8%] -z-20 h-[116%]">
          <Image
            src={ctaImage}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />
        </Parallax>
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-primary/85" />
        <Reveal className="mx-auto max-w-3xl text-center text-white">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-sky-100">
            Your next step
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to make your next move?
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/90">
            Discover a home that fits your life or bring your property into one organized place.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-xl bg-white text-primary hover:bg-sky">
              <a href={firstContact.href}>{firstContact.label}</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-xl border-white/75 bg-transparent text-white hover:bg-white hover:text-primary"
            >
              <a
                href={secondContact.href}
                target={secondContact.href.startsWith("https://") ? "_blank" : undefined}
                rel={secondContact.href.startsWith("https://") ? "noopener noreferrer" : undefined}
              >
                {secondContact.label}
              </a>
            </Button>
          </div>
        </Reveal>
      </section>

      <section id="contact" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Contact"
            title="We’re here to help"
            description="Reach out to our team for help with properties, accounts, or getting started."
          />
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {site.phone && (
              <Reveal>
                <ContactLink href={`tel:${site.phone}`} icon={Phone} title="Phone">
                  {site.phone}
                </ContactLink>
              </Reveal>
            )}
            {site.email && (
              <Reveal delay={80}>
                <ContactLink href={`mailto:${site.email}`} icon={MessageCircle} title="Email">
                  {site.email}
                </ContactLink>
              </Reveal>
            )}
            {site.whatsapp && (
              <Reveal delay={160}>
                <ContactLink
                  href={`https://wa.me/${site.whatsapp}`}
                  icon={MessageCircle}
                  title="WhatsApp"
                >
                  Message our team
                </ContactLink>
              </Reveal>
            )}
            {site.address && (
              <Reveal delay={240}>
                <Card className="h-full rounded-2xl border-border bg-white p-5 shadow-sm">
                  <span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-sky text-primary">
                    <MapPin className="size-5" />
                  </span>
                  <h3 className="font-bold">Address</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {site.address}
                  </p>
                </Card>
              </Reveal>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-navy px-4 py-12 text-white sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-white">
              <Home className="size-5" /> {site.name}
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">{site.tagline}</p>
          </div>
          <div>
            <h3 className="font-bold text-white">Quick links</h3>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/85">
              <a href="#properties" className="hover:text-white">Properties</a>
              <a href="#about" className="hover:text-white">About us</a>
              <a href="#services" className="hover:text-white">Services</a>
              <a href="#contact" className="hover:text-white">Contact</a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white">Your account</h3>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/85">
              <Link href="/login" className="hover:text-white">Sign in</Link>
              <Link href="/properties" className="hover:text-white">Browse properties</Link>
              <Link href="/accept-invite" className="hover:text-white">Accept invitation</Link>
            </div>
          </div>
          {(site.phone || site.email || site.whatsapp || site.address) && (
            <div>
              <h3 className="font-bold text-white">Get in touch</h3>
              <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/85">
                {site.phone && (
                  <a href={`tel:${site.phone}`} className="flex items-center gap-2 hover:text-white">
                    <Phone className="size-4" /> {site.phone}
                  </a>
                )}
                {site.email && (
                  <a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:text-white">
                    <MessageCircle className="size-4" /> {site.email}
                  </a>
                )}
                {site.whatsapp && (
                  <a
                    href={`https://wa.me/${site.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white"
                  >
                    <MessageCircle className="size-4" /> WhatsApp
                  </a>
                )}
                {site.address && <p className="text-white/85">{site.address}</p>}
              </div>
            </div>
          )}
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/25 pt-5 text-xs text-white/80 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
          <span>Marketing images are illustrative.</span>
        </div>
      </footer>
    </main>
  );
}
