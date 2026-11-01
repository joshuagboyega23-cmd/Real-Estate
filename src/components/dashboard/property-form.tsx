"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { propertySchema, type PropertyInput } from "@/lib/validations/property";
import { createProperty, updateProperty } from "@/app/(dashboard)/actions/properties";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";

export interface SerializedPropertyData {
  id?: string;
  name: string;
  description?: string | null;
  address: string;
  city: string;
  state?: string | null;
  country: string;
  currency: string;
  amenities: string[];
  latitude?: number | null;
  longitude?: number | null;
}

interface PropertyFormProps {
  initialData?: SerializedPropertyData;
  backHref: string;
}

const COMMON_AMENITIES = [
  "24/7 Security",
  "Backup Generator",
  "Borehole Water",
  "Swimming Pool",
  "Gym",
  "Fiber Internet",
  "CCTV",
  "Parking Space",
  "Gated Estate",
];

export function PropertyForm({ initialData, backHref }: PropertyFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [amenityInput, setAmenityInput] = React.useState("");

  const isEditing = !!initialData?.id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      country: initialData?.country || "Nigeria",
      currency: initialData?.currency || "NGN",
      amenities: initialData?.amenities || [],
      latitude: initialData?.latitude ?? null,
      longitude: initialData?.longitude ?? null,
    },
  });

  const amenities = watch("amenities") || [];

  const addAmenity = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !amenities.includes(trimmed)) {
      setValue("amenities", [...amenities, trimmed], { shouldValidate: true });
    }
    setAmenityInput("");
  };

  const removeAmenity = (index: number) => {
    setValue(
      "amenities",
      amenities.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addAmenity(amenityInput);
    }
  };

  const onSubmit = (data: PropertyInput) => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        if (isEditing && initialData?.id) {
          const res = await updateProperty(initialData.id, data);
          if (!res.success) {
            setErrorMessage(res.error || "Failed to update property.");
            return;
          }
          router.push(backHref);
        } else {
          const res = await createProperty(data);
          if (res && !res.success) {
            setErrorMessage(res.error || "Failed to create property.");
          }
        }
      } catch (err) {
        // createProperty calls redirect() on success
        if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
          throw err;
        }
        setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={isEditing ? "Edit Property" : "Add New Property"}
        description={
          isEditing
            ? "Update the details, address, and amenities for this property."
            : "Enter the details to register a new property in your portfolio."
        }
        breadcrumbs={[
          { label: "Properties", href: backHref },
          { label: isEditing ? "Edit property" : "New property" },
        ]}
        actions={
          <Button variant="outline" size="sm" className="rounded-xl" asChild>
          <Link href={backHref}>
            Cancel
          </Link>
          </Button>
        }
      />

      <Card className="overflow-visible rounded-2xl border-border/80 shadow-sm">
        {errorMessage && (
          <div className="mx-6 mt-6 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm font-medium text-danger">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-5">
            {/* Basic Info */}
            <h2 className="border-b border-border pb-2 text-sm font-bold uppercase tracking-wide text-navy">Property information</h2>
            <div className="space-y-1.5">
              <Label htmlFor="name">Property Name *</Label>
              <Input
                id="name"
                placeholder="e.g. Sapphire Heights"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                placeholder="Overview, architecture, features, neighborhood context..."
                {...register("description")}
              />
              {errors.description && (
                <p className="text-xs text-destructive font-medium">{errors.description.message}</p>
              )}
            </div>

            {/* Address & Location */}
            <h2 className="border-b border-border pb-2 pt-3 text-sm font-bold uppercase tracking-wide text-navy">Address &amp; location</h2>
            <div className="space-y-1.5">
              <Label htmlFor="address">Full Address *</Label>
              <Input
                id="address"
                placeholder="Street address, building number, district"
                {...register("address")}
                aria-invalid={!!errors.address}
              />
              {errors.address && (
                <p className="text-xs text-destructive font-medium">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="e.g. Lagos"
                  {...register("city")}
                  aria-invalid={!!errors.city}
                />
                {errors.city && (
                  <p className="text-xs text-destructive font-medium">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state">State / Province</Label>
                <Input id="state" placeholder="e.g. Lagos State" {...register("state")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="country">Country *</Label>
                <Input id="country" placeholder="Nigeria" {...register("country")} />
                {errors.country && (
                  <p className="text-xs text-destructive font-medium">{errors.country.message}</p>
                )}
              </div>
            </div>

            {/* Currency & Coordinates */}
            <h2 className="border-b border-border pb-2 pt-3 text-sm font-bold uppercase tracking-wide text-navy">Currency &amp; coordinates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency Code *</Label>
                <Input
                  id="currency"
                  placeholder="NGN"
                  maxLength={3}
                  className="uppercase font-mono"
                  {...register("currency")}
                />
                {errors.currency && (
                  <p className="text-xs text-destructive font-medium">{errors.currency.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="latitude">Latitude (optional)</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="6.5244"
                  {...register("latitude", {
                    setValueAs: (v) => (v === "" || isNaN(Number(v)) ? null : Number(v)),
                  })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="longitude">Longitude (optional)</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="3.3792"
                  {...register("longitude", {
                    setValueAs: (v) => (v === "" || isNaN(Number(v)) ? null : Number(v)),
                  })}
                />
              </div>
            </div>

            {/* Amenities Tag Input */}
            <div className="space-y-2 pt-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Amenities &amp; highlights</h2>
              <Label>Amenities & Highlights</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Type an amenity and press Enter..."
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addAmenity(amenityInput)}
                  disabled={!amenityInput.trim()}
                >
                  <Plus className="size-4 mr-1" />
                  Add
                </Button>
              </div>

              {/* Suggestions */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground self-center mr-1">Suggestions:</span>
                {COMMON_AMENITIES.filter((a) => !amenities.includes(a)).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => addAmenity(item)}
                    className="text-xs bg-muted/60 hover:bg-muted text-foreground/80 px-2 py-0.5 rounded-full transition-colors"
                  >
                    + {item}
                  </button>
                ))}
              </div>

              {/* Selected tags */}
              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {amenities.map((item, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-1 py-1 px-2.5 text-xs">
                      {item}
                      <button
                        type="button"
                        onClick={() => removeAmenity(idx)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                        <span className="sr-only">Remove {item}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="sticky bottom-0 z-10 flex justify-between border-t bg-white/95 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] backdrop-blur sm:static sm:pb-4">
            <Button variant="outline" type="button" asChild>
              <Link href={backHref}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? "Saving Changes..."
                  : "Creating Property..."
                : isEditing
                ? "Save Changes"
                : "Create Property"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
