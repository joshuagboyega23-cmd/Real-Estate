import { requireRole } from "@/lib/permissions";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import {
  LayoutDashboard,
  Mail,
  Building2,
  DoorOpen,
  FileText,
  CreditCard,
  Wrench,
  FolderOpen,
} from "lucide-react";

export const instant = false;

const ownerNavItems: NavItem[] = [
  { title: "Overview", href: "/owner", icon: LayoutDashboard },
  { title: "Invitations", href: "/owner/invitations", icon: Mail },
  { title: "Properties", href: "/owner/properties", icon: Building2, disabled: true, badge: "Soon" },
  { title: "Units", href: "/owner/units", icon: DoorOpen, disabled: true, badge: "Soon" },
  { title: "Leases", href: "/owner/leases", icon: FileText, disabled: true, badge: "Soon" },
  { title: "Payments", href: "/owner/payments", icon: CreditCard, disabled: true, badge: "Soon" },
  { title: "Maintenance", href: "/owner/maintenance", icon: Wrench, disabled: true, badge: "Soon" },
  { title: "Documents", href: "/owner/documents", icon: FolderOpen, disabled: true, badge: "Soon" },
];

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(["OWNER"]);

  return (
    <DashboardShell user={user} navItems={ownerNavItems}>
      {children}
    </DashboardShell>
  );
}

