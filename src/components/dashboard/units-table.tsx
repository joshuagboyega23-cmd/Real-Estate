"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { unitSchema, type UnitInput } from "@/lib/validations/property";
import { createUnit, updateUnit, deleteUnit } from "@/app/(dashboard)/actions/properties";
import { formatMoney, fromMinor } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, DoorOpen, X } from "lucide-react";
import type { UnitStatus, RentPeriod } from "@/generated/prisma/client";

export interface SerializedUnit {
  id: string;
  name: string;
  description?: string | null;
  bedrooms: number;
  bathrooms: number;
  rentAmount: number; // in minor units
  rentPeriod: RentPeriod;
  status: UnitStatus;
  features: string[];
  images: string[];
}

interface UnitsTableProps {
  propertyId: string;
  currency: string;
  units: SerializedUnit[];
  canManage: boolean;
}

const COMMON_FEATURES = [
  "Air Conditioning",
  "Fitted Kitchen",
  "Balcony",
  "Built-in Wardrobes",
  "Water Heater",
  "Ensuite Bathroom",
  "Prepaid Meter",
];

export function UnitsTable({ propertyId, currency, units, canManage }: UnitsTableProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingUnit, setEditingUnit] = React.useState<SerializedUnit | null>(null);
  const [deleteUnitId, setDeleteUnitId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [featureInput, setFeatureInput] = React.useState("");
  const [isPending, startTransition] = React.useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UnitInput>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: "",
      description: "",
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 0,
      rentPeriod: "MONTHLY",
      status: "VACANT",
      features: [],
    },
  });

  const features = watch("features") || [];
  const status = watch("status");
  const rentPeriod = watch("rentPeriod");

  const openAddDialog = () => {
    setEditingUnit(null);
    setErrorMessage(null);
    setFeatureInput("");
    reset({
      name: "",
      description: "",
      bedrooms: 1,
      bathrooms: 1,
      rentAmount: 0,
      rentPeriod: "MONTHLY",
      status: "VACANT",
      features: [],
    });
    setDialogOpen(true);
  };

  const openEditDialog = (u: SerializedUnit) => {
    setEditingUnit(u);
    setErrorMessage(null);
    setFeatureInput("");
    reset({
      name: u.name,
      description: u.description || "",
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      rentAmount: fromMinor(u.rentAmount),
      rentPeriod: u.rentPeriod,
      status: u.status,
      features: u.features,
    });
    setDialogOpen(true);
  };

  const addFeature = (item: string) => {
    const trimmed = item.trim();
    if (trimmed && !features.includes(trimmed)) {
      setValue("features", [...features, trimmed]);
    }
    setFeatureInput("");
  };

  const removeFeature = (idx: number) => {
    setValue("features", features.filter((_, i) => i !== idx));
  };

  const onSubmit = (data: UnitInput) => {
    setErrorMessage(null);
    startTransition(async () => {
      try {
        if (editingUnit) {
          const res = await updateUnit(editingUnit.id, data);
          if (!res.success) {
            setErrorMessage(res.error || "Failed to update unit.");
            return;
          }
        } else {
          const res = await createUnit(propertyId, data);
          if (!res.success) {
            setErrorMessage(res.error || "Failed to create unit.");
            return;
          }
        }
        setDialogOpen(false);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
      }
    });
  };

  const confirmDelete = () => {
    if (!deleteUnitId) return;
    startTransition(async () => {
      try {
        const res = await deleteUnit(deleteUnitId);
        if (!res.success) {
          alert(res.error || "Failed to delete unit.");
        }
        setDeleteUnitId(null);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Error deleting unit.");
        setDeleteUnitId(null);
      }
    });
  };

  const getStatusBadge = (unitStatus: UnitStatus) => {
    switch (unitStatus) {
      case "VACANT":
        return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Vacant</Badge>;
      case "OCCUPIED":
        return <Badge variant="default">Occupied</Badge>;
      case "MAINTENANCE":
        return <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">Maintenance</Badge>;
      default:
        return <Badge variant="outline">{unitStatus}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Units & Apartments</h3>
          <p className="text-sm text-muted-foreground">
            {units.length === 0
              ? "No units registered in this property."
              : `${units.length} total unit${units.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="size-4 mr-1.5" />
            Add Unit
          </Button>
        )}
      </div>

      {units.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3 rounded-lg border border-dashed bg-muted/20">
          <DoorOpen className="size-10 text-muted-foreground/60" />
          <div className="text-sm">
            <p className="font-medium">No units found</p>
            <p className="text-muted-foreground">Create individual units or apartments for leasing.</p>
          </div>
          {canManage && (
            <Button size="sm" variant="outline" onClick={openAddDialog}>
              <Plus className="size-4 mr-1" />
              Add First Unit
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit Name</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {units.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <div>
                      <span>{u.name}</span>
                      {u.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{u.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {u.bedrooms} Bed · {u.bathrooms} Bath
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {formatMoney(u.rentAmount, currency)}
                  </TableCell>
                  <TableCell className="text-xs uppercase text-muted-foreground">
                    {u.rentPeriod.toLowerCase()}
                  </TableCell>
                  <TableCell>{getStatusBadge(u.status)}</TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openEditDialog(u)}
                        >
                          <Edit className="size-4" />
                          <span className="sr-only">Edit {u.name}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteUnitId(u.id)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">Delete {u.name}</span>
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Unit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUnit ? `Edit Unit: ${editingUnit.name}` : "Add New Unit"}</DialogTitle>
            <DialogDescription>
              {editingUnit
                ? "Update pricing, specifications, and availability status."
                : "Enter unit information and rent pricing."}
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium border border-destructive/20">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="unit-name">Unit Name / Identifier *</Label>
              <Input
                id="unit-name"
                placeholder="e.g. Unit 3B, Penthouse 1"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit-description">Description</Label>
              <Textarea
                id="unit-description"
                rows={2}
                placeholder="Floor level, view, specific features..."
                {...register("description")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="unit-bedrooms">Bedrooms</Label>
                <Input
                  id="unit-bedrooms"
                  type="number"
                  min={0}
                  {...register("bedrooms", { valueAsNumber: true })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unit-bathrooms">Bathrooms</Label>
                <Input
                  id="unit-bathrooms"
                  type="number"
                  min={0}
                  {...register("bathrooms", { valueAsNumber: true })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="unit-rent">Rent ({currency}) *</Label>
                <Input
                  id="unit-rent"
                  type="number"
                  step="any"
                  placeholder="e.g. 250000"
                  {...register("rentAmount", { valueAsNumber: true })}
                  aria-invalid={!!errors.rentAmount}
                />
                {errors.rentAmount && (
                  <p className="text-xs text-destructive font-medium">{errors.rentAmount.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unit-period">Billing Period</Label>
                <Select
                  value={rentPeriod}
                  onValueChange={(val) => setValue("rentPeriod", val as RentPeriod)}
                >
                  <SelectTrigger id="unit-period">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="BIANNUAL">Biannual</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit-status">Current Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setValue("status", val as UnitStatus)}
              >
                <SelectTrigger id="unit-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VACANT">Vacant</SelectItem>
                  <SelectItem value="OCCUPIED">Occupied</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Features Tag Input */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs">Unit Features</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. Balcony"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addFeature(featureInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addFeature(featureInput)}
                  disabled={!featureInput.trim()}
                >
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {COMMON_FEATURES.filter((f) => !features.includes(f)).slice(0, 4).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => addFeature(f)}
                    className="text-[11px] bg-muted/60 hover:bg-muted text-foreground/80 px-2 py-0.5 rounded-full"
                  >
                    + {f}
                  </button>
                ))}
              </div>

              {features.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {features.map((f, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 text-xs">
                      {f}
                      <button
                        type="button"
                        onClick={() => removeFeature(i)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? editingUnit
                    ? "Saving..."
                    : "Adding..."
                  : editingUnit
                  ? "Update Unit"
                  : "Add Unit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Alert Dialog */}
      <AlertDialog open={!!deleteUnitId} onOpenChange={(open) => !open && setDeleteUnitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this unit?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You can only delete units that do not have active leases
              or maintenance tickets associated with them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Unit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

