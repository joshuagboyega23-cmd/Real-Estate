"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createInvitation,
  revokeInvitation,
} from "@/app/(dashboard)/actions/invitations";
import {
  createInvitationSchema,
  type CreateInvitationInput,
} from "@/lib/validations/invitation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Check, MailPlus, Trash2 } from "lucide-react";
import type { Role, InvitationStatus } from "@/generated/prisma/client";

export interface SerializedInvitation {
  id: string;
  email: string;
  role: Role;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  propertyName?: string | null;
  unitName?: string | null;
}

export interface PropertyOption {
  id: string;
  name: string;
  units: { id: string; name: string }[];
}

interface InvitationsViewProps {
  currentUserRole: Role;
  invitations: SerializedInvitation[];
  properties: PropertyOption[];
}

export function InvitationsView({
  currentUserRole,
  invitations,
  properties,
}: InvitationsViewProps) {
  const [createdLink, setCreatedLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = React.useTransition();
  const [isRevoking, startRevokeTransition] = React.useTransition();

  const allowedRoles: { label: string; value: "ADMIN" | "CARETAKER" | "TENANT" }[] =
    currentUserRole === "OWNER"
      ? [
          { label: "Administrator", value: "ADMIN" },
          { label: "Caretaker", value: "CARETAKER" },
          { label: "Tenant", value: "TENANT" },
        ]
      : [
          { label: "Caretaker", value: "CARETAKER" },
          { label: "Tenant", value: "TENANT" },
        ];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateInvitationInput>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: {
      email: "",
      role: allowedRoles[0].value,
      propertyId: "",
      unitId: "",
    },
  });

  const selectedRole = watch("role");
  const selectedPropertyId = watch("propertyId");

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const availableUnits = selectedProperty?.units || [];

  const onSubmit = (values: CreateInvitationInput) => {
    setFormError(null);
    startSubmitTransition(async () => {
      const res = await createInvitation(values);
      if (!res.success) {
        setFormError(res.error || "Failed to create invitation");
      } else if (res.inviteLink) {
        setCreatedLink(res.inviteLink);
        reset({
          email: "",
          role: allowedRoles[0].value,
          propertyId: "",
          unitId: "",
        });
      }
    });
  };

  const handleRevoke = (id: string) => {
    startRevokeTransition(async () => {
      const res = await revokeInvitation(id);
      if (!res.success) {
        alert(res.error || "Failed to revoke invitation");
      }
    });
  };

  const handleCopyLink = async () => {
    if (!createdLink) return;
    try {
      await navigator.clipboard.writeText(createdLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const getStatusBadge = (status: InvitationStatus, expiresAt: string) => {
    const isExpired = new Date(expiresAt) < new Date();

    if (status === "ACCEPTED") {
      return <Badge className="bg-emerald-600 hover:bg-emerald-700">ACCEPTED</Badge>;
    }
    if (status === "REVOKED") {
      return <Badge variant="destructive">REVOKED</Badge>;
    }
    if (status === "EXPIRED" || isExpired) {
      return <Badge variant="secondary">EXPIRED</Badge>;
    }
    return <Badge variant="outline" className="text-amber-600 border-amber-600">PENDING</Badge>;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Invitations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Invite administrators, caretakers, and tenants to your platform.
        </p>
      </div>

      {/* Invitation Form Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MailPlus className="size-5 text-primary" />
            Send New Invitation
          </CardTitle>
          <CardDescription>
            Generate a secure 7-day invitation link. The recipient will use this link to set up their account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {formError && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive">
                {formError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="collaborator@example.com"
                  disabled={isSubmitting}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(val) => setValue("role", val as "ADMIN" | "CARETAKER" | "TENANT")}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedRoles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-xs text-destructive">{errors.role.message}</p>
                )}
              </div>

              {properties.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="propertyId">Property (Optional)</Label>
                  <Select
                    value={selectedPropertyId || "none"}
                    onValueChange={(val) => {
                      setValue("propertyId", val === "none" ? "" : val);
                      setValue("unitId", "");
                    }}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="propertyId">
                      <SelectValue placeholder="None / All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None / Not linked</SelectItem>
                      {properties.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {availableUnits.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="unitId">Unit (Optional)</Label>
                  <Select
                    value={watch("unitId") || "none"}
                    onValueChange={(val) => setValue("unitId", val === "none" ? "" : val)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="unitId">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {availableUnits.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Generating Invitation..." : "Create Invitation Link"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Invitations List Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Invitations</CardTitle>
          <CardDescription>
            Overview of all pending, accepted, and revoked invitations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No invitations sent yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Assigned Property / Unit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => {
                    const isPending =
                      inv.status === "PENDING" && new Date(inv.expiresAt) > new Date();

                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{inv.role}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {inv.propertyName ? (
                            <span>
                              {inv.propertyName}
                              {inv.unitName ? ` - Unit ${inv.unitName}` : ""}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(inv.status, inv.expiresAt)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(inv.expiresAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          {isPending && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              disabled={isRevoking}
                              onClick={() => handleRevoke(inv.id)}
                            >
                              <Trash2 className="size-4 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Link Dialog */}
      <Dialog open={!!createdLink} onOpenChange={(open) => !open && setCreatedLink(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitation Link Created</DialogTitle>
            <DialogDescription>
              Copy this link and send it to the invitee. This link will expire in 7 days and is only shown once.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input id="link" readOnly value={createdLink || ""} className="font-mono text-xs" />
            </div>
            <Button size="sm" className="px-3" onClick={handleCopyLink}>
              {copied ? (
                <>
                  <Check className="size-4 mr-1 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreatedLink(null)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

