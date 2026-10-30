import { requireRole } from "@/lib/permissions";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";

export const instant = false;

const tenantNavItems: NavItem[] = [
  { title: "Overview", href: "/tenant", icon: "overview" },
  { title: "My Lease", href: "/tenant/lease", icon: "leases", disabled: true, badge: "Soon" },
  { title: "Payments", href: "/tenant/payments", icon: "payments", disabled: true, badge: "Soon" },
  { title: "Maintenance", href: "/tenant/maintenance", icon: "maintenance", disabled: true, badge: "Soon" },
  { title: "Documents", href: "/tenant/documents", icon: "documents", disabled: true, badge: "Soon" },
];

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["TENANT"]);

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
      navItems={tenantNavItems}
    >
      {children}
    </DashboardShell>
  );
}
