import Link from "next/link";
import { Button } from "@/components/ui/button";
import { isRegistrationOpen } from "@/app/(public)/register/actions";

export const instant = false;


export default async function Home() {
  const registrationOpen = await isRegistrationOpen();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground">
      <main className="flex flex-col items-center max-w-xl text-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Real Estate Management
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Manage properties, units, leases, maintenance, and payments seamlessly across owners, caretakers, and tenants.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/login">Sign In</Link>
          </Button>

          {registrationOpen ? (
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/register">Register Owner Account</Link>
            </Button>
          ) : (
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/register">Registration Info</Link>
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
