import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  CalendarClock,
  CreditCard,
  DoorOpen,
  Home,
  Users,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CountUp, Reveal } from "@/components/landing/motion";

const iconMap = {
  building: Building2,
  door: DoorOpen,
  home: Home,
  credit: CreditCard,
  maintenance: Wrench,
  users: Users,
  lease: CalendarClock,
} satisfies Record<string, LucideIcon>;

export type StatCardIcon = keyof typeof iconMap;
export type StatCardTone = "blue" | "green" | "amber" | "navy";

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: StatCardIcon;
  tone?: StatCardTone;
  href?: string;
  comingSoon?: boolean;
  delay?: number;
}

const iconTone: Record<StatCardTone, string> = {
  blue: "bg-sky text-primary",
  green: "bg-success/10 text-success",
  amber: "bg-warning/10 text-warning",
  navy: "bg-navy/5 text-navy",
};

export function StatCard({
  title,
  value,
  description,
  icon,
  tone = "blue",
  href,
  comingSoon = false,
  delay = 0,
}: StatCardProps) {
  const Icon = iconMap[icon];
  const numeric = typeof value === "number" && Number.isFinite(value) && !comingSoon;
  const content = (
    <Card
      className={`stat-card h-full rounded-2xl border-border/80 bg-white shadow-[0_8px_24px_rgb(31_95_191_/_7%)] ${
        href
          ? "transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgb(31_95_191_/_13%)]"
          : ""
      }`}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-2">
        <CardTitle className="pt-1 text-sm font-semibold text-muted-foreground">{title}</CardTitle>
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconTone[tone]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-9 items-center gap-2">
          {numeric ? (
            <CountUp value={value} duration={300} className="text-2xl font-bold tracking-tight text-navy" />
          ) : (
            <span className="text-2xl font-bold tracking-tight text-muted-foreground">--</span>
          )}
          {!numeric && (
            <Badge variant="secondary" className="rounded-full bg-sky px-2 text-[10px] font-semibold text-primary">
              Soon
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  return (
    <Reveal delay={Math.min(Math.max(delay, 0), 250)} className="h-full dashboard-reveal">
      {href ? (
        <Link
          href={href}
          className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {content}
        </Link>
      ) : content}
    </Reveal>
  );
}
