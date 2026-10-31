"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Building2, DoorOpen, Home, Plus, Eye, EyeOff } from "lucide-react";

export interface PropertyCard {
  id: string;
  name: string;
  city: string;
  state?: string | null;
  country: string;
  currency: string;
  isPublished: boolean;
  coverImage?: string | null;
  totalUnits: number;
  vacantUnits: number;
}

interface PropertiesGridProps {
  properties: PropertyCard[];
  basePath: string; // "/owner/properties" or "/admin/properties"
  canAdd: boolean;
}

export function PropertiesGrid({ properties, basePath, canAdd }: PropertiesGridProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {properties.length === 0
              ? "No properties yet. Add your first one."
              : `${properties.length} propert${properties.length === 1 ? "y" : "ies"} managed`}
          </p>
        </div>
        {canAdd && (
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus className="mr-2 size-4" />
              Add Property
            </Link>
          </Button>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4 rounded-xl border border-dashed bg-muted/20">
          <Building2 className="size-12 text-muted-foreground" />
          <div>
            <p className="font-semibold">No properties yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first property to get started.</p>
          </div>
          {canAdd && (
            <Button asChild>
              <Link href={`${basePath}/new`}>
                <Plus className="mr-2 size-4" />
                Add Property
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <Link key={p.id} href={`${basePath}/${p.id}`} className="group">
              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow duration-200">
                {/* Cover Image */}
                <div className="relative h-44 bg-muted overflow-hidden">
                  {p.coverImage ? (
                    <Image
                      src={p.coverImage}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Building2 className="size-12 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Badge variant={p.isPublished ? "default" : "secondary"} className="text-xs gap-1">
                      {p.isPublished ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                      {p.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 pb-2">
                  <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {p.city}{p.state ? `, ${p.state}` : ""} · {p.country}
                  </p>
                </CardContent>

                <CardFooter className="px-4 pb-4 flex gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DoorOpen className="size-3.5 shrink-0" />
                    {p.totalUnits} unit{p.totalUnits !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Home className="size-3.5 shrink-0" />
                    {p.vacantUnits} vacant
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

