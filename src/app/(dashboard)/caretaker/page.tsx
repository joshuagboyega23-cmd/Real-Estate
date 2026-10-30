import { auth } from "@/auth";
import { LogoutButton } from "@/components/logout-button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export const instant = false;

export default async function CaretakerDashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || "Caretaker";

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Welcome, {userName}</CardTitle>
          <CardDescription>Role: CARETAKER</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            This is your caretaker portal. Assigned properties and open maintenance tasks will appear here.
          </p>
          <div>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
