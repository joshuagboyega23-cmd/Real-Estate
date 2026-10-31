import { requireRole } from "@/lib/permissions";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";

export const dynamic = "force-dynamic";

const caretakerNavItems: NavItem[] = [
  { title: "Overview", href: "/caretaker", icon: "overview" },
  { title: "Assigned Properties", href: "/caretaker/properties", icon: "properties" },
  { title: "Maintenance", href: "/caretaker/maintenance", icon: "maintenance", disabled: true, badge: "Soon" },
];

export default async function CaretakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["CARETAKER"]);

  return (
    <DashboardShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.activeRole,
        roles: user.roles,
        timezone: user.timezone,
      }}
      navItems={caretakerNavItems}
    >
      {children}
    </DashboardShell>
  );
}
