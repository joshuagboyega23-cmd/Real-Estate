import Link from "next/link";
import { isRegistrationOpen } from "./actions";
import { RegisterForm } from "./register-form";
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


export default async function RegisterPage() {
  const open = await isRegistrationOpen();

  return (
    <div className="flex w-full items-center justify-center p-4">
      {open ? (
        <RegisterForm />
      ) : (
        <Card className="w-full max-w-md shadow-md text-center">
          <CardHeader>
            <CardTitle className="text-xl">Registration is by invitation only</CardTitle>
            <CardDescription>
              New accounts can only be created via an invitation link from a property owner or manager.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            If you received an invitation email, please check the link provided in your email to join the platform.
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/login">Return to Sign In</Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
