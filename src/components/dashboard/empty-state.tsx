"use client";

import type { ReactNode } from "react";
import {
  Building2,
  DoorOpen,
  Mail,
  Image as ImageIcon,
  Inbox,
} from "lucide-react";

const emptyIcons = {
  building: Building2,
  door: DoorOpen,
  mail: Mail,
  image: ImageIcon,
  inbox: Inbox,
} as const;

export type EmptyStateIcon = keyof typeof emptyIcons;

interface EmptyStateProps {
  icon: EmptyStateIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const Icon = emptyIcons[icon];
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-sky/35 px-5 py-12 text-center ${className}`}>
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-sky text-primary">
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <h2 className="text-base font-bold text-navy">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
