import { requireRole } from "@/lib/permissions";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import {
  LayoutDashboard,
  Building2,
  Wrench,
} from "lucide-react";

export const instant = false;

const caretakerNavItems: NavItem[] = [
  { title: "Overview", href: "/caretaker", icon: LayoutDashboard },
  { title: "Assigned Properties", href: "/caretaker/properties", icon: Building2, disabled: true, badge: "Soon" },
  { title: "Maintenance", href: "/caretaker/maintenance", icon: Wrench, disabled: true, badge: "Soon" },
];

export default async function CaretakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["CARETAKER"]);

  return (
    <DashboardShell user={user} navItems={caretakerNavItems}>
      {children}
    </DashboardShell>
  );
}

