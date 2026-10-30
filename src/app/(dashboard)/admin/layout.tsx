import { requireRole } from "@/lib/permissions";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";

export const instant = false;

const adminNavItems: NavItem[] = [
  { title: "Overview", href: "/admin", icon: "overview" },
  { title: "Properties", href: "/admin/properties", icon: "properties" },
  { title: "Invitations", href: "/admin/invitations", icon: "invitations" },
  { title: "Users", href: "/admin/users", icon: "users", disabled: true, badge: "Soon" },
  { title: "Activity Logs", href: "/admin/activity", icon: "activity", disabled: true, badge: "Soon" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["ADMIN"]);

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
      navItems={adminNavItems}
    >
      {children}
    </DashboardShell>
  );
}
