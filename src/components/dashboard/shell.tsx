"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Menu,
  LogOut,
  Building,
  LayoutDashboard,
  Mail,
  Building2,
  DoorOpen,
  FileText,
  CreditCard,
  Wrench,
  FolderOpen,
  Users,
  Activity,
  BarChart,
  Settings,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Role } from "@/generated/prisma/client";
import { switchRole } from "@/app/(dashboard)/actions/roles";
import { site } from "@/config/site";

export type NavIconKey =
  | "overview"
  | "properties"
  | "units"
  | "leases"
  | "payments"
  | "maintenance"
  | "documents"
  | "invitations"
  | "users"
  | "activity"
  | "reports"
  | "settings";

const iconMap: Record<NavIconKey, React.ComponentType<{ className?: string }>> = {
  overview: LayoutDashboard,
  properties: Building2,
  units: DoorOpen,
  leases: FileText,
  payments: CreditCard,
  maintenance: Wrench,
  documents: FolderOpen,
  invitations: Mail,
  users: Users,
  activity: Activity,
  reports: BarChart,
  settings: Settings,
};

export interface NavItem {
  title: string;
  href: string;
  icon?: NavIconKey;
  disabled?: boolean;
  badge?: string;
}

export interface DashboardUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  role: Role;
  roles?: Role[];
  timezone?: string | null;
}

interface DashboardShellProps {
  user: DashboardUser;
  navItems: NavItem[];
  children: React.ReactNode;
}

export function DashboardShell({ user, navItems, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [isSwitchingRole, startTransition] = React.useTransition();
  const [headerScrolled, setHeaderScrolled] = React.useState(false);

  React.useEffect(() => {
    const updateHeader = () => setHeaderScrolled(window.scrollY > 4);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.role.slice(0, 2);

  const renderNavLinks = () => (
    <nav className="flex flex-col gap-1 px-3 py-5" aria-label="Dashboard navigation">
      {navItems.map((item) => {
        const Icon = item.icon ? iconMap[item.icon] : undefined;
        const isActive =
          pathname === item.href ||
          (item.href !== "/owner" &&
            item.href !== "/admin" &&
            item.href !== "/tenant" &&
            item.href !== "/caretaker" &&
            pathname.startsWith(`${item.href}/`));

        if (item.disabled) {
          return (
            <div
              key={item.href}
              className="flex cursor-not-allowed select-none items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-white/75"
            >
              <div className="flex items-center gap-3">
                {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <Badge className="border border-white/25 bg-white/10 px-1.5 py-0 text-[10px] uppercase text-white/90">
                  {item.badge}
                </Badge>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 before:opacity-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
              isActive
              ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full before:bg-sidebar-primary before:opacity-100 before:transition-opacity before:duration-150"
              : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
              <span>{item.title}</span>
            </div>
            {item.badge && (
              <Badge
                variant="outline"
                className={`px-1.5 py-0 text-[10px] ${isActive ? "border-primary/20 text-primary" : "border-white/25 text-white/75"}`}
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      {/* Top Header */}
      <header className={`sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white px-4 transition-shadow duration-200 md:px-6 ${headerScrolled ? "shadow-md" : "shadow-sm"}`}>
        {/* Mobile menu sheet trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Open dashboard navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground">
            <SheetHeader className="border-b border-sidebar-border p-4 text-left">
              <SheetTitle className="flex items-center gap-2 text-base font-bold text-white">
                <Building className="size-5 text-sidebar-primary" />
                {site.name}
              </SheetTitle>
            </SheetHeader>
            {renderNavLinks()}
          </SheetContent>
        </Sheet>

        {/* Brand remains in the mobile bar; desktop brand lives in the sidebar. */}
        <div className="flex items-center gap-2 font-bold md:hidden">
          <Building className="size-5 text-primary" aria-hidden="true" />
          <span className="font-semibold text-navy">{site.name}</span>
        </div>

        {/* Right side user info */}
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden sm:inline text-sm font-medium">
            {user.name || user.email}
          </span>
          <Badge className="border border-primary/15 bg-sky font-semibold text-primary">
            {user.role}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-9 rounded-full p-0 focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open user menu">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>

              {user.roles && user.roles.length > 1 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold px-2 py-1">
                    Switch Role
                  </DropdownMenuLabel>
                  {user.roles
                    .filter((r) => r !== user.role)
                    .map((r) => {
                      const roleLabel =
                        r === "OWNER"
                          ? "Owner view"
                          : r === "ADMIN"
                          ? "Admin view"
                          : r === "CARETAKER"
                          ? "Caretaker view"
                          : "Tenant view";
                      return (
                        <DropdownMenuItem
                          key={r}
                          disabled={isSwitchingRole}
                          className="cursor-pointer text-primary focus:bg-sky focus:text-primary"
                          onClick={() => {
                            startTransition(async () => {
                              await switchRole(r);
                            });
                          }}
                        >
                          <ArrowLeftRight className="mr-2 size-4 text-muted-foreground" />
                          <span>Switch to {roleLabel}</span>
                        </DropdownMenuItem>
                      );
                    })}
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="mr-2 size-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Layout body */}
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <Link href="/" className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/10">
                <Building className="size-5 text-sidebar-primary" aria-hidden="true" />
              </span>
              <span className="font-bold tracking-tight">{site.name}</span>
            </Link>
            {renderNavLinks()}
          </div>
        </aside>

        {/* Page Content */}
        <main
          key={pathname}
          className="dashboard-route-enter mx-auto w-full max-w-7xl flex-1 scroll-pt-20 p-4 pb-24 md:p-8 md:pb-8"
          style={{ scrollPaddingTop: "5rem" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
