"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building2,
  MapPin,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { togglePublish, deleteProperty } from "@/app/(dashboard)/actions/properties";
import { UnitsTable, type SerializedUnit } from "@/components/dashboard/units-table";
import { PhotosManager } from "@/components/dashboard/photos-manager";

export interface SerializedPropertyDetails {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address: string;
  city: string;
  state?: string | null;
  country: string;
  currency: string;
  amenities: string[];
  images: string[];
  isPublished: boolean;
  latitude?: number | null;
  longitude?: number | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
  caretakers: { id: string; name?: string | null; email: string }[];
  units: SerializedUnit[];
}

interface PropertyDetailsViewProps {
  property: SerializedPropertyDetails;
  basePath: string; // "/owner/properties", "/admin/properties", or "/caretaker/properties"
  canManage: boolean; // false for caretaker
}

export function PropertyDetailsView({
  property,
  basePath,
  canManage,
}: PropertyDetailsViewProps) {
  const router = useRouter();
  const [isPublished, setIsPublished] = React.useState(property.isPublished);
  const [isTogglingPublish, startPublishTransition] = React.useTransition();
  const [isDeleting, startDeleteTransition] = React.useTransition();

  const handleTogglePublish = () => {
    startPublishTransition(async () => {
      try {
        const res = await togglePublish(property.id);
        if (res.success && res.isPublished !== undefined) {
          setIsPublished(res.isPublished);
        } else {
          alert(res.error || "Failed to toggle publish status.");
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error updating status.");
      }
    });
  };

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        const res = await deleteProperty(property.id);
        if (res && !res.success) {
          alert(res.error || "Failed to delete property.");
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          throw err;
        }
        alert(err instanceof Error ? err.message : "Error deleting property.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with back link and actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href={basePath}>
              <ArrowLeft className="size-4 mr-1" />
              All Properties
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">{property.name}</h1>
            <Badge variant={isPublished ? "default" : "secondary"} className="gap-1 text-xs">
              {isPublished ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
              {isPublished ? "Published" : "Draft"}
            </Badge>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePublish}
              disabled={isTogglingPublish}
            >
              {isPublished ? (
                <>
                  <EyeOff className="size-4 mr-1.5" />
                  Unpublish
                </>
              ) : (
                <>
                  <Eye className="size-4 mr-1.5" />
                  Publish
                </>
              )}
            </Button>

            <Button variant="outline" size="sm" asChild>
              <Link href={`${basePath}/${property.id}/edit`}>
                <Edit className="size-4 mr-1.5" />
                Edit
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  <Trash2 className="size-4 mr-1.5" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Property: {property.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove the property. A property can only be deleted if none
                    of its units have active or previous leases.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Confirm Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="units">Units ({property.units.length})</TabsTrigger>
          <TabsTrigger value="photos">Photos ({property.images.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Property Details</CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-sm mt-1">
                  <MapPin className="size-4 text-muted-foreground shrink-0" />
                  {property.address}, {property.city}
                  {property.state ? `, ${property.state}` : ""}, {property.country}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.description ? (
                  <div>
                    <h4 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-1.5">
                      About Property
                    </h4>
                    <p className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                      {property.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No description provided.</p>
                )}

                <div className="pt-2">
                  <h4 className="text-xs uppercase text-muted-foreground font-semibold tracking-wider mb-2">
                    Amenities & Features
                  </h4>
                  {property.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {property.amenities.map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="px-2.5 py-1 text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No amenities specified.</p>
                  )}
                </div>

                {isPublished && (
                  <div className="pt-4 border-t">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/properties/${property.slug}`} target="_blank">
                        <ExternalLink className="size-3.5 mr-1.5" />
                        View Public Listing
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Specifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Currency</span>
                    <span className="font-mono font-medium">{property.currency}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Total Units</span>
                    <span className="font-medium">{property.units.length}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Vacant Units</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {property.units.filter((u) => u.status === "VACANT").length}
                    </span>
                  </div>
                  {property.latitude && property.longitude && (
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Coordinates</span>
                      <span className="font-mono text-xs">
                        {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                      </span>
                    </div>
                  )}
                  {property.ownerName && (
                    <div className="flex justify-between py-1 border-b">
                      <span className="text-muted-foreground">Owner</span>
                      <span className="font-medium">{property.ownerName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    Assigned Caretakers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {property.caretakers.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">No caretakers assigned yet.</p>
                  ) : (
                    property.caretakers.map((c) => (
                      <div key={c.id} className="flex flex-col py-1 border-b last:border-0">
                        <span className="font-medium">{c.name || "Caretaker"}</span>
                        <span className="text-xs text-muted-foreground">{c.email}</span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Units Tab */}
        <TabsContent value="units">
          <UnitsTable
            propertyId={property.id}
            currency={property.currency}
            units={property.units}
            canManage={canManage}
          />
        </TabsContent>

        {/* Photos Tab */}
        <TabsContent value="photos">
          <PhotosManager
            propertyId={property.id}
            initialPhotos={property.images}
            maxPhotos={10}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

