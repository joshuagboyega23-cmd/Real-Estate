import { requireRole } from "@/lib/permissions";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import {
  LayoutDashboard,
  Mail,
  Users,
  Building2,
  Activity,
} from "lucide-react";

export const instant = false;

const adminNavItems: NavItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Invitations", href: "/admin/invitations", icon: Mail },
  { title: "Users", href: "/admin/users", icon: Users, disabled: true, badge: "Soon" },
  { title: "Properties", href: "/admin/properties", icon: Building2, disabled: true, badge: "Soon" },
  { title: "Activity Logs", href: "/admin/activity", icon: Activity, disabled: true, badge: "Soon" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["ADMIN"]);

  return (
    <DashboardShell user={user} navItems={adminNavItems}>
      {children}
    </DashboardShell>
  );
}

