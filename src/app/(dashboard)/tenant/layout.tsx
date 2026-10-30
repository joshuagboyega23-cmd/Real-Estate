import { requireRole } from "@/lib/permissions";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Wrench,
  FolderOpen,
} from "lucide-react";

export const instant = false;

const tenantNavItems: NavItem[] = [
  { title: "Overview", href: "/tenant", icon: LayoutDashboard },
  { title: "My Lease", href: "/tenant/lease", icon: FileText, disabled: true, badge: "Soon" },
  { title: "Payments", href: "/tenant/payments", icon: CreditCard, disabled: true, badge: "Soon" },
  { title: "Maintenance", href: "/tenant/maintenance", icon: Wrench, disabled: true, badge: "Soon" },
  { title: "Documents", href: "/tenant/documents", icon: FolderOpen, disabled: true, badge: "Soon" },
];

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["TENANT"]);

  return (
    <DashboardShell user={user} navItems={tenantNavItems}>
      {children}
    </DashboardShell>
  );
}

