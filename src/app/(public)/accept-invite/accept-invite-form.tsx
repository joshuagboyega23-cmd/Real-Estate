"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { acceptInviteAction, acceptInviteExistingAction } from "./actions";
import {
  acceptInviteSchema,
  type AcceptInviteInput,
} from "@/lib/validations/invitation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@/generated/prisma/client";

interface AcceptInviteFormProps {
  token: string;
  email: string;
  role: Role;
  propertyName?: string | null;
  hasAccount: boolean;
  isAlreadyLoggedIn: boolean;
}

export function AcceptInviteForm({
  token,
  email,
  role,
  propertyName,
  hasAccount,
  isAlreadyLoggedIn,
}: AcceptInviteFormProps) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [existingPassword, setExistingPassword] = React.useState("");

  // New user registration form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      token,
      name: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onNewUserSubmit = (values: AcceptInviteInput) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await acceptInviteAction(values);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to accept invitation");
      }
    });
  };

  const onExistingUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      const res = await acceptInviteExistingAction({
        token,
        password: isAlreadyLoggedIn ? undefined : existingPassword,
      });
      if (!res.success) {
        setErrorMessage(res.error || "Failed to accept invitation");
      }
    });
  };

  return (
    <Card className="w-full max-w-md shadow-lg border-muted">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Badge variant="outline" className="font-mono text-xs px-2.5 py-0.5">
            Role: {role}
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {hasAccount
            ? isAlreadyLoggedIn
              ? "Accept New Role"
              : "Confirm Your Existing Account"
            : "Complete Your Account"}
        </CardTitle>
        <CardDescription className="text-sm">
          {propertyName ? (
            <>
              You have been invited to manage <strong>{propertyName}</strong> as a{" "}
              <strong>{role.toLowerCase()}</strong>.
            </>
          ) : (
            <>
              You have been invited to join the platform as a{" "}
              <strong>{role.toLowerCase()}</strong>.
            </>
          )}
        </CardDescription>
      </CardHeader>

      {errorMessage && (
        <div className="mx-6 p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium border border-destructive/20">
          {errorMessage}
        </div>
      )}

      {hasAccount ? (
        <form onSubmit={onExistingUserSubmit}>
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground block text-xs">Invited email</span>
              <span className="font-semibold">{email}</span>
            </div>

            {isAlreadyLoggedIn ? (
              <p className="text-sm text-muted-foreground">
                You are currently signed in with this email. Click confirm below to add the{" "}
                <strong>{role}</strong> role to your profile.
              </p>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="existing-password">Existing Account Password</Label>
                <Input
                  id="existing-password"
                  type="password"
                  placeholder="Enter your current password"
                  value={existingPassword}
                  onChange={(e) => setExistingPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Confirm your password to link the {role} role to your account.
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter className="pt-2">
            <Button type="submit" className="w-full font-semibold" disabled={isPending}>
              {isPending
                ? "Accepting..."
                : isAlreadyLoggedIn
                ? `Confirm & Switch to ${role}`
                : `Confirm & Add ${role} Role`}
            </Button>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={handleSubmit(onNewUserSubmit)}>
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground block text-xs">Email address</span>
              <span className="font-semibold">{email}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Jane Doe"
                {...register("name")}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 characters"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                {...register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-destructive font-medium">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button type="submit" className="w-full font-semibold" disabled={isPending}>
              {isPending ? "Setting up account..." : "Complete Setup & Sign In"}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
