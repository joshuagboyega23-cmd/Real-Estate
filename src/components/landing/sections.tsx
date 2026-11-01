import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  CreditCard,
  DoorOpen,
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
}

const serviceCards = [
  { title: "Property management", description: "Keep property details, units, and daily operations organized.", icon: Building2 },
  { title: "Tenant onboarding", description: "Invite tenants securely and give them a clear path to get started.", icon: UsersRound },
  { title: "Online rent payments", description: "Payment tools are being prepared for a simpler rent experience.", icon: CreditCard, comingSoon: true },
  { title: "Maintenance tracking", description: "Keep maintenance requests and follow-up work in one place.", icon: Wrench },
  { title: "Caretaker coordination", description: "Coordinate on-site property support with your trusted team.", icon: Headset },
  { title: "Remote owner dashboard", description: "See your portfolio and vacancy information from anywhere.", icon: ClipboardCheck },
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
    <div className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      <p className={`mt-4 leading-relaxed ${descriptionOnSky ? "text-muted-on-sky" : "text-muted-foreground"}`}>
        {description}
      </p>
    </div>
  );
}

export function LandingSections({
  properties,
  publishedCount,
  vacantUnits,
}: LandingSectionsProps) {
  return (
    <main>
      <section id="properties" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">Explore listings</p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Featured properties</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Explore published homes and apartments from property owners in {site.city}.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/properties">
                View all properties <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
          {properties.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-sky/50 px-6 py-16 text-center">
              <Building2 className="mx-auto size-11 text-primary/70" />
              <h3 className="mt-4 text-xl font-bold">New homes are on the way</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-on-sky">
                There are no published properties to show right now. Please check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.slug}`}
                  className="group block h-full"
                >
                  <Card className="h-full overflow-hidden rounded-2xl border-border/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                    <div className="relative aspect-[16/10] overflow-hidden bg-sky">
                      {property.coverImage ? (
                        <Image
                          src={property.coverImage}
                          alt={`${property.name} exterior`}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <Building2 className="size-12 text-primary/30" />
                        </div>
                      )}
                      {property.isNew && (
                        <Badge className="marketing-badge absolute left-4 top-4 border-0 font-bold">
                          New
                        </Badge>
                      )}
                      <Badge className="absolute right-4 top-4 border-0 bg-white/95 text-navy shadow-sm">
                        {property.vacantUnits} vacant
                      </Badge>
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
                      <div className="mt-5 flex items-end justify-between border-t border-border pt-4">
                        <div>
                          <span className="block text-xs text-muted-foreground">From</span>
                          <span className="font-bold text-primary">
                            {property.rentFrom === null
                              ? "Inquire"
                              : formatMoney(property.rentFrom, property.currency)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {property.totalUnits} {property.totalUnits === 1 ? "unit" : "units"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="about" className="scroll-mt-24 bg-sky/55 px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-lg">
            <Image
              src="/images/about.svg"
              alt="Bright modern living room with a sofa and large windows"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">About {site.name}</p>
            <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
              Better property experiences, built around people.
            </h2>
            <p className="mt-5 leading-relaxed text-muted-on-sky">
              {site.tagline} We bring property owners, tenants, and caretakers together with clear
              tools for everyday rental management.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <Building2 className="mb-3 size-5 text-primary" />
                <p className="text-3xl font-bold text-navy">{publishedCount}</p>
                <p className="mt-1 text-sm text-muted-foreground">Published properties</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <DoorOpen className="mb-3 size-5 text-primary" />
                <p className="text-3xl font-bold text-navy">{vacantUnits}</p>
                <p className="mt-1 text-sm text-muted-foreground">Vacant units</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Our services"
            title="Everything you need to manage with confidence"
            description="Practical tools for the people who make every rental property work."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {serviceCards.map(({ title, description, icon: Icon, comingSoon }) => (
              <Card key={title} className="rounded-2xl border-border/80 p-6 shadow-sm">
                <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-sky text-primary">
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
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-sky/55 px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-6xl">
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
            ].map(({ title, icon: Icon, steps }) => (
              <Card key={title} className="rounded-2xl border-border/80 p-6 shadow-sm sm:p-8">
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-sky text-primary">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="text-xl font-bold">{title}</h3>
                </div>
                <ol className="space-y-5">
                  {steps.map((step, index) => (
                    <li key={step} className="flex items-start gap-4">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="pt-1 text-sm leading-relaxed text-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </Card>
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
              {site.testimonials.map((testimonial) => (
                <Card key={`${testimonial.name}-${testimonial.role}`} className="rounded-2xl p-6 shadow-sm">
                  <div className="mb-4 flex gap-1 text-primary" aria-label="5 out of 5 stars">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="leading-relaxed text-foreground">&ldquo;{testimonial.quote}&rdquo;</p>
                  <p className="mt-5 font-bold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative isolate overflow-hidden px-4 py-20 text-center sm:px-6 lg:py-28">
        <Image
          src="/images/cta.svg"
          alt=""
          fill
          sizes="100vw"
          className="absolute inset-0 -z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-navy/85" />
        <div className="mx-auto max-w-3xl text-white">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to make your next move?
          </h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-white/85">
            Discover a home that fits your life or bring your property into one organized place.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/properties">Browse properties</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/70 bg-transparent text-white hover:bg-white hover:text-navy"
            >
              <Link href="/login">List with us</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            eyebrow="Contact"
            title="We’re here to help"
            description="Reach out to our team for help with properties, accounts, or getting started."
          />
          <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {site.phone && (
              <a href={`tel:${site.phone}`} className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <Phone className="mb-4 size-5 text-primary" />
                <h3 className="font-bold">Phone</h3>
                <p className="mt-1 break-words text-sm text-muted-foreground">{site.phone}</p>
              </a>
            )}
            {site.email && (
              <a href={`mailto:${site.email}`} className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <MessageCircle className="mb-4 size-5 text-primary" />
                <h3 className="font-bold">Email</h3>
                <p className="mt-1 break-words text-sm text-muted-foreground">{site.email}</p>
              </a>
            )}
            {site.whatsapp && (
              <a
                href={`https://wa.me/${site.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <MessageCircle className="mb-4 size-5 text-primary" />
                <h3 className="font-bold">WhatsApp</h3>
                <p className="mt-1 text-sm text-muted-foreground">Message our team</p>
              </a>
            )}
            {site.address && (
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <MapPin className="mb-4 size-5 text-primary" />
                <h3 className="font-bold">Address</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{site.address}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-navy px-4 py-12 text-white sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-white">
              <Home className="size-5" /> {site.name}
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/75">{site.tagline}</p>
          </div>
          <div>
            <h3 className="font-bold text-white">Quick links</h3>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/80">
              <a href="#properties" className="hover:text-white">Properties</a>
              <a href="#about" className="hover:text-white">About us</a>
              <a href="#services" className="hover:text-white">Services</a>
              <a href="#contact" className="hover:text-white">Contact</a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white">Your account</h3>
            <div className="mt-3 flex flex-col items-start gap-2 text-sm text-white/80">
              <Link href="/login" className="hover:text-white">Sign in</Link>
              <Link href="/properties" className="hover:text-white">Browse properties</Link>
              <Link href="/accept-invite" className="hover:text-white">Accept invitation</Link>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-10 flex max-w-7xl flex-col gap-3 border-t border-white/20 pt-5 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {site.name}. All rights reserved.</span>
          <span>Marketing images are illustrative.</span>
        </div>
      </footer>
    </main>
  );
}
