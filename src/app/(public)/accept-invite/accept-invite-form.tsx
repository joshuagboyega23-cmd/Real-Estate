"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { acceptInviteAction } from "./actions";
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
}

export function AcceptInviteForm({
  token,
  email,
  role,
  propertyName,
}: AcceptInviteFormProps) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

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

  const onSubmit = (values: AcceptInviteInput) => {
    setErrorMessage(null);
    startTransition(async () => {
      const res = await acceptInviteAction(values);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to accept invitation");
      }
    });
  };

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Accept Invitation</CardTitle>
          <Badge variant="outline">{role}</Badge>
        </div>
        <CardDescription>
          You have been invited to join the platform as a {role.toLowerCase()}
          {propertyName ? ` for ${propertyName}` : ""}.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {errorMessage && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm font-medium text-destructive">
              {errorMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} disabled readOnly className="bg-muted" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your full name"
              disabled={isPending}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a strong password"
              disabled={isPending}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with at least one letter and one number.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              disabled={isPending}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating Account..." : "Join Platform"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

