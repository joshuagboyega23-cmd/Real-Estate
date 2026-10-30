import { requireRole } from "@/lib/permissions";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";

export const instant = false;

const ownerNavItems: NavItem[] = [
  { title: "Overview", href: "/owner", icon: "overview" },
  { title: "Properties", href: "/owner/properties", icon: "properties" },
  { title: "Invitations", href: "/owner/invitations", icon: "invitations" },
  { title: "Leases", href: "/owner/leases", icon: "leases", disabled: true, badge: "Soon" },
  { title: "Payments", href: "/owner/payments", icon: "payments", disabled: true, badge: "Soon" },
  { title: "Maintenance", href: "/owner/maintenance", icon: "maintenance", disabled: true, badge: "Soon" },
  { title: "Documents", href: "/owner/documents", icon: "documents", disabled: true, badge: "Soon" },
];

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["OWNER"]);

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
      navItems={ownerNavItems}
    >
      {children}
    </DashboardShell>
  );
}
