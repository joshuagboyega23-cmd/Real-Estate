import crypto from "node:crypto";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AcceptInviteForm } from "./accept-invite-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage(props: AcceptInvitePageProps) {
  const { token } = await props.searchParams;

  if (!token) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-md text-center">
          <CardHeader>
            <CardTitle className="text-xl">Invalid Invitation Link</CardTitle>
            <CardDescription>
              No invitation token was provided with this link.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Please check the link provided in your email or contact the administrator who sent it.
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invitation = await prisma.invitation.findUnique({
    where: { token: hashedToken },
    include: {
      property: { select: { name: true } },
    },
  });

  if (!invitation) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-md text-center">
          <CardHeader>
            <CardTitle className="text-xl">Invitation Not Found</CardTitle>
            <CardDescription>
              This invitation link is invalid or has been deleted.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Please request a new invitation from your property manager.
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (invitation.status === "ACCEPTED") {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-md text-center">
          <CardHeader>
            <CardTitle className="text-xl">Invitation Already Used</CardTitle>
            <CardDescription>
              This invitation has already been accepted and processed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You can sign in directly using your email and password.
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/login">Sign In Now</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (invitation.status === "REVOKED") {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-md text-center">
          <CardHeader>
            <CardTitle className="text-xl">Invitation Revoked</CardTitle>
            <CardDescription>
              This invitation link has been revoked by the administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            If you believe this was an error, please contact the administrator to issue a new invite.
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isExpired =
    invitation.status === "EXPIRED" || new Date() > invitation.expiresAt;

  if (isExpired) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-md text-center">
          <CardHeader>
            <CardTitle className="text-xl">Invitation Expired</CardTitle>
            <CardDescription>
              This invitation was valid for 7 days and has now expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Please ask your property owner or manager to send you a fresh invitation link.
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const [session, existingUser] = await Promise.all([
    auth(),
    prisma.user.findUnique({
      where: { email: invitation.email },
      select: { id: true, roles: true },
    }),
  ]);

  if (existingUser && existingUser.roles.includes(invitation.role)) {
    return (
      <div className="flex w-full items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-md text-center">
          <CardHeader>
            <CardTitle className="text-xl">Role Already Active</CardTitle>
            <CardDescription>
              Your account already holds the {invitation.role} role.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            You can sign in and switch to this role directly from your account menu.
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const hasAccount = !!existingUser;
  const isAlreadyLoggedIn =
    session?.user?.email?.toLowerCase() === invitation.email.toLowerCase();

  return (
    <div className="flex w-full items-center justify-center p-4">
      <AcceptInviteForm
        token={token}
        email={invitation.email}
        role={invitation.role}
        propertyName={invitation.property?.name}
        hasAccount={hasAccount}
        isAlreadyLoggedIn={isAlreadyLoggedIn}
      />
    </div>
  );
}
