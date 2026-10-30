import { isRegistrationOpen } from "@/app/(public)/register/actions";
import { LoginForm } from "./login-form";

export const instant = false;


export default async function LoginPage() {
  const open = await isRegistrationOpen();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <LoginForm registrationOpen={open} />
    </div>
  );
}
